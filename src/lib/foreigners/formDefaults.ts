import { HEALTH_CONDITION_GROUPS } from "./healthQuestions";
import {
  createInitialConditionAnswers,
  emptyHealthAnswer,
  type ForeignersForm,
} from "./types";

const todayDdMmYyyy = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const createInitialForeignersForm = (): ForeignersForm => ({
  firstName: "",
  lastName: "",
  passportNo: "",
  passportCountry: "",
  countryOfOrigin: "",
  birthDate: "",
  gender: "",
  firstInsuranceDate: "",
  entryDate: "",
  insuranceFrom: "",
  insuranceTo: "",
  workDescription: "",
  street: "",
  houseNo: "",
  apartmentNo: "",
  city: "",
  zip: "",
  phone: "",
  mobile: "",
  email: "",

  workPurpose: "",
  provider: "",

  hadPreviousInsurance: "",
  previousCompany: "",
  previousPolicyNo: "",
  previousMembershipNo: "",
  previousFrom: "",
  previousTo: "",

  employerName: "",
  employerId: "",
  employerPhone: "",
  employerMobile: "",
  employerEmail: "",
  employerAddress: "",

  agentName: "אופיר ושות׳ סוכנות לביטוח",
  agentNo: "59795",

  heightCm: "",
  weightKg: "",
  usesNarcotics: "",
  drinksAlcohol: "",
  alcoholGlassesPerDay: "",
  pendingExams: emptyHealthAnswer(),
  surgeryTransplant: emptyHealthAnswer(),
  hospitalized: emptyHealthAnswer(),
  regularMedications: emptyHealthAnswer(),
  allergies: emptyHealthAnswer(),

  conditionAnswers: createInitialConditionAnswers(HEALTH_CONDITION_GROUPS),

  dismissedBefore: "",
  dismissedDetails: "",

  declarationsAccepted: false,
  marketingConsent: "",
  signatureName: "",
  signatureDate: todayDdMmYyyy(),

  payerLastName: "",
  payerFirstName: "",
  payerId: "",
  cardNumber: "",
  cardExp: "",
  paymentConsent: false,

  notes: "",
});

export const formatDateInput = (raw: string) => {
  // Typed with separators (1/5/26, 16.11.2026): keep the parts as typed; digits past a part's length move on
  if (/[/.-]/.test(raw)) {
    const segs = raw.split(/[/.-]/).map((p) => p.replace(/\D/g, ""));
    const max = [2, 2, 4];
    const out: string[] = [];
    let carry = "";
    for (let i = 0; i < 3; i++) {
      if (i >= segs.length && !carry) break;
      const part = carry + (segs[i] ?? "");
      out.push(part.slice(0, max[i]));
      carry = part.slice(max[i]);
    }
    return out.join("/");
  }
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/**
 * Completes a typed date on leaving the field: 16/11/26 → 16/11/2026, 1/5/78 → 01/05/1978.
 * A 2-digit year up to 10 years ahead is this century, otherwise the last one.
 */
export const normalizeDateInput = (value: string) => {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return value;
  let year = m[3];
  if (year.length === 2) {
    const yy = Number(year);
    year = String(yy <= (new Date().getFullYear() % 100) + 10 ? 2000 + yy : 1900 + yy);
  }
  return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${year}`;
};

export const isValidDateDdMmYyyy = (value: string) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [dd, mm, yyyy] = value.split("/").map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 2100) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
};

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** Hebrew / other non-Latin letters that must not appear on the foreign worker form. */
export const containsHebrew = (value: string) => /[\u0590-\u05FF]/.test(value);

/** Keep Latin letters, digits, and common punctuation — strip Hebrew characters. */
export const toEnglishOnly = (value: string) => value.replace(/[\u0590-\u05FF]+/g, "");

/**
 * Card number: 8–19 digits. No checksum, so Amex (15), Diners (14) and short Israeli
 * Isracard numbers (8–9) are all accepted; the agency checks the card when charging.
 */
export const isValidCardNumber = (value: string) => /^\d{8,19}$/.test(value.replace(/\D/g, ""));

/** MM/YY must be a real month and not expired. */
export const isValidCardExpiry = (value: string) => {
  if (!/^\d{2}\/\d{2}$/.test(value.trim())) return false;
  const [mmStr, yyStr] = value.trim().split("/");
  const mm = Number(mmStr);
  const yy = Number(yyStr);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;
  return true;
};

export const suggestedInstallments = (from: string, to: string): number | null => {
  if (!isValidDateDdMmYyyy(from) || !isValidDateDdMmYyyy(to)) return null;
  const [fd, fm, fy] = from.split("/").map(Number);
  const [td, tm, ty] = to.split("/").map(Number);
  const start = new Date(fy, fm - 1, fd).getTime();
  const end = new Date(ty, tm - 1, td).getTime();
  if (end < start) return null;
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  if (days <= 90) return 1;
  if (days <= 180) return 2;
  if (days <= 240) return 4;
  if (days <= 365) return 6;
  return 6;
};

export const WORK_PURPOSE_LABELS: Record<string, string> = {
  general: "כללי / General",
  construction: "בניין / Construction",
  agriculture: "חקלאות / Agriculture",
  nursing: "סיעוד / Nursing care",
};

export const PROVIDER_LABELS: Record<string, string> = {
  maccabi: "מכבי שירותי בריאות",
  clalit: "שירותי בריאות כללית",
};
