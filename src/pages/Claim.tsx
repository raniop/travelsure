import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.avif";
import {
  CLAIM_CONTACT,
  ClaimCrmCustomer,
  ClaimCrmPolicy,
  claimPolicyFilterCopy,
  filterPoliciesForClaimType,
  formatClaimDateDisplay,
  groupClaimPolicies,
  isValidIsraeliId,
  lookupClaimCustomerById,
  lookupClaimCustomerByPolicyNumber,
  policyTimeBucketForClaimType,
} from "@/lib/claimCrmLookup";
import { ClaimDateInput } from "@/components/claim/ClaimDateInput";
import { ClaimAmountCurrencyFields } from "@/components/claim/ClaimAmountCurrencyFields";
import { ClaimCurrencyPicker } from "@/components/claim/ClaimCurrencyPicker";
import { formatClaimTotal, suggestCurrencyForDestination } from "@/lib/claimCurrencies";
import { submitClaimRequest } from "@/lib/submitClaim";
import {
  flattenClaimDocFiles,
  getClaimDocumentRequirements,
  missingRequiredClaimDocs,
} from "@/lib/claimDocuments";
import {
  claimSubmitErrorMessage,
  formatClaimFileSize,
  prepareClaimFiles,
} from "@/lib/claimFilePrepare";
import {
  IsraeliBank,
  IsraeliBranch,
  branchesForBank,
  filterBranches,
  findBranchByCode,
  loadIsraeliBanksData,
} from "@/lib/israeliBanks";
import {
  BriefcaseMedical,
  CalendarX2,
  Check,
  FileUp,
  Luggage,
  Loader2,
  Phone,
  Plane,
  PlaneLanding,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Mail,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ClaimType = "medical" | "trip_cancel" | "trip_shorten" | "baggage";
type BaggageSubtype = "loss_theft" | "delay";
type Step = "type" | "identity" | "policy" | "details" | "files" | "sending" | "blocked" | "success";
type SubmitPhase = "preparing" | "uploading" | "sending";
type YesNo = "" | "yes" | "no";

type ExpenseRow = {
  date: string;
  type: string;
  amount: string;
  currency: string;
  receiptAttached: boolean;
};
type BaggageRow = { item: string; purchaseDate: string; purchasePrice: string; receiptAttached: boolean };

const claimTypesOrder: ClaimType[] = ["medical", "trip_cancel", "trip_shorten", "baggage"];

const BAGGAGE_DELAY_FIXED_AMOUNT = "155 USD";

const baggageSubtypeMeta: Record<BaggageSubtype, { title: string; subtitle: string }> = {
  loss_theft: { title: "אובדן / גניבה", subtitle: "הכבודה אבדה או נגנבה" },
  delay: { title: "איחור בהגעת כבודה", subtitle: "הכבודה הגיעה באיחור" },
};

const baggageSubtypeOrder: BaggageSubtype[] = ["loss_theft", "delay"];

const claimTypeMeta: Record<
  ClaimType,
  { title: string; short: string; subtitle: string; icon: typeof BriefcaseMedical }
> = {
  medical: {
    title: "הוצאות רפואיות בחו״ל (שלא באשפוז)",
    short: "רפואי",
    subtitle: "רופא, מרפאה, תרופות ובדיקות בחו״ל",
    icon: BriefcaseMedical,
  },
  trip_cancel: {
    title: "ביטול נסיעה טרם היציאה",
    short: "ביטול",
    subtitle: "ביטול הנסיעה לפני היציאה לחו״ל",
    icon: CalendarX2,
  },
  trip_shorten: {
    title: "קיצור נסיעה מחו״ל",
    short: "קיצור",
    subtitle: "קיצור הנסיעה וחזרה מוקדמת לישראל",
    icon: PlaneLanding,
  },
  baggage: {
    title: "מטען / כבודה",
    short: "מטען",
    subtitle: "אובדן, גניבה או איחור בהגעת כבודה",
    icon: Luggage,
  },
};

const emptyExpense = (currency = "USD"): ExpenseRow => ({
  date: "",
  type: "",
  amount: "",
  currency: currency || "USD",
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
  claimAmount: "",
  claimCurrency: "USD",
  preexisting: "" as YesNo,
  preexistingDetails: "",
  duringFlight: "" as YesNo,
  claimedAirline: "" as YesNo,
  airlineName: "",
  airlineCompensation: "" as YesNo,
  airlineCompensationAmount: "",
  bankName: "",
  bankCode: "",
  branchName: "",
  branchNumber: "",
  accountNumber: "",
  agentName: "",
  authorizeAgent: false,
  marketingConsent: false,
  medicalWaiver: false,
  declaration: false,
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
  const [baggageSubtype, setBaggageSubtype] = useState<BaggageSubtype | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("preparing");
  const [submitFilesCount, setSubmitFilesCount] = useState(0);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupId, setLookupId] = useState("");
  const [lookupPolicyNumber, setLookupPolicyNumber] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [crmCustomer, setCrmCustomer] = useState<ClaimCrmCustomer | null>(null);
  const [crmPolicies, setCrmPolicies] = useState<ClaimCrmPolicy[]>([]);
  const [blockedReason, setBlockedReason] = useState<"not_found" | "no_match">("not_found");
  const [selectedPolicyUid, setSelectedPolicyUid] = useState("");
  const [showPastYearsPolicies, setShowPastYearsPolicies] = useState(false);
  const [docFiles, setDocFiles] = useState<Record<string, File[]>>({});
  const [isPreparingFiles, setIsPreparingFiles] = useState(false);
  const [filePrepareNote, setFilePrepareNote] = useState("");
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState(initialForm);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([emptyExpense()]);
  const [baggageItems, setBaggageItems] = useState<BaggageRow[]>([emptyBaggage()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banks, setBanks] = useState<IsraeliBank[]>([]);
  const [allBranches, setAllBranches] = useState<IsraeliBranch[]>([]);
  const [branchQuery, setBranchQuery] = useState("");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [submittedClaimNumber, setSubmittedClaimNumber] = useState("");
  const [submittedSummary, setSubmittedSummary] = useState<{
    fullName: string;
    claimTypeLabel: string;
    email: string;
    filesCount: number;
  } | null>(null);

  const activeMeta = useMemo(() => (claimType ? claimTypeMeta[claimType] : null), [claimType]);
  const isBaggageDelay = claimType === "baggage" && baggageSubtype === "delay";
  const documentRequirements = useMemo(
    () => getClaimDocumentRequirements(claimType, baggageSubtype),
    [claimType, baggageSubtype]
  );
  const allAttachedFiles = useMemo(
    () => [...flattenClaimDocFiles(docFiles), ...extraFiles],
    [docFiles, extraFiles]
  );
  const missingDocs = useMemo(
    () => missingRequiredClaimDocs(documentRequirements, docFiles),
    [documentRequirements, docFiles]
  );
  const requiredDocsCount = documentRequirements.filter((d) => d.required).length;
  const requiredDocsDone = requiredDocsCount - missingDocs.length;
  const docsComplete = missingDocs.length === 0 && requiredDocsCount > 0;

  const relevantPolicies = useMemo(
    () => filterPoliciesForClaimType(crmPolicies, claimType, baggageSubtype),
    [crmPolicies, claimType, baggageSubtype]
  );
  const policyFilterCopy = useMemo(
    () => claimPolicyFilterCopy(claimType, baggageSubtype),
    [claimType, baggageSubtype]
  );
  const policyTimeBucket = useMemo(
    () => policyTimeBucketForClaimType(claimType, baggageSubtype),
    [claimType, baggageSubtype]
  );
  const groupedPolicies = useMemo(
    () => groupClaimPolicies(relevantPolicies, policyTimeBucket),
    [relevantPolicies, policyTimeBucket]
  );
  const currentPolicyYear = useMemo(() => new Date().getFullYear(), []);
  const pastPoliciesThisYear = useMemo(
    () => groupedPolicies.pastByYear.filter(({ year }) => year === currentPolicyYear),
    [groupedPolicies.pastByYear, currentPolicyYear]
  );
  const pastPoliciesOlderYears = useMemo(
    () => groupedPolicies.pastByYear.filter(({ year }) => year !== currentPolicyYear),
    [groupedPolicies.pastByYear, currentPolicyYear]
  );
  const pastOlderCount = useMemo(
    () => pastPoliciesOlderYears.reduce((sum, g) => sum + g.policies.length, 0),
    [pastPoliciesOlderYears]
  );
  const bankBranches = useMemo(
    () => branchesForBank({ banks, branches: allBranches }, formData.bankCode),
    [banks, allBranches, formData.bankCode]
  );
  const branchSuggestions = useMemo(
    () => filterBranches(bankBranches, branchQuery || formData.branchName || formData.branchNumber),
    [bankBranches, branchQuery, formData.branchName, formData.branchNumber]
  );

  useEffect(() => {
    let alive = true;
    loadIsraeliBanksData().then((data) => {
      if (!alive) return;
      setBanks(data.banks);
      setAllBranches(data.branches);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (claimType === "baggage" && baggageSubtype === "delay") {
      setFormData((prev) => ({
        ...prev,
        claimAmount: "155",
        claimCurrency: "USD",
      }));
      setBaggageItems([emptyBaggage()]);
    }
  }, [claimType, baggageSubtype]);

  useEffect(() => {
    setDocFiles({});
    setExtraFiles([]);
  }, [claimType, baggageSubtype]);


  const selectBank = (code: string) => {
    const bank = banks.find((b) => b.code === code);
    setFormData((prev) => ({
      ...prev,
      bankCode: code,
      bankName: bank?.name || "",
      branchName: "",
      branchNumber: "",
    }));
    setBranchQuery("");
    setBranchMenuOpen(false);
    if (errors.bankName) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.bankName;
        return next;
      });
    }
  };

  const selectBranch = (branch: IsraeliBranch) => {
    setFormData((prev) => ({
      ...prev,
      branchName: branch.city ? `${branch.name} (${branch.city})` : branch.name,
      branchNumber: branch.code,
    }));
    setBranchQuery("");
    setBranchMenuOpen(false);
    if (errors.branchNumber) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.branchNumber;
        return next;
      });
    }
  };

  const renderPolicyCard = (policy: ClaimCrmPolicy) => {
    const active = selectedPolicyUid === policy.uid;
    const start = formatClaimDateDisplay(policy.startDate) || "—";
    const end = formatClaimDateDisplay(policy.endDate) || "—";
    return (
      <button
        key={policy.uid}
        type="button"
        onClick={() => setSelectedPolicyUid(policy.uid)}
        className={`w-full rounded-2xl border px-4 py-3.5 text-right transition ${
          active
            ? "border-[#2f6b63] bg-[#2f6b63]/5 shadow-sm ring-1 ring-[#2f6b63]/20"
            : "border-slate-200 bg-white hover:border-[#2f6b63]/35"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#143834]">פוליסה {policy.fullPolicyID}</span>
              {policy.areaName ? (
                <span className="rounded-full bg-[#e8f4f1] px-2.5 py-0.5 text-xs font-semibold text-[#2f6b63]">
                  {policy.areaName}
                </span>
              ) : null}
            </div>
            <div className="mt-1.5 text-sm text-slate-600">
              <span className="text-slate-400">יציאה</span>{" "}
              <span className="font-semibold text-[#143834]">{start}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-slate-400">חזרה</span>{" "}
              <span className="font-semibold text-[#143834]">{end}</span>
            </div>
          </div>
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
              active ? "border-[#2f6b63] bg-[#2f6b63] text-white" : "border-slate-300 bg-white text-transparent"
            }`}
          >
            <Check className="h-3 w-3" />
          </span>
        </div>
      </button>
    );
  };

  const applyCustomerAndPolicy = (customer: ClaimCrmCustomer, policy: ClaimCrmPolicy) => {
    setFormData((prev) => ({
      ...prev,
      firstName: customer.firstNameHe || prev.firstName,
      lastName: customer.lastNameHe || prev.lastName,
      idNumber: customer.id || prev.idNumber,
      birthDate: customer.birthDate || prev.birthDate,
      mobile: customer.phone || prev.mobile,
      email: customer.email || prev.email,
      policyNumber: policy.fullPolicyID,
      tripStartDate: policy.startDate || prev.tripStartDate,
      tripEndDate: policy.endDate || prev.tripEndDate,
      country: policy.areaName || prev.country,
      claimCurrency: prev.claimCurrency && prev.claimCurrency !== "USD"
        ? prev.claimCurrency
        : suggestCurrencyForDestination(policy.areaName || prev.country),
    }));
    setSelectedPolicyUid(policy.uid);
  };

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

  const handleIdentityLookup = async () => {
    setLookupError("");
    if (!isValidIsraeliId(lookupId)) {
      setLookupError("תעודת זהות לא תקינה");
      return;
    }
    setIsLookingUp(true);
    try {
      let result = await lookupClaimCustomerById(lookupId);
      const policyNo = lookupPolicyNumber.trim().replace(/[^\d]/g, "");
      if (!result.ok && (result as { reason?: string }).reason === "not_found" && policyNo) {
        result = await lookupClaimCustomerByPolicyNumber(policyNo, lookupId);
      }
      if (!result.ok) {
        if ((result as { ok: false; reason: string }).reason === "invalid_id") {
          setLookupError("תעודת זהות לא תקינה");
          return;
        }
        if ((result as { ok: false; reason: string }).reason === "not_found" && !policyNo) {
          setLookupError("לא נמצאה פוליסה לפי ת״ז — נסו גם להזין מספר פוליסה");
          return;
        }
        setCrmCustomer(null);
        setCrmPolicies([]);
        setSelectedPolicyUid("");
        setBlockedReason("not_found");
        setStep("blocked");
        return;
      }

      setCrmCustomer(result.customer);
      setCrmPolicies(result.policies);

      const matched = filterPoliciesForClaimType(result.policies, claimType, baggageSubtype);
      if (matched.length === 0) {
        setSelectedPolicyUid("");
        setBlockedReason(result.policies.length > 0 ? "no_match" : "not_found");
        setStep("blocked");
        return;
      }

      if (matched.length === 1) {
        applyCustomerAndPolicy(result.customer, matched[0]);
        setStep("details");
      } else {
        setSelectedPolicyUid("");
        setStep("policy");
        setShowPastYearsPolicies(false);
      }
    } finally {
      setIsLookingUp(false);
    }
  };

  const handlePolicyContinue = () => {
    if (!crmCustomer || !selectedPolicyUid) {
      setLookupError("יש לבחור פוליסה");
      return;
    }
    const policy = relevantPolicies.find((p) => p.uid === selectedPolicyUid);
    if (!policy) {
      setLookupError("יש לבחור פוליסה");
      return;
    }
    setLookupError("");
    applyCustomerAndPolicy(crmCustomer, policy);
    setStep("details");
  };

  const clearFilesError = () => {
    if (!errors.files) return;
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.files;
      return copy;
    });
  };

  const mergePreparedFiles = (existing: File[], incoming: File[]) => {
    const merged = [...existing];
    incoming.forEach((file) => {
      const exists = merged.some(
        (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
      );
      if (!exists) merged.push(file);
    });
    return merged;
  };

  const prepareAndAcceptFiles = async (incoming: FileList | File[] | null | undefined) => {
    const next = Array.from(incoming || []);
    if (!next.length) return [] as File[];
    setIsPreparingFiles(true);
    setFilePrepareNote("בודק ומכווץ קבצים גדולים...");
    try {
      const { accepted, compressedCount, errors } = await prepareClaimFiles(next);
      if (errors.length) {
        setErrors((prev) => ({ ...prev, files: errors[0] }));
        toast({
          title: "קובץ לא צורף",
          description: errors[0],
          variant: "destructive",
        });
      } else {
        clearFilesError();
      }
      if (compressedCount > 0) {
        setFilePrepareNote(
          compressedCount === 1
            ? "קובץ אחד כווץ אוטומטית כדי שיעבור בשליחה"
            : `${compressedCount} קבצים כווצו אוטומטית כדי שיעברו בשליחה`
        );
      } else if (accepted.length) {
        setFilePrepareNote("");
      }
      return accepted;
    } finally {
      setIsPreparingFiles(false);
    }
  };

  const addDocFiles = async (docId: string, incoming: FileList | File[] | null | undefined) => {
    const accepted = await prepareAndAcceptFiles(incoming);
    if (!accepted.length) return;
    setDocFiles((prev) => ({
      ...prev,
      [docId]: mergePreparedFiles(prev[docId] || [], accepted),
    }));
  };

  const removeDocFile = (docId: string, index: number) => {
    setDocFiles((prev) => {
      const list = [...(prev[docId] || [])].filter((_, i) => i !== index);
      const copy = { ...prev };
      if (list.length) copy[docId] = list;
      else delete copy[docId];
      return copy;
    });
  };

  const addExtraFiles = async (incoming: FileList | File[] | null | undefined) => {
    const accepted = await prepareAndAcceptFiles(incoming);
    if (!accepted.length) return;
    setExtraFiles((prev) => mergePreparedFiles(prev, accepted));
  };

  const removeExtraFileAt = (index: number) => {
    setExtraFiles((prev) => prev.filter((_, i) => i !== index));
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
    if (claimType !== "trip_cancel" && !formData.incidentDate.trim()) next.incidentDate = "שדה חובה";
    if (claimType !== "trip_cancel" && !formData.country.trim()) {
      next.country = "שדה חובה";
    }
    if (!formData.details.trim()) next.details = "שדה חובה";
    if (!formData.bankName.trim()) next.bankName = "שדה חובה";
    if (!formData.branchNumber.trim()) next.branchNumber = "שדה חובה";
    if (!formData.accountNumber.trim()) next.accountNumber = "שדה חובה";
    if (!formData.declaration) next.declaration = "יש לאשר את ההצהרה";

    if (claimType === "medical" || claimType === "trip_cancel" || claimType === "trip_shorten") {
      if (!formData.claimAmount.trim()) next.claimAmount = "שדה חובה";
      if (!formData.claimCurrency.trim()) next.claimCurrency = "שדה חובה";
    }

    if (claimType === "medical" || claimType === "trip_cancel") {
      const filled = expenses.filter(
        (r) => r.date.trim() || r.type.trim() || r.amount.trim(),
      );
      const complete = filled.filter(
        (r) => r.date.trim() && r.type.trim() && r.amount.trim(),
      );
      if (!complete.length) {
        next.expenses = "יש למלא לפחות הוצאה אחת (תאריך, סוג וסכום)";
      } else if (filled.length !== complete.length) {
        next.expenses = "יש להשלים תאריך, סוג הוצאה וסכום בכל שורה שהתחלתם";
      }
    }

    if (claimType === "trip_cancel" || claimType === "trip_shorten") {
      if (!formData.claimReason.trim()) next.claimReason = "שדה חובה";
    }

    if (claimType === "baggage") {
      if (baggageSubtype === "delay") {
        // Fixed compensation — no itemization required
      } else {
        if (!formData.claimAmount.trim()) next.claimAmount = "שדה חובה";
        if (!formData.claimCurrency.trim()) next.claimCurrency = "שדה חובה";
        const hasItem = baggageItems.some((r) => r.item.trim());
        if (!hasItem) next.baggageItems = "יש לפרט לפחות פריט אחד";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateFiles = () => {
    if (!docsComplete) {
      const missingList = missingDocs.map((d) => `• ${d.label}`).join("\n");
      const confirmed = window.confirm(
        `לא צורפו כל המסמכים הנדרשים:\n\n${missingList}\n\nהאם לשלוח את התביעה בכל זאת?`
      );
      if (!confirmed) {
        setErrors({
          files: "חסרים מסמכי חובה — אפשר להשלים אותם כאן, או לאשר שליחה בכל זאת",
        });
        return false;
      }
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!claimType || !activeMeta || isSubmitting || !validateFiles()) return;
    const filesSnapshot = [...allAttachedFiles];
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const claimTypeLabel = activeMeta.title;
    const emailSnapshot = formData.email;

    setIsSubmitting(true);
    setSubmitFilesCount(filesSnapshot.length);
    setSubmitPhase(filesSnapshot.length ? "preparing" : "sending");
    setStep("sending");

    try {
      const payload = {
        ...formData,
        claimType,
        claimTypeLabel,
        baggageSubtype: claimType === "baggage" ? baggageSubtype : undefined,
        baggageSubtypeLabel:
          claimType === "baggage" && baggageSubtype ? baggageSubtypeMeta[baggageSubtype].title : undefined,
        fullName,
        country: claimType === "trip_cancel" ? "" : formData.country,
        expenses:
          claimType === "medical" || claimType === "trip_cancel"
            ? expenses.map((row) => {
                const currency = (row.currency || formData.claimCurrency || "USD").trim().toUpperCase();
                return {
                  ...row,
                  amount: row.amount.trim() ? `${row.amount.trim()} ${currency}`.trim() : row.amount,
                  currency,
                };
              })
            : undefined,
        baggageItems:
          claimType === "baggage" && baggageSubtype !== "delay" ? baggageItems : undefined,
        totalClaimed:
          claimType === "baggage" && baggageSubtype === "delay"
            ? BAGGAGE_DELAY_FIXED_AMOUNT
            : formatClaimTotal(formData.claimAmount, formData.claimCurrency),
        claimAmount:
          claimType === "baggage" && baggageSubtype === "delay" ? "155" : formData.claimAmount,
        claimCurrency:
          claimType === "baggage" && baggageSubtype === "delay" ? "USD" : formData.claimCurrency,
        crmMatched: true,
        selectedPolicyId: formData.policyNumber,
        selectedPolicyUid,
        crmCustomerName: crmCustomer?.primaryName || "",
        submittedAt: new Date().toISOString(),
      };

      const result = await submitClaimRequest(payload, filesSnapshot, setSubmitPhase);
      if (!result.ok) throw new Error(result.error || "claim_submit_failed");

      setSubmittedClaimNumber(result.claimNumber || "");
      setSubmittedSummary({
        fullName,
        claimTypeLabel,
        email: emailSnapshot,
        filesCount: filesSnapshot.length,
      });

      setFormData(initialForm);
      setExpenses([emptyExpense()]);
      setBaggageItems([emptyBaggage()]);
      setDocFiles({});
      setExtraFiles([]);
      setErrors({});
      setClaimType(null);
      setBaggageSubtype(null);
      setCrmCustomer(null);
      setCrmPolicies([]);
      setSelectedPolicyUid("");
      setLookupId("");
      setLookupError("");
      setStep("success");
      if (result.warning) {
        toast({
          title: "התביעה נשלחה — שימו לב",
          description: result.warning,
        });
      }
    } catch (error) {
      console.error("Claim submit failed:", error);
      const description = claimSubmitErrorMessage(error);
      setStep("files");
      setErrors((prev) => ({ ...prev, files: description }));
      toast({
        title: "לא הצלחנו לשלוח את התביעה",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: "type", label: "סוג תביעה" },
    { id: "identity", label: "זיהוי" },
    { id: "details", label: "פרטים" },
    { id: "files", label: "מסמכים" },
  ];
  const progressStep: Step =
    step === "policy" || step === "blocked"
      ? "identity"
      : step === "success" || step === "sending"
        ? "files"
        : step;
  const submitPhaseCopy: Record<SubmitPhase, { title: string; body: string }> = {
    preparing: {
      title: "מכין את הקבצים",
      body:
        submitFilesCount > 0
          ? `קורא ומכין ${submitFilesCount} קבצים לשליחה מאובטחת`
          : "מכין את פרטי התביעה",
    },
    uploading: {
      title: "מעלה מסמכים",
      body: "הקבצים בדרך אלינו — זה יכול לקחת כמה רגעים",
    },
    sending: {
      title: "שולח את התביעה",
      body: "שומרים את הפרטים ושולחים לצוות הטיפול",
    },
  };
  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === progressStep)
  );

  return (
    <div className="claim-page relative min-h-screen overflow-hidden font-heebo" dir="rtl">
      <style>{`
        .claim-page {
          background:
            radial-gradient(1200px 600px at 85% -10%, rgba(74, 222, 128, 0.22), transparent 55%),
            radial-gradient(900px 500px at -10% 20%, rgba(47, 107, 99, 0.18), transparent 50%),
            linear-gradient(180deg, #f3faf7 0%, #eef6f3 40%, #e7f0ed 100%);
        }
        .claim-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(40px);
          pointer-events: none;
          animation: claim-float 10s ease-in-out infinite;
        }
        .claim-orb-a { width: 280px; height: 280px; background: rgba(47,107,99,.18); top: 8%; left: -6%; }
        .claim-orb-b { width: 220px; height: 220px; background: rgba(74,222,128,.2); top: 55%; right: -4%; animation-delay: -3s; }
        @keyframes claim-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(1.05); }
        }
        @keyframes claim-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .claim-rise { animation: claim-rise .55s ease-out both; }
        .claim-rise-d1 { animation-delay: .08s; }
        .claim-rise-d2 { animation-delay: .16s; }
        .claim-rise-d3 { animation-delay: .24s; }
        .claim-type-card {
          position: relative;
          overflow: hidden;
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease;
        }
        .claim-type-card::after {
          content: "";
          position: absolute;
          inset: auto -40% -60% auto;
          width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(74,222,128,.18), transparent 70%);
          transition: transform .35s ease;
        }
        .claim-type-card:hover { transform: translateY(-3px); box-shadow: 0 18px 40px -24px rgba(15,23,42,.45); }
        .claim-type-card:hover::after { transform: scale(1.3); }
        .claim-type-card.active {
          border-color: #2f6b63;
          background: linear-gradient(145deg, rgba(47,107,99,.08), rgba(255,255,255,.95) 55%);
          box-shadow: 0 16px 36px -20px rgba(31,75,70,.55);
        }
        .claim-cta {
          position: relative;
          overflow: hidden;
        }
        .claim-cta::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 -40%;
          width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: skewX(-20deg);
          animation: claim-shine 2.8s ease-in-out infinite;
        }
        @keyframes claim-shine {
          0%, 55% { left: -40%; }
          100% { left: 120%; }
        }
        .claim-progress-fill {
          transition: width .45s cubic-bezier(.22,1,.36,1);
        }
        @keyframes claim-send-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes claim-send-pulse {
          0%, 100% { transform: scale(1); opacity: .55; }
          50% { transform: scale(1.08); opacity: .9; }
        }
        .claim-send-ring {
          animation: claim-send-spin 1.1s linear infinite;
        }
        .claim-send-glow {
          animation: claim-send-pulse 1.8s ease-in-out infinite;
        }
      `}</style>

      <div className="claim-orb claim-orb-a" />
      <div className="claim-orb claim-orb-b" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <header className="claim-rise mb-7 text-center">
          <img
            src={logo}
            alt="TravelSure"
            className="mx-auto h-[78px] w-auto drop-shadow-sm sm:h-[100px]"
          />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#143834] sm:text-4xl">
            {claimType && activeMeta && step !== "type"
              ? `הגשת תביעה - ${activeMeta.title}`
              : "הגשת תביעה"}
          </h1>
          {step === "type" || !claimType ? (
            <p className="mx-auto mt-2 max-w-lg text-lg font-bold tracking-tight text-[#1f4b46] sm:text-xl">
              בפוליסת נסיעות לחו״ל של הראל
            </p>
          ) : claimType === "baggage" && baggageSubtype ? (
            <p className="mx-auto mt-2 max-w-lg text-lg font-bold tracking-tight text-[#1f4b46] sm:text-xl">
              {baggageSubtypeMeta[baggageSubtype].title}
            </p>
          ) : (
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 sm:text-base">
              תהליך דיגיטלי ברור ומאובטח מטעם אופיר ושות׳ סוכנות לביטוח
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#1f4b46]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f6b63]/15 bg-white/80 px-3 py-1.5 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2f6b63]" />
              מאובטח ומוצפן
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f6b63]/15 bg-white/80 px-3 py-1.5 backdrop-blur">
              אופיר ושות׳ סוכנות לביטוח
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f6b63]/15 bg-white/80 px-3 py-1.5 backdrop-blur">
              מענה עד 30 יום
            </span>
          </div>
        </header>

        <div className="claim-rise claim-rise-d1 mb-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              שלב {stepIndex + 1} מתוך {steps.length}
            </span>
            <span className="text-[#2f6b63]">{steps[stepIndex]?.label}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/80 shadow-inner">
            <div
              className="claim-progress-fill h-full rounded-full bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#4ade80]"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {steps.map((s, idx) => {
              const done = idx < stepIndex;
              const active = idx === stepIndex;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                      active
                        ? "bg-[#2f6b63] text-white shadow-lg shadow-[#2f6b63]/35"
                        : done
                          ? "bg-[#2f6b63]/20 text-[#2f6b63]"
                          : "border border-white/80 bg-white/70 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={`hidden text-xs font-medium sm:inline ${active ? "text-[#143834]" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  {idx < steps.length - 1 ? (
                    <div className={`mx-1 h-px w-6 sm:w-10 ${done ? "bg-[#2f6b63]" : "bg-slate-200"}`} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="claim-rise claim-rise-d2 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_30px_80px_-40px_rgba(20,56,52,0.55)] backdrop-blur-xl">
          <div className="h-1.5 bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#4ade80]" />

          {step === "type" ? (
            <div className="p-6 sm:p-8">
              <div className="mb-5 text-center sm:text-right">
                <h2 className="text-2xl font-extrabold text-[#143834]">מה סוג התביעה?</h2>
                <p className="mt-1 text-sm text-slate-500">בחרו קטגוריה — נתאים עבורכם את השדות והמסמכים</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {claimTypesOrder.map((type, i) => {
                  const meta = claimTypeMeta[type];
                  const Icon = meta.icon;
                  const active = claimType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setClaimType(type);
                        if (type !== "baggage") setBaggageSubtype(null);
                      }}
                      className={`claim-type-card claim-rise flex min-h-[108px] items-start gap-4 rounded-2xl border border-slate-200/90 bg-white/95 p-4 text-right ${
                        active ? "active" : ""
                      }`}
                      style={{ animationDelay: `${0.08 + i * 0.06}s` }}
                    >
                      <div
                        className={`relative z-10 mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                          active
                            ? "bg-gradient-to-br from-[#1f4b46] to-[#2f6b63] text-white shadow-md shadow-[#2f6b63]/30"
                            : "bg-[#e8f4f1] text-[#2f6b63]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="relative z-10 min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold leading-snug text-[#143834]">{meta.title}</div>
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                              active ? "border-[#2f6b63] bg-[#2f6b63] text-white" : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="mt-1 text-sm leading-relaxed text-slate-500">{meta.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {claimType === "baggage" ? (
                <div className="mt-5 rounded-2xl border border-[#2f6b63]/15 bg-gradient-to-l from-[#e8f4f1] to-white p-4">
                  <h3 className="text-base font-extrabold text-[#143834]">מה קרה לכבודה?</h3>
                  <p className="mt-1 text-sm text-slate-500">בחרו אחת מהאפשרויות כדי להמשיך</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {baggageSubtypeOrder.map((key) => {
                      const meta = baggageSubtypeMeta[key];
                      const active = baggageSubtype === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setBaggageSubtype(key)}
                          className={`rounded-2xl border px-3 py-3 text-right transition ${
                            active
                              ? "border-[#2f6b63] bg-[#2f6b63]/8 shadow-sm ring-1 ring-[#2f6b63]/20"
                              : "border-slate-200 bg-white hover:border-[#2f6b63]/35"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-[#143834]">{meta.title}</div>
                              <div className="mt-0.5 text-xs text-slate-500">{meta.subtitle}</div>
                            </div>
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                active ? "border-[#2f6b63] bg-[#2f6b63] text-white" : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <Button
                type="button"
                className="claim-cta mt-6 h-12 w-full rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-base font-bold text-white shadow-lg shadow-[#2f6b63]/25 disabled:opacity-50"
                size="lg"
                disabled={!claimType || (claimType === "baggage" && !baggageSubtype)}
                onClick={() => {
                  setLookupError("");
                  setStep("identity");
                }}
              >
                המשך לזיהוי לקוח
              </Button>
            </div>
          ) : null}

          {step === "identity" ? (
            <div className="p-6 sm:p-8">
              {claimType && activeMeta ? (
                <div className="mb-5 rounded-2xl border border-[#2f6b63]/10 bg-gradient-to-l from-[#e8f4f1] to-white p-4">
                  <p className="text-xs font-bold tracking-wide text-[#2f6b63]">{activeMeta.short}</p>
                  <h2 className="text-xl font-extrabold text-[#143834]">{activeMeta.title}</h2>
                </div>
              ) : null}
              <h2 className="text-2xl font-extrabold text-[#143834]">זיהוי לפי תעודת זהות</h2>
              <p className="mt-1 text-sm text-slate-500">
                נאתר את הפרטים והפוליסות שלך במערכת. אם לא נמצא לפי ת״ז — הזינו גם מספר פוליסה
              </p>
              <div className="mt-6 max-w-md space-y-4">
                <Field label="תעודת זהות" required error={lookupError}>
                  <Input
                    className="bg-slate-50 text-lg tracking-wide"
                    inputMode="numeric"
                    maxLength={9}
                    value={lookupId}
                    onChange={(e) => {
                      setLookupId(e.target.value.replace(/[^\d]/g, "").slice(0, 9));
                      if (lookupError) setLookupError("");
                    }}
                    placeholder="9 ספרות"
                  />
                </Field>
                <Field label="מספר פוליסה (אם לא מזהה לפי ת״ז)">
                  <Input
                    className="bg-slate-50 text-lg tracking-wide"
                    inputMode="numeric"
                    value={lookupPolicyNumber}
                    onChange={(e) => {
                      setLookupPolicyNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 20));
                      if (lookupError) setLookupError("");
                    }}
                    placeholder="לדוגמה 965708637026"
                  />
                </Field>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => setStep("type")}>
                  חזרה
                </Button>
                <Button
                  type="button"
                  className="claim-cta h-11 rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white shadow-lg shadow-[#2f6b63]/20 sm:min-w-[220px]"
                  disabled={isLookingUp || lookupId.length < 5}
                  onClick={handleIdentityLookup}
                >
                  {isLookingUp ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      מזהה...
                    </>
                  ) : (
                    "זיהוי והמשך"
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "policy" ? (
            <div className="flex flex-col p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold text-[#143834]">באיזו פוליסה להגיש תביעה?</h2>
              <p className="mt-1 text-sm text-slate-500">
                {crmCustomer?.primaryName ? `שלום ${crmCustomer.primaryName} — ` : ""}
                {policyFilterCopy.listHint}
              </p>

              <div className="mt-5 max-h-[min(58vh,620px)] space-y-6 overflow-y-auto pe-1">
                {groupedPolicies.upcomingByYear.length ? (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f4f1] text-[#2f6b63]">
                        <Plane className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#143834]">{policyFilterCopy.upcomingTitle}</h3>
                        <p className="text-xs text-slate-500">{groupedPolicies.upcoming.length} פוליסות</p>
                      </div>
                    </div>
                    {groupedPolicies.upcomingByYear.map(({ year, policies }) => (
                      <div key={`up-${year}`}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-[#e8f4f1] px-2.5 py-0.5 text-xs font-bold text-[#2f6b63]">
                            {year || "ללא שנה"}
                          </span>
                          <span className="text-xs text-slate-400">{policies.length}</span>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">{policies.map(renderPolicyCard)}</div>
                      </div>
                    ))}
                  </section>
                ) : null}

                {pastPoliciesThisYear.length ? (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <History className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#143834]">{policyFilterCopy.pastTitle}</h3>
                        <p className="text-xs text-slate-500">
                          {pastPoliciesThisYear.reduce((s, g) => s + g.policies.length, 0)} פוליסות · {currentPolicyYear}
                        </p>
                      </div>
                    </div>
                    {pastPoliciesThisYear.map(({ year, policies }) => (
                      <div key={`past-now-${year}`}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            {year || "ללא שנה"}
                          </span>
                          <span className="text-xs text-slate-400">{policies.length}</span>
                        </div>
                        <div className="grid gap-2.5 sm:grid-cols-2">{policies.map(renderPolicyCard)}</div>
                      </div>
                    ))}
                  </section>
                ) : null}

                {pastPoliciesOlderYears.length ? (
                  <section className="space-y-4">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-right transition hover:border-slate-300 hover:bg-slate-50"
                      onClick={() => setShowPastYearsPolicies((v) => !v)}
                      aria-expanded={showPastYearsPolicies}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <History className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-extrabold text-[#143834]">
                            {showPastYearsPolicies ? "הסתר פוליסות של שנים קודמות" : "הצג פוליסות של שנים קודמות"}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {pastOlderCount} פוליסות · {pastPoliciesOlderYears.length} שנים
                          </p>
                        </div>
                      </div>
                      {showPastYearsPolicies ? (
                        <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                      )}
                    </button>
                    {showPastYearsPolicies ? (
                      <div className="space-y-4">
                        {pastPoliciesOlderYears.map(({ year, policies }) => (
                          <div key={`past-old-${year}`}>
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                                {year || "ללא שנה"}
                              </span>
                              <span className="text-xs text-slate-400">{policies.length}</span>
                            </div>
                            <div className="grid gap-2.5 sm:grid-cols-2">{policies.map(renderPolicyCard)}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>

              {lookupError ? <p className="mt-3 text-xs text-rose-600">{lookupError}</p> : null}
              <div className="sticky bottom-0 z-10 mt-4 -mx-6 border-t border-slate-100 bg-white/95 px-6 pb-1 pt-4 backdrop-blur sm:-mx-8 sm:px-8">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => setStep("identity")}>
                    חזרה
                  </Button>
                  <Button
                    type="button"
                    className="claim-cta h-11 rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white shadow-lg shadow-[#2f6b63]/20 sm:min-w-[220px]"
                    disabled={!selectedPolicyUid}
                    onClick={handlePolicyContinue}
                  >
                    המשך למילוי פרטים
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {step === "blocked" ? (
            <div className="p-6 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f4f1] text-[#2f6b63]">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#143834]">
                {blockedReason === "no_match" ? policyFilterCopy.emptyTitle : "לא מצאנו פוליסה במערכת"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                {blockedReason === "no_match"
                  ? policyFilterCopy.emptyBody
                  : "הגשת תביעה אפשרית רק ללקוחות עם פוליסת נסיעות אצלנו. אם רכשתם אצלנו או שאתם חושבים שיש טעות — נשמח לעזור בטלפון או במייל."}
              </p>
              <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
                <a
                  href={CLAIM_CONTACT.phoneHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#2f6b63]/25"
                >
                  <Phone className="h-4 w-4" />
                  {CLAIM_CONTACT.phoneDisplay}
                </a>
                <a
                  href={CLAIM_CONTACT.emailHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#143834]"
                >
                  <Mail className="h-4 w-4 text-[#2f6b63]" />
                  {CLAIM_CONTACT.email}
                </a>
              </div>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                {blockedReason === "no_match" ? (
                  <Button
                    type="button"
                    className="h-11 rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white"
                    onClick={() => {
                      setLookupError("");
                      setCrmPolicies([]);
                      setCrmCustomer(null);
                      setSelectedPolicyUid("");
                      setClaimType(null);
                      setBaggageSubtype(null);
                      setStep("type");
                    }}
                  >
                    בחירת סוג תביעה אחר
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-2xl"
                  onClick={() => {
                    setLookupError("");
                    setStep("identity");
                  }}
                >
                  ניסיון עם תעודת זהות אחרת
                </Button>
              </div>
            </div>
          ) : null}

          {step === "details" && claimType && activeMeta ? (
            <form
              className="space-y-8 p-6 sm:p-9"
              onSubmit={(e) => {
                e.preventDefault();
                if (validateDetails()) setStep("files");
              }}
            >
              <div className="rounded-2xl border border-[#2f6b63]/10 bg-gradient-to-l from-[#e8f4f1] to-white p-4">
                <p className="text-xs font-bold tracking-wide text-[#2f6b63]">{activeMeta.short}</p>
                <h2 className="text-xl font-extrabold text-[#143834]">{activeMeta.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {crmCustomer?.primaryName ? `שלום ${crmCustomer.primaryName} — ` : ""}
                  הפרטים נמשכו מהמערכת. ניתן לעדכן טלפון ואימייל במידת הצורך
                  {claimType === "baggage" && baggageSubtype
                    ? ` · סוג מטען: ${baggageSubtypeMeta[baggageSubtype].title}`
                    : ""}
                </p>
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
                    <Input className="bg-slate-100" inputMode="numeric" value={formData.idNumber} readOnly />
                  </Field>
                  <Field label="תאריך לידה" required error={errors.birthDate}>
                    <ClaimDateInput value={formData.birthDate} onChange={(v) => setField("birthDate", v)} />
                  </Field>
                  <Field label="טלפון נייד" required error={errors.mobile}>
                    <Input className="bg-slate-50" value={formData.mobile} onChange={(e) => setField("mobile", e.target.value)} />
                  </Field>
                  <Field label="אימייל" required error={errors.email}>
                    <Input className="bg-slate-50" type="email" value={formData.email} onChange={(e) => setField("email", e.target.value)} />
                  </Field>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">ב. פרטי הפוליסה</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="מספר פוליסה" required error={errors.policyNumber} className="sm:col-span-2">
                    <Input className="bg-slate-100" value={formData.policyNumber} readOnly />
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
                    <ClaimDateInput value={formData.tripStartDate} onChange={(v) => setField("tripStartDate", v)} />
                  </Field>
                  <Field label="תאריך חזרה לארץ">
                    <ClaimDateInput value={formData.tripEndDate} onChange={(v) => setField("tripEndDate", v)} />
                  </Field>
                </div>
                {claimType !== "trip_cancel" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="תאריך האירוע" required error={errors.incidentDate}>
                      <ClaimDateInput value={formData.incidentDate} onChange={(v) => setField("incidentDate", v)} />
                    </Field>
                    <Field
                      label={
                        claimType === "trip_shorten" ? "הארץ בה אירע המקרה" : "הארץ בה אירע המקרה"
                      }
                      required
                      error={errors.country}
                    >
                      <Input className="bg-slate-50" value={formData.country} onChange={(e) => setField("country", e.target.value)} />
                    </Field>
                  </div>
                ) : null}
                <Field label="תיאור מדויק ומפורט של המקרה" required error={errors.details}>
                  <Textarea
                    className="min-h-[120px] bg-slate-50"
                    value={formData.details}
                    onChange={(e) => setField("details", e.target.value)}
                  />
                </Field>
                {claimType === "trip_shorten" ? (
                  <ClaimAmountCurrencyFields
                    amount={formData.claimAmount}
                    currency={formData.claimCurrency}
                    destination={formData.country}
                    amountError={errors.claimAmount}
                    currencyError={errors.claimCurrency}
                    onAmountChange={(v) => setField("claimAmount", v)}
                    onCurrencyChange={(v) => setField("claimCurrency", v)}
                  />
                ) : null}
              </section>

              {claimType === "medical" || claimType === "trip_cancel" ? (
                <section className="space-y-4">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">
                    {claimType === "medical" ? "ה. פירוט מרכיבי התביעה" : "ה. פירוט הוצאות"}
                    <span className="mr-1 text-rose-500">*</span>
                  </h3>
                  <ClaimAmountCurrencyFields
                    amount={formData.claimAmount}
                    currency={formData.claimCurrency}
                    destination={formData.country}
                    amountError={errors.claimAmount}
                    currencyError={errors.claimCurrency}
                    onAmountChange={(v) => setField("claimAmount", v)}
                    onCurrencyChange={(v) => setField("claimCurrency", v)}
                  />
                  <div className="space-y-3">
                    {expenses.map((row, idx) => (
                      <div
                        key={idx}
                        className={`grid gap-3 rounded-xl border p-3 sm:grid-cols-[1.1fr_1fr_1fr_auto_auto] ${
                          errors.expenses ? "border-rose-300" : "border-slate-200"
                        }`}
                      >
                        <ClaimDateInput
                          value={row.date}
                          onChange={(v) => {
                            const next = [...expenses];
                            next[idx] = { ...row, date: v };
                            setExpenses(next);
                            if (errors.expenses) {
                              setErrors((prev) => {
                                const { expenses: _e, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          aria-label={claimType === "medical" ? "תאריך טיפול" : "תאריך הוצאה"}
                          placeholder={claimType === "medical" ? "תאריך טיפול *" : "תאריך הוצאה *"}
                          required
                        />
                        <Input
                          className="bg-slate-50"
                          value={row.type}
                          onChange={(e) => {
                            const next = [...expenses];
                            next[idx] = { ...row, type: e.target.value };
                            setExpenses(next);
                            if (errors.expenses) {
                              setErrors((prev) => {
                                const { expenses: _e, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          placeholder="סוג הוצאה *"
                          required
                        />
                        <Input
                          className="bg-slate-50"
                          inputMode="decimal"
                          value={row.amount}
                          onChange={(e) => {
                            const next = [...expenses];
                            next[idx] = { ...row, amount: e.target.value };
                            setExpenses(next);
                            if (errors.expenses) {
                              setErrors((prev) => {
                                const { expenses: _e, ...rest } = prev;
                                return rest;
                              });
                            }
                          }}
                          placeholder="סכום *"
                          required
                        />
                        <ClaimCurrencyPicker
                          compact
                          value={row.currency || formData.claimCurrency || "USD"}
                          onChange={(code) => {
                            const next = [...expenses];
                            next[idx] = { ...row, currency: code };
                            setExpenses(next);
                          }}
                          aria-label={`מטבע להוצאה ${idx + 1}`}
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
                  {errors.expenses ? <p className="text-xs text-rose-600">{errors.expenses}</p> : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setExpenses([...expenses, emptyExpense(formData.claimCurrency || "USD")])}
                  >
                    <Plus className="h-4 w-4" />
                    הוסף הוצאה
                  </Button>
                  {claimType === "medical" ? (
                    <>
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
                    </>
                  ) : null}
                </section>
              ) : null}

              {claimType === "baggage" ? (
                <section className="space-y-4">
                  <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">ה. פירוט מרכיבי התביעה</h3>
                  {isBaggageDelay ? (
                    <ClaimAmountCurrencyFields
                      amount="155"
                      currency="USD"
                      locked
                      lockedHint="אין צורך בפירוט פריטים — הסכום נקבע לפי תנאי הפוליסה לאיחור כבודה."
                      onAmountChange={() => undefined}
                      onCurrencyChange={() => undefined}
                    />
                  ) : (
                    <>
                      <div className="space-y-3">
                        {baggageItems.map((row, idx) => (
                          <div key={idx} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-3">
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
                              value={row.purchasePrice}
                              onChange={(e) => {
                                const next = [...baggageItems];
                                next[idx] = { ...row, purchasePrice: e.target.value, purchaseDate: "" };
                                setBaggageItems(next);
                              }}
                              placeholder="ערך הפריט"
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
                      <ClaimAmountCurrencyFields
                        amount={formData.claimAmount}
                        currency={formData.claimCurrency}
                        destination={formData.country}
                        amountError={errors.claimAmount}
                        currencyError={errors.claimCurrency}
                        onAmountChange={(v) => setField("claimAmount", v)}
                        onCurrencyChange={(v) => setField("claimCurrency", v)}
                      />
                    </>
                  )}
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
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm"
                      value={formData.bankCode}
                      onChange={(e) => selectBank(e.target.value)}
                    >
                      <option value="">בחרו בנק</option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="מספר חשבון" required error={errors.accountNumber}>
                    <Input className="bg-slate-50" value={formData.accountNumber} onChange={(e) => setField("accountNumber", e.target.value)} />
                  </Field>
                  <Field label="סניף (חיפוש לפי שם / מספר / עיר)" required error={errors.branchNumber} className="sm:col-span-2">
                    <div className="relative">
                      <Input
                        className="bg-slate-50"
                        disabled={!formData.bankCode}
                        placeholder={formData.bankCode ? "הקלידו שם סניף, מספר או עיר" : "בחרו בנק קודם"}
                        value={
                          branchMenuOpen
                            ? branchQuery
                            : formData.branchNumber
                              ? `${formData.branchNumber} · ${formData.branchName}`
                              : branchQuery
                        }
                        onFocus={() => {
                          setBranchMenuOpen(true);
                          setBranchQuery("");
                        }}
                        onChange={(e) => {
                          const q = e.target.value;
                          setBranchQuery(q);
                          setBranchMenuOpen(true);
                          const match = findBranchByCode(bankBranches, q);
                          if (match) selectBranch(match);
                          else setField("branchNumber", q.replace(/[^\d]/g, ""));
                        }}
                        onBlur={() => {
                          // allow click on suggestion
                          window.setTimeout(() => setBranchMenuOpen(false), 150);
                        }}
                      />
                      {branchMenuOpen && formData.bankCode ? (
                        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                          {branchSuggestions.length ? (
                            branchSuggestions.map((branch) => (
                              <button
                                key={`${branch.bankCode}-${branch.code}`}
                                type="button"
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-right text-sm hover:bg-[#e8f4f1]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectBranch(branch)}
                              >
                                <span className="font-semibold text-[#143834]">
                                  {branch.code} · {branch.name}
                                </span>
                                <span className="text-xs text-slate-500">{branch.city}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-500">לא נמצאו סניפים תואמים</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </Field>
                </div>
                <p className="text-xs text-slate-500">
                  בחירת בנק וסניף מבוססת על נתוני בנק ישראל. מעל 15,000 ₪ יש לצרף צילום שיק / אישור בנק על פרטי החשבון.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="border-b border-slate-100 pb-2 text-sm font-bold text-[#1a4a45]">הצהרות</h3>
                <label className="flex items-start gap-3 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.declaration}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev,
                        declaration: checked,
                        authorizeAgent: checked,
                        medicalWaiver:
                          claimType === "medical" || claimType === "trip_cancel" || claimType === "trip_shorten"
                            ? checked
                            : false,
                      }));
                      if (errors.declaration) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.declaration;
                          delete next.medicalWaiver;
                          return next;
                        });
                      }
                    }}
                  />
                  <span>
                    אני מאשר/ת כי הפרטים שמסרתי נכונים ומלאים; מאשר/ת לסוכן הביטוח לטפל בתביעה זו בשמי
                    {claimType === "medical" || claimType === "trip_cancel" || claimType === "trip_shorten"
                      ? "; ומוותר/ת על סודיות רפואית ומסמיך/ה את הראל לקבל מידע רפואי לצורך בירור התביעה"
                      : ""}
                    .
                  </span>
                </label>
                {errors.declaration ? <p className="text-xs text-rose-600">{errors.declaration}</p> : null}
                {formData.declaration ? (
                  <Field label="שם הסוכן (אופציונלי)">
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
                  <span>אני מסכים/ה לקבל הצעות שיווקיות מאופיר ושות׳ סוכנות לביטוח (אופציונלי)</span>
                </label>
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-2xl"
                  onClick={() => setStep(relevantPolicies.length > 1 ? "policy" : "identity")}
                >
                  חזרה
                </Button>
                <Button
                  type="submit"
                  className="claim-cta h-11 rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white shadow-lg shadow-[#2f6b63]/20 sm:min-w-[220px]"
                  size="lg"
                >
                  המשך לצירוף מסמכים
                </Button>
              </div>
            </form>
          ) : null}

          {step === "files" && claimType && activeMeta ? (
            <div className="p-6 sm:p-9">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#143834]">צרפו מסמכים</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {docsComplete
                    ? "כל מסמכי החובה צורפו — אפשר לשלוח"
                    : `${requiredDocsDone} מתוך ${requiredDocsCount} מסמכי חובה · אפשר גם לשלוח בלי הכל`}
                </p>
              </div>

              {(() => {
                const requiredList = documentRequirements.filter((d) => d.required);
                const optionalList = documentRequirements.filter((d) => !d.required);
                const renderDocRow = (doc: (typeof documentRequirements)[number], required: boolean) => {
                  const attached = docFiles[doc.id] || [];
                  const done = attached.length > 0;
                  return (
                    <div
                      key={doc.id}
                      className={`rounded-xl border px-3.5 py-3 transition ${
                        done
                          ? "border-emerald-200/80 bg-emerald-50/50"
                          : "border-slate-100 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            done
                              ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                              : "border border-slate-200 bg-transparent text-slate-300"
                          }`}
                          aria-hidden
                        >
                          {done ? <Check className="h-4 w-4 stroke-[2.5]" /> : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className={`text-sm font-semibold ${done ? "text-emerald-800" : "text-slate-800"}`}>
                              {doc.label}
                            </p>
                            {done ? (
                              <span className="text-[11px] font-semibold text-emerald-600">צורף</span>
                            ) : required ? (
                              <span className="text-[11px] text-slate-400">חובה</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">לא חובה</span>
                            )}
                          </div>
                          {doc.hint ? (
                            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{doc.hint}</p>
                          ) : null}

                          {attached.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                              {attached.map((file, fileIndex) => (
                                <li
                                  key={`${doc.id}-${file.name}-${file.lastModified}-${fileIndex}`}
                                  className="flex items-center gap-2 text-xs text-slate-600"
                                >
                                  <span className="min-w-0 flex-1 truncate" title={file.name}>
                                    {file.name}
                                  </span>
                                  <span className="shrink-0 text-[11px] text-slate-400">
                                    {formatClaimFileSize(file.size)}
                                  </span>
                                  <button
                                    type="button"
                                    className="shrink-0 text-slate-400 hover:text-rose-500"
                                    onClick={() => removeDocFile(doc.id, fileIndex)}
                                  >
                                    הסרה
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          <label
                            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2f6b63] transition hover:text-[#1f4b46] ${
                              isPreparingFiles ? "pointer-events-none opacity-50" : "cursor-pointer"
                            }`}
                          >
                            <FileUp className="h-3.5 w-3.5" />
                            {isPreparingFiles ? "מכין קובץ..." : done ? "הוספת קובץ" : "בחירת קובץ"}
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              disabled={isPreparingFiles}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic,application/pdf,image/*"
                              onChange={(e) => {
                                void addDocFiles(doc.id, e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-5">
                    <section className="space-y-2">
                      <h3 className="text-xs font-semibold tracking-wide text-slate-400">מה צריך לצרף</h3>
                      <div className="space-y-2">{requiredList.map((doc) => renderDocRow(doc, true))}</div>
                    </section>

                    {optionalList.length ? (
                      <section className="space-y-2">
                        <h3 className="text-xs font-semibold tracking-wide text-slate-400">רק אם רלוונטי</h3>
                        <div className="space-y-2">{optionalList.map((doc) => renderDocRow(doc, false))}</div>
                      </section>
                    ) : null}
                  </div>
                );
              })()}

              <div className="mt-5">
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 transition hover:text-[#2f6b63] disabled:opacity-50"
                  disabled={isPreparingFiles}
                  onClick={() => {
                    const input = document.getElementById("claim-extra-files-input") as HTMLInputElement | null;
                    input?.click();
                  }}
                >
                  + קובץ נוסף שלא ברשימה
                </button>
                <input
                  id="claim-extra-files-input"
                  type="file"
                  multiple
                  className="hidden"
                  disabled={isPreparingFiles}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic,application/pdf,image/*"
                  onChange={(e) => {
                    void addExtraFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {extraFiles.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {extraFiles.map((file, index) => (
                      <li
                        key={`extra-${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center gap-2 text-xs text-slate-600"
                      >
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatClaimFileSize(file.size)}
                        </span>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-500"
                          onClick={() => removeExtraFileAt(index)}
                        >
                          הסרה
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {isPreparingFiles || filePrepareNote ? (
                <p className="mt-3 text-xs text-[#2f6b63]">
                  {isPreparingFiles ? "בודק ומכווץ קבצים גדולים..." : filePrepareNote}
                </p>
              ) : null}
              {errors.files ? <p className="mt-3 text-sm text-rose-600">{errors.files}</p> : null}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setStep("details")} disabled={isSubmitting}>
                  חזרה
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={isSubmitting || isPreparingFiles}
                  className="claim-cta h-11 rounded-xl bg-[#2f6b63] text-sm font-semibold text-white hover:bg-[#265a53] sm:min-w-[200px] disabled:opacity-50"
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      שליחת תביעה
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "sending" ? (
            <div className="px-6 py-14 text-center sm:px-10 sm:py-16">
              <div className="relative mx-auto mb-7 h-24 w-24">
                <div className="claim-send-glow absolute inset-0 rounded-full bg-[#2f6b63]/15" />
                <div className="claim-send-ring absolute inset-0 rounded-full border-[3px] border-[#2f6b63]/15 border-t-[#2f6b63]" />
                <div className="absolute inset-0 flex items-center justify-center text-[#2f6b63]">
                  <Send className="h-8 w-8" />
                </div>
              </div>
              <p className="text-xs font-bold tracking-wide text-[#2f6b63]">שליחת תביעה</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#143834]">
                {submitPhaseCopy[submitPhase].title}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {submitPhaseCopy[submitPhase].body}
              </p>
              <div className="mx-auto mt-6 h-1.5 max-w-[220px] overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#2f6b63] transition-all duration-500"
                  style={{
                    width:
                      submitPhase === "preparing" ? "28%" : submitPhase === "uploading" ? "62%" : "88%",
                  }}
                />
              </div>
              <p className="mt-4 text-xs text-slate-400">נא לא לסגור את החלון עד לסיום</p>
            </div>
          ) : null}

          {step === "success" ? (
            <div className="p-6 text-center sm:p-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f4f1] text-[#2f6b63]">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#143834]">התביעה נשלחה בהצלחה</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                הפרטים התקבלו אצל אופיר ושות׳ סוכנות לביטוח. שמרו את מספר התביעה באופיר למעקב מולנו.
              </p>
              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[#2f6b63]/15 bg-gradient-to-l from-[#e8f4f1] to-white p-5 text-right">
                <p className="text-xs font-bold text-[#2f6b63]">מספר תביעה באופיר</p>
                <p className="mt-1 font-mono text-2xl font-extrabold tracking-wide text-[#143834]" dir="ltr">
                  {submittedClaimNumber}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  זה מספר מעקב פנימי אצל אופיר ושות׳ — לא מספר תביעה בהראל או בחברת הביטוח.
                </p>
                {submittedSummary ? (
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                    <li>
                      <span className="font-bold text-[#143834]">שם: </span>
                      {submittedSummary.fullName}
                    </li>
                    <li>
                      <span className="font-bold text-[#143834]">סוג: </span>
                      {submittedSummary.claimTypeLabel}
                    </li>
                    <li>
                      <span className="font-bold text-[#143834]">אימייל: </span>
                      {submittedSummary.email}
                    </li>
                    <li>
                      <span className="font-bold text-[#143834]">קבצים: </span>
                      {submittedSummary.filesCount}
                    </li>
                  </ul>
                ) : null}
              </div>
              <p className="mt-4 text-xs text-slate-500">העתק נשלח לצוות הטיפול בתביעות (רני / אלי).</p>
              <Button
                type="button"
                className="claim-cta mt-6 h-11 rounded-2xl bg-gradient-to-l from-[#1f4b46] via-[#2f6b63] to-[#3f8677] text-white"
                onClick={() => {
                  setSubmittedClaimNumber("");
                  setSubmittedSummary(null);
                  setStep("type");
                }}
              >
                תביעה חדשה
              </Button>
            </div>
          ) : null}
        </div>

        <p className="claim-rise claim-rise-d3 mt-6 text-center text-xs text-slate-500">
          השליחה מאובטחת · הפרטים ישמשו לטיפול בתביעה בלבד
        </p>
      </div>
    </div>
  );
};

export default Claim;
