import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AgencyHeader from "@/components/AgencyHeader";
import AgencyFooter from "@/components/AgencyFooter";
import {
  FORM_LANGUAGES,
  PROVIDER_LABELS,
  ROLE_LABELS,
  ageOn,
  appliesTo,
  containsHebrew,
  createInitialTouristsForm,
  emptyTraveler,
  formatDateInput,
  isValidCardExpiry,
  isValidCardNumber,
  isValidDateDdMmYyyy,
  isValidEmail,
  periodDays,
  toEnglishOnly,
  travelerLabel,
  travelerName,
  visibleHealthQuestions,
} from "@/lib/tourists/formDefaults";
import { MEDICAL_CARE_QUESTION, type TouristHealthQuestion } from "@/lib/tourists/healthQuestions";
import {
  TOURIST_ROLES,
  type Traveler,
  type TouristRiders,
  type TouristRole,
  type TouristsForm,
  type TouristStep,
  type YesNo,
} from "@/lib/tourists/types";
import { submitTouristsApplication } from "@/lib/submitTourists";
import { ArrowLeft, ArrowRight, Check, FileUp, Loader2, Plane, Plus, Send, ShieldCheck, Trash2, X } from "lucide-react";

// Agency look, same as /foreigners: white 14px fields, navy text, green focus
const fieldCls =
  "min-h-[52px] rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] text-[17px] font-semibold text-[#000144] md:text-[17px] placeholder:font-normal placeholder:text-[#8A94AD] focus-visible:border-[#00A247] focus-visible:ring-0 focus-visible:ring-offset-0";
const textareaCls =
  "rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] text-[16px] font-medium text-[#000144] placeholder:text-[#8A94AD] focus-visible:border-[#00A247] focus-visible:ring-0 focus-visible:ring-offset-0";
const choiceCls = (active: boolean) =>
  `min-h-[48px] rounded-[14px] border-2 px-3 text-[15px] font-bold transition ${
    active ? "border-[#000144] bg-[#000144] text-white" : "border-[#D5DAE3] bg-white text-[#33405F] hover:border-[#000144]/40"
  }`;
const chipCls = (active: boolean) =>
  `min-h-[40px] rounded-full border-2 px-4 py-1.5 text-[14px] font-bold ${
    active ? "border-[#00A247] bg-[#E6F6EC] text-[#000144]" : "border-[#D5DAE3] bg-white text-[#33405F]"
  }`;
const cardCls = "rounded-[20px] border-2 border-[#E3E7EE] bg-white p-4";

const STEPS: { id: TouristStep; label: string }[] = [
  { id: "intro", label: "התחלה" },
  { id: "travelers", label: "המבוטחים" },
  { id: "stay", label: "שהייה בישראל" },
  { id: "health", label: "בריאות" },
  { id: "riders", label: "הרחבות" },
  { id: "payment", label: "תשלום" },
  { id: "review", label: "שליחה" },
];
const ORDER: TouristStep[] = ["intro", "travelers", "stay", "health", "riders", "payment", "review"];

const RIDERS: Array<{ key: keyof Omit<TouristRiders, "extremeFrom" | "extremeTo">; he: string; en: string; note?: string }> = [
  { key: "airTransport", he: "נספח הטסה רפואית", en: "Medical air transportation", note: "הטסה מישראל לחו״ל בליווי צוות רפואי, עד 35,000 ₪" },
  { key: "accidents", he: "תאונות אישיות בישראל", en: "Personal accidents in Israel", note: "גילאי 18–70 בלבד" },
  { key: "extremeSports", he: "ביטול חריג ספורט אתגרי", en: "Extreme sports exclusion cancellation", note: "אפשר גם לחלק מהתקופה" },
  { key: "medicalManager", he: "רופא מלווה אישי", en: "Appointed medical manager" },
  { key: "onlineConsult", he: "ייעוץ רפואי בשיחת וידאו", en: "Online medical consultation" },
];

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

const YesNoToggle = ({ value, onChange, name, compact }: { value: YesNo | undefined; onChange: (v: YesNo) => void; name: string; compact?: boolean }) => (
  <div className={`flex gap-2 ${compact ? "w-[176px] shrink-0" : ""}`} role="group" aria-label={name}>
    {[
      { v: "no" as const, label: "לא / No" },
      { v: "yes" as const, label: "כן / Yes" },
    ].map((opt) => (
      <button
        key={opt.v}
        type="button"
        aria-pressed={value === opt.v}
        onClick={() => onChange(opt.v)}
        className={`flex-1 ${compact ? "min-h-[42px] rounded-[12px] text-[14px]" : "min-h-[48px] rounded-[14px] text-[15px]"} border-2 font-bold transition ${
          value === opt.v ? "border-[#000144] bg-[#000144] text-white" : "border-[#D5DAE3] bg-white text-[#33405F] hover:border-[#000144]/40"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const Tourists = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<TouristStep>("intro");
  const [form, setForm] = useState<TouristsForm>(() => createInitialTouristsForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const progressSteps = STEPS.filter((s) => s.id !== "intro");
  const progressIndex = Math.max(
    0,
    progressSteps.findIndex((s) => s.id === (step === "sending" || step === "success" ? "review" : step)),
  );
  const progressPct = step === "intro" ? 0 : ((progressIndex + 1) / progressSteps.length) * 100;

  const days = useMemo(() => periodDays(form.insuranceFrom, form.insuranceTo), [form.insuranceFrom, form.insuranceTo]);
  const questions = useMemo(() => visibleHealthQuestions(form.travelers), [form.travelers]);
  const hasChildren = form.travelers.some((t) => t.role.startsWith("child"));

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setField = <K extends keyof TouristsForm>(name: K, value: TouristsForm[K]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    clearError(name as string);
  };

  /* ---------- travelers ---------- */

  const setTraveler = (role: TouristRole, patch: Partial<Traveler>) => {
    setForm((prev) => ({ ...prev, travelers: prev.travelers.map((t) => (t.role === role ? { ...t, ...patch } : t)) }));
    Object.keys(patch).forEach((k) => clearError(`${role}.${k}`));
  };

  const addTraveler = (kind: "spouse" | "child") => {
    setForm((prev) => {
      const taken = new Set(prev.travelers.map((t) => t.role));
      const role = kind === "spouse" ? "spouse" : (["child1", "child2", "child3"] as TouristRole[]).find((r) => !taken.has(r));
      if (!role || taken.has(role)) return prev;
      const travelers = [...prev.travelers, { ...emptyTraveler(role), lastName: prev.travelers[0]?.lastName || "" }];
      travelers.sort((a, b) => TOURIST_ROLES.indexOf(a.role) - TOURIST_ROLES.indexOf(b.role));
      return { ...prev, travelers };
    });
  };

  const removeTraveler = (role: TouristRole) => {
    setForm((prev) => {
      const health = Object.fromEntries(
        Object.entries(prev.health).map(([id, ans]) => {
          const answers = { ...ans.answers };
          delete answers[role];
          return [id, { ...ans, answers }];
        }),
      );
      const strip = (list: TouristRole[]) => list.filter((r) => r !== role);
      return {
        ...prev,
        travelers: prev.travelers.filter((t) => t.role !== role),
        health,
        riders: {
          ...prev.riders,
          airTransport: strip(prev.riders.airTransport),
          accidents: strip(prev.riders.accidents),
          extremeSports: strip(prev.riders.extremeSports),
          medicalManager: strip(prev.riders.medicalManager),
          onlineConsult: strip(prev.riders.onlineConsult),
        },
      };
    });
  };

  /* ---------- health ---------- */

  const setAnswer = (qid: string, role: TouristRole, v: YesNo) => {
    setForm((prev) => {
      const ans = prev.health[qid];
      const answers = { ...ans.answers, [role]: v };
      const anyYes = Object.values(answers).includes("yes");
      return {
        ...prev,
        health: { ...prev.health, [qid]: { ...ans, answers, selected: anyYes ? ans.selected : [], details: anyYes ? ans.details : "" } },
      };
    });
    clearError(`q.${qid}`);
  };

  const toggleOption = (qid: string, optionId: string) =>
    setForm((prev) => {
      const ans = prev.health[qid];
      const selected = ans.selected.includes(optionId) ? ans.selected.filter((x) => x !== optionId) : [...ans.selected, optionId];
      return { ...prev, health: { ...prev.health, [qid]: { ...ans, selected } } };
    });

  const setDetails = (qid: string, details: string) => {
    setForm((prev) => ({ ...prev, health: { ...prev.health, [qid]: { ...prev.health[qid], details } } }));
    clearError(`q.${qid}`);
  };

  const markAllHealthNo = () => {
    setForm((prev) => {
      const health = { ...prev.health };
      for (const q of [MEDICAL_CARE_QUESTION, ...visibleHealthQuestions(prev.travelers)]) {
        const answers: Partial<Record<TouristRole, YesNo>> = {};
        prev.travelers.filter((t) => appliesTo(q.id, t)).forEach((t) => (answers[t.role] = "no"));
        health[q.id] = { answers, selected: [], details: "" };
      }
      return { ...prev, health };
    });
    setErrors({});
    toast({ title: "סומן הכל כ־לא", description: "אפשר לעבור על השאלות ולשנות אם צריך." });
  };

  const anyHealthYes = questions.some((q) => Object.values(form.health[q.id]?.answers || {}).includes("yes"));
  const medicalCareYes = Object.values(form.health.q0?.answers || {}).includes("yes");

  /* ---------- riders ---------- */

  const accidentsAllowed = (t: Traveler) => {
    const age = ageOn(t.birthDate);
    return (t.role === "main" || t.role === "spouse") && age !== null && age >= 18 && age <= 70;
  };

  const toggleRider = (key: keyof Omit<TouristRiders, "extremeFrom" | "extremeTo">, role: TouristRole) =>
    setForm((prev) => {
      const list = prev.riders[key];
      const next = list.includes(role) ? list.filter((r) => r !== role) : [...list, role];
      return { ...prev, riders: { ...prev.riders, [key]: next } };
    });

  /* ---------- validation ---------- */

  const validateTravelers = () => {
    const next: Record<string, string> = {};
    const fromDate = isValidDateDdMmYyyy(form.insuranceFrom) ? form.insuranceFrom : "";
    for (const t of form.travelers) {
      const k = (f: string) => `${t.role}.${f}`;
      for (const f of ["firstName", "lastName", "passportNo", "passportCountry", "citizenship"] as const) {
        if (!t[f].trim()) next[k(f)] = "שדה חובה";
        else if (containsHebrew(t[f])) next[k(f)] = "יש להזין באנגלית בלבד";
      }
      if (!isValidDateDdMmYyyy(t.birthDate)) next[k("birthDate")] = "תאריך בפורמט DD/MM/YYYY";
      else {
        const [d, m, y] = (fromDate || "").split("/").map(Number);
        const age = ageOn(t.birthDate, fromDate ? new Date(y, m - 1, d) : new Date());
        if (age !== null && age > 80) next[k("birthDate")] = "הביטוח עד גיל 80";
      }
      if (!t.gender) next[k("gender")] = "שדה חובה";
      if (!isValidDateDdMmYyyy(t.entryDate)) next[k("entryDate")] = "תאריך בפורמט DD/MM/YYYY";
      if (!t.visitPurpose.trim()) next[k("visitPurpose")] = "שדה חובה";
    }
    if (!isValidDateDdMmYyyy(form.insuranceFrom)) next.insuranceFrom = "תאריך בפורמט DD/MM/YYYY";
    if (!isValidDateDdMmYyyy(form.insuranceTo)) next.insuranceTo = "תאריך בפורמט DD/MM/YYYY";
    else if (isValidDateDdMmYyyy(form.insuranceFrom) && !periodDays(form.insuranceFrom, form.insuranceTo)) next.insuranceTo = "תאריך הסיום לפני תאריך ההתחלה";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStay = () => {
    const next: Record<string, string> = {};
    if (!form.street.trim()) next.street = "שדה חובה";
    if (!form.houseNo.trim()) next.houseNo = "שדה חובה";
    if (!form.town.trim()) next.town = "שדה חובה";
    if (!form.mobile.trim()) next.mobile = "שדה חובה";
    if (!form.email.trim() || !isValidEmail(form.email)) next.email = "אימייל לא תקין";
    if (!form.provider) next.provider = "יש לבחור ספק שירות";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateHealth = () => {
    const next: Record<string, string> = {};
    for (const q of [MEDICAL_CARE_QUESTION, ...questions]) {
      const ans = form.health[q.id];
      const pending = form.travelers.filter((t) => appliesTo(q.id, t) && !ans.answers[t.role]);
      if (pending.length) {
        next[`q.${q.id}`] = form.travelers.length > 1 ? "יש לענות כן/לא לכל מבוטח" : "יש לענות כן/לא";
        continue;
      }
      const yes = Object.values(ans.answers).includes("yes");
      if (yes && q.id !== "q0" && !ans.details.trim() && (q.options.length === 0 || ans.selected.length === 0 || q.needsDetails)) {
        next[`q.${q.id}`] = q.options.length && !q.needsDetails ? "יש לסמן או לפרט" : "יש לפרט";
      }
    }
    if (medicalCareYes) next["q.q0"] = "אם אחת ממטרות ההגעה היא טיפול רפואי, הראל לא יכולה לקבל את הבקשה";
    if (anyHealthYes && files.length === 0) next.files = "כשעניתם כן — יש לצרף מסמך רפואי עדכני";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateRiders = () => {
    const next: Record<string, string> = {};
    if (form.riders.extremeSports.length) {
      const from = form.riders.extremeFrom || form.insuranceFrom;
      const to = form.riders.extremeTo || form.insuranceTo;
      if (!isValidDateDdMmYyyy(from) || !isValidDateDdMmYyyy(to) || !periodDays(from, to)) next.extreme = "יש להזין תקופה תקינה";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePayment = () => {
    const next: Record<string, string> = {};
    if (!form.declarationsAccepted) next.declarationsAccepted = "חובה לאשר את ההצהרות";
    if (hasChildren && !form.authorizedForChildren) next.authorizedForChildren = "שדה חובה";
    if (!form.marketingConsent) next.marketingConsent = "שדה חובה";
    if (!form.signatureName.trim()) next.signatureName = "שדה חובה";
    if (!isValidDateDdMmYyyy(form.signatureDate)) next.signatureDate = "תאריך בפורמט DD/MM/YYYY";
    if (!form.payerId.trim()) next.payerId = "שדה חובה";
    if (!form.cardholderName.trim()) next.cardholderName = "שדה חובה";
    if (!form.cardNumber.trim()) next.cardNumber = "שדה חובה";
    else if (!isValidCardNumber(form.cardNumber)) next.cardNumber = "מספר כרטיס לא תקין";
    if (!form.cardExp.trim()) next.cardExp = "שדה חובה";
    else if (!isValidCardExpiry(form.cardExp)) next.cardExp = "תוקף לא תקין או שפג";
    if (!form.payerPhone.trim()) next.payerPhone = "שדה חובה";
    if (form.payerEmail.trim() && !isValidEmail(form.payerEmail)) next.payerEmail = "אימייל לא תקין";
    if (!form.paymentConsent) next.paymentConsent = "חובה לאשר";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    const validators: Partial<Record<TouristStep, () => boolean>> = {
      travelers: validateTravelers,
      stay: validateStay,
      health: validateHealth,
      riders: validateRiders,
      payment: validatePayment,
    };
    if (validators[step] && !validators[step]!()) {
      toast({ title: "יש להשלים את השדות המסומנים", variant: "destructive" });
      return;
    }
    if (step === "stay") {
      // Prefill the payer from the main insured and the stay details
      const main = form.travelers[0];
      setForm((prev) => ({
        ...prev,
        cardholderName: prev.cardholderName || travelerName(main),
        signatureName: prev.signatureName || travelerName(main),
        payerId: prev.payerId || main.passportNo,
        payerPhone: prev.payerPhone || prev.mobile,
        payerEmail: prev.payerEmail || prev.email,
        payerCity: prev.payerCity || prev.town,
        payerStreet: prev.payerStreet || [prev.street, prev.houseNo].filter(Boolean).join(" "),
      }));
    }
    const idx = ORDER.indexOf(step);
    if (idx >= 0 && idx < ORDER.length - 1) setStep(ORDER[idx + 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    const idx = ORDER.indexOf(step);
    if (idx > 0) setStep(ORDER[idx - 1]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validatePayment()) {
      setStep("payment");
      return;
    }
    setIsSending(true);
    setStep("sending");
    try {
      await submitTouristsApplication(form, files);
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
      inputMode="numeric"
      maxLength={10}
      placeholder="DD/MM/YYYY"
      className={`${fieldCls} text-right ${error ? "border-destructive" : ""}`}
      style={{ direction: "rtl", textAlign: "right" }}
    />
  );

  const textProps = (name: keyof TouristsForm, opts?: { placeholder?: string; type?: string }) => ({
    value: String(form[name] ?? ""),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setField(name, e.target.value as never),
    placeholder: opts?.placeholder,
    type: opts?.type || "text",
    className: `${fieldCls} text-right ${errors[name as string] ? "border-destructive" : ""}`,
    style: { direction: "rtl" as const, textAlign: "right" as const },
  });

  const englishInput = (t: Traveler, key: "firstName" | "lastName" | "passportNo" | "passportCountry" | "citizenship" | "visitPurpose", placeholder: string, caps = "words") => {
    const errKey = `${t.role}.${key}`;
    return (
      <Input
        value={t[key]}
        onChange={(e) => {
          const cleaned = key === "visitPurpose" ? e.target.value : toEnglishOnly(e.target.value);
          setTraveler(t.role, { [key]: cleaned });
          if (cleaned !== e.target.value) setErrors((prev) => ({ ...prev, [errKey]: "יש להזין באנגלית בלבד" }));
        }}
        placeholder={placeholder}
        lang="en"
        autoCapitalize={caps}
        className={`${fieldCls} text-left ${errors[errKey] ? "border-destructive" : ""}`}
        style={{ direction: "ltr", textAlign: "left" }}
      />
    );
  };

  /* ---------- health question card ---------- */

  // A render function, not a component: an inner component would remount on every keystroke
  const renderQuestion = (q: TouristHealthQuestion) => {
    const ans = form.health[q.id];
    const people = form.travelers.filter((t) => appliesTo(q.id, t));
    const anyYes = people.some((t) => ans.answers[t.role] === "yes");
    const err = errors[`q.${q.id}`];
    return (
      <div key={q.id} className={`${cardCls} ${err ? "border-rose-300" : ""}`}>
        <p className="text-[16px] font-bold text-[#000144]">
          {q.no > 0 && <span className="text-[#46557A]">{q.no}. </span>}
          {q.he}
        </p>
        <p className="mt-0.5 text-[13px] font-medium text-[#46557A]">{q.en}</p>
        {people.length === 1 ? (
          <div className="mt-3">
            <YesNoToggle name={q.id} value={ans.answers[people[0].role]} onChange={(v) => setAnswer(q.id, people[0].role, v)} />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {people.map((t) => (
              <div key={t.role} className="flex !flex-row items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[14px] font-semibold text-[#33405F]">{travelerLabel(t)}</span>
                <YesNoToggle compact name={`${q.id}-${t.role}`} value={ans.answers[t.role]} onChange={(v) => setAnswer(q.id, t.role, v)} />
              </div>
            ))}
          </div>
        )}
        {anyYes && q.id !== "q0" && (
          <div className="mt-3 space-y-3">
            {q.options.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button key={opt.id} type="button" aria-pressed={ans.selected.includes(opt.id)} onClick={() => toggleOption(q.id, opt.id)} className={chipCls(ans.selected.includes(opt.id))}>
                    {opt.he}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              className={`${textareaCls} text-right`}
              style={{ direction: "rtl" }}
              placeholder={people.length > 1 ? "פירוט: למי, מה האבחנה, מתי ואיך מטופל" : "פירוט: מה האבחנה, מתי ואיך מטופל"}
              value={ans.details}
              onChange={(e) => setDetails(q.id, e.target.value)}
            />
          </div>
        )}
        {q.id === "q0" && medicalCareYes && (
          <p className="mt-3 rounded-[12px] bg-rose-50 px-3 py-2 text-[14px] font-semibold text-rose-700">
            אם אחת ממטרות ההגעה לישראל היא קבלת טיפול רפואי, הראל לא יכולה לקבל את הבקשה לביטוח.
          </p>
        )}
        {err && !(q.id === "q0" && medicalCareYes) && <p className="mt-2 text-xs text-rose-600">{err}</p>}
      </div>
    );
  };

  /* ---------- render ---------- */

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F5F8] font-rubik text-[#000144]" dir="rtl">
      <section className="relative z-20 overflow-x-clip bg-[#000144] text-white">
        <div aria-hidden="true" className="absolute left-[-120px] top-[-160px] h-[360px] w-[360px] rounded-full bg-[#0C1060]" />
        <div className="relative mx-auto max-w-[1200px] px-4 pt-5 sm:px-6">
          <AgencyHeader minimal />
        </div>
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pb-8 pt-8 sm:px-6">
          <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-black leading-[1.02] tracking-[-0.01em]">ביטוח תיירים בישראל</h1>
          <p className="m-0 max-w-[640px] text-[18px] font-medium text-[#E3EAFF]">
            הצעת ביטוח בריאות + הצהרת בריאות — תהליך דיגיטלי קצר במקום מילוי PDF וסריקה
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] font-bold text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#00A247] px-4 py-1.5">
              <ShieldCheck className="h-4 w-4 text-[#00A247]" />
              הראל · Tour &amp; Care
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#00A247] px-4 py-1.5">
              <Plane className="h-4 w-4 text-[#00A247]" />
              לתיירים ולתושבים חוזרים
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto box-border w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
        {step !== "intro" && step !== "success" && (
          <div className="mb-5">
            <div className="mb-2 flex justify-between text-[13px] font-bold text-[#46557A]">
              <span>{progressSteps[Math.min(progressIndex, progressSteps.length - 1)]?.label}</span>
              <span>
                {Math.min(progressIndex + 1, progressSteps.length)} / {progressSteps.length}
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
              <div className="mx-auto max-w-md space-y-5 text-center">
                <h2 className="text-[26px] font-black text-[#000144]">איך זה עובד?</h2>
                <ol className="mx-auto max-w-sm space-y-3 text-[16px] font-medium text-[#33405F]">
                  {[
                    "ממלאים את פרטי המבוטחים — עד 5 בבקשה אחת",
                    "פרטי השהייה בישראל ובחירת ספק השירות",
                    "הצהרת בריאות (אפשר לסמן הכל כ־לא בלחיצה) והרחבות",
                    "פרטי תשלום — ושולחים. אנחנו מקבלים את הטופס של הראל ממולא",
                  ].map((text, i) => (
                    <li key={text} className="flex items-center justify-center gap-3 text-right">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#000144] text-sm font-bold text-white">{i + 1}</span>
                      <span className="flex-1">{text}</span>
                    </li>
                  ))}
                </ol>
                <div className="rounded-[20px] bg-[#F3F5F8] p-4 text-right">
                  <p className="mb-2 text-[15px] font-bold text-[#000144]">באיזו שפה למלא את טופס ההצעה של הראל?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FORM_LANGUAGES.map((l) => (
                      <button key={l.id} type="button" aria-pressed={form.formLanguage === l.id} onClick={() => setField("formLanguage", l.id)} className={choiceCls(form.formLanguage === l.id)}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="button" onClick={goNext} className="h-14 w-full rounded-[18px] bg-[#00A247] text-[19px] font-extrabold text-[#000144] hover:bg-[#008C3D]">
                  מתחילים
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            )}

            {step === "travelers" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">המבוטחים</h2>
                  <p className="mt-1 text-[14px] font-medium text-[#46557A]">עד גיל 80 · פרטים כפי שמופיעים בדרכון, באנגלית בלבד</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="תקופת ביטוח מ־" required error={errors.insuranceFrom}>
                    {dateInput(form.insuranceFrom, (v) => setField("insuranceFrom", v), errors.insuranceFrom)}
                  </Field>
                  <Field label="תקופת ביטוח עד" required error={errors.insuranceTo}>
                    {dateInput(form.insuranceTo, (v) => setField("insuranceTo", v), errors.insuranceTo)}
                  </Field>
                </div>
                {days && (
                  <p className="rounded-[14px] bg-[#E6F6EC] px-4 py-2.5 text-[14px] font-bold text-[#000144]">
                    {days} ימי ביטוח{days > 90 ? " · אפשר לשלם ב־2 תשלומים" : ""}
                  </p>
                )}

                {form.travelers.map((t) => (
                  <div key={t.role} className={`${cardCls} space-y-4`}>
                    <div className="flex !flex-row items-center justify-between gap-3">
                      <h3 className="text-[19px] font-black text-[#000144]">
                        {ROLE_LABELS[t.role].he} <span className="text-[14px] font-semibold text-[#46557A]">/ {ROLE_LABELS[t.role].en}</span>
                      </h3>
                      {t.role !== "main" && (
                        <button type="button" onClick={() => removeTraveler(t.role)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[14px] font-bold text-[#46557A] hover:bg-[#F3F5F8]">
                          <X className="h-4 w-4" />
                          הסרה
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="שם פרטי / First name" required error={errors[`${t.role}.firstName`]} hint="English only">
                        {englishInput(t, "firstName", "First name")}
                      </Field>
                      <Field label="שם משפחה / Last name" required error={errors[`${t.role}.lastName`]} hint="English only">
                        {englishInput(t, "lastName", "Last name")}
                      </Field>
                      <Field label="מספר דרכון / Passport No." required error={errors[`${t.role}.passportNo`]}>
                        {englishInput(t, "passportNo", "Passport number", "characters")}
                      </Field>
                      <Field label="ארץ הנפקת דרכון / Passport country" required error={errors[`${t.role}.passportCountry`]}>
                        {englishInput(t, "passportCountry", "e.g. United States")}
                      </Field>
                      <Field label="אזרחות / Citizenship" required error={errors[`${t.role}.citizenship`]}>
                        {englishInput(t, "citizenship", "e.g. American")}
                      </Field>
                      <Field label="תאריך לידה" required error={errors[`${t.role}.birthDate`]}>
                        {dateInput(t.birthDate, (v) => setTraveler(t.role, { birthDate: v }), errors[`${t.role}.birthDate`])}
                      </Field>
                      <Field label="מין / Gender" required error={errors[`${t.role}.gender`]}>
                        <div className="flex gap-2">
                          {[
                            { v: "male" as const, label: "זכר / Male" },
                            { v: "female" as const, label: "נקבה / Female" },
                          ].map((opt) => (
                            <button key={opt.v} type="button" aria-pressed={t.gender === opt.v} onClick={() => setTraveler(t.role, { gender: opt.v })} className={`flex-1 ${choiceCls(t.gender === opt.v)}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </Field>
                      <Field label="תאריך כניסה לישראל" required error={errors[`${t.role}.entryDate`]}>
                        {dateInput(t.entryDate, (v) => setTraveler(t.role, { entryDate: v }), errors[`${t.role}.entryDate`])}
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="מטרת הביקור / Purpose of visit" required error={errors[`${t.role}.visitPurpose`]}>
                          {englishInput(t, "visitPurpose", "e.g. Family visit, tourism, studies")}
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  {!form.travelers.some((t) => t.role === "spouse") && (
                    <button type="button" onClick={() => addTraveler("spouse")} className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] border-[3px] border-[#000144] bg-white px-5 text-[16px] font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white">
                      <Plus className="h-4 w-4" />
                      הוספת בן/בת זוג
                    </button>
                  )}
                  {form.travelers.filter((t) => t.role.startsWith("child")).length < 3 && (
                    <button type="button" onClick={() => addTraveler("child")} className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] border-[3px] border-[#000144] bg-white px-5 text-[16px] font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white">
                      <Plus className="h-4 w-4" />
                      הוספת ילד/ה
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === "stay" && (
              <div className="space-y-4">
                <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">שהייה בישראל ופרטי קשר</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="רחוב" required error={errors.street}>
                    <Input {...textProps("street", { placeholder: "שם הרחוב" })} />
                  </Field>
                  <Field label="מס׳ בית" required error={errors.houseNo}>
                    <Input {...textProps("houseNo", { placeholder: "12" })} />
                  </Field>
                  <Field label="מס׳ דירה">
                    <Input {...textProps("apartmentNo", { placeholder: "3" })} />
                  </Field>
                  <Field label="יישוב" required error={errors.town}>
                    <Input {...textProps("town", { placeholder: "תל אביב" })} />
                  </Field>
                  <Field label="שם המשפחה המארחת">
                    <Input {...textProps("hostLastName")} />
                  </Field>
                  <Field label="טלפון נייד" required error={errors.mobile}>
                    <Input {...textProps("mobile", { type: "tel" })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="דוא״ל להודעות ולמסמכי הפוליסה" required error={errors.email}>
                      <Input {...textProps("email", { type: "email", placeholder: "name@email.com" })} />
                    </Field>
                  </div>
                </div>
                <Field label="בחירת ספק שירות" required error={errors.provider}>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(Object.keys(PROVIDER_LABELS) as Array<TouristsForm["provider"]>).map((key) => (
                      <button key={key} type="button" aria-pressed={form.provider === key} onClick={() => setField("provider", key)} className={choiceCls(form.provider === key)}>
                        {PROVIDER_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </Field>
                <label className="flex items-start gap-3 text-[15px] font-medium text-[#33405F]">
                  <Checkbox
                    checked={form.documentsByPost}
                    onCheckedChange={(v) => setField("documentsByPost", Boolean(v))}
                    className="mt-0.5 h-5 w-5 rounded-[6px] border-2 border-[#000144] data-[state=checked]:bg-[#000144] data-[state=checked]:text-white"
                  />
                  <span>לשלוח את מסמכי הפוליסה גם בדואר ישראל (ברירת המחדל: לנייד ולדוא״ל)</span>
                </label>
              </div>
            )}

            {step === "health" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">הצהרת בריאות</h2>
                    <p className="mt-1 text-[14px] font-medium text-[#46557A]">
                      Health Statement — {form.travelers.length > 1 ? "לכל מבוטח בנפרד. " : ""}תשובת ״כן״ מחייבת פירוט ומסמך רפואי. הפוליסה אינה מכסה מצב רפואי קודם.
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="h-12 rounded-[18px] border-[3px] border-[#000144] bg-white px-5 text-[16px] font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white" onClick={markAllHealthNo}>
                    סמן הכל כ־לא
                  </Button>
                </div>

                {renderQuestion(MEDICAL_CARE_QUESTION)}
                <h3 className="pt-2 text-[19px] font-black text-[#000144]">האם אובחנה מחלה, תופעה או הפרעה באחד מהנושאים:</h3>
                {questions.filter((q) => q.no <= 19).map(renderQuestion)}
                <h3 className="pt-2 text-[19px] font-black text-[#000144]">שאלות כלליות</h3>
                {questions.filter((q) => q.no >= 20).map(renderQuestion)}

                <div className="rounded-[20px] border-2 border-dashed border-[#D5DAE3] bg-[#F3F5F8] p-4">
                  <p className="mb-2 text-[16px] font-bold text-[#000144]">צירוף מסמכים רפואיים</p>
                  <p className="mb-3 text-[14px] font-medium text-[#46557A]">אם עניתם כן באחת השאלות — צרפו תעודה עדכנית מהרופא המטפל, תוצאות בדיקות וכו׳.</p>
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

            {step === "riders" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">הרחבות וכתבי שירות</h2>
                  <p className="mt-1 text-[14px] font-medium text-[#46557A]">לא חובה · בתוספת דמי ביטוח · מסמנים למי מהמבוטחים להוסיף</p>
                </div>
                {RIDERS.map((rider) => {
                  const eligible = form.travelers.filter((t) => rider.key !== "accidents" || accidentsAllowed(t));
                  return (
                    <div key={rider.key} className={cardCls}>
                      <p className="text-[16px] font-bold text-[#000144]">{rider.he}</p>
                      <p className="mt-0.5 text-[13px] font-medium text-[#46557A]">
                        {rider.en}
                        {rider.note ? ` · ${rider.note}` : ""}
                      </p>
                      {eligible.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {eligible.map((t) => {
                            const on = form.riders[rider.key].includes(t.role);
                            return (
                              <button key={t.role} type="button" aria-pressed={on} onClick={() => toggleRider(rider.key, t.role)} className={chipCls(on)}>
                                {on && <Check className="-mt-0.5 ml-1 inline h-4 w-4" />}
                                {travelerLabel(t)}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-3 text-[14px] font-medium text-[#8A94AD]">לא זמין למבוטחים בבקשה זו</p>
                      )}
                      {rider.key === "extremeSports" && form.riders.extremeSports.length > 0 && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <Field label="מתאריך" error={errors.extreme}>
                            {dateInput(form.riders.extremeFrom || form.insuranceFrom, (v) => setForm((p) => ({ ...p, riders: { ...p.riders, extremeFrom: v } })))}
                          </Field>
                          <Field label="עד תאריך">
                            {dateInput(form.riders.extremeTo || form.insuranceTo, (v) => setForm((p) => ({ ...p, riders: { ...p.riders, extremeTo: v } })))}
                          </Field>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">הצהרות ותשלום</h2>

                <div className={`${cardCls} text-[15px]`}>
                  <label className="flex items-start gap-3 text-right">
                    <Checkbox
                      checked={form.declarationsAccepted}
                      onCheckedChange={(v) => setField("declarationsAccepted", Boolean(v))}
                      className="mt-0.5 h-5 w-5 rounded-[6px] border-2 border-[#000144] data-[state=checked]:bg-[#000144] data-[state=checked]:text-white"
                    />
                    <span className="font-medium text-[#33405F]">
                      אני מאשר/ת את הצהרות המועמד לביטוח בטופס של הראל: כל התשובות נכונות ומלאות ונמסרו מרצוני החופשי; קיבלתי מידע מהותי על הביטוח; ויתור על סודיות רפואית לטובת הראל; הסמכת סוכן הביטוח לטפל בהליך ההצטרפות בשמי; וידוע לי שהפוליסה אינה מכסה מצב רפואי קודם ושיש תקופת אכשרה של 48 שעות.
                    </span>
                  </label>
                  {errors.declarationsAccepted && <p className="mt-2 text-xs text-rose-600">{errors.declarationsAccepted}</p>}
                </div>

                {hasChildren && (
                  <Field label="האם את/ה מוסמך/ת לחתום על המסמכים בשם הילדים?" required error={errors.authorizedForChildren}>
                    <YesNoToggle name="authorized" value={form.authorizedForChildren} onChange={(v) => setField("authorizedForChildren", v)} />
                  </Field>
                )}
                <Field label="הסכמה לקבלת דברי פרסומת מחברות קבוצת הראל" required error={errors.marketingConsent}>
                  <YesNoToggle name="marketing" value={form.marketingConsent} onChange={(v) => setField("marketingConsent", v)} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="שם מלא לחתימה" required error={errors.signatureName}>
                    <Input {...textProps("signatureName", { placeholder: "כתבו את שמכם המלא" })} />
                  </Field>
                  <Field label="תאריך" required error={errors.signatureDate}>
                    {dateInput(form.signatureDate, (v) => setField("signatureDate", v), errors.signatureDate)}
                  </Field>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[19px] font-black text-[#000144]">פרטי המשלם / כרטיס אשראי</h3>
                  {days && days > 90 && (
                    <Field label="מספר תשלומים">
                      <div className="grid grid-cols-2 gap-2">
                        {(["1", "2"] as const).map((n) => (
                          <button key={n} type="button" aria-pressed={form.installments === n} onClick={() => setField("installments", n)} className={choiceCls(form.installments === n)}>
                            {n === "1" ? "תשלום אחד" : "2 תשלומים"}
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="שם בעל הכרטיס" required error={errors.cardholderName}>
                      <Input {...textProps("cardholderName")} />
                    </Field>
                    <Field label="ת.ז. / דרכון של המשלם" required error={errors.payerId}>
                      <Input {...textProps("payerId")} />
                    </Field>
                    <Field label="מספר כרטיס" required error={errors.cardNumber}>
                      <Input
                        value={form.cardNumber}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 19);
                          setField("cardNumber", raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
                        }}
                        onBlur={() => {
                          if (form.cardNumber.trim() && !isValidCardNumber(form.cardNumber)) setErrors((prev) => ({ ...prev, cardNumber: "מספר כרטיס לא תקין" }));
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
                        onBlur={() => {
                          if (form.cardExp.trim() && !isValidCardExpiry(form.cardExp)) setErrors((prev) => ({ ...prev, cardExp: "תוקף לא תקין או שפג" }));
                        }}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        maxLength={5}
                        placeholder="MM/YY"
                        className={`${fieldCls} text-left ${errors.cardExp ? "border-destructive" : ""}`}
                        style={{ direction: "ltr", textAlign: "left" }}
                      />
                    </Field>
                    <Field label="טלפון המשלם" required error={errors.payerPhone}>
                      <Input {...textProps("payerPhone", { type: "tel" })} />
                    </Field>
                    <Field label="דוא״ל המשלם" error={errors.payerEmail}>
                      <Input {...textProps("payerEmail", { type: "email" })} />
                    </Field>
                    <Field label="רחוב ומספר">
                      <Input {...textProps("payerStreet")} />
                    </Field>
                    <Field label="יישוב">
                      <Input {...textProps("payerCity")} />
                    </Field>
                    <Field label="מיקוד">
                      <Input {...textProps("payerZip")} />
                    </Field>
                  </div>
                  <label className="flex items-start gap-3 text-[15px] font-medium text-[#33405F]">
                    <Checkbox
                      checked={form.paymentConsent}
                      onCheckedChange={(v) => setField("paymentConsent", Boolean(v))}
                      className="mt-0.5 h-5 w-5 rounded-[6px] border-2 border-[#000144] data-[state=checked]:bg-[#000144] data-[state=checked]:text-white"
                    />
                    <span>אני מאשר/ת חיוב הכרטיס עבור כל המבוטחים בפוליסה, בהתאם לתנאי הפוליסה.</span>
                  </label>
                  {errors.paymentConsent && <p className="text-xs text-rose-600">{errors.paymentConsent}</p>}
                </div>

                <Field label="הערות נוספות">
                  <Textarea className={`${textareaCls} text-right`} style={{ direction: "rtl" }} value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="כל דבר שחשוב שנדע..." />
                </Field>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-4 text-right">
                <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">סיכום לפני שליחה</h2>
                <div className="space-y-3 rounded-[20px] bg-[#F3F5F8] p-5 text-[16px] text-[#33405F]">
                  {form.travelers.map((t) => (
                    <p key={t.role}>
                      <strong>{ROLE_LABELS[t.role].he}:</strong> {travelerName(t)} · דרכון {t.passportNo}
                    </p>
                  ))}
                  <p>
                    <strong>תקופה:</strong> {form.insuranceFrom} – {form.insuranceTo}
                    {days ? ` (${days} ימים)` : ""}
                  </p>
                  <p>
                    <strong>ספק:</strong> {PROVIDER_LABELS[form.provider] || form.provider}
                  </p>
                  <p>
                    <strong>הצהרת בריאות:</strong> {anyHealthYes ? "יש תשובות ״כן״ — מצורף פירוט" : "לא לכל השאלות"}
                  </p>
                  <p>
                    <strong>קבצים:</strong> {files.length ? `${files.length} קבצים` : "ללא"}
                  </p>
                  <p>
                    <strong>תשלום:</strong> כרטיס על שם {form.cardholderName}
                    {days && days > 90 && form.installments === "2" ? " · 2 תשלומים" : ""}
                  </p>
                  <p>
                    <strong>טופס הראל:</strong> {form.formLanguage === "en" ? "באנגלית" : "בעברית"}
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
                <p className="text-[17px] font-medium text-[#33405F]">קיבלנו את הבקשה עבור {travelerName(form.travelers[0])}. נחזור אליכם בהקדם להמשך הטיפול.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 rounded-[18px] border-[3px] border-[#000144] bg-white px-7 text-[18px] font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white"
                  onClick={() => {
                    setForm(createInitialTouristsForm());
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
                  disabled={step === "health" && medicalCareYes}
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

export default Tourists;
