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

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

type PdfRow = { label: string; value: string };
type BidiRun = { text: string; ltr: boolean };

const isRtlChar = (ch: string) => /[\u0590-\u05FF]/.test(ch);
const isLtrStrong = (ch: string) => /[0-9A-Za-z]/.test(ch);

/** Split logical text into LTR / RTL runs for a right-to-left paragraph. */
export function splitBidiRuns(input: unknown): BidiRun[] {
  const text = String(input ?? "");
  if (!text) return [];

  const runs: BidiRun[] = [];
  let buf = "";
  let mode: "ltr" | "rtl" | "neutral" = "neutral";

  const flush = (next?: "ltr" | "rtl") => {
    if (!buf) {
      if (next) mode = next;
      return;
    }
    runs.push({ text: buf, ltr: mode === "ltr" });
    buf = "";
    mode = next || "neutral";
  };

  for (const ch of [...text]) {
    if (isLtrStrong(ch)) {
      if (mode === "rtl") flush("ltr");
      else mode = "ltr";
      buf += ch;
    } else if (isRtlChar(ch)) {
      if (mode === "ltr") flush("rtl");
      else mode = "rtl";
      buf += ch;
    } else {
      // spaces / punctuation stick to current run
      buf += ch;
    }
  }
  flush();
  return runs;
}

function widthOf(text: string, font: PDFFont, size: number): number {
  if (!text) return 0;
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    // Missing glyph fallback width
    return [...text].length * size * 0.5;
  }
}

/**
 * Draw a logical string as a right-aligned RTL paragraph.
 * Glyphs are placed explicitly — no string reversing — so viewers won't double-flip Hebrew.
 */
export function drawAlignedRtl(
  page: PDFPage,
  text: string,
  opts: {
    font: PDFFont;
    size: number;
    right: number;
    y: number;
    color?: ReturnType<typeof rgb>;
  },
) {
  const { font, size, right, y } = opts;
  const color = opts.color ?? rgb(0.08, 0.12, 0.18);
  const runs = splitBidiRuns(text);
  if (!runs.length) return;

  // RTL paragraph: place runs from right to left
  let x = right;
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i];
    if (run.ltr) {
      const w = widthOf(run.text, font, size);
      x -= w;
      page.drawText(run.text, { x, y, size, font, color });
    } else {
      // Draw Hebrew (and neutrals in RTL runs) one glyph at a time, logical order, right→left
      for (const ch of [...run.text]) {
        const w = widthOf(ch, font, size);
        x -= w;
        page.drawText(ch, { x, y, size, font, color });
      }
    }
  }
}

function measureAlignedRtl(text: string, font: PDFFont, size: number): number {
  return splitBidiRuns(text).reduce((sum, run) => sum + widthOf(run.text, font, size), 0);
}

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
  push(rows, "מספר תביעה באופיר", claimNumber);
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
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  const fits = (s: string) => measureAlignedRtl(s, font, size) <= maxWidth;

  const pushHard = (token: string) => {
    let rest = token;
    while (rest) {
      let lo = 1;
      let hi = [...rest].length;
      let best = 1;
      const chars = [...rest];
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const slice = chars.slice(0, mid).join("");
        if (fits(slice)) {
          best = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      lines.push(chars.slice(0, best).join(""));
      rest = chars.slice(best).join("");
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

    const font = await pdf.embedFont(fontBytes, { subset: false });
    const latinBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const right = pageWidth - margin;

    let page: PDFPage = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawRight = (
      text: string,
      size: number,
      yPos: number,
      activeFont: PDFFont = font,
      color = rgb(0.08, 0.12, 0.18),
    ) => {
      drawAlignedRtl(page, text, { font: activeFont, size, right, y: yPos, color });
    };

    // Header bar
    page.drawRectangle({
      x: 0,
      y: pageHeight - 72,
      width: pageWidth,
      height: 72,
      color: rgb(0.06, 0.46, 0.43),
    });

    drawRight("תביעת ביטוח נסיעות · אופיר", 15, pageHeight - 32, font, rgb(1, 1, 1));
    page.drawText(`# ${claimNumber}`, {
      x: margin,
      y: pageHeight - 34,
      size: 14,
      font: latinBold,
      color: rgb(1, 1, 1),
    });
    y = pageHeight - 88;

    const fullName = String(claim.fullName || `${claim.firstName || ""} ${claim.lastName || ""}`).trim();
    drawRight(`שם המבוטח: ${fullName}`, 12, y);
    y -= 18;
    drawRight(`סוג תביעה: ${String(claim.claimTypeLabel || "")}`, 11, y);
    y -= 16;
    drawRight("מספר תביעה באופיר (לא מספר תביעה בהראל)", 9, y, font, rgb(0.35, 0.4, 0.45));
    y -= 20;

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

    drawRight(
      "נוצר אוטומטית מטופס התביעה באתר TravelSure · אופיר ושות׳ סוכנות לביטוח",
      8,
      28,
      font,
      rgb(0.45, 0.5, 0.55),
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
