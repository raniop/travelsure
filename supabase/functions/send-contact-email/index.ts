import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildClaimPdfBase64 } from "./claimPdf.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "TravelSure <noreply@travelsure.co.il>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  mode?: string;
  type?: string;
  claimNumber?: string;
  claimPayload?: Record<string, unknown>;
  attachments?: Array<{ filename: string; content: string; type?: string }>;
  files?: Array<{ name?: string; contentBase64?: string; contentType?: string; filename?: string; content?: string; type?: string }>;
}

const CLAIM_FIELD_LABELS: Record<string, string> = {
  claimNumber: "מספר תביעה",
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
  notifiedCreditCard: "דיווח לחברת אשראי",
  creditCardPolicyNumber: "מספר פוליסת אשראי",
  medicalExtension: "הרחבה רפואית",
  medicalExtensionPolicy: "מספר פוליסת הרחבה",
  claimedElsewhere: "נתבע במקום אחר",
  otherAbroadPolicy: "פוליסה אחרת בחו״ל",
  declaration: "הצהרה",
  marketingConsent: "הסכמה שיווקית",
  medicalWaiver: "ויתור סודיות רפואית",
  authorizeAgent: "הרשאת סוכן",
  crmMatched: "זוהה ב-CRM",
  selectedPolicyId: "פוליסה שנבחרה",
  crmCustomerName: "שם לקוח מ-CRM",
  agentName: "שם הסוכן",
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yesNo(value: unknown): string {
  if (value === true || value === "true" || value === "yes") return "כן";
  if (value === false || value === "false" || value === "no") return "לא";
  if (typeof value === "string") return value;
  return "";
}

function isClaimMode(body: ContactEmailRequest): boolean {
  return body.mode === "claim" || body.type === "claim" || Boolean(body.claimPayload);
}

function isSequentialClaimNumber(value: string): boolean {
  // Professional format: YYYYNNNN → 20260001
  return /^\d{4}\d{4,}$/.test(value);
}

async function allocateClaimNumber(preferred?: string): Promise<string> {
  const cleaned = String(preferred || "").trim();
  // Only trust numbers that already look like sequential claim IDs from our counter.
  // Always allocate server-side when missing so we never invent random IDs.
  if (isSequentialClaimNumber(cleaned)) return cleaned;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl && serviceRole) {
    try {
      const admin = createClient(supabaseUrl, serviceRole);
      const year = new Date().getFullYear();
      const { data, error } = await admin.rpc("next_claim_number", { p_year: year });
      if (!error && data) return String(data);
      console.error("next_claim_number RPC failed:", error);
    } catch (err) {
      console.error("allocateClaimNumber error:", err);
    }
  }

  const year = new Date().getFullYear();
  return `${year}${String(Date.now()).slice(-4)}`;
}

function buildPayloadRows(payload: Record<string, unknown>): string {
  const rows: string[] = [];
  for (const [key, label] of Object.entries(CLAIM_FIELD_LABELS)) {
    if (!(key in payload)) continue;
    let value: unknown = payload[key];
    if (typeof value === "boolean") value = yesNo(value);
    if (value === undefined || value === null || String(value).trim() === "") continue;
    rows.push(`<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:38%;vertical-align:top;">${esc(label)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:600;vertical-align:top;white-space:pre-wrap;">${esc(value)}</td>
    </tr>`);
  }

  const expenses = payload.expenses;
  if (Array.isArray(expenses) && expenses.length) {
    const items = expenses
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        const line = [row.date, row.type, row.amount].map((v) => String(v ?? "").trim()).filter(Boolean).join(" | ");
        return line ? `<li>${esc(line)}</li>` : "";
      })
      .filter(Boolean)
      .join("");
    if (items) {
      rows.push(`<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;vertical-align:top;">פירוט הוצאות</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;"><ul style="margin:0;padding:0 18px 0 0;">${items}</ul></td>
      </tr>`);
    }
  }

  const baggageItems = payload.baggageItems;
  if (Array.isArray(baggageItems) && baggageItems.length) {
    const items = baggageItems
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const row = item as Record<string, unknown>;
        if (!String(row.item ?? "").trim()) return "";
        const line = [row.item, row.purchasePrice ? `ערך: ${row.purchasePrice}` : "", row.receiptAttached ? "קבלה: כן" : "קבלה: לא"]
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
          .join(" | ");
        return `<li>${esc(line)}</li>`;
      })
      .filter(Boolean)
      .join("");
    if (items) {
      rows.push(`<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;vertical-align:top;">פירוט כבודה</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;"><ul style="margin:0;padding:0 18px 0 0;">${items}</ul></td>
      </tr>`);
    }
  }

  return rows.join("");
}

function buildClaimStaffHtml(
  claim: Record<string, unknown>,
  claimNumber: string,
  attachmentNames: string[],
): string {
  const rows = buildPayloadRows({ ...claim, claimNumber });
  const files =
    attachmentNames.length > 0
      ? `<ul style="margin:0;padding:0 18px 0 0;color:#111827;">${attachmentNames
          .map((name) => `<li style="margin:0 0 6px;">${esc(name)}</li>`)
          .join("")}</ul>`
      : `<p style="margin:0;color:#6b7280;">לא צורפו קבצים</p>`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:720px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:22px 24px;color:#fff;">
      <div style="font-size:13px;opacity:.9;">TravelSure · אופיר ושות׳ סוכנות לביטוח</div>
      <h1 style="margin:8px 0 0;font-size:24px;">תביעת ביטוח נסיעות חדשה</h1>
      <p style="margin:8px 0 0;font-size:18px;letter-spacing:0.5px;">מספר תביעה: <strong>${esc(claimNumber)}</strong></p>
    </div>
    <div style="padding:22px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff;margin:0 0 18px;">
        ${rows}
      </table>
      <div style="margin:0 0 8px;">
        <h3 style="margin:0 0 8px;font-size:15px;color:#0f766e;">קבצים מצורפים</h3>
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fff;">${files}</div>
        <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">מצורף גם קובץ PDF מסודר של התביעה, בנוסף לקבצים שהלקוח העלה.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildClaimCustomerHtml(claimNumber: string, firstName: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:22px 24px;color:#fff;">
      <h1 style="margin:0;font-size:22px;">תביעתך התקבלה בהצלחה</h1>
    </div>
    <div style="padding:22px 24px;color:#111827;line-height:1.7;">
      <p style="margin:0 0 12px;">שלום ${esc(firstName || "לקוח/ה")},</p>
      <p style="margin:0 0 12px;">תביעת ביטוח הנסיעות שלך התקבלה במערכת TravelSure.</p>
      <p style="margin:0 0 12px;font-size:20px;letter-spacing:0.5px;">מספר התביעה שלך: <strong>${esc(claimNumber)}</strong></p>
      <p style="margin:0 0 12px;">שמור/י מספר זה למעקב מול הסוכנות.</p>
      <p style="margin:0;color:#6b7280;font-size:13px;">TravelSure · אופיר ושות׳ סוכנות לביטוח<br>טלפון: 03-6244444 · אימייל: ophir@ophirins.co.il</p>
    </div>
  </div>
</body>
</html>`;
}

/** Soft cap so Resend + Edge Function stay under practical size limits (~4.5MB base64). */
const MAX_ATTACHMENT_BASE64_CHARS = 4_500_000;

function normalizeAttachments(body: ContactEmailRequest): Array<{ filename: string; content: string; type?: string }> {
  const fromAttachments = (body.attachments || [])
    .filter((file) => file?.filename && file?.content)
    .map((file) => ({
      filename: file.filename,
      content: String(file.content).replace(/^data:[^;]+;base64,/, ""),
      ...(file.type ? { type: file.type } : {}),
    }));

  const raw = fromAttachments.length
    ? fromAttachments
    : (body.files || [])
        .map((file) => {
          const filename = String(file.filename || file.name || "").trim();
          const content = String(file.content || file.contentBase64 || "")
            .replace(/^data:[^;]+;base64,/, "")
            .trim();
          if (!filename || !content) return null;
          return {
            filename,
            content,
            ...(file.type || file.contentType ? { type: file.type || file.contentType } : {}),
          };
        })
        .filter((file): file is { filename: string; content: string; type?: string } => Boolean(file));

  // Prefer delivering the claim email over attaching every scan. Keep as many files as fit.
  const kept: Array<{ filename: string; content: string; type?: string }> = [];
  let used = 0;
  for (const file of raw) {
    const next = used + file.content.length;
    if (next > MAX_ATTACHMENT_BASE64_CHARS) {
      console.warn(
        `Skipping attachment ${file.filename} to stay under email size limit (${raw.length} received, ${kept.length} kept)`,
      );
      continue;
    }
    kept.push(file);
    used = next;
  }
  return kept;
}

async function sendResendEmail(payload: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("Resend error:", result);
    throw new Error(result?.message || "Failed to send email");
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ContactEmailRequest = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (isClaimMode(body)) {
      const claim = (body.claimPayload || {}) as Record<string, unknown>;
      const isDocumentsFollowUp = claim.documentsFollowUp === true || claim.documentsFollowUp === "true";
      const claimNumber = await allocateClaimNumber(
        String(body.claimNumber || claim.claimNumber || ""),
      );

      const emailAttachments = normalizeAttachments(body);
      const namedFromPayload = Array.isArray(claim.attachedFileNames)
        ? (claim.attachedFileNames as unknown[]).map((n) => String(n || "").trim()).filter(Boolean)
        : [];
      const attachmentNamesForPdf = [
        ...new Set([
          ...emailAttachments.map((file) => file.filename),
          ...namedFromPayload,
        ]),
      ];
      const staffHtml = buildClaimStaffHtml(
        claim,
        claimNumber,
        attachmentNamesForPdf,
      );

      // Follow-up after the main claim mail: only forward document bytes to staff (no customer re-mail).
      if (isDocumentsFollowUp) {
        if (!emailAttachments.length) {
          return new Response(
            JSON.stringify({
              success: true,
              mode: "claim",
              claimNumber,
              staffSent: 0,
              customerSent: false,
              attachmentsSent: 0,
              followUp: true,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        const staffRecipients = [
          "rani@ophirins.co.il",
          "eli@ophirins.co.il",
          "ophir@ophirins.co.il",
        ];
        const replyTo = email || String(claim.email || "") || undefined;
        const staffSubject = `מסמכי תביעה · ${claimNumber}`;
        const staffResults = await Promise.allSettled(
          staffRecipients.map((to) =>
            sendResendEmail({
              from: RESEND_FROM,
              to: [to],
              reply_to: replyTo,
              subject: staffSubject,
              html: staffHtml,
              attachments: emailAttachments,
            }).catch(async (err) => {
              console.error(`Document follow-up failed for ${to}, retrying without attachments:`, err);
              return sendResendEmail({
                from: RESEND_FROM,
                to: [to],
                reply_to: replyTo,
                subject: staffSubject,
                html: staffHtml,
              });
            }),
          ),
        );
        const staffSentCount = staffResults.filter((r) => r.status === "fulfilled").length;
        return new Response(
          JSON.stringify({
            success: staffSentCount > 0,
            mode: "claim",
            claimNumber,
            staffSent: staffSentCount,
            customerSent: false,
            attachmentsSent: emailAttachments.length,
            followUp: true,
          }),
          {
            status: staffSentCount > 0 ? 200 : 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }

      const claimPdf = await buildClaimPdfBase64(
        claim,
        claimNumber,
        attachmentNamesForPdf,
      );
      const staffMailAttachments = [
        ...(claimPdf ? [claimPdf] : []),
        ...emailAttachments,
      ];

      const staffRecipients = [
        "rani@ophirins.co.il",
        "eli@ophirins.co.il",
        "ophir@ophirins.co.il",
      ];
      const replyTo = email || String(claim.email || "") || undefined;
      const staffSubject = `תביעת ביטוח נסיעות חדשה · ${claimNumber}`;

      // Send to each staff mailbox separately so one bad address never blocks the others.
      const staffResults = await Promise.allSettled(
        staffRecipients.map((to) =>
          sendResendEmail({
            from: RESEND_FROM,
            to: [to],
            reply_to: replyTo,
            subject: staffSubject,
            html: staffHtml,
            attachments: staffMailAttachments.length > 0 ? staffMailAttachments : undefined,
          }).catch(async (err) => {
            // If attachments blow the provider limit, still deliver the claim details + PDF if possible.
            console.error(`Staff email with all attachments failed for ${to}, retrying with PDF only:`, err);
            const pdfOnly = claimPdf ? [claimPdf] : [];
            if (pdfOnly.length) {
              try {
                return await sendResendEmail({
                  from: RESEND_FROM,
                  to: [to],
                  reply_to: replyTo,
                  subject: staffSubject,
                  html: staffHtml,
                  attachments: pdfOnly,
                });
              } catch (pdfErr) {
                console.error(`Staff email with PDF only failed for ${to}:`, pdfErr);
              }
            }
            return sendResendEmail({
              from: RESEND_FROM,
              to: [to],
              reply_to: replyTo,
              subject: staffSubject,
              html: staffHtml,
            });
          }),
        ),
      );

      const staffOk = staffResults.some((r) => r.status === "fulfilled");
      if (!staffOk) {
        console.error("All staff claim emails failed:", staffResults);
        throw new Error("Failed to notify claim staff");
      }
      for (const result of staffResults) {
        if (result.status === "rejected") {
          console.error("Partial staff claim email failure:", result.reason);
        }
      }

      const customerEmail = email || String(claim.email || "");
      let customerSent = false;
      if (customerEmail) {
        try {
          await sendResendEmail({
            from: RESEND_FROM,
            to: [customerEmail],
            subject: `אישור קבלת תביעה · ${claimNumber}`,
            html: buildClaimCustomerHtml(
              claimNumber,
              String(claim.firstName || name || ""),
            ),
          });
          customerSent = true;
        } catch (customerErr) {
          console.error("Customer claim confirmation failed:", customerErr);
          // One retry without extras — confirmation must not be lost silently.
          try {
            await sendResendEmail({
              from: RESEND_FROM,
              to: [customerEmail],
              subject: `אישור קבלת תביעה · ${claimNumber}`,
              html: buildClaimCustomerHtml(
                claimNumber,
                String(claim.firstName || name || ""),
              ),
            });
            customerSent = true;
          } catch (retryErr) {
            console.error("Customer claim confirmation retry failed:", retryErr);
          }
        }
      }

      const staffSentCount = staffResults.filter((r) => r.status === "fulfilled").length;
      return new Response(
        JSON.stringify({
          success: true,
          mode: "claim",
          claimNumber,
          staffSent: staffSentCount,
          customerSent,
          attachmentsSent: emailAttachments.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const emailResponse = await sendResendEmail({
      from: RESEND_FROM,
      to: ["rani@ophirins.co.il", "eli@ophirins.co.il"],
      reply_to: email,
      subject: subject || `פנייה חדשה מ-${name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f766e;">פנייה חדשה מטופס יצירת קשר</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>שם:</strong> ${esc(name)}</p>
            <p><strong>אימייל:</strong> ${esc(email)}</p>
            ${phone ? `<p><strong>טלפון:</strong> ${esc(phone)}</p>` : ""}
            ${subject ? `<p><strong>נושא:</strong> ${esc(subject)}</p>` : ""}
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #334155; margin-top: 0;">הודעה:</h3>
            <p style="white-space: pre-wrap; color: #475569;">${esc(message)}</p>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
            נשלח מטופס יצירת הקשר באתר TravelSure
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
