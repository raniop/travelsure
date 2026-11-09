export type YesNo = "" | "yes" | "no";
export type Gender = "" | "male" | "female";
export type TouristProvider = "" | "harel" | "maccabi" | "clalit";
/** Language of the official Harel form that gets filled (more can be added with a template + layout). */
export type FormLanguage = "he" | "en";
export type TouristRole = "main" | "spouse" | "child1" | "child2" | "child3";
export type TouristStep = "intro" | "travelers" | "stay" | "health" | "riders" | "payment" | "review" | "sending" | "success";

export const TOURIST_ROLES: TouristRole[] = ["main", "spouse", "child1", "child2", "child3"];

export type Traveler = {
  role: TouristRole;
  passportNo: string;
  passportCountry: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: Gender;
  entryDate: string;
  citizenship: string;
  visitPurpose: string;
};

/** One health question: an answer per insured, plus the boxes marked under it and free text. */
export type TouristHealthAnswer = {
  answers: Partial<Record<TouristRole, YesNo>>;
  selected: string[];
  details: string;
};

export type TouristRiders = {
  airTransport: TouristRole[];
  /** Personal accidents in Israel — adults 18–70 only (the form strikes it out for children) */
  accidents: TouristRole[];
  extremeSports: TouristRole[];
  extremeFrom: string;
  extremeTo: string;
  medicalManager: TouristRole[];
  onlineConsult: TouristRole[];
};

export type TouristsForm = {
  formLanguage: FormLanguage;
  travelers: Traveler[];
  insuranceFrom: string;
  insuranceTo: string;

  street: string;
  houseNo: string;
  apartmentNo: string;
  town: string;
  mobile: string;
  hostLastName: string;
  email: string;
  documentsByPost: boolean;
  provider: TouristProvider;

  health: Record<string, TouristHealthAnswer>;
  riders: TouristRiders;

  authorizedForChildren: YesNo;
  declarationsAccepted: boolean;
  marketingConsent: YesNo;
  signatureName: string;
  signatureDate: string;

  payerId: string;
  cardholderName: string;
  cardNumber: string;
  cardExp: string;
  installments: "1" | "2";
  payerZip: string;
  payerCity: string;
  payerStreet: string;
  payerPhone: string;
  payerEmail: string;
  paymentConsent: boolean;

  notes: string;
};
