import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.avif";
import {
  ageFromBirthDate,
  createInitialTravelProposalForm,
  displayName,
  formatCardExpInput,
  formatDateInput,
  includedPersons,
  isValidCardExpiry,
  isValidCardNumber,
  isValidDateDdMmYyyy,
  isValidEmail,
  isValidIsraeliId,
  markAllHealthNo,
  maxTripDaysForAge,
  tripDays,
} from "@/lib/travelProposal/formDefaults";
import {
  DESTINATION_OPTIONS,
  PERSON_KEYS,
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
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  Loader2,
  Plane,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";

const STEPS: { id: Step; label: string }[] = [
  { id: "intro", label: "התחלה" },
  { id: "trip", label: "נסיעה" },
  { id: "contact", label: "יצירת קשר" },
  { id: "insureds", label: "מבוטחים" },
  { id: "health", label: "בריאות" },
  { id: "plan", label: "כיסויים" },
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
      { v: "no" as const, label: "לא" },
      { v: "yes" as const, label: "כן" },
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

const inputClass =
  "h-11 rounded-xl border-slate-200 bg-white text-right shadow-none focus-visible:ring-[#2f6b63]";

const InsuranceProposal = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<TravelProposalForm>(() => createInitialTravelProposalForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activeHealthPerson, setActiveHealthPerson] = useState<PersonKey>("primary");
  const [activePlanPerson, setActivePlanPerson] = useState<PersonKey>("primary");

  const progressSteps = STEPS.filter((s) => s.id !== "intro");
  const progressIndex = Math.max(
    0,
    progressSteps.findIndex(
      (s) =>
        s.id ===
        (step === "intro"
          ? "trip"
          : step === "sending" || step === "success"
            ? "review"
            : step),
    ),
  );
  const progressPct = step === "intro" ? 0 : ((progressIndex + 1) / progressSteps.length) * 100;

  const people = useMemo(() => includedPersons(form), [form]);

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

  const validateStep = (current: Step): boolean => {
    const nextErrors: Record<string, string> = {};

    if (current === "trip") {
      if (!isValidDateDdMmYyyy(form.tripFrom)) nextErrors.tripFrom = "תאריך התחלה לא תקין";
      if (!isValidDateDdMmYyyy(form.tripTo)) nextErrors.tripTo = "תאריך סיום לא תקין";
      const days = tripDays(form.tripFrom, form.tripTo);
      if (days == null) nextErrors.tripTo = "טווח תאריכים לא תקין";
      if (!form.destinations.length) nextErrors.destinations = "יש לבחור לפחות יעד אחד";
      if (form.destinations.includes("usa")) {
        if (form.usaFrom && !isValidDateDdMmYyyy(form.usaFrom)) nextErrors.usaFrom = "תאריך לא תקין";
        if (form.usaTo && !isValidDateDdMmYyyy(form.usaTo)) nextErrors.usaTo = "תאריך לא תקין";
      }
      if (!form.countriesDetail.trim()) nextErrors.countriesDetail = "נא לפרט מדינות";
    }

    if (current === "contact") {
      if (!form.street.trim()) nextErrors.street = "שדה חובה";
      if (!form.houseNo.trim()) nextErrors.houseNo = "שדה חובה";
      if (!form.city.trim()) nextErrors.city = "שדה חובה";
      if (!form.mobile.trim()) nextErrors.mobile = "שדה חובה";
      if (!isValidEmail(form.email)) nextErrors.email = "דוא״ל לא תקין";
    }

    if (current === "insureds") {
      if (!form.israeliResidents) nextErrors.israeliResidents = "הביטוח מיועד לתושבי ישראל בלבד";
      for (const { key, person } of people) {
        const prefix = key;
        if (!person.gender) nextErrors[`${prefix}.gender`] = "יש לבחור מין";
        if (!isValidIsraeliId(person.idNumber)) nextErrors[`${prefix}.idNumber`] = "ת.ז לא תקינה";
        if (!person.firstNameHe.trim() && !person.firstNameEn.trim())
          nextErrors[`${prefix}.firstNameHe`] = "שם פרטי חובה";
        if (!person.lastNameHe.trim() && !person.lastNameEn.trim())
          nextErrors[`${prefix}.lastNameHe`] = "שם משפחה חובה";
        if (!isValidDateDdMmYyyy(person.birthDate)) nextErrors[`${prefix}.birthDate`] = "תאריך לידה לא תקין";
      }
      const primaryAge = ageFromBirthDate(form.primary.birthDate);
      const days = tripDays(form.tripFrom, form.tripTo);
      if (primaryAge != null && days != null) {
        const max = maxTripDaysForAge(primaryAge);
        if (days > max) nextErrors.tripTo = `תקופה מרבית לגיל ${primaryAge} היא ${max} ימים`;
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
    const order: Step[] = ["intro", "trip", "contact", "insureds", "health", "plan", "payment", "review"];
    const i = order.indexOf(step);
    if (i >= 0 && i < order.length - 1) setStep(order[i + 1]);
  };

  const goBack = () => {
    const order: Step[] = ["intro", "trip", "contact", "insureds", "health", "plan", "payment", "review"];
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]);
  };

  const copyPrimaryToPayer = () => {
    setForm((prev) => ({
      ...prev,
      payerName: displayName(prev.primary) || prev.payerName,
      payerId: prev.primary.idNumber || prev.payerId,
      payerStreet: prev.street || prev.payerStreet,
      payerHouseNo: prev.houseNo || prev.payerHouseNo,
      payerCity: prev.city || prev.payerCity,
      payerPhone: prev.phone || prev.payerPhone,
      payerMobile: prev.mobile || prev.payerMobile,
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep("payment") && step === "review") {
      // re-validate payment fields which live on payment step
    }
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

  const renderPersonEditor = (key: PersonKey, required: boolean) => {
    const person = form[key];
    const show = key === "primary" || person.included;
    return (
      <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">{PERSON_LABELS_HE[key]}</h3>
          {key !== "primary" && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <Checkbox
                checked={person.included}
                onCheckedChange={(c) => patchPerson(key, { included: !!c })}
              />
              לכלול בביטוח
            </label>
          )}
        </div>
        {(required || show) && (
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
                    className={`h-10 flex-1 rounded-xl border text-sm font-semibold ${
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
        )}
      </div>
    );
  };

  const renderHealthFor = (key: PersonKey) => {
    const person = form[key];
    const h = person.health;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">
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
          hint="טיפולי שיניים / השתלת שיער / קוסמטיקה ללא הרדמה מלאה — אין צורך לסמן כן"
        >
          <YesNoToggle value={h.q1} onChange={(v) => patchPersonHealth(key, { q1: v })} name="q1" />
        </Field>

        <Field
          label="2. האם בחצי השנה האחרונה מקבל/ת תרופות קבועות או טיפול רפואי / הומלץ טיפול?"
          required
          error={errors[`${key}.q2`]}
        >
          <YesNoToggle value={h.q2} onChange={(v) => patchPersonHealth(key, { q2: v })} name="q2" />
        </Field>

        {h.q2 === "yes" && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
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
          label="3. ניתוח / אשפוז מעל 3 ימים / המלצה — בחצי השנה האחרונה (נושאים ספציפיים)?"
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
          label="4. האם הופנית לבדיקות שטרם בוצעו / תוצאות לא תקינות / ממצא חריג?"
          required
          error={errors[`${key}.q4`]}
        >
          <YesNoToggle value={h.q4} onChange={(v) => patchPersonHealth(key, { q4: v })} name="q4" />
        </Field>
        {h.q4 === "yes" && (
          <Field label="פירוט הבדיקות (למשל MRI/CT ראש)">
            <Textarea
              className="min-h-[80px] rounded-xl border-slate-200 text-right"
              value={h.q4Details}
              onChange={(e) => patchPersonHealth(key, { q4Details: e.target.value })}
            />
          </Field>
        )}

        {person.gender === "female" && (
          <div className="space-y-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
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
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-[#2f6b63]/40">
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
        <h3 className="text-sm font-bold text-slate-800">פירסט קלאס — {PERSON_LABELS_HE[key]}</h3>
        <p className="text-xs text-slate-500">
          ביטוח רפואי בסיסי כלול. ניתן להסיר כיסויים כלולים או להוסיף הרחבות בתשלום.
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
            <div className="mr-6 grid gap-2 rounded-xl bg-slate-50 p-3">
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
            label="הרחבה להיריון (עד שבוע 32, גיל עד 42)"
            checked={plan.pregnancy}
            onChange={(v) => patchPersonPlan(key, { pregnancy: v })}
          />
          <PlanCheck
            label="ספורט אתגרי חובבני"
            checked={plan.adventureSports}
            onChange={(v) => patchPersonPlan(key, { adventureSports: v })}
            hint="לא ניתן יחד עם כיסוי להיריון"
          />
          {plan.adventureSports && (
            <div className="mr-6 grid grid-cols-2 gap-2">
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
            <div className="mr-6 grid grid-cols-2 gap-2">
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
          {plan.proSports && (
            <div className="mr-6 grid grid-cols-2 gap-2">
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
          )}
          <PlanCheck
            label="תאונות אישיות"
            checked={plan.personalAccident}
            onChange={(v) => patchPersonPlan(key, { personalAccident: v })}
          />
          <PlanCheck
            label="תאונות אישיות במסגרת ספורט אתגרי"
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
            <div className="mr-6 space-y-2 rounded-xl bg-slate-50 p-3">
              <div className="flex flex-wrap gap-2">
                {(["2500", "4500", "6000"] as const).map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => patchPersonPlan(key, { bicycleLimit: lim })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
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
            label="ביטול השתתפות עצמית לרכב שכור (גיל 24–75)"
            checked={plan.rentalCar}
            onChange={(v) => patchPersonPlan(key, { rentalCar: v })}
          />
          {plan.rentalCar && (
            <div className="mr-6 space-y-2 rounded-xl bg-slate-50 p-3">
              <div className="flex gap-2">
                {(["1500", "6000"] as const).map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => patchPersonPlan(key, { rentalCarLimit: lim })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
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

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8f3f1_0%,_#f8fafc_45%,_#eef2ff_100%)]"
    >
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TravelSure" className="h-10 w-auto" />
            <div>
              <p className="text-sm font-bold text-[#1f4b46]">הצעה לביטוח נסיעות לחו״ל</p>
              <p className="text-[11px] text-slate-500">הראל · פירסט קלאס · מהדורת 07/2026</p>
            </div>
          </div>
          <ShieldCheck className="h-5 w-5 text-[#2f6b63]" />
        </div>
        {step !== "intro" && step !== "success" && (
          <div className="mx-auto max-w-3xl px-4 pb-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#2f6b63] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {progressSteps.map((s, i) => (
                <span
                  key={s.id}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    i <= progressIndex ? "bg-[#2f6b63]/15 text-[#1f4b46]" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-28">
        {step === "intro" && (
          <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#2f6b63]/10 px-3 py-1 text-xs font-semibold text-[#2f6b63]">
              <Plane className="h-3.5 w-3.5" />
              טופס הצטרפות דיגיטלי
            </div>
            <h1 className="text-2xl font-bold text-[#1f4b46]">הצעה לביטוח נסיעות לחו״ל — רפואי</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              מלאו את הטופס בהתאם להצעת הראל הרשמית. בסיום התהליך יישלח לסוכנות אופיר ושות׳ אותו טופס PDF
              ממולא, להמשך טיפול מול הראל.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6b63]" />
                תנאי לרכישה: הימצאות המבוטחים בארץ בעת הרכישה
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6b63]" />
                הביטוח מיועד לתושבי ישראל בלבד
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2f6b63]" />
                תקופה מרבית לפי גיל (עד 365 ימים לגילאי 0–50)
              </li>
            </ul>
            <Button
              className="mt-6 h-12 w-full rounded-2xl bg-[#2f6b63] text-base hover:bg-[#275a53]"
              onClick={() => setStep("trip")}
            >
              התחלת מילוי
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </section>
        )}

        {step === "trip" && (
          <section className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f4b46]">א · פרטי הנסיעה</h2>
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
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                      form.destinations.includes(d.id)
                        ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {d.labelHe}
                  </button>
                ))}
              </div>
            </Field>
            {form.destinations.includes("usa") && (
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
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
                className="min-h-[80px] rounded-xl border-slate-200 text-right"
                value={form.countriesDetail}
                onChange={(e) => setField("countriesDetail", e.target.value)}
              />
            </Field>
            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500">
              תקופה מרבית: 0–50 ← 365 יום · 51–60 ← 180 · 61–75 ← 120 · 76–80 ← 60 · 81–95 ← 30
            </div>
          </section>
        )}

        {step === "contact" && (
          <section className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f4b46]">ב · פרטי יצירת קשר</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="כתובת רח׳" required error={errors.street}>
                <Input
                  className={inputClass}
                  value={form.street}
                  onChange={(e) => setField("street", e.target.value)}
                />
              </Field>
              <Field label="מס׳" required error={errors.houseNo}>
                <Input
                  className={inputClass}
                  value={form.houseNo}
                  onChange={(e) => setField("houseNo", e.target.value)}
                />
              </Field>
              <Field label="יישוב" required error={errors.city}>
                <Input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </Field>
              <Field label="מקצוע / עיסוק">
                <Input
                  className={inputClass}
                  value={form.occupation}
                  onChange={(e) => setField("occupation", e.target.value)}
                />
              </Field>
              <Field label="טלפון">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </Field>
              <Field label="נייד" required error={errors.mobile}>
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={form.mobile}
                  onChange={(e) => setField("mobile", e.target.value)}
                />
              </Field>
              <Field label="דוא״ל" required error={errors.email}>
                <Input
                  className={inputClass}
                  dir="ltr"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </Field>
            </div>
          </section>
        )}

        {step === "insureds" && (
          <section className="space-y-4">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#1f4b46]">ג · פרטי המועמדים לביטוח</h2>
              <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
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
            </div>
            <div className="space-y-3">{PERSON_KEYS.map((k) => renderPersonEditor(k, k === "primary"))}</div>
          </section>
        )}

        {step === "health" && (
          <section className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f4b46]">ד · הצהרת בריאות</h2>
            <p className="text-xs text-slate-500">
              הפוליסה אינה מכסה הוצאות רפואיות ממצב רפואי קודם אלא אם נרכשה הרחבה להחמרה.
            </p>
            <div className="flex flex-wrap gap-2">
              {people.map(({ key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveHealthPerson(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    activeHealthPerson === key
                      ? "bg-[#2f6b63] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {PERSON_LABELS_HE[key]}
                </button>
              ))}
            </div>
            {renderHealthFor(activeHealthPerson)}
            <Field label="צירוף מסמכים רפואיים (אופציונלי)">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
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
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs"
                    >
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
          </section>
        )}

        {step === "plan" && (
          <section className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f4b46]">ה · תכנית הביטוח — פירסט קלאס</h2>
            <div className="flex flex-wrap gap-2">
              {people.map(({ key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePlanPerson(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    activePlanPerson === key
                      ? "bg-[#2f6b63] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {PERSON_LABELS_HE[key]}
                </button>
              ))}
            </div>
            {renderPlanFor(activePlanPerson)}
          </section>
        )}

        {step === "payment" && (
          <section className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#1f4b46]">ט · תשלום בכרטיס אשראי</h2>
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={copyPrimaryToPayer}>
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
                  onChange={(e) => setField("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </Field>
              <Field label="רחוב">
                <Input
                  className={inputClass}
                  value={form.payerStreet}
                  onChange={(e) => setField("payerStreet", e.target.value)}
                />
              </Field>
              <Field label="מס׳">
                <Input
                  className={inputClass}
                  value={form.payerHouseNo}
                  onChange={(e) => setField("payerHouseNo", e.target.value)}
                />
              </Field>
              <Field label="יישוב">
                <Input
                  className={inputClass}
                  value={form.payerCity}
                  onChange={(e) => setField("payerCity", e.target.value)}
                />
              </Field>
              <Field label="מיקוד">
                <Input
                  className={inputClass}
                  value={form.payerZip}
                  onChange={(e) => setField("payerZip", e.target.value.replace(/\D/g, "").slice(0, 7))}
                />
              </Field>
              <Field label="טלפון">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={form.payerPhone}
                  onChange={(e) => setField("payerPhone", e.target.value)}
                />
              </Field>
              <Field label="טלפון נייד">
                <Input
                  className={inputClass}
                  dir="ltr"
                  value={form.payerMobile}
                  onChange={(e) => setField("payerMobile", e.target.value)}
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
                אני מאשר/ת את נכונות פרטי התשלום ואת החיוב בכרטיס האשראי עבור המבוטח/ים
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
                קראתי ואני מאשר/ת את הצהרות המועמדים לביטוח, מדיניות הפרטיות של הראל, ואת מסירת הפרטים
                לסוכנות אופיר ושות׳ להמשך טיפול
                {errors.declarationsAccepted && (
                  <span className="mt-1 block text-xs text-rose-600">{errors.declarationsAccepted}</span>
                )}
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <Checkbox
                checked={form.marketingConsentExtra}
                onCheckedChange={(c) => setField("marketingConsentExtra", !!c)}
                className="mt-0.5"
              />
              <span>הסכמה לקבלת דברי פרסומת נוספת מקבוצת הראל (סעיף 4ב בטופס)</span>
            </label>

            <Field label="הערות לסוכנות">
              <Textarea
                className="min-h-[70px] rounded-xl border-slate-200 text-right"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </Field>
          </section>
        )}

        {step === "review" && (
          <section className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[#1f4b46]">סיכום ושליחה</h2>
            <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
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
              <p className="text-xs text-slate-500">
                בלחיצה על שלח יימלא טופס ההצעה הרשמי של הראל ויישלח ל־rani@ophirins.co.il
              </p>
            </div>
            <Button
              className="h-12 w-full rounded-2xl bg-[#2f6b63] text-base hover:bg-[#275a53]"
              onClick={handleSubmit}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  שולח…
                </>
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  שלח הצעה
                </>
              )}
            </Button>
          </section>
        )}

        {step === "sending" && (
          <section className="rounded-3xl border border-white/70 bg-white/90 p-10 text-center shadow-sm">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#2f6b63]" />
            <p className="mt-4 text-sm text-slate-600">ממלא את טופס הראל ושולח לסוכנות…</p>
          </section>
        )}

        {step === "success" && (
          <section className="rounded-3xl border border-white/70 bg-white/90 p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2f6b63]/15">
              <Check className="h-7 w-7 text-[#2f6b63]" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#1f4b46]">ההצעה נשלחה</h2>
            <p className="mt-2 text-sm text-slate-600">
              טופס ההצעה הממולא התקבל אצל אופיר ושות׳. ניצור קשר להמשך הטיפול מול הראל.
            </p>
          </section>
        )}
      </main>

      {step !== "intro" && step !== "success" && step !== "sending" && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3">
            {step !== "review" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={goBack}
                  disabled={step === "trip"}
                >
                  <ArrowRight className="ml-1 h-4 w-4" />
                  הקודם
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-[1.4] rounded-xl bg-[#2f6b63] hover:bg-[#275a53]"
                  onClick={goNext}
                >
                  המשך
                  <ArrowLeft className="mr-1 h-4 w-4" />
                </Button>
              </>
            )}
            {step === "review" && (
              <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" onClick={goBack}>
                <ArrowRight className="ml-1 h-4 w-4" />
                חזרה לעריכה
              </Button>
            )}
          </div>
        </div>
      )}

      <footer className="pb-24 text-center text-[11px] text-slate-400">
        בכפוף להצעת הביטוח ולהצהרת הבריאות של הראל · TravelSure / אופיר ושות׳ סוכנות לביטוח
      </footer>
    </div>
  );
};

export default InsuranceProposal;
