import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  BriefcaseMedical,
  CalendarX2,
  Luggage,
  Loader2,
  PlaneLanding,
  Plus,
  Send,
  Trash2,
} from "lucide-react";

type ClaimType = "medical" | "trip_cancel" | "trip_shorten" | "baggage";
type Step = "type" | "details" | "files";
type YesNo = "" | "yes" | "no";

type ExpenseRow = { date: string; type: string; amount: string; receiptAttached: boolean };
type BaggageRow = { item: string; purchaseDate: string; purchasePrice: string; receiptAttached: boolean };

const claimTypesOrder: ClaimType[] = ["medical", "trip_cancel", "trip_shorten", "baggage"];

const claimTypeMeta: Record<
  ClaimType,
  { title: string; short: string; subtitle: string; docs: string[]; icon: typeof BriefcaseMedical }
> = {
  medical: {
    title: "הוצאות רפואיות בחו״ל (שלא באשפוז)",
    short: "רפואי",
    subtitle: "רופא, מרפאה, תרופות ובדיקות בחו״ל",
    docs: [
      "עותק פוליסה",
      "דוח רפואי מרופא מטפל בחו״ל (סיבת פנייה, אנמנזה ואבחנה)",
      "חשבון מפורט",
      "קבלות תשלום מקוריות",
    ],
    icon: BriefcaseMedical,
  },
  trip_cancel: {
    title: "ביטול נסיעה טרם היציאה",
    short: "ביטול",
    subtitle: "ביטול הנסיעה לפני היציאה לחו״ל",
    docs: [
      "עותק פוליסה",
      "העתק תוכנית / מסלול הנסיעה",
      "כרטיסי טיסה וקבלה מקוריים לחבילת הנסיעה",
      "אישור סוכן על דמי ביטול / החזר (פירוט קרקע מול טיסה)",
      "אישור רפואי על אי-כשירות לטוס",
      "דוח רפואי / סיכום אשפוז",
      "במקרה משפחתי: סיכום רפואי/תעודת פטירה + הוכחת קרבה",
    ],
    icon: CalendarX2,
  },
  trip_shorten: {
    title: "קיצור נסיעה מחו״ל",
    short: "קיצור",
    subtitle: "קיצור הנסיעה וחזרה מוקדמת לישראל",
    docs: [
      "עותק פוליסה",
      "דוח רפואי מרופא מטפל בחו״ל (סיבת פנייה, אנמנזה ואבחנה)",
      "תוכנית נסיעה מקורית",
      "כרטיסי טיסה וקבלה מקוריים לחבילת הנסיעה",
      "אישור סוכן על החזר עבור שירותים שלא נוצלו (פירוט קרקע מול טיסה)",
      "קבלות מקוריות לכרטיסים חדשים / שינוי כרטיסים לחזרה מוקדמת",
      "אישור רפואי מחו״ל על הצורך בקיצור הנסיעה וחזרה מוקדמת",
      "במקרה משפחתי: סיכום רפואי/תעודת פטירה + הוכחת קרבה",
    ],
    icon: PlaneLanding,
  },
  baggage: {
    title: "מטען / כבודה",
    short: "מטען",
    subtitle: "אובדן, גניבה או נזק לכבודה",
    docs: [
      "דו״ח משטרה במקור ממקום ומזמן האירוע",
      "קבלות רכישה על הרכוש שאבד/נגנב",
      "בשחזור מסמכים: קבלות שחזור",
      "באיחור כבודה: קבלות ציוד חיוני",
      "אם אצל מוביל אווירי: תשובת חברת התעופה",
    ],
    icon: Luggage,
  },
};

const emptyExpense = (): ExpenseRow => ({
  date: "",
  type: "",
  amount: "",
  receiptAttached: false,
});

const emptyBaggage = (): BaggageRow => ({
  item: "",
  purchaseDate: "",
  purchasePrice: "",
  receiptAttached: false,
});

const initialForm = {
  lastName: "",
  firstName: "",
  idNumber: "",
  birthDate: "",
  street: "",
  houseNumber: "",
  city: "",
  zip: "",
  homePhone: "",
  mobile: "",
  email: "",
  hmoName: "",
  hmoBranch: "",
  hmoAddress: "",
  policyNumber: "",
  policyType: "",
  purchasedWhere: "",
  notifiedCreditCard: "" as YesNo,
  creditCardPolicyNumber: "",
  medicalExtension: "" as YesNo,
  medicalExtensionPolicy: "",
  claimedElsewhere: "" as YesNo,
  otherAbroadPolicy: "" as YesNo,
  otherAbroadCompany: "",
  homeAllRisks: "" as YesNo,
  originalsSubmittedElsewhere: "" as YesNo,
  intendSubmitElsewhere: "" as YesNo,
  tripStartDate: "",
  tripEndDate: "",
  incidentDate: "",
  country: "",
  details: "",
  claimReason: "",
  preexisting: "" as YesNo,
  preexistingDetails: "",
  duringFlight: "" as YesNo,
  claimedAirline: "" as YesNo,
  airlineName: "",
  airlineCompensation: "" as YesNo,
  airlineCompensationAmount: "",
  bankName: "",
  branchName: "",
  branchNumber: "",
  accountNumber: "",
  agentName: "",
  authorizeAgent: false,
  marketingConsent: false,
  medicalWaiver: false,
  declaration: false,
  totalClaimed: "",
};

const isValidIsraeliId = (id: string) => {
  const s = id.trim().replace(/[^\d]/g, "").padStart(9, "0");
  if (!/^\d{9}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
};

const Field = ({
  label,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {required ? <span className="mr-1 text-rose-500">*</span> : null}
    </label>
    {children}
    {error ? <p className="text-xs text-rose-600">{error}</p> : null}
  </div>
);

const YesNoField = ({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  error?: string;
}) => (
  <Field label={label} error={error}>
    <div className="flex gap-4 text-sm">
      <label className="inline-flex items-center gap-2">
        <input type="radio" checked={value === "no"} onChange={() => onChange("no")} />
        לא
      </label>
      <label className="inline-flex items-center gap-2">
        <input type="radio" checked={value === "yes"} onChange={() => onChange("yes")} />
        כן
      </label>
    </div>
  </Field>
);

const Claim = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("type");
  const [claimType, setClaimType] = useState<ClaimType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState(initialForm);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([emptyExpense()]);
  const [baggageItems, setBaggageItems] = useState<BaggageRow[]>([emptyBaggage()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeMeta = useMemo(() => (claimType ? claimTypeMeta[claimType] : null), [claimType]);

  const setField = <K extends keyof typeof initialForm>(name: K, value: (typeof initialForm)[K]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateDetails = () => {
    if (!claimType) return false;
    const next: Record<string, string> = {};

    if (!formData.lastName.trim()) next.lastName = "שדה חובה";
    if (!formData.firstName.trim()) next.firstName = "שדה חובה";
    if (!formData.idNumber.trim()) next.idNumber = "שדה חובה";
    else if (!isValidIsraeliId(formData.idNumber)) next.idNumber = "תעודת זהות לא תקינה";
    if (!formData.birthDate.trim()) next.birthDate = "שדה חובה";
    if (!formData.mobile.trim()) next.mobile = "שדה חובה";
    if (!formData.email.trim()) next.email = "שדה חובה";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) next.email = "אימייל לא תקין";
    if (!formData.policyNumber.trim()) next.policyNumber = "שדה חובה";
    if (!formData.incidentDate.trim()) next.incidentDate = "שדה חובה";
    if (!formData.country.trim()) {
      next.country = claimType === "trip_cancel" ? "שדה חובה — מדינת היעד" : "שדה חובה";
    }
    if (!formData.details.trim()) next.details = "שדה חובה";
    if (!formData.bankName.trim()) next.bankName = "שדה חובה";
    if (!formData.branchNumber.trim()) next.branchNumber = "שדה חובה";
    if (!formData.accountNumber.trim()) next.accountNumber = "שדה חובה";
    if (!formData.declaration) next.declaration = "יש לאשר את ההצהרה";

    const needsMedicalWaiver =
      claimType === "medical" || claimType === "trip_cancel" || claimType === "trip_shorten";
    if (needsMedicalWaiver && !formData.medicalWaiver) {
      next.medicalWaiver = "יש לאשר ויתור על סודיות רפואית";
    }

    if (claimType === "medical") {
      if (!formData.totalClaimed.trim()) next.totalClaimed = "שדה חובה";
    }

    if (claimType === "trip_cancel" || claimType === "trip_shorten") {
      if (!formData.claimReason.trim()) next.claimReason = "שדה חובה";
    }

    if (claimType === "baggage") {
      if (!formData.totalClaimed.trim()) next.totalClaimed = "שדה חובה";
      const hasItem = baggageItems.some((r) => r.item.trim());
      if (!hasItem) next.baggageItems = "יש לפרט לפחות פריט אחד";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateFiles = () => {
    if (files.length === 0) {
      setErrors({ files: "יש לצרף לפחות מסמך אחד" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!claimType || !activeMeta || !validateFiles()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        claimType,
        claimTypeLabel: activeMeta.title,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        expenses: claimType === "medical" ? expenses : undefined,
        baggageItems: claimType === "baggage" ? baggageItems : undefined,
        submittedAt: new Date().toISOString(),
      };

      const body = new FormData();
      body.append("payload", JSON.stringify(payload));
      files.forEach((file) => body.append("files[]", file));

      const response = await fetch("https://ophir.travelsure.co.il/api-claim.php", {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error("claim_submit_failed");

      toast({
        title: "התביעה נשלחה בהצלחה",
        description: "הצוות קיבל את הפנייה ויחזור אליך בהקדם.",
      });

      setFormData(initialForm);
      setExpenses([emptyExpense()]);
      setBaggageItems([emptyBaggage()]);
      setFiles([]);
      setErrors({});
      setClaimType(null);
      setStep("type");
    } catch (error) {
      console.error("Claim submit failed:", error);
      toast({
        title: "שגיאה בשליחת התביעה",
        description: "אנא נסה שוב בעוד מספר דקות.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: "type", label: "סוג תביעה" },
    { id: "details", label: "פרטים" },
    { id: "files", label: "מסמכים" },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(ellipse at top, #e8f4f1 0%, #f7faf9 45%, #eef2f1 100%)",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14" dir="rtl">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-wide text-[#2f6b63]">TravelSure</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1a4a45] sm:text-4xl">הגשת תביעה</h1>
          <p className="mt-2 text-sm text-slate-600">טופס דיגיטלי לפי דרישות הראל — שלב אחר שלב</p>
        </header>

        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, idx) => {
            const done = idx < stepIndex;
            const active = idx === stepIndex;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-[#2f6b63] text-white"
                      : done
                        ? "bg-[#2f6b63]/20 text-[#2f6b63]"
                        : "border border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`hidden text-xs font-medium sm:inline ${active ? "text-[#1a4a45]" : "text-slate-400"}`}>
                  {s.label}
                </span>
                {idx < steps.length - 1 ? (
                  <div className={`mx-1 h-px w-6 sm:w-10 ${done ? "bg-[#2f6b63]" : "bg-slate-200"}`} />
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="h-1.5 bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#4ade80]" />

          {step === "type" ? (
            <div className="p-6 sm:p-8">
              <h2 className="mb-1 text-lg font-bold text-[#1a4a45]">מה סוג התביעה?</h2>
              <p className="mb-6 text-sm text-slate-500">בחרו את הקטגוריה המתאימה ביותר</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {claimTypesOrder.map((type) => {
                  const meta = claimTypeMeta[type];
                  const Icon = meta.icon;
                  const active = claimType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setClaimType(type)}
                      className={`flex items-start gap-4 rounded-xl border p-4 text-right transition ${
                        active
                          ? "border-[#2f6b63] bg-[#2f6b63]/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-[#2f6b63]/40"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          active ? "bg-[#2f6b63] text-white" : "bg-slate-100 text-[#2f6b63]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#1a4a45]">{meta.title}</div>
                        <div className="mt-0.5 text-sm text-slate-500">{meta.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button
                type="button"
                className="mt-6 w-full rounded-xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white"
                size="lg"
                disabled={!claimType}
                onClick={() => setStep("details")}
              >
                המשך למילוי פרטים
              </Button>
            </div>
          ) : null}

          {step === "details" && claimType && activeMeta ? (
            <form
              className="space-y-8 p-6 sm:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (validateDetails()) setStep("files");
              }}
            >
              <div>
                <p className="text-xs font-semibold text-[#2f6b63]">{activeMeta.short}</p>
                <h2 className="text-lg font-bold text-[#1a4a45]">{activeMeta.title}</h2>
              </div>

              <section className="space-y-4">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">א. פרטים אישיים</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="שם משפחה" required error={errors.lastName}>
                    <Input className="bg-slate-50" value={formData.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                  </Field>
                  <Field label="שם פרטי" required error={errors.firstName}>
                    <Input className="bg-slate-50" value={formData.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                  </Field>
                  <Field label="תעודת זהות" required error={errors.idNumber}>
                    <Input
                      className="bg-slate-50"
                      inputMode="numeric"
                      value={formData.idNumber}
                      onChange={(e) => setField("idNumber", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
                    />
                  </Field>
                  <Field label="תאריך לידה" required error={errors.birthDate}>
                    <Input className="bg-slate-50" type="date" value={formData.birthDate} onChange={(e) => setField("birthDate", e.target.value)} />
                  </Field>
                  <Field label="רחוב">
                    <Input className="bg-slate-50" value={formData.street} onChange={(e) => setField("street", e.target.value)} />
                  </Field>
                  <Field label="מספר בית">
                    <Input className="bg-slate-50" value={formData.houseNumber} onChange={(e) => setField("houseNumber", e.target.value)} />
                  </Field>
                  <Field label="יישוב">
                    <Input className="bg-slate-50" value={formData.city} onChange={(e) => setField("city", e.target.value)} />
                  </Field>
                  <Field label="מיקוד">
                    <Input className="bg-slate-50" value={formData.zip} onChange={(e) => setField("zip", e.target.value)} />
                  </Field>
                  <Field label="טלפון בבית">
                    <Input className="bg-slate-50" value={formData.homePhone} onChange={(e) => setField("homePhone", e.target.value)} />
                  </Field>
                  <Field label="טלפון נייד" required error={errors.mobile}>
                    <Input className="bg-slate-50" value={formData.mobile} onChange={(e) => setField("mobile", e.target.value)} />
                  </Field>
                  <Field label="אימייל" required error={errors.email} className="sm:col-span-2">
                    <Input className="bg-slate-50" type="email" value={formData.email} onChange={(e) => setField("email", e.target.value)} />
                  </Field>
                  {claimType === "medical" ? (
                    <>
                      <Field label="שם קופת חולים">
                        <Input className="bg-slate-50" value={formData.hmoName} onChange={(e) => setField("hmoName", e.target.value)} />
                      </Field>
                      <Field label="סניף קופ״ח">
                        <Input className="bg-slate-50" value={formData.hmoBranch} onChange={(e) => setField("hmoBranch", e.target.value)} />
                      </Field>
                      <Field label="כתובת סניף" className="sm:col-span-2">
                        <Input className="bg-slate-50" value={formData.hmoAddress} onChange={(e) => setField("hmoAddress", e.target.value)} />
                      </Field>
                    </>
                  ) : null}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">ב. פרטי הפוליסה</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="מספר פוליסה" required error={errors.policyNumber}>
                    <Input className="bg-slate-50" value={formData.policyNumber} onChange={(e) => setField("policyNumber", e.target.value)} />
                  </Field>
                  <Field label="סוג פוליסה">
                    <Input className="bg-slate-50" value={formData.policyType} onChange={(e) => setField("policyType", e.target.value)} />
                  </Field>
                  <Field label="היכן נרכשה הפוליסה" className="sm:col-span-2">
                    <Input className="bg-slate-50" value={formData.purchasedWhere} onChange={(e) => setField("purchasedWhere", e.target.value)} />
                  </Field>
                  <YesNoField
                    label="האם הודעת למוקד חברת האשראי על הנסיעה?"
                    value={formData.notifiedCreditCard}
                    onChange={(v) => setField("notifiedCreditCard", v)}
                  />
                  {formData.notifiedCreditCard === "yes" ? (
                    <Field label="מספר פוליסה בחברת האשראי">
                      <Input
                        className="bg-slate-50"
                        value={formData.creditCardPolicyNumber}
                        onChange={(e) => setField("creditCardPolicyNumber", e.target.value)}
                      />
                    </Field>
                  ) : null}
                  {claimType === "medical" ? (
                    <>
                      <YesNoField
                        label="הרחבה למצב מחלתי קיים?"
                        value={formData.medicalExtension}
                        onChange={(v) => setField("medicalExtension", v)}
                      />
                      {formData.medicalExtension === "yes" ? (
                        <Field label="מספר פוליסה להרחבה">
                          <Input
                            className="bg-slate-50"
                            value={formData.medicalExtensionPolicy}
                            onChange={(e) => setField("medicalExtensionPolicy", e.target.value)}
                          />
                        </Field>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">ג. ביטוחים נוספים</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <YesNoField
                    label="האם הגשת תביעה לגורם אחר?"
                    value={formData.claimedElsewhere}
                    onChange={(v) => setField("claimedElsewhere", v)}
                  />
                  <YesNoField
                    label="האם יש פוליסת ביטוח חו״ל נוספת?"
                    value={formData.otherAbroadPolicy}
                    onChange={(v) => setField("otherAbroadPolicy", v)}
                  />
                  {formData.otherAbroadPolicy === "yes" ? (
                    <Field label="שם החברה" className="sm:col-span-2">
                      <Input
                        className="bg-slate-50"
                        value={formData.otherAbroadCompany}
                        onChange={(e) => setField("otherAbroadCompany", e.target.value)}
                      />
                    </Field>
                  ) : null}
                  {claimType === "baggage" ? (
                    <YesNoField
                      label='האם יש ביטוח דירה עם הרחבת "כל הסיכונים"?'
                      value={formData.homeAllRisks}
                      onChange={(v) => setField("homeAllRisks", v)}
                    />
                  ) : null}
                  <YesNoField
                    label="האם הקבלות המקוריות הוגשו לגורם אחר?"
                    value={formData.originalsSubmittedElsewhere}
                    onChange={(v) => setField("originalsSubmittedElsewhere", v)}
                  />
                  <YesNoField
                    label="האם בכוונתך להגיש את הקבלות לגורם אחר?"
                    value={formData.intendSubmitElsewhere}
                    onChange={(v) => setField("intendSubmitElsewhere", v)}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">ד. תיאור המקרה</h3>
                {(claimType === "trip_cancel" || claimType === "trip_shorten") ? (
                  <Field
                    label={claimType === "trip_cancel" ? "סיבת הביטול" : "סיבת הקיצור"}
                    required
                    error={errors.claimReason}
                  >
                    <Input
                      className="bg-slate-50"
                      value={formData.claimReason}
                      onChange={(e) => setField("claimReason", e.target.value)}
                      placeholder="לדוגמה: מחלה, אשפוז בן משפחה, וכו׳"
                    />
                  </Field>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="תאריך יציאה מהארץ">
                    <Input
                      className="bg-slate-50"
                      type="date"
                      value={formData.tripStartDate}
                      onChange={(e) => setField("tripStartDate", e.target.value)}
                    />
                  </Field>
                  <Field label="תאריך חזרה לארץ">
                    <Input
                      className="bg-slate-50"
                      type="date"
                      value={formData.tripEndDate}
                      onChange={(e) => setField("tripEndDate", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={claimType === "trip_cancel" ? "תאריך הביטול" : "תאריך האירוע"}
                    required
                    error={errors.incidentDate}
                  >
                    <Input
                      className="bg-slate-50"
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => setField("incidentDate", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={
                      claimType === "trip_cancel"
                        ? "מדינת היעד"
                        : claimType === "trip_shorten"
                          ? "הארץ בה אירע המקרה"
                          : "הארץ בה אירע המקרה"
                    }
                    required
                    error={errors.country}
                  >
                    <Input className="bg-slate-50" value={formData.country} onChange={(e) => setField("country", e.target.value)} />
                  </Field>
                </div>
                <Field label="תיאור מדויק ומפורט של המקרה" required error={errors.details}>
                  <Textarea
                    className="min-h-[120px] bg-slate-50"
                    value={formData.details}
                    onChange={(e) => setField("details", e.target.value)}
                  />
                </Field>
              </section>

              {claimType === "medical" ? (
                <section className="space-y-4">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">ה. פירוט מרכיבי התביעה</h3>
                  <div className="space-y-3">
                    {expenses.map((row, idx) => (
                      <div key={idx} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-4">
                        <Input
                          className="bg-slate-50"
                          type="date"
                          value={row.date}
                          onChange={(e) => {
                            const next = [...expenses];
                            next[idx] = { ...row, date: e.target.value };
                            setExpenses(next);
                          }}
                          placeholder="תאריך טיפול"
                        />
                        <Input
                          className="bg-slate-50 sm:col-span-1"
                          value={row.type}
                          onChange={(e) => {
                            const next = [...expenses];
                            next[idx] = { ...row, type: e.target.value };
                            setExpenses(next);
                          }}
                          placeholder="סוג הוצאה"
                        />
                        <Input
                          className="bg-slate-50"
                          value={row.amount}
                          onChange={(e) => {
                            const next = [...expenses];
                            next[idx] = { ...row, amount: e.target.value };
                            setExpenses(next);
                          }}
                          placeholder="סכום + מטבע"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={row.receiptAttached}
                              onChange={(e) => {
                                const next = [...expenses];
                                next[idx] = { ...row, receiptAttached: e.target.checked };
                                setExpenses(next);
                              }}
                            />
                            צורפה קבלה
                          </label>
                          {expenses.length > 1 ? (
                            <button
                              type="button"
                              className="text-rose-500"
                              onClick={() => setExpenses(expenses.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setExpenses([...expenses, emptyExpense()])}>
                    <Plus className="h-4 w-4" />
                    הוסף הוצאה
                  </Button>
                  <Field label="סה״כ הסכום הנתבע וסוג המטבע" required error={errors.totalClaimed}>
                    <Input className="bg-slate-50" value={formData.totalClaimed} onChange={(e) => setField("totalClaimed", e.target.value)} />
                  </Field>
                  <YesNoField
                    label="האם סבלת מהמחלה לפני היציאה מהארץ?"
                    value={formData.preexisting}
                    onChange={(v) => setField("preexisting", v)}
                  />
                  {formData.preexisting === "yes" ? (
                    <Field label="פירוט">
                      <Input
                        className="bg-slate-50"
                        value={formData.preexistingDetails}
                        onChange={(e) => setField("preexistingDetails", e.target.value)}
                      />
                    </Field>
                  ) : null}
                </section>
              ) : null}

              {claimType === "baggage" ? (
                <section className="space-y-4">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">ה. פירוט מרכיבי התביעה</h3>
                  <div className="space-y-3">
                    {baggageItems.map((row, idx) => (
                      <div key={idx} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-4">
                        <Input
                          className="bg-slate-50"
                          value={row.item}
                          onChange={(e) => {
                            const next = [...baggageItems];
                            next[idx] = { ...row, item: e.target.value };
                            setBaggageItems(next);
                          }}
                          placeholder="פריט"
                        />
                        <Input
                          className="bg-slate-50"
                          type="date"
                          value={row.purchaseDate}
                          onChange={(e) => {
                            const next = [...baggageItems];
                            next[idx] = { ...row, purchaseDate: e.target.value };
                            setBaggageItems(next);
                          }}
                        />
                        <Input
                          className="bg-slate-50"
                          value={row.purchasePrice}
                          onChange={(e) => {
                            const next = [...baggageItems];
                            next[idx] = { ...row, purchasePrice: e.target.value };
                            setBaggageItems(next);
                          }}
                          placeholder="מחיר רכישה"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={row.receiptAttached}
                              onChange={(e) => {
                                const next = [...baggageItems];
                                next[idx] = { ...row, receiptAttached: e.target.checked };
                                setBaggageItems(next);
                              }}
                            />
                            צורפה קבלה
                          </label>
                          {baggageItems.length > 1 ? (
                            <button
                              type="button"
                              className="text-rose-500"
                              onClick={() => setBaggageItems(baggageItems.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.baggageItems ? <p className="text-xs text-rose-600">{errors.baggageItems}</p> : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setBaggageItems([...baggageItems, emptyBaggage()])}
                  >
                    <Plus className="h-4 w-4" />
                    הוסף פריט
                  </Button>
                  <Field label="סה״כ הסכום הנתבע וסוג המטבע" required error={errors.totalClaimed}>
                    <Input className="bg-slate-50" value={formData.totalClaimed} onChange={(e) => setField("totalClaimed", e.target.value)} />
                  </Field>
                  <YesNoField
                    label="האם האובדן/נזק אירע במסגרת הטיסה?"
                    value={formData.duringFlight}
                    onChange={(v) => setField("duringFlight", v)}
                  />
                  <YesNoField
                    label="האם הגשת תביעה לחברת התעופה?"
                    value={formData.claimedAirline}
                    onChange={(v) => setField("claimedAirline", v)}
                  />
                  {formData.claimedAirline === "yes" ? (
                    <Field label="שם חברת התעופה">
                      <Input className="bg-slate-50" value={formData.airlineName} onChange={(e) => setField("airlineName", e.target.value)} />
                    </Field>
                  ) : null}
                  <YesNoField
                    label="האם קיבלת פיצוי מחברת התעופה?"
                    value={formData.airlineCompensation}
                    onChange={(v) => setField("airlineCompensation", v)}
                  />
                  {formData.airlineCompensation === "yes" ? (
                    <Field label="סכום הפיצוי ששולם">
                      <Input
                        className="bg-slate-50"
                        value={formData.airlineCompensationAmount}
                        onChange={(e) => setField("airlineCompensationAmount", e.target.value)}
                      />
                    </Field>
                  ) : null}
                </section>
              ) : null}

              <section className="space-y-4">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">אופן תשלום (העברה בנקאית)</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="בנק" required error={errors.bankName}>
                    <Input className="bg-slate-50" value={formData.bankName} onChange={(e) => setField("bankName", e.target.value)} />
                  </Field>
                  <Field label="שם סניף">
                    <Input className="bg-slate-50" value={formData.branchName} onChange={(e) => setField("branchName", e.target.value)} />
                  </Field>
                  <Field label="מספר סניף" required error={errors.branchNumber}>
                    <Input className="bg-slate-50" value={formData.branchNumber} onChange={(e) => setField("branchNumber", e.target.value)} />
                  </Field>
                  <Field label="מספר חשבון" required error={errors.accountNumber}>
                    <Input className="bg-slate-50" value={formData.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} />
                  </Field>
                </div>
                <p className="text-xs text-slate-500">מעל 15,000 ₪ יש לצרף צילום שיק / אישור בנק על פרטי החשבון.</p>
              </section>

              <section className="space-y-3">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">הצהרות</h3>
                {(claimType === "medical" || claimType === "trip_cancel" || claimType === "trip_shorten") ? (
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={formData.medicalWaiver}
                      onChange={(e) => setField("medicalWaiver", e.target.checked)}
                    />
                    <span>
                      אני מאשר/ת ויתור על סודיות רפואית ומסמיך/ה את הראל לקבל מידע רפואי ממוסדות רפואיים לצורך בירור התביעה.
                    </span>
                  </label>
                ) : null}
                {errors.medicalWaiver ? <p className="text-xs text-rose-600">{errors.medicalWaiver}</p> : null}
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.authorizeAgent}
                    onChange={(e) => setField("authorizeAgent", e.target.checked)}
                  />
                  <span>אני מאשר/ת לסוכן הביטוח לטפל בתביעה זו בשמי</span>
                </label>
                {formData.authorizeAgent ? (
                  <Field label="שם הסוכן">
                    <Input className="bg-slate-50" value={formData.agentName} onChange={(e) => setField("agentName", e.target.value)} />
                  </Field>
                ) : null}
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.marketingConsent}
                    onChange={(e) => setField("marketingConsent", e.target.checked)}
                  />
                  <span>אני מסכים/ה לקבל הצעות שיווקיות מקבוצת הראל (אופציונלי)</span>
                </label>
                <label className="flex items-start gap-3 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.declaration}
                    onChange={(e) => setField("declaration", e.target.checked)}
                  />
                  <span>הנני מצהיר/ה כי הפרטים שמסרתי נכונים ומלאים *</span>
                </label>
                {errors.declaration ? <p className="text-xs text-rose-600">{errors.declaration}</p> : null}
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep("type")}>
                  חזרה
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white sm:min-w-[200px]"
                  size="lg"
                >
                  המשך לצירוף מסמכים
                </Button>
              </div>
            </form>
          ) : null}

          {step === "files" && claimType && activeMeta ? (
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#2f6b63]">{activeMeta.short}</p>
                <h2 className="text-lg font-bold text-[#1a4a45]">צירוף מסמכים</h2>
              </div>

              <div className="mb-5 rounded-xl bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold text-[#1a4a45]">מסמכים נדרשים לפי סוג התביעה:</p>
                <ul className="list-disc space-y-1 pr-5 text-sm text-slate-600">
                  {activeMeta.docs.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center transition hover:border-[#2f6b63] hover:bg-[#2f6b63]/5">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    setFiles(Array.from(e.target.files || []));
                    if (errors.files) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.files;
                        return next;
                      });
                    }
                  }}
                />
                <div className="text-sm font-semibold text-[#1a4a45]">לחצו לבחירת קבצים</div>
                <div className="mt-1 text-xs text-slate-500">PDF / JPG / PNG / DOC</div>
              </label>

              {files.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                      {file.name}
                    </li>
                  ))}
                </ul>
              ) : null}
              {errors.files ? <p className="mt-2 text-xs text-rose-600">{errors.files}</p> : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep("details")} disabled={isSubmitting}>
                  חזרה
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="rounded-xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white sm:min-w-[200px]"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      שליחת תביעה
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Claim;
