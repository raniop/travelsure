import { HEALTH_CONDITION_GROUPS } from "@/lib/foreigners/healthQuestions";
import {
  PROVIDER_LABELS,
  WORK_PURPOSE_LABELS,
} from "@/lib/foreigners/formDefaults";
import type { ForeignersForm } from "@/lib/foreigners/types";

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

const yn = (v: string) => (v === "yes" ? "כן" : v === "no" ? "לא" : "");

const buildReadablePayload = (form: ForeignersForm) => {
  const workerName = [form.firstName, form.lastName].filter(Boolean).join(" ");

  const generalHealth = [
    ["גובה (ס״מ)", form.heightCm],
    ["משקל (ק״ג)", form.weightKg],
    ["שימוש בסמים", yn(form.usesNarcotics)],
    ["שתיית אלכוהול סדירה", yn(form.drinksAlcohol)],
    ["כוסות אלכוהול ביום", form.alcoholGlassesPerDay],
    ["בדיקות ממתינות / ללא אבחנה סופית", `${yn(form.pendingExams.answer)}${form.pendingExams.details ? ` — ${form.pendingExams.details}` : ""}`],
    ["ניתוח / השתלה (10 שנים)", `${yn(form.surgeryTransplant.answer)}${form.surgeryTransplant.details ? ` — ${form.surgeryTransplant.details}` : ""}`],
    ["אשפוז (10 שנים)", `${yn(form.hospitalized.answer)}${form.hospitalized.details ? ` — ${form.hospitalized.details}` : ""}`],
    ["תרופות קבועות", `${yn(form.regularMedications.answer)}${form.regularMedications.details ? ` — ${form.regularMedications.details}` : ""}`],
    ["אלרגיות", `${yn(form.allergies.answer)}${form.allergies.details ? ` — ${form.allergies.details}` : ""}`],
  ];

  const conditions = HEALTH_CONDITION_GROUPS.map((group) => {
    const ans = form.conditionAnswers[group.id];
    if (!ans) return null;
    if (group.womenOnly && form.gender !== "female") return null;
    if (group.menOnly && form.gender !== "male") return null;
    const selectedLabels = group.options
      .filter((o) => ans.selected.includes(o.id))
      .map((o) => o.labelHe)
      .join(", ");
    const extras: string[] = [];
    if (group.id === "hernia") {
      if (ans.herniaSurgeryDate) extras.push(`תאריך ניתוח: ${ans.herniaSurgeryDate}`);
      if (ans.herniaResolved) extras.push(`הבעיה נפתרה: ${yn(ans.herniaResolved)}`);
    }
    if (group.id === "women") {
      if (ans.isPregnant) extras.push(`הריון: ${yn(ans.isPregnant)}`);
      if (ans.cesareanDate) extras.push(`תאריך קיסרי: ${ans.cesareanDate}`);
    }
    return {
      group: group.titleHe,
      answer: yn(ans.answer),
      selected: selectedLabels,
      details: ans.details,
      extras: extras.join(" | "),
    };
  }).filter(Boolean);

  return {
    workerName,
    summary: {
      firstName: form.firstName,
      lastName: form.lastName,
      passportNo: form.passportNo,
      passportCountry: form.passportCountry,
      countryOfOrigin: form.countryOfOrigin,
      birthDate: form.birthDate,
      gender: form.gender === "male" ? "זכר" : form.gender === "female" ? "נקבה" : "",
      firstInsuranceDate: form.firstInsuranceDate,
      entryDate: form.entryDate,
      insuranceFrom: form.insuranceFrom,
      insuranceTo: form.insuranceTo,
      workDescription: form.workDescription,
      address: [form.street, form.houseNo, form.apartmentNo && `דירה ${form.apartmentNo}`, form.city, form.zip]
        .filter(Boolean)
        .join(", "),
      phone: form.phone,
      mobile: form.mobile,
      email: form.email,
      workPurpose: WORK_PURPOSE_LABELS[form.workPurpose] || form.workPurpose,
      provider: PROVIDER_LABELS[form.provider] || form.provider,
      hadPreviousInsurance: yn(form.hadPreviousInsurance),
      previousCompany: form.previousCompany,
      previousPolicyNo: form.previousPolicyNo,
      previousMembershipNo: form.previousMembershipNo,
      previousFrom: form.previousFrom,
      previousTo: form.previousTo,
      employerName: form.employerName,
      employerId: form.employerId,
      employerPhone: form.employerPhone,
      employerMobile: form.employerMobile,
      employerEmail: form.employerEmail,
      employerAddress: form.employerAddress,
      agentName: form.agentName,
      agentNo: form.agentNo,
      generalHealth,
      conditions,
      dismissedBefore: yn(form.dismissedBefore),
      dismissedDetails: form.dismissedDetails,
      declarationsAccepted: form.declarationsAccepted ? "כן" : "לא",
      marketingConsent: yn(form.marketingConsent),
      signatureName: form.signatureName,
      signatureDate: form.signatureDate,
      payerLastName: form.payerLastName,
      payerFirstName: form.payerFirstName,
      payerId: form.payerId,
      cardNumber: form.cardNumber,
      cardExp: form.cardExp,
      paymentConsent: form.paymentConsent ? "כן" : "לא",
      notes: form.notes,
    },
  };
};

export async function submitForeignersApplication(form: ForeignersForm, files: File[]) {
  const { workerName, summary } = buildReadablePayload(form);

  const attachments = await Promise.all(
    files.map(async (file) => {
      const content = await fileToBase64(file);
      return {
        name: file.name,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        type: file.type || "application/octet-stream",
        contentBase64: content,
        content,
      };
    })
  );

  const payload = {
    mode: "foreigners",
    type: "foreigners",
    name: workerName,
    fullName: workerName,
    email: form.email || form.employerEmail,
    phone: form.mobile || form.phone || form.employerMobile,
    subject: `ביטוח עובדים זרים: ${workerName}`,
    message: `בקשה דיגיטלית לביטוח עובדים זרים עבור ${workerName}, מעסיק: ${form.employerName}, דרכון: ${form.passportNo}`,
    employerName: form.employerName,
    passportNo: form.passportNo,
    notify: [...STAFF_NOTIFY],
    foreignersPayload: summary,
    // Raw structured form for official Harel PDF fill (edge function).
    formData: form,
    attachments,
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const supabaseHeaders = {
    "Content-Type": "application/json",
    ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
  };

  const endpoints: Array<{ url: string; headers?: Record<string, string> }> = [
    {
      url: `${supabaseUrl}/functions/v1/send-foreigners-application`,
      headers: supabaseHeaders,
    },
    {
      url: `${supabaseUrl}/functions/v1/send-contact-email`,
      headers: supabaseHeaders,
    },
    {
      url: "/api-foreigners.php",
      headers: { "Content-Type": "application/json" },
    },
    {
      url: "https://ophir.travelsure.co.il/api-foreigners.php",
      headers: { "Content-Type": "application/json" },
    },
  ];

  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: endpoint.headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({ success: true }));
        return { ok: true as const, data };
      }
      lastError = new Error(`HTTP ${res.status} at ${endpoint.url}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("submit_failed");
}
