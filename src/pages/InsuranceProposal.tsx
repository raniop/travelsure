import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AgencyHeader from "@/components/AgencyHeader";
import AgencyFooter from "@/components/AgencyFooter";
import {
  createInitialTravelProposalForm,
  displayName,
  emptyPerson,
  formatDateInput,
  includedPersons,
  isValidDateDdMmYyyy,
  isValidEmail,
  isValidIsraeliId,
  markAllHealthNo,
  requiresPriorConditionCoverage,
  requiresPregnancyCoverage,
} from "@/lib/travelProposal/formDefaults";
import {
  DESTINATION_OPTIONS,
  PERSON_KEYS,
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
import { HouseholdHealth } from "@/components/travelProposal/HouseholdHealth";
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
  UsaStayDateFields,
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
    <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-[#46557A]">
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[12px] font-medium text-[#8A94AD]">{hint}</p>}
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
  "h-auto min-h-[52px] rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] text-right text-[17px] font-semibold text-[#000144] shadow-none md:text-[17px] placeholder:font-normal placeholder:text-[#8A94AD] focus-visible:border-[#00A247] focus-visible:ring-0 focus-visible:ring-offset-0";

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
  const [personLookupKey, setPersonLookupKey] = useState<PersonKey | null>(null);
  const [proposalNumber, setProposalNumber] = useState("");
  const personLookupDoneRef = useRef<Partial<Record<PersonKey, string>>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);

  // Lock required health-driven coverages when entering the plan step
  useEffect(() => {
    if (step !== "plan") return;
    setForm((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of PERSON_KEYS) {
        if (!next[key].included) continue;
        const person = next[key];
        const health = person.health;
        const plan = person.plan;
        const needPrior = requiresPriorConditionCoverage(health);
        const needPreg = requiresPregnancyCoverage(health, person.gender);
        const clearPreg = person.gender !== "female" && plan.pregnancy;
        if (
          (needPrior && !plan.priorCondition) ||
          (needPreg && !plan.pregnancy) ||
          clearPreg
        ) {
          changed = true;
          next[key] = {
            ...next[key],
            plan: {
              ...plan,
              priorCondition: needPrior ? true : plan.priorCondition,
              pregnancy: person.gender === "female" ? (needPreg ? true : plan.pregnancy) : false,
            },
          };
        }
      }
      return changed ? next : prev;
    });
  }, [step]);

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

  useEffect(() => {
    if (step !== "health" || people.length < 2) return;
    setForm((prev) => {
      const g = prev.healthGroup || { q1: "", q2: "", q3: "", q4: "", q5: "" };
      if (g.q1 || g.q2 || g.q3 || g.q4 || g.q5) return prev;
      const p = prev.primary.health;
      if (!p.q1 && !p.q2 && !p.q3 && !p.q4) return prev;
      return {
        ...prev,
        healthGroup: {
          q1: p.q1 || "",
          q2: p.q2 || "",
          q3: p.q3 || "",
          q4: p.q4 || "",
          q5: p.q5Pregnant || "",
        },
      };
    });
  }, [step, people.length]);

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

  const applyCrmCustomerToPerson = (
    key: PersonKey,
    normalized: string,
    c: {
      id: string;
      firstNameHe: string;
      lastNameHe: string;
      firstNameEn: string;
      lastNameEn: string;
      gender: "" | "male" | "female";
      birthDate: string;
    },
  ) => {
    const birth = formatClaimDateDisplay(c.birthDate);
    const birthDate =
      birth && isValidDateDdMmYyyy(birth)
        ? birth
        : formatDateInput(birth.replace(/\D/g, "")) || "";

    setForm((prev) => {
      const person = prev[key];
      const gender = c.gender || person.gender;
      return {
        ...prev,
        [key]: {
          ...person,
          idNumber: c.id || normalized,
          firstNameHe: c.firstNameHe || person.firstNameHe,
          lastNameHe: c.lastNameHe || person.lastNameHe,
          firstNameEn: c.firstNameEn || person.firstNameEn,
          lastNameEn: c.lastNameEn || person.lastNameEn,
          gender,
          birthDate: birthDate || person.birthDate,
          health:
            gender === "male"
              ? {
                  ...person.health,
                  q5Pregnant: "",
                  q51Week: "",
                  q52HighRisk: "",
                }
              : person.health,
          plan: gender === "male" ? { ...person.plan, pregnancy: false } : person.plan,
        },
      };
    });
  };

  const lookupPersonById = async (key: PersonKey, rawId: string) => {
    const digits = rawId.replace(/\D/g, "");
    if (digits.length !== 9 || !isValidIsraeliId(digits)) return;
    const normalized = normalizeIsraeliId(digits);
    if (personLookupDoneRef.current[key] === normalized) return;

    setPersonLookupKey(key);
    try {
      const result = await lookupClaimCustomerById(normalized);
      personLookupDoneRef.current[key] = normalized;
      if (!result.ok) return;
      applyCrmCustomerToPerson(key, normalized, result.customer);
      toast({
        title: "מצאנו את המבוטח במערכת",
        description: `${PERSON_LABELS_HE[key]}: מילאנו אוטומטית את הפרטים הידועים`,
      });
    } finally {
      setPersonLookupKey((prev) => (prev === key ? null : prev));
    }
  };

  const onPersonIdChange = (key: PersonKey, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (personLookupDoneRef.current[key] && personLookupDoneRef.current[key] !== normalizeIsraeliId(digits)) {
      delete personLookupDoneRef.current[key];
    }
    patchPerson(key, { idNumber: digits });
    if (digits.length === 9 && isValidIsraeliId(digits)) {
      void lookupPersonById(key, digits);
    }
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
      // USA stay period only when USA + at least one other destination
      const needsUsaStay = destinations.includes("usa") && destinations.length > 1;
      return {
        ...prev,
        destinations,
        countriesDetail,
        usaFrom: needsUsaStay ? prev.usaFrom : "",
        usaTo: needsUsaStay ? prev.usaTo : "",
      };
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
      const needsUsaStay = form.destinations.includes("usa") && form.destinations.length > 1;
      if (needsUsaStay) {
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
      if (people.length > 1) {
        const g = form.healthGroup;
        if (!g.q1) nextErrors.healthq1 = "חובה";
        if (g.q1 === "yes" && !people.some(({ person }) => person.health.q1 === "yes")) {
          nextErrors.q1who = "יש לבחור על מי חלה התשובה";
        }
        if (!g.q2) nextErrors.healthq2 = "חובה";
        if (g.q2 === "yes" && !people.some(({ person }) => person.health.q2 === "yes")) {
          nextErrors.q2who = "יש לבחור על מי חלה התשובה";
        }
        if (!g.q3) nextErrors.healthq3 = "חובה";
        if (g.q3 === "yes" && !people.some(({ person }) => person.health.q3 === "yes")) {
          nextErrors.q3who = "יש לבחור על מי חלה התשובה";
        }
        if (!g.q4) nextErrors.healthq4 = "חובה";
        if (g.q4 === "yes" && !people.some(({ person }) => person.health.q4 === "yes")) {
          nextErrors.q4who = "יש לבחור על מי חלה התשובה";
        }
        const females = people.filter(({ person }) => person.gender === "female");
        if (females.length > 0) {
          if (!g.q5) nextErrors.healthq5 = "חובה";
          if (g.q5 === "yes" && !females.some(({ person }) => person.health.q5Pregnant === "yes")) {
            nextErrors.q5who = "יש לבחור על מי חלה התשובה";
          }
        }
      }
      for (const { key, person } of people) {
        if (people.length === 1) {
          if (!person.health.q1) nextErrors[`${key}.q1`] = "חובה";
          if (!person.health.q2) nextErrors[`${key}.q2`] = "חובה";
          if (!person.health.q3) nextErrors[`${key}.q3`] = "חובה";
          if (!person.health.q4) nextErrors[`${key}.q4`] = "חובה";
        }
        if (person.health.q1 === "yes") nextErrors[`${key}.q1`] = "תשובה חיובית — לא ניתן לקבל לביטוח";
        if (person.health.q2 === "yes" && !person.health.q22) nextErrors[`${key}.q22`] = "חובה";
        if (person.health.q3 === "yes" && !person.health.q31) nextErrors[`${key}.q31`] = "חובה";
        if (person.gender === "female") {
          if (people.length === 1 && !person.health.q5Pregnant) nextErrors[`${key}.q5`] = "חובה";
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

    if (current === "review") {
      if (!form.declarationsAccepted) {
        nextErrors.declarationsAccepted = "חובה לאשר את ההצהרות";
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
    const order: Step[] = ["identity", "trip", "insureds", "health", "plan", "review"];
    const i = order.indexOf(step);
    if (i >= 0 && i < order.length - 1) setStep(order[i + 1]);
  };

  const goBack = () => {
    const order: Step[] = ["intro", "identity", "trip", "insureds", "health", "plan", "review"];
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

  const handleSubmit = async () => {
    if (!validateStep("review")) {
      toast({ title: "יש לאשר את ההצהרות לפני השליחה", variant: "destructive" });
      return;
    }
    setIsSending(true);
    setStep("sending");
    try {
      const today = new Date();
      const signatureDate =
        form.signatureDate.trim() ||
        `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(
          today.getFullYear(),
        ).slice(-2)}`;
      const result = await submitTravelProposal({ ...form, signatureDate }, files);
      setProposalNumber(result.proposalNumber || "");
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
        className="rounded-[24px] border-2 border-[#E3E7EE] bg-white p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#000144] text-white">
              <UserRound className="h-4 w-4" />
            </span>
            <h3 className="text-[18px] font-black text-[#000144]">{PERSON_LABELS_HE[key]}</h3>
          </div>
          {key !== "primary" && (
            <button
              type="button"
              onClick={() => removeDependent(key)}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-[12px] px-2.5 py-1 text-[14px] font-bold text-rose-600 hover:bg-rose-50"
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
                  onClick={() => {
                    if (o.v === "male") {
                      patchPerson(key, {
                        gender: o.v,
                        health: {
                          ...form[key].health,
                          q5Pregnant: "",
                          q51Week: "",
                          q52HighRisk: "",
                        },
                        plan: { ...form[key].plan, pregnancy: false },
                      });
                    } else {
                      patchPerson(key, { gender: o.v });
                    }
                  }}
                  className={`min-h-[52px] flex-1 rounded-[14px] border-2 text-[16px] font-bold ${
                    person.gender === o.v
                      ? "border-[#000144] bg-[#000144] text-white"
                      : "border-[#D5DAE3] bg-white text-[#33405F] hover:border-[#000144]/40"
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </Field>
          <Field label="מספר ת.ז" required error={errors[`${key}.idNumber`]}>
            <div className="relative">
              <Input
                className={inputClass}
                inputMode="numeric"
                maxLength={9}
                value={person.idNumber}
                onChange={(e) => onPersonIdChange(key, e.target.value)}
              />
              {personLookupKey === key && (
                <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#00A247]" />
              )}
            </div>
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
            <h3 className="text-[20px] font-black text-[#000144]">
              הצהרת בריאות — {PERSON_LABELS_HE[key]}
            </h3>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#46557A]">{HEALTH_INTRO}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-full border-2 border-[#000144] bg-white px-4 text-[14px] font-bold text-[#000144] hover:bg-[#000144] hover:text-white"
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
            <p className="mt-3 rounded-[14px] bg-rose-50 px-3 py-2 text-[14px] font-bold text-rose-700">
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
          {h.q2 === "yes" && <p className="mt-2 text-[13px] font-bold text-[#000144]">{Q2_IF_YES}</p>}
          {h.q2 === "no" && <p className="mt-2 text-[13px] font-medium text-[#46557A]">{Q2_IF_NO}</p>}
          {h.q2 === "yes" && (
            <div className="mt-3 space-y-4 rounded-[20px] border-2 border-[#E3E7EE] bg-[#F3F5F8] p-4">
              <div className="space-y-2">
                <p className="text-[14px] font-extrabold text-[#000144]">{Q21_TITLE}</p>
                <div className="grid gap-2">
                  {Q21_OPTIONS.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-start gap-2.5 rounded-[14px] border-2 border-[#E3E7EE] bg-white px-3 py-2.5 text-[14px] font-medium leading-relaxed text-[#33405F]"
                    >
                      <Checkbox
                        checked={h.q21Conditions.includes(c.id)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...h.q21Conditions, c.id]
                            : h.q21Conditions.filter((x) => x !== c.id);
                          patchPersonHealth(key, { q21Conditions: next });
                        }}
                        className="mt-0.5 h-5 w-5 rounded-[6px] border-2 border-[#000144] data-[state=checked]:bg-[#000144] data-[state=checked]:text-white"
                      />
                      <span>{c.labelHe}</span>
                    </label>
                  ))}
                </div>
                {!q21Yes && (
                  <p className="text-[13px] font-bold text-amber-800">{Q21_NEGATIVE_EXT}</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-[14px] font-extrabold text-[#000144]">{Q22_TITLE}</p>
                <p className="text-[13px] font-medium leading-relaxed text-[#33405F]">{Q22_BODY}</p>
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
                <p className="rounded-[14px] bg-white px-3 py-2 text-[13px] font-medium leading-relaxed text-[#33405F]">
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
          {h.q3 === "yes" && <p className="mt-2 text-[13px] font-bold text-[#000144]">{Q3_IF_YES}</p>}
          {h.q3 === "no" && <p className="mt-2 text-[13px] font-medium text-[#46557A]">{Q3_IF_NO}</p>}
          {h.q3 === "yes" && (
            <div className="mt-3 space-y-2 rounded-[20px] border-2 border-[#E3E7EE] bg-[#F3F5F8] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="min-w-0 flex-1 text-[14px] font-extrabold text-[#000144]">{Q31_TITLE}</p>
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
                <p className="text-[13px] font-medium leading-relaxed text-[#33405F]">{Q31_IF_NO}</p>
              )}
              {h.q31 === "yes" && (
                <p className="text-[13px] font-bold text-amber-800">{Q31_IF_YES}</p>
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
                  className="min-h-[80px] rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] text-right text-[16px] font-medium text-[#000144] placeholder:text-[#8A94AD] focus-visible:border-[#00A247] focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={h.q4Details}
                  onChange={(e) => patchPersonHealth(key, { q4Details: e.target.value })}
                  placeholder={Q4_DETAILS_HINT}
                />
              </Field>
              <p className="text-[13px] font-medium leading-relaxed text-[#33405F]">{Q4_IF_YES}</p>
            </div>
          )}
        </HealthQuestionCard>

        {person.gender === "female" && (
          <div className="space-y-3 rounded-[24px] border-2 border-[#E3E7EE] bg-[#F3F5F8] p-4">
            <p className="text-[14px] font-extrabold text-[#000144]">{PREGNANCY_SECTION_TITLE}</p>
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
                    <p className="mt-3 rounded-[14px] bg-rose-100/80 px-3 py-2 text-[14px] font-bold text-rose-700">
                      {Q52_REJECT}
                    </p>
                  )}
                  {h.q52HighRisk === "no" && (
                    <p className="mt-3 text-[13px] font-bold text-amber-800">{PREGNANCY_EXT_NOTE}</p>
                  )}
                  <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#46557A]">{PREGNANCY_AGE_NOTE}</p>
                </HealthQuestionCard>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const applyPopularPackage = (targetKey?: PersonKey) => {
    const patch: Partial<PersonPlan> = {
      optOutSearchRescue: false,
      optOutThirdParty: false,
      baggage: true,
      cancellation: true,
      personalAccident: true,
    };
    const keys = targetKey ? [targetKey] : people.map((p) => p.key);
    setForm((prev) => {
      const next = { ...prev };
      for (const k of keys) {
        next[k] = { ...next[k], plan: { ...next[k].plan, ...patch } };
      }
      return next;
    });
    toast({
      title: keys.length > 1 ? "החבילה עודכנה לכל הנוסעים" : "החבילה עודכנה",
      description: "ביטול/קיצור · חילוץ · כבודה · צד ג׳ · תאונות אישיות",
    });
  };

  const PlanCheck = ({
    label,
    description,
    infoDetail,
    footnote,
    checked,
    onChange,
    icon,
    variant = "optional",
    locked,
    children,
  }: {
    label: string;
    description?: string;
    infoDetail?: string;
    footnote?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    icon?: ReactNode;
    variant?: "included" | "optional" | "optout";
    locked?: boolean;
    children?: ReactNode;
  }) => (
    <CoverageCard
      title={label}
      description={description}
      infoDetail={infoDetail}
      footnote={footnote}
      checked={checked}
      onChange={onChange}
      icon={icon}
      variant={variant}
      locked={locked}
    >
      {children}
    </CoverageCard>
  );

  const renderPlanFor = (key: PersonKey) => {
    const plan = form[key].plan;
    const health = form[key].health;
    const isFemale = form[key].gender === "female";
    const priorLocked = requiresPriorConditionCoverage(health);
    const pregnancyLocked = requiresPregnancyCoverage(health, form[key].gender);
    return (
      <div className="space-y-5">
        <div className="tp-center space-y-3 text-center" style={{ textAlign: "center" }}>
          {people.length > 1 && (
            <span className="inline-flex rounded-full bg-[#000144] px-4 py-1.5 text-[13px] font-bold text-white">
              {PERSON_LABELS_HE[key]}
            </span>
          )}
          <h3 className="text-[28px] font-black text-[#000144]" style={{ textAlign: "center" }}>
            פירוט הכיסויים
          </h3>
          <div className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-full bg-[#E6F6EC] px-4 py-2 text-[15px] font-bold text-[#000144]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00A247] text-[11px] font-bold text-[#000144]">
              i
            </span>
            הביטוח כבר כולל את הכיסוי הבסיסי
          </div>
          <p className="mx-auto max-w-xl text-[16px] font-medium leading-relaxed text-[#33405F]" style={{ textAlign: "center" }}>
            באפשרותך לסמן את חבילת הכיסויים הנפוצים שלנו או להרכיב חבילת כיסויים, לפי בחירתך
          </p>
          <p className="text-[13px] font-medium text-[#46557A]" style={{ textAlign: "center" }}>
            הצעה לחיתום בהראל — ללא תמחור עלות כיסוי
          </p>
        </div>

        {/* Popular package — Harel style */}
        <div className="overflow-hidden rounded-[24px] border-2 border-[#E3E7EE] bg-white">
          <div className="bg-[#F3F5F8] px-4 py-3 text-center">
            <p className="text-[16px] font-extrabold text-[#000144]" style={{ textAlign: "center" }}>
              מתלבטים מאיפה להתחיל? תתחילו עם הבחירה הנפוצה
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-5">
            {[
              { icon: COVERAGE_ICONS.cancel, label: "ביטול/קיצור נסיעה" },
              { icon: COVERAGE_ICONS.rescue, label: "חיפוש, איתור וחילוץ" },
              { icon: COVERAGE_ICONS.baggage, label: "כבודה" },
              { icon: COVERAGE_ICONS.thirdParty, label: "חבות כלפי צד ג׳" },
              { icon: COVERAGE_ICONS.accident, label: "תאונות אישיות", sub: "(ניתן לרכוש עד גיל 75)" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5 text-center text-[#000144]">
                <div className="text-[#00A247]">{item.icon}</div>
                <p className="text-[12px] font-bold leading-tight text-[#000144]">{item.label}</p>
                {item.sub && <p className="text-[10px] font-medium text-[#46557A]">{item.sub}</p>}
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Button
              type="button"
              className="h-14 w-full rounded-[18px] bg-[#00A247] text-[19px] font-extrabold text-[#000144] hover:bg-[#008C3D]"
              onClick={() => applyPopularPackage(people.length > 1 ? undefined : key)}
            >
              {people.length > 1 ? "עדכון החבילה לכלל הנוסעים" : "עדכון החבילה"}
            </Button>
          </div>
        </div>

        <p className="text-[20px] font-black text-[#000144]">כיסויים נפוצים</p>
        <div className="space-y-3">
          <PlanCheck
            label="חבות כלפי צד ג׳"
            description="כיסוי של עד $150,000 לנזק שגרמת לגוף או לרכוש של צד ג׳ בחו״ל."
            checked={!plan.optOutThirdParty}
            onChange={(v) => patchPersonPlan(key, { optOutThirdParty: !v })}
            icon={COVERAGE_ICONS.thirdParty}
            variant="included"
            footnote="ניתן להסיר כיסוי זה"
          />
          <PlanCheck
            label="חיפוש איתור וחילוץ"
            description="במקרה של ניתוק קשר איתך או במקרה של צורך בחילוץ."
            checked={!plan.optOutSearchRescue}
            onChange={(v) => patchPersonPlan(key, { optOutSearchRescue: !v })}
            icon={COVERAGE_ICONS.rescue}
            variant="included"
            footnote="ניתן להסיר כיסוי זה"
          />
          <PlanCheck
            label="כבודה (מטען אישי כמו מזוודה)"
            description="כיסוי של עד $2,250 במקרה של אובדן / גניבה, כולל החזר בגין איחור בהגעת המזוודה."
            checked={plan.baggage}
            onChange={(v) => {
              if (v) {
                patchPersonPlan(key, { baggage: true });
              } else {
                patchPersonPlan(key, { baggage: false, baggageValuables: false, valuableItems: [] });
              }
            }}
            icon={COVERAGE_ICONS.baggage}
          />
          <PlanCheck
            label="כבודה מורחבת — פריט יקר ערך"
            description="כיסוי לפריט יקר ערך עד $2,000 (מצלמה, רחפן, כלי נגינה ועוד). דורש בחירה של כבודה בסיסית."
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
              <p className="text-[13px] font-bold text-[#46557A]">בחרו פריט יקר ערך עד $2,000</p>
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
                      className={`flex min-h-[48px] w-full items-center gap-3 rounded-[14px] border-2 px-3 py-2.5 text-right text-[14px] transition ${
                        on
                          ? "border-[#000144] bg-white text-[#000144]"
                          : "border-[#E3E7EE] bg-white text-[#33405F] hover:border-[#000144]/40"
                      }`}
                    >
                      <span className="min-w-0 flex-1 font-semibold">{v.labelHe}</span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          on
                            ? "border-[#00A247] bg-[#00A247] text-[#000144]"
                            : "border-[#D5DAE3] bg-white text-transparent"
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
            description={
              "החזר לביטול/קיצור הנסיעה בעקבות אירוע רפואי או צו 8.\nבנוסף, החזר עבור שינוי תוכניות הנסיעה (לדוגמא, החזר על הכרטיסים, מלונות וכד') במקרה של אשפוז בחו״ל מעל יומיים."
            }
            checked={plan.cancellation}
            onChange={(v) => patchPersonPlan(key, { cancellation: v })}
            icon={COVERAGE_ICONS.cancel}
          />
          <PlanCheck
            label="ביטול וקיצור נסיעה מורחב"
            description="החזרים מקסימליים גבוהים יותר מהכיסוי הבסיסי לביטול או קיצור נסיעה (עד תקרות מורחבות לפי תנאי הפוליסה)."
            checked={plan.cancellationExpanded}
            onChange={(v) => patchPersonPlan(key, { cancellationExpanded: v })}
            icon={COVERAGE_ICONS.cancel}
          />
        </div>

        <div>
          <p className="text-[20px] font-black text-[#000144]">כיסויים בשביל הבריאות שלך</p>
        </div>
        <div className="space-y-3">
          <PlanCheck
            label="החמרה של מצב רפואי קודם"
            description="כיסוי להחמרה של מצב רפואי קודם בחו״ל, בהתאם לתנאי הפוליסה ולחיתום הרפואי."
            checked={plan.priorCondition || priorLocked}
            onChange={(v) => {
              if (priorLocked) return;
              patchPersonPlan(key, { priorCondition: v });
            }}
            icon={COVERAGE_ICONS.health}
            locked={priorLocked}
          />
          {isFemale && (
            <PlanCheck
              label="הרחבה להיריון"
              description="למבוטחת שגילה עד 42, היריון עד שבוע 32 (כולל), בהתאם לתנאי הפוליסה."
              checked={plan.pregnancy || pregnancyLocked}
              onChange={(v) => {
                if (pregnancyLocked) return;
                patchPersonPlan(key, { pregnancy: v });
              }}
              icon={COVERAGE_ICONS.pregnancy}
              locked={pregnancyLocked}
            />
          )}
          <PlanCheck
            label="ספורט אתגרי"
            description="לדוגמה, במקרה של פציעה במהלך פעילות ספורט אתגרי."
            footnote={isFemale ? "לא ניתן לרכישה יחד עם כיסוי להיריון" : undefined}
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
            description="לדוגמה, במקרה של פציעה במהלך סקי או סנובורד."
            footnote={isFemale ? "לא ניתן לרכישה יחד עם כיסוי להיריון" : undefined}
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
            description="לפעילות ספורט מקצועני הכוללת שכר או פרסים."
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
        </div>

        <div>
          <p className="text-[20px] font-black text-[#000144]">כיסויים להחזר כספי</p>
          <p className="mt-0.5 text-[13px] font-medium text-[#46557A]">
            (במקרה של מצבים רפואיים, תאונות, אובדן נייד ועוד)
          </p>
        </div>
        <div className="space-y-3">
          <PlanCheck
            label="תאונות אישיות"
            description="בנוסף לכיסוי הבריאות הבסיסי שכלול בפוליסה, הכיסוי הזה מקנה פיצוי בגין מוות / נכות / כוויות / שברים / אשפוז כתוצאה מהתאונה בחו״ל."
            checked={plan.personalAccident}
            onChange={(v) => patchPersonPlan(key, { personalAccident: v })}
            icon={COVERAGE_ICONS.accident}
            footnote="ניתן לרכוש עד גיל 75"
          />
          <PlanCheck
            label="תאונות אישיות בספורט אתגרי"
            description="הרחבת תאונות אישיות לפעילויות ספורט אתגרי, בהתאם לתנאי הפוליסה."
            checked={plan.personalAccidentAdventure}
            onChange={(v) => patchPersonPlan(key, { personalAccidentAdventure: v })}
            icon={COVERAGE_ICONS.accident}
          />
          <PlanCheck
            label="טלפון נייד"
            description="החזר של עד $750 במקרה של אובדן או גניבה בחו״ל."
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
            label="מחשב נייד / טאבלט"
            description="החזר של עד $2,000 במקרה של אובדן או גניבה בחו״ל."
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
            label="ביטול השתתפות עצמית לרכב שכור"
            description="לדוגמה, במקרה של תאונה עם הרכב ששכרת, נכסה השתתפות עצמית עד $1,500 (או עד $6,000 בתוספת תשלום). לנהגים בגילאי 24–75."
            checked={plan.rentalCar}
            onChange={(v) => patchPersonPlan(key, { rentalCar: v })}
            icon={COVERAGE_ICONS.car}
          >
            <div className="space-y-2">
              <p className="text-[13px] font-bold text-[#46557A]">בחרו תקרת כיסוי</p>
              <div className="flex gap-2">
                {(["1500", "6000"] as const).map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => patchPersonPlan(key, { rentalCarLimit: lim })}
                    className={`min-h-[44px] rounded-[14px] border-2 px-4 py-1.5 text-[14px] font-bold ${
                      plan.rentalCarLimit === lim
                        ? "border-[#000144] bg-[#000144] text-white"
                        : "border-[#D5DAE3] bg-white text-[#000144] hover:border-[#000144]/40"
                    }`}
                  >
                    עד ${lim}
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
          <PlanCheck
            label="אופניים"
            description="החזר במקרה של אובדן או גניבה בחו״ל (בנזק של מעל 50% לאופניים)."
            checked={plan.bicycle}
            onChange={(v) => patchPersonPlan(key, { bicycle: v })}
            icon={COVERAGE_ICONS.bike}
          >
            <div className="space-y-2">
              <p className="text-[13px] font-bold text-[#46557A]">בחרו תקרת כיסוי</p>
              <div className="flex flex-wrap gap-2">
                {(["2500", "4500", "6000"] as const).map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => patchPersonPlan(key, { bicycleLimit: lim })}
                    className={`min-h-[44px] rounded-[14px] border-2 px-4 py-1.5 text-[14px] font-bold ${
                      plan.bicycleLimit === lim
                        ? "border-[#000144] bg-[#000144] text-white"
                        : "border-[#D5DAE3] bg-white text-[#000144] hover:border-[#000144]/40"
                    }`}
                  >
                    עד ${lim}
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
        </div>
      </div>
    );
  };

  const showNav = step !== "intro" && step !== "success" && step !== "sending" && step !== "identity";

  return (
    <div className="proposal-page flex min-h-screen flex-col bg-[#F3F5F8] font-rubik text-[#000144]" dir="rtl">
      <style>{`
        /* Override global [dir=rtl] h1/h2 { text-align: right } for centered blocks */
        .proposal-page .tp-center,
        .proposal-page .tp-center h1,
        .proposal-page .tp-center h2,
        .proposal-page .tp-center p {
          text-align: center !important;
        }
        .proposal-page .tp-steps,
        .proposal-page .tp-steps li,
        .proposal-page .tp-steps .tp-step-text {
          text-align: right !important;
        }
      `}</style>

      <section className="relative overflow-hidden bg-[#000144] text-white">
        <div aria-hidden="true" className="absolute left-[-120px] top-[-160px] h-[360px] w-[360px] rounded-full bg-[#0C1060]" />
        <div className="relative mx-auto max-w-[1200px] px-4 pt-5 sm:px-6">
          <AgencyHeader />
        </div>
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-3 px-4 pb-8 pt-8 sm:px-6">
          <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-black leading-[1.02] tracking-[-0.01em]">
            הצעה לביטוח נסיעות לחו״ל
          </h1>
          <p className="m-0 max-w-[640px] text-[18px] font-medium text-[#E3EAFF]">
            תהליך דיגיטלי קצר · ממלאים פעם אחת ומקבלים את טופס הראל הרשמי מוכן
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] font-bold text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#00A247] px-4 py-1.5">
              <ShieldCheck className="h-4 w-4 text-[#00A247]" />
              הראל · פירסט קלאס
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#00A247] px-4 py-1.5">
              <Plane className="h-4 w-4 text-[#00A247]" />
              נסיעות לחו״ל
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto box-border w-full max-w-3xl flex-1 px-4 py-8 sm:py-10">
        {step !== "intro" && step !== "success" && step !== "sending" && (
          <div className="mb-6">
            <ProposalIconStepper steps={progressSteps} currentIndex={progressIndex} />
          </div>
        )}

        <div className="overflow-hidden rounded-[28px] border-2 border-[#E3E7EE] bg-white">
          <div className="p-5 sm:p-7">
            {step === "intro" && (
              <div className="mx-auto max-w-md space-y-5">
                <h2 className="tp-center text-center text-[26px] font-black text-[#000144]">איך זה עובד?</h2>
                <ol className="tp-steps mx-auto w-full max-w-[22rem] space-y-3.5 text-[16px] font-medium text-[#33405F]" dir="rtl">
                  {[
                    "מזינים תעודת זהות — ואנחנו ממלאים אוטומטית מהמערכת",
                    "משלימים פרטי נסיעה, מבוטחים והצהרת בריאות",
                    "בוחרים כיסויים לפי הצורך",
                    "שולחים — והטופס הרשמי של הראל מגיע לסוכנות",
                  ].map((text, i) => (
                    <li
                      key={text}
                      className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-3"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#000144] text-[13px] font-bold leading-none text-white"
                        aria-hidden
                      >
                        <span
                          className="block"
                          style={{ transform: "translate(0.05em, 0.06em)" }}
                        >
                          {["א", "ב", "ג", "ד"][i]}
                        </span>
                      </span>
                      <span className="tp-step-text leading-snug">{text}</span>
                    </li>
                  ))}
                </ol>
                <Button
                  type="button"
                  onClick={() => setStep("identity")}
                  className="h-14 w-full rounded-[18px] bg-[#00A247] text-[19px] font-extrabold text-[#000144] hover:bg-[#008C3D]"
                >
                  מתחילים
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            )}

            {step === "identity" && (
              <div className="mx-auto max-w-md space-y-5">
                <div className="text-center sm:text-right">
                  <h2 className="text-[28px] font-black leading-[1.1] text-[#000144]">זיהוי לפי תעודת זהות</h2>
                  <p className="mt-1 text-[16px] font-medium text-[#46557A]">
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
                  className="h-14 w-full rounded-[18px] bg-[#00A247] text-[19px] font-extrabold text-[#000144] hover:bg-[#008C3D]"
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
                  className="min-h-[44px] w-full text-center text-[15px] font-bold text-[#46557A] underline-offset-4 hover:text-[#000144] hover:underline"
                  onClick={continueWithoutCrm}
                >
                  המשך למילוי ידני
                </button>
              </div>
            )}

            {step === "trip" && (
              <div className="space-y-6">
                {crmFound && (
                  <div className="flex items-start gap-3 rounded-[20px] bg-[#E6F6EC] p-4">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#00A247]" />
                    <div className="text-[15px] font-medium text-[#33405F]">
                      <p className="font-bold text-[#000144]">
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
                    <h3 className="text-center text-[24px] font-black text-[#000144]">מתי נוסעים?</h3>
                    <p className="mt-1 text-center text-[14px] font-medium text-[#46557A]">
                      לחצו על השדה לבחירה בלוח שנה — או הזינו ידנית
                    </p>
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

                {form.destinations.includes("usa") && form.destinations.length > 1 && (
                  <UsaStayDateFields
                    from={form.usaFrom}
                    to={form.usaTo}
                    onChange={(from, to) => {
                      setField("usaFrom", from);
                      setField("usaTo", to);
                    }}
                    fromError={errors.usaFrom}
                    toError={errors.usaTo}
                  />
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
                  <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">פרטי המועמדים לביטוח</h2>
                  <p className="mt-1 text-[14px] font-medium text-[#46557A]">מבוטח ראשי — ואם צריך, מוסיפים בן/ת זוג או ילדים</p>
                </div>
                <label className="flex items-start gap-2 rounded-[20px] bg-[#F3F5F8] p-4 text-[15px] font-medium text-[#33405F]">
                  <Checkbox
                    checked={form.israeliResidents}
                    onCheckedChange={(c) => setField("israeliResidents", !!c)}
                    className="mt-0.5 h-5 w-5 rounded-[6px] border-2 border-[#000144] data-[state=checked]:bg-[#000144] data-[state=checked]:text-white"
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
                    className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#000144]/40 bg-white px-4 py-3.5 text-[17px] font-extrabold text-[#000144] transition hover:border-[#000144] hover:bg-[#F3F5F8]"
                  >
                    <Plus className="h-4 w-4" />
                    הוסף {PERSON_LABELS_HE[nextDependentKey]}
                  </button>
                )}
              </div>
            )}

            {step === "health" && (
              <div className="space-y-4">
                <div className="rounded-[24px] bg-[#000144] p-5 text-white sm:p-6">
                  <p className="text-[14px] font-bold text-[#00A247]">מה מכוסה בביטוח?</p>
                  <h2 className="mt-1 text-[20px] font-black leading-snug text-white sm:text-[24px]">
                    בניגוד לחברת תעופה, אנחנו חברת ביטוח. אז אנחנו חייבים לשאול גם שאלות כאלה בנסיעה לחו״ל
                  </h2>
                  <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#C9D3EA]">{HEALTH_DISCLAIMER}</p>
                </div>
                {people.length > 1 ? (
                  <HouseholdHealth
                    people={people}
                    form={form}
                    errors={errors}
                    onPatchHealth={patchPersonHealth}
                    onPatchPerson={patchPerson}
                    onPatchGroup={(patch) =>
                      setForm((prev) => ({ ...prev, healthGroup: { ...prev.healthGroup, ...patch } }))
                    }
                  />
                ) : (
                  renderHealthFor(activeHealthPerson)
                )}
                <Field label="צירוף מסמכים רפואיים (אופציונלי)">
                  <label className="flex min-h-[52px] cursor-pointer items-center gap-2 rounded-[14px] border-2 border-dashed border-[#D5DAE3] bg-[#F3F5F8] px-4 py-3 text-[16px] font-bold text-[#000144] hover:border-[#000144]/40">
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
                          className="flex items-center justify-between rounded-[12px] border-2 border-[#E3E7EE] bg-white px-3 py-2 text-[14px] font-medium text-[#33405F]"
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
                        className={`min-h-[44px] rounded-full px-5 py-2 text-[14px] font-bold transition ${
                          activePlanPerson === key
                            ? "border-2 border-[#000144] bg-[#000144] text-white"
                            : "border-2 border-[#D5DAE3] bg-white text-[#000144] hover:border-[#000144]/40"
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

            {step === "review" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-[24px] font-black leading-[1.1] text-[#000144]">סיכום ושליחה</h2>
                  <p className="mt-1 text-[14px] font-medium text-[#46557A]">בדקו שהכל נכון לפני השליחה</p>
                </div>
                <div className="space-y-2 rounded-[20px] bg-[#F3F5F8] p-5 text-[16px] text-[#33405F]">
                  {people.map(({ key, person }) => (
                    <p key={key}>
                      <strong>{PERSON_LABELS_HE[key]}:</strong> {displayName(person) || "—"}
                    </p>
                  ))}
                  <p>
                    <strong>נסיעה:</strong> {form.tripFrom} – {form.tripTo}
                  </p>
                  <p>
                    <strong>יעדים:</strong>{" "}
                    {form.destinations
                      .map((id) => DESTINATION_OPTIONS.find((d) => d.id === id)?.labelHe)
                      .join(", ")}
                  </p>
                </div>

                <div>
                  <label className="flex items-start gap-2 text-[15px] font-medium text-[#33405F]">
                    <Checkbox
                      checked={form.declarationsAccepted}
                      onCheckedChange={(c) => {
                        setField("declarationsAccepted", !!c);
                        if (errors.declarationsAccepted) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.declarationsAccepted;
                            return next;
                          });
                        }
                      }}
                      className="mt-0.5 h-5 w-5 rounded-[6px] border-2 border-[#000144] data-[state=checked]:bg-[#000144] data-[state=checked]:text-white"
                    />
                    <span>קראתי ואני מאשר/ת את הצהרות המועמדים לביטוח ומסירת הפרטים לאופיר ושות׳</span>
                  </label>
                  {errors.declarationsAccepted && (
                    <p className="mt-1 text-xs text-rose-600">{errors.declarationsAccepted}</p>
                  )}
                </div>

                <Field label="הערות לסוכנות">
                  <Textarea
                    className="min-h-[70px] rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] text-right text-[16px] font-medium text-[#000144] placeholder:text-[#8A94AD] focus-visible:border-[#00A247] focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
                </Field>

                <Button
                  className="h-14 w-full rounded-[18px] bg-[#00A247] text-[19px] font-extrabold text-[#000144] hover:bg-[#008C3D]"
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
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#00A247]" />
                <p className="mt-4 text-[17px] font-bold text-[#000144]">ממלא את טופס הראל ושולח לסוכנות…</p>
              </div>
            )}

            {step === "success" && (
              <div className="tp-center px-2 py-8 sm:px-6 sm:py-10" style={{ textAlign: "center" }}>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#00A247] text-[#000144]">
                  <Check className="h-8 w-8" />
                </div>
                <h2 className="text-[28px] font-black leading-[1.1] text-[#000144]">ההצעה נשלחה בהצלחה</h2>
                <p className="mx-auto mt-2 max-w-md text-[17px] font-medium leading-relaxed text-[#33405F]">
                  טופס ההצעה הממולא התקבל אצל אופיר ושות׳. שמרו את מספר הפנייה למעקב מולנו.
                </p>
                {proposalNumber ? (
                  <div className="mx-auto mt-6 max-w-sm rounded-[24px] border-2 border-[#E3E7EE] bg-[#F3F5F8] px-5 py-5">
                    <p className="text-[14px] font-bold tracking-wide text-[#46557A]">מספר פנייה באופיר</p>
                    <p
                      className="mt-2 font-mono text-[28px] font-extrabold tracking-wider text-[#000144]"
                      dir="ltr"
                    >
                      {proposalNumber}
                    </p>
                    <p className="mt-3 text-[13px] font-medium leading-relaxed text-[#46557A]">
                      מספר מעקב פנימי אצל אופיר ושות׳ — לא מספר פוליסה בהראל.
                    </p>
                  </div>
                ) : null}
                <p className="mx-auto mt-5 max-w-md text-[16px] font-medium text-[#46557A]">
                  ניצור קשר להמשך הטיפול מול הראל.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[13px] font-medium text-[#46557A]">
          בכפוף להצעת הביטוח ולהצהרת הבריאות של הראל · TravelSure / אופיר ושות׳ סוכנות לביטוח
        </p>
      </main>

      {/* Extra bottom space so the fixed step nav doesn't cover the footer */}
      <div className={showNav ? "pb-[82px]" : ""}>
        <AgencyFooter />
      </div>

      {showNav && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-[#E3E7EE] bg-white font-rubik">
          <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3">
            {step !== "review" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-14 flex-1 text-[17px] rounded-[18px] border-[3px] border-[#000144] bg-white font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white"
                  onClick={goBack}
                >
                  <ArrowRight className="ml-1 h-4 w-4" />
                  הקודם
                </Button>
                <Button
                  type="button"
                  className="h-14 flex-[1.4] rounded-[18px] bg-[#00A247] text-[18px] font-extrabold text-[#000144] hover:bg-[#008C3D]"
                  onClick={goNext}
                >
                  המשך
                  <ArrowLeft className="mr-1 h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" className="h-14 flex-1 text-[17px] rounded-[18px] border-[3px] border-[#000144] bg-white font-extrabold text-[#000144] hover:bg-[#000144] hover:text-white" onClick={goBack}>
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
