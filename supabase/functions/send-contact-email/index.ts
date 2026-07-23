import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ClaimFile = {
  name?: string;
  contentType?: string;
  contentBase64?: string;
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  type?: string;
  claimPayload?: Record<string, unknown>;
  files?: ClaimFile[];
}

const escapeHtml = (str: string): string =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const checkRateLimit = (clientIp: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
};

const validateInput = (data: ContactEmailRequest): { valid: boolean; error?: string } => {
  const { name, email, message } = data;
  if (!name || !email || !message) return { valid: false, error: "Missing required fields" };
  if (name.length > 120) return { valid: false, error: "Name too long" };
  if (email.length > 255) return { valid: false, error: "Email too long" };
  if (message.length > 20000) return { valid: false, error: "Message too long" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: "Invalid email format" };
  return { valid: true };
};

const decodeBase64Size = (b64: string): number => {
  const cleaned = b64.replace(/\s/g, "");
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
};

const buildAttachments = (files: ClaimFile[] | undefined) => {
  if (!Array.isArray(files) || !files.length) return [];
  const allowedExt = new Set(["pdf", "jpg", "jpeg", "png", "doc", "docx", "heic"]);
  const attachments: { filename: string; content: string; contentType?: string }[] = [];
  let total = 0;
  for (const file of files.slice(0, 12)) {
    const name = String(file?.name ?? "attachment").trim() || "attachment";
    const b64 = String(file?.contentBase64 ?? "").replace(/^data:[^;]+;base64,/, "").trim();
    if (!b64) continue;
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExt.has(ext)) continue;
    const size = decodeBase64Size(b64);
    if (size <= 0 || size > 8 * 1024 * 1024) continue;
    total += size;
    if (total > 20 * 1024 * 1024) break;
    attachments.push({
      filename: name.replace(/[^\w.\u0590-\u05FF-]+/g, "_") || `file.${ext}`,
      content: b64,
      contentType: file.contentType || undefined,
    });
  }
  return attachments;
};

const sendEmail = async (opts: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; contentType?: string }[];
}) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "TravelSure <no-reply@travelsure.co.il>",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
      attachments: opts.attachments?.length ? opts.attachments : undefined,
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

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const data = (await req.json()) as ContactEmailRequest;
    const validation = validateInput(data);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { name, email, phone, message } = data;
    const isClaim = data.type === "claim" || Boolean(data.claimPayload);
    const attachments = buildAttachments(data.files);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

    const title = isClaim ? "תביעה חדשה מהאתר" : "פנייה חדשה מהאתר";
    const recipients = isClaim
      ? ["ophir@ophirins.co.il", "rani@ophirins.co.il", "eli@ophirins.co.il"]
      : ["ophir@ophirins.co.il"];

    const businessEmailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h1 style="color: #1a5a5a;">${title}</h1>
        <p style="color:#64748b;font-size:13px;">אופיר ושות׳ סוכנות לביטוח</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <p><strong>שם:</strong> ${safeName}</p>
          <p><strong>אימייל:</strong> ${safeEmail}</p>
          <p><strong>טלפון:</strong> ${safePhone || "לא צוין"}</p>
          <p><strong>${isClaim ? "פרטי התביעה" : "הודעה"}:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 5px;">${safeMessage}</p>
          ${
            attachments.length
              ? `<p style="margin-top:12px;"><strong>קבצים מצורפים:</strong> ${attachments.length}</p>`
              : isClaim
                ? `<p style="margin-top:12px;color:#b45309;"><strong>שים לב:</strong> לא התקבלו קבצים תקינים בבקשה זו.</p>`
                : ""
          }
        </div>
      </div>
    `;

    await sendEmail({
      to: recipients,
      subject: isClaim ? `תביעה חדשה: ${name}` : `פנייה חדשה מ-${name}`,
      html: businessEmailHtml,
      replyTo: email,
      attachments,
    });

    if (!isClaim) {
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
            <p>בברכה,<br>צוות TravelSure - אופיר ושות׳ סוכנות לביטוח</p>
          </div>
        </div>
      `;
      await sendEmail({
        to: [email],
        subject: "קיבלנו את פנייתך - TravelSure",
        html: customerEmailHtml,
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Message sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-contact-email function:", error);
    return new Response(JSON.stringify({ error: "Unable to send message. Please try again later." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
