/**
 * Fill official Harel travel-medical insurance proposal (07/2026, doc 33504).
 * Template is flat (no AcroForm) — values are overlaid at calibrated positions.
 */
import { PDFDocument, PDFFont, PDFPage, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import * as fontkitModule from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
const fontkit = ("default" in fontkitModule ? fontkitModule.default : fontkitModule) as typeof fontkitModule;
import {
  decodeBase64,
  HEEBO_FONT_BASE64,
  TRAVEL_PROPOSAL_PDF_BASE64,
} from "./embeddedAssets.ts";

const TEMPLATE_URL = new URL("./templates/travel-proposal.pdf", import.meta.url);
const FONT_URL = new URL("./fonts/Heebo-Regular.ttf", import.meta.url);

const INK = rgb(0.05, 0.18, 0.42);
const PAGE_H = 841.89;
const AGENT_NO_FIXED = "59795";

export type TravelPersonPdf = {
  included?: boolean;
  gender?: string;
  idNumber?: string;
  lastNameHe?: string;
  lastNameEn?: string;
  firstNameHe?: string;
  firstNameEn?: string;
  birthDate?: string;
  health?: {
    q1?: string;
    q2?: string;
    q21Conditions?: string[];
    q22?: string;
    q3?: string;
    q31?: string;
    q4?: string;
    q4Details?: string;
    q5Pregnant?: string;
    q51Week?: string;
    q52HighRisk?: string;
  };
  plan?: {
    optOutSearchRescue?: boolean;
    optOutThirdParty?: boolean;
    baggage?: boolean;
    /** Extended baggage — valuable item coverage (separate from basic baggage). */
    baggageValuables?: boolean;
    valuableItems?: string[];
    cancellation?: boolean;
    cancellationExpanded?: boolean;
    priorCondition?: boolean;
    pregnancy?: boolean;
    adventureSports?: boolean;
    adventureFrom?: string;
    adventureTo?: string;
    winterSports?: boolean;
    winterFrom?: string;
    winterTo?: string;
    proSports?: boolean;
    proFrom?: string;
    proTo?: string;
    personalAccident?: boolean;
    personalAccidentAdventure?: boolean;
    laptop?: boolean;
    laptopModel?: string;
    phone?: boolean;
    phoneModel?: string;
    bicycle?: boolean;
    bicycleLimit?: string;
    bicycleModel?: string;
    bicyclePurchaseDate?: string;
    bicycleValueNis?: string;
    rentalCar?: boolean;
    rentalCarLimit?: string;
    rentalFrom?: string;
    rentalTo?: string;
  };
};

export type TravelProposalPdfInput = {
  notes?: string;
  agentName?: string;
  agentNo?: string;
  tripFrom?: string;
  tripTo?: string;
  destinations?: string[];
  usaFrom?: string;
  usaTo?: string;
  countriesDetail?: string;
  street?: string;
  houseNo?: string;
  city?: string;
  occupation?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  israeliResidents?: boolean;
  primary?: TravelPersonPdf;
  spouse?: TravelPersonPdf;
  child1?: TravelPersonPdf;
  child2?: TravelPersonPdf;
  child3?: TravelPersonPdf;
  child4?: TravelPersonPdf;
  marketingConsentExtra?: boolean;
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
  signatureDate?: string;
  insureds?: Array<TravelPersonPdf & { key?: string }>;
};

const PERSON_KEYS = ["primary", "spouse", "child1", "child2", "child3", "child4"] as const;

function personShouldFill(p: TravelPersonPdf, idx: number): boolean {
  if (idx === 0) return true;
  if (p.included === true) return true;
  return Boolean(
    s(p.idNumber) || s(p.firstNameHe) || s(p.lastNameHe) || s(p.firstNameEn) || s(p.lastNameEn),
  );
}

function resolvePeople(input: TravelProposalPdfInput): TravelPersonPdf[] {
  const fromArray = Array.isArray(input.insureds) ? input.insureds : [];
  const byKey: Partial<Record<(typeof PERSON_KEYS)[number], TravelPersonPdf>> = {};
  for (const row of fromArray) {
    const key = String(row?.key || "");
    if ((PERSON_KEYS as readonly string[]).includes(key)) {
      byKey[key as (typeof PERSON_KEYS)[number]] = row;
    }
  }
  return PERSON_KEYS.map((k) => byKey[k] || input[k] || {});
}

const s = (v: unknown) => String(v ?? "").trim();
const pad2 = (n: string) => String(n || "").padStart(2, "0");
const digitsOnly = (v: string) => v.replace(/\D/g, "");

const formatDate = (value: unknown): string => {
  const raw = s(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${pad2(dmy[1])}/${pad2(dmy[2])}/${dmy[3]}`;
  return raw;
};

/** 6-slot date comb DDMMYY */
const dateDigits6 = (value: unknown): string => {
  const d = formatDate(value).replace(/\D/g, "");
  if (d.length >= 8) return d.slice(0, 4) + d.slice(6, 8);
  return d.slice(0, 6);
};

const isYes = (v: unknown) => {
  const t = s(v).toLowerCase();
  return t === "yes" || t === "כן" || t === "true" || t === "1";
};
const isNo = (v: unknown) => {
  const t = s(v).toLowerCase();
  return t === "no" || t === "לא" || t === "false" || t === "0";
};
const isMale = (g: string) => {
  const t = g.toLowerCase();
  return t === "male" || t === "זכר" || t === "m";
};
const isFemale = (g: string) => {
  const t = g.toLowerCase();
  return t === "female" || t === "נקבה" || t === "f";
};

const hasHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);
const isRtlChar = (ch: string) => /[\u0590-\u05FF]/.test(ch);
const RTL_MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{" };

type BidiRun = { text: string; ltr: boolean };

// A number stays together, with its single separators and any sign next to it: 15/9/26, 1,000.50, 20%, ₪500
const NUMBER_AT = /^[%$€£₪]*\d+(?:[.,:/+-]\d+)*[%$€£₪]*/;
// Latin text keeps going, digits and spaces included, up to the next Hebrew: "LY 315", "New York"
const LATIN_AT = /^[A-Za-z][^\u0590-\u05FF]*/;
const TRAILING_NEUTRALS = /[^0-9A-Za-z%$€£₪]+$/;

/**
 * Splits a line into runs in reading order, for a right-to-left paragraph (simplified Unicode bidi):
 * only numbers and Latin text are left-to-right; spaces and punctuation between them belong to the
 * Hebrew flow.
 */
function splitBidiRuns(input: string): BidiRun[] {
  const text = String(input ?? "");
  if (!text) return [];
  if (![...text].some(isRtlChar)) return [{ text, ltr: true }];
  const runs: BidiRun[] = [];
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

function widthOf(text: string, font: PDFFont, size: number): number {
  if (!text) return 0;
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    return [...text].length * size * 0.55;
  }
}

const topY = (yFromTop: number) => PAGE_H - yFromTop;

function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  yFromTop: number,
  size = 9,
  maxWidth?: number,
) {
  const value = s(text);
  if (!value) return;
  const y = topY(yFromTop) - size * 0.2;

  if (!hasHebrew(value)) {
    let draw = value;
    let used = size;
    if (maxWidth) {
      while (used > 5 && widthOf(draw, font, used) > maxWidth) {
        if (used > 6.5) used -= 0.5;
        else {
          while (draw.length > 1 && widthOf(draw + "…", font, used) > maxWidth) draw = draw.slice(0, -1);
          draw += "…";
          break;
        }
      }
    }
    page.drawText(draw, { x, y: topY(yFromTop) - used * 0.2, size: used, font, color: INK });
    return;
  }

  const right = x + (maxWidth ?? 180);
  const runs = splitBidiRuns(value);
  let cursor = right;
  // Right-to-left paragraph: the first run in reading order sits at the right edge
  for (const run of runs) {
    if (run.ltr) {
      const w = widthOf(run.text, font, size);
      cursor -= w;
      if (maxWidth && cursor < x) break;
      page.drawText(run.text, { x: cursor, y, size, font, color: INK });
    } else {
      for (const ch of [...run.text]) {
        const drawn = RTL_MIRROR[ch] || ch;
        const w = widthOf(drawn, font, size);
        cursor -= w;
        if (maxWidth && cursor < x) break;
        page.drawText(drawn, { x: cursor, y, size, font, color: INK });
      }
    }
  }
}

function mark(page: PDFPage, font: PDFFont, x: number, yFromTop: number, size = 9) {
  // Baseline offset ~0.32*size keeps the glyph visually centered on yFromTop.
  page.drawText("X", {
    x,
    y: topY(yFromTop) - size * 0.32,
    size,
    font,
    color: INK,
  });
}

/** Center an X inside a checkbox / cell (x0→x1). Prefer size ≤ box width. */
function markInBox(page: PDFPage, font: PDFFont, x0: number, x1: number, yFromTop: number, size = 9) {
  const boxW = Math.max(1, x1 - x0);
  const used = Math.min(size, boxW * 0.85);
  const w = widthOf("X", font, used);
  mark(page, font, x0 + (boxW - w) / 2, yFromTop, used);
}

function drawDigits(
  page: PDFPage,
  font: PDFFont,
  value: string,
  ticks: number[],
  yFromTop: number,
  size = 10,
) {
  const chars = [...digitsOnly(value)];
  const slots = Math.min(chars.length, Math.max(0, ticks.length - 1));
  for (let i = 0; i < slots; i++) {
    const ch = chars[i];
    const slotW = ticks[i + 1] - ticks[i];
    const w = widthOf(ch, font, size);
    const x = ticks[i] + (slotW - w) / 2;
    page.drawText(ch, { x, y: topY(yFromTop) - size * 0.32, size, font, color: INK });
  }
}

/** Draw DD/MM/YY into three underline segments. */
function drawDateSegments(
  page: PDFPage,
  font: PDFFont,
  value: unknown,
  segments: [number, number][],
  yFromTop: number,
  size = 9,
) {
  const d = dateDigits6(value);
  if (d.length < 6 || segments.length < 3) {
    if (s(value)) drawText(page, font, formatDate(value), segments[0][0], yFromTop, size, segments[2][1] - segments[0][0]);
    return;
  }
  const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 6)];
  for (let i = 0; i < 3; i++) {
    const [x0, x1] = segments[i];
    const w = widthOf(parts[i], font, size);
    page.drawText(parts[i], {
      x: x0 + (x1 - x0 - w) / 2,
      y: topY(yFromTop) - size * 0.15,
      size,
      font,
      color: INK,
    });
  }
}

async function loadBytesFromUrl(url: URL): Promise<Uint8Array | null> {
  try {
    const data = await Deno.readFile(url);
    if (data.byteLength > 1000) return data;
  } catch (err) {
    console.error("Local asset read failed:", url.pathname, err);
  }
  return null;
}

async function loadTemplate(): Promise<Uint8Array> {
  return (await loadBytesFromUrl(TEMPLATE_URL)) || decodeBase64(TRAVEL_PROPOSAL_PDF_BASE64);
}
async function loadFont(): Promise<Uint8Array> {
  return (await loadBytesFromUrl(FONT_URL)) || decodeBase64(HEEBO_FONT_BASE64);
}

// —— Page 1 calibrated geometry ——
const DEST_BOX: Record<string, { x0: number; x1: number; y: number }> = {
  europe: { x0: 543.0, x1: 551.2, y: 244.5 },
  asia: { x0: 499.7, x1: 507.9, y: 244.5 },
  australia: { x0: 462.8, x1: 471.0, y: 244.5 },
  latam: { x0: 409.2, x1: 417.4, y: 244.5 },
  canada: { x0: 320.2, x1: 328.4, y: 244.5 },
  africa: { x0: 283.4, x1: 291.6, y: 244.5 },
  antarctica: { x0: 236.8, x1: 244.9, y: 244.5 },
  usa: { x0: 543.0, x1: 551.2, y: 263.5 },
};

/** RTL: מ- (from) is on the right, עד- (to) on the left. */
const TRIP_FROM_SEGS: [number, number][] = [
  [439.4, 467.5],
  [474.8, 503.0],
  [510.3, 538.5],
];
const TRIP_TO_SEGS: [number, number][] = [
  [319.8, 347.9],
  [355.2, 383.4],
  [390.7, 418.8],
];
const USA_FROM_SEGS: [number, number][] = [
  [391.4, 422.1],
  [429.4, 460.0],
  [467.4, 498.0],
];
const USA_TO_SEGS: [number, number][] = [
  [261.8, 292.4],
  [299.8, 330.4],
  [337.7, 368.4],
];

/** Each insured row is 34pt: Hebrew names in the top half, English in the bottom half (line at +15.3). */
const INSURED_ROWS = [
  { genderY: 605.5, digitY: 613, nameHeY: 599, nameEnY: 617.5 }, // primary
  { genderY: 639.5, digitY: 647, nameHeY: 633, nameEnY: 651.5 }, // spouse
  { genderY: 673.5, digitY: 681, nameHeY: 667, nameEnY: 685.5 }, // child1
  { genderY: 707.5, digitY: 715, nameHeY: 701, nameEnY: 719.5 }, // child2
  { genderY: 741.5, digitY: 749, nameHeY: 735, nameEnY: 753.5 }, // child3
  { genderY: 775.5, digitY: 783, nameHeY: 769, nameEnY: 787.5 }, // child4
];
const GENDER_MALE = { x0: 498.3, x1: 506.4 };
const GENDER_FEMALE = { x0: 480.0, x1: 488.1 };
const ID_TICKS = [340.2, 354.8, 369.4, 384.0, 398.6, 413.2, 427.8, 442.4, 456.9, 471.5];
/** 7 ticks → 6 digit slots DDMMYY (was missing leftmost tick → dropped final digit). */
const DOB_TICKS = [28.3, 43.3, 58.4, 73.4, 88.4, 103.4, 118.5];
const NAME_LAST_X = 230;
const NAME_LAST_W = 105;
const NAME_FIRST_X = 125;
const NAME_FIRST_W = 95;

// —— Page 2 health Y/N columns (right=כן, left=לא per person) ——
const HEALTH_YN: { yes: [number, number]; no: [number, number] }[] = [
  { yes: [186.5, 200.7], no: [172.3, 186.5] }, // primary
  { yes: [160.3, 172.3], no: [148.2, 160.3] }, // spouse
  { yes: [133.2, 148.2], no: [118.3, 133.2] }, // child1
  { yes: [103.3, 118.3], no: [88.3, 103.3] }, // child2
  { yes: [73.4, 88.3], no: [58.4, 73.4] }, // child3
  { yes: [43.4, 58.4], no: [28.5, 43.4] }, // child4
];

/** Mid-Y of each question's yes/no cell band (from template grid). */
const HEALTH_Q_Y: Record<string, number> = {
  // Q1 checkboxes sit with the question title (71.2–85.4), NOT the note below.
  q1: 78,
  q2: 119,
  q22: 287,
  q3: 349,
  q31: 436,
  q4: 473,
  q5: 537, // row 529.9–544 ("האם הנך בהיריון?")
  q52: 578,
};

const Q21_BOX: Record<string, { x0: number; x1: number; y: number }> = {
  // Each box sits to the right of its label: dialysis (text 385–510) | blood (text 216–366)
  dialysis: { x0: 512.7, x1: 520.8, y: 204 },
  blood: { x0: 369.3, x1: 377.4, y: 204 },
  cancer: { x0: 512.7, x1: 520.8, y: 217 },
  neuro: { x0: 512.6, x1: 520.7, y: 230 },
  liver: { x0: 513.0, x1: 521.2, y: 262 },
};

// —— Page 3/4 plan columns (cell mid-X per person, right→left) ——
const PLAN_COL = [
  { x0: 343.9, x1: 394.4 }, // primary
  { x0: 294.6, x1: 343.9 }, // spouse
  { x0: 245.9, x1: 294.6 }, // child1
  { x0: 196.5, x1: 245.9 }, // child2
  { x0: 147.2, x1: 196.5 }, // child3
  { x0: 97.6, x1: 147.2 }, // child4
];
const PLAN_ROW_Y = {
  optOutSearch: 77,
  optOutThird: 113,
  /** Basic baggage row (not the valuables block below it). */
  baggage: 143,
  cancellation: 263,
  cancellationExpanded: 309,
  priorCondition: 365,
  pregnancy: 460,
  adventure: 531,
  winter: 554,
  pro: 577,
  personalAccident: 610,
  personalAccidentAdventure: 660,
  laptop: 700,
  phone: 722,
  /** "כיסוי מיוחד לפריט יקר ערך" row (150–237) */
  valuables: 190,
};
const PLAN_P4_Y = {
  bicycle: 70,
  rental: 145,
};

/** Valuable-item boxes on page 3, each to the right of its label (y = box top + 5.6). */
const VALUABLE_BOX: Record<string, { x0: number; x1: number; y: number }> = {
  camera: { x0: 542.9, x1: 551, y: 213.9 },
  drone: { x0: 495.9, x1: 504, y: 213.9 },
  religious: { x0: 457.3, x1: 465.4, y: 213.9 },
  stroller: { x0: 542.9, x1: 551, y: 223.5 },
  surfboard: { x0: 481.9, x1: 490, y: 223.5 },
  wheelchair: { x0: 443.5, x1: 451.6, y: 223.5 },
  scooter: { x0: 542.9, x1: 551, y: 233.1 },
  instrument: { x0: 494.6, x1: 502.7, y: 233.1 },
};

const BICYCLE_LIMIT_BOX: Record<string, { x0: number; x1: number; y: number }> = {
  "2500": { x0: 542.8, x1: 550.9, y: 78.4 },
  "4500": { x0: 496.8, x1: 504.9, y: 78.4 },
  "6000": { x0: 451.3, x1: 459.4, y: 78.4 },
};
const RENTAL_LIMIT_BOX: Record<string, { x0: number; x1: number; y: number }> = {
  "1500": { x0: 542.8, x1: 550.9, y: 144.2 },
  "6000": { x0: 487.5, x1: 495.6, y: 144.2 },
};

/** "__/__/__" date lines in the period column (day | month | year between the printed slashes). */
const FROM_LINE_SEGS: [number, number][] = [[29, 46.6], [49.6, 64.6], [67.6, 84]];
const TO_LINE_SEGS: [number, number][] = [[29, 45.2], [48.2, 63.1], [66.1, 80.5]];

/** Right-aligned next to a label on the right (Hebrew forms), shrinking to fit. */
function drawRightAligned(page: PDFPage, font: PDFFont, text: string, right: number, yFromTop: number, size: number, maxWidth: number) {
  const v = s(text);
  if (!v) return;
  if (hasHebrew(v)) return drawText(page, font, v, right - maxWidth, yFromTop, size, maxWidth);
  let used = size;
  while (used > 5.5 && widthOf(v, font, used) > maxWidth) used -= 0.5;
  page.drawText(v, { x: right - widthOf(v, font, used), y: topY(yFromTop) - used * 0.2, size: used, font, color: INK });
}

// —— Page 5 payment / signatures ——
/** ID comb sits in row-1 band (y~341–358), ticks along the separator. */
const PAYER_ID_TICKS = [173.0, 189.6, 206.1, 222.7, 239.2, 255.8, 272.4, 288.9, 305.5, 322.1];
/** Card number: evenly divide the card cell 288.9 → 553.9 into 16 slots. */
const CARD_TICKS = Array.from({ length: 17 }, (_, i) => 288.9 + i * ((553.9 - 288.9) / 16));
const EXP_TICKS = Array.from({ length: 5 }, (_, i) => 173.0 + i * ((288.9 - 173.0) / 4));
const CVV_TICKS = Array.from({ length: 4 }, (_, i) => 40.0 + i * ((150.0 - 40.0) / 3));
const SIG_ID_TICKS = [143.9, 161.8, 177.6, 193.3, 209.0, 224.8, 240.5, 256.3, 272.0, 287.9];
const SIG_DATE_TICKS = [386.4, 404.4, 420.9, 437.5, 454.0, 470.5, 487.1];
const SIG_ROWS_Y = [48, 66, 85, 103, 122, 140];

function markYnPerson(
  page: PDFPage,
  font: PDFFont,
  personIdx: number,
  yFromTop: number,
  answer: unknown,
) {
  const col = HEALTH_YN[personIdx];
  if (!col) return;
  if (isYes(answer)) markInBox(page, font, col.yes[0], col.yes[1], yFromTop, 7);
  else if (isNo(answer)) markInBox(page, font, col.no[0], col.no[1], yFromTop, 7);
}

function markPlan(page: PDFPage, font: PDFFont, personIdx: number, yFromTop: number, on: boolean) {
  if (!on) return;
  const col = PLAN_COL[personIdx];
  if (!col) return;
  markInBox(page, font, col.x0, col.x1, yFromTop, 9);
}

function fillPage1(page: PDFPage, font: PDFFont, input: TravelProposalPdfInput) {
  // Agent box: on the dotted lines left of "שם הסוכן:" (baseline 102) and "מס' הסוכן:" (baseline 124.5)
  drawText(page, font, s(input.agentName) || "אופיר ושות׳ סוכנות לביטוח", 33, 100, 8, 104);
  drawText(page, font, AGENT_NO_FIXED, 60, 122.5, 9, 75);

  drawDateSegments(page, font, input.tripFrom, TRIP_FROM_SEGS, 212, 9);
  drawDateSegments(page, font, input.tripTo, TRIP_TO_SEGS, 212, 9);

  const dests = new Set((input.destinations || []).map((d) => String(d).toLowerCase()));
  for (const [id, box] of Object.entries(DEST_BOX)) {
    if (dests.has(id) || (id === "usa" && (s(input.usaFrom) || s(input.usaTo)))) {
      markInBox(page, font, box.x0, box.x1, box.y, 7);
    }
  }
  if (dests.has("usa") || s(input.usaFrom) || s(input.usaTo)) {
    drawDateSegments(page, font, input.usaFrom, USA_FROM_SEGS, 262, 8);
    drawDateSegments(page, font, input.usaTo, USA_TO_SEGS, 262, 8);
  }

  drawText(page, font, s(input.countriesDetail), 40, 284, 8, 360);

  // Address row, under the labels. Cells: occupation 28.6–166.2 | town 166.2–303.8 | no. 303.8–349.9 | street 349.9–554.2
  drawText(page, font, s(input.street), 352, 497, 8, 196);
  drawText(page, font, s(input.houseNo), 307, 497, 8, 40);
  drawText(page, font, s(input.city), 169, 497, 8, 131);
  drawText(page, font, s(input.occupation), 31, 497, 8, 132);

  drawText(page, font, s(input.phone), 448, 520, 8, 95);
  drawText(page, font, s(input.mobile), 348, 520, 8, 70);
  drawText(page, font, s(input.email), 195, 520, 8, 100);

  if (input.israeliResidents !== false) {
    markInBox(page, font, 259.7, 267.9, 569.3, 7);
  }

  const people = resolvePeople(input);
  people.forEach((p, idx) => {
    if (!personShouldFill(p, idx)) return;
    const row = INSURED_ROWS[idx];
    if (!row) return;
    if (isMale(s(p.gender))) markInBox(page, font, GENDER_MALE.x0, GENDER_MALE.x1, row.genderY, 7);
    if (isFemale(s(p.gender))) markInBox(page, font, GENDER_FEMALE.x0, GENDER_FEMALE.x1, row.genderY, 7);
    drawDigits(page, font, s(p.idNumber), ID_TICKS, row.digitY, 10);
    drawDigits(page, font, dateDigits6(p.birthDate), DOB_TICKS, row.digitY, 10);
    drawText(page, font, s(p.lastNameHe), NAME_LAST_X, row.nameHeY, 8, NAME_LAST_W);
    drawText(page, font, s(p.lastNameEn), NAME_LAST_X, row.nameEnY, 7, NAME_LAST_W);
    drawText(page, font, s(p.firstNameHe), NAME_FIRST_X, row.nameHeY, 8, NAME_FIRST_W);
    drawText(page, font, s(p.firstNameEn), NAME_FIRST_X, row.nameEnY, 7, NAME_FIRST_W);
  });
}

function fillPage2(page: PDFPage, font: PDFFont, input: TravelProposalPdfInput) {
  const people = resolvePeople(input);
  const q4Parts: Array<{ name: string; text: string }> = [];

  people.forEach((p, idx) => {
    if (!personShouldFill(p, idx)) return;
    const h = p.health || {};
    markYnPerson(page, font, idx, HEALTH_Q_Y.q1, h.q1 || "no");
    markYnPerson(page, font, idx, HEALTH_Q_Y.q2, h.q2 || "no");
    if (isYes(h.q2)) {
      markYnPerson(page, font, idx, HEALTH_Q_Y.q22, h.q22 || "no");
      for (const id of h.q21Conditions || []) {
        const box = Q21_BOX[id];
        if (box) markInBox(page, font, box.x0, box.x1, box.y, 8);
      }
    }
    markYnPerson(page, font, idx, HEALTH_Q_Y.q3, h.q3 || "no");
    if (isYes(h.q3)) markYnPerson(page, font, idx, HEALTH_Q_Y.q31, h.q31);
    markYnPerson(page, font, idx, HEALTH_Q_Y.q4, h.q4 || "no");
    if (s(h.q4Details)) q4Parts.push({ name: s(p.firstNameHe) || s(p.firstNameEn), text: s(h.q4Details) });
    if (isFemale(s(p.gender))) {
      markYnPerson(page, font, idx, HEALTH_Q_Y.q5, h.q5Pregnant || "no");
      if (isYes(h.q5Pregnant)) {
        // On the dotted line after "מה שבוע ההיריון הנוכחי?" (204–429, baseline 561.5)
        if (s(h.q51Week)) drawText(page, font, s(h.q51Week), 360, 559.5, 9, 60);
        markYnPerson(page, font, idx, HEALTH_Q_Y.q52, h.q52HighRisk || "no");
      }
    }
  });

  // Q4 details after "פרוט הבדיקות:" (text area 203–482, baseline 480.6), second line 203–465 (baseline 490.6)
  if (q4Parts.length) {
    const text = q4Parts.map((d) => (q4Parts.length > 1 && d.name ? `${d.name}: ${d.text}` : d.text)).join("; ");
    const first = 482 - 205;
    if (widthOf(text, font, 7) <= first) {
      drawText(page, font, text, 205, 479, 8, first);
    } else {
      // Split at a word so the rest continues on the line below
      const words = text.split(" ");
      let line1 = "";
      while (words.length && widthOf(`${line1} ${words[0]}`.trim(), font, 7) <= first) line1 = `${line1} ${words.shift()}`.trim();
      drawText(page, font, line1, 205, 479, 7, first);
      drawText(page, font, words.join(" "), 205, 489, 7, 465 - 205);
    }
  }
}

function fillPage3(page: PDFPage, font: PDFFont, input: TravelProposalPdfInput) {
  const people = resolvePeople(input);
  const valuables = new Set<string>();
  let laptopModel = "";
  let phoneModel = "";
  let adventureFrom = "";
  let adventureTo = "";
  let winterFrom = "";
  let winterTo = "";
  let proFrom = "";
  let proTo = "";

  people.forEach((p, idx) => {
    if (!personShouldFill(p, idx)) return;
    const plan = p.plan || {};
    if (plan.optOutSearchRescue) markPlan(page, font, idx, PLAN_ROW_Y.optOutSearch, true);
    if (plan.optOutThirdParty) markPlan(page, font, idx, PLAN_ROW_Y.optOutThird, true);
    markPlan(page, font, idx, PLAN_ROW_Y.baggage, !!plan.baggage);
    markPlan(page, font, idx, PLAN_ROW_Y.cancellation, !!plan.cancellation);
    markPlan(page, font, idx, PLAN_ROW_Y.cancellationExpanded, !!plan.cancellationExpanded);
    markPlan(page, font, idx, PLAN_ROW_Y.priorCondition, !!plan.priorCondition);
    markPlan(page, font, idx, PLAN_ROW_Y.pregnancy, !!plan.pregnancy);
    markPlan(page, font, idx, PLAN_ROW_Y.adventure, !!plan.adventureSports);
    markPlan(page, font, idx, PLAN_ROW_Y.winter, !!plan.winterSports);
    markPlan(page, font, idx, PLAN_ROW_Y.pro, !!plan.proSports);
    markPlan(page, font, idx, PLAN_ROW_Y.personalAccident, !!plan.personalAccident);
    markPlan(page, font, idx, PLAN_ROW_Y.personalAccidentAdventure, !!plan.personalAccidentAdventure);
    markPlan(page, font, idx, PLAN_ROW_Y.laptop, !!plan.laptop);
    markPlan(page, font, idx, PLAN_ROW_Y.phone, !!plan.phone);
    markPlan(page, font, idx, PLAN_ROW_Y.valuables, !!(plan.baggage && plan.baggageValuables));

    // Valuable-item ticks only when extended baggage was chosen
    if (plan.baggage && plan.baggageValuables) {
      for (const v of plan.valuableItems || []) valuables.add(v);
    }
    if (plan.laptopModel) laptopModel = s(plan.laptopModel);
    if (plan.phoneModel) phoneModel = s(plan.phoneModel);
    if (plan.adventureFrom) adventureFrom = s(plan.adventureFrom);
    if (plan.adventureTo) adventureTo = s(plan.adventureTo);
    if (plan.winterFrom) winterFrom = s(plan.winterFrom);
    if (plan.winterTo) winterTo = s(plan.winterTo);
    if (plan.proFrom) proFrom = s(plan.proFrom);
    if (plan.proTo) proTo = s(plan.proTo);
  });

  for (const id of valuables) {
    const box = VALUABLE_BOX[id];
    if (box) markInBox(page, font, box.x0, box.x1, box.y, 8);
  }

  // Sports periods: on the "מ- __/__/__" and "עד- __/__/__" lines (baselines 528.5/538.1, 551.8/561.4, 575.1/584.7)
  if (adventureFrom) drawDateSegments(page, font, adventureFrom, FROM_LINE_SEGS, 526.5, 7);
  if (adventureTo) drawDateSegments(page, font, adventureTo, TO_LINE_SEGS, 536.1, 7);
  if (winterFrom) drawDateSegments(page, font, winterFrom, FROM_LINE_SEGS, 549.8, 7);
  if (winterTo) drawDateSegments(page, font, winterTo, TO_LINE_SEGS, 559.4, 7);
  if (proFrom) drawDateSegments(page, font, proFrom, FROM_LINE_SEGS, 573.1, 7);
  if (proTo) drawDateSegments(page, font, proTo, TO_LINE_SEGS, 582.7, 7);

  // Models on the "דגם ....." lines left of the label (baselines 709.3 / 731.1)
  if (laptopModel) drawRightAligned(page, font, laptopModel, 535, 707.7, 8, 135);
  if (phoneModel) drawRightAligned(page, font, phoneModel, 535, 729.5, 8, 135);
}

function fillPage4(page: PDFPage, font: PDFFont, input: TravelProposalPdfInput) {
  const people = resolvePeople(input);
  let bikeModel = "";
  let bikeDate = "";
  let bikeValue = "";
  let rentalFrom = "";
  let rentalTo = "";

  people.forEach((p, idx) => {
    if (!personShouldFill(p, idx)) return;
    const plan = p.plan || {};
    markPlan(page, font, idx, PLAN_P4_Y.bicycle, !!plan.bicycle);
    markPlan(page, font, idx, PLAN_P4_Y.rental, !!plan.rentalCar);
    if (plan.bicycle && plan.bicycleLimit) {
      const box = BICYCLE_LIMIT_BOX[plan.bicycleLimit];
      if (box) markInBox(page, font, box.x0, box.x1, box.y, 8);
    }
    if (plan.rentalCar && plan.rentalCarLimit) {
      const box = RENTAL_LIMIT_BOX[plan.rentalCarLimit];
      if (box) markInBox(page, font, box.x0, box.x1, box.y, 8);
    }
    if (plan.bicycleModel) bikeModel = s(plan.bicycleModel);
    if (plan.bicyclePurchaseDate) bikeDate = s(plan.bicyclePurchaseDate);
    if (plan.bicycleValueNis) bikeValue = s(plan.bicycleValueNis);
    if (plan.rentalFrom) rentalFrom = s(plan.rentalFrom);
    if (plan.rentalTo) rentalTo = s(plan.rentalTo);
  });

  // Bicycle details on the dotted lines left of "דגם" / "תאריך רכישת האופניים" / "ערך האופניים ב-₪"
  if (bikeModel) drawRightAligned(page, font, bikeModel, 534, 89.5, 8, 130);
  if (bikeDate) drawRightAligned(page, font, formatDate(bikeDate), 466, 101, 8, 66);
  if (bikeValue) drawRightAligned(page, font, bikeValue, 481, 112.3, 8, 80);
  // Rental period on its "מ-" / "עד-" lines (baselines 147.3 / 162.3)
  if (rentalFrom) drawDateSegments(page, font, rentalFrom, [[29, 46.4], [49.4, 64.4], [67.4, 84]], 145.3, 7);
  if (rentalTo) drawDateSegments(page, font, rentalTo, [[29, 45], [48, 63], [66, 80.5]], 160.3, 7);

  if (input.marketingConsentExtra) {
    // 4ב "additional advertising" box (519.8, 611)
    markInBox(page, font, 519.8, 527.9, 616.6, 8);
  }
}

function fillPage5(page: PDFPage, font: PDFFont, input: TravelProposalPdfInput) {
  const people = resolvePeople(input);
  const sigDate = formatDate(input.signatureDate) || formatDate(new Date().toISOString().slice(0, 10));

  // Signature rows: main insured, spouse, then "ילד/ה מעל גיל 18" rows — children under 18 don't sign
  const ageOn = (birth: unknown, on: string) => {
    const b = formatDate(birth).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const d = on.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!b || !d) return null;
    let age = Number(d[3]) - Number(b[3]);
    if (Number(d[2]) < Number(b[2]) || (d[2] === b[2] && Number(d[1]) < Number(b[1]))) age -= 1;
    return age;
  };
  let nextChildRow = 2;
  people.forEach((p, idx) => {
    if (!personShouldFill(p, idx)) return;
    let row = idx;
    if (idx >= 2) {
      const age = ageOn(p.birthDate, sigDate);
      if (age != null && age < 18) return;
      row = nextChildRow++;
    }
    const y = SIG_ROWS_Y[row];
    if (y == null) return;
    const name = [s(p.firstNameHe) || s(p.firstNameEn), s(p.lastNameHe) || s(p.lastNameEn)]
      .filter(Boolean)
      .join(" ");
    drawText(page, font, name, 300, y, 8, 80);
    drawDigits(page, font, s(p.idNumber), SIG_ID_TICKS, y, 9);
    drawDigits(page, font, dateDigits6(sigDate), SIG_DATE_TICKS, y, 9);
    // Signature text in signature column
    drawText(page, font, name, 40, y, 7, 90);
  });

  // Agent block
  drawText(page, font, s(input.agentName) || "אופיר ושות׳ סוכנות לביטוח", 300, 178, 8, 100);
  drawText(page, font, AGENT_NO_FIXED, 50, 178, 9, 70);
  drawText(page, font, sigDate, 460, 178, 8, 70);
  // Agent's declaration: name on the dots left of "שם הסוכן:" (367–403), date left of "תאריך:"
  drawText(page, font, s(input.agentName) || "אופיר ושות׳ סוכנות לביטוח", 238, 305, 8, 125);
  drawText(page, font, sigDate, 460, 305, 8, 70);

  // Payment (section ט) — values in the lower half of each row, under the labels
  // Row 1 (341–366): holder | ID comb 173–322 | installments ; row 2 (366–392): card comb | expiry MM|YY | CVV
  drawText(page, font, s(input.payerName), 330, 362, 9, 218);
  drawDigits(page, font, s(input.payerId), PAYER_ID_TICKS, 360, 10);
  const install = digitsOnly(s(input.installments) || "1").slice(0, 2);
  if (install) drawText(page, font, install, 70, 362, 11, 80);

  const card = digitsOnly(s(input.cardNumber)).slice(0, 16);
  drawDigits(page, font, card, CARD_TICKS, 386, 10);
  const exp = digitsOnly(s(input.cardExp));
  if (exp.length >= 4) {
    // Two cells: MM (173–232.4) | YY (232.4–288.9)
    for (const [text, x0, x1] of [[exp.slice(0, 2), 173, 232.4], [exp.slice(2, 4), 232.4, 288.9]] as const) {
      const w = widthOf(text, font, 10);
      page.drawText(text, { x: (x0 + x1 - w) / 2, y: topY(386) - 3.2, size: 10, font, color: INK });
    }
  }
  // CVV box 28.3–173 has no cells: centre all 3 (or Amex 4) digits under the label
  const cvv = digitsOnly(s(input.cardCvv)).slice(0, 4);
  if (cvv) {
    const w = widthOf(cvv.split("").join(" "), font, 10);
    page.drawText(cvv.split("").join(" "), { x: 100.6 - w / 2, y: topY(386) - 3.2, size: 10, font, color: INK });
  }

  drawText(page, font, s(input.payerStreet), 360, 404, 8, 160);
  drawText(page, font, s(input.payerHouseNo), 290, 404, 8, 30);
  drawText(page, font, s(input.payerCity), 120, 404, 8, 120);
  drawText(page, font, s(input.payerZip), 35, 404, 8, 60);
  drawText(page, font, s(input.payerPhone), 360, 428, 8, 150);
  drawText(page, font, s(input.payerMobile), 120, 428, 8, 100);

  drawText(page, font, sigDate, 460, 585, 8, 70);
  // Cardholder signature: on the dots, clear of the pen icon (~155)
  drawText(page, font, s(input.payerName), 40, 585, 8, 110);
}

export async function buildTravelProposalFilledPdfBase64(
  input: TravelProposalPdfInput,
): Promise<string> {
  const [pdfBytes, fontBytes] = await Promise.all([loadTemplate(), loadFont()]);
  const pdf = await PDFDocument.load(pdfBytes);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const pages = pdf.getPages();

  if (pages[0]) fillPage1(pages[0], font, input);
  if (pages[1]) fillPage2(pages[1], font, input);
  if (pages[2]) fillPage3(pages[2], font, input);
  if (pages[3]) fillPage4(pages[3], font, input);
  if (pages[4]) fillPage5(pages[4], font, input);

  const out = await pdf.save();
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < out.length; i += chunk) {
    binary += String.fromCharCode(...out.subarray(i, i + chunk));
  }
  return btoa(binary);
}
