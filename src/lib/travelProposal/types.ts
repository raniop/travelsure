export type YesNo = "" | "yes" | "no";
export type Gender = "" | "male" | "female";

export type Step =
  | "intro"
  | "identity"
  | "trip"
  | "insureds"
  | "health"
  | "plan"
  | "review"
  | "sending"
  | "success";

export type DestinationId =
  | "europe"
  | "asia"
  | "australia"
  | "latam"
  | "canada"
  | "africa"
  | "antarctica"
  | "usa";

export type ValuableItemId =
  | "camera"
  | "drone"
  | "religious"
  | "stroller"
  | "surfboard"
  | "wheelchair"
  | "scooter"
  | "instrument";

export type BicycleLimit = "" | "2500" | "4500" | "6000";
export type RentalCarLimit = "" | "1500" | "6000";

export type PersonHealth = {
  q1: YesNo;
  q2: YesNo;
  q21Conditions: string[];
  q22: YesNo;
  q3: YesNo;
  q31: YesNo;
  q4: YesNo;
  q4Details: string;
  q5Pregnant: YesNo;
  q51Week: string;
  q52HighRisk: YesNo;
};

export type PersonPlan = {
  /** Opt-out of included search & rescue */
  optOutSearchRescue: boolean;
  /** Opt-out of included third-party liability */
  optOutThirdParty: boolean;
  baggage: boolean;
  /** Extended baggage — valuable item up to $2,000 */
  baggageValuables: boolean;
  valuableItems: ValuableItemId[];
  cancellation: boolean;
  cancellationExpanded: boolean;
  priorCondition: boolean;
  pregnancy: boolean;
  adventureSports: boolean;
  adventureFrom: string;
  adventureTo: string;
  winterSports: boolean;
  winterFrom: string;
  winterTo: string;
  proSports: boolean;
  proFrom: string;
  proTo: string;
  personalAccident: boolean;
  personalAccidentAdventure: boolean;
  laptop: boolean;
  laptopModel: string;
  phone: boolean;
  phoneModel: string;
  bicycle: boolean;
  bicycleLimit: BicycleLimit;
  bicycleModel: string;
  bicyclePurchaseDate: string;
  bicycleValueNis: string;
  rentalCar: boolean;
  rentalCarLimit: RentalCarLimit;
  rentalFrom: string;
  rentalTo: string;
};

export type InsuredPerson = {
  included: boolean;
  gender: Gender;
  idNumber: string;
  lastNameHe: string;
  lastNameEn: string;
  firstNameHe: string;
  firstNameEn: string;
  birthDate: string;
  health: PersonHealth;
  plan: PersonPlan;
};

export type TravelProposalForm = {
  // Agent
  agentName: string;
  agentNo: string;

  // A – trip
  tripFrom: string;
  tripTo: string;
  destinations: DestinationId[];
  usaFrom: string;
  usaTo: string;
  countriesDetail: string;

  // B – contact
  street: string;
  houseNo: string;
  city: string;
  occupation: string;
  phone: string;
  mobile: string;
  email: string;

  // C – insureds
  israeliResidents: boolean;
  primary: InsuredPerson;
  spouse: InsuredPerson;
  child1: InsuredPerson;
  child2: InsuredPerson;
  child3: InsuredPerson;
  child4: InsuredPerson;

  // Shared plan notes (models written once on PDF when primary selected)
  baggageValuablesNote: string;

  // Declarations
  declarationsAccepted: boolean;
  marketingConsentExtra: boolean;

  // Payment
  payerName: string;
  payerId: string;
  installments: string;
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
  signatureDate: string;

  notes: string;
};

export const PERSON_KEYS = ["primary", "spouse", "child1", "child2", "child3", "child4"] as const;
export type PersonKey = (typeof PERSON_KEYS)[number];

export const PERSON_LABELS_HE: Record<PersonKey, string> = {
  primary: "מבוטח ראשי",
  spouse: "בן/ת זוג",
  child1: "ילד/ה 1",
  child2: "ילד/ה 2",
  child3: "ילד/ה 3",
  child4: "ילד/ה 4",
};

export const DESTINATION_OPTIONS: { id: DestinationId; labelHe: string }[] = [
  { id: "europe", labelHe: "אירופה" },
  { id: "africa", labelHe: "אפריקה" },
  { id: "canada", labelHe: "קנדה" },
  { id: "usa", labelHe: "ארה״ב" },
  { id: "antarctica", labelHe: "אנטארקטיקה" },
  { id: "australia", labelHe: "אוסטרליה" },
  { id: "latam", labelHe: "דרום ומרכז אמריקה" },
  { id: "asia", labelHe: "אסיה" },
];

export const VALUABLE_OPTIONS: { id: ValuableItemId; labelHe: string }[] = [
  { id: "camera", labelHe: "מצלמה" },
  { id: "drone", labelHe: "רחפן" },
  { id: "religious", labelHe: "תשמישי קדושה" },
  { id: "stroller", labelHe: "עגלת תינוק" },
  { id: "surfboard", labelHe: "גלשן" },
  { id: "wheelchair", labelHe: "כיסא גלגלים" },
  { id: "scooter", labelHe: "קלנועית" },
  { id: "instrument", labelHe: "כלי נגינה" },
];

export const Q21_CONDITIONS: { id: string; labelHe: string }[] = [
  { id: "dialysis", labelHe: "אי ספיקת כליות עם טיפול בדיאליזה" },
  { id: "blood", labelHe: "מחלות דם עם טיפול פעיל בעירוי דם/הקזות" },
  {
    id: "cancer",
    labelHe: "מחלות ממאירות בתהליכי טיפול פעילים של הקרנות ו/או כימותרפיה ו/או טיפול ביולוגי",
  },
  {
    id: "neuro",
    labelHe:
      "ירידה בזיכרון או בהתמצאות המצריכה השגחה או ליווי ו/או תופעה או מחלה במערכת העצבים, לרבות אירוע מוחי ו/או מחלה ניוונית כדוגמת ALS בגינם קיים חוסר יציבות/נפילות חוזרות. מחלה/תופעה הדורשת שימוש במחולל חמצן.",
  },
  {
    id: "liver",
    labelHe:
      "שחמת כבד עם סיבוכים כגון דימומים, צורך בהשתלה, מיימת (הצטברות נוזלים), אי ספיקת כבד.",
  },
];
