import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Twilio configuration
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER"); // Format: +972501234567 (with country code)

// Convert Israeli phone number to international format
function formatPhoneForTwilio(phone: string): string {
  // Remove all non-digits
  const cleanPhone = phone.replace(/[^\d]/g, "");
  
  // If starts with 0, replace with +972 (Israel country code)
  if (cleanPhone.startsWith("0")) {
    return `+972${cleanPhone.slice(1)}`;
  }
  
  // If starts with 972, add +
  if (cleanPhone.startsWith("972")) {
    return `+${cleanPhone}`;
  }
  
  // Otherwise assume it's already in international format
  return cleanPhone.startsWith("+") ? cleanPhone : `+972${cleanPhone}`;
}

// Send SMS via Twilio
async function sendSMSviaTwilio(to: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("Twilio credentials not configured");
    return false;
  }

  try {
    const formattedPhone = formatPhoneForTwilio(to);
    
    // Create basic auth header
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: formattedPhone,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twilio API error:", response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log("SMS sent successfully:", data.sid);
    return true;
  } catch (error) {
    console.error("Error sending SMS via Twilio:", error);
    return false;
  }
}

// Alternative: Send SMS via MessageBird (if you prefer)
async function sendSMSviaMessageBird(to: string, message: string): Promise<boolean> {
  const MESSAGEBIRD_API_KEY = Deno.env.get("MESSAGEBIRD_API_KEY");
  const MESSAGEBIRD_ORIGINATOR = Deno.env.get("MESSAGEBIRD_ORIGINATOR") || "TravelSure";
  
  if (!MESSAGEBIRD_API_KEY) {
    console.warn("MessageBird API key not configured");
    return false;
  }

  try {
    const formattedPhone = formatPhoneForTwilio(to); // Same format for MessageBird
    
    const response = await fetch("https://rest.messagebird.com/messages", {
      method: "POST",
      headers: {
        "Authorization": `AccessKey ${MESSAGEBIRD_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originator: MESSAGEBIRD_ORIGINATOR,
        recipients: [formattedPhone],
        body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MessageBird API error:", response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log("SMS sent successfully via MessageBird:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending SMS via MessageBird:", error);
    return false;
  }
}

// Shared OTP storage using Deno KV (persistent across function invocations)
// In production, consider using Redis or Supabase database for better scalability
let kv: Deno.Kv | null = null;

async function getKV() {
  if (!kv) {
    try {
      kv = await Deno.openKv();
    } catch (error) {
      console.warn("KV not available, using in-memory fallback:", error);
      return null;
    }
  }
  return kv;
}

// Fallback in-memory storage (only if KV is not available)
const otpStorageFallback = new Map<string, { code: string; expiresAt: number }>();

// Generate 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP (using KV if available, otherwise fallback)
async function storeOTP(key: string, code: string, expiresAt: number) {
  const kvInstance = await getKV();
  if (kvInstance) {
    const keyParts = key.split("-");
    const expireInMs = expiresAt - Date.now();
    if (expireInMs > 0) {
      await kvInstance.set([...keyParts, "otp"], { code, expiresAt }, { expireIn: expireInMs });
    }
  } else {
    otpStorageFallback.set(key, { code, expiresAt });
    // Clean expired entries
    const now = Date.now();
    for (const [k, v] of otpStorageFallback.entries()) {
      if (v.expiresAt < now) {
        otpStorageFallback.delete(k);
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id, phone } = await req.json();

    // Validate input
    if (!id || !phone) {
      return new Response(
        JSON.stringify({ error: "תעודת זהות ומספר טלפון נדרשים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanId = String(id).replace(/[^\d]/g, "").padStart(9, "0");
    const cleanPhone = String(phone).replace(/[^\d]/g, "");

    if (cleanId.length !== 9) {
      return new Response(
        JSON.stringify({ error: "תעודת זהות לא תקינה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cleanPhone.length < 9 || !cleanPhone.startsWith("0")) {
      return new Response(
        JSON.stringify({ error: "מספר טלפון לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store OTP with key: id-phone
    const storageKey = `${cleanId}-${cleanPhone}`;
    await storeOTP(storageKey, otpCode, expiresAt);

    // Prepare SMS message
    const smsMessage = `קוד האימות שלך: ${otpCode}\nתוקף ל-5 דקות. TravelSure`;

    // Try to send SMS via Twilio first, then MessageBird, then fallback to development mode
    let smsSent = false;
    const smsProvider = Deno.env.get("SMS_PROVIDER") || "twilio"; // "twilio" or "messagebird"

    if (smsProvider === "twilio") {
      smsSent = await sendSMSviaTwilio(cleanPhone, smsMessage);
      // If Twilio failed, try MessageBird as fallback
      if (!smsSent && Deno.env.get("MESSAGEBIRD_API_KEY")) {
        console.log("Twilio failed, trying MessageBird...");
        smsSent = await sendSMSviaMessageBird(cleanPhone, smsMessage);
      }
    } else if (smsProvider === "messagebird") {
      smsSent = await sendSMSviaMessageBird(cleanPhone, smsMessage);
      // If MessageBird failed, try Twilio as fallback
      if (!smsSent && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        console.log("MessageBird failed, trying Twilio...");
        smsSent = await sendSMSviaTwilio(cleanPhone, smsMessage);
      }
    }

    // Development/fallback mode: if SMS not configured or failed, log to console
    const isDevelopment = Deno.env.get("ENVIRONMENT") === "development" || !smsSent;

    if (!smsSent) {
      console.log(`[DEV MODE] OTP for ${cleanId} - ${cleanPhone}: ${otpCode}`);
      console.warn("SMS not sent - running in development mode or SMS service not configured");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: smsSent ? "קוד אימות נשלח בהודעת SMS" : "קוד אימות נשלח (מצב פיתוח)",
        smsSent,
        // Only return OTP in development mode or if SMS failed
        ...(isDevelopment && { otp: otpCode }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה בשליחת קוד אימות" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
