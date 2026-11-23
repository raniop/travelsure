/** Digital application for Harel's First Class annual travel policy for business people (/annual). */
export {
  formatDateInput,
  isValidCardExpiry,
  isValidCardNumber,
  isValidDateDdMmYyyy,
  isValidEmail,
  normalizeDateInput,
} from "@/lib/foreigners/formDefaults";
export { isValidIsraeliId } from "@/lib/travelProposal/formDefaults";

export type YesNo = "" | "yes" | "no";
export type AnnualPlan = "basic" | "extended";
export type AnnualStep = "intro" | "insured" | "contact" | "health" | "coverage" | "payment" | "review" | "sending" | "success";

export type AnnualHealth = {
  q1: YesNo;
  q2: YesNo;
  q21: string[];
  q22: YesNo;
  q3: YesNo;
  q31: YesNo;
  q4: YesNo;
  q4Details: string;
  q5: YesNo;
};

export type AnnualForm = {
  plan: AnnualPlan;
  periodFrom: string;
  // Insured
  idNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "" | "male" | "female";
  israeliResident: boolean;
  inIsrael: boolean;
  // Contact
  street: string;
  houseNo: string;
  city: string;
  occupation: string;
  phone: string;
  mobile: string;
  email: string;
  /** Optional: the agent who sent the request (nothing is sent to them; it tells us who referred it) */
  agentEmail: string;
  health: AnnualHealth;
  // Coverage
  laptopModel: string;
  phoneModel: string;
  rentalCar: boolean;
  // Declarations
  declarationsAccepted: boolean;
  marketingConsentExtra: boolean;
  signatureName: string;
  signatureDate: string;
  // Payment
  payerName: string;
  payerId: string;
  cardNumber: string;
  cardExp: string;
  cardCvv: string;
  payerStreet: string;
  payerHouseNo: string;
  payerCity: string;
  payerZip: string;
  payerPhone: string;
  payerMobile: string;
  paymentConsent: boolean;
  notes: string;
};

export const PLAN_LABELS: Record<AnnualPlan, string> = {
  basic: "פוליסה שנתית",
  extended: "פוליסה שנתית מורחבת",
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toDdMmYyyy = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

export const parseDdMmYyyy = (value: string) => {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
};

/** The policy runs 365 days (366 in a leap year): the same date next year, minus one day. */
export const periodEnd = (from: string) => {
  const d = parseDdMmYyyy(from);
  if (!d) return "";
  return toDdMmYyyy(new Date(d.getFullYear() + 1, d.getMonth(), d.getDate() - 1));
};

/** Whole years on the given date. */
export const ageOn = (birthDate: string, on: Date) => {
  const b = parseDdMmYyyy(birthDate);
  if (!b) return null;
  let years = on.getFullYear() - b.getFullYear();
  if (on < new Date(on.getFullYear(), b.getMonth(), b.getDate())) years -= 1;
  return years;
};

export const createInitialAnnualForm = (): AnnualForm => ({
  plan: "basic",
  periodFrom: "",
  idNumber: "",
  firstName: "",
  lastName: "",
  birthDate: "",
  gender: "",
  israeliResident: false,
  inIsrael: false,
  street: "",
  houseNo: "",
  city: "",
  occupation: "",
  phone: "",
  mobile: "",
  email: "",
  agentEmail: "",
  health: { q1: "", q2: "", q21: [], q22: "", q3: "", q31: "", q4: "", q4Details: "", q5: "" },
  laptopModel: "",
  phoneModel: "",
  rentalCar: false,
  declarationsAccepted: false,
  marketingConsentExtra: false,
  signatureName: "",
  signatureDate: toDdMmYyyy(new Date()),
  payerName: "",
  payerId: "",
  cardNumber: "",
  cardExp: "",
  cardCvv: "",
  payerStreet: "",
  payerHouseNo: "",
  payerCity: "",
  payerZip: "",
  payerPhone: "",
  payerMobile: "",
  paymentConsent: false,
  notes: "",
});

/** Answers that need an up-to-date medical document, per the form's notes. */
export const needsMedicalDocument = (h: AnnualHealth) =>
  (h.q2 === "yes" && (h.q21.length > 0 || h.q22 === "yes")) || (h.q3 === "yes" && h.q31 === "no") || h.q4 === "yes";
