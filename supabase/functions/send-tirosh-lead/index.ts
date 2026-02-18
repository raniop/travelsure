import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

interface TiroshLeadRequest {
  fullName: string;
  phone: string;
  birthDate: string;
  idNumber: string;
  notes?: string;
}

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

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

const validateInput = (data: TiroshLeadRequest): { valid: boolean; error?: string } => {
  const { fullName, phone, birthDate, idNumber, notes } = data;

  if (!fullName || !phone || !birthDate || !idNumber) {
    return { valid: false, error: "Missing required fields" };
  }

  if (fullName.length > 100) return { valid: false, error: "Name too long" };
  if (phone.length > 20) return { valid: false, error: "Phone too long" };
  if (birthDate.length > 20) return { valid: false, error: "Birth date too long" };
  if (idNumber.length > 20) return { valid: false, error: "ID too long" };
  if (notes && notes.length > 2000) return { valid: false, error: "Notes too long" };

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
      from: "TravelSure <onboarding@resend.dev>",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const data: TiroshLeadRequest = await req.json();
    const validation = validateInput(data);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const safeFullName = escapeHtml(data.fullName);
    const safePhone = escapeHtml(data.phone);
    const safeBirthDate = escapeHtml(data.birthDate);
    const safeIdNumber = escapeHtml(data.idNumber);
    const safeNotes = escapeHtml(data.notes || "");

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a5a5a;">ליד חדש - תירוש</h1>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <p><strong>שם מלא:</strong> ${safeFullName}</p>
          <p><strong>טלפון:</strong> ${safePhone}</p>
          <p><strong>תאריך לידה:</strong> ${safeBirthDate}</p>
          <p><strong>תעודת זהות:</strong> ${safeIdNumber}</p>
          <p><strong>הערות:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 5px;">${safeNotes || "—"}</p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          הודעה זו נשלחה מטופס ליד באתר TravelSure
        </p>
      </div>
    `;

    await sendEmail(
      ["y@tiroche-ins.com", "rani@ophirins.co.il", "eli@ophirins.co.il", "ophir@ophirins.co.il"],
      `ליד חדש - ${safeFullName}`,
      html
    );

    return new Response(
      JSON.stringify({ success: true, message: "Lead sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-tirosh-lead function:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send lead. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
