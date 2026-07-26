export type YesNo = "" | "yes" | "no";
export type Gender = "" | "male" | "female";
export type WorkPurpose = "" | "general" | "construction" | "agriculture" | "nursing";
export type Provider = "" | "maccabi" | "clalit";
export type Step =
  | "intro"
  | "worker"
  | "employer"
  | "health"
  | "payment"
  | "review"
  | "sending"
  | "success";

export type HealthAnswer = {
  answer: YesNo;
  details: string;
};

export type HealthConditionGroup = {
  id: string;
  titleHe: string;
  titleEn: string;
  options: { id: string; labelHe: string; labelEn: string }[];
  noteHe?: string;
  noteEn?: string;
  womenOnly?: boolean;
  menOnly?: boolean;
};

export type ForeignersForm = {
  // A – worker
  firstName: string;
  lastName: string;
  passportNo: string;
  passportCountry: string;
  countryOfOrigin: string;
  birthDate: string;
  gender: Gender;
  firstInsuranceDate: string;
  entryDate: string;
  insuranceFrom: string;
  insuranceTo: string;
  workDescription: string;
  street: string;
  houseNo: string;
  apartmentNo: string;
  city: string;
  zip: string;
  phone: string;
  mobile: string;
  email: string;

  // B – purpose
  workPurpose: WorkPurpose;

  // C – provider
  provider: Provider;

  // D – previous insurance
  hadPreviousInsurance: YesNo;
  previousCompany: string;
  previousPolicyNo: string;
  previousMembershipNo: string;
  previousFrom: string;
  previousTo: string;

  // E – employer
  employerName: string;
  employerId: string;
  employerPhone: string;
  employerMobile: string;
  employerEmail: string;
  employerAddress: string;

  // Agent (optional / prefilled)
  agentName: string;
  agentNo: string;

  // Health general
  heightCm: string;
  weightKg: string;
  usesNarcotics: YesNo;
  drinksAlcohol: YesNo;
  alcoholGlassesPerDay: string;
  pendingExams: HealthAnswer;
  surgeryTransplant: HealthAnswer;
  hospitalized: HealthAnswer;
  regularMedications: HealthAnswer;
  allergies: HealthAnswer;

  // Health conditions – map of groupId -> selected option ids + details + yes/no
  conditionAnswers: Record<
    string,
    {
      answer: YesNo;
      selected: string[];
      details: string;
      // hernia extras
      herniaSurgeryDate?: string;
      herniaResolved?: YesNo;
      // pregnancy / cesarean
      isPregnant?: YesNo;
      cesareanDate?: string;
    }
  >;

  dismissedBefore: YesNo;
  dismissedDetails: string;

  // Declarations
  authorizeAgent: boolean;
  healthAnswersTrue: boolean;
  medicalConfidentialityWaiver: boolean;
  receivedEssentialInfo: boolean;
  marketingConsent: YesNo;
  marketingExtraConsent: YesNo;
  explainedInUnderstoodLanguage: boolean;
  signatureName: string;
  signatureDate: string;

  // Payment
  payerLastName: string;
  payerFirstName: string;
  payerId: string;
  cardNumber: string;
  cardExp: string;
  payerStreetHouse: string;
  payerTown: string;
  payerZip: string;
  payerMobile: string;
  payerEmail: string;
  paymentConsent: boolean;
  skipPaymentNow: boolean;

  notes: string;
};

export const emptyHealthAnswer = (): HealthAnswer => ({ answer: "", details: "" });

export const createInitialConditionAnswers = (
  groups: HealthConditionGroup[]
): ForeignersForm["conditionAnswers"] => {
  const map: ForeignersForm["conditionAnswers"] = {};
  groups.forEach((g) => {
    map[g.id] = { answer: "", selected: [], details: "" };
    if (g.id === "hernia") {
      map[g.id].herniaSurgeryDate = "";
      map[g.id].herniaResolved = "";
    }
    if (g.id === "women") {
      map[g.id].isPregnant = "";
      map[g.id].cesareanDate = "";
    }
  });
  return map;
};
