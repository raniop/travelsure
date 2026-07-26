export type ClaimDocRequirement = {
  id: string;
  /** Short title shown as the main line. */
  label: string;
  /** Plain-language explanation of exactly what to attach. */
  hint: string;
  /** When false, shown under “if relevant” and does not block submit. */
  required: boolean;
};

type ClaimType = "medical" | "trip_cancel" | "trip_shorten" | "baggage";
type BaggageSubtype = "loss_theft" | "delay" | "loss" | "theft" | null | undefined;

const medicalDocs: ClaimDocRequirement[] = [
  {
    id: "medical_report",
    label: "דוח רפואי מחו״ל",
    hint: "מכתב או דוח מהרופא שטיפל בכם בחו״ל — כולל סיבת הפנייה, מה נבדק ומה האבחנה",
    required: true,
  },
  {
    id: "medical_invoice",
    label: "חשבון מפורט",
    hint: "חשבונית / פירוט חיוב מהמרפאה או בית החולים על הטיפול שקיבלתם",
    required: true,
  },
  {
    id: "medical_receipts",
    label: "קבלות תשלום",
    hint: "קבלה על התשלום ששילמתם בפועל (צילום או סריקה של הקבלה המקורית)",
    required: true,
  },
];

const tripCancelDocs: ClaimDocRequirement[] = [
  {
    id: "cancel_plan",
    label: "תוכנית הנסיעה",
    hint: "העתק של מסלול / תוכנית הנסיעה המקורית שתוכננה",
    required: true,
  },
  {
    id: "cancel_tickets",
    label: "כרטיסי טיסה וקבלה",
    hint: "כרטיסי הטיסה וקבלה על רכישת חבילת הנסיעה (במקור או סריקה ברורה)",
    required: true,
  },
  {
    id: "cancel_agent_fees",
    label: "אישור דמי ביטול",
    hint: "אישור מסוכן הנסיעות על דמי הביטול / ההחזר — עם פירוט מה בוטל בטיסה ומה בקרקע",
    required: true,
  },
  {
    id: "cancel_unfit",
    label: "אישור רפואי לאי-כשירות לטוס",
    hint: "אישור רפואי שמראה שלא יכולתם לטוס בתאריך המתוכנן",
    required: true,
  },
  {
    id: "cancel_medical_summary",
    label: "דוח רפואי / סיכום אשפוז",
    hint: "מסמך רפואי שמסביר את הסיבה לביטול — דוח רופא או סיכום אשפוז",
    required: true,
  },
  {
    id: "cancel_family",
    label: "מסמך משפחתי",
    hint: "רק אם הביטול בגלל בן משפחה: סיכום רפואי או תעודת פטירה + הוכחת קרבה",
    required: false,
  },
];

const tripShortenDocs: ClaimDocRequirement[] = [
  {
    id: "shorten_medical_abroad",
    label: "דוח רפואי מחו״ל",
    hint: "מכתב או דוח מהרופא שטיפל בכם בחו״ל — כולל סיבת הפנייה, מה נבדק ומה האבחנה",
    required: true,
  },
  {
    id: "shorten_plan",
    label: "תוכנית נסיעה מקורית",
    hint: "העתק של תוכנית / מסלול הנסיעה לפני הקיצור",
    required: true,
  },
  {
    id: "shorten_tickets",
    label: "כרטיסי טיסה וקבלה",
    hint: "כרטיסי הטיסה המקוריים וקבלה על חבילת הנסיעה",
    required: true,
  },
  {
    id: "shorten_agent_refund",
    label: "אישור החזר מסוכן",
    hint: "אישור מסוכן הנסיעות על החזר עבור שירותים שלא נוצלו — פירוט טיסה מול קרקע",
    required: true,
  },
  {
    id: "shorten_new_tickets",
    label: "כרטיסים חדשים / שינוי כרטיס",
    hint: "קבלות על כרטיסי חזרה חדשים או על שינוי הכרטיסים לחזרה מוקדמת",
    required: true,
  },
  {
    id: "shorten_medical_need",
    label: "אישור רפואי לקיצור הנסיעה",
    hint: "אישור רפואי מחו״ל שמסביר מדוע נדרשת חזרה מוקדמת לישראל",
    required: true,
  },
  {
    id: "shorten_family",
    label: "מסמך משפחתי",
    hint: "רק אם הקיצור בגלל בן משפחה: סיכום רפואי או תעודת פטירה + הוכחת קרבה",
    required: false,
  },
];

const baggageLossTheftDocs: ClaimDocRequirement[] = [
  {
    id: "baggage_police",
    label: "דו״ח משטרה",
    hint: "דו״ח משטרה מקורי שנפתח במקום ובזמן האירוע (אובדן או גניבה)",
    required: true,
  },
  {
    id: "baggage_purchase",
    label: "קבלות רכישה",
    hint: "קבלות על הפריטים שאבדו או נגנבו — כמה שיותר ברורות",
    required: true,
  },
  {
    id: "baggage_restore",
    label: "קבלות שחזור מסמכים",
    hint: "רק אם שילמתם על שחזור דרכון / מסמכים — צרפו את הקבלות",
    required: false,
  },
  {
    id: "baggage_airline_loss",
    label: "תשובת חברת התעופה",
    hint: "רק אם האירוע אצל חברת התעופה — צרפו את תשובתם או טופס PIR",
    required: false,
  },
];

const baggageDelayDocs: ClaimDocRequirement[] = [
  {
    id: "baggage_delay_airline",
    label: "דיווח איחור לחברת התעופה",
    hint: "אישור / PIR / תשובה מחברת התעופה על איחור בהגעת הכבודה",
    required: true,
  },
  {
    id: "baggage_delay_essentials",
    label: "קבלות לציוד חיוני",
    hint: "קבלות על דברים חיוניים שקניתם בגלל האיחור (בגדים, מוצרי היגיינה וכו׳)",
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
