import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
}

// HTML escape function to prevent XSS in emails
const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Rate limiting check
const checkRateLimit = (clientIp: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
};

// Input validation
const validateInput = (data: ContactEmailRequest): { valid: boolean; error?: string } => {
  const { name, email, message } = data;
  
  if (!name || !email || !message) {
    return { valid: false, error: "Missing required fields" };
  }
  
  // Length limits
  if (name.length > 100) {
    return { valid: false, error: "Name too long" };
  }
  if (email.length > 255) {
    return { valid: false, error: "Email too long" };
  }
  if (message.length > 5000) {
    return { valid: false, error: "Message too long" };
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  
  return { valid: true };
};

const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TravelSure <no-reply@travelsure.co.il>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend API error:", error);
    throw new Error("Email service error");
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";

  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const data: ContactEmailRequest = await req.json();
    
    // Validate input
    const validation = validateInput(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { name, email, phone, message } = data;
    
    // Sanitize inputs for HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "");
    const safeMessage = escapeHtml(message);

    // Send notification email to business
    const businessEmailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a5a5a;">פנייה חדשה מהאתר</h1>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <p><strong>שם:</strong> ${safeName}</p>
          <p><strong>אימייל:</strong> ${safeEmail}</p>
          <p><strong>טלפון:</strong> ${safePhone || "לא צוין"}</p>
          <p><strong>הודעה:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 5px;">${safeMessage}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          הודעה זו נשלחה מטופס יצירת קשר באתר TravelSure
        </p>
      </div>
    `;

    await sendEmail(["ophir@ophirins.co.il"], `פנייה חדשה מ-${safeName}`, businessEmailHtml);

    // Send confirmation email to customer
    const customerEmailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a5a5a 0%, #2a7a7a 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">TravelSure</h1>
          <p style="color: #4ade80; margin: 10px 0 0 0;">ביטוח נסיעות לחו״ל</p>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #1a5a5a;">שלום ${safeName},</h2>
          <p>תודה שפנית אלינו!</p>
          <p>קיבלנו את הודעתך ונחזור אליך בהקדם האפשרי.</p>
          <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>ההודעה שלך:</strong></p>
            <p style="color: #666;">${safeMessage}</p>
          </div>
          <p>בינתיים, אתה מוזמן ליצור איתנו קשר:</p>
          <ul style="color: #666;">
            <li>טלפון: 073-2721111</li>
            <li>וואטסאפ: 052-3333603</li>
          </ul>
          <p>בברכה,<br>צוות TravelSure</p>
        </div>
        <div style="background-color: #1a5a5a; padding: 20px; text-align: center;">
          <p style="color: white; margin: 0; font-size: 12px;">
            © ${new Date().getFullYear()} TravelSure - אופיר ושות׳ סוכנות לביטוח
          </p>
        </div>
      </div>
    `;

    await sendEmail([email], "קיבלנו את פנייתך - TravelSure", customerEmailHtml);

    return new Response(
      JSON.stringify({ success: true, message: "Message sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    // Return generic error message to client
    return new Response(
      JSON.stringify({ error: "Unable to send message. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
