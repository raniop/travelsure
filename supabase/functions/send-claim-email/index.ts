import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ClaimFile = {
  name?: string;
  contentType?: string;
  contentBase64?: string;
};

type ClaimPayload = Record<string, unknown>;

const escapeHtml = (str: string): string =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const yesNo = (value: unknown): string => {
  if (value === true || value === "true" || value === "yes") return "כן";
  if (value === false || value === "false" || value === "no") return "לא";
  if (typeof value === "string") return value;
  return "";
};

const fieldLabels: Record<string, string> = {
  claimTypeLabel: "סוג תביעה",
  baggageSubtypeLabel: "סוג תביעת מטען",
  fullName: "שם מלא",
  lastName: "שם משפחה",
  firstName: "שם פרטי",
  idNumber: "תעודת זהות",
  birthDate: "תאריך לידה",
  street: "רחוב",
  houseNumber: "מספר בית",
  city: "יישוב",
  zip: "מיקוד",
  homePhone: "טלפון בבית",
  mobile: "טלפון נייד",
  phone: "טלפון",
  email: "אימייל",
  hmoName: "קופת חולים",
  hmoBranch: "סניף קופ״ח",
  hmoAddress: "כתובת סניף",
  policyNumber: "מספר פוליסה",
  policyType: "סוג פוליסה",
  purchasedWhere: "היכן נרכשה",
  claimReason: "סיבת ביטול / קיצור",
  tripStartDate: "תאריך יציאה",
  tripEndDate: "תאריך חזרה",
  incidentDate: "תאריך האירוע",
  country: "מדינה / מיקום",
  details: "תיאור המקרה",
  totalClaimed: "סכום נתבע",
  bankName: "בנק",
  bankCode: "קוד בנק",
  branchName: "שם סניף",
  branchNumber: "מספר סניף",
  accountNumber: "מספר חשבון",
  declaration: "הצהרה",
  marketingConsent: "הסכמה שיווקית",
  medicalWaiver: "ויתור סודיות רפואית",
  authorizeAgent: "הרשאת סוכן",
  crmMatched: "זוהה ב-CRM",
  selectedPolicyId: "פוליסה שנבחרה",
  crmCustomerName: "שם לקוח מ-CRM",
  agentName: "שם הסוכן",
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_FILES = 12;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

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

const decodeBase64Size = (b64: string): number => {
  const cleaned = b64.replace(/\s/g, "");
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
};

const buildRowsHtml = (payload: ClaimPayload): string => {
  const rows: string[] = [];
  for (const [key, label] of Object.entries(fieldLabels)) {
    if (!(key in payload)) continue;
    let value = payload[key];
    if (typeof value === "boolean") value = yesNo(value);
    if (value === undefined || value === null || String(value).trim() === "") continue;
    rows.push(
      `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;width:34%;"><strong>${escapeHtml(label)}</strong></td><td style="padding:8px;border:1px solid #e2e8f0;white-space:pre-wrap;">${escapeHtml(String(value))}</td></tr>`
    );
  }

  const expenses = payload.expenses;
  if (Array.isArray(expenses) && expenses.length) {
    const items = expenses
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        const line = [row.date, row.type, row.amount].map((v) => String(v ?? "").trim()).filter(Boolean).join(" | ");
        return line ? `<li>${escapeHtml(line)}</li>` : "";
      })
      .filter(Boolean)
      .join("");
    if (items) {
      rows.push(
        `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>פירוט הוצאות</strong></td><td style="padding:8px;border:1px solid #e2e8f0;"><ul>${items}</ul></td></tr>`
      );
    }
  }

  const baggageItems = payload.baggageItems;
  if (Array.isArray(baggageItems) && baggageItems.length) {
    const items = baggageItems
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        if (!String(row.item ?? "").trim()) return "";
        const line = [
          row.item,
          row.purchaseDate,
          row.purchasePrice,
          row.receiptAttached ? "קבלה: כן" : "קבלה: לא",
        ]
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
          .join(" | ");
        return `<li>${escapeHtml(line)}</li>`;
      })
      .filter(Boolean)
      .join("");
    if (items) {
      rows.push(
        `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>פירוט כבודה</strong></td><td style="padding:8px;border:1px solid #e2e8f0;"><ul>${items}</ul></td></tr>`
      );
    }
  }

  return rows.join("");
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    const body = await req.json();
    const payload = (body?.payload ?? body) as ClaimPayload;
    const files = (Array.isArray(body?.files) ? body.files : []) as ClaimFile[];

    const claimTypeLabel = String(payload?.claimTypeLabel ?? "").trim();
    const idNumber = String(payload?.idNumber ?? "").trim();
    const email = String(payload?.email ?? "").trim();
    const incidentDate = String(payload?.incidentDate ?? "").trim();
    const details = String(payload?.details ?? "").trim();
    let fullName = String(payload?.fullName ?? "").trim();
    if (!fullName) {
      fullName = `${String(payload?.firstName ?? "").trim()} ${String(payload?.lastName ?? "").trim()}`.trim();
      payload.fullName = fullName;
    }

    if (!claimTypeLabel || !idNumber || !email || !incidentDate || !details || !fullName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (files.length > MAX_FILES) {
      return new Response(JSON.stringify({ error: "Too many files" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const allowedExt = new Set(["pdf", "jpg", "jpeg", "png", "doc", "docx", "heic"]);
    const attachments: { filename: string; content: string; contentType?: string }[] = [];
    let totalBytes = 0;

    for (const file of files) {
      const name = String(file?.name ?? "attachment").trim() || "attachment";
      const b64 = String(file?.contentBase64 ?? "").replace(/^data:[^;]+;base64,/, "").trim();
      if (!b64) continue;
      const ext = name.split(".").pop()?.toLowerCase() || "";
      if (!allowedExt.has(ext)) continue;
      const size = decodeBase64Size(b64);
      if (size <= 0 || size > MAX_FILE_BYTES) continue;
      totalBytes += size;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return new Response(JSON.stringify({ error: "Attachments too large" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      attachments.push({
        filename: name.replace(/[^\w.\u0590-\u05FF-]+/g, "_") || `file.${ext}`,
        content: b64,
        contentType: file.contentType || undefined,
      });
    }

    if (!attachments.length) {
      return new Response(JSON.stringify({ error: "At least one attachment is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const html =
      `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">` +
      `<h2 style="margin:0 0 12px;color:#1f4b46;">הוגשה תביעה חדשה באתר TravelSure</h2>` +
      `<p style="margin:0 0 12px;color:#64748b;font-size:13px;">אופיר ושות׳ סוכנות לביטוח</p>` +
      `<table style="border-collapse:collapse;width:100%;max-width:900px;">${buildRowsHtml(payload)}</table>` +
      `</div>`;

    const subject = `תביעה חדשה: ${claimTypeLabel} - ${fullName}`;
    const recipients = ["rani@ophirins.co.il", "eli@ophirins.co.il", "ophir@ophirins.co.il"];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TravelSure <no-reply@travelsure.co.il>",
        to: recipients,
        reply_to: email,
        subject,
        html,
        attachments,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend error:", errText);
      throw new Error("Email service error");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-claim-email:", error);
    return new Response(
      JSON.stringify({ error: "Unable to send claim. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
