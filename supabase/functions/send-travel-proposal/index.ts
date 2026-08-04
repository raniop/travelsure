import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  buildTravelProposalFilledPdfBase64,
  type TravelProposalPdfInput,
} from "./travelProposalPdf.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "TravelSure <noreply@travelsure.co.il>";
const STAFF_TO = "rani@ophirins.co.il";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const pad2 = (n: string): string => String(n || "").padStart(2, "0");

const formatDateDisplay = (value: unknown): string => {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${pad2(dmy[1])}/${pad2(dmy[2])}/${dmy[3]}`;
  const digits = s.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  return s;
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
      <h3 style="margin:0 0 8px;color:#1f4b46;font-size:16px;border-bottom:2px solid #2f6b63;padding-bottom:6px;">${escapeHtml(title)}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${rowsHtml}</table>
    </div>`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const summary = (body.travelPayload || body.summary || {}) as Record<string, unknown>;
    const formData = (body.formData || body.form || {}) as TravelProposalPdfInput;
    const fullName = String(
      body.fullName ||
        summary.primaryName ||
        `${(formData.primary as { firstNameHe?: string })?.firstNameHe || ""} ${(formData.primary as { lastNameHe?: string })?.lastNameHe || ""}`,
    ).trim();

    if (!fullName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const pdfInput: TravelProposalPdfInput = {
      ...summary,
      ...formData,
      agentName: String(formData.agentName || summary.agentName || "אופיר ושות׳ סוכנות לביטוח"),
      agentNo: "59795",
      signatureDate: String(formData.signatureDate || summary.signatureDate || ""),
    };

    let pdfBase64 = "";
    try {
      pdfBase64 = await buildTravelProposalFilledPdfBase64(pdfInput);
    } catch (pdfErr) {
      console.error("PDF fill failed:", pdfErr);
    }

    const tripFrom = formatDateDisplay(summary.tripFrom || formData.tripFrom);
    const tripTo = formatDateDisplay(summary.tripTo || formData.tripTo);

    const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8" /></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#f1f5f9;padding:24px;">
  <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 4px 24px rgba(15,23,42,.08);">
    <h1 style="margin:0 0 6px;color:#1f4b46;font-size:22px;">הצעה לביטוח נסיעות לחו״ל (רפואי)</h1>
    <p style="margin:0 0 18px;color:#64748b;font-size:14px;">טופס דיגיטלי TravelSure / אופיר ושות׳ · הראל מהדורת 07/2026</p>
    ${section(
      "פרטי הנסיעה",
      [
        row("מבוטח ראשי", fullName, false),
        row("מתאריך", tripFrom, true, true),
        row("עד תאריך", tripTo, false, true),
        row("יעדים", summary.destinationsLabel || "", true),
        row("מדינות", summary.countriesDetail || formData.countriesDetail, false),
      ].join(""),
    )}
    ${section(
      "יצירת קשר",
      [
        row("כתובת", summary.address || "", false),
        row("טלפון", summary.phone || formData.phone, true, true),
        row("נייד", summary.mobile || formData.mobile, false, true),
        row("דוא״ל", summary.email || formData.email, true, true),
        row("עיסוק", summary.occupation || formData.occupation, false),
      ].join(""),
    )}
    ${section("מבוטחים", String(summary.insuredsHtml || summary.insuredsText || ""))}
    ${section("הערות", row("הערות", summary.notes || formData.notes || "", false))}
    <p style="margin-top:24px;font-size:12px;color:#94a3b8;">מצורף טופס ההצעה הרשמי של הראל לאחר מילוי דיגיטלי.</p>
  </div>
</body>
</html>`;

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured", pdfReady: !!pdfBase64 }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const attachments: Array<{ filename: string; content: string }> = [];
    if (pdfBase64) {
      attachments.push({
        filename: `Harel_Travel_Medical_Proposal_${fullName.replace(/\s+/g, "_")}.pdf`,
        content: pdfBase64,
      });
    }

    const extraAttachments = Array.isArray(body.attachments) ? body.attachments : [];
    for (const att of extraAttachments) {
      const content = String(att.contentBase64 || att.content || "");
      const filename = String(att.filename || att.name || "attachment");
      if (content) attachments.push({ filename, content });
    }

    const notifyList = Array.isArray(body.notify) && body.notify.length
      ? body.notify.map(String)
      : [STAFF_TO];

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: notifyList,
        subject: `הצעה לביטוח נסיעות לחו״ל: ${fullName}`,
        html,
        attachments,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Email send failed", detail: errText }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resendData = await resendRes.json();
    return new Response(
      JSON.stringify({ success: true, id: resendData.id, pdfAttached: !!pdfBase64 }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("send-travel-proposal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
