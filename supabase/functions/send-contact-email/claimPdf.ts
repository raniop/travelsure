import { PDFDocument, PDFFont, PDFPage, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

/**
 * Bundled Heebo Regular — includes Hebrew + Latin digits/punctuation.
 */
const LOCAL_FONT_URL = new URL("./fonts/Heebo-Regular.ttf", import.meta.url);
const LOCAL_LOGO_URL = new URL("./assets/ophir-logo.png", import.meta.url);

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

type BidiRun = { text: string; ltr: boolean };
type Kv = { label: string; value: string };

const BLUE = rgb(0.05, 0.35, 0.72);
const BLACK = rgb(0.08, 0.1, 0.14);
const GRAY = rgb(0.35, 0.38, 0.42);
const LIGHT_ROW = rgb(0.94, 0.95, 0.96);

const isRtlChar = (ch: string) => /[\u0590-\u05FF]/.test(ch);
const isLtrStrong = (ch: string) => /[0-9A-Za-z]/.test(ch);

const RTL_MIRROR: Record<string, string> = {
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
  "«": "»",
  "»": "«",
};

export function mirrorRtlChar(ch: string): string {
  return RTL_MIRROR[ch] || ch;
}

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
    return [...text].length * size * 0.5;
  }
}

export function drawAlignedRtl(
  page: PDFPage,
  text: string,
  opts: {
    font: PDFFont;
    size: number;
    right: number;
    y: number;
    color?: ReturnType<typeof rgb>;
    maxWidth?: number;
  },
) {
  const { font, size, right, y } = opts;
  const color = opts.color ?? BLACK;
  const runs = splitBidiRuns(text);
  if (!runs.length) return;

  let x = right;
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i];
    if (run.ltr) {
      const w = widthOf(run.text, font, size);
      x -= w;
      page.drawText(run.text, { x, y, size, font, color });
    } else {
      for (const ch of [...run.text]) {
        const drawn = mirrorRtlChar(ch);
        const w = widthOf(drawn, font, size);
        x -= w;
        page.drawText(drawn, { x, y, size, font, color });
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

/** Display dates as DD/MM/YYYY (e.g. 11/08/1986). */
export function formatClaimDateDisplay(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) {
    return `${dmy[1].padStart(2, "0")}/${dmy[2].padStart(2, "0")}/${dmy[3]}`;
  }
  const digits = s.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
  return s;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const value = String(text ?? "").trim();
  if (!value) return [];
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
  return lines;
}

function claimTypeSubject(claim: Record<string, unknown>): string {
  const type = String(claim.claimType || "").trim();
  const label = String(claim.claimTypeLabel || "").trim();
  if (type === "trip_cancel") return 'תביעת חו״ל- ביטול נסיעה';
  if (type === "trip_shorten") return 'תביעת חו״ל- קיצור נסיעה';
  if (type === "medical") return 'תביעת חו״ל- הוצאות רפואיות';
  if (type === "baggage") {
    const sub = String(claim.baggageSubtypeLabel || "").trim();
    return sub ? `תביעת חו״ל- מטען / כבודה · ${sub}` : 'תביעת חו״ל- מטען / כבודה';
  }
  return label ? `תביעת חו״ל- ${label}` : 'תביעת חו״ל';
}

function kv(label: string, value: unknown): Kv | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  return { label, value: v };
}

function buildIncidentRows(claim: Record<string, unknown>): Kv[] {
  const type = String(claim.claimType || "").trim();
  const rows: Kv[] = [];
  const add = (label: string, value: unknown) => {
    const item = kv(label, value);
    if (item) rows.push(item);
  };

  if (type === "trip_cancel") {
    add("האם בוצעו שינויים בתוכנית הנסיעה?", "כן, היא בוטלה");
    add("מה סיבת השינוי?", claim.claimReason);
    add("מה קרה?", claim.claimReason);
    add("מתי זה קרה?", formatClaimDateDisplay(claim.incidentDate || claim.tripStartDate));
    add("איפה זה קרה?", claim.country);
    add("פירוט המקרה", claim.details);
  } else if (type === "trip_shorten") {
    add("האם בוצעו שינויים בתוכנית הנסיעה?", "כן, היא קוצרה");
    add("מה סיבת השינוי?", claim.claimReason);
    add("מתי זה קרה?", formatClaimDateDisplay(claim.incidentDate));
    add("איפה זה קרה?", claim.country);
    add("תאריך יציאה", formatClaimDateDisplay(claim.tripStartDate));
    add("תאריך חזרה", formatClaimDateDisplay(claim.tripEndDate));
    add("פירוט המקרה", claim.details);
  } else if (type === "medical") {
    add("מה קרה?", claim.claimTypeLabel || "הוצאות רפואיות בחו״ל");
    add("מתי זה קרה?", formatClaimDateDisplay(claim.incidentDate));
    add("איפה זה קרה?", claim.country);
    add("פירוט המקרה", claim.details);
    add("סכום נתבע", claim.totalClaimed || claim.amount);
  } else if (type === "baggage") {
    add("סוג תביעת מטען", claim.baggageSubtypeLabel);
    add("מתי זה קרה?", formatClaimDateDisplay(claim.incidentDate));
    add("איפה זה קרה?", claim.country);
    add("פירוט המקרה", claim.details);
    add("סכום נתבע", claim.totalClaimed || claim.amount);
  } else {
    add("סוג תביעה", claim.claimTypeLabel);
    add("מתי זה קרה?", formatClaimDateDisplay(claim.incidentDate));
    add("איפה זה קרה?", claim.country);
    add("פירוט המקרה", claim.details);
  }
  return rows;
}

function parseExpenses(claim: Record<string, unknown>): Array<{ type: string; amount: string; date: string }> {
  const out: Array<{ type: string; amount: string; date: string }> = [];
  if (Array.isArray(claim.expenses)) {
    for (const item of claim.expenses) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const type = String(row.type || "הוצאה").trim() || "הוצאה";
      const amount = String(row.amount || "").trim();
      const date = formatClaimDateDisplay(row.date);
      if (type || amount || date) out.push({ type, amount, date });
    }
  }
  return out;
}

function buildExpenseRows(claim: Record<string, unknown>): Kv[] {
  const rows: Kv[] = [];
  // Baggage item lines (purchase price) — expenses are drawn separately.
  if (Array.isArray(claim.baggageItems)) {
    for (const item of claim.baggageItems) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const label = String(row.item || "").trim();
      if (!label) continue;
      const value = String(row.purchasePrice || "").trim();
      rows.push({ label, value: value || "—" });
    }
  }
  if (!rows.length && !parseExpenses(claim).length) {
    const total = String(claim.totalClaimed || claim.amount || "").trim();
    if (total) rows.push({ label: "סכום נתבע", value: total });
  }
  return rows;
}

function buildPaymentRows(claim: Record<string, unknown>): Kv[] {
  const fullName = String(claim.fullName || `${claim.firstName || ""} ${claim.lastName || ""}`).trim();
  const branch = [claim.branchNumber, claim.branchName].map((v) => String(v || "").trim()).filter(Boolean).join(" - ");
  const bank = [claim.bankCode, claim.bankName].map((v) => String(v || "").trim()).filter(Boolean).join(" - ");
  return [
    kv('ת"ז מוטב', claim.idNumber),
    kv("שם מלא מוטב", fullName),
    kv("מס' חשבון בנק", claim.accountNumber),
    kv("שם +מס' סניף", branch),
    kv("שם +מס' בנק", bank || claim.bankName),
  ].filter(Boolean) as Kv[];
}

function buildDocumentRows(attachmentNames: string[]): Kv[] {
  return attachmentNames
    .map((name) => String(name || "").trim())
    .filter(Boolean)
    .map((name) => ({ label: "מסמך מצורף", value: name }));
}

function formatSubmittedAt(value: unknown): string {
  const s = String(value || "").trim();
  if (!s) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mi} ${dd}/${mm}/${yyyy}`;
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (m) return `${m[4]}:${m[5]} ${m[3]}/${m[2]}/${m[1]}`;
  const d = formatClaimDateDisplay(s);
  return d || s;
}

export async function buildClaimPdfBase64(
  claim: Record<string, unknown>,
  claimNumber: string,
  attachmentNames: string[],
): Promise<{ filename: string; content: string; type: string } | null> {
  try {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const fontBytes = await loadClaimFontBytes();
    if (!fontBytes) {
      console.error("buildClaimPdfBase64: no Hebrew-capable font available");
      return null;
    }

    const font = await pdf.embedFont(fontBytes, { subset: false });

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    const right = pageWidth - margin;
    const left = margin;

    let page: PDFPage = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const ensureSpace = (needed: number) => {
      if (y - needed >= 56) return;
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    };

    const drawRight = (
      text: string,
      size: number,
      yPos: number,
      color = BLACK,
      atRight = right,
    ) => {
      drawAlignedRtl(page, text, { font, size, right: atRight, y: yPos, color });
    };

    const drawOphirBrand = async () => {
      // Top-left: Ophir agency logo
      let logoDrawn = false;
      try {
        const logoBytes = await Deno.readFile(LOCAL_LOGO_URL);
        if (logoBytes.byteLength > 500) {
          const logo = await pdf.embedPng(logoBytes);
          const maxH = 56;
          const scale = maxH / logo.height;
          const w = logo.width * scale;
          const h = logo.height * scale;
          page.drawImage(logo, {
            x: left,
            y: pageHeight - margin - h + 8,
            width: w,
            height: h,
          });
          logoDrawn = true;
        }
      } catch (err) {
        console.error("Ophir logo embed failed:", err);
      }
      if (!logoDrawn) {
        drawAlignedRtl(page, "אופיר ושות׳", {
          font,
          size: 14,
          right: left + 110,
          y: pageHeight - margin - 2,
          color: BLACK,
        });
        drawAlignedRtl(page, "סוכנות לביטוח", {
          font,
          size: 9,
          right: left + 110,
          y: pageHeight - margin - 18,
          color: GRAY,
        });
      }
    };

    /** Label (RTL) on the right, value to its left — avoids reversed mixed bidi lines. */
    const drawLabelValue = (
      label: string,
      value: string,
      size: number,
      yPos: number,
      color = BLACK,
    ) => {
      const labelText = label.endsWith(":") ? label : `${label}:`;
      const labelW = measureAlignedRtl(labelText, font, size);
      drawAlignedRtl(page, labelText, { font, size, right, y: yPos, color });
      if (value) {
        // LTR values (numbers/dates) drawn left of the Hebrew label
        const gap = 6;
        const vw = widthOf(value, font, size);
        page.drawText(value, {
          x: right - labelW - gap - vw,
          y: yPos,
          size,
          font,
          color,
        });
      }
    };

    // ---- Header (page 1) ----
    await drawOphirBrand();
    const subject = claimTypeSubject(claim);
    const today = formatClaimDateDisplay(claim.submittedAt) || formatClaimDateDisplay(new Date().toISOString().slice(0, 10));
    drawRight("אופיר ושות׳ סוכנות לביטוח", 11, pageHeight - margin - 2, BLACK);
    drawRight(subject, 11, pageHeight - margin - 18, BLACK);
    drawLabelValue("מספר פניה באופיר", String(claimNumber), 11, pageHeight - margin - 34, BLACK);
    drawLabelValue("תאריך", today, 11, pageHeight - margin - 50, BLACK);
    y = pageHeight - margin - 88;

    const sectionTitle = (title: string) => {
      ensureSpace(36);
      drawRight(title, 14, y, BLUE);
      y -= 8;
      page.drawLine({
        start: { x: left, y },
        end: { x: right, y },
        thickness: 1.2,
        color: BLUE,
      });
      y -= 16;
    };

    const drawKvRows = (rows: Kv[], opts?: { labelBlue?: boolean }) => {
      for (const row of rows) {
        const label = `${row.label}${row.label.endsWith("?") || row.label.endsWith(":") ? "" : ":"}`;
        const labelWidth = Math.min(contentWidth * 0.55, measureAlignedRtl(label, font, 10) + 8);
        const valueWidth = contentWidth - labelWidth - 10;
        const valueLines = wrapText(row.value, font, 10, valueWidth);
        const blockH = Math.max(14, valueLines.length * 13);
        ensureSpace(blockH + 6);
        drawRight(label, 10, y, opts?.labelBlue ? BLUE : BLACK);
        let vy = y;
        for (const line of valueLines) {
          drawAlignedRtl(page, line, {
            font,
            size: 10,
            right: right - labelWidth - 8,
            y: vy,
            color: BLACK,
          });
          vy -= 13;
        }
        y -= blockH + 4;
      }
    };

    const drawParagraph = (text: string, size = 9.5, color = BLACK) => {
      const lines = wrapText(text, font, size, contentWidth);
      for (const line of lines) {
        ensureSpace(14);
        drawRight(line, size, y, color);
        y -= 13;
      }
    };

    const drawBullets = (items: string[]) => {
      for (const item of items) {
        const lines = wrapText(item, font, 9, contentWidth - 14);
        ensureSpace(lines.length * 12 + 4);
        // bullet near the right edge
        page.drawCircle({ x: right - 3, y: y + 3, size: 1.4, color: BLACK });
        let ly = y;
        for (const line of lines) {
          drawAlignedRtl(page, line, { font, size: 9, right: right - 12, y: ly, color: BLACK });
          ly -= 12;
        }
        y = ly - 4;
      }
    };

    const fullName = String(claim.fullName || `${claim.firstName || ""} ${claim.lastName || ""}`).trim();

    // ---- Sections ----
    sectionTitle("פרטי המבוטח");
    drawKvRows([
      ...(kv("שם מלא", fullName) ? [kv("שם מלא", fullName)!] : []),
      ...(kv("תעודת זהות", claim.idNumber) ? [kv("תעודת זהות", claim.idNumber)!] : []),
      ...(kv("מספר פוליסה", claim.policyNumber) ? [kv("מספר פוליסה", claim.policyNumber)!] : []),
    ]);
    y -= 8;

    sectionTitle("פרטי התקשרות");
    drawKvRows([
      ...(kv("מספר טלפון", claim.mobile || claim.phone) ? [kv("מספר טלפון", claim.mobile || claim.phone)!] : []),
      ...(kv("דואר אלקטרוני", claim.email) ? [kv("דואר אלקטרוני", claim.email)!] : []),
    ]);
    y -= 8;

    sectionTitle("פרטי המקרה");
    drawKvRows(buildIncidentRows(claim), { labelBlue: true });
    if (String(claim.claimType || "") === "trip_cancel") {
      ensureSpace(18);
      drawRight("הנסיעה בוטלה", 10, y, BLACK);
      y -= 16;
    }
    y -= 6;

    // Who cancelled — only for trip cancellation claims (same kv style as other sections)
    if (String(claim.claimType || "") === "trip_cancel") {
      sectionTitle("מי ביטל את הנסיעה");
      drawKvRows([
        ...(kv("שם המבוטח", fullName) ? [kv("שם המבוטח", fullName)!] : []),
        ...(kv('ת"ז', claim.idNumber) ? [kv('ת"ז', claim.idNumber)!] : []),
      ]);
      y -= 8;
    }

    // Expenses — draw type / date / amount as separate RTL-safe lines
    const expenses = parseExpenses(claim);
    const expenseRows = buildExpenseRows(claim);
    if (expenses.length || expenseRows.length) {
      sectionTitle("פירוט ההוצאות");
      for (const exp of expenses) {
        ensureSpace(48);
        drawRight(exp.type, 10, y, BLACK);
        y -= 14;
        if (exp.date) {
          drawLabelValue("תאריך", exp.date, 10, y, BLACK);
          y -= 14;
        }
        if (exp.amount) {
          drawLabelValue("סכום", exp.amount, 10, y, BLACK);
          y -= 14;
        }
        y -= 6;
      }
      if (expenseRows.length) {
        drawKvRows(expenseRows);
      }
      if (String(claim.country || "").trim() && String(claim.claimType || "") !== "trip_cancel") {
        drawKvRows([kv("ארץ יעד / מיקום", claim.country)!].filter(Boolean) as Kv[]);
      }
      y -= 8;
    }

    // Payment
    const paymentRows = buildPaymentRows(claim);
    if (paymentRows.length) {
      sectionTitle("אמצעי תשלום להעברת סכום החזר עבור התביעה");
      drawKvRows(paymentRows);
      y -= 8;
    }

    // Documents
    const docRows = buildDocumentRows(attachmentNames);
    if (docRows.length) {
      sectionTitle('מסמכים שהועלו ע"י המשתמש');
      drawKvRows(docRows);
      y -= 8;
    }

    // Declarations
    sectionTitle("הצהרות");
    drawBullets([
      "פרטיי האישיים המוזכרים לעיל הינם הפרטים הנכונים והמעודכנים ובאים במקום כל עדכון קודם. ידוע לי כי הפרטים ישמשו לצורך בירור וטיפול בתביעה.",
      "ידוע לי כי מסירת מידע כוזב או חלקי עלולה לפגוע בזכויותיי על פי הפוליסה ועל פי דין.",
      "אני מאשר/ת לאופיר ושות׳ סוכנות לביטוח ולמי מטעמה לקבל ולעבד את המידע שמסרתי לצורך טיפול בתביעה, לרבות מידע רפואי ככל שנדרש ואושר על ידי.",
      "אני מאשר/ת לסוכן הביטוח (אופיר ושות׳ סוכנות לביטוח) לטפל בתביעה זו בשמי מול חברת הביטוח.",
      "אני מסכים/ה לקבל עדכונים בנוגע לתביעה באמצעות מסרון ו/או טלפון ו/או דואר אלקטרוני.",
    ]);
    if (yesNo(claim.declaration) === "כן") {
      ensureSpace(16);
      drawRight("ההצהרה אושרה בטופס הדיגיטלי: כן", 9, y, GRAY);
      y -= 14;
    }
    y -= 8;

    // Company notes
    ensureSpace(70);
    drawRight("הבהרות החברה", 12, y, BLACK);
    y -= 6;
    page.drawLine({
      start: { x: left, y },
      end: { x: right, y },
      thickness: 1,
      color: BLACK,
    });
    y -= 14;
    drawParagraph(
      "ניתן לקבל מסמכים ומכתבים גם באמצעים אלקטרוניים (דואר אלקטרוני), בהתאם לפרטים שמסרת בטופס.",
      9,
      BLACK,
    );
    y -= 6;
    drawRight("פרטיות", 10, y, BLACK);
    y -= 14;
    drawParagraph(
      "אופיר ושות׳ סוכנות לביטוח אוספת ומשתמשת במידע האישי שמסרת לצורך טיפול בתביעה, מתן שירות ומילוי חובות על פי דין. המידע יישמר ויעובד בהתאם לדין.",
      9,
      BLACK,
    );
    y -= 10;

    // Signatures table
    sectionTitle("חתימות המבקש");
    ensureSpace(56);
    page.drawRectangle({
      x: left,
      y: y - 34,
      width: contentWidth,
      height: 38,
      color: LIGHT_ROW,
    });
    const colW = contentWidth / 4;
    const headers = ["תאריך ושעת הבקשה", "שם המוטב", "שם מבקש הטיפול", "חתימה"];
    const values = [
      formatSubmittedAt(claim.submittedAt),
      fullName || "—",
      fullName || "—",
      "הטופס הועבר באמצעות אתר אינטרנט",
    ];
    headers.forEach((h, i) => {
      const colRight = right - i * colW - 4;
      drawAlignedRtl(page, h, { font, size: 8, right: colRight, y, color: BLUE });
    });
    y -= 16;
    values.forEach((v, i) => {
      const colRight = right - i * colW - 4;
      drawAlignedRtl(page, v, { font, size: 8, right: colRight, y, color: BLACK });
    });
    y -= 36;

    // Footer on last page
    drawAlignedRtl(page, "הופק באמצעות מערכת הגשת תביעות TravelSure · אופיר ושות׳ סוכנות לביטוח", {
      font,
      size: 8,
      right: pageWidth / 2 + 140,
      y: 36,
      color: GRAY,
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
