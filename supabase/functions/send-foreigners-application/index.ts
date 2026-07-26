import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

const row = (label: string, value: unknown, alt = false) => {
  const v = String(value ?? "").trim();
  if (!v) return "";
  return `<tr style="background:${alt ? "#fff" : "#f8fafc"};">
    <td style="padding:8px 10px;color:#475569;width:38%;vertical-align:top;"><strong>${escapeHtml(label)}</strong></td>
    <td style="padding:8px 10px;white-space:pre-wrap;">${escapeHtml(v)}</td>
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
    const summary = (body.foreignersPayload || body.summary || {}) as Record<string, unknown>;
    const fullName = String(body.fullName || `${summary.firstName || ""} ${summary.lastName || ""}`).trim();
    const employerName = String(body.employerName || summary.employerName || "").trim();
    const passportNo = String(body.passportNo || summary.passportNo || "").trim();

    if (!fullName || !passportNo || !employerName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const generalHealth = Array.isArray(summary.generalHealth) ? summary.generalHealth : [];
    const conditions = Array.isArray(summary.conditions) ? summary.conditions : [];

    const workerRows = [
      row("שם פרטי", summary.firstName, false),
      row("שם משפחה", summary.lastName, true),
      row("מספר דרכון", summary.passportNo, false),
      row("ארץ הנפקת דרכון", summary.passportCountry, true),
      row("ארץ מוצא", summary.countryOfOrigin, false),
      row("תאריך לידה", summary.birthDate, true),
      row("מין", summary.gender, false),
      row("תאריך ראשון שבוטח", summary.firstInsuranceDate, true),
      row("תאריך כניסה לישראל", summary.entryDate, false),
      row("תקופת ביטוח מ־", summary.insuranceFrom, true),
      row("תקופת ביטוח עד", summary.insuranceTo, false),
      row("עיסוק / תיאור עבודה", summary.workDescription, true),
      row("כתובת", summary.address, false),
      row("טלפון", summary.phone, true),
      row("נייד", summary.mobile, false),
      row("דוא״ל", summary.email, true),
      row("מטרת הגעה", summary.workPurpose, false),
      row("ספק שירות (קופ״ח)", summary.provider, true),
    ].join("");

    const employerRows = [
      row("שם מעסיק / בעל פוליסה", summary.employerName, false),
      row("ת.ז. / ח.פ.", summary.employerId, true),
      row("טלפון", summary.employerPhone, false),
      row("נייד", summary.employerMobile, true),
      row("דוא״ל", summary.employerEmail, false),
      row("כתובת", summary.employerAddress, true),
      row("שם סוכן", summary.agentName, false),
      row("מספר סוכן", summary.agentNo, true),
    ].join("");

    const prevRows = [
      row("היה מבוטח בעבר", summary.hadPreviousInsurance, false),
      row("חברה קודמת", summary.previousCompany, true),
      row("מספר פוליסה", summary.previousPolicyNo, false),
      row("מספר חבר", summary.previousMembershipNo, true),
      row("מתאריך", summary.previousFrom, false),
      row("עד תאריך", summary.previousTo, true),
    ].join("");

    let healthRows = "";
    generalHealth.forEach((item: unknown, idx: number) => {
      if (Array.isArray(item) && item.length >= 2) {
        healthRows += row(String(item[0]), item[1], idx % 2 === 1);
      }
    });

    let conditionRows = "";
    conditions.forEach((c: unknown, idx: number) => {
      if (!c || typeof c !== "object") return;
      const item = c as Record<string, unknown>;
      const parts = [
        String(item.answer || ""),
        item.selected ? `בחירות: ${item.selected}` : "",
        item.details ? `פירוט: ${item.details}` : "",
        item.extras ? String(item.extras) : "",
      ]
        .filter(Boolean)
        .join(" | ");
      conditionRows += row(String(item.group || "שאלה"), parts, idx % 2 === 1);
    });

    const declRows = [
      row("נדחתה בקשה בעבר", summary.dismissedBefore, false),
      row("פירוט דחייה", summary.dismissedDetails, true),
      row("הרשאת סוכן", summary.authorizeAgent, false),
      row("הצהרת אמת", summary.healthAnswersTrue, true),
      row("ויתור סודיות רפואית", summary.medicalConfidentialityWaiver, false),
      row("קיבל מידע מהותי", summary.receivedEssentialInfo, true),
      row("הסכמה לדיוור", summary.marketingConsent, false),
      row("דיוור נוסף מקבוצת הראל", summary.marketingExtraConsent, true),
      row("הוסבר בשפה מובנת", summary.explainedInUnderstoodLanguage, false),
      row("שם החותם", summary.signatureName, true),
      row("תאריך חתימה", summary.signatureDate, false),
      row("הערות", summary.notes, true),
    ].join("");

    const payRows = [
      row("דילוג על תשלום כעת", summary.skipPaymentNow, false),
      row("שם משפחה משלם", summary.payerLastName, true),
      row("שם פרטי משלם", summary.payerFirstName, false),
      row("ת.ז. משלם", summary.payerId, true),
      row("מספר כרטיס", summary.cardNumber, false),
      row("תוקף", summary.cardExp, true),
      row("כתובת משלם", summary.payerStreetHouse, false),
      row("יישוב", summary.payerTown, true),
      row("מיקוד", summary.payerZip, false),
      row("נייד משלם", summary.payerMobile, true),
      row("דוא״ל משלם", summary.payerEmail, false),
      row("הסכמת משלם", summary.paymentConsent, true),
    ].join("");

    const files = Array.isArray(body.attachments) ? body.attachments : Array.isArray(body.files) ? body.files : [];
    const fileNames = files
      .map((f: Record<string, unknown>) => String(f.filename || f.name || ""))
      .filter(Boolean)
      .join(", ");

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;color:#0f172a;">
        <div style="background:linear-gradient(135deg,#1f4b46 0%,#2f6b63 100%);padding:22px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">בקשה חדשה — ביטוח עובדים זרים</h1>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:13px;">TravelSure / אופיר ושות׳ · הראל SAFE STAY</p>
        </div>
        <div style="background:#fff;padding:20px 18px 28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 12px;font-size:14px;color:#334155;">
            התקבלה בקשה דיגיטלית להצעת ביטוח בריאות לעובד זר + הצהרת בריאות.
          </p>
          ${section("פרטי העובד / המועמד לביטוח", workerRows)}
          ${section("פרטי מעסיק וסוכן", employerRows)}
          ${section("ביטוח קודם", prevRows)}
          ${section("הצהרת בריאות — שאלות כלליות", healthRows)}
          ${section("הצהרת בריאות — מערכות ומחלות", conditionRows)}
          ${section("הצהרות ואישורים", declRows)}
          ${section("פרטי תשלום", payRows)}
          ${fileNames ? section("קבצים מצורפים", row("קבצים", fileNames)) : ""}
        </div>
        <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:14px;">
          נשלח מטופס /Foreigners באתר TravelSure
        </p>
      </div>
    `;

    const emailAttachments = files
      .map((f: Record<string, unknown>) => {
        const content = String(f.contentBase64 || f.content || "");
        const filename = String(f.filename || f.name || "file");
        if (!content) return null;
        return { filename, content };
      })
      .filter(Boolean);

    const recipients = Array.isArray(body.notify) && body.notify.length
      ? body.notify
      : ["rani@ophirins.co.il"];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: recipients,
        reply_to: String(body.email || summary.employerEmail || summary.email || "").trim() || undefined,
        subject: `ביטוח עובדים זרים: ${fullName}${employerName ? ` · ${employerName}` : ""}`,
        html,
        attachments: emailAttachments.length ? emailAttachments : undefined,
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
  } catch (err) {
    console.error("Error in send-foreigners-application:", err);
    return new Response(
      JSON.stringify({ error: "Unable to send application. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
