import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Loader2, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";
import { ArrowIcon, agencyField, agencyLabel } from "@/components/AgencyUi";
import {
  GET_BY_IDU_AFFILIATES,
  SPECIAL_DISCOUNT_AFF_TO_PERCENT,
  SPECIAL_DISCOUNT_SWITCH_LINKS,
  birthDateParts,
  buildHarelUrl,
  calculateAge,
  extractSpecialDiscountPercent,
  getQueryParam,
  isValidIsraeliId,
  isoToDDMMYYYY,
  lookupPersonById,
  fetchShatapName,
  fetchTravelerHistory,
  resolveUnknownPriorConditions,
  normalizeIdValue,
  queryDateToIso,
  sanitizeNameInput,
  validateTraveler,
  type AdditionalCustomer,
  type CustomerForm,
  type PriorConditionInfo,
  type SpecialDiscountInfo,
  type PersonLookupResult,
  type TravelerHistory,
} from "@/lib/purchase/harel";

/*
 * New purchase flow (travelers → dates → summary → Harel), live at /purchase-v2.
 * Same CRM lookup, validation rules and Harel parameters as the current form
 * (src/pages/BuyInsNew.tsx) via src/lib/purchase/harel.ts. Details found in the CRM
 * are shown in full; the customer only types what's missing.
 */

type Step = 1 | 2 | 3;
type Source = "crm" | "manual";
type Traveler = { key: string; source: Source; data: CustomerForm };

const STEPS = ["נוסעים", "תאריכים", "סיכום"];
const DEFAULT_AFF = "709";

const EMPTY: CustomerForm = {
  id: "",
  gender: "",
  firstNameHe: "",
  lastNameHe: "",
  firstNameEn: "",
  lastNameEn: "",
  birthDate: "",
  email: "",
  phone: "",
};

const fromAdditional = (c: AdditionalCustomer): CustomerForm => ({
  id: normalizeIdValue(c.personId),
  gender: c.gender,
  firstNameHe: c.firstNameHe,
  lastNameHe: c.lastNameHe,
  firstNameEn: c.firstNameEn,
  lastNameEn: c.lastNameEn,
  birthDate: c.birthDate,
  email: c.email,
  phone: c.phone,
});

/* ---------- display (details are shown in full; Harel shows them again anyway) ---------- */

// LTR-isolated so numbers/emails keep their order inside Hebrew text
const ltr = (s: string) => `⁦${s}⁩`;
const showId = (id: string) => ltr(normalizeIdValue(id));
const showPhone = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  if (!d) return "";
  return ltr(d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3)}` : d);
};
const showEmail = (email: string) => (email.trim() ? ltr(email.trim()) : "");
const firstName = (c: CustomerForm) => c.firstNameHe || c.firstNameEn;
const displayName = (c: CustomerForm) => {
  const he = `${c.firstNameHe} ${c.lastNameHe}`.trim();
  const en = `${c.firstNameEn} ${c.lastNameEn}`.trim();
  return he || en || "נוסע/ת";
};
const formatBirthDate = (value: string) => {
  const p = birthDateParts(value);
  return p ? `${p.day}/${p.month}/${p.year}` : "";
};

/** One-line facts for a traveler: ID, birth date, phone, email. */
const factsOf = (c: CustomerForm) =>
  [
    c.id ? `ת״ז ${showId(c.id)}` : "",
    formatBirthDate(c.birthDate) ? `תאריך לידה ${formatBirthDate(c.birthDate)}` : "",
    showPhone(c.phone),
    showEmail(c.email),
  ].filter(Boolean);

const normalizeName = (s: string) => s.replace(/["'׳״`\-\s]/g, "").toLowerCase();
/** Family = same last name (Hebrew or English) as the main traveler; past co-travelers are left out. */
const isSameFamily = (primary: CustomerForm, other: CustomerForm) =>
  (Boolean(primary.lastNameHe) && normalizeName(primary.lastNameHe) === normalizeName(other.lastNameHe)) ||
  (Boolean(primary.lastNameEn) && normalizeName(primary.lastNameEn) === normalizeName(other.lastNameEn));

const isAdult = (c: CustomerForm) => {
  const age = calculateAge(c.birthDate);
  return age === null || age >= 18;
};

/* ---------- styles ---------- */

const btnPrimary =
  "inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[18px] border-0 bg-[#00A247] px-6 font-[inherit] text-[19px] font-extrabold text-[#000144] transition-colors hover:bg-[#008C3D] disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-[14px] border-2 border-[#D5DAE3] bg-white px-4 font-[inherit] text-[16px] font-bold text-[#000144] hover:border-[#000144]";
const linkBtn =
  "min-h-[44px] cursor-pointer self-start border-0 bg-transparent p-0 font-[inherit] text-[15px] font-bold text-[#000144] underline underline-offset-4";
const card = "box-border flex flex-col gap-5 rounded-[28px] border-2 border-[#E3E7EE] bg-white p-5 md:p-8";
const h2 = "m-0 text-[26px] font-black leading-[1.1] md:text-[32px]";
const lead = "m-0 text-[17px] font-medium text-[#33405F]";
const errorText = "m-0 text-[15px] font-semibold text-[#B42318]";

const Facts = ({ facts }: { facts: string[] }) => (
  <span className="text-[14px] font-semibold leading-[1.5] text-[#46557A]">
    {facts.map((fact, i) => (
      <span key={fact}>
        {i > 0 && " · "}
        {/* nowrap: a phone number or email never breaks across lines */}
        <span className="whitespace-nowrap">{fact}</span>
      </span>
    ))}
  </span>
);

/* ---------- partner-link badges (same info the current form shows for GetByIdU partners) ---------- */

const PRIOR_TEXT: Record<PriorConditionInfo["status"], string> = {
  yes: "החמרה למחלה קיימת: כן",
  no: "החמרה למחלה קיימת: לא",
  unknown: "החמרה למחלה קיימת: אין נתון",
};
const PRIOR_STYLE: Record<PriorConditionInfo["status"], string> = {
  yes: "border-[#F3B6B0] bg-[#FDECEA] text-[#8A1C12]",
  no: "border-[#B7E4C7] bg-[#E6F6ED] text-[#0B5E2E]",
  unknown: "border-[#D5DAE3] bg-white text-[#46557A]",
};

const PartnerBadges = ({
  prior,
  discount,
  currentAff,
  onSwitchAff,
  resolving,
}: {
  prior?: PriorConditionInfo;
  discount?: SpecialDiscountInfo;
  currentAff: string;
  onSwitchAff: (aff: string) => void;
  /** Background policy lookups still running for unknown statuses */
  resolving: boolean;
}) => {
  const lastPercent = discount ? extractSpecialDiscountPercent(discount.discountLabel) : "";
  const currentPercent = SPECIAL_DISCOUNT_AFF_TO_PERCENT[currentAff] || "";
  const switchTo = lastPercent && currentPercent && lastPercent !== currentPercent ? SPECIAL_DISCOUNT_SWITCH_LINKS[lastPercent] : undefined;
  if (!prior && !discount) return null;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {prior && (
        <span className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-bold ${PRIOR_STYLE[prior.status]}`}>
          {prior.status === "unknown" && resolving ? (
            <>
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
              החמרה למחלה קיימת: בודקים…
            </>
          ) : (
            PRIOR_TEXT[prior.status]
          )}
        </span>
      )}
      {discount?.discountLabel && (
        <span className="inline-flex min-h-[28px] items-center rounded-full border border-[#C9D3EA] bg-[#E6ECFA] px-2.5 text-[13px] font-bold text-[#000144]">
          הנחה אחרונה: {discount.discountLabel}
        </span>
      )}
      {switchTo && (
        <button
          type="button"
          onClick={() => onSwitchAff(switchTo.aff)}
          className="inline-flex min-h-[32px] cursor-pointer items-center rounded-full border-2 border-[#000144] bg-white px-3 font-[inherit] text-[13px] font-bold text-[#000144] hover:bg-[#000144] hover:text-white"
        >
          מעבר ישיר להנחה {switchTo.label}
        </button>
      )}
    </span>
  );
};

/* ---------- traveler fields ---------- */

type FieldKey = "gender" | "names" | "birthDate" | "phone" | "email";

/**
 * Which inputs a traveler needs: all of them when typed by hand, only the gaps when found
 * in the CRM. Computed once when the traveler is added (so a field doesn't vanish mid-typing
 * the moment it becomes valid); "edit contact" adds phone + email on top.
 */
const planFields = (t: Traveler): FieldKey[] => {
  if (t.source === "manual") return ["gender", "names", "birthDate", "phone", "email"];
  const c = t.data;
  const fields: FieldKey[] = [];
  if (!c.gender) fields.push("gender");
  if (!c.firstNameEn.trim() || !c.lastNameEn.trim()) fields.push("names");
  if (!birthDateParts(c.birthDate)) fields.push("birthDate");
  const adult = isAdult(c);
  if (adult && c.phone.replace(/\D/g, "").length < 9) fields.push("phone");
  if (adult && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) fields.push("email");
  return fields;
};

const ALL_FIELDS: FieldKey[] = ["gender", "names", "birthDate", "phone", "email"];

/** Edit mode opens every field (prefilled), so CRM details can be corrected too. */
const withContact = (fields: FieldKey[], editing: boolean): FieldKey[] => (editing ? ALL_FIELDS : fields);

const TravelerFields = ({
  traveler,
  fields,
  onChange,
  idPrefix,
}: {
  traveler: Traveler;
  fields: FieldKey[];
  onChange: (patch: Partial<CustomerForm>) => void;
  idPrefix: string;
}) => {
  const c = traveler.data;
  const parts = birthDateParts(c.birthDate);
  // Local DMY state so partial typing isn't lost before the date is complete
  const [dob, setDob] = useState({ day: parts?.day || "", month: parts?.month || "", year: parts?.year || "" });
  const setDobPart = (k: "day" | "month" | "year", v: string) => {
    const next = { ...dob, [k]: v.replace(/\D/g, "") };
    setDob(next);
    const iso =
      next.day && next.month && next.year.length === 4
        ? queryDateToIso(`${next.day.padStart(2, "0")}/${next.month.padStart(2, "0")}/${next.year}`)
        : "";
    onChange({ birthDate: iso });
  };
  const adult = isAdult(c);
  // Prefilled with the current value so it can be corrected in place
  const [contactDraft] = useState({ phone: c.phone, email: c.email });

  if (fields.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {fields.includes("gender") && (
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className={`${agencyLabel} mb-1.5`}>מין</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {(
              [
                ["M", "זכר"],
                ["F", "נקבה"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={c.gender === v}
                onClick={() => onChange({ gender: v })}
                className={`min-h-[52px] cursor-pointer rounded-[14px] border-2 font-[inherit] text-[17px] font-bold ${
                  c.gender === v ? "border-[#000144] bg-[#000144] text-white" : "border-[#D5DAE3] bg-white text-[#000144]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {fields.includes("names") && (
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["firstNameEn", "שם פרטי (באנגלית)", "given-name"],
              ["lastNameEn", "שם משפחה (באנגלית)", "family-name"],
            ] as const
          ).map(([k, l, ac]) => (
            <div key={k} className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={`${idPrefix}-${k}`} className={agencyLabel}>{l}</label>
              <input
                id={`${idPrefix}-${k}`}
                dir="ltr"
                autoComplete={ac}
                value={c[k]}
                onChange={(e) => onChange({ [k]: sanitizeNameInput(e.target.value.replace(/[^A-Za-z' -]/g, "")) })}
                className={agencyField}
              />
            </div>
          ))}
        </div>
      )}
      {fields.includes("birthDate") && (
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className={`${agencyLabel} mb-1.5`}>תאריך לידה</legend>
          <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2.5" dir="ltr">
            {(
              [
                ["day", "יום", 2, "DD"],
                ["month", "חודש", 2, "MM"],
                ["year", "שנה", 4, "YYYY"],
              ] as const
            ).map(([k, l, max, ph]) => (
              <input
                key={k}
                aria-label={l}
                inputMode="numeric"
                maxLength={max}
                placeholder={ph}
                value={dob[k]}
                onChange={(e) => setDobPart(k, e.target.value)}
                className={`${agencyField} text-center`}
              />
            ))}
          </div>
        </fieldset>
      )}
      {fields.includes("phone") && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-phone`} className={agencyLabel}>
            טלפון נייד
            {adult ? <span className="text-[#B42318]"> * (חובה מגיל 18)</span> : " (לא חובה מתחת לגיל 18)"}
          </label>
          <input
            id={`${idPrefix}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="05X-XXXXXXX"
            defaultValue={contactDraft.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className={agencyField}
            style={{ textAlign: "right" }}
          />
        </div>
      )}
      {fields.includes("email") && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idPrefix}-email`} className={agencyLabel}>
            מייל
            {adult ? <span className="text-[#B42318]"> * (חובה מגיל 18)</span> : " (לא חובה מתחת לגיל 18)"}
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            placeholder="name@example.com"
            defaultValue={contactDraft.email}
            onChange={(e) => onChange({ email: e.target.value.trim() })}
            className={agencyField}
            style={{ textAlign: "right" }}
          />
        </div>
      )}
    </div>
  );
};

/* ---------- page ---------- */

const PurchaseV2 = () => {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [step, setStep] = useState<Step>(1);

  // Partner code (aid). Kept in state so the "switch discount" button applies instantly.
  const [aff, setAff] = useState(getQueryParam(params, ["aff", "shatapId", "id"]) || DEFAULT_AFF);
  const discountPercent = SPECIAL_DISCOUNT_AFF_TO_PERCENT[aff] || "";
  // Same audience as the current form's badges: partner links that use GetByIdU
  const showPartnerInfo = GET_BY_IDU_AFFILIATES.has(aff);

  // Partner name in the band, like the current form's top bar (not for our own direct code)
  const [shatapName, setShatapName] = useState("");
  useEffect(() => {
    setShatapName("");
    if (aff === DEFAULT_AFF) return;
    const controller = new AbortController();
    fetchShatapName(aff, controller.signal).then((name) => {
      if (!controller.signal.aborted) setShatapName(name);
    });
    return () => controller.abort();
  }, [aff]);
  const [priorById, setPriorById] = useState<Record<string, PriorConditionInfo>>({});
  const [discountById, setDiscountById] = useState<Record<string, SpecialDiscountInfo>>({});
  const switchAff = (next: string) => {
    setAff(next);
    const url = new URL(window.location.href);
    url.searchParams.set("aff", next);
    window.history.replaceState(null, "", url.toString());
  };
  const badges = (key: string) =>
    showPartnerInfo ? (
      <PartnerBadges prior={priorById[key]} discount={discountById[key]} currentAff={aff} onSwitchAff={switchAff} resolving={priorResolving} />
    ) : null;

  // Main traveler
  const [id, setId] = useState("");
  const [idError, setIdError] = useState("");
  const [checking, setChecking] = useState(false);
  const [lookupNote, setLookupNote] = useState("");
  const [primary, setPrimary] = useState<Traveler | null>(null);
  // Original CRM values, so clearing a contact field falls back to what the CRM has
  const crmOriginal = useRef<Record<string, CustomerForm>>({});
  const [editContact, setEditContact] = useState<Record<string, boolean>>({});
  // Fields each traveler is asked for, fixed when the traveler is added (see planFields)
  const fieldPlan = useRef<Record<string, FieldKey[]>>({});
  const track = (t: Traveler) => {
    fieldPlan.current[t.key] = planFields(t);
    return t;
  };

  // Companions
  const [familyOptions, setFamilyOptions] = useState<Traveler[]>([]);
  const [familySelected, setFamilySelected] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<Traveler[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addChecking, setAddChecking] = useState(false);
  const [addError, setAddError] = useState("");

  // Dates (prefilled from the homepage card)
  const [fromDate, setFromDate] = useState(queryDateToIso(getQueryParam(params, ["from", "From", "start", "startDate"])));
  const [toDate, setToDate] = useState(queryDateToIso(getQueryParam(params, ["to", "To", "end", "endDate"])));
  const [dateError, setDateError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const [travelerErrors, setTravelerErrors] = useState<Record<string, string[]>>({});
  const [redirecting, setRedirecting] = useState(false);

  const companions = [...familyOptions.filter((t) => familySelected.has(t.key)), ...extra];
  const travelers = primary ? [primary, ...companions] : [];

  /** Merge an edit into a traveler; a cleared contact field on CRM data falls back to the CRM value. */
  const patchData = (t: Traveler, patch: Partial<CustomerForm>): Traveler => {
    const original = crmOriginal.current[t.key];
    const next = { ...t.data, ...patch };
    if (t.source === "crm" && original) {
      if ("phone" in patch && !patch.phone?.trim()) next.phone = original.phone;
      if ("email" in patch && !patch.email?.trim()) next.email = original.email;
    }
    return { ...t, data: next };
  };
  const updateTraveler = (key: string, patch: Partial<CustomerForm>) => {
    setTravelerErrors((prev) => ({ ...prev, [key]: [] }));
    if (primary?.key === key) setPrimary((p) => (p ? patchData(p, patch) : p));
    setFamilyOptions((prev) => prev.map((t) => (t.key === key ? patchData(t, patch) : t)));
    setExtra((prev) => prev.map((t) => (t.key === key ? patchData(t, patch) : t)));
  };

  // Ignores results from an older lookup when the ID was changed in the meantime
  const lookupSeq = useRef(0);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [priorResolving, setPriorResolving] = useState(false);

  const applyHistory = (primaryData: CustomerForm, history: TravelerHistory | null, seq: number) => {
    if (!history) return;
    setPriorById(history.priorConditionById);
    setDiscountById(history.specialDiscountById);
    setFamilyOptions(
      history.additional
        .map(fromAdditional)
        .filter((c) => isSameFamily(primaryData, c))
        .map((c) => {
          crmOriginal.current[c.id] = c;
          return track({ key: c.id, source: "crm" as const, data: c });
        }),
    );
    // Slow per-policy lookups for "unknown" prior-condition statuses run in the background
    // (partner links only, where the badge is shown); badges update when they come back.
    const hasUnknown = Object.values(history.priorConditionById).some((i) => i.status === "unknown" && i.policyId);
    if (showPartnerInfo && hasUnknown) {
      setPriorResolving(true);
      resolveUnknownPriorConditions(history.priorConditionById, history.specialDiscountById)
        .then((res) => {
          if (seq !== lookupSeq.current) return;
          setPriorById(res.priorConditionById);
          setDiscountById(res.specialDiscountById);
        })
        .catch(() => undefined)
        .finally(() => {
          if (seq === lookupSeq.current) setPriorResolving(false);
        });
    }
  };

  /**
   * Shows the person as soon as the fast GetByPersonId answers; the slower policy history
   * (family, partner badges) arrives in the background.
   */
  const lookupPrimary = async () => {
    if (!isValidIsraeliId(id)) {
      setIdError("מספר תעודת הזהות לא תקין. בדקו את 9 הספרות");
      return;
    }
    const normalized = normalizeIdValue(id);
    const seq = ++lookupSeq.current;
    setIdError("");
    setLookupNote("");
    setChecking(true);
    setFamilyOptions([]);
    setFamilySelected(new Set());
    setExtra([]);
    setEditContact({});
    setTravelerErrors({});
    setPriorById({});
    setDiscountById({});
    setPriorResolving(false);

    const historyPromise = fetchTravelerHistory(normalized).catch(() => null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    let person: PersonLookupResult;
    try {
      person = await lookupPersonById(normalized, controller.signal);
    } catch {
      person = { status: "error", message: "" };
    } finally {
      window.clearTimeout(timeout);
    }
    if (seq !== lookupSeq.current) return;

    if (person.status === "found") {
      crmOriginal.current = { [normalized]: person.customer };
      setPrimary(track({ key: normalized, source: "crm", data: person.customer }));
      setChecking(false);
      setFamilyLoading(true);
      const history = await historyPromise;
      if (seq !== lookupSeq.current) return;
      applyHistory(person.customer, history, seq);
      setFamilyLoading(false);
      return;
    }

    // Not found by ID: the policy history may still know the person
    const history = await historyPromise;
    if (seq !== lookupSeq.current) return;
    setChecking(false);
    if (history?.primaryCustomer) {
      crmOriginal.current = { [normalized]: history.primaryCustomer };
      setPrimary(track({ key: normalized, source: "crm", data: history.primaryCustomer }));
      applyHistory(history.primaryCustomer, history, seq);
      return;
    }
    if (person.status === "error") setLookupNote("לא הצלחנו לבדוק במערכת כרגע, אז נמלא את הפרטים ידנית.");
    setPrimary(track({ key: normalized, source: "manual", data: { ...EMPTY, id: normalized } }));
  };

  const closeAdd = () => {
    setAddingId(null);
    setAddError("");
  };

  const addTraveler = async () => {
    if (addingId === null) return;
    if (!isValidIsraeliId(addingId)) {
      setAddError("מספר תעודת הזהות לא תקין");
      return;
    }
    const key = normalizeIdValue(addingId);
    if (travelers.some((t) => t.key === key)) {
      setAddError("הנוסע/ת כבר ברשימה");
      return;
    }
    const familyMatch = familyOptions.find((t) => t.key === key);
    if (familyMatch) {
      setFamilySelected((prev) => new Set(prev).add(key));
      closeAdd();
      return;
    }
    setAddChecking(true);
    try {
      const result = await lookupPersonById(key);
      if (result.status === "found") {
        crmOriginal.current[key] = result.customer;
        setExtra((prev) => [...prev, track({ key, source: "crm", data: result.customer })]);
      } else {
        setExtra((prev) => [...prev, track({ key, source: "manual", data: { ...EMPTY, id: key } })]);
      }
    } catch {
      setExtra((prev) => [...prev, track({ key, source: "manual", data: { ...EMPTY, id: key } })]);
    } finally {
      setAddChecking(false);
    }
    closeAdd();
  };

  /** Same rules as the current form; returns true when every traveler is complete. */
  const validateTravelers = () => {
    const errors: Record<string, string[]> = {};
    travelers.forEach((t) => {
      const others = travelers.filter((o) => o.key !== t.key).map((o) => o.data.id);
      const list = validateTraveler(t.data, others);
      if (list.length) errors[t.key] = list;
    });
    setTravelerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToDates = () => {
    if (!validateTravelers()) return;
    setStep(2);
  };

  const submitDates = () => {
    if (!fromDate || !toDate) {
      setDateError("בחרו תאריך יציאה ותאריך חזרה");
      return;
    }
    if (toDate < fromDate) {
      setDateError("תאריך החזרה צריך להיות אחרי היציאה");
      return;
    }
    setDateError("");
    setStep(3);
  };

  const goToHarel = () => {
    if (!validateTravelers()) {
      setStep(1);
      return;
    }
    setRedirecting(true);
    const url = buildHarelUrl({
      aid: aff,
      from: isoToDDMMYYYY(fromDate),
      to: isoToDDMMYYYY(toDate),
      docket: getQueryParam(params, ["docket", "Docket"]) || "0",
      returnUrl: getQueryParam(params, ["return", "Return"]),
      customers: travelers.map((t) => t.data),
    });
    window.location.assign(url);
  };

  const tripDates = fromDate && toDate ? `יציאה ${isoToDDMMYYYY(fromDate)} · חזרה ${isoToDDMMYYYY(toDate)}` : "";

  const errorsFor = (key: string) =>
    travelerErrors[key]?.length ? (
      <ul role="alert" className="m-0 list-disc ps-5 text-[14px] font-semibold text-[#B42318]">
        {travelerErrors[key].map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    ) : null;

  const companionRow = (t: Traveler, removable: boolean) => {
    const editing = Boolean(editContact[t.key]);
    const fields = withContact(fieldPlan.current[t.key] || [], editing);
    const name =
      t.source === "crm" ? displayName(t.data) : `${t.data.firstNameEn} ${t.data.lastNameEn}`.trim() || "נוסע/ת נוסף/ת";
    return (
      <div key={t.key} className="flex flex-col gap-3 rounded-[18px] border-2 border-[#000144] bg-[#F3F5F8] p-3 ps-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00A247] text-[#000144]">
            <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[17px] font-bold">{name}</span>
            <Facts facts={factsOf(t.data)} />
            {badges(t.key)}
          </span>
          <button
            type="button"
            aria-label={`הסרת ${name}`}
            onClick={() => {
              if (removable) setExtra((prev) => prev.filter((x) => x.key !== t.key));
              else
                setFamilySelected((prev) => {
                  const n = new Set(prev);
                  n.delete(t.key);
                  return n;
                });
            }}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border-0 bg-transparent text-[#46557A] hover:bg-white hover:text-[#000144]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {fields.length > 0 && (
          <div className="rounded-[14px] bg-white p-3">
            <p className="m-0 mb-2 text-[14px] font-semibold text-[#33405F]">
              {editing ? "עריכת הפרטים:" : t.source === "crm" ? "חסרים לנו כמה פרטים:" : "לא מצאנו את הנוסע/ת במערכת, אז רק כמה פרטים:"}
            </p>
            <TravelerFields
              key={`${t.key}-${editing}`}
              traveler={t}
              fields={fields}
              onChange={(p) => updateTraveler(t.key, p)}
              idPrefix={`c-${t.key}`}
            />
          </div>
        )}
        {t.source === "crm" && (
          <button type="button" className={`${linkBtn} !min-h-[36px] text-[14px]`} onClick={() => setEditContact((p) => ({ ...p, [t.key]: !editing }))}>
            {editing ? "סיום עריכה" : "עריכת פרטים"}
          </button>
        )}
        {errorsFor(t.key)}
      </div>
    );
  };

  const primaryFields = primary ? withContact(fieldPlan.current[primary.key] || [], Boolean(editContact[primary.key])) : [];

  return (
    <AgencyPage
      title="רכישת ביטוח נסיעות"
      subtitle="שלושה צעדים קצרים, והפוליסה אצלכם"
      surface="gray"
      bandContent={
        shatapName || discountPercent ? (
          <span className="flex flex-wrap items-center gap-2">
            {shatapName && (
              <span className="inline-flex min-h-[40px] items-center rounded-full bg-white/[0.12] px-4 text-[16px] font-bold text-white">
                {shatapName}
              </span>
            )}
            {discountPercent && (
              <span className="inline-flex min-h-[40px] items-center rounded-full border-2 border-[#00A247] px-4 text-[16px] font-bold text-white">
                הנחה מיוחדת {discountPercent}%
              </span>
            )}
          </span>
        ) : undefined
      }
    >
      <div className="mx-auto flex max-w-[600px] flex-col gap-5 px-4 py-8 md:py-12">
        <ol aria-label="שלבי הרכישה" className="m-0 grid list-none grid-cols-3 gap-2 p-0 md:flex md:flex-wrap">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = n < step;
            const active = n === step;
            return (
              <li
                key={label}
                aria-current={active ? "step" : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-2 px-2 text-[14px] font-bold md:justify-start md:gap-2 md:px-4 md:text-[15px] ${
                  active ? "border-[#00A247] bg-[#00A247] text-[#000144]" : done ? "border-[#00A247] bg-white text-[#000144]" : "border-[#D5DAE3] bg-white text-[#46557A]"
                }`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-black ${active ? "bg-[#000144] text-white" : done ? "bg-[#00A247] text-[#000144]" : "bg-[#F3F5F8] text-[#46557A]"}`}>
                  {done ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : n}
                </span>
                {label}
              </li>
            );
          })}
        </ol>

        {/* Step 1 — travelers */}
        {step === 1 && (
          <>
            <section className={card} aria-labelledby="pv-id-title">
              <div className="flex flex-col gap-2">
                <h2 id="pv-id-title" className={h2}>מי הנוסע/ת הראשי/ת?</h2>
                <p className={lead}>נבדוק אם אתם כבר לקוחות שלנו, ונמלא את הפרטים בשבילכם.</p>
              </div>
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void lookupPrimary();
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pv-id" className={agencyLabel}>תעודת זהות</label>
                  <input
                    id="pv-id"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={9}
                    placeholder="9 ספרות"
                    value={id}
                    aria-invalid={Boolean(idError)}
                    aria-describedby={idError ? "pv-id-err" : undefined}
                    onChange={(e) => {
                      setId(e.target.value.replace(/\D/g, "").slice(0, 9));
                      setIdError("");
                      // Drop any lookup still in flight for the previous ID
                      lookupSeq.current++;
                      setChecking(false);
                      setFamilyLoading(false);
                      setPriorResolving(false);
                      if (primary) {
                        setPrimary(null);
                        setFamilyOptions([]);
                        setFamilySelected(new Set());
                        setExtra([]);
                      }
                    }}
                    className={`${agencyField} !min-h-[60px] text-center !text-[24px] tracking-[0.12em] ${idError ? "!border-[#B42318]" : ""}`}
                    dir="ltr"
                  />
                  {idError && <p id="pv-id-err" role="alert" className={errorText}>{idError}</p>}
                </div>
                {!primary && (
                  <button type="submit" className={btnPrimary} disabled={checking || id.length < 5}>
                    {checking ? (
                      <>
                        <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                        <span>בודקים במערכת…</span>
                      </>
                    ) : (
                      <>
                        <span>המשך</span>
                        <ArrowIcon size={20} />
                      </>
                    )}
                  </button>
                )}
              </form>
              <p className="m-0 flex items-center gap-2 text-[14px] font-semibold text-[#46557A]">
                <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-[#008C3D]" />
                הפרטים נשלחים להראל בצורה מאובטחת.
              </p>
            </section>

            {primary && (
              <section className={card} aria-labelledby="pv-primary-title">
                {primary.source === "crm" ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 id="pv-primary-title" className={h2}>
                        שלום{firstName(primary.data) ? ` ${firstName(primary.data)}` : ""}, מצאנו אותך
                      </h2>
                      <p className={lead}>
                        {primaryFields.length && !editContact[primary.key]
                          ? "אלה הפרטים שלך אצלנו. חסרים רק כמה פרטים קטנים."
                          : "אלה הפרטים שלך אצלנו. אם הכול נכון, אין צורך למלא כלום."}
                      </p>
                    </div>
                    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[20px] bg-[#F3F5F8] p-4 text-[16px]">
                      {(
                        [
                          ["שם", displayName(primary.data)],
                          ["תאריך לידה", formatBirthDate(primary.data.birthDate) || "—"],
                          ["טלפון", showPhone(primary.data.phone) || "—"],
                          ["מייל", showEmail(primary.data.email) || "—"],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} className="flex min-w-0 flex-col">
                          <dt className="text-[13px] font-semibold text-[#46557A]">{k}</dt>
                          <dd className="m-0 truncate font-bold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    {badges(primary.key)}
                    <button
                      type="button"
                      className={linkBtn}
                      onClick={() => setEditContact((p) => ({ ...p, [primary.key]: !p[primary.key] }))}
                    >
                      {editContact[primary.key] ? "סיום עריכה" : "משהו השתנה? עריכת הפרטים"}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <h2 id="pv-primary-title" className={h2}>נעים להכיר</h2>
                    <p className={lead}>{lookupNote || "עוד לא מכירים אותך במערכת, אז רק כמה פרטים. את השם כתבו כמו שהוא מופיע בדרכון."}</p>
                  </div>
                )}
                <TravelerFields
                  key={`${primary.key}-${Boolean(editContact[primary.key])}`}
                  traveler={primary}
                  fields={primaryFields}
                  onChange={(p) => updateTraveler(primary.key, p)}
                  idPrefix="pv-primary"
                />
                {errorsFor(primary.key)}
              </section>
            )}

            {primary && (
              <section className={card} aria-labelledby="pv-family-title">
                <div className="flex flex-col gap-2">
                  <h2 id="pv-family-title" className="m-0 text-[22px] font-black md:text-[26px]">מי נוסע איתך?</h2>
                  <p className={lead}>
                    {familyOptions.length > 0 ? "מצאנו את בני המשפחה שלך. סמנו מי מצטרף." : "נוסעים עוד אנשים? הוסיפו אותם לפי תעודת זהות."}
                  </p>
                </div>
                {familyLoading && (
                  <p role="status" className="m-0 flex items-center gap-2 text-[15px] font-semibold text-[#46557A]">
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                    מחפשים בני משפחה מהפוליסות הקודמות…
                  </p>
                )}
                <div className="flex flex-col gap-2.5 empty:hidden">
                  {familyOptions.map((t) =>
                    familySelected.has(t.key) ? (
                      companionRow(t, false)
                    ) : (
                      <button
                        key={t.key}
                        type="button"
                        aria-pressed={false}
                        onClick={() => setFamilySelected((prev) => new Set(prev).add(t.key))}
                        className="flex min-h-[60px] cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#D5DAE3] bg-white px-4 text-start font-[inherit]"
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 rounded-full border-2 border-[#D5DAE3]" />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-[17px] font-bold text-[#000144]">{displayName(t.data)}</span>
                          <Facts facts={factsOf(t.data)} />
                          {badges(t.key)}
                        </span>
                      </button>
                    ),
                  )}
                  {extra.map((t) => companionRow(t, true))}
                </div>

                {addingId === null ? (
                  <button type="button" onClick={() => setAddingId("")} className={`${btnGhost} self-start`}>
                    <Plus aria-hidden="true" className="h-5 w-5" />
                    הוספת נוסע אחר
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 rounded-[18px] bg-[#F3F5F8] p-4">
                    <label htmlFor="pv-add" className={agencyLabel}>תעודת זהות של הנוסע/ת</label>
                    <div className="flex gap-2">
                      <input
                        id="pv-add"
                        inputMode="numeric"
                        maxLength={9}
                        dir="ltr"
                        value={addingId}
                        onChange={(e) => {
                          setAddingId(e.target.value.replace(/\D/g, "").slice(0, 9));
                          setAddError("");
                        }}
                        className={`${agencyField} text-center tracking-[0.1em]`}
                      />
                      <button
                        type="button"
                        onClick={() => void addTraveler()}
                        disabled={addChecking}
                        className="inline-flex min-h-[52px] shrink-0 cursor-pointer items-center gap-2 rounded-[14px] border-0 bg-[#000144] px-5 font-[inherit] text-[16px] font-bold text-white disabled:opacity-60"
                      >
                        {addChecking && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                        הוספה
                      </button>
                      <button
                        type="button"
                        aria-label="ביטול"
                        onClick={closeAdd}
                        className="inline-flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] border-2 border-[#D5DAE3] bg-white text-[#000144]"
                      >
                        <X aria-hidden="true" className="h-5 w-5" />
                      </button>
                    </div>
                    {addError && <p role="alert" className={errorText}>{addError}</p>}
                  </div>
                )}
              </section>
            )}

            {primary && (
              <button type="button" onClick={goToDates} className={btnPrimary}>
                <span>{travelers.length === 1 ? "רק אני נוסע/ת, המשך" : `המשך עם ${travelers.length} נוסעים`}</span>
                <ArrowIcon size={20} />
              </button>
            )}
          </>
        )}

        {/* Step 2 — dates */}
        {step === 2 && (
          <section className={card} aria-labelledby="pv-dates-title">
            <div className="flex flex-col gap-2">
              <h2 id="pv-dates-title" className={h2}>מתי טסים?</h2>
              <p className={lead}>תאריכי היציאה והחזרה לישראל.</p>
            </div>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submitDates();
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["pv-from", "יציאה", fromDate, setFromDate, today],
                    ["pv-to", "חזרה", toDate, setToDate, fromDate || today],
                  ] as const
                ).map(([fid, label, value, setValue, min]) => (
                  <div key={fid} className="flex flex-col gap-1.5">
                    <label htmlFor={fid} className={agencyLabel}>{label}</label>
                    <input
                      id={fid}
                      type="date"
                      min={min}
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        setDateError("");
                      }}
                      className={`${agencyField} min-w-0 appearance-none !px-3 !text-[15px] md:!text-[17px] ${dateError ? "!border-[#B42318]" : ""}`}
                    />
                  </div>
                ))}
              </div>
              {dateError && <p role="alert" className={`${errorText} -mt-2`}>{dateError}</p>}
              <button type="submit" className={btnPrimary}>
                <span>המשך לסיכום</span>
                <ArrowIcon size={20} />
              </button>
            </form>
          </section>
        )}

        {/* Step 3 — summary + hand-off */}
        {step === 3 && (
          <section className={card} aria-labelledby="pv-summary-title">
            <div className="flex flex-col gap-2">
              <h2 id="pv-summary-title" className={h2}>הכול מוכן</h2>
              <p className={lead}>בשלב הבא נעביר אתכם לאתר של הראל לבחירת הכיסוי ולתשלום. כל הפרטים כבר יהיו שם.</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[20px] bg-[#F3F5F8] p-4">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[13px] font-semibold text-[#46557A]">הנסיעה</span>
                <span className="text-[18px] font-bold">{tripDates}</span>
              </div>
              <button type="button" onClick={() => setStep(2)} className={linkBtn}>שינוי</button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-[#46557A]">{travelers.length === 1 ? "נוסע אחד" : `${travelers.length} נוסעים`}</span>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {travelers.map((t) => (
                  <li key={t.key} className="flex min-h-[56px] items-center gap-3 rounded-[16px] border-2 border-[#E3E7EE] px-4 py-2">
                    <UserRound aria-hidden="true" className="h-5 w-5 shrink-0 text-[#46557A]" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[17px] font-bold">
                        {t.source === "crm" ? displayName(t.data) : `${t.data.firstNameEn} ${t.data.lastNameEn}`.trim() || "נוסע/ת"}
                      </span>
                      <Facts facts={factsOf(t.data)} />
                      {badges(t.key)}
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setStep(1)} className={linkBtn}>עריכת הנוסעים</button>
            </div>
            <button type="button" onClick={goToHarel} disabled={redirecting} className={btnPrimary}>
              {redirecting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
              <span>להמשך הרכישה בהראל</span>
              {!redirecting && <ArrowIcon size={20} />}
            </button>
            <p className="m-0 flex items-center gap-2 text-[14px] font-semibold text-[#46557A]">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-[#008C3D]" />
              פוליסה של הראל · מוקד 24/7 בעברית
            </p>
          </section>
        )}

        {step > 1 && (
          <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className={`${btnGhost} self-start`}>
            חזרה
          </button>
        )}
        <p className="m-0 text-center text-[14px] font-semibold text-[#46557A]">
          מעדיפים שנחזור אליכם? <Link to="/contact" className="font-bold text-[#000144] underline">השאירו פרטים</Link> או{" "}
          <a href="tel:0732721111" className="font-bold text-[#000144] underline" dir="ltr">073-2721111</a>
        </p>
      </div>
    </AgencyPage>
  );
};

export default PurchaseV2;
