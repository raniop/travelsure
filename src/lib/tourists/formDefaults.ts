import { TOURIST_HEALTH_QUESTIONS, MEDICAL_CARE_QUESTION } from "./healthQuestions";
import type { Traveler, TouristRole, TouristsForm, YesNo } from "./types";

export {
  containsHebrew,
  formatDateInput,
  isValidCardExpiry,
  isValidCardNumber,
  isValidDateDdMmYyyy,
  isValidEmail,
  toEnglishOnly,
} from "@/lib/foreigners/formDefaults";

const todayDdMmYyyy = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export const ROLE_LABELS: Record<TouristRole, { he: string; en: string }> = {
  main: { he: "מבוטח/ת ראשי/ת", en: "Main insured" },
  spouse: { he: "בן/בת זוג", en: "Spouse" },
  child1: { he: "ילד/ה 1", en: "Child 1" },
  child2: { he: "ילד/ה 2", en: "Child 2" },
  child3: { he: "ילד/ה 3", en: "Child 3" },
};

export const PROVIDER_LABELS: Record<string, string> = {
  harel: "מערך פרטי של הראל",
  maccabi: "מכבי שירותי בריאות",
  clalit: "שירותי בריאות כללית",
};

export const FORM_LANGUAGES: Array<{ id: TouristsForm["formLanguage"]; label: string }> = [
  { id: "he", label: "עברית" },
  { id: "en", label: "English" },
];

export const emptyTraveler = (role: TouristRole): Traveler => ({
  role,
  passportNo: "",
  passportCountry: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "",
  entryDate: "",
  citizenship: "",
  visitPurpose: "",
});

export const createInitialTouristsForm = (): TouristsForm => ({
  formLanguage: "he",
  travelers: [emptyTraveler("main")],
  insuranceFrom: "",
  insuranceTo: "",
  street: "",
  houseNo: "",
  apartmentNo: "",
  town: "",
  mobile: "",
  hostLastName: "",
  email: "",
  documentsByPost: false,
  provider: "",
  health: Object.fromEntries(
    [MEDICAL_CARE_QUESTION, ...TOURIST_HEALTH_QUESTIONS].map((q) => [q.id, { answers: {}, selected: [], details: "" }]),
  ),
  riders: {
    airTransport: [],
    accidents: [],
    extremeSports: [],
    extremeFrom: "",
    extremeTo: "",
    medicalManager: [],
    onlineConsult: [],
  },
  authorizedForChildren: "",
  declarationsAccepted: false,
  marketingConsent: "",
  signatureName: "",
  signatureDate: todayDdMmYyyy(),
  payerId: "",
  cardholderName: "",
  cardNumber: "",
  cardExp: "",
  installments: "1",
  payerZip: "",
  payerCity: "",
  payerStreet: "",
  payerPhone: "",
  payerEmail: "",
  paymentConsent: false,
  notes: "",
});

const parseDdMmYyyy = (value: string) => {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
};

/** Whole years on the given date (default today); null when the birth date is not valid. */
export const ageOn = (birthDate: string, on = new Date()) => {
  const b = parseDdMmYyyy(birthDate);
  if (!b) return null;
  let years = on.getFullYear() - b.getFullYear();
  if (on < new Date(on.getFullYear(), b.getMonth(), b.getDate())) years -= 1;
  return years;
};

/** Insurance days, both ends included. */
export const periodDays = (from: string, to: string) => {
  const a = parseDdMmYyyy(from);
  const b = parseDdMmYyyy(to);
  if (!a || !b || b < a) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
};

export const travelerName = (t: Traveler) => [t.firstName, t.lastName].filter(Boolean).join(" ");

export const travelerLabel = (t: Traveler) => {
  const name = travelerName(t);
  return name ? `${ROLE_LABELS[t.role].he} · ${name}` : ROLE_LABELS[t.role].he;
};

/** Health questions that apply to this group of insured (women/men-only by the genders entered). */
export const visibleHealthQuestions = (travelers: Traveler[]) =>
  TOURIST_HEALTH_QUESTIONS.filter((q) => {
    if (q.women) return travelers.some((t) => t.gender === "female");
    if (q.men) return travelers.some((t) => t.gender === "male");
    return true;
  });

/** Whether a question applies to a given insured (women/men questions only to that gender). */
export const appliesTo = (questionId: string, t: Traveler) => {
  const q = TOURIST_HEALTH_QUESTIONS.find((x) => x.id === questionId);
  if (q?.women) return t.gender === "female";
  if (q?.men) return t.gender === "male";
  return true;
};

export const yn = (v: YesNo | undefined) => (v === "yes" ? "כן" : v === "no" ? "לא" : "");
