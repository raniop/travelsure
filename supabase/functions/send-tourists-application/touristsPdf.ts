/**
 * Fill Harel's official Tour & Care application (tourists in Israel) in the language the customer
 * chose, from the digital /tourists flow. The templates are flat PDFs (no form fields), so values
 * are drawn at positions measured on each blank form: one layout per language, one filler.
 * Adding a language = its template in embeddedAssets.ts + a layout here.
 */
import { PDFDocument, PDFFont, PDFPage, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import * as fontkitModule from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
const fontkit = ("default" in fontkitModule ? fontkitModule.default : fontkitModule) as typeof fontkitModule;
import { decodeBase64, HEEBO_FONT_BASE64, TOUR_CARE_EN_BASE64, TOUR_CARE_HE_BASE64 } from "./embeddedAssets.ts";
import { OPTION_BOXES_EN, OPTION_BOXES_HE, type OptionBoxes } from "./optionBoxes.ts";

const INK = rgb(0.05, 0.18, 0.42);
const PAGE_H = 841.89;

/** Fixed Harel agent number for Ophir (same as the foreign-workers form). */
const AGENT_NO = "59795";
const AGENT_NAME = { en: "Ophir & Co. Insurance Agency", he: "אופיר ושות׳ סוכנות לביטוח" };

export type Role = "main" | "spouse" | "child1" | "child2" | "child3";
const ROLES: Role[] = ["main", "spouse", "child1", "child2", "child3"];

export type TouristsPdfInput = {
  formLanguage?: string;
  travelers?: Array<{
    role?: string;
    passportNo?: string;
    passportCountry?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    gender?: string;
    entryDate?: string;
    citizenship?: string;
    visitPurpose?: string;
  }>;
  insuranceFrom?: string;
  insuranceTo?: string;
  street?: string;
  houseNo?: string;
  apartmentNo?: string;
  town?: string;
  mobile?: string;
  hostLastName?: string;
  email?: string;
  documentsByPost?: boolean;
  provider?: string;
  health?: Record<string, { answers?: Record<string, string>; selected?: string[]; details?: string }>;
  riders?: {
    airTransport?: string[];
    accidents?: string[];
    extremeSports?: string[];
    extremeFrom?: string;
    extremeTo?: string;
    medicalManager?: string[];
    onlineConsult?: string[];
  };
  authorizedForChildren?: string;
  marketingConsent?: string;
  signatureName?: string;
  signatureDate?: string;
  payerId?: string;
  cardholderName?: string;
  cardNumber?: string;
  cardExp?: string;
  installments?: string;
  payerZip?: string;
  payerCity?: string;
  payerStreet?: string;
  payerPhone?: string;
  payerEmail?: string;
  /** Readable "Please specify" text, built by the site (who / which question / details) */
  healthSummary?: string;
};

/** [pageIndex, x, top] — x is the left edge (LTR) or the right edge (RTL) of the value. */
type At = [number, number, number];

type Layout = {
  rtl: boolean;
  pages: number;
  agentName: At;
  agentNo: At;
  byPost: At;
  /** "From date" / "To date" combs: day, month and 2-digit year slot centres */
  period: { top: number; from: [number, number, number]; to: [number, number, number] };
  /** Section A table: one cell per insured (left edge, LTR values) and the row baselines */
  colLeft: number[];
  colWidth: number;
  rows: Record<"passportNo" | "passportCountry" | "firstName" | "lastName" | "birthDate" | "entryDate" | "citizenship" | "visitPurpose", number>;
  tablePage: number;
  /** Gender boxes [male x, female x] per insured, at genderTop */
  genderBoxes: Array<[number, number]>;
  genderTop: number;
  address: { street: At; houseNo: At; apartmentNo: At; town: At; maxWidth: number };
  mobile: At;
  host: At;
  email: { at: At; atSign?: number; maxWidth: number };
  provider: Record<"harel" | "maccabi" | "clalit", At>;
  /** Health statement: yes/no column centres per insured, row baseline per question */
  yesX: number[];
  noX: number[];
  questionRows: Record<string, [number, number]>;
  /** Boxes printed next to a question itself (Hebrew form, 20 and 21) */
  questionBoxes?: Record<string, At>;
  options: OptionBoxes;
  details: { page: number; left: number; right: number; top: number; bottom: number };
  /** Signature tables (sections D and F): row baselines and column positions */
  signTables: Array<{ page: number; rows: number[]; date: number; name: number; passport: number; signature: number }>;
  authorizedYes: At;
  authorizedNo: At;
  marketingBox: At;
  agentDeclDate: At;
  agentDeclName: At;
  riders: {
    page: number;
    colX: number[];
    rows: Record<"airTransport" | "accidents" | "extremeSports" | "medicalManager" | "onlineConsult", number>;
    /** Day / month / year slots of the first "from" and "to" lines of the extreme-sports rider */
    extremeFrom: { top: number; day: number; month: number; year: number };
    extremeTo: { top: number; day: number; month: number; year: number };
  };
  payment: {
    page: number;
    applicantFirst: At;
    applicantLast: At;
    applicantPassport: At;
    /** One digit per cell: cell borders and the digits' baseline */
    payerIdComb: { top: number; ticks: number[] };
    cardholder: At;
    cardComb: { top: number; ticks: number[] };
    expMonth: At;
    expYear: At;
    /** Boxes for 1 or 2 payments (offered for 91–181 days) */
    installmentBoxes: Record<"1" | "2", At>;
    zip: At;
    city: At;
    street: At;
    phone: At;
    email: At;
    emailAtSign?: number;
    signDate: At;
    signName: At;
    signature: At;
  };
};

const EN: Layout = {
  rtl: false,
  pages: 6,
  agentName: [0, 474, 121.2],
  agentNo: [0, 485, 139],
  byPost: [0, 245, 167.2],
  period: { top: 200, from: [422.2, 448.5, 474.8], to: [501.2, 527.5, 553.4] },
  colLeft: [128, 216, 304, 392, 480],
  colWidth: 84,
  rows: { passportNo: 339.5, passportCountry: 365, firstName: 391, lastName: 411, birthDate: 431, entryDate: 466, citizenship: 487, visitPurpose: 507 },
  tablePage: 0,
  genderBoxes: [[155.9, 203.8], [245.2, 291.7], [333.1, 379.5], [421.0, 467.4], [508.9, 555.4]],
  genderTop: 439.4,
  address: { street: [0, 128, 542], houseNo: [0, 216, 542], apartmentNo: [0, 304, 542], town: [0, 392, 542], maxWidth: 84 },
  mobile: [0, 128, 559],
  host: [0, 128, 580],
  email: { at: [0, 128, 611], atSign: 299, maxWidth: 430 },
  provider: { harel: [0, 44.2, 660.3], maccabi: [0, 191.2, 660.3], clalit: [0, 350.9, 660.3] },
  yesX: [339.4, 399.8, 444.3, 488.8, 533.4],
  noX: [372.3, 422, 466.5, 511.1, 555.6],
  questionRows: {
    q0: [1, 107],
    q1: [1, 157.5], q2: [1, 285.9], q3: [1, 302.9], q4: [1, 348], q5: [1, 403.1], q6: [1, 448.2], q7: [1, 503.3],
    q8: [1, 588.3], q9: [1, 663.4], q10: [1, 698.5], q11: [1, 743.6],
    q12: [2, 61.7], q13: [2, 105.6], q14: [2, 149.6], q15: [2, 194.7], q16: [2, 298.6], q17: [2, 333.7], q18: [2, 358.8],
    q19: [2, 443.9], q20: [2, 482.3], q21: [2, 530.3], q22: [2, 554.2], q23: [2, 658.2], q24: [2, 716.1], q25: [2, 764.1],
  },
  options: OPTION_BOXES_EN,
  details: { page: 3, left: 30, right: 565, top: 58, bottom: 112 },
  signTables: [
    { page: 3, rows: [260.8, 283.5, 306.2, 328.9, 351.6], date: 186, name: 282, passport: 378, signature: 482 },
    { page: 5, rows: [71.6, 94.2, 116.9, 139.6, 162.3], date: 186, name: 266, passport: 375, signature: 483 },
  ],
  authorizedYes: [4, 357.6, 273.5],
  authorizedNo: [4, 391.7, 273.5],
  marketingBox: [4, 78.6, 572.5],
  agentDeclDate: [5, 70, 335],
  agentDeclName: [5, 222, 335],
  riders: {
    page: 3,
    colX: [212.2, 262.3, 312.4, 362.5, 412.6],
    rows: { airTransport: 426, accidents: 456.2, extremeSports: 529.2, medicalManager: 596.8, onlineConsult: 621.5 },
    extremeFrom: { top: 480.8, day: 474, month: 505, year: 534 },
    extremeTo: { top: 494.7, day: 459, month: 490, year: 520 },
  },
  payment: {
    page: 5,
    applicantFirst: [5, 46, 400],
    applicantLast: [5, 217, 400],
    applicantPassport: [5, 407, 400],
    payerIdComb: { top: 439, ticks: [41.4, 72.3, 103.1, 134, 164.9, 195.7, 226.6, 257.5, 288.3, 319.2] },
    cardholder: [5, 324, 441],
    cardComb: { top: 485, ticks: [319.2, 334.7, 350.1, 365.6, 381.1, 396.5, 412, 427.4, 442.9, 458.4, 473.8, 489.3, 504.8, 520.2, 535.7, 551.1, 566.6] },
    expMonth: [5, 198, 475.3],
    expYear: [5, 224, 475.3],
    installmentBoxes: { "1": [5, 407.3, 520.2], "2": [5, 435.5, 520.2] },
    zip: [5, 46, 554],
    city: [5, 169, 554],
    street: [5, 324, 554],
    phone: [5, 420, 568.7],
    email: [5, 46, 588.3],
    emailAtSign: 189.1,
    signDate: [5, 70, 695.2],
    signName: [5, 264, 695.2],
    signature: [5, 493, 695.2],
  },
};

const HE: Layout = {
  rtl: true,
  pages: 5,
  agentName: [0, 147, 184.8],
  agentNo: [0, 147, 203.3],
  byPost: [0, 312, 127.3],
  // Right-to-left combs: day in the right cell
  period: { top: 101, from: [172.2, 145.6, 120], to: [94.1, 67.9, 41.7] },
  colLeft: [383, 301, 218, 136, 53],
  colWidth: 76,
  rows: { passportNo: 246.1, passportCountry: 259.7, firstName: 273.4, lastName: 287.1, birthDate: 300.7, entryDate: 328.1, citizenship: 341.7, visitPurpose: 355.4 },
  tablePage: 0,
  genderBoxes: [[430.5, 402.2], [347.9, 319.6], [265.2, 236.9], [182.6, 154.3], [99.9, 71.6]],
  genderTop: 307.9,
  address: { street: [0, 418, 369.1], houseNo: [0, 317, 369.1], apartmentNo: [0, 231, 369.1], town: [0, 170, 369.1], maxWidth: 76 },
  mobile: [0, 465, 398.6],
  host: [0, 440, 383],
  email: { at: [0, 440, 414.2], maxWidth: 400 },
  provider: { harel: [0, 443.8, 441.3], maccabi: [0, 344.4, 441.3], clalit: [0, 542.2, 441.3] },
  yesX: [273.6, 220, 169, 117.9, 66.9],
  noX: [246.2, 194.4, 143.4, 92.3, 41.3],
  questionRows: {
    q0: [0, 531],
    q1: [0, 574.7], q2: [0, 664], q3: [0, 687.6], q4: [0, 732.9],
    q5: [1, 59.1], q6: [1, 105.8], q7: [1, 152.5], q8: [1, 210.2], q9: [1, 267.8], q10: [1, 303.5], q11: [1, 339.2],
    q12: [1, 385.8], q13: [1, 432.5], q14: [1, 468.2], q15: [1, 503.8], q16: [1, 604.1], q17: [1, 627.3], q18: [1, 650.6], q19: [1, 717.8],
    q20: [2, 59.1], q21: [2, 94.8], q22: [2, 119.5], q23: [2, 177.2], q24: [2, 215.7], q25: [2, 254.2],
  },
  questionBoxes: { q20: [2, 526.1, 53.7], q21: [2, 526.1, 89.4] },
  options: OPTION_BOXES_HE,
  details: { page: 2, left: 32, right: 545, top: 296, bottom: 342 },
  signTables: [
    { page: 2, rows: [532, 554.7, 577.4, 600, 622.7], date: 470, name: 360, passport: 252, signature: 129 },
    { page: 3, rows: [579.3, 602, 624.7, 647.3, 670], date: 466, name: 356, passport: 248, signature: 125 },
  ],
  authorizedYes: [3, 296.8, 162.2],
  authorizedNo: [3, 269.1, 162.2],
  marketingBox: [3, 516.7, 387.6],
  agentDeclDate: [3, 522, 800.8],
  agentDeclName: [3, 361, 800.8],
  riders: {
    page: 2,
    colX: [419, 371, 327.2, 280.4, 233.6],
    rows: { airTransport: 678.9, accidents: 698.9, extremeSports: 745.4, medicalManager: 784, onlineConsult: 804 },
    extremeFrom: { top: 721.9, day: 186, month: 161, year: 135 },
    extremeTo: { top: 721.9, day: 94, month: 71, year: 48 },
  },
  payment: {
    page: 4,
    applicantFirst: [4, 550, 63],
    applicantLast: [4, 379, 63],
    applicantPassport: [4, 189, 63],
    payerIdComb: { top: 99, ticks: [276.1, 307, 337.8, 368.7, 399.6, 430.4, 461.3, 492.2, 523, 553.9] },
    cardholder: [4, 205, 91],
    cardComb: { top: 131, ticks: [28.7, 44.2, 59.6, 75.1, 90.6, 106, 121.5, 136.9, 152.4, 167.9, 183.3, 198.8, 214.3, 229.7, 245.2, 260.6, 276.1] },
    expMonth: [4, 357, 124.9],
    expYear: [4, 385, 124.9],
    installmentBoxes: { "1": [4, 152.3, 164.8], "2": [4, 180.5, 164.8] },
    zip: [4, 528, 184.8],
    city: [4, 406, 184.8],
    street: [4, 228, 184.8],
    phone: [4, 205, 210.3],
    email: [4, 500, 210.3],
    signDate: [4, 480, 323],
    signName: [4, 340, 323],
    signature: [4, 168, 323],
  },
};

const LAYOUTS: Record<string, Layout> = { en: EN, he: HE };

/* ---------------- text helpers ---------------- */

const s = (v: unknown) => String(v ?? "").trim();
const topY = (top: number) => PAGE_H - top;
const hasHebrew = (text: string) => /[֐-׿]/.test(text);
const isYes = (v: unknown) => ["yes", "כן", "true", "1"].includes(s(v).toLowerCase());
const isNo = (v: unknown) => ["no", "לא", "false", "0"].includes(s(v).toLowerCase());

const pad2 = (n: string) => String(n || "").padStart(2, "0");
const formatDate = (value: unknown): string => {
  const raw = s(value);
  const iso = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${pad2(dmy[1])}/${pad2(dmy[2])}/${dmy[3]}`;
  return raw;
};
const dateParts = (value: unknown) => {
  const m = formatDate(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? { d: m[1], m: m[2], y: m[3] } : null;
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
function fit(text: string, font: PDFFont, size: number, maxWidth?: number) {
  let used = size;
  let draw = text;
  if (!maxWidth) return { draw, used };
  while (used > 6 && widthOf(draw, font, used) > maxWidth) used -= 0.5;
  while (draw.length > 1 && widthOf(draw, font, used) > maxWidth) draw = draw.slice(0, -1);
  return { draw, used };
}

/**
 * Draws a value. In a right-to-left layout `x` is the right edge and the text is right-aligned
 * (Hebrew in reading order); otherwise `x` is the left edge.
 */
function drawValue(page: PDFPage, font: PDFFont, value: unknown, x: number, top: number, rtl: boolean, size = 9, maxWidth?: number) {
  const text = s(value).replace(/\s+/g, " ");
  if (!text) return;
  const { draw, used } = fit(text, font, size, maxWidth);
  const y = topY(top);
  if (!rtl && !hasHebrew(draw)) {
    page.drawText(draw, { x, y, size: used, font, color: INK });
    return;
  }
  // Right-aligned at x in a right-to-left layout; Hebrew in a left-to-right layout keeps its left edge
  let cursor = rtl ? x : x + widthOf(draw, font, used);
  for (const run of bidiRuns(draw)) {
    if (run.ltr) {
      cursor -= widthOf(run.text, font, used);
      page.drawText(run.text, { x: cursor, y, size: used, font, color: INK });
    } else {
      for (const ch of [...run.text]) {
        const glyph = RTL_MIRROR[ch] || ch;
        cursor -= widthOf(glyph, font, used);
        page.drawText(glyph, { x: cursor, y, size: used, font, color: INK });
      }
    }
  }
}

/** Wraps text to lines that fit `maxWidth` (word by word). */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of s(text).split(/\n+/)) {
    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = current ? `${current} ${word}` : word;
      if (widthOf(next, font, size) <= maxWidth || !current) current = next;
      else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/** X inside an 8pt checkbox whose top-left corner is (x, top). */
function markBox(page: PDFPage, font: PDFFont, x: number, top: number) {
  const size = 8.5;
  const w = widthOf("X", font, size);
  page.drawText("X", { x: x + (8 - w) / 2, y: topY(top + 7.2), size, font, color: INK });
}

/** X centred on `cx` at the baseline `top`. */
function markAt(page: PDFPage, font: PDFFont, cx: number, top: number, size = 9) {
  const w = widthOf("X", font, size);
  page.drawText("X", { x: cx - w / 2, y: topY(top), size, font, color: INK });
}

/* ---------------- filling ---------------- */

function fill(pages: PDFPage[], font: PDFFont, L: Layout, data: TouristsPdfInput) {
  const lang = L.rtl ? "he" : "en";
  const put = (at: At, value: unknown, size = 9, maxWidth?: number, rtl = L.rtl) =>
    drawValue(pages[at[0]], font, value, at[1], at[2], rtl, size, maxWidth);
  const box = (at: At) => markBox(pages[at[0]], font, at[1], at[2]);

  const byRole = new Map<Role, NonNullable<TouristsPdfInput["travelers"]>[number]>();
  for (const t of data.travelers || []) if (ROLES.includes(t.role as Role)) byRole.set(t.role as Role, t);
  const present = ROLES.filter((r) => byRole.has(r));

  // Header: agent, documents by post, insurance period
  put(L.agentName, AGENT_NAME[lang], 8, 95);
  put(L.agentNo, AGENT_NO, 9, 80);
  if (data.documentsByPost) put(L.byPost, L.rtl ? "כן, בדואר" : "Yes, by post", 8, 140);
  const comb = (centres: [number, number, number], value: unknown) => {
    const d = dateParts(value);
    if (!d) return;
    [d.d, d.m, d.y.slice(2)].forEach((part, k) => {
      const w = widthOf(part, font, 9.5);
      pages[0].drawText(part, { x: centres[k] - w / 2, y: topY(L.period.top), size: 9.5, font, color: INK });
    });
  };
  comb(L.period.from, data.insuranceFrom);
  comb(L.period.to, data.insuranceTo);

  // Section A — one column per insured (names and passport details are English)
  const tp = pages[L.tablePage];
  ROLES.forEach((role, i) => {
    const t = byRole.get(role);
    if (!t) return;
    const x = L.colLeft[i];
    const cell = (key: keyof Layout["rows"], value: unknown) =>
      drawValue(tp, font, value, x, L.rows[key], false, 8.5, L.colWidth);
    cell("passportNo", t.passportNo);
    cell("passportCountry", t.passportCountry);
    cell("firstName", t.firstName);
    cell("lastName", t.lastName);
    cell("birthDate", formatDate(t.birthDate));
    cell("entryDate", formatDate(t.entryDate));
    cell("citizenship", t.citizenship);
    cell("visitPurpose", t.visitPurpose);
    const [male, female] = L.genderBoxes[i];
    if (s(t.gender) === "male") markBox(tp, font, male, L.genderTop);
    if (s(t.gender) === "female") markBox(tp, font, female, L.genderTop);
  });

  const a = L.address;
  put(a.street, data.street, 8.5, a.maxWidth);
  put(a.houseNo, data.houseNo, 8.5, a.maxWidth);
  put(a.apartmentNo, data.apartmentNo, 8.5, a.maxWidth);
  put(a.town, data.town, 8.5, L.rtl ? a.maxWidth + 60 : 165);
  put(L.mobile, data.mobile, 9, 300);
  put(L.host, data.hostLastName, 9, 300);
  const email = s(data.email);
  if (L.email.atSign && email.includes("@")) {
    const [local, domain] = email.split("@");
    const p = pages[L.email.at[0]];
    const { draw, used } = fit(local, font, 9, L.email.atSign - L.email.at[1] - 4);
    p.drawText(draw, { x: L.email.atSign - 4 - widthOf(draw, font, used), y: topY(L.email.at[2]), size: used, font, color: INK });
    drawValue(p, font, domain, L.email.atSign + 9, L.email.at[2], false, 9, 250);
  } else {
    put(L.email.at, email, 9, L.email.maxWidth);
  }
  const provider = s(data.provider) as keyof Layout["provider"];
  if (L.provider[provider]) box(L.provider[provider]);

  // Section C — health statement: an X per insured in its yes/no column, and the boxes ticked
  const health = data.health || {};
  for (const [qid, [pageIndex, top]] of Object.entries(L.questionRows)) {
    const answer = health[qid];
    const page = pages[pageIndex];
    let anyYes = false;
    ROLES.forEach((role, i) => {
      if (!byRole.has(role)) return;
      const v = answer?.answers?.[role];
      if (isYes(v)) {
        anyYes = true;
        markAt(page, font, L.yesX[i], top);
      } else if (isNo(v) || v === undefined || v === "") {
        markAt(page, font, L.noX[i], top);
      }
    });
    if (!anyYes) continue;
    const qBox = L.questionBoxes?.[qid];
    if (qBox) box(qBox);
    for (const optionId of answer?.selected || []) {
      const at = L.options[qid]?.[optionId];
      if (at) box(at);
    }
  }

  // "Please specify": who answered yes, to what, and the details
  const summary = s(data.healthSummary);
  if (summary) {
    const d = L.details;
    const size = 7.5;
    const lineH = 9.5;
    const lines = wrap(summary, font, size, d.right - d.left);
    const maxLines = Math.floor((d.bottom - d.top) / lineH) + 1;
    const shown = lines.length > maxLines ? [...lines.slice(0, maxLines - 1), L.rtl ? "(המשך במייל המצורף)" : "(continued in the attached email)"] : lines;
    shown.forEach((line, k) =>
      drawValue(pages[d.page], font, line, L.rtl ? d.right : d.left, d.top + k * lineH, L.rtl && hasHebrew(line), size, d.right - d.left),
    );
  }

  // Signature tables (D and F): adults sign — main insured, spouse, children aged 18+
  const signDate = formatDate(data.signatureDate);
  const adultRows: Array<{ row: number; t: NonNullable<TouristsPdfInput["travelers"]>[number] }> = [];
  const age = (birth: unknown) => {
    const p = dateParts(birth);
    if (!p) return 0;
    const b = new Date(Number(p.y), Number(p.m) - 1, Number(p.d));
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) years -= 1;
    return years;
  };
  if (byRole.get("main")) adultRows.push({ row: 0, t: byRole.get("main")! });
  if (byRole.get("spouse")) adultRows.push({ row: 1, t: byRole.get("spouse")! });
  let childRow = 2;
  for (const role of ["child1", "child2", "child3"] as Role[]) {
    const t = byRole.get(role);
    if (t && age(t.birthDate) >= 18 && childRow <= 4) adultRows.push({ row: childRow++, t });
  }
  for (const table of L.signTables) {
    const p = pages[table.page];
    for (const { row, t } of adultRows) {
      const top = table.rows[row];
      const name = `${s(t.firstName)} ${s(t.lastName)}`.trim();
      drawValue(p, font, signDate, table.date, top, L.rtl, 8, 70);
      drawValue(p, font, name, table.name, top, L.rtl, 8, 95);
      drawValue(p, font, t.passportNo, table.passport, top, L.rtl, 8, 85);
      drawValue(p, font, name, table.signature, top, L.rtl, 8, 90);
    }
  }

  // Statement: authority to sign for the children, consent to advertising
  const hasChildren = present.some((r) => r.startsWith("child"));
  if (hasChildren) {
    if (isYes(data.authorizedForChildren)) box(L.authorizedYes);
    else if (isNo(data.authorizedForChildren)) box(L.authorizedNo);
  }
  if (isYes(data.marketingConsent)) box(L.marketingBox);

  // Agent declaration
  put(L.agentDeclDate, signDate, 8.5, 80);
  put(L.agentDeclName, AGENT_NAME[lang], 8.5, 150);

  // Section E — riders: X in the column of each insured who takes it
  const R = L.riders;
  const rp = pages[R.page];
  const riders = data.riders || {};
  const riderRows: Array<[keyof Layout["riders"]["rows"], string[] | undefined]> = [
    ["airTransport", riders.airTransport],
    ["accidents", riders.accidents],
    ["extremeSports", riders.extremeSports],
    ["medicalManager", riders.medicalManager],
    ["onlineConsult", riders.onlineConsult],
  ];
  for (const [key, list] of riderRows) {
    for (const role of list || []) {
      const i = ROLES.indexOf(role as Role);
      if (i < 0 || !byRole.has(role as Role)) continue;
      if (key === "accidents" && i >= 2) continue; // printed "x": not offered to children
      markAt(rp, font, R.colX[i], R.rows[key]);
    }
  }
  if ((riders.extremeSports || []).length) {
    const from = dateParts(riders.extremeFrom || data.insuranceFrom);
    const to = dateParts(riders.extremeTo || data.insuranceTo);
    const slot = (spec: Layout["riders"]["extremeFrom"], d: ReturnType<typeof dateParts>) => {
      if (!d) return;
      drawValue(rp, font, d.d, spec.day, spec.top, false, 8.5);
      drawValue(rp, font, d.m, spec.month, spec.top, false, 8.5);
      drawValue(rp, font, d.y, spec.year, spec.top, false, 8.5);
    };
    slot(R.extremeFrom, from);
    slot(R.extremeTo, to);
  }

  // Section H — credit card
  const P = L.payment;
  const main = byRole.get("main");
  put(P.applicantFirst, main?.firstName, 9, 150);
  put(P.applicantLast, main?.lastName, 9, 150);
  put(P.applicantPassport, main?.passportNo, 9, 110);
  const digits = (comb: { top: number; ticks: number[] }, value: unknown) => {
    const chars = [...s(value).replace(/\D/g, "")].slice(0, comb.ticks.length - 1);
    chars.forEach((ch, i) => {
      const w = widthOf(ch, font, 10);
      pages[P.page].drawText(ch, { x: (comb.ticks[i] + comb.ticks[i + 1] - w) / 2, y: topY(comb.top), size: 10, font, color: INK });
    });
  };
  // A passport number has letters: write it as text across the cells instead of digit by digit
  if (/[A-Za-z]/.test(s(data.payerId))) {
    const c = P.payerIdComb;
    drawValue(pages[P.page], font, data.payerId, c.ticks[0] + 3, c.top, false, 10, c.ticks[c.ticks.length - 1] - c.ticks[0] - 6);
  } else digits(P.payerIdComb, data.payerId);
  put(P.cardholder, data.cardholderName, 9, 170);
  digits(P.cardComb, data.cardNumber);
  const exp = s(data.cardExp).match(/^(\d{2})\s*\/?\s*(\d{2,4})$/);
  if (exp) {
    put(P.expMonth, exp[1], 9.5, 30);
    put(P.expYear, exp[2].slice(-2), 9.5, 30);
  }
  const fromD = dateParts(data.insuranceFrom);
  const toD = dateParts(data.insuranceTo);
  if (fromD && toD) {
    const days = Math.round(
      (new Date(+toD.y, +toD.m - 1, +toD.d).getTime() - new Date(+fromD.y, +fromD.m - 1, +fromD.d).getTime()) / 86400000,
    ) + 1;
    if (days > 90) box(P.installmentBoxes[s(data.installments) === "2" ? "2" : "1"]);
  }
  put(P.zip, data.payerZip, 9, 100);
  put(P.city, data.payerCity, 9, 120);
  put(P.street, data.payerStreet, 9, 200);
  put(P.phone, data.payerPhone, 9, 120);
  const payerEmail = s(data.payerEmail);
  if (P.emailAtSign && payerEmail.includes("@")) {
    const [local, domain] = payerEmail.split("@");
    const p = pages[P.email[0]];
    const { draw, used } = fit(local, font, 9, P.emailAtSign - P.email[1] - 4);
    p.drawText(draw, { x: P.emailAtSign - 4 - widthOf(draw, font, used), y: topY(P.email[2]), size: used, font, color: INK });
    drawValue(p, font, domain, P.emailAtSign + 9, P.email[2], false, 9, 170);
  } else {
    put(P.email, payerEmail, 9, 240);
  }
  put(P.signDate, signDate, 9, 80);
  put(P.signName, data.cardholderName, 9, 150);
  put(P.signature, data.cardholderName, 9, 150);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

/** Builds the filled application as base64 (null when anything fails, so the email still goes out). */
export async function buildTouristsPdfBase64(
  input: TouristsPdfInput,
): Promise<{ filename: string; content: string; type: string } | null> {
  try {
    const lang = s(input.formLanguage) === "en" ? "en" : "he";
    const L = LAYOUTS[lang];
    const template = decodeBase64(lang === "en" ? TOUR_CARE_EN_BASE64 : TOUR_CARE_HE_BASE64);
    const doc = await PDFDocument.load(template);
    doc.registerFontkit(fontkit);
    let font: PDFFont;
    try {
      font = await doc.embedFont(decodeBase64(HEEBO_FONT_BASE64), { subset: true });
    } catch (err) {
      console.error("Font subset failed, embedding full font:", err);
      font = await doc.embedFont(decodeBase64(HEEBO_FONT_BASE64));
    }
    const pages = doc.getPages();
    if (pages.length < L.pages) throw new Error(`Expected ${L.pages} pages, got ${pages.length}`);
    fill(pages, font, L, input);
    const bytes = await doc.save();
    const main = (input.travelers || []).find((t) => t.role === "main");
    const name = [s(main?.firstName), s(main?.lastName)].filter(Boolean).join("_") || "applicant";
    return {
      filename: `Harel_Tour_and_Care_${lang.toUpperCase()}_${name.replace(/[^\w.-]+/g, "_").slice(0, 40)}.pdf`,
      content: uint8ToBase64(bytes),
      type: "application/pdf",
    };
  } catch (err) {
    console.error("buildTouristsPdfBase64 failed:", err);
    return null;
  }
}
