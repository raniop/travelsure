/**
 * Fill official Harel SAFE STAY proposal + health-declaration templates
 * and merge into one PDF attachment for the foreigners application email.
 *
 * Templates are flat (no AcroForm) — values are overlaid at calibrated positions.
 * Do not import or modify claim PDF code from this module.
 */
import { PDFDocument, PDFFont, PDFPage, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
import {
  decodeBase64,
  HEEBO_FONT_BASE64,
  HEALTH_PDF_BASE64,
  PROPOSAL_PDF_BASE64,
} from "./embeddedAssets.ts";

const PROPOSAL_URL = new URL("./templates/insurance-proposal.pdf", import.meta.url);
const HEALTH_URL = new URL("./templates/health-declaration.pdf", import.meta.url);
const FONT_URL = new URL("./fonts/Heebo-Regular.ttf", import.meta.url);

const INK = rgb(0.05, 0.18, 0.42);
const PAGE_H = 841.89;

export type ForeignersPdfInput = {
  firstName?: string;
  lastName?: string;
  passportNo?: string;
  passportCountry?: string;
  countryOfOrigin?: string;
  birthDate?: string;
  gender?: string; // male | female | זכר | נקבה
  firstInsuranceDate?: string;
  entryDate?: string;
  insuranceFrom?: string;
  insuranceTo?: string;
  workDescription?: string;
  street?: string;
  houseNo?: string;
  apartmentNo?: string;
  city?: string;
  zip?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  workPurpose?: string; // general | construction | agriculture | nursing
  provider?: string; // maccabi | clalit
  hadPreviousInsurance?: string; // yes | no | כן | לא
  previousCompany?: string;
  previousPolicyNo?: string;
  previousMembershipNo?: string;
  previousFrom?: string;
  previousTo?: string;
  employerName?: string;
  employerId?: string;
  employerPhone?: string;
  employerMobile?: string;
  employerEmail?: string;
  employerAddress?: string;
  agentName?: string;
  agentNo?: string;
  heightCm?: string;
  weightKg?: string;
  usesNarcotics?: string;
  drinksAlcohol?: string;
  alcoholGlassesPerDay?: string;
  pendingExams?: { answer?: string; details?: string } | string;
  surgeryTransplant?: { answer?: string; details?: string } | string;
  hospitalized?: { answer?: string; details?: string } | string;
  regularMedications?: { answer?: string; details?: string } | string;
  allergies?: { answer?: string; details?: string } | string;
  conditionAnswers?: Record<
    string,
    {
      answer?: string;
      selected?: string[];
      details?: string;
      herniaSurgeryDate?: string;
      herniaResolved?: string;
      isPregnant?: string;
      cesareanDate?: string;
    }
  >;
  dismissedBefore?: string;
  dismissedDetails?: string;
  marketingConsent?: string;
  signatureName?: string;
  signatureDate?: string;
  payerLastName?: string;
  payerFirstName?: string;
  payerId?: string;
  cardNumber?: string;
  cardExp?: string;
  notes?: string;
};

const s = (v: unknown) => String(v ?? "").trim();

const pad2 = (n: string) => String(n || "").padStart(2, "0");

const formatDate = (value: unknown): string => {
  const raw = s(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${pad2(dmy[1])}/${pad2(dmy[2])}/${dmy[3]}`;
  return raw;
};

const isYes = (v: unknown) => {
  const t = s(v).toLowerCase();
  return t === "yes" || t === "כן" || t === "true" || t === "1";
};
const isNo = (v: unknown) => {
  const t = s(v).toLowerCase();
  return t === "no" || t === "לא" || t === "false" || t === "0";
};

const answerOf = (v: unknown): string => {
  if (v && typeof v === "object" && "answer" in (v as object)) {
    return s((v as { answer?: string }).answer);
  }
  return s(v);
};

const detailsOf = (v: unknown): string => {
  if (v && typeof v === "object" && "details" in (v as object)) {
    return s((v as { details?: string }).details);
  }
  return "";
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
const isLtrStrong = (ch: string) => /[0-9A-Za-z]/.test(ch);

const RTL_MIRROR: Record<string, string> = {
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
};

type BidiRun = { text: string; ltr: boolean };

function splitBidiRuns(input: string): BidiRun[] {
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
    return [...text].length * size * 0.55;
  }
}

/** Draw Hebrew-aware text. Pure LTR stays left-aligned; Hebrew is right-aligned in the field. */
function drawText(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  yFromTop: number,
  size = 8,
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
          while (draw.length > 1 && widthOf(draw + "…", font, used) > maxWidth) {
            draw = draw.slice(0, -1);
          }
          draw += "…";
          break;
        }
      }
    }
    page.drawText(draw, { x, y: topY(yFromTop) - used * 0.2, size: used, font, color: INK });
    return;
  }

  // Hebrew / mixed: draw RTL-aligned inside the field box
  const right = x + (maxWidth ?? 180);
  const runs = splitBidiRuns(value);
  let cursor = right;
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i];
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

const topY = (yFromTop: number) => PAGE_H - yFromTop;

async function loadBytesFromUrl(url: URL): Promise<Uint8Array | null> {
  try {
    const data = await Deno.readFile(url);
    if (data.byteLength > 1000) return data;
  } catch (err) {
    console.error("Local asset read failed:", url.pathname, err);
  }
  return null;
}

async function loadProposalBytes(): Promise<Uint8Array> {
  return (await loadBytesFromUrl(PROPOSAL_URL)) || decodeBase64(PROPOSAL_PDF_BASE64);
}

async function loadHealthBytes(): Promise<Uint8Array> {
  return (await loadBytesFromUrl(HEALTH_URL)) || decodeBase64(HEALTH_PDF_BASE64);
}

async function loadFontBytes(): Promise<Uint8Array> {
  return (await loadBytesFromUrl(FONT_URL)) || decodeBase64(HEEBO_FONT_BASE64);
}

function mark(
  page: PDFPage,
  font: PDFFont,
  x: number,
  yFromTop: number,
  size = 9,
) {
  page.drawText("X", {
    x,
    y: topY(yFromTop) - size * 0.15,
    size,
    font,
    color: INK,
  });
}

function pageDrawUnderline(page: PDFPage, x: number, yFromTop: number, width: number) {
  page.drawRectangle({
    x,
    y: topY(yFromTop),
    width,
    height: 1.4,
    color: INK,
  });
}

/** Yes/No columns on the health form (right side). */
function markYn(page: PDFPage, font: PDFFont, yFromTop: number, yes: boolean | null) {
  if (yes === null) return;
  if (yes) mark(page, font, 528.5, yFromTop + 7, 9);
  else mark(page, font, 550.5, yFromTop + 7, 9);
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

/** Draw one character centered in each digit slot defined by tick X positions. */
function drawDigits(
  page: PDFPage,
  font: PDFFont,
  value: string,
  ticks: number[],
  yFromTop: number,
  size = 9,
) {
  const chars = [...digitsOnly(value)];
  const slots = Math.min(chars.length, ticks.length - 1);
  for (let i = 0; i < slots; i++) {
    const ch = chars[i];
    const slotW = ticks[i + 1] - ticks[i];
    const w = widthOf(ch, font, size);
    const x = ticks[i] + (slotW - w) / 2;
    page.drawText(ch, {
      x,
      y: topY(yFromTop) - size * 0.2,
      size,
      font,
      color: INK,
    });
  }
}

function suggestedInstallments(from: string, to: string): number | null {
  const f = formatDate(from);
  const t = formatDate(to);
  const m = (d: string) => {
    const p = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!p) return null;
    return new Date(Number(p[3]), Number(p[2]) - 1, Number(p[1])).getTime();
  };
  const a = m(f);
  const b = m(t);
  if (a == null || b == null || b < a) return null;
  const days = Math.round((b - a) / 86400000) + 1;
  if (days <= 90) return 1;
  if (days <= 180) return 2;
  if (days <= 240) return 4;
  return 6;
}

/** ID number digit ticks (proposal p3). */
const PAYER_ID_TICKS = [41.0, 56.7, 72.3, 87.9, 103.5, 119.1, 134.7, 150.3, 165.9, 181.5];
/** Credit-card digit ticks (proposal p3) — 16 equal slots. */
const CARD_TICKS = [
  181.5, 204.79, 228.09, 251.38, 274.68, 297.97, 321.26, 344.56, 367.85, 391.14, 414.44, 437.73,
  461.03, 484.32, 507.61, 530.91, 554.2,
];

/** Condition option checkbox map: groupId -> optionId -> [pageIndex, x, y] */
const OPTION_BOXES: Record<string, Record<string, [number, number, number]>> = {
  nervous: {
    stroke: [0, 170.2, 533.5],
    epilepsy: [0, 343.2, 533.5],
    ms: [0, 399.7, 533.5],
    muscular: [0, 61.6, 545.5],
    dizziness: [0, 286.8, 545.5],
    headaches: [0, 404.8, 545.5],
    balance: [0, 61.6, 557.5],
    fainting: [0, 155.9, 557.5],
    parkinson: [0, 217.8, 557.5],
    alzheimer: [0, 335.0, 557.5],
    trembling: [0, 442.5, 557.5],
    retardation: [0, 61.6, 569.5],
    autism: [0, 167.0, 569.5],
    down: [0, 217.3, 569.5],
    cp: [0, 316.7, 569.5],
    polio: [0, 61.6, 581.5],
    gaucher: [0, 227.1, 581.5],
    numbness: [0, 325.2, 581.5],
    adhd: [0, 61.6, 593.5],
    migraine: [0, 201.1, 593.5],
    dementia: [0, 259.7, 593.5],
    aids: [0, 474.3, 605.5],
    hiv: [0, 61.6, 617.5],
    lupus: [0, 130.7, 617.5],
  },
  eyes: {
    cataract: [0, 135.8, 657.1],
    retina: [0, 193.8, 657.1],
    glaucoma: [0, 342.3, 657.1],
    inflammation: [0, 61.6, 669.1],
    strabismus: [0, 195.3, 669.1],
    blindness: [0, 264.3, 669.1],
  },
  heart: {
    arrhythmia: [0, 92.2, 698.7],
    disease: [0, 202.9, 698.7],
    failure: [0, 282.5, 698.7],
    attack: [0, 359.0, 698.7],
    congenital: [0, 61.6, 710.7],
    catheter: [0, 190.8, 710.7],
    valves: [0, 61.6, 724.7],
  },
  vessels: {
    varicose: [0, 126.5, 754.3],
    carotid: [0, 314.9, 754.3],
    coagulation: [0, 61.6, 766.3],
    dvt: [0, 182.6, 766.3],
    pvd: [0, 350.8, 766.3],
  },
  metabolic: {
    diabetes: [1, 150.6, 56.8],
    thyroid: [1, 233.3, 56.8],
    lymph: [1, 309.6, 56.8],
    salivary: [1, 392.7, 56.8],
    pituitary: [1, 61.3, 67.8],
    hypertension: [1, 208.1, 67.8],
    cholesterol: [1, 288.9, 67.8],
  },
  respiratory: {
    asthma: [1, 154.9, 94.4],
    tb: [1, 205.5, 94.4],
    copd: [1, 281.4, 94.4],
    hayfever: [1, 61.3, 105.4],
    infections: [1, 117.0, 105.4],
    pneumothorax: [1, 373.8, 105.4],
    cf: [1, 61.3, 116.4],
  },
  digestive: {
    ulcer: [1, 141.8, 154.0],
    heartburn: [1, 282.7, 154.0],
    crohn: [1, 348.9, 154.0],
    colitis: [1, 436.9, 154.0],
    reflux: [1, 61.3, 165.0],
    hemorrhoids: [1, 107.0, 165.0],
    fissure: [1, 183.4, 165.0],
    obstruction: [1, 268.4, 165.0],
    pancreas: [1, 369.5, 165.0],
    esophagus: [1, 61.3, 176.0],
    gallbladder: [1, 129.5, 176.0],
  },
  liver: {
    jaundice: [1, 88.4, 213.6],
    hepatitis: [1, 148.4, 213.6],
    fatty: [1, 239.1, 213.6],
    cirrhosis: [1, 303.8, 213.6],
  },
  kidney: {
    infections: [1, 177.8, 288.3],
    stones: [1, 290.6, 288.3],
    cysts: [1, 428.0, 288.3],
    anomalies: [1, 61.3, 299.3],
    failure: [1, 199.5, 299.3],
  },
  joints: {
    arthritis: [1, 143.7, 336.8],
    gout: [1, 199.3, 336.8],
    back: [1, 240.7, 336.8],
    joints: [1, 313.5, 336.8],
    knees: [1, 359.3, 336.8],
  },
  skin: {
    tumors: [1, 162.1, 374.4],
    lesions: [1, 235.8, 374.4],
    psoriasis: [1, 307.4, 374.4],
    std: [1, 61.3, 385.4],
    syphilis: [1, 216.1, 385.4],
  },
  women: {
    breasts: [1, 116.8, 438.1],
    gyn: [1, 303.2, 438.1],
    cesarean: [1, 165.4, 460.1],
  },
  men: {
    prostate: [1, 104.7, 486.7],
    varicocele: [1, 205.1, 486.7],
  },
  ent: {
    apnea: [1, 199.1, 539.4],
    polyp: [1, 319.9, 539.4],
    sinusitis: [1, 388.5, 539.4],
  },
};

/** Main Yes/No row anchors for condition groups [page, yFromTop] */
const CONDITION_YN: Record<string, [number, number]> = {
  nervous: [0, 540],
  eyes: [0, 660],
  heart: [0, 702],
  vessels: [0, 758],
  metabolic: [1, 58],
  respiratory: [1, 98],
  digestive: [1, 158],
  liver: [1, 218],
  hernia: [1, 255],
  kidney: [1, 292],
  joints: [1, 340],
  skin: [1, 378],
  cancer: [1, 425],
  women: [1, 442],
  men: [1, 490],
  mental: [1, 528],
  ent: [1, 544],
};

function fillProposal(pages: PDFPage[], font: PDFFont, data: ForeignersPdfInput) {
  const [p0, p1, p2] = pages;
  const gender = s(data.gender);

  // Agent row cell ~245–274 (labels on top gray bar)
  drawText(p0, font, s(data.agentName) || "Ophir Insurance", 48, 266, 8, 230);
  drawText(p0, font, s(data.agentNo), 310, 266, 8, 220);

  // A – names row cell 464.6–495.3
  // Multi-line labels end ~483; keep values at very bottom (baseline ~494).
  drawText(p0, font, s(data.firstName), 46, 494, 8, 70);
  drawText(p0, font, s(data.lastName), 220, 494, 8, 75);
  drawText(p0, font, s(data.passportCountry), 310, 494, 6.5, 115);
  drawText(p0, font, s(data.passportNo), 444, 494, 7, 100);

  // Origin country stays in text cell; DOB / first-insurance sit on the digit comb below (~517–531).
  drawText(p0, font, s(data.countryOfOrigin), 46, 516, 7, 95);
  drawText(p0, font, formatDate(data.birthDate), 155, 528, 8, 115);
  drawText(p0, font, formatDate(data.firstInsuranceDate), 295, 528, 8, 105);
  // Gender checkboxes: Male 444.2@497.7, Female 444.8@508.7
  if (isMale(gender)) mark(p0, font, 445.0, 506, 7);
  if (isFemale(gender)) mark(p0, font, 445.5, 517, 7);

  // Entry + insurance period digit band ~546–572
  drawText(p0, font, formatDate(data.entryDate), 80, 568, 8, 140);
  drawText(p0, font, formatDate(data.insuranceFrom), 270, 568, 8, 110);
  drawText(p0, font, formatDate(data.insuranceTo), 430, 568, 8, 110);

  // Work description cell 572.5–603.6
  drawText(p0, font, s(data.workDescription), 48, 596, 8, 490);

  // Address cell 604.1–629.1: zip | town | apt | house | street
  drawText(p0, font, s(data.zip), 50, 624, 7, 90);
  drawText(p0, font, s(data.city), 158, 624, 7, 75);
  drawText(p0, font, s(data.apartmentNo), 255, 624, 7, 80);
  drawText(p0, font, s(data.houseNo), 360, 624, 7, 65);
  drawText(p0, font, s(data.street), 448, 624, 7, 95);

  // Contact cell 629.6–654.6: email | mobile | phone (labels wrap to ~638)
  drawText(p0, font, s(data.email), 50, 650, 7, 240);
  drawText(p0, font, s(data.mobile), 318, 650, 7, 105);
  drawText(p0, font, s(data.phone), 450, 650, 7, 95);

  // B – purpose checkboxes @ y≈722.4
  const purpose = s(data.workPurpose).toLowerCase();
  const purposeBox: Record<string, [number, number]> = {
    general: [140.5, 729],
    construction: [278.5, 729],
    agriculture: [405.0, 729],
    nursing: [543.5, 729],
  };
  const pb = purposeBox[purpose];
  if (pb) mark(p0, font, pb[0], pb[1], 8);

  // C – provider checkboxes @ y≈762
  const provider = s(data.provider).toLowerCase();
  if (provider === "maccabi") mark(p0, font, 45.0, 769, 8);
  if (provider === "clalit") mark(p0, font, 543.5, 769, 8);

  // D – previous insurance
  if (isYes(data.hadPreviousInsurance)) mark(p1, font, 324.5, 37, 8);
  else if (isNo(data.hadPreviousInsurance)) mark(p1, font, 300.0, 37, 8);
  drawText(p1, font, s(data.previousCompany), 265, 82, 7, 110);
  drawText(p1, font, s(data.previousPolicyNo), 400, 82, 7, 50);
  drawText(p1, font, s(data.previousMembershipNo), 510, 82, 7, 40);
  drawText(p1, font, formatDate(data.previousFrom), 48, 92, 7, 90);
  drawText(p1, font, formatDate(data.previousTo), 160, 92, 7, 70);

  // E – employer (labels ~124 / ~158, values in white cells below)
  drawText(p1, font, s(data.employerName), 48, 148, 8, 155);
  drawText(p1, font, s(data.employerId), 220, 148, 8, 140);
  drawText(p1, font, s(data.employerPhone), 395, 148, 7, 140);
  drawText(p1, font, s(data.employerEmail), 48, 182, 7, 200);
  drawText(p1, font, s(data.employerAddress), 270, 182, 7, 110);
  drawText(p1, font, s(data.employerMobile), 395, 182, 7, 140);

  // Employer signature block
  drawText(p1, font, s(data.employerName), 50, 700, 8, 140);
  drawText(p1, font, s(data.employerName), 310, 700, 8, 150);
  drawText(p1, font, formatDate(data.signatureDate), 490, 700, 7, 55);

  // Agent block bottom of p2
  drawText(p1, font, formatDate(data.signatureDate), 50, 780, 7, 100);
  drawText(p1, font, s(data.agentName), 220, 780, 7, 140);

  // K – payment (page 3)
  // Applicant row 321.6–347.1
  drawText(p2, font, s(data.lastName), 50, 340, 8, 155);
  drawText(p2, font, s(data.firstName), 225, 340, 8, 180);
  drawText(p2, font, s(data.passportNo), 430, 340, 7, 110);

  // Payer row 359.3–384.9
  drawDigits(p2, font, s(data.payerId), PAYER_ID_TICKS, 380, 10);
  drawText(p2, font, s(data.payerFirstName), 190, 380, 8, 190);
  drawText(p2, font, s(data.payerLastName), 410, 380, 8, 130);

  // Card row 384.9–411.5 — printed slash ~x105
  const exp = s(data.cardExp);
  const expParts = exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (expParts) {
    drawText(p2, font, expParts[1], 70, 407, 10, 28);
    drawText(p2, font, expParts[2], 125, 407, 10, 40);
  } else if (exp) {
    drawText(p2, font, exp, 55, 407, 9, 100);
  }
  drawDigits(p2, font, s(data.cardNumber), CARD_TICKS, 407, 10);

  // Optional payer contact row
  drawText(p2, font, s(data.mobile) || s(data.employerMobile), 50, 432, 7, 120);
  drawText(p2, font, s(data.zip), 190, 432, 7, 70);
  drawText(p2, font, s(data.city), 290, 432, 7, 110);
  drawText(
    p2,
    font,
    [s(data.street), s(data.houseNo)].filter(Boolean).join(" "),
    430,
    432,
    7,
    110,
  );
  drawText(p2, font, s(data.email) || s(data.employerEmail), 50, 448, 7, 480);

  // Highlight suggested installment count (printed 1/2/4/6) with a light underline
  const inst = suggestedInstallments(s(data.insuranceFrom), s(data.insuranceTo));
  const instCenter: Record<number, number> = { 1: 229, 2: 325, 4: 420, 6: 510 };
  if (inst && instCenter[inst] != null) {
    const cx = instCenter[inst];
    p2.drawRectangle({
      x: cx - 10,
      y: topY(248),
      width: 20,
      height: 1.4,
      color: INK,
    });
  }

  drawText(
    p2,
    font,
    s(data.signatureName) || `${s(data.firstName)} ${s(data.lastName)}`.trim(),
    50,
    760,
    9,
    200,
  );
  drawText(p2, font, formatDate(data.signatureDate), 470, 755, 8, 70);
}

function fillHealth(pages: PDFPage[], font: PDFFont, data: ForeignersPdfInput) {
  const [h0, h1, h2] = pages;
  const gender = s(data.gender);

  // Particulars
  drawText(h0, font, s(data.passportNo), 65, 190, 8, 85);
  drawText(h0, font, s(data.lastName), 165, 190, 8, 110);
  drawText(h0, font, s(data.firstName), 295, 190, 8, 90);
  drawText(h0, font, formatDate(data.birthDate), 400, 190, 7, 70);
  if (isMale(gender)) mark(h0, font, 483.5, 192, 8);
  if (isFemale(gender)) mark(h0, font, 510.0, 192, 8);

  // Q1 height / weight
  drawText(h0, font, s(data.heightCm), 140, 258, 9, 50);
  drawText(h0, font, s(data.weightKg), 290, 258, 9, 50);

  // Q2 narcotics / alcohol (+ glasses)
  if (isYes(data.usesNarcotics)) mark(h0, font, 62.2, 276, 8);
  if (isYes(data.drinksAlcohol)) mark(h0, font, 62.2, 289, 8);
  drawText(h0, font, s(data.alcoholGlassesPerDay), 210, 300, 8, 50);
  const q2Yes = isYes(data.usesNarcotics) || isYes(data.drinksAlcohol);
  const q2No = isNo(data.usesNarcotics) && isNo(data.drinksAlcohol);
  markYn(h0, font, 285, q2Yes ? true : q2No ? false : null);

  // Q3–Q7 general
  const general: Array<{ key: keyof ForeignersPdfInput; y: number }> = [
    { key: "pendingExams", y: 340 },
    { key: "surgeryTransplant", y: 392 },
    { key: "hospitalized", y: 420 },
    { key: "regularMedications", y: 450 },
    { key: "allergies", y: 482 },
  ];
  for (const g of general) {
    const ans = answerOf(data[g.key]);
    if (isYes(ans)) markYn(h0, font, g.y, true);
    else if (isNo(ans)) markYn(h0, font, g.y, false);
    const det = detailsOf(data[g.key]);
    if (det) drawText(h0, font, det, 120, g.y + 18, 6.5, 360);
  }

  // Conditions Yes/No + option boxes
  const conditions = data.conditionAnswers || {};
  for (const [groupId, ynPos] of Object.entries(CONDITION_YN)) {
    const ans = conditions[groupId];
    const page = pages[ynPos[0]];
    if (!page) continue;
    if (ans) {
      if (isYes(ans.answer)) markYn(page, font, ynPos[1], true);
      else if (isNo(ans.answer)) markYn(page, font, ynPos[1], false);
      if (ans.details) drawText(page, font, ans.details, 300, ynPos[1] + 22, 6.5, 200);
    }
  }

  for (const [groupId, opts] of Object.entries(OPTION_BOXES)) {
    const ans = conditions[groupId];
    if (!ans?.selected?.length) continue;
    for (const optId of ans.selected) {
      const box = opts[optId];
      if (!box) continue;
      const page = pages[box[0]];
      if (!page) continue;
      mark(page, font, box[1] + 0.5, box[2] + 7, 8);
    }
  }

  // Hernia extras
  const hernia = conditions.hernia;
  if (hernia) {
    if (isYes(hernia.answer)) {
      mark(h1, font, 326.4, 268, 8);
      drawText(h1, font, formatDate(hernia.herniaSurgeryDate), 380, 268, 7, 80);
    } else if (isNo(hernia.answer)) {
      mark(h1, font, 297.3, 268, 8);
    }
    if (isYes(hernia.herniaResolved)) mark(h1, font, 195.1, 279, 8);
    else if (isNo(hernia.herniaResolved)) mark(h1, font, 166.0, 279, 8);
  }

  // Women pregnancy / cesarean
  const women = conditions.women;
  if (women) {
    if (isYes(women.isPregnant)) mark(h1, font, 134.4, 456, 8);
    else if (isNo(women.isPregnant)) mark(h1, font, 105.4, 456, 8);
    const hadCesarean = Boolean(women.selected?.includes("cesarean") || s(women.cesareanDate));
    if (hadCesarean) {
      mark(h1, font, 403.7, 467, 8);
      drawText(h1, font, formatDate(women.cesareanDate), 450, 467, 7, 70);
    } else if (isNo(women.answer) || (women.selected && !women.selected.includes("cesarean"))) {
      mark(h1, font, 374.7, 467, 8);
    }
  }

  // Page 3 – marketing / dismissed / signature
  // Q6 advertising: no @524 / yes @547 (labels); boxes around marketing extra at 69.6,575.8
  if (isYes(data.marketingConsent)) {
    mark(h2, font, 547, 458, 8);
    mark(h2, font, 70.2, 583, 8);
  } else if (isNo(data.marketingConsent)) {
    mark(h2, font, 524, 458, 8);
  }

  if (isYes(data.dismissedBefore)) {
    mark(h2, font, 502.5, 660, 8);
    drawText(h2, font, s(data.dismissedDetails), 130, 675, 7, 350);
  } else if (isNo(data.dismissedBefore)) {
    mark(h2, font, 471.0, 660, 8);
  }

  const sig = s(data.signatureName) || `${s(data.firstName)} ${s(data.lastName)}`.trim();
  // Bottom signature row: Date | Signature (candidate) | Signature (other)
  drawText(h2, font, formatDate(data.signatureDate), 60, 808, 8, 70);
  drawText(h2, font, sig, 320, 808, 8, 70);
  drawText(h2, font, sig, 505, 808, 8, 55);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Build one filled PDF (proposal pages + health pages) as base64.
 */
export async function buildForeignersFilledPdfBase64(
  input: ForeignersPdfInput,
): Promise<{ filename: string; content: string; type: string } | null> {
  try {
    const [proposalBytes, healthBytes, fontBytes] = await Promise.all([
      loadProposalBytes(),
      loadHealthBytes(),
      loadFontBytes(),
    ]);

    if (!proposalBytes?.byteLength || !healthBytes?.byteLength || !fontBytes?.byteLength) {
      throw new Error(
        `Missing assets: proposal=${proposalBytes?.byteLength || 0} health=${healthBytes?.byteLength || 0} font=${fontBytes?.byteLength || 0}`,
      );
    }

    const proposalDoc = await PDFDocument.load(proposalBytes);
    const healthDoc = await PDFDocument.load(healthBytes);
    const out = await PDFDocument.create();
    out.registerFontkit(fontkit);

    let font: PDFFont;
    try {
      font = await out.embedFont(fontBytes, { subset: true });
    } catch (subsetErr) {
      console.error("Font subset failed, embedding full font:", subsetErr);
      font = await out.embedFont(fontBytes);
    }

    const propPages = await out.copyPages(proposalDoc, proposalDoc.getPageIndices());
    propPages.forEach((p) => out.addPage(p));
    const healthPages = await out.copyPages(healthDoc, healthDoc.getPageIndices());
    healthPages.forEach((p) => out.addPage(p));

    const all = out.getPages();
    if (all.length < 6) {
      throw new Error(`Expected 6 pages after merge, got ${all.length}`);
    }
    fillProposal(all.slice(0, 3), font, input);
    fillHealth(all.slice(3, 6), font, input);

    const bytes = await out.save();
    const nameParts = [s(input.firstName), s(input.lastName)].filter(Boolean).join("_") || "applicant";
    const safe = nameParts.replace(/[^\w.-]+/g, "_").slice(0, 40);
    return {
      filename: `Harel_SAFE_STAY_filled_${safe}.pdf`,
      content: uint8ToBase64(bytes),
      type: "application/pdf",
    };
  } catch (err) {
    console.error("buildForeignersFilledPdfBase64 failed:", err);
    return null;
  }
}
