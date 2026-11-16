/**
 * Fill Harel's First Class annual business-traveller proposal (51878.15 "שנתית" or 51878.21
 * "שנתית מורחבת") from the digital /annual flow. The templates are flat PDFs, so values are drawn
 * at positions measured on the blank forms. Pages 1–2 are the same in both forms; the plan page,
 * the declarations and the payment differ, hence one layout per form.
 */
import { PDFDocument, PDFFont, PDFPage, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import * as fontkitModule from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
const fontkit = ("default" in fontkitModule ? fontkitModule.default : fontkitModule) as typeof fontkitModule;
import { ANNUAL_BASIC_PDF_BASE64, ANNUAL_EXTENDED_PDF_BASE64, decodeBase64, HEEBO_FONT_BASE64 } from "./embeddedAssets.ts";

const INK = rgb(0.05, 0.18, 0.42);
const PAGE_H = 841.89;
const AGENT_NO = "59795";
const AGENT_NAME = "אופיר ושות׳ סוכנות לביטוח";

export type AnnualPdfInput = {
  plan?: string; // basic | extended
  periodFrom?: string;
  periodTo?: string;
  street?: string;
  houseNo?: string;
  city?: string;
  occupation?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  israeliResident?: boolean;
  inIsrael?: boolean;
  gender?: string;
  idNumber?: string;
  lastName?: string;
  firstName?: string;
  birthDate?: string;
  health?: {
    q1?: string;
    q2?: string;
    q21?: string[];
    q22?: string;
    q3?: string;
    q31?: string;
    q4?: string;
    q4Details?: string;
    q5?: string;
  };
  laptopModel?: string;
  phoneModel?: string;
  rentalCar?: boolean;
  marketingConsentExtra?: boolean;
  signatureName?: string;
  signatureDate?: string;
  payerName?: string;
  payerId?: string;
  installments?: string;
  cardNumber?: string;
  cardExp?: string;
  cardCvv?: string;
  payerStreet?: string;
  payerHouseNo?: string;
  payerCity?: string;
  payerZip?: string;
  payerPhone?: string;
  payerMobile?: string;
};

type Cells = number[];
type Layout = {
  template: string;
  name: string;
  /** Page indexes */
  planPage: number;
  declPage: number;
  payPage: number;
  /** Health: Q4 and Q5 rows sit 1.2pt lower in the basic form */
  q4Y: number;
  q4DetailsBaseline: number;
  q5Y: number;
  /** Plan page */
  laptopBaseline: number;
  phoneBaseline: number;
  /** Basic only: rental-car rider row (main insured column centre, baseline) */
  rentalMark?: [number, number];
  /** Declarations page */
  marketingBoxTop: number;
  sigRowCenter: number; // digit centre in the signature row
  sigNameBaseline: number;
  witnessBaselines: [number, number]; // תאריך/שם row, מס' רישיון row
  agentDeclBaseline: number;
  agentDeclNameRight: number;
  /** Payment rows: baselines of the values and the vertical centre of the digit combs */
  pay: { r1: number; r1Digits: number; r2: number; r2Digits: number; r3: number; r4: number };
  payDateBaseline: number;
  cardholderSigRight: number;
};

const EXTENDED: Layout = {
  template: ANNUAL_EXTENDED_PDF_BASE64,
  name: "Annual_Extended",
  planPage: 2,
  declPage: 3,
  payPage: 4,
  q4Y: 461.6,
  q4DetailsBaseline: 464.3,
  q5Y: 520.6,
  laptopBaseline: 234.3,
  phoneBaseline: 260.4,
  marketingBoxTop: 254.8,
  sigRowCenter: 457,
  sigNameBaseline: 460,
  witnessBaselines: [490.5, 508.2],
  agentDeclBaseline: 600.1,
  agentDeclNameRight: 355,
  // Rows 27.5–53 | 53–78.5 | 78.5–101.2 | 101.2–123.9
  pay: { r1: 49, r1Digits: 45.5, r2: 74.5, r2Digits: 71, r3: 98, r4: 120.5 },
  payDateBaseline: 261.7,
  cardholderSigRight: 160,
};

const BASIC: Layout = {
  template: ANNUAL_BASIC_PDF_BASE64,
  name: "Annual",
  planPage: 2,
  declPage: 3,
  payPage: 3,
  q4Y: 462.2,
  q4DetailsBaseline: 465.5,
  q5Y: 521.8,
  laptopBaseline: 195,
  phoneBaseline: 221.1,
  rentalMark: [131, 257.9],
  marketingBoxTop: 246.6,
  sigRowCenter: 436.5,
  sigNameBaseline: 439.5,
  witnessBaselines: [472.8, 490.5],
  agentDeclBaseline: 571.1,
  agentDeclNameRight: 372,
  // Rows 590.3–613 | 613–635.6 | 635.6–658.3 | 658.3–681 (shorter than in the extended form)
  pay: { r1: 609.5, r1Digits: 606.5, r2: 632, r2Digits: 629, r3: 655, r4: 677.5 },
  payDateBaseline: 801.3,
  cardholderSigRight: 197,
};

/* Page 1 — identical in both forms */
const PERIOD_FROM: [number, number][] = [[441, 470.7], [473.7, 506.2], [509.2, 540]];
const PERIOD_TO: [number, number][] = [[321, 353.6], [356.6, 389.1], [392.1, 423]];
const ID_TICKS: Cells = [328.3, 343.2, 358.2, 373.2, 388.3, 403.3, 418.3, 433.3, 448.3, 463.5];
const DOB_TICKS: Cells = [28.4, 43.5, 58.6, 73.6, 88.7, 103.8, 118.5];
/* Health page — one insured: yes 74.3–120, no 28.6–74.3 */
const YES_COL: [number, number] = [74.3, 120];
const NO_COL: [number, number] = [28.6, 74.3];
const Q21_BOX_TOP: Record<string, number> = { dialysis: 190.8, blood: 203.6, cancer: 216.5, neuro: 229.3, liver: 252.1 };
/* Declarations — signature row */
const SIG_DATE_TICKS: Cells = [386.1, 404.2, 420.7, 437.2, 453.7, 470.2, 486.9];
const SIG_ID_TICKS: Cells = [143.7, 161.6, 177.3, 193.1, 208.8, 224.5, 240.3, 256, 271.8, 287.7];
/* Payment — same grid in both forms, shifted by payOffset */
const PAYER_ID_TICKS: Cells = [173, 189.6, 206.1, 222.7, 239.3, 255.8, 272.4, 288.9, 305.5, 322.1];
const CARD_TICKS: Cells = Array.from({ length: 17 }, (_, i) => 288.9 + i * ((553.9 - 288.9) / 16));

const s = (v: unknown) => String(v ?? "").trim();
const topY = (top: number) => PAGE_H - top;
const hasHebrew = (text: string) => /[֐-׿]/.test(text);
const isYes = (v: unknown) => ["yes", "כן", "true", "1"].includes(s(v).toLowerCase());
const isNo = (v: unknown) => ["no", "לא", "false", "0"].includes(s(v).toLowerCase());
const digitsOnly = (v: unknown) => s(v).replace(/\D/g, "");

const pad2 = (n: string) => String(n || "").padStart(2, "0");
const formatDate = (value: unknown): string => {
  const raw = s(value);
  const iso = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${pad2(dmy[1])}/${pad2(dmy[2])}/${dmy[3]}`;
  return raw;
};
/** DDMMYY for the 6-cell date combs */
const dateDigits6 = (value: unknown) => {
  const m = formatDate(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[1]}${m[2]}${m[3].slice(2)}` : "";
};

function widthOf(text: string, font: PDFFont, size: number): number {
  if (!text) return 0;
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    return [...text].length * size * 0.55;
  }
}

const RTL_MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[" };
const NUMBER_AT = /^[%$€£₪]*\d+(?:[.,:/+-]\d+)*[%$€£₪]*/;
const LATIN_AT = /^[A-Za-z][^֐-׿]*/;
const TRAILING_NEUTRALS = /[^0-9A-Za-z%$€£₪]+$/;

/** Runs in reading order for a right-to-left line: numbers and Latin text stay left-to-right. */
function bidiRuns(text: string): Array<{ text: string; ltr: boolean }> {
  if (!hasHebrew(text)) return [{ text, ltr: true }];
  const runs: Array<{ text: string; ltr: boolean }> = [];
  let rtl = "";
  let pos = 0;
  while (pos < text.length) {
    const rest = text.slice(pos);
    const match = rest.match(NUMBER_AT) ?? rest.match(LATIN_AT);
    if (!match) {
      rtl += text[pos];
      pos += 1;
      continue;
    }
    const ltr = match[0].replace(TRAILING_NEUTRALS, "");
    if (rtl) runs.push({ text: rtl, ltr: false });
    rtl = "";
    runs.push({ text: ltr, ltr: true });
    pos += ltr.length;
  }
  if (rtl) runs.push({ text: rtl, ltr: false });
  return runs;
}

/** Shrinks the size (down to 6pt) and then trims until the text fits. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number) {
  let used = size;
  let draw = text;
  while (used > 6 && widthOf(draw, font, used) > maxWidth) used -= 0.5;
  while (draw.length > 1 && widthOf(draw, font, used) > maxWidth) draw = draw.slice(0, -1);
  return { draw, used };
}

/** Right-aligned text ending at `right` (Hebrew in reading order), on the baseline `base`. */
function drawRight(page: PDFPage, font: PDFFont, value: unknown, right: number, base: number, size: number, maxWidth: number) {
  const text = s(value).replace(/\s+/g, " ");
  if (!text) return;
  const { draw, used } = fit(text, font, size, maxWidth);
  let cursor = right;
  for (const run of bidiRuns(draw)) {
    if (run.ltr) {
      cursor -= widthOf(run.text, font, used);
      page.drawText(run.text, { x: cursor, y: topY(base), size: used, font, color: INK });
    } else {
      for (const ch of [...run.text]) {
        const glyph = RTL_MIRROR[ch] || ch;
        cursor -= widthOf(glyph, font, used);
        page.drawText(glyph, { x: cursor, y: topY(base), size: used, font, color: INK });
      }
    }
  }
}

/** Left-aligned text (numbers, e-mail); Hebrew falls back to right-aligned within the width. */
function drawLeft(page: PDFPage, font: PDFFont, value: unknown, left: number, base: number, size: number, maxWidth: number) {
  const text = s(value).replace(/\s+/g, " ");
  if (!text) return;
  if (hasHebrew(text)) return drawRight(page, font, text, left + maxWidth, base, size, maxWidth);
  const { draw, used } = fit(text, font, size, maxWidth);
  page.drawText(draw, { x: left, y: topY(base), size: used, font, color: INK });
}

function drawCentered(page: PDFPage, font: PDFFont, text: string, x0: number, x1: number, base: number, size: number) {
  if (!text) return;
  const w = widthOf(text, font, size);
  page.drawText(text, { x: (x0 + x1 - w) / 2, y: topY(base), size, font, color: INK });
}

/** One character per cell; `center` is the vertical middle of the digits. */
function drawDigits(page: PDFPage, font: PDFFont, value: string, ticks: Cells, center: number, size = 10) {
  const chars = [...value].slice(0, ticks.length - 1);
  chars.forEach((ch, i) => drawCentered(page, font, ch, ticks[i], ticks[i + 1], center + size * 0.35, size));
}

/** X inside an 8pt checkbox whose top-left corner is (x, top). */
function markBox(page: PDFPage, font: PDFFont, x: number, top: number) {
  const size = 8.5;
  const w = widthOf("X", font, size);
  page.drawText("X", { x: x + (8.1 - w) / 2, y: topY(top + 7.2), size, font, color: INK });
}

/** X centred in the column [x0, x1] around the row middle `center`. */
function markCell(page: PDFPage, font: PDFFont, [x0, x1]: [number, number], center: number, size = 9) {
  drawCentered(page, font, "X", x0, x1, center + size * 0.35, size);
}

/** Date in a "__/__/__" line: day | month | 2-digit year, centred in each slot. */
function drawDateSlots(page: PDFPage, font: PDFFont, value: unknown, slots: [number, number][], base: number, size = 9) {
  const d = dateDigits6(value);
  if (d.length !== 6) return;
  [d.slice(0, 2), d.slice(2, 4), d.slice(4, 6)].forEach((part, i) => drawCentered(page, font, part, slots[i][0], slots[i][1], base, size));
}

function fill(pages: PDFPage[], font: PDFFont, L: Layout, data: AnnualPdfInput) {
  const [p1, p2] = pages;
  const signDate = formatDate(data.signatureDate);

  /* Page 1 — agent, period, address, insured */
  drawRight(p1, font, AGENT_NAME, 137, 124.2, 8, 104);
  drawLeft(p1, font, AGENT_NO, 60, 146.5, 9, 75);
  drawDateSlots(p1, font, data.periodFrom, PERIOD_FROM, 274);
  drawDateSlots(p1, font, data.periodTo, PERIOD_TO, 274);

  // Address row (labels at 373): street 349.9–554.2 | no. 303.8–349.9 | town 166.2–303.8 | occupation 28.6–166.2
  drawRight(p1, font, data.street, 548, 387, 9, 195);
  drawLeft(p1, font, data.houseNo, 308, 387, 9, 40);
  drawRight(p1, font, data.city, 300, 387, 9, 130);
  drawRight(p1, font, data.occupation, 163, 387, 9, 132);
  // Contact row (labels at 401.5): phone 434.4–554.2 | mobile 303.8–434.4 | e-mail split at the printed "@" (158.4–168.5)
  drawLeft(p1, font, data.phone, 440, 416, 9, 110);
  drawLeft(p1, font, data.mobile, 309, 416, 9, 120);
  const email = s(data.email);
  const at = email.indexOf("@");
  if (at > 0) {
    drawRight(p1, font, email.slice(0, at), 156, 417, 8.5, 122);
    drawLeft(p1, font, email.slice(at + 1), 171, 417, 8.5, 128);
  } else {
    drawLeft(p1, font, email, 171, 417, 8.5, 128);
  }
  if (data.israeliResident !== false) markBox(p1, font, 361.6, 463.6);
  if (data.inIsrael !== false) markBox(p1, font, 340.6, 475.4);

  // Main insured row 497.5–521.9
  const gender = s(data.gender).toLowerCase();
  if (gender === "male" || gender === "זכר") markBox(p1, font, 489.2, 506);
  if (gender === "female" || gender === "נקבה") markBox(p1, font, 471.7, 506);
  drawDigits(p1, font, digitsOnly(data.idNumber), ID_TICKS, 512);
  drawRight(p1, font, data.lastName, 325, 515, 9.5, 98);
  drawRight(p1, font, data.firstName, 220, 515, 9.5, 98);
  drawDigits(p1, font, dateDigits6(data.birthDate), DOB_TICKS, 512);

  /* Page 2 — health (one insured) */
  const h = data.health || {};
  const yn = (answer: unknown, center: number) => {
    if (isYes(answer)) markCell(p2, font, YES_COL, center);
    else if (isNo(answer)) markCell(p2, font, NO_COL, center);
  };
  yn(h.q1 || "no", 69.2);
  yn(h.q2 || "no", 109.6);
  if (isYes(h.q2)) {
    const picked = (h.q21 || []).filter((id) => Q21_BOX_TOP[id] != null);
    for (const id of picked) markBox(p2, font, 512.7, Q21_BOX_TOP[id]);
    yn(picked.length ? "yes" : "no", 218.7);
    yn(h.q22 || "no", 280.9);
  }
  yn(h.q3 || "no", 343.2);
  if (isYes(h.q3)) yn(h.q31, 406.7);
  yn(h.q4 || "no", L.q4Y);
  // Q4 details after "פרוט הבדיקות:" (label at 485.5)
  if (isYes(h.q4)) drawRight(p2, font, h.q4Details, 482, L.q4DetailsBaseline, 8, 356);
  if (gender === "female" || gender === "נקבה") yn(h.q5 || "no", L.q5Y);

  /* Plan page — device models on their "דגם" lines; the basic form's paid rental-car rider */
  const plan = pages[L.planPage];
  drawRight(plan, font, data.laptopModel, 534, L.laptopBaseline, 8.5, 200);
  drawRight(plan, font, data.phoneModel, 534, L.phoneBaseline, 8.5, 200);
  if (L.rentalMark && data.rentalCar) {
    const [cx, base] = L.rentalMark;
    drawCentered(plan, font, "X", cx - 10, cx + 10, base, 10);
  }

  /* Declarations page */
  const decl = pages[L.declPage];
  if (data.marketingConsentExtra) markBox(decl, font, 519.5, L.marketingBoxTop);
  const fullName = [s(data.firstName), s(data.lastName)].filter(Boolean).join(" ");
  drawDigits(decl, font, dateDigits6(signDate), SIG_DATE_TICKS, L.sigRowCenter);
  drawRight(decl, font, fullName, 383, L.sigNameBaseline, 9, 92);
  drawDigits(decl, font, digitsOnly(data.idNumber), SIG_ID_TICKS, L.sigRowCenter);
  drawRight(decl, font, s(data.signatureName) || fullName, 122, L.sigNameBaseline, 9, 86);
  // Witness to the signature (the agent), first row: date | name | licence no. (the second row is stamp and signature)
  const [w1] = L.witnessBaselines;
  drawLeft(decl, font, signDate, 440, w1 - 1, 8.5, 80);
  drawRight(decl, font, AGENT_NAME, 399, w1 - 1, 8.5, 98);
  drawLeft(decl, font, AGENT_NO, 50, w1 - 1, 8.5, 75);
  // Agent's declaration: date, agent name
  drawLeft(decl, font, signDate, 440, L.agentDeclBaseline - 1, 8.5, 80);
  drawRight(decl, font, AGENT_NAME, L.agentDeclNameRight, L.agentDeclBaseline - 1, 8.5, 118);

  /* Payment */
  const pay = pages[L.payPage];
  const P = L.pay;
  drawRight(pay, font, data.payerName, 550, P.r1, 9.5, 220);
  drawDigits(pay, font, digitsOnly(data.payerId), PAYER_ID_TICKS, P.r1Digits);
  drawCentered(pay, font, digitsOnly(data.installments) || "1", 28.3, 113, P.r1, 11);
  drawDigits(pay, font, digitsOnly(data.cardNumber).slice(0, 16), CARD_TICKS, P.r2Digits);
  const exp = digitsOnly(data.cardExp);
  if (exp.length >= 4) {
    drawCentered(pay, font, exp.slice(0, 2), 173, 232.4, P.r2, 10);
    drawCentered(pay, font, exp.slice(2, 4), 232.4, 288.9, P.r2, 10);
  }
  const cvv = digitsOnly(data.cardCvv).slice(0, 4);
  drawCentered(pay, font, cvv.split("").join(" "), 28.3, 173, P.r2, 10);
  // Row 3: street 338.6–553.9 | no. 272.4–338.6 | town 83–272.4 | zip 28.3–83 ; row 4: phone 272.4–553.9 | mobile 28.3–272.4
  drawRight(pay, font, data.payerStreet, 550, P.r3, 9, 205);
  drawLeft(pay, font, data.payerHouseNo, 277, P.r3, 9, 58);
  drawRight(pay, font, data.payerCity, 268, P.r3, 9, 180);
  drawLeft(pay, font, data.payerZip, 32, P.r3, 9, 50);
  drawLeft(pay, font, data.payerPhone, 277, P.r4, 9, 140);
  drawLeft(pay, font, data.payerMobile, 32, P.r4, 9, 140);
  drawLeft(pay, font, signDate, 440, L.payDateBaseline - 1, 8.5, 80);
  drawRight(pay, font, data.payerName, L.cardholderSigRight, L.payDateBaseline - 1, 9, L.cardholderSigRight - 35);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export async function buildAnnualPdfBase64(input: AnnualPdfInput): Promise<{ filename: string; content: string; type: string } | null> {
  try {
    const L = s(input.plan) === "extended" ? EXTENDED : BASIC;
    const pdf = await PDFDocument.load(decodeBase64(L.template));
    pdf.registerFontkit(fontkit);
    const font = await pdf.embedFont(decodeBase64(HEEBO_FONT_BASE64), { subset: true });
    fill(pdf.getPages(), font, L, input);
    const bytes = await pdf.save();
    const who = [s(input.firstName), s(input.lastName)].filter(Boolean).join("_").replace(/[^\w.֐-׿-]+/g, "_").slice(0, 40) || "applicant";
    return { filename: `Harel_First_Class_${L.name}_${who}.pdf`, content: uint8ToBase64(bytes), type: "application/pdf" };
  } catch (err) {
    console.error("buildAnnualPdfBase64 failed:", err);
    return null;
  }
}
