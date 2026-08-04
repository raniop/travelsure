import type {
  InsuredPerson,
  PersonHealth,
  PersonKey,
  PersonPlan,
  TravelProposalForm,
} from "./types";
import { PERSON_KEYS } from "./types";

const todayDdMmYyyy = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const emptyHealth = (): PersonHealth => ({
  q1: "",
  q2: "",
  q21Conditions: [],
  q22: "",
  q3: "",
  q31: "",
  q4: "",
  q4Details: "",
  q5Pregnant: "",
  q51Week: "",
  q52HighRisk: "",
});

export const emptyPlan = (): PersonPlan => ({
  optOutSearchRescue: false,
  optOutThirdParty: false,
  baggage: false,
  baggageValuables: false,
  valuableItems: [],
  cancellation: false,
  cancellationExpanded: false,
  priorCondition: false,
  pregnancy: false,
  adventureSports: false,
  adventureFrom: "",
  adventureTo: "",
  winterSports: false,
  winterFrom: "",
  winterTo: "",
  proSports: false,
  proFrom: "",
  proTo: "",
  personalAccident: false,
  personalAccidentAdventure: false,
  laptop: false,
  laptopModel: "",
  phone: false,
  phoneModel: "",
  bicycle: false,
  bicycleLimit: "",
  bicycleModel: "",
  bicyclePurchaseDate: "",
  bicycleValueNis: "",
  rentalCar: false,
  rentalCarLimit: "",
  rentalFrom: "",
  rentalTo: "",
});

export const emptyPerson = (included = false): InsuredPerson => ({
  included,
  gender: "",
  idNumber: "",
  lastNameHe: "",
  lastNameEn: "",
  firstNameHe: "",
  firstNameEn: "",
  birthDate: "",
  health: emptyHealth(),
  plan: emptyPlan(),
});

export const createInitialTravelProposalForm = (): TravelProposalForm => ({
  agentName: "אופיר ושות׳ סוכנות לביטוח",
  agentNo: "59795",

  tripFrom: "",
  tripTo: "",
  destinations: [],
  usaFrom: "",
  usaTo: "",
  countriesDetail: "",

  street: "",
  houseNo: "",
  city: "",
  occupation: "",
  phone: "",
  mobile: "",
  email: "",

  israeliResidents: true,
  primary: emptyPerson(true),
  spouse: emptyPerson(false),
  child1: emptyPerson(false),
  child2: emptyPerson(false),
  child3: emptyPerson(false),
  child4: emptyPerson(false),

  baggageValuablesNote: "",

  declarationsAccepted: false,
  marketingConsentExtra: false,

  payerName: "",
  payerId: "",
  installments: "1",
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
  signatureDate: todayDdMmYyyy(),

  notes: "",
});

export const getPerson = (form: TravelProposalForm, key: PersonKey): InsuredPerson => form[key];

export const includedPersons = (form: TravelProposalForm): { key: PersonKey; person: InsuredPerson }[] =>
  PERSON_KEYS.map((key) => ({ key, person: form[key] })).filter(
    ({ key, person }) => key === "primary" || person.included
  );

export const formatDateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const formatCardExpInput = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const isValidDateDdMmYyyy = (value: string) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [dd, mm, yyyy] = value.split("/").map(Number);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900 || yyyy > 2100) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
};

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isValidIsraeliId = (value: string) => {
  const id = value.replace(/\D/g, "");
  if (!/^\d{9}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(id[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
};

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

export const ageFromBirthDate = (birthDate: string, asOf = new Date()): number | null => {
  if (!isValidDateDdMmYyyy(birthDate)) return null;
  const [dd, mm, yyyy] = birthDate.split("/").map(Number);
  let age = asOf.getFullYear() - yyyy;
  const m = asOf.getMonth() + 1 - mm;
  if (m < 0 || (m === 0 && asOf.getDate() < dd)) age -= 1;
  return age;
};

export const maxTripDaysForAge = (age: number): number => {
  if (age <= 50) return 365;
  if (age <= 60) return 180;
  if (age <= 75) return 120;
  if (age <= 80) return 60;
  return 30;
};

export const tripDays = (from: string, to: string): number | null => {
  if (!isValidDateDdMmYyyy(from) || !isValidDateDdMmYyyy(to)) return null;
  const [fd, fm, fy] = from.split("/").map(Number);
  const [td, tm, ty] = to.split("/").map(Number);
  const start = new Date(fy, fm - 1, fd).getTime();
  const end = new Date(ty, tm - 1, td).getTime();
  if (end < start) return null;
  return Math.round((end - start) / 86400000) + 1;
};

export const markAllHealthNo = (person: InsuredPerson): InsuredPerson => ({
  ...person,
  health: {
    ...emptyHealth(),
    q1: "no",
    q2: "no",
    q22: "no",
    q3: "no",
    q31: "",
    q4: "no",
    q5Pregnant: person.gender === "female" ? "no" : "",
    q52HighRisk: "",
  },
});

export const displayName = (p: InsuredPerson) =>
  [p.firstNameHe || p.firstNameEn, p.lastNameHe || p.lastNameEn].filter(Boolean).join(" ").trim();
