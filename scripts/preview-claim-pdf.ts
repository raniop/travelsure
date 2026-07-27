import { buildClaimPdfBase64 } from "../supabase/functions/send-contact-email/claimPdf.ts";

const claim = {
  claimType: "trip_cancel",
  claimTypeLabel: "ביטול נסיעה טרם היציאה",
  fullName: "רחל כהן",
  firstName: "רחל",
  lastName: "כהן",
  idNumber: "054692181",
  email: "rachelchn57@gmail.com",
  mobile: "050-7903559",
  policyNumber: "123456789",
  claimReason: "אירוע רפואי שלי",
  incidentDate: "2026-06-21",
  tripStartDate: "2026-07-01",
  tripEndDate: "2026-07-10",
  details:
    "כאבים עזים בגב התחתון עם הקרנה לרגל. קושי בהליכה ועמידה ממושכת. קיבלתי משככי כאבים והמלצה רפואית לא לטוס.",
  totalClaimed: "39036 ILS",
  bankName: "בנק מסד בע״מ",
  bankCode: "46",
  branchNumber: "539",
  branchName: "באר שבע",
  accountNumber: "107972",
  declaration: true,
  medicalWaiver: true,
  authorizeAgent: true,
  submittedAt: "2026-06-28T13:56:00",
  expenses: [
    { type: "כרטיס טיסה או שייט", amount: "39036 ILS", date: "2026-05-01", currency: "ILS" },
  ],
};

const pdf = await buildClaimPdfBase64(claim, "20260099", [
  "צק מבוטל של רחל כהן.png",
  "סיכום ביקור אורטופד.pdf",
  "אישור לביטוח רחל ויעקב כהן.pdf",
]);

if (!pdf) {
  console.error("PDF generation failed");
  Deno.exit(1);
}

const bytes = Uint8Array.from(atob(pdf.content), (c) => c.charCodeAt(0));
await Deno.mkdir("/opt/cursor/artifacts", { recursive: true });
await Deno.writeFile("/opt/cursor/artifacts/claim-preview-20260099.pdf", bytes);
console.log("wrote", "/opt/cursor/artifacts/claim-preview-20260099.pdf", bytes.length);
