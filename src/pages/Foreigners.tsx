import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.avif";
import {
  containsHebrew,
  createInitialForeignersForm,
  formatDateInput,
  isValidCardExpiry,
  isValidCardNumber,
  isValidDateDdMmYyyy,
  isValidEmail,
  PROVIDER_LABELS,
  suggestedInstallments,
  toEnglishOnly,
  WORK_PURPOSE_LABELS,
} from "@/lib/foreigners/formDefaults";
import { HEALTH_CONDITION_GROUPS } from "@/lib/foreigners/healthQuestions";
import type { ForeignersForm, HealthAnswer, Step, YesNo } from "@/lib/foreigners/types";
import { submitForeignersApplication } from "@/lib/submitForeigners";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  Loader2,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

const STEPS: { id: Step; label: string }[] = [
  { id: "intro", label: "התחלה" },
  { id: "worker", label: "העובד" },
  { id: "employer", label: "מעסיק" },
  { id: "health", label: "בריאות" },
  { id: "payment", label: "תשלום" },
  { id: "review", label: "שליחה" },
];

const Field = ({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  hint?: string;
}) => (
  <div className="text-right">
    <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
  </div>
);

const YesNoToggle = ({
  value,
  onChange,
  name,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  name: string;
}) => (
  <div className="flex gap-2" role="group" aria-label={name}>
    {[
      { v: "no" as const, label: "לא / No" },
      { v: "yes" as const, label: "כן / Yes" },
    ].map((opt) => (
      <button
        key={opt.v}
        type="button"
        onClick={() => onChange(opt.v)}
        className={`h-10 flex-1 rounded-xl border text-sm font-semibold transition ${
          value === opt.v
            ? "border-[#2f6b63] bg-[#2f6b63] text-white"
            : "border-slate-200 bg-white text-slate-600 hover:border-[#2f6b63]/40"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Foreigners = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<ForeignersForm>(() => createInitialForeignersForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const progressSteps = STEPS.filter((s) => s.id !== "intro");
  const progressIndex = Math.max(
    0,
    progressSteps.findIndex((s) => s.id === (step === "intro" ? "worker" : step === "sending" || step === "success" ? "review" : step))
  );
  const progressPct = step === "intro" ? 0 : ((progressIndex + 1) / progressSteps.length) * 100;

  const installments = useMemo(
    () => suggestedInstallments(form.insuranceFrom, form.insuranceTo),
    [form.insuranceFrom, form.insuranceTo]
  );

  const setField = <K extends keyof ForeignersForm>(name: K, value: ForeignersForm[K]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as string];
        return next;
      });
    }
  };

  const setHealth = (key: keyof ForeignersForm, patch: Partial<HealthAnswer>) => {
    setForm((prev) => {
      const current = prev[key] as HealthAnswer;
      return { ...prev, [key]: { ...current, ...patch } };
    });
  };

  const visibleConditionGroups = HEALTH_CONDITION_GROUPS.filter((g) => {
    if (g.womenOnly && form.gender !== "female") return false;
    if (g.menOnly && form.gender !== "male") return false;
    return true;
  });

  const markAllHealthNo = () => {
    setForm((prev) => {
      const next = { ...prev };
      next.usesNarcotics = "no";
      next.drinksAlcohol = "no";
      next.alcoholGlassesPerDay = "";
      next.pendingExams = { answer: "no", details: "" };
      next.surgeryTransplant = { answer: "no", details: "" };
      next.hospitalized = { answer: "no", details: "" };
      next.regularMedications = { answer: "no", details: "" };
      next.allergies = { answer: "no", details: "" };
      next.dismissedBefore = "no";
      next.dismissedDetails = "";
      const conditions = { ...prev.conditionAnswers };
      Object.keys(conditions).forEach((id) => {
        conditions[id] = {
          ...conditions[id],
          answer: "no",
          selected: [],
          details: "",
          herniaSurgeryDate: "",
          herniaResolved: "",
          isPregnant: "no",
          cesareanDate: "",
        };
      });
      next.conditionAnswers = conditions;
      return next;
    });
    toast({ title: "סומן הכל כ־לא", description: "אפשר לעבור על השאלות ולשנות אם צריך." });
  };

  const validateWorker = () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "שדה חובה";
    if (!form.lastName.trim()) next.lastName = "שדה חובה";
    if (!form.passportNo.trim()) next.passportNo = "שדה חובה";
    if (!form.passportCountry.trim()) next.passportCountry = "שדה חובה";
    if (!form.countryOfOrigin.trim()) next.countryOfOrigin = "שדה חובה";
    if (!form.birthDate.trim() || !isValidDateDdMmYyyy(form.birthDate)) next.birthDate = "תאריך בפורמט DD/MM/YYYY";
    if (!form.gender) next.gender = "שדה חובה";
    if (!form.entryDate.trim() || !isValidDateDdMmYyyy(form.entryDate)) next.entryDate = "תאריך בפורמט DD/MM/YYYY";
    if (!form.insuranceFrom.trim() || !isValidDateDdMmYyyy(form.insuranceFrom)) next.insuranceFrom = "תאריך בפורמט DD/MM/YYYY";
    if (!form.insuranceTo.trim() || !isValidDateDdMmYyyy(form.insuranceTo)) next.insuranceTo = "תאריך בפורמט DD/MM/YYYY";
    if (!form.mobile.trim()) next.mobile = "שדה חובה";
    if (!form.email.trim() || !isValidEmail(form.email)) next.email = "אימייל לא תקין";
    if (!form.street.trim()) next.street = "שדה חובה";
    if (!form.houseNo.trim()) next.houseNo = "שדה חובה";
    if (!form.city.trim()) next.city = "שדה חובה";

    // Passport identity fields must stay English; address/job may be Hebrew.
    const englishOnlyFields: Array<keyof ForeignersForm> = [
      "firstName",
      "lastName",
      "passportNo",
      "passportCountry",
      "countryOfOrigin",
    ];
    for (const key of englishOnlyFields) {
      const value = String(form[key] || "");
      if (value && containsHebrew(value)) {
        next[key as string] = "יש להזין באנגלית בלבד";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateEmployer = () => {
    const next: Record<string, string> = {};
    if (!form.workPurpose) next.workPurpose = "שדה חובה";
    if (!form.provider) next.provider = "שדה חובה";
    if (!form.employerName.trim()) next.employerName = "שדה חובה";
    if (!form.employerId.trim()) next.employerId = "שדה חובה";
    if (!form.employerMobile.trim() && !form.employerPhone.trim()) next.employerMobile = "טלפון או נייד חובה";
    if (!form.employerEmail.trim() || !isValidEmail(form.employerEmail)) next.employerEmail = "אימייל לא תקין";
    if (!form.hadPreviousInsurance) next.hadPreviousInsurance = "שדה חובה";
    if (form.hadPreviousInsurance === "yes" && !form.previousCompany.trim()) {
      next.previousCompany = "יש לציין חברה";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateHealth = () => {
    const next: Record<string, string> = {};
    if (!form.heightCm.trim()) next.heightCm = "שדה חובה";
    if (!form.weightKg.trim()) next.weightKg = "שדה חובה";
    if (!form.usesNarcotics) next.usesNarcotics = "שדה חובה";
    if (!form.drinksAlcohol) next.drinksAlcohol = "שדה חובה";
    if (!form.pendingExams.answer) next.pendingExams = "שדה חובה";
    if (!form.surgeryTransplant.answer) next.surgeryTransplant = "שדה חובה";
    if (!form.hospitalized.answer) next.hospitalized = "שדה חובה";
    if (!form.regularMedications.answer) next.regularMedications = "שדה חובה";
    if (!form.allergies.answer) next.allergies = "שדה חובה";
    if (!form.dismissedBefore) next.dismissedBefore = "שדה חובה";

    for (const g of visibleConditionGroups) {
      const ans = form.conditionAnswers[g.id];
      if (!ans?.answer) {
        next[`cond_${g.id}`] = "יש לענות כן/לא";
        continue;
      }
      if (ans.answer === "yes" && !ans.details.trim() && ans.selected.length === 0) {
        next[`cond_${g.id}`] = "יש לפרט או לסמן";
      }
    }

    const needsDocs =
      form.pendingExams.answer === "yes" ||
      form.surgeryTransplant.answer === "yes" ||
      form.hospitalized.answer === "yes" ||
      form.regularMedications.answer === "yes" ||
      Object.values(form.conditionAnswers).some((a) => a.answer === "yes");

    if (needsDocs && files.length === 0) {
      next.files = "כשעניתם כן — יש לצרף אישור רפואי עדכני";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePayment = () => {
    const next: Record<string, string> = {};
    if (!form.declarationsAccepted) next.declarationsAccepted = "חובה לאשר את ההצהרות";
    if (!form.marketingConsent) next.marketingConsent = "שדה חובה";
    if (!form.signatureName.trim()) next.signatureName = "שדה חובה";
    if (!form.signatureDate.trim() || !isValidDateDdMmYyyy(form.signatureDate)) {
      next.signatureDate = "תאריך בפורמט DD/MM/YYYY";
    }

    if (!form.payerFirstName.trim()) next.payerFirstName = "שדה חובה";
    if (!form.payerLastName.trim()) next.payerLastName = "שדה חובה";
    if (!form.payerId.trim()) next.payerId = "שדה חובה";
    if (!form.cardNumber.trim()) next.cardNumber = "שדה חובה";
    else if (!isValidCardNumber(form.cardNumber)) next.cardNumber = "מספר כרטיס לא תקין";
    if (!form.cardExp.trim()) next.cardExp = "שדה חובה";
    else if (!isValidCardExpiry(form.cardExp)) next.cardExp = "תוקף לא תקין או שפג";
    if (!form.paymentConsent) next.paymentConsent = "חובה לאשר";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === "intro") return setStep("worker");
    if (step === "worker") {
      if (!validateWorker()) return;
      return setStep("employer");
    }
    if (step === "employer") {
      if (!validateEmployer()) return;
      return setStep("health");
    }
    if (step === "health") {
      if (!validateHealth()) return;
      return setStep("payment");
    }
    if (step === "payment") {
      if (!validatePayment()) return;
      return setStep("review");
    }
  };

  const goBack = () => {
    const order: Step[] = ["intro", "worker", "employer", "health", "payment", "review"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const handleSubmit = async () => {
    if (!validatePayment()) {
      setStep("payment");
      return;
    }
    setIsSending(true);
    setStep("sending");
    try {
      await submitForeignersApplication(form, files);
      setStep("success");
      toast({ title: "הבקשה נשלחה בהצלחה", description: "נחזור אליכם בהקדם." });
    } catch (err) {
      console.error(err);
      setStep("review");
      toast({
        title: "שגיאה בשליחה",
        description: "אנא נסו שוב או התקשרו אלינו.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const dateProps = (name: keyof ForeignersForm) => ({
    value: String(form[name] || ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(name, formatDateInput(e.target.value) as never),
    inputMode: "numeric" as const,
    maxLength: 10,
    placeholder: "DD/MM/YYYY",
    className: `bg-slate-50 text-right ${errors[name as string] ? "border-destructive" : ""}`,
    style: { direction: "rtl" as const, textAlign: "right" as const },
  });

  const textProps = (name: keyof ForeignersForm, opts?: { placeholder?: string; type?: string }) => ({
    value: String(form[name] || ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(name, e.target.value as never),
    placeholder: opts?.placeholder,
    type: opts?.type || "text",
    className: `bg-slate-50 text-right ${errors[name as string] ? "border-destructive" : ""}`,
    style: { direction: "rtl" as const, textAlign: "right" as const },
  });

  const englishTextProps = (
    name: keyof ForeignersForm,
    opts?: { placeholder?: string; type?: string; autoCapitalize?: string }
  ) => ({
    value: String(form[name] || ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = toEnglishOnly(e.target.value);
      setField(name, cleaned as never);
      if (cleaned !== e.target.value) {
        setErrors((prev) => ({ ...prev, [name as string]: "יש להזין באנגלית בלבד" }));
      }
    },
    onBlur: () => {
      const value = String(form[name] || "");
      if (value && containsHebrew(value)) {
        setErrors((prev) => ({ ...prev, [name as string]: "יש להזין באנגלית בלבד" }));
      }
    },
    placeholder: opts?.placeholder,
    type: opts?.type || "text",
    lang: "en",
    autoCapitalize: opts?.autoCapitalize || "words",
    className: `bg-slate-50 text-left ${errors[name as string] ? "border-destructive" : ""}`,
    style: { direction: "ltr" as const, textAlign: "left" as const },
  });

  const HealthDetailBlock = ({
    title,
    titleEn,
    answerKey,
    errorKey,
  }: {
    title: string;
    titleEn: string;
    answerKey: "pendingExams" | "surgeryTransplant" | "hospitalized" | "regularMedications" | "allergies";
    errorKey: string;
  }) => {
    const ans = form[answerKey];
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-[#1f4b46]">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{titleEn}</p>
        <div className="mt-3">
          <YesNoToggle
            name={answerKey}
            value={ans.answer}
            onChange={(v) => setHealth(answerKey, { answer: v, details: v === "no" ? "" : ans.details })}
          />
        </div>
        {ans.answer === "yes" && (
          <Textarea
            className="mt-3 bg-slate-50 text-right"
            style={{ direction: "rtl" }}
            placeholder="פירוט / Details"
            value={ans.details}
            onChange={(e) => setHealth(answerKey, { details: e.target.value })}
          />
        )}
        {errors[errorKey] && <p className="mt-1 text-xs text-rose-600">{errors[errorKey]}</p>}
      </div>
    );
  };

  return (
    <div className="foreigners-page relative min-h-screen overflow-hidden font-heebo" dir="rtl">
      <style>{`
        .foreigners-page {
          background:
            radial-gradient(1100px 520px at 90% -8%, rgba(74,222,128,.2), transparent 55%),
            radial-gradient(800px 420px at -8% 18%, rgba(47,107,99,.16), transparent 50%),
            linear-gradient(180deg, #f2faf7 0%, #eef6f3 42%, #e8f1ee 100%);
        }
        @keyframes fg-rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fg-rise { animation: fg-rise .5s ease-out both; }
        .fg-rise-d1 { animation-delay: .08s; }
        .fg-rise-d2 { animation-delay: .16s; }
        @keyframes fg-shine {
          0%, 55% { left: -40%; }
          100% { left: 120%; }
        }
        .fg-cta { position: relative; overflow: hidden; }
        .fg-cta::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 -40%;
          width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: skewX(-20deg);
          animation: fg-shine 2.8s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <header className="fg-rise mb-7 flex w-full flex-col items-center text-center">
          <img src={logo} alt="TravelSure" className="mx-auto h-[88px] w-auto drop-shadow-sm sm:h-28" />
          <h1
            className="mt-4 w-full text-center text-3xl font-extrabold tracking-normal text-[#143834] sm:text-4xl"
            style={{ textAlign: "center", marginInline: "auto" }}
          >
            ביטוח עובדים זרים
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-600 sm:text-base">
            הצעת ביטוח בריאות + הצהרת בריאות — תהליך דיגיטלי קצר במקום מילוי PDF וסריקה
          </p>
          <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#1f4b46]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f6b63]/15 bg-white/80 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2f6b63]" />
              הראל · SAFE STAY
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f6b63]/15 bg-white/80 px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-[#2f6b63]" />
              למעסיק ולעובד
            </span>
          </div>
        </header>

        {step !== "intro" && step !== "success" && (
          <div className="fg-rise fg-rise-d1 mb-5">
            <div className="mb-2 flex justify-between text-[11px] font-semibold text-slate-500">
              <span>{progressSteps[Math.min(progressIndex, progressSteps.length - 1)]?.label}</span>
              <span>
                {Math.min(progressIndex + 1, progressSteps.length)} / {progressSteps.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#4ade80] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="fg-rise fg-rise-d2 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_30px_80px_-40px_rgba(20,56,52,0.55)] backdrop-blur-xl">
          <div className="h-1.5 bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#4ade80]" />
          <div className="p-5 sm:p-7">
            {step === "intro" && (
              <div className="mx-auto max-w-md space-y-5 text-center">
                <h2 className="text-xl font-bold text-[#143834]">איך זה עובד?</h2>
                <ol className="mx-auto max-w-sm space-y-3 text-sm text-slate-600">
                  {[
                    "ממלאים את פרטי העובד והמעסיק",
                    "עונים על הצהרת הבריאות (אפשר לסמן הכל כ־לא בלחיצה)",
                    "מזינים פרטי תשלום וכרטיס אשראי",
                    "שולחים — ואנחנו מקבלים הכל מסודר במייל",
                  ].map((text, i) => (
                    <li key={text} className="flex items-center justify-center gap-3 text-right">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f4f1] text-xs font-bold text-[#1f4b46]">
                        {i + 1}
                      </span>
                      <span className="flex-1">{text}</span>
                    </li>
                  ))}
                </ol>
                <div className="rounded-2xl border border-[#2f6b63]/15 bg-gradient-to-l from-[#e8f4f1] to-white p-4 text-sm text-slate-600">
                  הטופס מחליף את שני קבצי ה־PDF: הצעה לביטוח + הצהרת בריאות באנגלית. אין צורך להדפיס, לסרוק או לשלוח בוואטסאפ.
                </div>
                <Button
                  type="button"
                  onClick={goNext}
                  className="fg-cta h-12 w-full rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-base font-bold text-white"
                >
                  מתחילים
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            )}

            {step === "worker" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#143834]">פרטי המועמד לביטוח</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    זהו העובד הזר המבוטח · שם ופרטי דרכון באנגלית בלבד · כתובת ועיסוק אפשר גם בעברית
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="שם פרטי / First name" required error={errors.firstName} hint="English only">
                    <Input {...englishTextProps("firstName", { placeholder: "First name" })} />
                  </Field>
                  <Field label="שם משפחה / Last name" required error={errors.lastName} hint="English only">
                    <Input {...englishTextProps("lastName", { placeholder: "Last name" })} />
                  </Field>
                  <Field label="מספר דרכון / Passport No." required error={errors.passportNo} hint="English / numbers only">
                    <Input {...englishTextProps("passportNo", { placeholder: "Passport number", autoCapitalize: "characters" })} />
                  </Field>
                  <Field label="ארץ הנפקת דרכון / Passport country" required error={errors.passportCountry} hint="English only">
                    <Input {...englishTextProps("passportCountry", { placeholder: "e.g. Philippines" })} />
                  </Field>
                  <Field label="ארץ מוצא / Country of origin" required error={errors.countryOfOrigin} hint="English only">
                    <Input {...englishTextProps("countryOfOrigin", { placeholder: "e.g. Philippines" })} />
                  </Field>
                  <Field label="תאריך לידה" required error={errors.birthDate} hint="DD/MM/YYYY">
                    <Input {...dateProps("birthDate")} />
                  </Field>
                  <Field label="מין / Gender" required error={errors.gender}>
                    <div className="flex gap-2">
                      {[
                        { v: "male" as const, label: "זכר / Male" },
                        { v: "female" as const, label: "נקבה / Female" },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setField("gender", opt.v)}
                          className={`h-10 flex-1 rounded-xl border text-sm font-semibold ${
                            form.gender === opt.v
                              ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="תאריך כניסה לישראל" required error={errors.entryDate}>
                    <Input {...dateProps("entryDate")} />
                  </Field>
                  <Field label="תאריך ראשון שבוטח (אם רלוונטי)">
                    <Input {...dateProps("firstInsuranceDate")} />
                  </Field>
                  <div className="col-span-full grid gap-4 sm:grid-cols-2">
                    <Field label="תקופת ביטוח מ־" required error={errors.insuranceFrom}>
                      <Input {...dateProps("insuranceFrom")} />
                    </Field>
                    <Field label="תקופת ביטוח עד" required error={errors.insuranceTo}>
                      <Input {...dateProps("insuranceTo")} />
                    </Field>
                  </div>
                </div>
                {installments && (
                  <p className="rounded-xl bg-[#e8f4f1] px-3 py-2 text-xs font-semibold text-[#1f4b46]">
                    לפי תקופת הביטוח ניתן לפרוס ל־{installments} תשלומים
                  </p>
                )}
                <Field label="העיסוק למענו הגעת לישראל / תיאור עבודה" error={errors.workDescription}>
                  <Input {...textProps("workDescription", { placeholder: "לדוגמה: טיפול סיעודי / בניין" })} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="רחוב" required error={errors.street}>
                    <Input {...textProps("street", { placeholder: "שם הרחוב" })} />
                  </Field>
                  <Field label="מס׳ בית" required error={errors.houseNo}>
                    <Input {...textProps("houseNo", { placeholder: "12" })} />
                  </Field>
                  <Field label="מס׳ דירה" error={errors.apartmentNo}>
                    <Input {...textProps("apartmentNo", { placeholder: "3" })} />
                  </Field>
                  <Field label="עיר" required error={errors.city}>
                    <Input {...textProps("city", { placeholder: "תל אביב" })} />
                  </Field>
                  <Field label="מיקוד" error={errors.zip}>
                    <Input {...textProps("zip", { placeholder: "6100000" })} />
                  </Field>
                  <Field label="טלפון">
                    <Input {...textProps("phone", { type: "tel" })} />
                  </Field>
                  <Field label="נייד" required error={errors.mobile}>
                    <Input {...textProps("mobile", { type: "tel" })} />
                  </Field>
                  <Field label="דוא״ל" required error={errors.email}>
                    <Input {...textProps("email", { type: "email", placeholder: "name@email.com" })} />
                  </Field>
                </div>
              </div>
            )}

            {step === "employer" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#143834]">מעסיק, ספק שירות וביטוח קודם</h2>
                <Field label="מטרת ההגעה לישראל" required error={errors.workPurpose}>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(WORK_PURPOSE_LABELS) as Array<keyof typeof WORK_PURPOSE_LABELS>).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setField("workPurpose", key)}
                        className={`h-11 rounded-xl border text-sm font-semibold ${
                          form.workPurpose === key
                            ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {WORK_PURPOSE_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="בחירת ספק שירות (קופת חולים)" required error={errors.provider}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(Object.keys(PROVIDER_LABELS) as Array<keyof typeof PROVIDER_LABELS>).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setField("provider", key)}
                        className={`h-11 rounded-xl border text-sm font-semibold ${
                          form.provider === key
                            ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {PROVIDER_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="שם המעסיק / בעל הפוליסה" required error={errors.employerName}>
                    <Input {...textProps("employerName")} />
                  </Field>
                  <Field label="ת.ז. / ח.פ. מעסיק" required error={errors.employerId}>
                    <Input {...textProps("employerId")} />
                  </Field>
                  <Field label="טלפון מעסיק">
                    <Input {...textProps("employerPhone", { type: "tel" })} />
                  </Field>
                  <Field label="נייד מעסיק" required error={errors.employerMobile}>
                    <Input {...textProps("employerMobile", { type: "tel" })} />
                  </Field>
                  <Field label="דוא״ל מעסיק" required error={errors.employerEmail}>
                    <Input {...textProps("employerEmail", { type: "email" })} />
                  </Field>
                  <Field label="כתובת מעסיק">
                    <Input {...textProps("employerAddress")} />
                  </Field>
                  <Field label="שם סוכן">
                    <Input {...textProps("agentName")} />
                  </Field>
                  <Field label="מספר סוכן">
                    <Input {...textProps("agentNo")} />
                  </Field>
                </div>

                <Field label="האם היית מבוטח בהראל או בחברה אחרת?" required error={errors.hadPreviousInsurance}>
                  <YesNoToggle
                    name="hadPreviousInsurance"
                    value={form.hadPreviousInsurance}
                    onChange={(v) => setField("hadPreviousInsurance", v)}
                  />
                </Field>
                {form.hadPreviousInsurance === "yes" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="שם החברה" required error={errors.previousCompany}>
                      <Input {...textProps("previousCompany")} />
                    </Field>
                    <Field label="מספר פוליסה">
                      <Input {...textProps("previousPolicyNo")} />
                    </Field>
                    <Field label="מספר חבר אצל ספק">
                      <Input {...textProps("previousMembershipNo")} />
                    </Field>
                    <Field label="מתאריך">
                      <Input {...dateProps("previousFrom")} />
                    </Field>
                    <Field label="עד תאריך">
                      <Input {...dateProps("previousTo")} />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {step === "health" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#143834]">הצהרת בריאות</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Health Statement — יש לענות בכנות. תשובת ״כן״ מחייבת פירוט / אישור רפואי.
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={markAllHealthNo}>
                    סמן הכל כ־לא
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="גובה (ס״מ) / Height" required error={errors.heightCm}>
                    <Input {...textProps("heightCm", { type: "number" })} />
                  </Field>
                  <Field label="משקל (ק״ג) / Weight" required error={errors.weightKg}>
                    <Input {...textProps("weightKg", { type: "number" })} />
                  </Field>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-[#1f4b46]">שימוש בסמים / Narcotics</p>
                  <div className="mt-3">
                    <YesNoToggle name="narcotics" value={form.usesNarcotics} onChange={(v) => setField("usesNarcotics", v)} />
                  </div>
                  {errors.usesNarcotics && <p className="mt-1 text-xs text-rose-600">{errors.usesNarcotics}</p>}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-[#1f4b46]">שתיית אלכוהול סדירה / Alcohol regularly</p>
                  <div className="mt-3">
                    <YesNoToggle name="alcohol" value={form.drinksAlcohol} onChange={(v) => setField("drinksAlcohol", v)} />
                  </div>
                  {form.drinksAlcohol === "yes" && (
                    <Field label="כוסות ביום / glasses per day">
                      <Input className="mt-3 bg-slate-50" {...textProps("alcoholGlassesPerDay")} />
                    </Field>
                  )}
                  {errors.drinksAlcohol && <p className="mt-1 text-xs text-rose-600">{errors.drinksAlcohol}</p>}
                </div>

                <HealthDetailBlock
                  title="בדיקות ממתינות / ללא אבחנה סופית (10 שנים)"
                  titleEn="Pending exams / no final diagnosis in last 10 years"
                  answerKey="pendingExams"
                  errorKey="pendingExams"
                />
                <HealthDetailBlock
                  title="ניתוח / השתלה (10 שנים)"
                  titleEn="Surgery / transplantation in last 10 years"
                  answerKey="surgeryTransplant"
                  errorKey="surgeryTransplant"
                />
                <HealthDetailBlock
                  title="אשפוז (10 שנים)"
                  titleEn="Hospitalization in last 10 years"
                  answerKey="hospitalized"
                  errorKey="hospitalized"
                />
                <HealthDetailBlock
                  title="תרופות קבועות"
                  titleEn="Regular medications"
                  answerKey="regularMedications"
                  errorKey="regularMedications"
                />
                <HealthDetailBlock
                  title="אלרגיות"
                  titleEn="Allergies"
                  answerKey="allergies"
                  errorKey="allergies"
                />

                <h3 className="pt-2 text-base font-bold text-[#143834]">מחלות / תסמונות לפי מערכות</h3>
                {visibleConditionGroups.map((group) => {
                  const ans = form.conditionAnswers[group.id];
                  return (
                    <div key={group.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-[#1f4b46]">{group.titleHe}</p>
                      <p className="text-xs text-slate-500">{group.titleEn}</p>
                      <div className="mt-3">
                        <YesNoToggle
                          name={group.id}
                          value={ans.answer}
                          onChange={(v) =>
                            setForm((prev) => ({
                              ...prev,
                              conditionAnswers: {
                                ...prev.conditionAnswers,
                                [group.id]: {
                                  ...prev.conditionAnswers[group.id],
                                  answer: v,
                                  selected: v === "no" ? [] : prev.conditionAnswers[group.id].selected,
                                  details: v === "no" ? "" : prev.conditionAnswers[group.id].details,
                                },
                              },
                            }))
                          }
                        />
                      </div>
                      {ans.answer === "yes" && (
                        <div className="mt-3 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((opt) => {
                              const active = ans.selected.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    setForm((prev) => {
                                      const cur = prev.conditionAnswers[group.id];
                                      const selected = active
                                        ? cur.selected.filter((id) => id !== opt.id)
                                        : [...cur.selected, opt.id];
                                      return {
                                        ...prev,
                                        conditionAnswers: {
                                          ...prev.conditionAnswers,
                                          [group.id]: { ...cur, selected },
                                        },
                                      };
                                    })
                                  }
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                    active
                                      ? "border-[#2f6b63] bg-[#e8f4f1] text-[#1f4b46]"
                                      : "border-slate-200 bg-slate-50 text-slate-600"
                                  }`}
                                >
                                  {opt.labelHe}
                                </button>
                              );
                            })}
                          </div>
                          <Textarea
                            className="bg-slate-50 text-right"
                            style={{ direction: "rtl" }}
                            placeholder="פירוט / Please specify"
                            value={ans.details}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                conditionAnswers: {
                                  ...prev.conditionAnswers,
                                  [group.id]: { ...prev.conditionAnswers[group.id], details: e.target.value },
                                },
                              }))
                            }
                          />
                          {group.id === "hernia" && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="תאריך ניתוח בקע (אם בוצע)">
                                <Input
                                  value={ans.herniaSurgeryDate || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      conditionAnswers: {
                                        ...prev.conditionAnswers,
                                        hernia: {
                                          ...prev.conditionAnswers.hernia,
                                          herniaSurgeryDate: formatDateInput(e.target.value),
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="DD/MM/YYYY"
                                  className="bg-slate-50"
                                />
                              </Field>
                              <Field label="הבעיה נפתרה?">
                                <YesNoToggle
                                  name="herniaResolved"
                                  value={ans.herniaResolved || ""}
                                  onChange={(v) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      conditionAnswers: {
                                        ...prev.conditionAnswers,
                                        hernia: { ...prev.conditionAnswers.hernia, herniaResolved: v },
                                      },
                                    }))
                                  }
                                />
                              </Field>
                            </div>
                          )}
                          {group.id === "women" && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Field label="הריון כעת?">
                                <YesNoToggle
                                  name="pregnant"
                                  value={ans.isPregnant || ""}
                                  onChange={(v) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      conditionAnswers: {
                                        ...prev.conditionAnswers,
                                        women: { ...prev.conditionAnswers.women, isPregnant: v },
                                      },
                                    }))
                                  }
                                />
                              </Field>
                              <Field label="תאריך ניתוח קיסרי">
                                <Input
                                  value={ans.cesareanDate || ""}
                                  onChange={(e) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      conditionAnswers: {
                                        ...prev.conditionAnswers,
                                        women: {
                                          ...prev.conditionAnswers.women,
                                          cesareanDate: formatDateInput(e.target.value),
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="DD/MM/YYYY"
                                  className="bg-slate-50"
                                />
                              </Field>
                            </div>
                          )}
                          {group.noteHe && <p className="text-xs text-amber-700">{group.noteHe}</p>}
                        </div>
                      )}
                      {errors[`cond_${group.id}`] && (
                        <p className="mt-1 text-xs text-rose-600">{errors[`cond_${group.id}`]}</p>
                      )}
                    </div>
                  );
                })}

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-[#1f4b46]">
                    האם חברת ביטוח דחתה או ביטלה בעבר בקשת ביטוח בריאות?
                  </p>
                  <div className="mt-3">
                    <YesNoToggle
                      name="dismissed"
                      value={form.dismissedBefore}
                      onChange={(v) => setField("dismissedBefore", v)}
                    />
                  </div>
                  {form.dismissedBefore === "yes" && (
                    <Textarea
                      className="mt-3 bg-slate-50"
                      placeholder="פירוט"
                      value={form.dismissedDetails}
                      onChange={(e) => setField("dismissedDetails", e.target.value)}
                    />
                  )}
                  {errors.dismissedBefore && <p className="mt-1 text-xs text-rose-600">{errors.dismissedBefore}</p>}
                </div>

                <div className="rounded-2xl border border-dashed border-[#2f6b63]/30 bg-[#f7fbfa] p-4">
                  <p className="mb-2 text-sm font-semibold text-[#1f4b46]">צירוף מסמכים רפואיים</p>
                  <p className="mb-3 text-xs text-slate-500">
                    אם עניתם כן באחת השאלות — צרפו אישור רופא עדכני, תוצאות בדיקות וכו׳.
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#2f6b63]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#1f4b46]">
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
                          if (errors.files) {
                            setErrors((prev) => {
                              const n = { ...prev };
                              delete n.files;
                              return n;
                            });
                          }
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs"
                        >
                          <span className="truncate">{f.name}</span>
                          <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4 text-slate-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.files && <p className="mt-2 text-xs text-rose-600">{errors.files}</p>}
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#143834]">הצהרות ותשלום</h2>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                  <label className="flex items-start gap-3 text-right">
                    <Checkbox
                      checked={form.declarationsAccepted}
                      onCheckedChange={(v) => setField("declarationsAccepted", Boolean(v))}
                      className="mt-0.5"
                    />
                    <span className="text-slate-700">
                      אני מאשר/ת את כל ההצהרות הבאות: ייפוי כוח לסוכן לטפל בפוליסה בשמי; כל התשובות נכונות ומלאות ונמסרו מרצוני החופשי; ויתור על סודיות רפואית לטובת הראל; קיבלתי מידע מהותי על הביטוח; ותוכן הטופס הוסבר לי בשפה המובנת לי.
                    </span>
                  </label>
                  {errors.declarationsAccepted && (
                    <p className="mt-2 text-xs text-rose-600">{errors.declarationsAccepted}</p>
                  )}
                </div>

                <Field label="הסכמה לקבלת חומר פרסומי מאופיר" required error={errors.marketingConsent}>
                  <YesNoToggle
                    name="marketing"
                    value={form.marketingConsent}
                    onChange={(v) => setField("marketingConsent", v)}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="שם מלא לחתימה" required error={errors.signatureName}>
                    <Input {...textProps("signatureName", { placeholder: "כתבו את שמכם המלא" })} />
                  </Field>
                  <Field label="תאריך" required error={errors.signatureDate}>
                    <Input {...dateProps("signatureDate")} />
                  </Field>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#143834]">פרטי המשלם / כרטיס אשראי</h3>
                  <p className="text-xs text-slate-500">חובה למלא את כל פרטי המשלם והכרטיס</p>
                  {installments && (
                    <p className="text-xs font-semibold text-[#1f4b46]">מספר תשלומים מומלץ לפי התקופה: {installments}</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="שם משפחה משלם" required error={errors.payerLastName}>
                      <Input {...textProps("payerLastName")} />
                    </Field>
                    <Field label="שם פרטי משלם" required error={errors.payerFirstName}>
                      <Input {...textProps("payerFirstName")} />
                    </Field>
                    <Field label="ת.ז. משלם" required error={errors.payerId}>
                      <Input {...textProps("payerId")} />
                    </Field>
                    <Field label="מספר כרטיס" required error={errors.cardNumber} hint="המספר נבדק לוולידציה">
                      <Input
                        value={form.cardNumber}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 19);
                          const grouped = raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
                          setField("cardNumber", grouped);
                        }}
                        onBlur={() => {
                          if (form.cardNumber.trim() && !isValidCardNumber(form.cardNumber)) {
                            setErrors((prev) => ({ ...prev, cardNumber: "מספר כרטיס לא תקין" }));
                          }
                        }}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        className={`bg-slate-50 text-left ${errors.cardNumber ? "border-destructive" : ""}`}
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
                        onBlur={() => {
                          if (form.cardExp.trim() && !isValidCardExpiry(form.cardExp)) {
                            setErrors((prev) => ({ ...prev, cardExp: "תוקף לא תקין או שפג" }));
                          }
                        }}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={5}
                        placeholder="MM/YY"
                        className={`bg-slate-50 text-left ${errors.cardExp ? "border-destructive" : ""}`}
                        style={{ direction: "ltr", textAlign: "left" }}
                      />
                    </Field>
                  </div>
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={form.paymentConsent}
                      onCheckedChange={(v) => setField("paymentConsent", Boolean(v))}
                      className="mt-0.5"
                    />
                    <span>אני מאשר/ת חיוב הכרטיס עבור המבוטח בהתאם לתנאי הפוליסה, לרבות חידושים והארכות.</span>
                  </label>
                  {errors.paymentConsent && <p className="text-xs text-rose-600">{errors.paymentConsent}</p>}
                </div>

                <Field label="הערות נוספות">
                  <Textarea
                    className="bg-slate-50 text-right"
                    style={{ direction: "rtl" }}
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="כל דבר שחשוב שנדע..."
                  />
                </Field>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-4 text-right">
                <h2 className="text-lg font-bold text-[#143834]">סיכום לפני שליחה</h2>
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                  <p>
                    <strong>עובד:</strong> {[form.firstName, form.lastName].filter(Boolean).join(" ")} · דרכון{" "}
                    {form.passportNo}
                  </p>
                  <p>
                    <strong>מעסיק:</strong> {form.employerName} · {form.employerMobile || form.employerPhone}
                  </p>
                  <p>
                    <strong>תקופה:</strong> {form.insuranceFrom} – {form.insuranceTo}
                  </p>
                  <p>
                    <strong>ספק:</strong> {PROVIDER_LABELS[form.provider] || form.provider}
                  </p>
                  <p>
                    <strong>קבצים:</strong> {files.length ? `${files.length} קבצים` : "ללא"}
                  </p>
                  <p>
                    <strong>תשלום:</strong>{" "}
                    {`כרטיס על שם ${form.payerFirstName} ${form.payerLastName}`}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  בלחיצה על ״שלח בקשה״ הפרטים יישלחו מסודרים לצוות אופיר ושות׳ להמשך טיפול מול הראל.
                </p>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSending}
                  className="fg-cta h-12 w-full rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-base font-bold text-white"
                >
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
                <Loader2 className="h-10 w-10 animate-spin text-[#2f6b63]" />
                <p className="font-semibold text-[#1f4b46]">שולחים את הבקשה...</p>
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f4f1] text-[#2f6b63]">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#143834]">הבקשה נשלחה בהצלחה</h2>
                <p className="text-sm text-slate-600">
                  קיבלנו את פרטי {[form.firstName, form.lastName].filter(Boolean).join(" ")}. נחזור אליכם בהקדם להמשך
                  הטיפול.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    setForm(createInitialForeignersForm());
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
              <div
                className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center"
                style={{ direction: "ltr" }}
              >
                <Button
                  type="button"
                  onClick={goNext}
                  className="fg-cta h-11 w-full rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white sm:mr-auto sm:w-auto sm:min-w-[200px]"
                >
                  המשך
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-2xl sm:w-auto"
                  onClick={goBack}
                >
                  <ArrowRight className="h-4 w-4" />
                  חזרה
                </Button>
              </div>
            )}

            {step === "review" && (
              <div className="mt-3">
                <Button type="button" variant="ghost" className="w-full rounded-2xl" onClick={goBack}>
                  חזרה לעריכה
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="fg-rise mt-6 text-center text-xs text-slate-500">
          בכפוף להצהרת הבריאות ולהצעת הביטוח של הראל · TravelSure / אופיר ושות׳ סוכנות לביטוח
        </p>
      </div>
    </div>
  );
};

export default Foreigners;
