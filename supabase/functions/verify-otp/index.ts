import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Shared OTP storage using Deno KV (matches send-otp function)
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

// Get OTP from storage
async function getOTP(key: string): Promise<{ code: string; expiresAt: number } | null> {
  const kvInstance = await getKV();
  if (kvInstance) {
    const keyParts = key.split("-");
    const result = await kvInstance.get([...keyParts, "otp"]);
    if (result.value) {
      return result.value as { code: string; expiresAt: number };
    }
    return null;
  } else {
    return otpStorageFallback.get(key) || null;
  }
}

// Delete OTP from storage
async function deleteOTP(key: string) {
  const kvInstance = await getKV();
  if (kvInstance) {
    const keyParts = key.split("-");
    await kvInstance.delete([...keyParts, "otp"]);
  } else {
    otpStorageFallback.delete(key);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id, phone, otp } = await req.json();

    // Validate input
    if (!id || !phone || !otp) {
      return new Response(
        JSON.stringify({ error: "כל השדות נדרשים" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanId = String(id).replace(/[^\d]/g, "").padStart(9, "0");
    const cleanPhone = String(phone).replace(/[^\d]/g, "");
    const cleanOTP = String(otp).replace(/[^\d]/g, "");

    if (cleanId.length !== 9) {
      return new Response(
        JSON.stringify({ error: "תעודת זהות לא תקינה" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cleanPhone.length < 9) {
      return new Response(
        JSON.stringify({ error: "מספר טלפון לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (cleanOTP.length !== 6) {
      return new Response(
        JSON.stringify({ error: "קוד אימות חייב להכיל 6 ספרות" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check OTP
    const storageKey = `${cleanId}-${cleanPhone}`;
    const storedOTP = await getOTP(storageKey);

    if (!storedOTP) {
      return new Response(
        JSON.stringify({ error: "קוד אימות לא נמצא או פג תוקף. אנא בקש קוד חדש" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (storedOTP.expiresAt < Date.now()) {
      await deleteOTP(storageKey);
      return new Response(
        JSON.stringify({ error: "קוד אימות פג תוקף. אנא בקש קוד חדש" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (storedOTP.code !== cleanOTP) {
      return new Response(
        JSON.stringify({ error: "קוד אימות לא תקין" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP is valid - remove it from storage (one-time use)
    await deleteOTP(storageKey);

    // TODO: Verify ID and phone match in your database/customer system
    // You might want to check against the policy-get-by-id API or your database

    return new Response(
      JSON.stringify({
        success: true,
        message: "אימות הצליח",
        id: cleanId,
        phone: cleanPhone,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return new Response(
      JSON.stringify({ error: "שגיאה באימות קוד האימות" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
