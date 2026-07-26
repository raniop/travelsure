export type ClaimDocRequirement = {
  id: string;
  label: string;
  /** When false, shown in checklist but does not block submit. */
  required: boolean;
};

type ClaimType = "medical" | "trip_cancel" | "trip_shorten" | "baggage";
type BaggageSubtype = "loss_theft" | "delay" | "loss" | "theft" | null | undefined;

const medicalDocs: ClaimDocRequirement[] = [
  {
    id: "medical_report",
    label: "דוח רפואי מרופא מטפל בחו״ל (סיבת פנייה, אנמנזה ואבחנה)",
    required: true,
  },
  { id: "medical_invoice", label: "חשבון מפורט", required: true },
  { id: "medical_receipts", label: "קבלות תשלום מקוריות", required: true },
];

const tripCancelDocs: ClaimDocRequirement[] = [
  { id: "cancel_plan", label: "העתק תוכנית / מסלול הנסיעה", required: true },
  { id: "cancel_tickets", label: "כרטיסי טיסה וקבלה מקוריים לחבילת הנסיעה", required: true },
  {
    id: "cancel_agent_fees",
    label: "אישור סוכן על דמי ביטול / החזר (פירוט קרקע מול טיסה)",
    required: true,
  },
  { id: "cancel_unfit", label: "אישור רפואי על אי-כשירות לטוס", required: true },
  { id: "cancel_medical_summary", label: "דוח רפואי / סיכום אשפוז", required: true },
  {
    id: "cancel_family",
    label: "במקרה משפחתי: סיכום רפואי/תעודת פטירה + הוכחת קרבה",
    required: false,
  },
];

const tripShortenDocs: ClaimDocRequirement[] = [
  {
    id: "shorten_medical_abroad",
    label: "דוח רפואי מרופא מטפל בחו״ל (סיבת פנייה, אנמנזה ואבחנה)",
    required: true,
  },
  { id: "shorten_plan", label: "תוכנית נסיעה מקורית", required: true },
  { id: "shorten_tickets", label: "כרטיסי טיסה וקבלה מקוריים לחבילת הנסיעה", required: true },
  {
    id: "shorten_agent_refund",
    label: "אישור סוכן על החזר עבור שירותים שלא נוצלו (פירוט קרקע מול טיסה)",
    required: true,
  },
  {
    id: "shorten_new_tickets",
    label: "קבלות מקוריות לכרטיסים חדשים / שינוי כרטיסים לחזרה מוקדמת",
    required: true,
  },
  {
    id: "shorten_medical_need",
    label: "אישור רפואי מחו״ל על הצורך בקיצור הנסיעה וחזרה מוקדמת",
    required: true,
  },
  {
    id: "shorten_family",
    label: "במקרה משפחתי: סיכום רפואי/תעודת פטירה + הוכחת קרבה",
    required: false,
  },
];

const baggageLossTheftDocs: ClaimDocRequirement[] = [
  {
    id: "baggage_police",
    label: "דו״ח משטרה במקור ממקום ומזמן האירוע",
    required: true,
  },
  { id: "baggage_purchase", label: "קבלות רכישה על הרכוש שאבד/נגנב", required: true },
  { id: "baggage_restore", label: "בשחזור מסמכים: קבלות שחזור", required: false },
  {
    id: "baggage_airline_loss",
    label: "אם אצל מוביל אווירי: תשובת חברת התעופה",
    required: false,
  },
];

const baggageDelayDocs: ClaimDocRequirement[] = [
  {
    id: "baggage_delay_airline",
    label: "דיווח איחור לחברת התעופה / PIR / תשובת חברת התעופה",
    required: true,
  },
  {
    id: "baggage_delay_essentials",
    label: "קבלות לציוד חיוני שנרכש עקב האיחור",
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
