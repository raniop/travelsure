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
  middleName: "",
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
  preferPostMail: "no",

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

  authorizeAgent: true,
  healthAnswersTrue: false,
  medicalConfidentialityWaiver: false,
  receivedEssentialInfo: false,
  marketingConsent: "",
  marketingExtraConsent: "no",
  explainedInUnderstoodLanguage: false,
  signatureName: "",
  signatureDate: todayDdMmYyyy(),

  payerLastName: "",
  payerFirstName: "",
  payerId: "",
  cardNumber: "",
  cardExp: "",
  payerStreetHouse: "",
  payerTown: "",
  payerZip: "",
  payerMobile: "",
  payerEmail: "",
  paymentConsent: false,
  skipPaymentNow: false,

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
