import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLAIM_RECIPIENTS = ["rani@ophirins.co.il", "eli@ophirins.co.il", "ophir@ophirins.co.il"];

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
  claimNumber?: string;
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
  if (name.length > 160) return { valid: false, error: "Name too long" };
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
    if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

    const data = (await req.json()) as ContactEmailRequest;
    const validation = validateInput(data);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { name, email, phone, message } = data;
    const claimNumber = String(data.claimNumber || data.claimPayload?.claimNumber || "").trim();
    const isClaim = data.type === "claim" || Boolean(data.claimPayload) || Boolean(claimNumber);
    const attachments = buildAttachments(data.files);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
    const safeClaimNumber = escapeHtml(claimNumber || "ללא מספר");

    if (isClaim) {
      const businessEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; color:#0f172a;">
          <div style="background:linear-gradient(135deg,#1f4b46,#2f6b63);padding:22px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">תביעה חדשה מהאתר</h1>
            <p style="color:#bbf7d0;margin:8px 0 0;">אופיר ושות׳ סוכנות לביטוח</p>
          </div>
          <div style="background:#f8fafc;padding:20px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;">
            <p style="margin:0 0 12px;"><strong>מספר תביעה:</strong> <span style="font-size:18px;color:#1f4b46;">${safeClaimNumber}</span></p>
            <p><strong>שם:</strong> ${safeName}</p>
            <p><strong>אימייל:</strong> ${safeEmail}</p>
            <p><strong>טלפון:</strong> ${safePhone || "לא צוין"}</p>
            <p><strong>פרטי התביעה:</strong></p>
            <div style="background:#fff;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">${safeMessage}</div>
            <p style="margin-top:14px;"><strong>קבצים מצורפים:</strong> ${attachments.length ? attachments.length : "אין"}</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: CLAIM_RECIPIENTS,
        subject: `תביעה חדשה ${claimNumber ? `(${claimNumber})` : ""}: ${name}`.replace(/\s+/g, " ").trim(),
        html: businessEmailHtml,
        replyTo: email,
        attachments,
      });

      const customerEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1f4b46 0%, #2f6b63 100%); padding: 28px; text-align: center;">
            <h1 style="color: white; margin: 0;">TravelSure</h1>
            <p style="color: #4ade80; margin: 10px 0 0 0;">אופיר ושות׳ סוכנות לביטוח</p>
          </div>
          <div style="padding: 28px; background-color: #f9f9f9;">
            <h2 style="color: #1a5a5a;">שלום ${safeName},</h2>
            <p>התביעה התקבלה בהצלחה במערכת.</p>
            <p style="font-size:18px;"><strong>מספר תביעה:</strong> ${safeClaimNumber}</p>
            <p>הצוות שלנו יבדוק את הפרטים והמסמכים ויחזור אליך בהקדם.</p>
            <p>בברכה,<br>צוות TravelSure</p>
          </div>
        </div>
      `;
      await sendEmail({
        to: [email],
        subject: `התביעה התקבלה - ${safeClaimNumber} | TravelSure`,
        html: customerEmailHtml,
      });

      return new Response(JSON.stringify({ success: true, mode: "claim", claimNumber: claimNumber || null }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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
      </div>
    `;

    await sendEmail({
      to: ["ophir@ophirins.co.il"],
      subject: `פנייה חדשה מ-${name}`,
      html: businessEmailHtml,
      replyTo: email,
    });

    await sendEmail({
      to: [email],
      subject: "קיבלנו את פנייתך - TravelSure",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a5a5a;">שלום ${safeName},</h2>
          <p>תודה שפנית אלינו! קיבלנו את הודעתך ונחזור אליך בהקדם.</p>
          <p>בברכה,<br>צוות TravelSure - אופיר ושות׳ סוכנות לביטוח</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true, mode: "contact" }), {
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
