import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

/**
 * Bundled Heebo Regular — includes Hebrew + Latin digits/punctuation.
 * Avoid Noto Sans Hebrew alone (missing digits → □□□ in PDF).
 */
const LOCAL_FONT_URL = new URL("./fonts/Heebo-Regular.ttf", import.meta.url);

const FALLBACK_FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/heebo/Heebo%5Bwght%5D.ttf",
  "https://raw.githubusercontent.com/google/fonts/main/ofl/heebo/Heebo%5Bwght%5D.ttf",
];

let cachedFontBytes: Uint8Array | null = null;

async function loadClaimFontBytes(): Promise<Uint8Array | null> {
  if (cachedFontBytes) return cachedFontBytes;

  try {
    const local = await Deno.readFile(LOCAL_FONT_URL);
    if (local.byteLength > 1000) {
      cachedFontBytes = local;
      return cachedFontBytes;
    }
  } catch (err) {
    console.error("Local claim font read failed:", err);
  }

  for (const url of FALLBACK_FONT_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength > 1000) {
        cachedFontBytes = bytes;
        return cachedFontBytes;
      }
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Convert logical Hebrew/mixed text to visual order for pdf-lib LTR drawing.
 * Digits / Latin runs stay in natural reading order.
 */
export function visualRtl(input: unknown): string {
  const text = String(input ?? "");
  if (!text) return "";
  if (!/[\u0590-\u05FF]/.test(text)) return text;

  const reversed = [...text].reverse().join("");
  // Un-reverse LTR runs (numbers, emails, latin words, dates)
  return reversed.replace(/[0-9A-Za-z@._+/\-:]+/g, (run) => [...run].reverse().join(""));
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

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const value = String(text ?? "");
  if (!value) return [""];
  // Prefer wrapping on spaces; fall back to hard slices for long tokens (emails etc.)
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  const fits = (s: string) => font.widthOfTextAtSize(visualRtl(s), size) <= maxWidth;

  const pushHard = (token: string) => {
    let rest = token;
    while (rest) {
      let lo = 1;
      let hi = rest.length;
      let best = 1;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (fits(rest.slice(0, mid))) {
          best = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      lines.push(rest.slice(0, best));
      rest = rest.slice(best);
    }
  };

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (fits(next)) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (fits(word)) current = word;
    else {
      pushHard(word);
      current = "";
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
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

    const fontBytes = await loadClaimFontBytes();
    if (!fontBytes) {
      console.error("buildClaimPdfBase64: no Hebrew-capable font available");
      return null;
    }

    // subset:false avoids dropping digits/punctuation from the embedded face
    const font = await pdf.embedFont(fontBytes, { subset: false });
    const latinBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const right = pageWidth - margin;

    let page: PDFPage = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawRight = (text: string, size: number, yPos: number, activeFont: PDFFont = font, color = rgb(0.08, 0.12, 0.18)) => {
      const drawn = visualRtl(text);
      const width = activeFont.widthOfTextAtSize(drawn, size);
      page.drawText(drawn, {
        x: right - width,
        y: yPos,
        size,
        font: activeFont,
        color,
      });
    };

    // Header bar
    page.drawRectangle({
      x: 0,
      y: pageHeight - 72,
      width: pageWidth,
      height: 72,
      color: rgb(0.06, 0.46, 0.43),
    });

    const headerTitle = "תביעת ביטוח נסיעות · TravelSure";
    drawRight(headerTitle, 16, pageHeight - 36, font, rgb(1, 1, 1));
    page.drawText(`# ${claimNumber}`, {
      x: margin,
      y: pageHeight - 36,
      size: 14,
      font: latinBold,
      color: rgb(1, 1, 1),
    });
    y = pageHeight - 92;

    const fullName = String(claim.fullName || `${claim.firstName || ""} ${claim.lastName || ""}`).trim();
    drawRight(`שם המבוטח: ${fullName}`, 12, y);
    y -= 18;
    drawRight(`סוג תביעה: ${String(claim.claimTypeLabel || "")}`, 11, y);
    y -= 22;

    for (const row of rows) {
      if (y < 80) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      page.drawRectangle({
        x: margin,
        y: y - 4,
        width: contentWidth,
        height: 18,
        color: rgb(0.94, 0.97, 0.96),
      });
      drawRight(row.label, 10, y);
      y -= 20;

      const lines = wrapText(row.value, font, 11, contentWidth - 8);
      for (const line of lines) {
        if (y < 50) {
          page = pdf.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        drawRight(line, 11, y);
        y -= 15;
      }
      y -= 8;
    }

    const footer = "נוצר אוטומטית מטופס התביעה באתר TravelSure · אופיר ושות׳ סוכנות לביטוח";
    const footerDrawn = visualRtl(footer);
    const footerWidth = font.widthOfTextAtSize(footerDrawn, 8);
    page.drawText(footerDrawn, {
      x: right - footerWidth,
      y: 28,
      size: 8,
      font,
      color: rgb(0.45, 0.5, 0.55),
    });

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
