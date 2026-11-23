import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AgencyHeader from "@/components/AgencyHeader";
import AgencyFooter from "@/components/AgencyFooter";
import {
  PLAN_LABELS,
  ageOn,
  createInitialAnnualForm,
  formatDateInput,
  isValidCardExpiry,
  isValidCardNumber,
  isValidDateDdMmYyyy,
  isValidEmail,
  isValidIsraeliId,
  needsMedicalDocument,
  normalizeDateInput,
  parseDdMmYyyy,
  periodEnd,
  type AnnualForm,
  type AnnualHealth,
  type AnnualPlan,
  type AnnualStep,
  type YesNo,
} from "@/lib/annual/form";
import {
  Q1_NOTE,
  Q1_TITLE,
  Q21_OPTIONS,
  Q21_TITLE,
  Q22_BODY,
  Q22_TITLE,
  Q2_EXCEPTIONS,
  Q2_TITLE,
  Q31_TITLE,
  Q3_NOTE,
  Q3_TITLE,
  Q3_TOPICS,
  Q4_DETAILS_HINT,
  Q4_TITLE,
} from "@/lib/travelProposal/healthQuestions";
import { submitAnnualApplication } from "@/lib/submitAnnual";
import { ArrowLeft, ArrowRight, Briefcase, Check, FileUp, Loader2, Send, ShieldCheck, Trash2 } from "lucide-react";

// Agency look, same as /tourists and /foreigners
const fieldCls =
  "min-h-[52px] rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] text-[17px] font-semibold text-[#000144] md:text-[17px] placeholder:font-normal placeholder:text-[#8A94AD] focus-visible:border-[#00A247] focus-visible:ring-0 focus-visible:ring-offset-0";
const textareaCls =
  "rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] text-[16px] font-medium text-[#000144] placeholder:text-[#8A94AD] focus-visible:border-[#00A247] focus-visible:ring-0 focus-visible:ring-offset-0";
const choiceCls = (active: boolean) =>
  `min-h-[48px] rounded-[14px] border-2 px-3 text-[15px] font-bold transition ${
    active ? "border-[#000144] bg-[#000144] text-white" : "border-[#D5DAE3] bg-white text-[#33405F] hover:border-[#000144]/40"
  }`;
const chipCls = (active: boolean) =>
  `min-h-[40px] rounded-[14px] border-2 px-4 py-2 text-right text-[14px] font-bold ${
    active ? "border-[#00A247] bg-[#E6F6EC] text-[#000144]" : "border-[#D5DAE3] bg-white text-[#33405F]"
  }`;
const cardCls = "rounded-[20px] border-2 border-[#E3E7EE] bg-white p-4";
const checkboxCls = "mt-0.5 h-5 w-5 rounded-[6px] border-2 border-[#000144] data-[state=checked]:bg-[#000144] data-[state=checked]:text-white";

const STEPS: { id: AnnualStep; label: string }[] = [
  { id: "insured", label: "המבוטח" },
  { id: "contact", label: "כתובת ופרטי קשר" },
  { id: "health", label: "בריאות" },
  { id: "coverage", label: "כיסויים" },
  { id: "payment", label: "תשלום" },
  { id: "review", label: "שליחה" },
];
const ORDER: AnnualStep[] = ["intro", "insured", "contact", "health", "coverage", "payment", "review"];

/** What each plan includes, from the plan page of Harel's forms */
const PLAN_ROWS: Array<{ label: string; basic: boolean | "extra"; extended: boolean }> = [
  { label: "ביטוח רפואי, חיפוש ואיתור, חבות כלפי צד ג׳", basic: true, extended: true },
  { label: "כבודה — אובדן או גניבה", basic: true, extended: true },
  { label: "ביטול וקיצור נסיעה", basic: true, extended: false },
  { label: "ביטול וקיצור נסיעה מורחב", basic: false, extended: true },
  { label: "החמרה של מצב רפואי קודם", basic: true, extended: true },
  { label: "ספורט אתגרי חובבני וספורט חורף", basic: true, extended: true },
  { label: "מחשב נישא / טאבלט וטלפון נייד", basic: true, extended: true },
  { label: "פריט יקר ערך עד $2,000", basic: false, extended: true },
  { label: "תאונות אישיות + הרחבה לספורט אתגרי", basic: false, extended: true },
  { label: "ביטול השתתפות עצמית לרכב שכור", basic: "extra", extended: true },
];

/** Annual premium per insured in USD, by age (Rani 2026-11-23) */
const PLAN_PRICES: Record<AnnualPlan, Array<{ ages: string; usd: number }>> = {
  basic: [
    { ages: "עד גיל 65 (כולל)", usd: 398 },
    { ages: "גיל 66 עד 75", usd: 599 },
  ],
  extended: [
    { ages: "עד גיל 65 (כולל)", usd: 598 },
    { ages: "גיל 66 עד 75", usd: 799 },
  ],
};

const Field = ({ label, required, error, children, hint }: { label: string; required?: boolean; error?: string; children: ReactNode; hint?: string }) => (
  <div className="text-right">
    <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#46557A]">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[12px] font-medium text-[#8A94AD]">{hint}</p>}
    {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
  </div>
);

const YesNoToggle = ({ value, onChange, name }: { value: YesNo; onChange: (v: YesNo) => void; name: string }) => (
  <div className="flex gap-2" role="group" aria-label={name}>
    {[
      { v: "no" as const, label: "לא" },
      { v: "yes" as const, label: "כן" },
    ].map((opt) => (
      <button
        key={opt.v}
        type="button"
        aria-pressed={value === opt.v}
        onClick={() => onChange(opt.v)}
        className={`min-h-[48px] flex-1 rounded-[14px] border-2 text-[15px] font-bold transition ${
          value === opt.v ? "border-[#000144] bg-[#000144] text-white" : "border-[#D5DAE3] bg-white text-[#33405F] hover:border-[#000144]/40"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Annual = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<AnnualStep>("intro");
  // Every step opens at the top of the page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);
  const [form, setForm] = useState<AnnualForm>(() => createInitialAnnualForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const progressIndex = Math.max(0, STEPS.findIndex((s) => s.id === (step === "sending" || step === "success" ? "review" : step)));
  const progressPct = step === "intro" ? 0 : ((progressIndex + 1) / STEPS.length) * 100;
  const periodTo = useMemo(() => periodEnd(form.periodFrom), [form.periodFrom]);
  const h = form.health;
  const isFemale = form.gender === "female";
  const blockedQ1 = h.q1 === "yes";
  const blockedQ5 = isFemale && h.q5 === "yes";
  const docNeeded = needsMedicalDocument(h);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setField = <K extends keyof AnnualForm>(name: K, value: AnnualForm[K]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    clearError(name as string);
  };

  const setHealth = (patch: Partial<AnnualHealth>) => {
    setForm((prev) => {
      const next = { ...prev.health, ...patch };
      // Follow-up questions are cleared when their parent answer is "no"
      if (next.q2 !== "yes") Object.assign(next, { q21: [], q22: "" });
      if (next.q3 !== "yes") next.q31 = "";
      if (next.q4 !== "yes") next.q4Details = "";
      return { ...prev, health: next };
    });
    Object.keys(patch).forEach((k) => clearError(`h.${k}`));
  };

  const markAllHealthNo = () => {
    setForm((prev) => ({
      ...prev,
      health: { q1: "no", q2: "no", q21: [], q22: "", q3: "no", q31: "", q4: "no", q4Details: "", q5: prev.gender === "female" ? "no" : "" },
    }));
    setErrors({});
    toast({ title: "סומן הכל כ־לא", description: "אפשר לעבור על השאלות ולשנות אם צריך." });
  };

  /* ---------- validation ---------- */

  const validateInsured = () => {
    const next: Record<string, string> = {};
    const from = parseDdMmYyyy(form.periodFrom);
    if (!from || !isValidDateDdMmYyyy(form.periodFrom)) next.periodFrom = "תאריך בפורמט DD/MM/YYYY";
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (from < today) next.periodFrom = "תאריך תחילת הביטוח לא יכול להיות בעבר";
    }
    if (!isValidIsraeliId(form.idNumber)) next.idNumber = "תעודת זהות לא תקינה";
    if (!form.firstName.trim()) next.firstName = "שדה חובה";
    if (!form.lastName.trim()) next.lastName = "שדה חובה";
    if (!isValidDateDdMmYyyy(form.birthDate)) next.birthDate = "תאריך בפורמט DD/MM/YYYY";
    else {
      const age = ageOn(form.birthDate, from || new Date());
      if (age !== null && (age < 19 || age > 75)) next.birthDate = "הפוליסה השנתית מיועדת לגילאי 19 עד 75";
    }
    if (!form.gender) next.gender = "שדה חובה";
    if (!form.israeliResident) next.israeliResident = "הביטוח מיועד לתושבי ישראל בלבד";
    if (!form.inIsrael) next.inIsrael = "הרכישה אפשרית רק כשהמבוטח נמצא בישראל";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateContact = () => {
    const next: Record<string, string> = {};
    if (!form.street.trim()) next.street = "שדה חובה";
    if (!form.houseNo.trim()) next.houseNo = "שדה חובה";
    if (!form.city.trim()) next.city = "שדה חובה";
    if (!form.mobile.trim()) next.mobile = "שדה חובה";
    if (!isValidEmail(form.email)) next.email = "אימייל לא תקין";
    if (form.agentEmail?.trim() && !isValidEmail(form.agentEmail)) next.agentEmail = "אימייל לא תקין";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateHealth = () => {
    const next: Record<string, string> = {};
    if (!h.q1) next["h.q1"] = "יש לענות כן/לא";
    if (!h.q2) next["h.q2"] = "יש לענות כן/לא";
    if (h.q2 === "yes" && !h.q22) next["h.q22"] = "יש לענות כן/לא";
    if (!h.q3) next["h.q3"] = "יש לענות כן/לא";
    if (h.q3 === "yes" && !h.q31) next["h.q31"] = "יש לענות כן/לא";
    if (!h.q4) next["h.q4"] = "יש לענות כן/לא";
    if (h.q4 === "yes" && !h.q4Details.trim()) next["h.q4"] = "יש לפרט את הבדיקות";
    if (isFemale && !h.q5) next["h.q5"] = "יש לענות כן/לא";
    if (docNeeded && files.length === 0) next.files = "לפי התשובות יש לצרף תעודה עדכנית מהרופא המטפל";
    setErrors(next);
    return Object.keys(next).length === 0 && !blockedQ1 && !blockedQ5;
  };

  const validatePayment = () => {
    const next: Record<string, string> = {};
    if (!form.declarationsAccepted) next.declarationsAccepted = "חובה לאשר את ההצהרות";
    if (!form.signatureName.trim()) next.signatureName = "שדה חובה";
    if (!isValidDateDdMmYyyy(form.signatureDate)) next.signatureDate = "תאריך בפורמט DD/MM/YYYY";
    if (!form.payerName.trim()) next.payerName = "שדה חובה";
    if (!isValidIsraeliId(form.payerId)) next.payerId = "תעודת זהות לא תקינה";
    if (!isValidCardNumber(form.cardNumber)) next.cardNumber = "מספר כרטיס לא תקין";
    if (!isValidCardExpiry(form.cardExp)) next.cardExp = "תוקף לא תקין או שפג";
    if (!/^\d{3,4}$/.test(form.cardCvv)) next.cardCvv = "יש להזין 3 ספרות (באמריקן אקספרס 4)";
    if (!form.payerMobile.trim()) next.payerMobile = "שדה חובה";
    if (!form.paymentConsent) next.paymentConsent = "חובה לאשר";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    const validators: Partial<Record<AnnualStep, () => boolean>> = {
      insured: validateInsured,
      contact: validateContact,
      health: validateHealth,
      payment: validatePayment,
    };
    if (validators[step] && !validators[step]!()) {
      toast({ title: "יש להשלים את השדות המסומנים", variant: "destructive" });
      return;
    }
    if (step === "contact") {
      // Prefill the payer and the signature from the insured
      const name = `${form.firstName} ${form.lastName}`.trim();
      setForm((prev) => ({
        ...prev,
        signatureName: prev.signatureName || name,
        payerName: prev.payerName || name,
        payerId: prev.payerId || prev.idNumber,
        payerStreet: prev.payerStreet || prev.street,
        payerHouseNo: prev.payerHouseNo || prev.houseNo,
        payerCity: prev.payerCity || prev.city,
        payerMobile: prev.payerMobile || prev.mobile,
        payerPhone: prev.payerPhone || prev.phone,
      }));
    }
    const idx = ORDER.indexOf(step);
    if (idx >= 0 && idx < ORDER.length - 1) setStep(ORDER[idx + 1]);
  };

  const goBack = () => {
    const idx = ORDER.indexOf(step);
    if (idx > 0) setStep(ORDER[idx - 1]);
  };

  const handleSubmit = async () => {
    if (!validatePayment()) {
      setStep("payment");
      return;
    }
    setIsSending(true);
    setStep("sending");
    try {
      await submitAnnualApplication(form, files);
      setStep("success");
      toast({ title: "הבקשה נשלחה בהצלחה", description: "נחזור אליכם בהקדם." });
    } catch (err) {
      console.error(err);
      setStep("review");
      toast({ title: "שגיאה בשליחה", description: "אנא נסו שוב או התקשרו אלינו.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  /* ---------- field helpers ---------- */

  const dateInput = (value: string, onChange: (v: string) => void, error?: string) => (
    <Input
      value={value}
      onChange={(e) => onChange(formatDateInput(e.target.value))}
      onBlur={(e) => {
        const full = normalizeDateInput(e.target.value);
        if (full !== e.target.value) onChange(full);
      }}
      inputMode="numeric"
      maxLength={10}
      placeholder="DD/MM/YYYY"
      className={`${fieldCls} text-right ${error ? "border-destructive" : ""}`}
      style={{ direction: "rtl", textAlign: "right" }}
    />
  );

  const textProps = (name: keyof AnnualForm, opts?: { placeholder?: string; type?: string; ltr?: boolean; numeric?: boolean }) => ({
    value: String(form[name] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(name, e.target.value as never),
    placeholder: opts?.placeholder,
    type: opts?.type || "text",
    inputMode: opts?.numeric ? ("numeric" as const) : undefined,
    className: `${fieldCls} ${opts?.ltr ? "text-left" : "text-right"} ${errors[name as string] ? "border-destructive" : ""}`,
    style: { direction: opts?.ltr ? ("ltr" as const) : ("rtl" as const), textAlign: opts?.ltr ? ("left" as const) : ("right" as const) },
  });

  const question = (id: keyof AnnualHealth, title: string, value: YesNo, note?: string, children?: ReactNode) => (
    <div className={`${cardCls} ${errors[`h.${id}`] ? "border-rose-300" : ""}`}>
      <p className="text-[16px] font-bold leading-[1.4] text-[#000144]">{title}</p>
      {note && <p className="mt-1 text-[13px] font-medium leading-[1.45] text-[#6B7894]">{note}</p>}
      <div className="mt-3">
        <YesNoToggle name={String(id)} value={value} onChange={(v) => setHealth({ [id]: v } as Partial<AnnualHealth>)} />
      </div>
      {children}
      {errors[`h.${id}`] && <p className="mt-2 text-xs text-rose-600">{errors[`h.${id}`]}</p>}
    </div>
  );

  const blockMessage = (text: string) => (
    <p className="mt-3 rounded-[12px] bg-rose-50 px-3 py-2 text-[14px] font-semibold text-rose-700">{text}</p>
  );

  /* ---------- render ---------- */

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F5F8] font-rubik text-[#000144]" dir="rtl">
      <section className="relative z-20 overflow-x-clip bg-[#000144] text-white">
        <div aria-hidden="true" className="absolute left-[-120px] top-[-160px] h-[360px] w-[360px] rounded-full bg-[#0C1060]" />
        <div className="relative mx-auto max-w-[1200px] px-4 pt-5 sm:px-6">
          <AgencyHeader minimal />
        </div>
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pb-8 pt-8 sm:px-6">
          <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-black leading-[1.02] tracking-[-0.01em]">ביטוח נסיעות שנתי</h1>
          <p className="m-0 max-w-[640px] text-[18px] font-medium text-[#E3EAFF]">
            פוליסה לשנה שלמה לאנשי עסקים — הצעה + הצהרת בריאות בתהליך דיגיטלי קצר, במקום מילוי PDF וסריקה
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] font-bold text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#00A247] px-4 py-1.5">
              <ShieldCheck className="h-4 w-4 text-[#00A247]" />
              הראל · First Class
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#00A247] px-4 py-1.5">
              <Briefcase className="h-4 w-4 text-[#00A247]" />
              לאנשי עסקים · 365 יום
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto box-border w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
        {step !== "intro" && step !== "success" && (
          <div className="mb-5">
            <div className="mb-2 flex justify-between text-[13px] font-bold text-[#46557A]">
              <span>{STEPS[Math.min(progressIndex, STEPS.length - 1)]?.label}</span>
              <span>
                {Math.min(progressIndex + 1, STEPS.length)} / {STEPS.length}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#E3E7EE]">
              <div className="h-full rounded-full bg-[#00A247] transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-[28px] border-2 border-[#E3E7EE] bg-white">
          <div className="p-5 sm:p-7">
            {step === "intro" && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-[26px] font-black text-[#000144]">איזו פוליסה?</h2>
                  <p className="mt-1 text-[15px] font-medium text-[#46557A]">
                    פוליסה אחת לכל הנסיעות בשנה. כל נסיעה עד 60 ימים (בגילאי 71–75: עד 45 ימים).
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["basic", "extended"] as AnnualPlan[]).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      aria-pressed={form.plan === plan}
                      onClick={() => setField("plan", plan)}
                      className={`rounded-[20px] border-2 p-4 text-right transition ${
                        form.plan === plan ? "border-[#00A247] bg-[#E6F6EC]" : "border-[#E3E7EE] bg-white hover:border-[#000144]/30"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[19px] font-black text-[#000144]">{PLAN_LABELS[plan]}</span>
                        {form.plan === plan && <Check className="h-5 w-5 text-[#00A247]" />}
                      </span>
                      <span className="mt-3 grid grid-cols-2 gap-2">
                        {PLAN_PRICES[plan].map((p) => (
                          <span key={p.ages} className="rounded-[14px] border border-[#E3E7EE] bg-white px-3 py-2 text-center">
                            <span className="block text-[12px] font-semibold text-[#46557A]">{p.ages}</span>
                            <span className="block text-[22px] font-black leading-tight text-[#000144]" dir="ltr">${p.usd}</span>
                            <span className="block text-[11px] font-medium text-[#46557A]">לשנה</span>
                          </span>
                        ))}
                      </span>
                      <ul className="mt-3 space-y-1.5">
                        {PLAN_ROWS.map((r) => {
                          const v = r[plan];
                          return (
                            <li key={r.label} className={`flex items-start gap-2 text-[14px] font-medium ${v ? "text-[#33405F]" : "text-[#A3ACC2] line-through"}`}>
                              <span className="mt-0.5 shrink-0">{v === true ? "✓" : v === "extra" ? "+" : "–"}</span>
                              <span>
                                {r.label}
                                {v === "extra" && <span className="text-[#46557A]"> (בתוספת תשלום)</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </button>
                  ))}
                </div>
                <Button type="button" onClick={goNext} className="h-14 w-full rounded-[18px] bg-[#00A247] text-[19px] font-extrabold text-[#000144] hover:bg-[#008C3D]">
                  מתחילים
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            )}

            {step === "insured" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">המבוטח ותקופת הביטוח</h2>
                  <p className="mt-1 text-[14px] font-medium text-[#46557A]">{PLAN_LABELS[form.plan]} · לגילאי 19 עד 75 · לתושבי ישראל</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="תחילת הביטוח" required error={errors.periodFrom}>
                    {dateInput(form.periodFrom, (v) => setField("periodFrom", v), errors.periodFrom)}
                  </Field>
                  <Field label="סיום הביטוח" hint="365 ימים מתחילת הביטוח">
                    <Input value={periodTo} readOnly tabIndex={-1} className={`${fieldCls} bg-[#F3F5F8] text-right`} style={{ direction: "rtl" }} placeholder="מחושב אוטומטית" />
                  </Field>
                  <Field label="תעודת זהות" required error={errors.idNumber}>
                    <Input {...textProps("idNumber", { placeholder: "9 ספרות", numeric: true })} />
                  </Field>
                  <Field label="תאריך לידה" required error={errors.birthDate}>
                    {dateInput(form.birthDate, (v) => setField("birthDate", v), errors.birthDate)}
                  </Field>
                  <Field label="שם פרטי" required error={errors.firstName}>
                    <Input {...textProps("firstName")} />
                  </Field>
                  <Field label="שם משפחה" required error={errors.lastName}>
                    <Input {...textProps("lastName")} />
                  </Field>
                  <Field label="מין" required error={errors.gender}>
                    <div className="flex gap-2">
                      {[
                        { v: "male" as const, label: "זכר" },
                        { v: "female" as const, label: "נקבה" },
                      ].map((opt) => (
                        <button key={opt.v} type="button" aria-pressed={form.gender === opt.v} onClick={() => setField("gender", opt.v)} className={`flex-1 ${choiceCls(form.gender === opt.v)}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className={`${cardCls} space-y-3`}>
                  {(
                    [
                      ["israeliResident", "אני מצהיר/ה שהמועמד לביטוח הוא תושב ישראל"],
                      ["inIsrael", "בעת רכישת הביטוח, המועמד לביטוח נמצא בישראל"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="flex items-start gap-3 text-[15px] font-medium text-[#33405F]">
                        <Checkbox checked={form[key]} onCheckedChange={(v) => setField(key, Boolean(v))} className={checkboxCls} />
                        <span>{label}</span>
                      </label>
                      {errors[key] && <p className="mt-1 text-xs text-rose-600">{errors[key]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "contact" && (
              <div className="space-y-4">
                <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">כתובת ופרטי קשר</h2>
                <p className="text-[14px] font-medium text-[#46557A]">מסמכי הפוליסה נשלחים לנייד ולדוא״ל</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="רחוב" required error={errors.street}>
                    <Input {...textProps("street")} />
                  </Field>
                  <Field label="מס׳ בית" required error={errors.houseNo}>
                    <Input {...textProps("houseNo")} />
                  </Field>
                  <Field label="יישוב" required error={errors.city}>
                    <Input {...textProps("city")} />
                  </Field>
                  <Field label="מקצוע / עיסוק">
                    <Input {...textProps("occupation")} />
                  </Field>
                  <Field label="טלפון נייד" required error={errors.mobile}>
                    <Input {...textProps("mobile", { type: "tel", ltr: true, placeholder: "05X-XXXXXXX" })} />
                  </Field>
                  <Field label="טלפון נוסף">
                    <Input {...textProps("phone", { type: "tel", ltr: true })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="דוא״ל להודעות אישיות ודיוורים" required error={errors.email}>
                      <Input {...textProps("email", { type: "email", ltr: true, placeholder: "name@email.com" })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="מייל סוכן (לא חובה)" error={errors.agentEmail}>
                      <Input {...textProps("agentEmail", { type: "email", ltr: true, placeholder: "agent@email.com" })} />
                    </Field>
                    <p className="mt-1 text-xs text-muted-foreground">לסוכן שממלא את הטופס עבור הלקוח — רק כדי שנדע מי שלח את הבקשה. לא נשלח אליו דבר.</p>
                  </div>
                </div>
              </div>
            )}

            {step === "health" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">הצהרת בריאות</h2>
                    <p className="mt-1 text-[14px] font-medium text-[#46557A]">הפוליסה כוללת הרחבה להחמרה של מצב רפואי קודם</p>
                  </div>
                  <Button type="button" variant="outline" className="h-12 rounded-[18px] border-[3px] border-[#000144] bg-white px-5 text-[16px] font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white" onClick={markAllHealthNo}>
                    סמן הכל כ־לא
                  </Button>
                </div>

                {question("q1", Q1_TITLE, h.q1, Q1_NOTE, blockedQ1 && blockMessage("אם אחת ממטרות הנסיעה היא ייעוץ, אבחון או טיפול רפואי, לא ניתן לקבל את הבקשה לביטוח."))}

                {question(
                  "q2",
                  Q2_TITLE,
                  h.q2,
                  Q2_EXCEPTIONS,
                  h.q2 === "yes" && (
                    <div className="mt-4 space-y-4 border-t-2 border-[#E3E7EE] pt-4">
                      <div>
                        <p className="text-[15px] font-bold text-[#000144]">{Q21_TITLE}</p>
                        <div className="mt-2 flex flex-col gap-2">
                          {Q21_OPTIONS.map((o) => {
                            const on = h.q21.includes(o.id);
                            return (
                              <button key={o.id} type="button" aria-pressed={on} onClick={() => setHealth({ q21: on ? h.q21.filter((x) => x !== o.id) : [...h.q21, o.id] })} className={chipCls(on)}>
                                {on && <Check className="-mt-0.5 ml-1 inline h-4 w-4" />}
                                {o.labelHe}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-1 text-[12px] font-medium text-[#8A94AD]">אם אף אחד מהמצבים לא מתאים — אפשר להשאיר בלי סימון</p>
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-[#000144]">{Q22_TITLE}</p>
                        <p className="mt-1 text-[13px] font-medium text-[#6B7894]">{Q22_BODY}</p>
                        <div className="mt-2">
                          <YesNoToggle name="q22" value={h.q22} onChange={(v) => setHealth({ q22: v })} />
                        </div>
                        {errors["h.q22"] && <p className="mt-1 text-xs text-rose-600">{errors["h.q22"]}</p>}
                      </div>
                    </div>
                  ),
                )}

                {question(
                  "q3",
                  `${Q3_TITLE} ${Q3_TOPICS}`,
                  h.q3,
                  Q3_NOTE,
                  h.q3 === "yes" && (
                    <div className="mt-4 border-t-2 border-[#E3E7EE] pt-4">
                      <p className="text-[15px] font-bold text-[#000144]">{Q31_TITLE}</p>
                      <div className="mt-2">
                        <YesNoToggle name="q31" value={h.q31} onChange={(v) => setHealth({ q31: v })} />
                      </div>
                      {errors["h.q31"] && <p className="mt-1 text-xs text-rose-600">{errors["h.q31"]}</p>}
                    </div>
                  ),
                )}

                {question(
                  "q4",
                  Q4_TITLE,
                  h.q4,
                  undefined,
                  h.q4 === "yes" && (
                    <Textarea
                      className={`${textareaCls} mt-3 text-right`}
                      style={{ direction: "rtl" }}
                      placeholder={`פירוט הבדיקות — ${Q4_DETAILS_HINT}`}
                      value={h.q4Details}
                      onChange={(e) => setHealth({ q4Details: e.target.value })}
                    />
                  ),
                )}

                {isFemale && question("q5", "5. האם הנך בהיריון?", h.q5, undefined, blockedQ5 && blockMessage("אם הנך בהיריון לא ניתן לרכוש פוליסה שנתית. אפשר לרכוש ביטוח לנסיעה בודדת עם הרחבה להיריון."))}

                <div className="rounded-[20px] border-2 border-dashed border-[#D5DAE3] bg-[#F3F5F8] p-4">
                  <p className="mb-2 text-[16px] font-bold text-[#000144]">צירוף מסמכים רפואיים</p>
                  <p className="mb-3 text-[14px] font-medium text-[#46557A]">
                    {docNeeded ? "לפי התשובות יש לצרף תעודה עדכנית מהרופא המטפל: אבחנות, תרופות, טיפולים ומעקבים." : "לא חובה לפי התשובות. אפשר לצרף אם יש."}
                  </p>
                  <label className="inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-[14px] border-[3px] border-[#000144] bg-white px-5 py-2.5 text-[16px] font-extrabold text-[#000144] transition-colors hover:bg-[#000144] hover:text-white">
                    <FileUp className="h-4 w-4" />
                    בחירת קבצים
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const list = Array.from(e.target.files || []);
                        if (list.length) {
                          setFiles((prev) => [...prev, ...list]);
                          clearError("files");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex !flex-row items-center justify-between rounded-[12px] border-2 border-[#E3E7EE] bg-white px-3 py-2 text-[14px] font-medium text-[#33405F]">
                          <span className="truncate">{f.name}</span>
                          <button type="button" aria-label={`הסרת ${f.name}`} onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4 text-[#46557A]" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.files && <p className="mt-2 text-xs text-rose-600">{errors.files}</p>}
                </div>
              </div>
            )}

            {step === "coverage" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">כיסויים</h2>
                  <p className="mt-1 text-[14px] font-medium text-[#46557A]">{PLAN_LABELS[form.plan]} — כל הכיסויים בתכנית כלולים, ללא תוספת תשלום</p>
                </div>
                <div className={cardCls}>
                  <p className="text-[16px] font-bold text-[#000144]">מחשב נישא / טאבלט וטלפון נייד</p>
                  <p className="mt-0.5 text-[13px] font-medium text-[#46557A]">הכיסוי בתנאי שהדגם נמסר בעת רכישת הביטוח</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="דגם המחשב / הטאבלט">
                      <Input {...textProps("laptopModel", { placeholder: "לדוגמה: MacBook Pro 14" })} />
                    </Field>
                    <Field label="דגם הטלפון">
                      <Input {...textProps("phoneModel", { placeholder: "לדוגמה: iPhone 16" })} />
                    </Field>
                  </div>
                </div>
                {form.plan === "basic" ? (
                  <div className={cardCls}>
                    <label className="flex items-start gap-3 text-right">
                      <Checkbox checked={form.rentalCar} onCheckedChange={(v) => setField("rentalCar", Boolean(v))} className={checkboxCls} />
                      <span>
                        <span className="block text-[16px] font-bold text-[#000144]">ביטול השתתפות עצמית לרכב שכור בחו״ל</span>
                        <span className="block text-[13px] font-medium text-[#46557A]">רכב שכור / קרוואן · לנהג מגיל 24 ועד גיל 75 · בתוספת תשלום</span>
                      </span>
                    </label>
                  </div>
                ) : (
                  <p className="rounded-[14px] bg-[#E6F6EC] px-4 py-2.5 text-[14px] font-bold text-[#000144]">
                    בפוליסה המורחבת כלולים גם פריט יקר ערך, ביטול נסיעה מורחב, תאונות אישיות וביטול השתתפות עצמית לרכב שכור.
                  </p>
                )}
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">הצהרות ותשלום</h2>
                <div className={`${cardCls} space-y-3 text-[15px]`}>
                  <label className="flex items-start gap-3 text-right">
                    <Checkbox checked={form.declarationsAccepted} onCheckedChange={(v) => setField("declarationsAccepted", Boolean(v))} className={checkboxCls} />
                    <span className="font-medium text-[#33405F]">
                      אני מאשר/ת את הצהרת המועמד לביטוח בטופס של הראל: כל התשובות נכונות ומלאות ונמסרו מרצוני החופשי; קיבלתי מידע מהותי על הביטוח; אני מסמיך/ה את סוכן הביטוח לטפל בהליך ההצטרפות בשמי; וידוע לי שהפוליסה אינה מכסה הוצאות שנובעות ממצב רפואי קודם מעבר לתנאי ההרחבה.
                    </span>
                  </label>
                  {errors.declarationsAccepted && <p className="text-xs text-rose-600">{errors.declarationsAccepted}</p>}
                  <label className="flex items-start gap-3 text-right">
                    <Checkbox checked={form.marketingConsentExtra} onCheckedChange={(v) => setField("marketingConsentExtra", Boolean(v))} className={checkboxCls} />
                    <span className="font-medium text-[#33405F]">רוצה לקבל גם פרסומות על שירותים ומוצרים מכלל חברות קבוצת הראל (לא חובה)</span>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="שם מלא לחתימה" required error={errors.signatureName}>
                    <Input {...textProps("signatureName")} />
                  </Field>
                  <Field label="תאריך" required error={errors.signatureDate}>
                    {dateInput(form.signatureDate, (v) => setField("signatureDate", v), errors.signatureDate)}
                  </Field>
                </div>

                <h3 className="pt-2 text-[19px] font-black text-[#000144]">כרטיס אשראי</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="שם בעל הכרטיס" required error={errors.payerName}>
                    <Input {...textProps("payerName")} />
                  </Field>
                  <Field label="ת.ז. בעל הכרטיס" required error={errors.payerId}>
                    <Input {...textProps("payerId", { numeric: true })} />
                  </Field>
                  <Field label="מספר כרטיס" required error={errors.cardNumber}>
                    <Input
                      value={form.cardNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 19);
                        setField("cardNumber", raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
                      }}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      className={`${fieldCls} text-left ${errors.cardNumber ? "border-destructive" : ""}`}
                      style={{ direction: "ltr", textAlign: "left" }}
                      placeholder="XXXX XXXX XXXX XXXX"
                    />
                  </Field>
                  <Field label="תוקף (MM/YY)" required error={errors.cardExp}>
                    <Input
                      value={form.cardExp}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setField("cardExp", d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`);
                      }}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      maxLength={5}
                      placeholder="MM/YY"
                      className={`${fieldCls} text-left ${errors.cardExp ? "border-destructive" : ""}`}
                      style={{ direction: "ltr", textAlign: "left" }}
                    />
                  </Field>
                  <Field label="3 ספרות בגב הכרטיס (CVV)" required error={errors.cardCvv}>
                    <Input
                      value={form.cardCvv}
                      onChange={(e) => setField("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      placeholder="123"
                      className={`${fieldCls} text-left ${errors.cardCvv ? "border-destructive" : ""}`}
                      style={{ direction: "ltr", textAlign: "left" }}
                    />
                  </Field>
                  <Field label="טלפון נייד של המשלם" required error={errors.payerMobile}>
                    <Input {...textProps("payerMobile", { type: "tel", ltr: true })} />
                  </Field>
                  <Field label="רחוב">
                    <Input {...textProps("payerStreet")} />
                  </Field>
                  <Field label="מס׳ בית">
                    <Input {...textProps("payerHouseNo")} />
                  </Field>
                  <Field label="יישוב">
                    <Input {...textProps("payerCity")} />
                  </Field>
                  <Field label="מיקוד">
                    <Input {...textProps("payerZip", { numeric: true })} />
                  </Field>
                </div>
                <label className="flex items-start gap-3 text-[15px] font-medium text-[#33405F]">
                  <Checkbox checked={form.paymentConsent} onCheckedChange={(v) => setField("paymentConsent", Boolean(v))} className={checkboxCls} />
                  <span>אני מאשר/ת חיוב הכרטיס עבור הפוליסה, בהתאם לתנאי הפוליסה.</span>
                </label>
                {errors.paymentConsent && <p className="text-xs text-rose-600">{errors.paymentConsent}</p>}
                <Field label="הערות נוספות">
                  <Textarea className={`${textareaCls} text-right`} style={{ direction: "rtl" }} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="כל דבר שחשוב שנדע..." />
                </Field>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-4 text-right">
                <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">סיכום לפני שליחה</h2>
                <div className="space-y-3 rounded-[20px] bg-[#F3F5F8] p-5 text-[16px] text-[#33405F]">
                  <p>
                    <strong>תכנית:</strong> {PLAN_LABELS[form.plan]}
                  </p>
                  <p>
                    <strong>מבוטח:</strong> {form.firstName} {form.lastName} · ת.ז. {form.idNumber}
                  </p>
                  <p>
                    <strong>תקופה:</strong> {form.periodFrom} – {periodTo}
                  </p>
                  <p>
                    <strong>הצהרת בריאות:</strong> {[h.q2, h.q3, h.q4].includes("yes") ? "יש תשובות ״כן״ — מצורף פירוט" : "לא לכל השאלות"}
                  </p>
                  {form.plan === "basic" && (
                    <p>
                      <strong>רכב שכור:</strong> {form.rentalCar ? "כן, בתוספת תשלום" : "לא"}
                    </p>
                  )}
                  <p>
                    <strong>קבצים:</strong> {files.length ? `${files.length} קבצים` : "ללא"}
                  </p>
                  <p>
                    <strong>תשלום:</strong> כרטיס על שם {form.payerName}
                  </p>
                </div>
                <p className="text-[14px] font-medium text-[#46557A]">בלחיצה על ״שלח בקשה״ הפרטים יישלחו מסודרים לצוות אופיר ושות׳ להמשך טיפול מול הראל.</p>
                <Button type="button" onClick={handleSubmit} disabled={isSending} className="h-14 w-full rounded-[18px] bg-[#00A247] text-[19px] font-extrabold text-[#000144] hover:bg-[#008C3D]">
                  {isSending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      שלח בקשה
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === "sending" && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#00A247]" />
                <p className="text-[18px] font-bold text-[#000144]">שולחים את הבקשה...</p>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00A247] text-[#000144]">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="text-[28px] font-black text-[#000144]">הבקשה נשלחה בהצלחה</h2>
                <p className="text-[17px] font-medium text-[#33405F]">
                  קיבלנו את הבקשה עבור {form.firstName} {form.lastName}. נחזור אליכם בהקדם להמשך הטיפול.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-[18px] border-[3px] border-[#000144] bg-white px-7 text-[18px] font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white"
                  onClick={() => {
                    setForm(createInitialAnnualForm());
                    setFiles([]);
                    setErrors({});
                    setStep("intro");
                  }}
                >
                  הגשת בקשה נוספת
                </Button>
              </div>
            )}

            {step !== "intro" && step !== "success" && step !== "sending" && step !== "review" && (
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center" style={{ direction: "ltr" }}>
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={step === "health" && (blockedQ1 || blockedQ5)}
                  className="h-14 w-full rounded-[18px] bg-[#00A247] text-[18px] font-extrabold text-[#000144] hover:bg-[#008C3D] sm:mr-auto sm:w-auto sm:min-w-[200px]"
                >
                  המשך
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 w-full rounded-[18px] border-[3px] border-[#000144] bg-white text-[18px] font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white sm:w-auto"
                  onClick={goBack}
                >
                  <ArrowRight className="h-4 w-4" />
                  חזרה
                </Button>
              </div>
            )}

            {step === "review" && (
              <div className="mt-3">
                <Button type="button" variant="ghost" className="h-12 w-full rounded-[18px] text-[16px] font-bold text-[#000144] hover:bg-[#F3F5F8] hover:text-[#000144]" onClick={goBack}>
                  חזרה לעריכה
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] font-medium text-[#46557A]">
          בכפוף להצהרת הבריאות ולהצעת הביטוח של הראל · TravelSure / אופיר ושות׳ סוכנות לביטוח
        </p>
      </main>

      <AgencyFooter />
    </div>
  );
};

export default Annual;
