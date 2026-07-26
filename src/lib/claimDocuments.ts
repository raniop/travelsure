export type ClaimDocRequirement = {
  id: string;
  /** Short title shown as the main line. */
  label: string;
  /** Optional one-line clarification under the title. */
  hint?: string;
  /** When false, shown under “if relevant” and does not block submit. */
  required: boolean;
};

type ClaimType = "medical" | "trip_cancel" | "trip_shorten" | "baggage";
type BaggageSubtype = "loss_theft" | "delay" | "loss" | "theft" | null | undefined;

const medicalDocs: ClaimDocRequirement[] = [
  {
    id: "medical_report",
    label: "דוח רפואי מחו״ל",
    hint: "מרופא מטפל — סיבת פנייה, אנמנזה ואבחנה",
    required: true,
  },
  { id: "medical_invoice", label: "חשבון מפורט", required: true },
  { id: "medical_receipts", label: "קבלות תשלום", hint: "במקור", required: true },
];

const tripCancelDocs: ClaimDocRequirement[] = [
  { id: "cancel_plan", label: "תוכנית הנסיעה", hint: "העתק מסלול / תוכנית", required: true },
  {
    id: "cancel_tickets",
    label: "כרטיסי טיסה וקבלה",
    hint: "מקוריים לחבילת הנסיעה",
    required: true,
  },
  {
    id: "cancel_agent_fees",
    label: "אישור דמי ביטול",
    hint: "מסוכן הנסיעות — פירוט קרקע מול טיסה",
    required: true,
  },
  { id: "cancel_unfit", label: "אישור רפואי לאי-כשירות לטוס", required: true },
  { id: "cancel_medical_summary", label: "דוח רפואי / סיכום אשפוז", required: true },
  {
    id: "cancel_family",
    label: "מסמך משפחתי",
    hint: "סיכום רפואי או תעודת פטירה + הוכחת קרבה",
    required: false,
  },
];

const tripShortenDocs: ClaimDocRequirement[] = [
  {
    id: "shorten_medical_abroad",
    label: "דוח רפואי מחו״ל",
    hint: "מרופא מטפל — סיבת פנייה, אנמנזה ואבחנה",
    required: true,
  },
  { id: "shorten_plan", label: "תוכנית נסיעה מקורית", required: true },
  {
    id: "shorten_tickets",
    label: "כרטיסי טיסה וקבלה",
    hint: "מקוריים לחבילת הנסיעה",
    required: true,
  },
  {
    id: "shorten_agent_refund",
    label: "אישור החזר מסוכן",
    hint: "על שירותים שלא נוצלו — פירוט קרקע מול טיסה",
    required: true,
  },
  {
    id: "shorten_new_tickets",
    label: "כרטיסים חדשים / שינוי כרטיס",
    hint: "קבלות לחזרה מוקדמת",
    required: true,
  },
  {
    id: "shorten_medical_need",
    label: "אישור רפואי לקיצור הנסיעה",
    required: true,
  },
  {
    id: "shorten_family",
    label: "מסמך משפחתי",
    hint: "סיכום רפואי או תעודת פטירה + הוכחת קרבה",
    required: false,
  },
];

const baggageLossTheftDocs: ClaimDocRequirement[] = [
  {
    id: "baggage_police",
    label: "דו״ח משטרה",
    hint: "במקור, ממקום ומזמן האירוע",
    required: true,
  },
  {
    id: "baggage_purchase",
    label: "קבלות רכישה",
    hint: "על הרכוש שאבד או נגנב",
    required: true,
  },
  {
    id: "baggage_restore",
    label: "קבלות שחזור מסמכים",
    hint: "רק אם שיחזרתם מסמכים",
    required: false,
  },
  {
    id: "baggage_airline_loss",
    label: "תשובת חברת התעופה",
    hint: "רק אם האירוע אצל מוביל אווירי",
    required: false,
  },
];

const baggageDelayDocs: ClaimDocRequirement[] = [
  {
    id: "baggage_delay_airline",
    label: "דיווח איחור לחברת התעופה",
    hint: "PIR או תשובת חברת התעופה",
    required: true,
  },
  {
    id: "baggage_delay_essentials",
    label: "קבלות לציוד חיוני",
    hint: "שנרכש בגלל האיחור",
    required: true,
  },
];

/** Required + optional document checklist for the current claim selection. */
export function getClaimDocumentRequirements(
  claimType: ClaimType | null | undefined,
  baggageSubtype?: BaggageSubtype
): ClaimDocRequirement[] {
  switch (claimType) {
    case "medical":
      return medicalDocs;
    case "trip_cancel":
      return tripCancelDocs;
    case "trip_shorten":
      return tripShortenDocs;
    case "baggage":
      if (baggageSubtype === "delay") return baggageDelayDocs;
      return baggageLossTheftDocs;
    default:
      return [];
  }
}

export function flattenClaimDocFiles(docFiles: Record<string, File[]>): File[] {
  const out: File[] = [];
  for (const files of Object.values(docFiles)) {
    for (const file of files || []) out.push(file);
  }
  return out;
}

export function missingRequiredClaimDocs(
  requirements: ClaimDocRequirement[],
  docFiles: Record<string, File[]>
): ClaimDocRequirement[] {
  return requirements.filter((doc) => doc.required && !(docFiles[doc.id]?.length > 0));
}
