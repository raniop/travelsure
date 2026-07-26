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
  agentNo: "",

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
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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

/** Luhn check for credit/debit card numbers. */
export const isValidCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

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
