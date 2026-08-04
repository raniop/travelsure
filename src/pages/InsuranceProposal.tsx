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
  VALUABLE_OPTIONS,
  type InsuredPerson,
  type PersonKey,
  type PersonPlan,
  type Step,
  type TravelProposalForm,
  type YesNo,
} from "@/lib/travelProposal/types";
import {
  HEALTH_DISCLAIMER,
  HEALTH_INTRO,
  PREGNANCY_AGE_NOTE,
  PREGNANCY_EXT_NOTE,
  PREGNANCY_SECTION_TITLE,
  Q1_NOTE,
  Q1_REJECT,
  Q1_TITLE,
  Q2_EXCEPTIONS,
  Q2_IF_NO,
  Q2_IF_YES,
  Q2_POSITIVE_DOC,
  Q2_TITLE,
  Q21_NEGATIVE_EXT,
  Q21_OPTIONS,
  Q21_TITLE,
  Q22_BODY,
  Q22_TITLE,
  Q3_IF_NO,
  Q3_IF_YES,
  Q3_NOTE,
  Q3_TITLE,
  Q3_TOPICS,
  Q31_IF_NO,
  Q31_IF_YES,
  Q31_TITLE,
  Q4_DETAILS_HINT,
  Q4_DETAILS_LABEL,
  Q4_IF_YES,
  Q4_TITLE,
  Q5_TITLE,
  Q51_TITLE,
  Q52_REJECT,
  Q52_TITLE,
} from "@/lib/travelProposal/healthQuestions";
import { submitTravelProposal } from "@/lib/submitTravelProposal";
import {
  formatClaimDateDisplay,
  lookupClaimCustomerById,
  normalizeIsraeliId,
} from "@/lib/claimCrmLookup";
import {
  COVERAGE_ICONS,
  CoverageCard,
  DestinationPicker,
  HealthQuestionCard,
  PillYesNo,
  ProposalIconStepper,
  TripDateRangePicker,
} from "@/components/travelProposal/ProposalUi";
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
}) => <PillYesNo value={value} onChange={onChange} name={name} />;

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
      const destinations = has
        ? prev.destinations.filter((d) => d !== id)
        : [...prev.destinations, id];
      const countriesDetail = destinations
        .map((d) => DESTINATION_OPTIONS.find((o) => o.id === d)?.labelHe)
        .filter(Boolean)
        .join(", ");
      return { ...prev, destinations, countriesDetail };
    });
    if (errors.destinations) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.destinations;
        return next;
      });
    }
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
            firstNameEn: c.firstNameEn || next.primary.firstNameEn,
            lastNameEn: c.lastNameEn || next.primary.lastNameEn,
            gender: c.gender || next.primary.gender,
            birthDate:
              birth && isValidDateDdMmYyyy(birth)
                ? birth
                : formatDateInput(birth.replace(/\D/g, "")) || next.primary.birthDate,
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
        if (person.health.q2 === "yes" && !person.health.q22) nextErrors[`${key}.q22`] = "חובה";
        if (person.health.q3 === "yes" && !person.health.q31) nextErrors[`${key}.q31`] = "חובה";
        if (person.gender === "female") {
          if (!person.health.q5Pregnant) nextErrors[`${key}.q5`] = "חובה";
          if (person.health.q5Pregnant === "yes") {
            if (!person.health.q51Week) nextErrors[`${key}.q51`] = "חובה";
            if (!person.health.q52HighRisk) nextErrors[`${key}.q52`] = "חובה";
            if (person.health.q52HighRisk === "yes") {
              nextErrors[`${key}.q52`] = "היריון בסיכון — לא ניתן לקבל לביטוח";
            }
          }
        }
      }
    }

    if (current === "payment") {
      // Payment details are optional at proposal stage — validate only if filled
      if (form.payerId.trim() && !isValidIsraeliId(form.payerId)) {
        nextErrors.payerId = "ת.ז לא תקינה";
      }
      if (form.cardNumber.trim() && !isValidCardNumber(form.cardNumber)) {
        nextErrors.cardNumber = "מספר כרטיס לא תקין";
      }
      if (form.cardExp.trim() && !isValidCardExpiry(form.cardExp)) {
        nextErrors.cardExp = "תוקף לא תקין";
      }
      if (form.cardCvv.trim() && !/^\d{3,4}$/.test(form.cardCvv)) {
        nextErrors.cardCvv = "CVV לא תקין";
      }
      if (form.signatureDate.trim() && !isValidDateDdMmYyyy(form.signatureDate)) {
        nextErrors.signatureDate = "תאריך לא תקין";
      }
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
    const q21Yes = h.q21Conditions.length > 0;
    const q2FollowUpPositive = q21Yes || h.q22 === "yes";

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-[#143834]">
              הצהרת בריאות — {PERSON_LABELS_HE[key]}
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{HEALTH_INTRO}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-[#2f6b63]/30 text-[#2f6b63]"
            onClick={() => patchPerson(key, markAllHealthNo(person))}
          >
            סמן הכל לא
          </Button>
        </div>

        <HealthQuestionCard
          number={1}
          title={Q1_TITLE.replace(/^1\.\s*/, "")}
          note={Q1_NOTE}
          value={h.q1}
          onChange={(v) => patchPersonHealth(key, { q1: v })}
          error={errors[`${key}.q1`]}
        >
          {h.q1 === "yes" && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {Q1_REJECT}
            </p>
          )}
        </HealthQuestionCard>

        <HealthQuestionCard
          number={2}
          title={Q2_TITLE.replace(/^2\.\s*/, "")}
          note={Q2_EXCEPTIONS}
          value={h.q2}
          onChange={(v) => patchPersonHealth(key, { q2: v })}
          error={errors[`${key}.q2`]}
        >
          {h.q2 === "yes" && <p className="mt-2 text-[11px] font-semibold text-[#1f4b46]">{Q2_IF_YES}</p>}
          {h.q2 === "no" && <p className="mt-2 text-[11px] text-slate-500">{Q2_IF_NO}</p>}
          {h.q2 === "yes" && (
            <div className="mt-3 space-y-4 rounded-2xl border border-[#d7e8e3] bg-[#f7fbfa] p-4">
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-[#143834]">{Q21_TITLE}</p>
                <div className="grid gap-2">
                  {Q21_OPTIONS.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-start gap-2.5 rounded-xl border border-white bg-white px-3 py-2.5 text-xs leading-relaxed text-slate-700"
                    >
                      <Checkbox
                        checked={h.q21Conditions.includes(c.id)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...h.q21Conditions, c.id]
                            : h.q21Conditions.filter((x) => x !== c.id);
                          patchPersonHealth(key, { q21Conditions: next });
                        }}
                        className="mt-0.5"
                      />
                      <span>{c.labelHe}</span>
                    </label>
                  ))}
                </div>
                {!q21Yes && (
                  <p className="text-[11px] font-semibold text-amber-800">{Q21_NEGATIVE_EXT}</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-[#143834]">{Q22_TITLE}</p>
                <p className="text-[11px] leading-relaxed text-slate-600">{Q22_BODY}</p>
                <div className="flex justify-end">
                  <PillYesNo
                    value={h.q22}
                    onChange={(v) => patchPersonHealth(key, { q22: v })}
                    name="q22"
                  />
                </div>
                {errors[`${key}.q22`] && (
                  <p className="text-xs text-rose-600">{errors[`${key}.q22`]}</p>
                )}
              </div>
              {q2FollowUpPositive && (
                <p className="rounded-xl bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                  {Q2_POSITIVE_DOC}
                </p>
              )}
            </div>
          )}
        </HealthQuestionCard>

        <HealthQuestionCard
          number={3}
          title={Q3_TITLE.replace(/^3\.\s*/, "")}
          note={`${Q3_TOPICS} ${Q3_NOTE}`}
          value={h.q3}
          onChange={(v) => patchPersonHealth(key, { q3: v })}
          error={errors[`${key}.q3`]}
        >
          {h.q3 === "yes" && <p className="mt-2 text-[11px] font-semibold text-[#1f4b46]">{Q3_IF_YES}</p>}
          {h.q3 === "no" && <p className="mt-2 text-[11px] text-slate-500">{Q3_IF_NO}</p>}
          {h.q3 === "yes" && (
            <div className="mt-3 space-y-2 rounded-2xl border border-[#d7e8e3] bg-[#f7fbfa] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="min-w-0 flex-1 text-xs font-extrabold text-[#143834]">{Q31_TITLE}</p>
                <div className="shrink-0 self-end sm:ms-auto sm:self-center">
                  <PillYesNo
                    value={h.q31}
                    onChange={(v) => patchPersonHealth(key, { q31: v })}
                    name="q31"
                  />
                </div>
              </div>
              {errors[`${key}.q31`] && (
                <p className="text-xs text-rose-600">{errors[`${key}.q31`]}</p>
              )}
              {h.q31 === "no" && (
                <p className="text-[11px] leading-relaxed text-slate-600">{Q31_IF_NO}</p>
              )}
              {h.q31 === "yes" && (
                <p className="text-[11px] font-semibold text-amber-800">{Q31_IF_YES}</p>
              )}
            </div>
          )}
        </HealthQuestionCard>

        <HealthQuestionCard
          number={4}
          title={Q4_TITLE.replace(/^4\.\s*/, "")}
          value={h.q4}
          onChange={(v) => patchPersonHealth(key, { q4: v })}
          error={errors[`${key}.q4`]}
        >
          {h.q4 === "yes" && (
            <div className="mt-3 space-y-2">
              <Field label={Q4_DETAILS_LABEL} hint={Q4_DETAILS_HINT}>
                <Textarea
                  className="min-h-[80px] rounded-2xl border-slate-200 bg-slate-50/80 text-right"
                  value={h.q4Details}
                  onChange={(e) => patchPersonHealth(key, { q4Details: e.target.value })}
                  placeholder={Q4_DETAILS_HINT}
                />
              </Field>
              <p className="text-[11px] leading-relaxed text-slate-600">{Q4_IF_YES}</p>
            </div>
          )}
        </HealthQuestionCard>

        {person.gender === "female" && (
          <div className="space-y-3 rounded-[22px] border border-rose-100 bg-rose-50/20 p-4">
            <p className="text-xs font-extrabold text-[#143834]">{PREGNANCY_SECTION_TITLE}</p>
            <HealthQuestionCard
              number={5}
              title={Q5_TITLE.replace(/^5\.\s*/, "")}
              value={h.q5Pregnant}
              onChange={(v) => patchPersonHealth(key, { q5Pregnant: v })}
              error={errors[`${key}.q5`]}
            />
            {h.q5Pregnant === "yes" && (
              <>
                <Field label={Q51_TITLE} required error={errors[`${key}.q51`]}>
                  <Input
                    className={inputClass}
                    inputMode="numeric"
                    value={h.q51Week}
                    onChange={(e) =>
                      patchPersonHealth(key, {
                        q51Week: e.target.value.replace(/\D/g, "").slice(0, 2),
                      })
                    }
                  />
                </Field>
                <HealthQuestionCard
                  number="5.2"
                  title={Q52_TITLE.replace(/^5\.2\s*/, "")}
                  value={h.q52HighRisk}
                  onChange={(v) => patchPersonHealth(key, { q52HighRisk: v })}
                  error={errors[`${key}.q52`]}
                >
                  {h.q52HighRisk === "yes" && (
                    <p className="mt-3 rounded-xl bg-rose-100/80 px-3 py-2 text-xs font-semibold text-rose-700">
                      {Q52_REJECT}
                    </p>
                  )}
                  {h.q52HighRisk === "no" && (
                    <p className="mt-3 text-[11px] font-semibold text-amber-800">{PREGNANCY_EXT_NOTE}</p>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{PREGNANCY_AGE_NOTE}</p>
                </HealthQuestionCard>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const PlanCheck = ({
    label,
    description,
    footnote,
    checked,
    onChange,
    icon,
    variant = "optional",
    children,
  }: {
    label: string;
    description?: string;
    footnote?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    icon?: ReactNode;
    variant?: "included" | "optional" | "optout";
    children?: ReactNode;
  }) => (
    <CoverageCard
      title={label}
      description={description}
      footnote={footnote}
      checked={checked}
      onChange={onChange}
      icon={icon}
      variant={variant}
    >
      {children}
    </CoverageCard>
  );

  const renderPlanFor = (key: PersonKey) => {
    const plan = form[key].plan;
    return (
      <div className="space-y-5">
        <div className="text-center sm:text-right">
          <span className="inline-flex rounded-full bg-[#143834] px-3 py-1 text-[11px] font-bold text-white">
            {PERSON_LABELS_HE[key]}
          </span>
          <h3 className="mt-2 text-lg font-extrabold text-[#143834]">
            ה · תכנית הביטוח — פירסט קלאס
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            סמנו את הכיסויים הרלוונטיים להצעה. זהו טופס לבדיקה בהראל — ללא תמחור.
          </p>
        </div>

        <p className="text-base font-extrabold text-[#143834]">כיסויים נפוצים</p>
        <div className="space-y-3">
          <PlanCheck
            label="חיפוש, איתור וחילוץ"
            description="כיסוי לחיפוש, איתור וחילוץ בחו״ל — כלול ברובד הבסיס"
            checked={!plan.optOutSearchRescue}
            onChange={(v) => patchPersonPlan(key, { optOutSearchRescue: !v })}
            icon={COVERAGE_ICONS.rescue}
            variant="included"
            footnote="ניתן להסיר כיסוי זה"
          />
          <PlanCheck
            label="חבות כלפי צד ג׳"
            description="כיסוי לחבות כלפי צד שלישי — כלול ברובד הבסיס"
            checked={!plan.optOutThirdParty}
            onChange={(v) => patchPersonPlan(key, { optOutThirdParty: !v })}
            icon={COVERAGE_ICONS.thirdParty}
            variant="included"
            footnote="ניתן להסיר כיסוי זה"
          />
          <PlanCheck
            label="כבודה — אובדן או גניבה"
            description="כיסוי בסיסי למטען אישי נלווה לכל תקופת הביטוח"
            checked={plan.baggage}
            onChange={(v) => {
              if (v) {
                patchPersonPlan(key, { baggage: true });
              } else {
                // Removing basic also clears the extended valuables tier
                patchPersonPlan(key, { baggage: false, baggageValuables: false, valuableItems: [] });
              }
            }}
            icon={COVERAGE_ICONS.baggage}
          />
          <PlanCheck
            label="כבודה מורחבת — פריט יקר ערך"
            description="כיסוי לפריט יקר ערך עד $2,000. דורש בחירה של כבודה בסיסית."
            checked={plan.baggageValuables}
            onChange={(v) => {
              if (v) {
                patchPersonPlan(key, { baggage: true, baggageValuables: true });
              } else {
                patchPersonPlan(key, { baggageValuables: false, valuableItems: [] });
              }
            }}
            icon={COVERAGE_ICONS.camera}
            footnote={plan.baggageValuables ? "סמנו איזה פריט לכלול" : undefined}
          >
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-600">בחרו פריט יקר ערך עד $2,000</p>
              <div className="grid gap-2">
                {VALUABLE_OPTIONS.map((v) => {
                  const on = plan.valuableItems.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        const next = on
                          ? plan.valuableItems.filter((x) => x !== v.id)
                          : [...plan.valuableItems, v.id];
                        patchPersonPlan(key, { valuableItems: next });
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-right text-xs transition ${
                        on
                          ? "border-[#2f6b63]/35 bg-white text-[#143834]"
                          : "border-transparent bg-white/70 text-slate-700 hover:border-[#2f6b63]/20"
                      }`}
                    >
                      <span className="min-w-0 flex-1 font-semibold">{v.labelHe}</span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          on
                            ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </PlanCheck>
          <PlanCheck
            label="ביטול / קיצור נסיעה"
            description="החזר לביטול או קיצור נסיעה בעקבות אירוע רפואי או צו"
            checked={plan.cancellation}
            onChange={(v) => patchPersonPlan(key, { cancellation: v })}
            icon={COVERAGE_ICONS.cancel}
          />
          <PlanCheck
            label="ביטול וקיצור נסיעה מורחב"
            description="החזרים מקסימליים גבוהים יותר מהכיסוי הבסיסי"
            checked={plan.cancellationExpanded}
            onChange={(v) => patchPersonPlan(key, { cancellationExpanded: v })}
            icon={COVERAGE_ICONS.cancel}
          />
        </div>

        <p className="pt-1 text-base font-extrabold text-[#143834]">כיסויים בשביל הבריאות שלך</p>
        <div className="space-y-3">
          <PlanCheck
            label="החמרה של מצב רפואי קודם"
            description="כיסוי להחמרה למצב רפואי קודם, בהתאם לתנאי הפוליסה"
            checked={plan.priorCondition}
            onChange={(v) => patchPersonPlan(key, { priorCondition: v })}
            icon={COVERAGE_ICONS.health}
          />
          <PlanCheck
            label="הרחבה להיריון"
            description="למבוטחת שגילה עד 42, היריון עד שבוע 32 (כולל)"
            checked={plan.pregnancy}
            onChange={(v) => patchPersonPlan(key, { pregnancy: v })}
            icon={COVERAGE_ICONS.pregnancy}
          />
        </div>

        <p className="pt-1 text-base font-extrabold text-[#143834]">ספורט והרחבות נוספות</p>
        <div className="space-y-3">
          <PlanCheck
            label="ספורט אתגרי חובבני"
            description="לא ניתן לרכישה יחד עם כיסוי להיריון"
            checked={plan.adventureSports}
            onChange={(v) => patchPersonPlan(key, { adventureSports: v })}
            icon={COVERAGE_ICONS.adventure}
          >
            <div className="grid grid-cols-2 gap-2">
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
          </PlanCheck>
          <PlanCheck
            label="ספורט חורף"
            description="לא ניתן לרכישה יחד עם כיסוי להיריון"
            checked={plan.winterSports}
            onChange={(v) => patchPersonPlan(key, { winterSports: v })}
            icon={COVERAGE_ICONS.winter}
          >
            <div className="grid grid-cols-2 gap-2">
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
          </PlanCheck>
          <PlanCheck
            label="ספורט מקצועני"
            checked={plan.proSports}
            onChange={(v) => patchPersonPlan(key, { proSports: v })}
            icon={COVERAGE_ICONS.pro}
          >
            <div className="grid grid-cols-2 gap-2">
              <Field label="מ-">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={plan.proFrom}
                  onChange={(e) => patchPersonPlan(key, { proFrom: formatDateInput(e.target.value) })}
                />
              </Field>
              <Field label="עד-">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={plan.proTo}
                  onChange={(e) => patchPersonPlan(key, { proTo: formatDateInput(e.target.value) })}
                />
              </Field>
            </div>
          </PlanCheck>
          <PlanCheck
            label="תאונות אישיות"
            description="פיצוי בגין מוות/נכות/כוויות/שברים/אשפוז כתוצאה מתאונה בחו״ל"
            checked={plan.personalAccident}
            onChange={(v) => patchPersonPlan(key, { personalAccident: v })}
            icon={COVERAGE_ICONS.accident}
          />
          <PlanCheck
            label="תאונות אישיות בספורט אתגרי"
            checked={plan.personalAccidentAdventure}
            onChange={(v) => patchPersonPlan(key, { personalAccidentAdventure: v })}
            icon={COVERAGE_ICONS.accident}
          />
          <PlanCheck
            label="מחשב נישא / טאבלט עד $2,000"
            checked={plan.laptop}
            onChange={(v) => patchPersonPlan(key, { laptop: v })}
            icon={COVERAGE_ICONS.laptop}
          >
            <Field label="דגם">
              <Input
                className={inputClass}
                value={plan.laptopModel}
                onChange={(e) => patchPersonPlan(key, { laptopModel: e.target.value })}
              />
            </Field>
          </PlanCheck>
          <PlanCheck
            label="טלפון נייד עד $750"
            checked={plan.phone}
            onChange={(v) => patchPersonPlan(key, { phone: v })}
            icon={COVERAGE_ICONS.phone}
          >
            <Field label="דגם">
              <Input
                className={inputClass}
                value={plan.phoneModel}
                onChange={(e) => patchPersonPlan(key, { phoneModel: e.target.value })}
              />
            </Field>
          </PlanCheck>
          <PlanCheck
            label="אופניים דו־גלגליים"
            checked={plan.bicycle}
            onChange={(v) => patchPersonPlan(key, { bicycle: v })}
            icon={COVERAGE_ICONS.bike}
          >
            <div className="space-y-2">
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
          </PlanCheck>
          <PlanCheck
            label="ביטול השתתפות עצמית לרכב שכור"
            description="לנהגים בגילאי 24–75"
            checked={plan.rentalCar}
            onChange={(v) => patchPersonPlan(key, { rentalCar: v })}
            icon={COVERAGE_ICONS.car}
          >
            <div className="space-y-2">
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
          </PlanCheck>
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
            radial-gradient(900px 360px at 50% -5%, rgba(47,107,99,.10), transparent 55%),
            linear-gradient(180deg, #eef6fb 0%, #f3faf8 42%, #eef5f2 100%);
        }
        /* Override global [dir=rtl] h1/h2 { text-align: right } for centered hero */
        .proposal-page .tp-center,
        .proposal-page .tp-center h1,
        .proposal-page .tp-center h2,
        .proposal-page .tp-center p {
          text-align: center !important;
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
        <header className="tp-rise tp-center mb-7 flex w-full flex-col items-center justify-center">
          <img src={logo} alt="TravelSure" className="mx-auto h-[88px] w-auto drop-shadow-sm sm:h-28" />
          <h1 className="mt-4 w-full text-center text-3xl font-extrabold text-[#143834] sm:text-4xl">
            הצעה לביטוח נסיעות לחו״ל
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-600 sm:text-base">
            תהליך דיגיטלי קצר · ממלאים פעם אחת ומקבלים את טופס הראל הרשמי מוכן
          </p>
          <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#1f4b46]">
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
          <div className="tp-rise tp-rise-d1 mb-6">
            <ProposalIconStepper steps={progressSteps} currentIndex={progressIndex} />
          </div>
        )}

        <div className="tp-rise tp-rise-d2 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_30px_80px_-40px_rgba(20,56,52,0.55)] backdrop-blur-xl">
          <div className="h-1.5 bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#4ade80]" />
          <div className="p-5 sm:p-7">
            {step === "intro" && (
              <div className="tp-center mx-auto max-w-md space-y-5 text-center">
                <h2 className="text-center text-xl font-bold text-[#143834]">איך זה עובד?</h2>
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
              <div className="space-y-6">
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

                <DestinationPicker
                  selected={form.destinations}
                  onToggle={toggleDest}
                  error={errors.destinations}
                />

                <div className="space-y-3">
                  <div className="tp-center text-center">
                    <h3 className="text-center text-lg font-extrabold text-[#143834]">מתי נוסעים?</h3>
                    <p className="mt-1 text-center text-xs text-slate-500">בחרו תאריכי יציאה וחזרה בלוח השנה</p>
                  </div>
                  <TripDateRangePicker
                    from={form.tripFrom}
                    to={form.tripTo}
                    onChange={(from, to) => {
                      setField("tripFrom", from);
                      setField("tripTo", to);
                    }}
                    fromError={errors.tripFrom}
                    toError={errors.tripTo}
                  />
                </div>

                {form.destinations.includes("usa") && (
                  <div className="grid gap-3 rounded-2xl border border-[#d7e8e3] bg-[#f7fbfa] p-4 sm:grid-cols-2">
                    <p className="sm:col-span-2 text-xs font-bold text-[#143834]">תקופת שהייה בארה״ב (אם רלוונטי)</p>
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
                <div className="rounded-[24px] border border-[#d7e8e3] bg-gradient-to-l from-[#e8f4f1]/80 to-white p-4 sm:p-5">
                  <p className="text-xs font-bold text-[#2f6b63]">מה מכוסה בביטוח?</p>
                  <h2 className="mt-1 text-lg font-extrabold leading-snug text-[#143834] sm:text-xl">
                    בניגוד לחברת תעופה, אנחנו חברת ביטוח. אז אנחנו חייבים לשאול גם שאלות כאלה בנסיעה לחו״ל
                  </h2>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{HEALTH_DISCLAIMER}</p>
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
                {people.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    {people.map(({ key }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActivePlanPerson(key)}
                        className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                          activePlanPerson === key
                            ? "bg-[#143834] text-white shadow-sm"
                            : "border border-[#2f6b63]/20 bg-white text-[#2f6b63] hover:bg-[#e8f4f1]"
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
                    <p className="mt-1 text-xs text-slate-500">
                      אופציונלי בשלב זה — אפשר להמשיך גם בלי פרטי כרטיס
                    </p>
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
                  <Field label="שם בעל הכרטיס" error={errors.payerName}>
                    <Input
                      className={inputClass}
                      value={form.payerName}
                      onChange={(e) => setField("payerName", e.target.value)}
                    />
                  </Field>
                  <Field label="מספר ת.ז" error={errors.payerId}>
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
                  <Field label="מס׳ כרטיס" error={errors.cardNumber}>
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
                  <Field label="בתוקף עד (MM/YY)" error={errors.cardExp}>
                    <Input
                      className={inputClass}
                      dir="ltr"
                      placeholder="MM/YY"
                      value={form.cardExp}
                      onChange={(e) => setField("cardExp", formatCardExpInput(e.target.value))}
                    />
                  </Field>
                  <Field label="CVV" error={errors.cardCvv}>
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
                  <Field label="תאריך חתימה" error={errors.signatureDate}>
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
                  <span>אני מאשר/ת את נכונות פרטי התשלום ואת החיוב בכרטיס האשראי</span>
                </label>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={form.declarationsAccepted}
                    onCheckedChange={(c) => setField("declarationsAccepted", !!c)}
                    className="mt-0.5"
                  />
                  <span>קראתי ואני מאשר/ת את הצהרות המועמדים לביטוח ומסירת הפרטים לאופיר ושות׳</span>
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
