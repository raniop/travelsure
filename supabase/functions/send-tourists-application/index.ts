import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildTouristsPdfBase64, type TouristsPdfInput } from "./touristsPdf.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "TravelSure <noreply@travelsure.co.il>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (str: unknown): string =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const row = (label: string, value: unknown, alt = false, ltr = false) => {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return `<tr style="background:${alt ? "#fff" : "#f8fafc"};">
    <td style="padding:8px 10px;color:#475569;width:38%;vertical-align:top;"><strong>${escapeHtml(label)}</strong></td>
    <td style="padding:8px 10px;white-space:pre-wrap;${ltr ? "direction:ltr;unicode-bidi:embed;" : ""}">${escapeHtml(v)}</td>
  </tr>`;
};

const section = (title: string, rowsHtml: string) => {
  if (!rowsHtml.trim()) return "";
  return `
    <div style="margin-top:18px;">
      <h3 style="margin:0 0 8px;color:#000144;font-size:16px;border-bottom:2px solid #00A247;padding-bottom:6px;">${escapeHtml(title)}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rowsHtml}</table>
    </div>`;
};

type Pair = [string, unknown];
const rowsOf = (pairs: Pair[]) => pairs.map(([label, value], i) => row(label, value, i % 2 === 1)).join("");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const formData = (body.formData || {}) as TouristsPdfInput;
    const summary = (body.touristsPayload || {}) as {
      travelers?: Array<{ title: string; rows: Pair[] }>;
      stay?: Pair[];
      health?: Pair[];
      riders?: Pair[];
      declarations?: Pair[];
      payment?: Pair[];
    };
    const fullName = String(body.fullName || "").trim();
    const passportNo = String(body.passportNo || "").trim();
    if (!fullName || !passportNo) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const files = Array.isArray(body.attachments) ? body.attachments : [];
    const fileNames = files
      .map((f: Record<string, unknown>) => String(f.filename || f.name || ""))
      .filter(Boolean)
      .join(", ");
    const lang = String(formData.formLanguage || "he") === "en" ? "אנגלית" : "עברית";

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;color:#0f172a;">
        <div style="background:#000144;padding:22px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">בקשה חדשה — ביטוח תיירים בישראל</h1>
          <p style="color:#bfe9cf;margin:8px 0 0;font-size:13px;">TravelSure / אופיר ושות׳ · הראל Tour &amp; Care</p>
        </div>
        <div style="background:#fff;padding:20px 18px 28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 12px;font-size:14px;color:#334155;">
            התקבלה בקשה דיגיטלית להצעת ביטוח Tour &amp; Care. מצורף טופס ההצעה הרשמי של הראל ממולא (${lang}).
          </p>
          ${(summary.travelers || []).map((t) => section(t.title, rowsOf(t.rows))).join("")}
          ${section("כתובת בישראל, קשר וספק שירות", rowsOf(summary.stay || []))}
          ${section("הצהרת בריאות", rowsOf(summary.health || []))}
          ${section("הרחבות וכתבי שירות", rowsOf(summary.riders || []))}
          ${section("הצהרות וחתימה", rowsOf(summary.declarations || []))}
          ${section("פרטי תשלום", rowsOf(summary.payment || []))}
          ${fileNames ? section("קבצים מצורפים", row("קבצים", fileNames)) : ""}
        </div>
        <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:14px;">נשלח מטופס /tourists באתר TravelSure</p>
      </div>`;

    const emailAttachments = files
      .map((f: Record<string, unknown>) => {
        const content = String(f.contentBase64 || f.content || "").replace(/^data:[^;]+;base64,/, "").trim();
        if (!content) return null;
        return {
          filename: String(f.filename || f.name || "file"),
          content,
          type: String(f.type || f.contentType || "application/octet-stream"),
        };
      })
      .filter(Boolean) as Array<{ filename: string; content: string; type?: string }>;

    let pdfAttached = false;
    try {
      const pdf = await buildTouristsPdfBase64(formData);
      if (pdf?.content) {
        emailAttachments.unshift(pdf);
        pdfAttached = true;
      } else {
        console.error("Tourists PDF was not generated; sending the email without it");
      }
    } catch (err) {
      console.error("Tourists PDF threw:", err);
    }

    const recipients = Array.isArray(body.notify) && body.notify.length ? body.notify : ["rani@ophirins.co.il"];
    const emailBody = {
      from: RESEND_FROM,
      to: recipients,
      reply_to: String(body.email || "").trim() || undefined,
      subject: `ביטוח תיירים: ${fullName}`,
      html,
      attachments: emailAttachments.length ? emailAttachments : undefined,
    };
    const send = (payload: unknown) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

    let response = await send(emailBody);
    // If Resend rejects the attachments (size or type), retry with the filled form only
    if (!response.ok && emailAttachments.length) {
      console.error("Resend error with attachments:", await response.text());
      const pdfOnly = emailAttachments.slice(0, pdfAttached ? 1 : 0);
      response = await send({ ...emailBody, attachments: pdfOnly.length ? pdfOnly : undefined });
    }
    if (!response.ok) {
      console.error("Resend error:", await response.text());
      throw new Error("Email service error");
    }

    return new Response(JSON.stringify({ success: true, pdfAttached }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Error in send-tourists-application:", err);
    return new Response(JSON.stringify({ error: "Unable to send application. Please try again later." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
