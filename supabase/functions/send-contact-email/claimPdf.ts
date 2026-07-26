import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const HEBREW_FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/notofonts/hebrew@main/fonts/NotoSansHebrew/full/ttf/NotoSansHebrew-Regular.ttf",
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Regular.ttf",
];

let cachedFontBytes: Uint8Array | null = null;

async function loadHebrewFontBytes(): Promise<Uint8Array | null> {
  if (cachedFontBytes) return cachedFontBytes;
  for (const url of HEBREW_FONT_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      cachedFontBytes = new Uint8Array(await res.arrayBuffer());
      return cachedFontBytes;
    } catch {
      // try next
    }
  }
  return null;
}

/** Visual RTL for pdf-lib (draws LTR). Keeps digit runs in order. */
export function visualRtl(input: unknown): string {
  const text = String(input ?? "");
  if (!text) return "";
  if (!/[\u0590-\u05FF]/.test(text)) return text;

  const tokens = text.match(/[\u0590-\u05FF]+|[^\u0590-\u05FF]+/g) || [text];
  return tokens
    .reverse()
    .map((token) => (/[\u0590-\u05FF]/.test(token) ? [...token].reverse().join("") : token))
    .join("");
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type PdfRow = { label: string; value: string };

function yesNo(value: unknown): string {
  if (value === true || value === "true" || value === "yes") return "כן";
  if (value === false || value === "false" || value === "no") return "לא";
  return String(value ?? "").trim();
}

function push(rows: PdfRow[], label: string, value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return;
  rows.push({ label, value: text });
}

export function buildClaimPdfRows(
  claim: Record<string, unknown>,
  claimNumber: string,
  attachmentNames: string[],
): PdfRow[] {
  const rows: PdfRow[] = [];
  push(rows, "מספר תביעה", claimNumber);
  push(rows, "סוג תביעה", claim.claimTypeLabel);
  push(rows, "סוג מטען", claim.baggageSubtypeLabel);
  push(rows, "שם מלא", claim.fullName || `${claim.firstName || ""} ${claim.lastName || ""}`.trim());
  push(rows, "תעודת זהות", claim.idNumber);
  push(rows, "תאריך לידה", claim.birthDate);
  push(rows, "אימייל", claim.email);
  push(rows, "טלפון נייד", claim.mobile || claim.phone);
  push(rows, "טלפון בבית", claim.homePhone);
  push(
    rows,
    "כתובת",
    [claim.street, claim.houseNumber, claim.city, claim.zip].map((v) => String(v || "").trim()).filter(Boolean).join(", "),
  );
  push(rows, "מספר פוליסה", claim.policyNumber);
  push(rows, "סוג פוליסה", claim.policyType);
  push(rows, "סיבת ביטול / קיצור", claim.claimReason);
  push(rows, "תאריך יציאה", claim.tripStartDate);
  push(rows, "תאריך חזרה", claim.tripEndDate);
  push(rows, "תאריך האירוע", claim.incidentDate);
  push(rows, "מדינה / מיקום", claim.country);
  push(rows, "תיאור המקרה", claim.details);
  push(rows, "סכום נתבע", claim.totalClaimed || claim.amount);
  push(rows, "בנק", claim.bankName);
  push(rows, "סניף", claim.branchNumber || claim.branchName);
  push(rows, "מספר חשבון", claim.accountNumber);
  push(rows, "הצהרה", yesNo(claim.declaration));
  push(rows, "ויתור סודיות רפואית", yesNo(claim.medicalWaiver));
  push(rows, "הרשאת סוכן", yesNo(claim.authorizeAgent));

  if (Array.isArray(claim.expenses)) {
    claim.expenses.forEach((item, idx) => {
      if (!item || typeof item !== "object") return;
      const row = item as Record<string, unknown>;
      const line = [row.date, row.type, row.amount].map((v) => String(v ?? "").trim()).filter(Boolean).join(" | ");
      if (line) push(rows, `הוצאה ${idx + 1}`, line);
    });
  }

  if (Array.isArray(claim.baggageItems)) {
    claim.baggageItems.forEach((item, idx) => {
      if (!item || typeof item !== "object") return;
      const row = item as Record<string, unknown>;
      if (!String(row.item ?? "").trim()) return;
      const line = [row.item, row.purchasePrice ? `ערך: ${row.purchasePrice}` : ""]
          .map((v) => String(v ?? "").trim())
          .filter(Boolean)
          .join(" | ");
      if (line) push(rows, `פריט כבודה ${idx + 1}`, line);
    });
  }

  if (attachmentNames.length) {
    push(rows, "קבצים מצורפים", attachmentNames.join(", "));
  }

  return rows;
}

export async function buildClaimPdfBase64(
  claim: Record<string, unknown>,
  claimNumber: string,
  attachmentNames: string[],
): Promise<{ filename: string; content: string; type: string } | null> {
  try {
    const rows = buildClaimPdfRows(claim, claimNumber, attachmentNames);
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const fontBytes = await loadHebrewFontBytes();
    const hebrewFont = fontBytes ? await pdf.embedFont(fontBytes, { subset: true }) : null;
    const latinFont = await pdf.embedFont(StandardFonts.Helvetica);
    const latinBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const font = hebrewFont || latinFont;

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawRtl = (text: string, size: number, xRight: number, yPos: number, useBold = false) => {
      const drawn = hebrewFont ? visualRtl(text) : text;
      const active = hebrewFont ? hebrewFont : useBold ? latinBold : latinFont;
      const width = active.widthOfTextAtSize(drawn, size);
      page.drawText(drawn, {
        x: xRight - width,
        y: yPos,
        size,
        font: active,
        color: rgb(0.08, 0.12, 0.18),
      });
      return 16;
    };

    // Header bar
    page.drawRectangle({
      x: 0,
      y: pageHeight - 72,
      width: pageWidth,
      height: 72,
      color: rgb(0.06, 0.46, 0.43),
    });
    page.drawText(hebrewFont ? visualRtl("TravelSure · תביעת ביטוח נסיעות") : "TravelSure Claim", {
      x: hebrewFont
        ? pageWidth - margin - font.widthOfTextAtSize(visualRtl("TravelSure · תביעת ביטוח נסיעות"), 16)
        : margin,
      y: pageHeight - 36,
      size: 16,
      font,
      color: rgb(1, 1, 1),
    });
    page.drawText(`# ${claimNumber}`, {
      x: margin,
      y: pageHeight - 36,
      size: 14,
      font: latinBold,
      color: rgb(1, 1, 1),
    });
    y = pageHeight - 92;

    const fullName = String(claim.fullName || `${claim.firstName || ""} ${claim.lastName || ""}`).trim();
    y -= drawRtl(`שם המבוטח: ${fullName}`, 12, pageWidth - margin, y);
    y -= drawRtl(`סוג תביעה: ${String(claim.claimTypeLabel || "")}`, 11, pageWidth - margin, y);
    y -= 10;

    for (const row of rows) {
      if (y < 70) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      // Label
      page.drawRectangle({
        x: margin,
        y: y - 4,
        width: contentWidth,
        height: 18,
        color: rgb(0.94, 0.97, 0.96),
      });
      y -= drawRtl(row.label, 10, pageWidth - margin - 4, y);
      y -= 2;

      // Value with wrapping
      const value = String(row.value);
      const maxChars = 90;
      const chunks: string[] = [];
      if (value.length <= maxChars) chunks.push(value);
      else {
        let rest = value;
        while (rest.length) {
          chunks.push(rest.slice(0, maxChars));
          rest = rest.slice(maxChars);
        }
      }
      for (const chunk of chunks) {
        if (y < 50) {
          page = pdf.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        y -= drawRtl(chunk, 11, pageWidth - margin - 4, y);
      }
      y -= 8;
    }

    // Footer
    page.drawText(
      hebrewFont
        ? visualRtl("נוצר אוטומטית מטופס התביעה באתר TravelSure · אופיר ושות׳ סוכנות לביטוח")
        : "Generated from TravelSure claim form",
      {
        x: margin,
        y: 28,
        size: 8,
        font,
        color: rgb(0.45, 0.5, 0.55),
      },
    );

    const bytes = await pdf.save();
    return {
      filename: `claim-${claimNumber}.pdf`,
      content: uint8ToBase64(bytes),
      type: "application/pdf",
    };
  } catch (err) {
    console.error("buildClaimPdfBase64 failed:", err);
    return null;
  }
}
