import { MEDICAL_CARE_QUESTION, TOURIST_HEALTH_QUESTIONS } from "@/lib/tourists/healthQuestions";
import {
  PROVIDER_LABELS,
  ROLE_LABELS,
  appliesTo,
  periodDays,
  travelerName,
  yn,
} from "@/lib/tourists/formDefaults";
import type { TouristRole, TouristsForm } from "@/lib/tourists/types";

const STAFF_NOTIFY = ["rani@ophirins.co.il"] as const;

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

type Pair = [string, string];

const roleNames = (form: TouristsForm, roles: TouristRole[]) =>
  roles
    .map((r) => form.travelers.find((t) => t.role === r))
    .filter(Boolean)
    .map((t) => `${ROLE_LABELS[t!.role].he} (${travelerName(t!)})`)
    .join(", ");

/**
 * "Please specify" text for the form: per insured who answered yes, the questions (by the number
 * printed on the form), the boxes marked and the details. Written in the form's language.
 */
export const buildHealthSummary = (form: TouristsForm) => {
  const en = form.formLanguage === "en";
  const lines: string[] = [];
  for (const t of form.travelers) {
    const parts: string[] = [];
    for (const q of [MEDICAL_CARE_QUESTION, ...TOURIST_HEALTH_QUESTIONS]) {
      const ans = form.health[q.id];
      if (ans?.answers[t.role] !== "yes" || !appliesTo(q.id, t)) continue;
      const options = q.options.filter((o) => ans.selected.includes(o.id)).map((o) => (en ? o.en.replace(/\*$/, "") : o.he));
      const text = [options.join(", "), ans.details.trim()].filter(Boolean).join(" — ");
      parts.push(`${q.no}. ${text || (en ? q.en : q.he)}`);
    }
    if (parts.length) {
      const role = en ? ROLE_LABELS[t.role].en : ROLE_LABELS[t.role].he;
      lines.push(`${role} (${travelerName(t)}): ${parts.join(". ")}`);
    }
  }
  return lines.join("\n");
};

const buildReadable = (form: TouristsForm) => {
  const travelers = form.travelers.map((t) => ({
    title: `${ROLE_LABELS[t.role].he}: ${travelerName(t)}`,
    rows: [
      ["מספר דרכון", t.passportNo],
      ["ארץ הנפקת דרכון", t.passportCountry],
      ["תאריך לידה", t.birthDate],
      ["מין", t.gender === "male" ? "זכר" : t.gender === "female" ? "נקבה" : ""],
      ["תאריך כניסה לישראל", t.entryDate],
      ["אזרחות", t.citizenship],
      ["מטרת הביקור", t.visitPurpose],
    ] as Pair[],
  }));

  const days = periodDays(form.insuranceFrom, form.insuranceTo);
  const stay: Pair[] = [
    ["תקופת ביטוח", `${form.insuranceFrom} – ${form.insuranceTo}${days ? ` (${days} ימים)` : ""}`],
    ["כתובת בישראל", [form.street, form.houseNo, form.apartmentNo && `דירה ${form.apartmentNo}`, form.town].filter(Boolean).join(", ")],
    ["משפחה מארחת", form.hostLastName],
    ["נייד", form.mobile],
    ["דוא״ל", form.email],
    ["מסמכים בדואר ישראל", form.documentsByPost ? "כן" : "לא"],
    ["ספק שירות", PROVIDER_LABELS[form.provider] || form.provider],
    ["שפת הטופס", form.formLanguage === "en" ? "אנגלית" : "עברית"],
  ];

  const health: Pair[] = [];
  for (const q of [MEDICAL_CARE_QUESTION, ...TOURIST_HEALTH_QUESTIONS]) {
    const ans = form.health[q.id];
    const yesRoles = form.travelers.filter((t) => ans?.answers[t.role] === "yes" && appliesTo(q.id, t)).map((t) => t.role);
    if (!yesRoles.length) continue;
    const options = q.options.filter((o) => ans.selected.includes(o.id)).map((o) => o.he);
    health.push([
      `${q.no}. ${q.he}`,
      [`כן: ${roleNames(form, yesRoles)}`, options.length ? `סומן: ${options.join(", ")}` : "", ans.details.trim() ? `פירוט: ${ans.details.trim()}` : ""]
        .filter(Boolean)
        .join("\n"),
    ]);
  }
  if (!health.length) health.push(["הצהרת בריאות", "לא לכל השאלות, לכל המבוטחים"]);

  const r = form.riders;
  const riders: Pair[] = [
    ["נספח הטסה רפואית", roleNames(form, r.airTransport)],
    ["תאונות אישיות בישראל", roleNames(form, r.accidents)],
    ["ביטול חריג ספורט אתגרי", r.extremeSports.length ? `${roleNames(form, r.extremeSports)} · ${r.extremeFrom || form.insuranceFrom} – ${r.extremeTo || form.insuranceTo}` : ""],
    ["רופא מלווה אישי", roleNames(form, r.medicalManager)],
    ["ייעוץ רפואי בשיחת וידאו", roleNames(form, r.onlineConsult)],
  ];

  const declarations: Pair[] = [
    ["אישור ההצהרות", form.declarationsAccepted ? "כן" : "לא"],
    ["מוסמך/ת לחתום עבור הילדים", yn(form.authorizedForChildren)],
    ["דיוור מקבוצת הראל", yn(form.marketingConsent)],
    ["שם החותם", form.signatureName],
    ["תאריך", form.signatureDate],
    ["הערות", form.notes],
  ];

  const payment: Pair[] = [
    ["ת.ז. / דרכון משלם", form.payerId],
    ["שם בעל הכרטיס", form.cardholderName],
    ["מספר כרטיס", form.cardNumber],
    ["תוקף", form.cardExp],
    ["מספר תשלומים", days && days > 90 ? form.installments : "1"],
    ["כתובת משלם", [form.payerStreet, form.payerCity, form.payerZip].filter(Boolean).join(", ")],
    ["טלפון משלם", form.payerPhone],
    ["דוא״ל משלם", form.payerEmail],
    ["אישור חיוב", form.paymentConsent ? "כן" : "לא"],
  ];

  return { travelers, stay, health, riders, declarations, payment };
};

/** Plain-text version for the generic contact-email fallback (no PDF there). */
const toPlainText = (summary: ReturnType<typeof buildReadable>) =>
  [
    ...summary.travelers.map((t) => [`== ${t.title}`, ...t.rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join("\n")),
    ...(
      [
        ["כתובת וספק", summary.stay],
        ["הצהרת בריאות", summary.health],
        ["הרחבות", summary.riders],
        ["הצהרות", summary.declarations],
        ["תשלום", summary.payment],
      ] as Array<[string, Pair[]]>
    ).map(([title, rows]) => [`== ${title}`, ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join("\n")),
  ].join("\n\n");

export async function submitTouristsApplication(form: TouristsForm, files: File[]) {
  const main = form.travelers.find((t) => t.role === "main") || form.travelers[0];
  const name = travelerName(main);
  const summary = buildReadable(form);

  const attachments = await Promise.all(
    files.map(async (file) => {
      const content = await fileToBase64(file);
      const type = file.type || "application/octet-stream";
      return { name: file.name, filename: file.name, contentType: type, type, contentBase64: content, content };
    }),
  );

  const payload = {
    mode: "tourists",
    type: "tourists",
    name,
    fullName: name,
    email: form.email,
    phone: form.mobile,
    passportNo: main.passportNo,
    subject: `ביטוח תיירים: ${name}`,
    message: toPlainText(summary),
    notify: [...STAFF_NOTIFY],
    touristsPayload: summary,
    // Structured form for filling Harel's official PDF (edge function)
    formData: { ...form, healthSummary: buildHealthSummary(form) },
    attachments,
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const headers = {
    "Content-Type": "application/json",
    ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
  };

  // The generic contact email is the fallback: everything as text, without the filled PDF
  const endpoints = [`${supabaseUrl}/functions/v1/send-tourists-application`, `${supabaseUrl}/functions/v1/send-contact-email`];
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
