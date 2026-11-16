import { Q21_OPTIONS } from "@/lib/travelProposal/healthQuestions";
import { PLAN_LABELS, periodEnd, type AnnualForm, type YesNo } from "@/lib/annual/form";

const STAFF_NOTIFY = ["rani@ophirins.co.il", "eli@ophirins.co.il", "hadar@ophirins.co.il", "ophir@ophirins.co.il"] as const;

type Pair = [string, string];

const yn = (v: YesNo) => (v === "yes" ? "כן" : v === "no" ? "לא" : "");

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      if (!base64) reject(new Error("empty file"));
      else resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });

const buildSummary = (form: AnnualForm) => {
  const h = form.health;
  const health: Pair[] = [
    ["1. מטרת הנסיעה: ייעוץ / אבחון / טיפול רפואי", yn(h.q1)],
    ["2. תרופות קבועות או טיפול רפואי בחצי השנה האחרונה", yn(h.q2)],
  ];
  if (h.q2 === "yes") {
    const picked = Q21_OPTIONS.filter((o) => h.q21.includes(o.id)).map((o) => o.labelHe);
    health.push(["2.1 מצבים רפואיים", picked.length ? picked.join("; ") : "אף אחד מהמצבים"]);
    health.push(["2.2 אי ספיקת לב עם בצקות / קוצר נשימה", yn(h.q22)]);
  }
  health.push(["3. ניתוח / אשפוז בחצי השנה האחרונה", yn(h.q3)]);
  if (h.q3 === "yes") health.push(["3.1 בוצע וחלפו 3 חודשים", yn(h.q31)]);
  health.push(["4. הפניה לבדיקות / ממצא חריג", yn(h.q4)]);
  if (h.q4 === "yes") health.push(["פירוט הבדיקות", h.q4Details]);
  if (form.gender === "female") health.push(["5. הריון", yn(h.q5)]);

  return {
    insured: [
      ["תכנית", PLAN_LABELS[form.plan]],
      ["שם", `${form.firstName} ${form.lastName}`],
      ["ת.ז.", form.idNumber],
      ["תאריך לידה", form.birthDate],
      ["מין", form.gender === "male" ? "זכר" : form.gender === "female" ? "נקבה" : ""],
      ["תושב/ת ישראל", form.israeliResident ? "כן" : "לא"],
      ["בישראל בעת הרכישה", form.inIsrael ? "כן" : "לא"],
    ] as Pair[],
    contact: [
      ["תקופת ביטוח", `${form.periodFrom} – ${periodEnd(form.periodFrom)}`],
      ["כתובת", [form.street, form.houseNo, form.city].filter(Boolean).join(", ")],
      ["מקצוע / עיסוק", form.occupation],
      ["נייד", form.mobile],
      ["טלפון", form.phone],
      ["דוא״ל", form.email],
    ] as Pair[],
    health,
    coverage: [
      ["מחשב נישא / טאבלט — דגם", form.laptopModel],
      ["טלפון נייד — דגם", form.phoneModel],
      [
        "ביטול השתתפות עצמית לרכב שכור",
        form.plan === "extended" ? "כלול בתכנית" : form.rentalCar ? "כן (בתוספת תשלום)" : "לא",
      ],
    ] as Pair[],
    declarations: [
      ["אישור ההצהרות", form.declarationsAccepted ? "כן" : "לא"],
      ["פרסומות נוספות מקבוצת הראל", form.marketingConsentExtra ? "כן" : "לא"],
      ["שם החותם", form.signatureName],
      ["תאריך", form.signatureDate],
      ["הערות", form.notes],
    ] as Pair[],
    payment: [
      ["בעל הכרטיס", form.payerName],
      ["ת.ז. משלם", form.payerId],
      ["מספר כרטיס", form.cardNumber],
      ["תוקף", form.cardExp],
      ["כתובת משלם", [form.payerStreet, form.payerHouseNo, form.payerCity, form.payerZip].filter(Boolean).join(", ")],
      ["טלפון משלם", [form.payerMobile, form.payerPhone].filter(Boolean).join(" / ")],
      ["אישור חיוב", form.paymentConsent ? "כן" : "לא"],
    ] as Pair[],
  };
};

const toPlainText = (summary: ReturnType<typeof buildSummary>) =>
  (
    [
      ["המבוטח", summary.insured],
      ["תקופה וכתובת", summary.contact],
      ["הצהרת בריאות", summary.health],
      ["כיסויים", summary.coverage],
      ["הצהרות", summary.declarations],
      ["תשלום", summary.payment],
    ] as Array<[string, Pair[]]>
  )
    .map(([title, rows]) => [`== ${title}`, ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join("\n"))
    .join("\n\n");

export async function submitAnnualApplication(form: AnnualForm, files: File[]) {
  const name = `${form.firstName} ${form.lastName}`.trim();
  const summary = buildSummary(form);
  const attachments = await Promise.all(
    files.map(async (file) => {
      const content = await fileToBase64(file);
      const type = file.type || "application/octet-stream";
      return { name: file.name, filename: file.name, contentType: type, type, contentBase64: content, content };
    }),
  );

  const payload = {
    mode: "annual",
    type: "annual",
    name,
    fullName: name,
    idNumber: form.idNumber,
    email: form.email,
    phone: form.mobile,
    subject: `ביטוח נסיעות שנתי (${PLAN_LABELS[form.plan]}): ${name}`,
    message: toPlainText(summary),
    notify: [...STAFF_NOTIFY],
    annualPayload: summary,
    // Structured form for filling Harel's official PDF (edge function)
    formData: {
      ...form,
      periodTo: periodEnd(form.periodFrom),
      payerMobile: form.payerMobile,
      installments: "1",
    },
    attachments,
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const headers = {
    "Content-Type": "application/json",
    ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
  };

  // The generic contact email is the fallback: everything as text, without the filled PDF
  const endpoints = [`${supabaseUrl}/functions/v1/send-annual-proposal`, `${supabaseUrl}/functions/v1/send-contact-email`];
  let lastError: unknown = null;
  for (const url of endpoints) {
    try {
      const body = url.endsWith("send-contact-email") ? { ...payload, attachments: [], formData: undefined } : payload;
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (res.ok) return { ok: true as const, data: await res.json().catch(() => ({ success: true })) };
      lastError = new Error(`HTTP ${res.status} at ${url}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("submit_failed");
}
