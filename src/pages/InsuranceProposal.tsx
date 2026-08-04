import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.avif";
import {
  createInitialTravelProposalForm,
  displayName,
  emptyPerson,
  formatCardExpInput,
  formatDateInput,
  includedPersons,
  isValidCardExpiry,
  isValidCardNumber,
  isValidDateDdMmYyyy,
  isValidEmail,
  isValidIsraeliId,
  markAllHealthNo,
} from "@/lib/travelProposal/formDefaults";
import {
  DESTINATION_OPTIONS,
  PERSON_LABELS_HE,
  Q21_CONDITIONS,
  VALUABLE_OPTIONS,
  type InsuredPerson,
  type PersonKey,
  type PersonPlan,
  type Step,
  type TravelProposalForm,
  type YesNo,
} from "@/lib/travelProposal/types";
import { submitTravelProposal } from "@/lib/submitTravelProposal";
import {
  formatClaimDateDisplay,
  lookupClaimCustomerById,
  normalizeIsraeliId,
} from "@/lib/claimCrmLookup";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  Loader2,
  Plane,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

const STEPS: { id: Step; label: string }[] = [
  { id: "identity", label: "זיהוי" },
  { id: "trip", label: "נסיעה" },
  { id: "insureds", label: "מבוטחים" },
  { id: "health", label: "בריאות" },
  { id: "plan", label: "כיסויים" },
  { id: "payment", label: "תשלום" },
  { id: "review", label: "שליחה" },
];

const DEPENDENT_KEYS: PersonKey[] = ["spouse", "child1", "child2", "child3", "child4"];

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
      { v: "no" as const, label: "לא" },
      { v: "yes" as const, label: "כן" },
    ].map((opt) => (
      <button
        key={opt.v}
        type="button"
        onClick={() => onChange(opt.v)}
        className={`h-11 flex-1 rounded-2xl border text-sm font-semibold transition ${
          value === opt.v
            ? "border-[#2f6b63] bg-[#2f6b63] text-white shadow-sm shadow-[#2f6b63]/25"
            : "border-slate-200 bg-white text-slate-600 hover:border-[#2f6b63]/35"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const inputClass =
  "h-12 rounded-2xl border-slate-200 bg-slate-50/80 text-right shadow-none transition focus-visible:bg-white focus-visible:ring-[#2f6b63]";

const InsuranceProposal = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<TravelProposalForm>(() => createInitialTravelProposalForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [crmFound, setCrmFound] = useState(false);
  const [crmName, setCrmName] = useState("");
  const [activeHealthPerson, setActiveHealthPerson] = useState<PersonKey>("primary");
  const [activePlanPerson, setActivePlanPerson] = useState<PersonKey>("primary");

  const progressSteps = STEPS;
  const progressIndex = Math.max(
    0,
    progressSteps.findIndex(
      (s) =>
        s.id ===
        (step === "intro"
          ? "identity"
          : step === "sending" || step === "success"
            ? "review"
            : step),
    ),
  );
  const progressPct =
    step === "intro" ? 0 : ((progressIndex + 1) / progressSteps.length) * 100;

  const people = useMemo(() => includedPersons(form), [form]);
  const nextDependentKey = DEPENDENT_KEYS.find((k) => !form[k].included);

  const setField = <K extends keyof TravelProposalForm>(name: K, value: TravelProposalForm[K]) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as string];
        return next;
      });
    }
  };

  const patchPerson = (key: PersonKey, patch: Partial<InsuredPerson>) => {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const patchPersonHealth = (key: PersonKey, patch: Partial<InsuredPerson["health"]>) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], health: { ...prev[key].health, ...patch } },
    }));
  };

  const patchPersonPlan = (key: PersonKey, patch: Partial<PersonPlan>) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], plan: { ...prev[key].plan, ...patch } },
    }));
  };

  const toggleDest = (id: (typeof DESTINATION_OPTIONS)[number]["id"]) => {
    setForm((prev) => {
      const has = prev.destinations.includes(id);
      return {
        ...prev,
        destinations: has ? prev.destinations.filter((d) => d !== id) : [...prev.destinations, id],
      };
    });
  };

  const handleIdentityLookup = async () => {
    setLookupError("");
    if (!isValidIsraeliId(lookupId)) {
      setLookupError("תעודת זהות לא תקינה");
      return;
    }
    setIsLookingUp(true);
    try {
      const normalized = normalizeIsraeliId(lookupId);
      const result = await lookupClaimCustomerById(normalized);

      setForm((prev) => {
        const next = { ...prev };
        next.primary = {
          ...prev.primary,
          included: true,
          idNumber: normalized,
        };

        if (result.ok) {
          const c = result.customer;
          const birth = formatClaimDateDisplay(c.birthDate);
          next.primary = {
            ...next.primary,
            firstNameHe: c.firstNameHe || next.primary.firstNameHe,
            lastNameHe: c.lastNameHe || next.primary.lastNameHe,
            birthDate: birth && isValidDateDdMmYyyy(birth) ? birth : formatDateInput(birth.replace(/\D/g, "")) || next.primary.birthDate,
            idNumber: c.id || normalized,
          };
          next.mobile = c.phone || next.mobile;
          next.email = c.email || next.email;
          next.payerName =
            next.payerName ||
            [c.firstNameHe, c.lastNameHe].filter(Boolean).join(" ") ||
            c.primaryName;
          next.payerId = next.payerId || c.id || normalized;
          next.payerMobile = next.payerMobile || c.phone;
        }
        return next;
      });

      if (result.ok) {
        setCrmFound(true);
        setCrmName(result.customer.primaryName || result.customer.firstNameHe);
        toast({
          title: "מצאנו אותך במערכת",
          description: "מילאנו אוטומטית את הפרטים הידועים — אפשר לערוך בכל שלב",
        });
      } else {
        setCrmFound(false);
        setCrmName("");
        toast({
          title: "לא מצאנו פרטים קודמים",
          description: "נמשיך למילוי ידני — זה בסדר לגמרי",
        });
      }
      setStep("trip");
    } finally {
      setIsLookingUp(false);
    }
  };

  const continueWithoutCrm = () => {
    if (!isValidIsraeliId(lookupId)) {
      setLookupError("תעודת זהות לא תקינה");
      return;
    }
    const normalized = normalizeIsraeliId(lookupId);
    patchPerson("primary", { idNumber: normalized, included: true });
    setCrmFound(false);
    setCrmName("");
    setStep("trip");
  };

  const validateStep = (current: Step): boolean => {
    const nextErrors: Record<string, string> = {};

    if (current === "trip") {
      if (!isValidDateDdMmYyyy(form.tripFrom)) nextErrors.tripFrom = "תאריך התחלה לא תקין";
      if (!isValidDateDdMmYyyy(form.tripTo)) nextErrors.tripTo = "תאריך סיום לא תקין";
      if (!form.destinations.length) nextErrors.destinations = "יש לבחור לפחות יעד אחד";
      if (form.destinations.includes("usa")) {
        if (form.usaFrom && !isValidDateDdMmYyyy(form.usaFrom)) nextErrors.usaFrom = "תאריך לא תקין";
        if (form.usaTo && !isValidDateDdMmYyyy(form.usaTo)) nextErrors.usaTo = "תאריך לא תקין";
      }
      if (!form.countriesDetail.trim()) nextErrors.countriesDetail = "נא לפרט מדינות";
      if (!form.mobile.trim()) nextErrors.mobile = "שדה חובה";
      if (!isValidEmail(form.email)) nextErrors.email = "דוא״ל לא תקין";
    }

    if (current === "insureds") {
      if (!form.israeliResidents) nextErrors.israeliResidents = "הביטוח מיועד לתושבי ישראל בלבד";
      for (const { key, person } of people) {
        if (!person.gender) nextErrors[`${key}.gender`] = "יש לבחור מין";
        if (!isValidIsraeliId(person.idNumber)) nextErrors[`${key}.idNumber`] = "ת.ז לא תקינה";
        if (!person.firstNameHe.trim() && !person.firstNameEn.trim())
          nextErrors[`${key}.firstNameHe`] = "שם פרטי חובה";
        if (!person.lastNameHe.trim() && !person.lastNameEn.trim())
          nextErrors[`${key}.lastNameHe`] = "שם משפחה חובה";
        if (!isValidDateDdMmYyyy(person.birthDate)) nextErrors[`${key}.birthDate`] = "תאריך לידה לא תקין";
      }
    }

    if (current === "health") {
      for (const { key, person } of people) {
        if (!person.health.q1) nextErrors[`${key}.q1`] = "חובה";
        if (!person.health.q2) nextErrors[`${key}.q2`] = "חובה";
        if (!person.health.q3) nextErrors[`${key}.q3`] = "חובה";
        if (!person.health.q4) nextErrors[`${key}.q4`] = "חובה";
        if (person.health.q1 === "yes") nextErrors[`${key}.q1`] = "תשובה חיובית — לא ניתן לקבל לביטוח";
        if (person.gender === "female" && !person.health.q5Pregnant) nextErrors[`${key}.q5`] = "חובה";
      }
    }

    if (current === "payment") {
      if (!form.payerName.trim()) nextErrors.payerName = "שדה חובה";
      if (!isValidIsraeliId(form.payerId)) nextErrors.payerId = "ת.ז לא תקינה";
      if (!isValidCardNumber(form.cardNumber)) nextErrors.cardNumber = "מספר כרטיס לא תקין";
      if (!isValidCardExpiry(form.cardExp)) nextErrors.cardExp = "תוקף לא תקין";
      if (!/^\d{3,4}$/.test(form.cardCvv)) nextErrors.cardCvv = "CVV לא תקין";
      if (!form.paymentConsent) nextErrors.paymentConsent = "יש לאשר חיוב";
      if (!form.declarationsAccepted) nextErrors.declarationsAccepted = "יש לאשר הצהרות";
      if (!isValidDateDdMmYyyy(form.signatureDate)) nextErrors.signatureDate = "תאריך לא תקין";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      toast({ title: "יש להשלים שדות חובה", variant: "destructive" });
      return;
    }
    const order: Step[] = ["identity", "trip", "insureds", "health", "plan", "payment", "review"];
    const i = order.indexOf(step);
    if (i >= 0 && i < order.length - 1) setStep(order[i + 1]);
  };

  const goBack = () => {
    const order: Step[] = ["intro", "identity", "trip", "insureds", "health", "plan", "payment", "review"];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]);
  };

  const addDependent = () => {
    if (!nextDependentKey) return;
    patchPerson(nextDependentKey, { ...emptyPerson(true), included: true });
  };

  const removeDependent = (key: PersonKey) => {
    if (key === "primary") return;
    setForm((prev) => ({ ...prev, [key]: emptyPerson(false) }));
    if (activeHealthPerson === key) setActiveHealthPerson("primary");
    if (activePlanPerson === key) setActivePlanPerson("primary");
  };

  const copyPrimaryToPayer = () => {
    setForm((prev) => ({
      ...prev,
      payerName: displayName(prev.primary) || prev.payerName,
      payerId: prev.primary.idNumber || prev.payerId,
      payerMobile: prev.mobile || prev.payerMobile,
      payerPhone: prev.phone || prev.payerPhone,
    }));
  };

  const handleSubmit = async () => {
    if (!form.declarationsAccepted || !form.paymentConsent) {
      toast({ title: "יש לאשר הצהרות ותשלום", variant: "destructive" });
      setStep("payment");
      return;
    }
    setIsSending(true);
    setStep("sending");
    try {
      await submitTravelProposal(form, files);
      setStep("success");
      toast({ title: "ההצעה נשלחה בהצלחה" });
    } catch (err) {
      console.error(err);
      setStep("review");
      toast({
        title: "שליחה נכשלה",
        description: "נסו שוב בעוד רגע או פנו לסוכנות",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const renderPersonEditor = (key: PersonKey) => {
    const person = form[key];
    return (
      <div
        key={key}
        className="rounded-3xl border border-[#2f6b63]/10 bg-gradient-to-l from-white to-[#f7fbfa] p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#e8f4f1] text-[#2f6b63]">
              <UserRound className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-extrabold text-[#143834]">{PERSON_LABELS_HE[key]}</h3>
          </div>
          {key !== "primary" && (
            <button
              type="button"
              onClick={() => removeDependent(key)}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              הסר
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="מין" required error={errors[`${key}.gender`]}>
            <div className="flex gap-2">
              {[
                { v: "male" as const, l: "זכר" },
                { v: "female" as const, l: "נקבה" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => patchPerson(key, { gender: o.v })}
                  className={`h-11 flex-1 rounded-2xl border text-sm font-semibold ${
                    person.gender === o.v
                      ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="מספר ת.ז" required error={errors[`${key}.idNumber`]}>
            <Input
              className={inputClass}
              inputMode="numeric"
              maxLength={9}
              value={person.idNumber}
              onChange={(e) =>
                patchPerson(key, { idNumber: e.target.value.replace(/\D/g, "").slice(0, 9) })
              }
            />
          </Field>
          <Field label="שם משפחה בעברית" required error={errors[`${key}.lastNameHe`]}>
            <Input
              className={inputClass}
              value={person.lastNameHe}
              onChange={(e) => patchPerson(key, { lastNameHe: e.target.value })}
            />
          </Field>
          <Field label="שם משפחה באנגלית">
            <Input
              className={inputClass}
              dir="ltr"
              value={person.lastNameEn}
              onChange={(e) => patchPerson(key, { lastNameEn: e.target.value })}
            />
          </Field>
          <Field label="שם פרטי בעברית" required error={errors[`${key}.firstNameHe`]}>
            <Input
              className={inputClass}
              value={person.firstNameHe}
              onChange={(e) => patchPerson(key, { firstNameHe: e.target.value })}
            />
          </Field>
          <Field label="שם פרטי באנגלית">
            <Input
              className={inputClass}
              dir="ltr"
              value={person.firstNameEn}
              onChange={(e) => patchPerson(key, { firstNameEn: e.target.value })}
            />
          </Field>
          <Field label="תאריך לידה" required error={errors[`${key}.birthDate`]} hint="DD/MM/YYYY">
            <Input
              className={inputClass}
              dir="ltr"
              value={person.birthDate}
              onChange={(e) => patchPerson(key, { birthDate: formatDateInput(e.target.value) })}
              placeholder="DD/MM/YYYY"
            />
          </Field>
        </div>
      </div>
    );
  };

  const renderHealthFor = (key: PersonKey) => {
    const person = form[key];
    const h = person.health;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-[#143834]">
            הצהרת בריאות — {PERSON_LABELS_HE[key]}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => patchPerson(key, markAllHealthNo(person))}
          >
            סמן הכל לא
          </Button>
        </div>

        <Field
          label="1. האם אחת ממטרות הנסיעה היא קבלת ייעוץ, אבחון או טיפול רפואי?"
          required
          error={errors[`${key}.q1`]}
        >
          <YesNoToggle value={h.q1} onChange={(v) => patchPersonHealth(key, { q1: v })} name="q1" />
        </Field>
        <Field
          label="2. האם בחצי השנה האחרונה מקבל/ת תרופות קבועות או טיפול רפואי?"
          required
          error={errors[`${key}.q2`]}
        >
          <YesNoToggle value={h.q2} onChange={(v) => patchPersonHealth(key, { q2: v })} name="q2" />
        </Field>
        {h.q2 === "yes" && (
          <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
            <p className="text-xs font-semibold text-amber-900">2.1 האם הטיפול הוא לאחד מהמצבים הבאים?</p>
            <div className="grid gap-2">
              {Q21_CONDITIONS.map((c) => (
                <label key={c.id} className="flex items-start gap-2 text-xs text-slate-700">
                  <Checkbox
                    checked={h.q21Conditions.includes(c.id)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...h.q21Conditions, c.id]
                        : h.q21Conditions.filter((x) => x !== c.id);
                      patchPersonHealth(key, { q21Conditions: next });
                    }}
                  />
                  <span>{c.labelHe}</span>
                </label>
              ))}
            </div>
            <Field label="2.2 האם הטיפול עקב אי ספיקת לב עם בצקות / קוצר נשימה?">
              <YesNoToggle
                value={h.q22}
                onChange={(v) => patchPersonHealth(key, { q22: v })}
                name="q22"
              />
            </Field>
          </div>
        )}
        <Field
          label="3. ניתוח / אשפוז מעל 3 ימים / המלצה — בחצי השנה האחרונה?"
          required
          error={errors[`${key}.q3`]}
        >
          <YesNoToggle value={h.q3} onChange={(v) => patchPersonHealth(key, { q3: v })} name="q3" />
        </Field>
        {h.q3 === "yes" && (
          <Field label="3.1 האם הניתוח/אשפוז כבר בוצע וחלפו למעלה מ־3 חודשים?">
            <YesNoToggle
              value={h.q31}
              onChange={(v) => patchPersonHealth(key, { q31: v })}
              name="q31"
            />
          </Field>
        )}
        <Field
          label="4. האם הופנית לבדיקות שטרם בוצעו / תוצאות לא תקינות?"
          required
          error={errors[`${key}.q4`]}
        >
          <YesNoToggle value={h.q4} onChange={(v) => patchPersonHealth(key, { q4: v })} name="q4" />
        </Field>
        {h.q4 === "yes" && (
          <Field label="פירוט הבדיקות">
            <Textarea
              className="min-h-[80px] rounded-2xl border-slate-200 bg-slate-50/80 text-right"
              value={h.q4Details}
              onChange={(e) => patchPersonHealth(key, { q4Details: e.target.value })}
            />
          </Field>
        )}
        {person.gender === "female" && (
          <div className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
            <Field label="5. האם הנך בהיריון?" required error={errors[`${key}.q5`]}>
              <YesNoToggle
                value={h.q5Pregnant}
                onChange={(v) => patchPersonHealth(key, { q5Pregnant: v })}
                name="q5"
              />
            </Field>
            {h.q5Pregnant === "yes" && (
              <>
                <Field label="5.1 שבוע היריון נוכחי">
                  <Input
                    className={inputClass}
                    inputMode="numeric"
                    value={h.q51Week}
                    onChange={(e) =>
                      patchPersonHealth(key, { q51Week: e.target.value.replace(/\D/g, "").slice(0, 2) })
                    }
                  />
                </Field>
                <Field label="5.2 האם היריון בסיכון / מרובה עוברים / הומלץ לא לנסוע?">
                  <YesNoToggle
                    value={h.q52HighRisk}
                    onChange={(v) => patchPersonHealth(key, { q52HighRisk: v })}
                    name="q52"
                  />
                </Field>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const PlanCheck = ({
    label,
    checked,
    onChange,
    hint,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    hint?: string;
  }) => (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition hover:border-[#2f6b63]/30">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(!!c)} className="mt-0.5" />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
      </span>
    </label>
  );

  const renderPlanFor = (key: PersonKey) => {
    const plan = form[key].plan;
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-[#143834]">פירסט קלאס — {PERSON_LABELS_HE[key]}</h3>
        <p className="text-xs text-slate-500">
          ביטוח רפואי בסיסי כלול. אפשר להסיר כיסויים כלולים או להוסיף הרחבות.
        </p>
        <div className="grid gap-2">
          <PlanCheck
            label="לא מעוניין בחיפוש, איתור וחילוץ (כלול בבסיס)"
            checked={plan.optOutSearchRescue}
            onChange={(v) => patchPersonPlan(key, { optOutSearchRescue: v })}
          />
          <PlanCheck
            label="לא מעוניין בחבות כלפי צד ג׳ (כלול בבסיס)"
            checked={plan.optOutThirdParty}
            onChange={(v) => patchPersonPlan(key, { optOutThirdParty: v })}
          />
        </div>
        <p className="pt-2 text-xs font-bold text-[#2f6b63]">הרחבות בתוספת תשלום</p>
        <div className="grid gap-2">
          <PlanCheck
            label="כבודה — אובדן או גניבה"
            checked={plan.baggage}
            onChange={(v) => patchPersonPlan(key, { baggage: v })}
          />
          {plan.baggage && (
            <div className="mr-2 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:mr-6">
              <p className="text-[11px] font-semibold text-slate-600">פריט יקר ערך עד $2,000</p>
              {VALUABLE_OPTIONS.map((v) => (
                <label key={v.id} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={plan.valuableItems.includes(v.id)}
                    onCheckedChange={(c) => {
                      const next = c
                        ? [...plan.valuableItems, v.id]
                        : plan.valuableItems.filter((x) => x !== v.id);
                      patchPersonPlan(key, { valuableItems: next });
                    }}
                  />
                  {v.labelHe}
                </label>
              ))}
            </div>
          )}
          <PlanCheck
            label="ביטול / קיצור נסיעה"
            checked={plan.cancellation}
            onChange={(v) => patchPersonPlan(key, { cancellation: v })}
          />
          <PlanCheck
            label="ביטול וקיצור נסיעה מורחב"
            checked={plan.cancellationExpanded}
            onChange={(v) => patchPersonPlan(key, { cancellationExpanded: v })}
          />
          <PlanCheck
            label="החמרה של מצב רפואי קודם"
            checked={plan.priorCondition}
            onChange={(v) => patchPersonPlan(key, { priorCondition: v })}
          />
          <PlanCheck
            label="הרחבה להיריון"
            checked={plan.pregnancy}
            onChange={(v) => patchPersonPlan(key, { pregnancy: v })}
          />
          <PlanCheck
            label="ספורט אתגרי חובבני"
            checked={plan.adventureSports}
            onChange={(v) => patchPersonPlan(key, { adventureSports: v })}
          />
          {plan.adventureSports && (
            <div className="mr-2 grid grid-cols-2 gap-2 sm:mr-6">
              <Field label="מ-">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={plan.adventureFrom}
                  onChange={(e) =>
                    patchPersonPlan(key, { adventureFrom: formatDateInput(e.target.value) })
                  }
                />
              </Field>
              <Field label="עד-">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={plan.adventureTo}
                  onChange={(e) =>
                    patchPersonPlan(key, { adventureTo: formatDateInput(e.target.value) })
                  }
                />
              </Field>
            </div>
          )}
          <PlanCheck
            label="ספורט חורף"
            checked={plan.winterSports}
            onChange={(v) => patchPersonPlan(key, { winterSports: v })}
          />
          {plan.winterSports && (
            <div className="mr-2 grid grid-cols-2 gap-2 sm:mr-6">
              <Field label="מ-">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={plan.winterFrom}
                  onChange={(e) =>
                    patchPersonPlan(key, { winterFrom: formatDateInput(e.target.value) })
                  }
                />
              </Field>
              <Field label="עד-">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={plan.winterTo}
                  onChange={(e) =>
                    patchPersonPlan(key, { winterTo: formatDateInput(e.target.value) })
                  }
                />
              </Field>
            </div>
          )}
          <PlanCheck
            label="ספורט מקצועני"
            checked={plan.proSports}
            onChange={(v) => patchPersonPlan(key, { proSports: v })}
          />
          <PlanCheck
            label="תאונות אישיות"
            checked={plan.personalAccident}
            onChange={(v) => patchPersonPlan(key, { personalAccident: v })}
          />
          <PlanCheck
            label="תאונות אישיות בספורט אתגרי"
            checked={plan.personalAccidentAdventure}
            onChange={(v) => patchPersonPlan(key, { personalAccidentAdventure: v })}
          />
          <PlanCheck
            label="מחשב נישא / טאבלט עד $2,000"
            checked={plan.laptop}
            onChange={(v) => patchPersonPlan(key, { laptop: v })}
          />
          {plan.laptop && (
            <Field label="דגם">
              <Input
                className={inputClass}
                value={plan.laptopModel}
                onChange={(e) => patchPersonPlan(key, { laptopModel: e.target.value })}
              />
            </Field>
          )}
          <PlanCheck
            label="טלפון נייד עד $750"
            checked={plan.phone}
            onChange={(v) => patchPersonPlan(key, { phone: v })}
          />
          {plan.phone && (
            <Field label="דגם">
              <Input
                className={inputClass}
                value={plan.phoneModel}
                onChange={(e) => patchPersonPlan(key, { phoneModel: e.target.value })}
              />
            </Field>
          )}
          <PlanCheck
            label="אופניים דו־גלגליים"
            checked={plan.bicycle}
            onChange={(v) => patchPersonPlan(key, { bicycle: v })}
          />
          {plan.bicycle && (
            <div className="mr-2 space-y-2 rounded-2xl bg-slate-50 p-3 sm:mr-6">
              <div className="flex flex-wrap gap-2">
                {(["2500", "4500", "6000"] as const).map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => patchPersonPlan(key, { bicycleLimit: lim })}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      plan.bicycleLimit === lim
                        ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    ${lim}
                  </button>
                ))}
              </div>
              <Field label="דגם">
                <Input
                  className={inputClass}
                  value={plan.bicycleModel}
                  onChange={(e) => patchPersonPlan(key, { bicycleModel: e.target.value })}
                />
              </Field>
              <Field label="תאריך רכישה">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={plan.bicyclePurchaseDate}
                  onChange={(e) =>
                    patchPersonPlan(key, { bicyclePurchaseDate: formatDateInput(e.target.value) })
                  }
                />
              </Field>
              <Field label="ערך ב־₪">
                <Input
                  className={inputClass}
                  inputMode="numeric"
                  value={plan.bicycleValueNis}
                  onChange={(e) =>
                    patchPersonPlan(key, { bicycleValueNis: e.target.value.replace(/\D/g, "") })
                  }
                />
              </Field>
            </div>
          )}
          <PlanCheck
            label="ביטול השתתפות עצמית לרכב שכור"
            checked={plan.rentalCar}
            onChange={(v) => patchPersonPlan(key, { rentalCar: v })}
          />
          {plan.rentalCar && (
            <div className="mr-2 space-y-2 rounded-2xl bg-slate-50 p-3 sm:mr-6">
              <div className="flex gap-2">
                {(["1500", "6000"] as const).map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => patchPersonPlan(key, { rentalCarLimit: lim })}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      plan.rentalCarLimit === lim
                        ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    ${lim}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="מ-">
                  <Input
                    className={inputClass}
                    dir="ltr"
                    value={plan.rentalFrom}
                    onChange={(e) =>
                      patchPersonPlan(key, { rentalFrom: formatDateInput(e.target.value) })
                    }
                  />
                </Field>
                <Field label="עד-">
                  <Input
                    className={inputClass}
                    dir="ltr"
                    value={plan.rentalTo}
                    onChange={(e) =>
                      patchPersonPlan(key, { rentalTo: formatDateInput(e.target.value) })
                    }
                  />
                </Field>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const showNav = step !== "intro" && step !== "success" && step !== "sending" && step !== "identity";

  return (
    <div className="proposal-page relative min-h-screen overflow-hidden font-heebo" dir="rtl">
      <style>{`
        .proposal-page {
          background:
            radial-gradient(1100px 520px at 88% -10%, rgba(74,222,128,.18), transparent 55%),
            radial-gradient(820px 420px at -10% 20%, rgba(47,107,99,.14), transparent 50%),
            linear-gradient(180deg, #f3faf7 0%, #eef6f3 45%, #e9f2ef 100%);
        }
        @keyframes tp-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tp-rise { animation: tp-rise .45s ease-out both; }
        .tp-rise-d1 { animation-delay: .06s; }
        .tp-rise-d2 { animation-delay: .12s; }
        @keyframes tp-shine {
          0%, 55% { left: -40%; }
          100% { left: 120%; }
        }
        .tp-cta { position: relative; overflow: hidden; }
        .tp-cta::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 -40%;
          width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: skewX(-20deg);
          animation: tp-shine 2.8s ease-in-out infinite;
        }
      `}</style>

      <div className={`relative z-10 mx-auto max-w-3xl px-4 py-8 sm:py-10 ${showNav ? "pb-28" : ""}`}>
        <header className="tp-rise mb-7 flex w-full flex-col items-center text-center">
          <img src={logo} alt="TravelSure" className="mx-auto h-[88px] w-auto drop-shadow-sm sm:h-28" />
          <h1 className="mt-4 w-full text-3xl font-extrabold text-[#143834] sm:text-4xl">
            הצעה לביטוח נסיעות לחו״ל
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 sm:text-base">
            תהליך דיגיטלי קצר · ממלאים פעם אחת ומקבלים את טופס הראל הרשמי מוכן
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#1f4b46]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f6b63]/15 bg-white/80 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2f6b63]" />
              הראל · פירסט קלאס
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f6b63]/15 bg-white/80 px-3 py-1.5">
              <Plane className="h-3.5 w-3.5 text-[#2f6b63]" />
              נסיעות לחו״ל
            </span>
          </div>
        </header>

        {step !== "intro" && step !== "success" && step !== "sending" && (
          <div className="tp-rise tp-rise-d1 mb-5">
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

        <div className="tp-rise tp-rise-d2 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_30px_80px_-40px_rgba(20,56,52,0.55)] backdrop-blur-xl">
          <div className="h-1.5 bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#4ade80]" />
          <div className="p-5 sm:p-7">
            {step === "intro" && (
              <div className="mx-auto max-w-md space-y-5 text-center">
                <h2 className="text-xl font-bold text-[#143834]">איך זה עובד?</h2>
                <ol className="mx-auto max-w-sm space-y-3 text-sm text-slate-600">
                  {[
                    "מזים תעודת זהות — ואנחנו ממלאים אוטומטית מהמערכת",
                    "משלימים פרטי נסיעה, מבוטחים והצהרת בריאות",
                    "בוחרים כיסויים ומזינים תשלום",
                    "שולחים — והטופס הרשמי של הראל מגיע לסוכנות",
                  ].map((text, i) => (
                    <li key={text} className="flex items-center justify-center gap-3 text-right">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f4f1] text-xs font-bold text-[#1f4b46]">
                        {i + 1}
                      </span>
                      <span className="flex-1">{text}</span>
                    </li>
                  ))}
                </ol>
                <Button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="tp-cta h-12 w-full rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-base font-bold text-white"
                >
                  מתחילים
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            )}

            {step === "identity" && (
              <div className="mx-auto max-w-md space-y-5">
                <div className="text-center sm:text-right">
                  <h2 className="text-2xl font-extrabold text-[#143834]">זיהוי לפי תעודת זהות</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    נבדוק במערכת אם כבר יש לנו את הפרטים שלך — ונמלא אותם אוטומטית
                  </p>
                </div>
                <Field label="תעודת זהות" required error={lookupError}>
                  <Input
                    className={`${inputClass} text-center text-lg tracking-[0.2em] sm:text-right`}
                    inputMode="numeric"
                    maxLength={9}
                    value={lookupId}
                    onChange={(e) => {
                      setLookupId(e.target.value.replace(/\D/g, "").slice(0, 9));
                      setLookupError("");
                    }}
                    placeholder="9 ספרות"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleIdentityLookup();
                    }}
                  />
                </Field>
                <Button
                  type="button"
                  className="tp-cta h-12 w-full rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-base font-bold text-white"
                  disabled={isLookingUp || lookupId.length < 5}
                  onClick={() => void handleIdentityLookup()}
                >
                  {isLookingUp ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      בודקים במערכת…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      זיהוי והמשך
                    </>
                  )}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs font-semibold text-slate-400 hover:text-[#2f6b63]"
                  onClick={continueWithoutCrm}
                >
                  המשך למילוי ידני
                </button>
              </div>
            )}

            {step === "trip" && (
              <div className="space-y-5">
                {crmFound && (
                  <div className="flex items-start gap-3 rounded-2xl border border-[#2f6b63]/15 bg-gradient-to-l from-[#e8f4f1] to-white p-4">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6b63]" />
                    <div className="text-sm text-slate-600">
                      <p className="font-bold text-[#143834]">
                        {crmName ? `שלום ${crmName}` : "מצאנו אותך"}
                      </p>
                      <p className="mt-0.5 text-xs">מילאנו פרטים מהמערכת — אפשר לערוך בכל שלב</p>
                    </div>
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-extrabold text-[#143834]">פרטי הנסיעה</h2>
                  <p className="mt-1 text-xs text-slate-500">תאריכים, יעדים ודרכי התקשרות</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="מתאריך" required error={errors.tripFrom}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      placeholder="DD/MM/YYYY"
                      value={form.tripFrom}
                      onChange={(e) => setField("tripFrom", formatDateInput(e.target.value))}
                    />
                  </Field>
                  <Field label="עד תאריך" required error={errors.tripTo}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      placeholder="DD/MM/YYYY"
                      value={form.tripTo}
                      onChange={(e) => setField("tripTo", formatDateInput(e.target.value))}
                    />
                  </Field>
                </div>
                <Field label="יעד הנסיעה" required error={errors.destinations}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DESTINATION_OPTIONS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDest(d.id)}
                        className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                          form.destinations.includes(d.id)
                            ? "border-[#2f6b63] bg-[#2f6b63] text-white shadow-sm shadow-[#2f6b63]/20"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[#2f6b63]/30"
                        }`}
                      >
                        {d.labelHe}
                      </button>
                    ))}
                  </div>
                </Field>
                {form.destinations.includes("usa") && (
                  <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2">
                    <Field label="ארה״ב מ-" error={errors.usaFrom}>
                      <Input
                        className={inputClass}
                        dir="ltr"
                        value={form.usaFrom}
                        onChange={(e) => setField("usaFrom", formatDateInput(e.target.value))}
                      />
                    </Field>
                    <Field label="ארה״ב עד-" error={errors.usaTo}>
                      <Input
                        className={inputClass}
                        dir="ltr"
                        value={form.usaTo}
                        onChange={(e) => setField("usaTo", formatDateInput(e.target.value))}
                      />
                    </Field>
                  </div>
                )}
                <Field label="נא פרט את המדינות בהן בכוונתך לבקר" required error={errors.countriesDetail}>
                  <Textarea
                    className="min-h-[88px] rounded-2xl border-slate-200 bg-slate-50/80 text-right"
                    placeholder="לדוגמה: צרפת, איטליה, ספרד"
                    value={form.countriesDetail}
                    onChange={(e) => setField("countriesDetail", e.target.value)}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="נייד" required error={errors.mobile}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      value={form.mobile}
                      onChange={(e) => setField("mobile", e.target.value)}
                      placeholder="05X-XXXXXXX"
                    />
                  </Field>
                  <Field label="דוא״ל" required error={errors.email}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="name@email.com"
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === "insureds" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#143834]">פרטי המועמדים לביטוח</h2>
                  <p className="mt-1 text-xs text-slate-500">מבוטח ראשי — ואם צריך, מוסיפים בן/ת זוג או ילדים</p>
                </div>
                <label className="flex items-start gap-2 rounded-2xl border border-[#2f6b63]/10 bg-[#f7fbfa] p-4 text-sm text-slate-700">
                  <Checkbox
                    checked={form.israeliResidents}
                    onCheckedChange={(c) => setField("israeliResidents", !!c)}
                    className="mt-0.5"
                  />
                  <span>
                    הביטוח מיועד לתושבי ישראל בלבד. הנני מצהיר כי המבוטחים הם תושבי ישראל
                    {errors.israeliResidents && (
                      <span className="mt-1 block text-xs text-rose-600">{errors.israeliResidents}</span>
                    )}
                  </span>
                </label>

                {renderPersonEditor("primary")}

                {DEPENDENT_KEYS.filter((k) => form[k].included).map((k) => renderPersonEditor(k))}

                {nextDependentKey && (
                  <button
                    type="button"
                    onClick={addDependent}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#2f6b63]/35 bg-white/70 px-4 py-3.5 text-sm font-bold text-[#2f6b63] transition hover:border-[#2f6b63] hover:bg-[#e8f4f1]/50"
                  >
                    <Plus className="h-4 w-4" />
                    הוסף {PERSON_LABELS_HE[nextDependentKey]}
                  </button>
                )}
              </div>
            )}

            {step === "health" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#143834]">הצהרת בריאות</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    הפוליסה אינה מכסה הוצאות רפואיות ממצב רפואי קודם אלא אם נרכשה הרחבה להחמרה
                  </p>
                </div>
                {people.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {people.map(({ key }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveHealthPerson(key)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          activeHealthPerson === key
                            ? "bg-[#2f6b63] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {PERSON_LABELS_HE[key]}
                      </button>
                    ))}
                  </div>
                )}
                {renderHealthFor(activeHealthPerson)}
                <Field label="צירוף מסמכים רפואיים (אופציונלי)">
                  <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-3 text-sm text-slate-600">
                    <FileUp className="h-4 w-4" />
                    העלאת קבצים
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const list = Array.from(e.target.files || []);
                        setFiles((prev) => [...prev, ...list].slice(0, 8));
                      }}
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-2 py-1 text-xs"
                        >
                          <span className="truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Field>
              </div>
            )}

            {step === "plan" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-[#143834]">תכנית הביטוח — פירסט קלאס</h2>
                  <p className="mt-1 text-xs text-slate-500">בחרו כיסויים לכל מבוטח</p>
                </div>
                {people.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {people.map(({ key }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActivePlanPerson(key)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          activePlanPerson === key
                            ? "bg-[#2f6b63] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {PERSON_LABELS_HE[key]}
                      </button>
                    ))}
                  </div>
                )}
                {renderPlanFor(activePlanPerson)}
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#143834]">תשלום בכרטיס אשראי</h2>
                    <p className="mt-1 text-xs text-slate-500">פרטי בעל הכרטיס והצהרות</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={copyPrimaryToPayer}
                  >
                    העתק ממבוטח ראשי
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="שם בעל הכרטיס" required error={errors.payerName}>
                    <Input
                      className={inputClass}
                      value={form.payerName}
                      onChange={(e) => setField("payerName", e.target.value)}
                    />
                  </Field>
                  <Field label="מספר ת.ז" required error={errors.payerId}>
                    <Input
                      className={inputClass}
                      inputMode="numeric"
                      maxLength={9}
                      value={form.payerId}
                      onChange={(e) => setField("payerId", e.target.value.replace(/\D/g, "").slice(0, 9))}
                    />
                  </Field>
                  <Field label="מספר תשלומים">
                    <Input
                      className={inputClass}
                      inputMode="numeric"
                      value={form.installments}
                      onChange={(e) =>
                        setField("installments", e.target.value.replace(/\D/g, "").slice(0, 2))
                      }
                    />
                  </Field>
                  <Field label="מס׳ כרטיס" required error={errors.cardNumber}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      inputMode="numeric"
                      value={form.cardNumber}
                      onChange={(e) =>
                        setField("cardNumber", e.target.value.replace(/\D/g, "").slice(0, 16))
                      }
                    />
                  </Field>
                  <Field label="בתוקף עד (MM/YY)" required error={errors.cardExp}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      placeholder="MM/YY"
                      value={form.cardExp}
                      onChange={(e) => setField("cardExp", formatCardExpInput(e.target.value))}
                    />
                  </Field>
                  <Field label="CVV" required error={errors.cardCvv}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={4}
                      value={form.cardCvv}
                      onChange={(e) =>
                        setField("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                    />
                  </Field>
                  <Field label="תאריך חתימה" required error={errors.signatureDate}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      value={form.signatureDate}
                      onChange={(e) => setField("signatureDate", formatDateInput(e.target.value))}
                    />
                  </Field>
                </div>

                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={form.paymentConsent}
                    onCheckedChange={(c) => setField("paymentConsent", !!c)}
                    className="mt-0.5"
                  />
                  <span>
                    אני מאשר/ת את נכונות פרטי התשלום ואת החיוב בכרטיס האשראי
                    {errors.paymentConsent && (
                      <span className="mt-1 block text-xs text-rose-600">{errors.paymentConsent}</span>
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={form.declarationsAccepted}
                    onCheckedChange={(c) => setField("declarationsAccepted", !!c)}
                    className="mt-0.5"
                  />
                  <span>
                    קראתי ואני מאשר/ת את הצהרות המועמדים לביטוח ומסירת הפרטים לאופיר ושות׳
                    {errors.declarationsAccepted && (
                      <span className="mt-1 block text-xs text-rose-600">
                        {errors.declarationsAccepted}
                      </span>
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={form.marketingConsentExtra}
                    onCheckedChange={(c) => setField("marketingConsentExtra", !!c)}
                    className="mt-0.5"
                  />
                  <span>הסכמה לקבלת דברי פרסומת נוספת מקבוצת הראל</span>
                </label>
                <Field label="הערות לסוכנות">
                  <Textarea
                    className="min-h-[70px] rounded-2xl border-slate-200 bg-slate-50/80 text-right"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-[#143834]">סיכום ושליחה</h2>
                  <p className="mt-1 text-xs text-slate-500">בדקו שהכל נכון לפני השליחה</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-[#2f6b63]/10 bg-[#f7fbfa] p-4 text-sm text-slate-700">
                  <p>
                    <strong>מבוטח ראשי:</strong> {displayName(form.primary)}
                  </p>
                  <p>
                    <strong>נסיעה:</strong> {form.tripFrom} – {form.tripTo}
                  </p>
                  <p>
                    <strong>יעדים:</strong>{" "}
                    {form.destinations
                      .map((id) => DESTINATION_OPTIONS.find((d) => d.id === id)?.labelHe)
                      .join(", ")}
                  </p>
                  <p>
                    <strong>מבוטחים:</strong> {people.length}
                  </p>
                </div>
                <Button
                  className="tp-cta h-12 w-full rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-base font-bold text-white"
                  onClick={handleSubmit}
                  disabled={isSending}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      שולח…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      שלח הצעה
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === "sending" && (
              <div className="py-10 text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#2f6b63]" />
                <p className="mt-4 text-sm text-slate-600">ממלא את טופס הראל ושולח לסוכנות…</p>
              </div>
            )}

            {step === "success" && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f4f1] text-[#2f6b63]">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="mt-4 text-2xl font-extrabold text-[#143834]">ההצעה נשלחה</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  טופס ההצעה הממולא התקבל אצל אופיר ושות׳. ניצור קשר להמשך הטיפול מול הראל.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          בכפוף להצעת הביטוח ולהצהרת הבריאות של הראל · TravelSure / אופיר ושות׳ סוכנות לביטוח
        </p>
      </div>

      {showNav && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/60 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3">
            {step !== "review" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-2xl"
                  onClick={goBack}
                >
                  <ArrowRight className="ml-1 h-4 w-4" />
                  הקודם
                </Button>
                <Button
                  type="button"
                  className="tp-cta h-11 flex-[1.4] rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white"
                  onClick={goNext}
                >
                  המשך
                  <ArrowLeft className="mr-1 h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" className="h-11 flex-1 rounded-2xl" onClick={goBack}>
                <ArrowRight className="ml-1 h-4 w-4" />
                חזרה לעריכה
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceProposal;
