import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Loader2, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";
import { ArrowIcon, agencyField, agencyLabel } from "@/components/AgencyUi";

/*
 * Design mockup of a simpler purchase flow (ID → confirm travelers → summary → Harel).
 * Demo data only: no CRM or Harel calls. Found details are shown masked so typing
 * someone else's ID doesn't reveal their phone, email or birth date.
 */

type Scenario = "existing" | "new";
type Step = 1 | 2 | 3;

type Traveler = { key: string; name: string; facts: string[] };

/** One muted line of a traveler's (masked) details, wrapping on small screens. */
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

// Demo CRM result; phone and email are shown masked, the birth date in full
const DEMO_CUSTOMER = {
  greeting: "רני",
  name: "רני א׳",
  lastNameHe: "אברהם",
  lastNameEn: "Avraham",
  birthDate: "14/03/1985",
  phone: "054-•••-4567",
  email: "ra•••@gmail.com",
};

type DemoPerson = {
  key: string;
  name: string;
  lastNameHe: string;
  lastNameEn: string;
  birthDate: string;
  phone?: string;
  email?: string;
};

// Everyone the CRM links to the customer, including past co-travelers who aren't family
const DEMO_LINKED_PEOPLE: DemoPerson[] = [
  { key: "f1", name: "דנה א׳", lastNameHe: "אברהם", lastNameEn: "Avraham", birthDate: "02/07/1984", phone: "052-•••-1122", email: "da•••@gmail.com" },
  { key: "f2", name: "נועם א׳", lastNameHe: "אברהם", lastNameEn: "Avraham", birthDate: "21/09/2013" },
  { key: "f3", name: "מאיה א׳", lastNameHe: "אברהם", lastNameEn: "Avraham", birthDate: "05/01/2018" },
  { key: "x1", name: "יוסי כ׳", lastNameHe: "כהן", lastNameEn: "Cohen", birthDate: "30/11/1983", phone: "050-•••-9081" },
];

// Demo only: IDs that "exist in CRM" when added as another traveler; any other valid ID is new
const DEMO_ID_LOOKUP: Record<string, Omit<DemoPerson, "key" | "lastNameHe" | "lastNameEn">> = {
  "000000034": { name: "אורי ל׳", birthDate: "11/02/1990", phone: "053-•••-8890", email: "or•••@walla.co.il" },
};

// LTR-isolated so phone numbers and emails keep their order inside Hebrew text
const ltr = (s: string) => `⁦${s}⁩`;

// What we show about a person: full birth date, everything else masked
const factsOf = (p: { birthDate: string; phone?: string; email?: string }) =>
  [`תאריך לידה ${p.birthDate}`, p.phone && ltr(p.phone), p.email && ltr(p.email)].filter(Boolean) as string[];

const normalizeName = (s: string) => s.replace(/["'׳״`\-\s]/g, "").toLowerCase();

// Only people sharing the customer's last name (Hebrew or English) are offered as family
const isSameFamily = (p: { lastNameHe: string; lastNameEn: string }) =>
  (p.lastNameHe && normalizeName(p.lastNameHe) === normalizeName(DEMO_CUSTOMER.lastNameHe)) ||
  (p.lastNameEn && normalizeName(p.lastNameEn) === normalizeName(DEMO_CUSTOMER.lastNameEn));

const DEMO_FAMILY: Traveler[] = DEMO_LINKED_PEOPLE.filter(isSameFamily).map((p) => ({
  key: p.key,
  name: p.name,
  facts: factsOf(p),
}));

const STEPS = ["הנסיעה", "הנוסעים", "סיכום"];

const EMPTY_ADD_FORM = { gender: "", firstEn: "", lastEn: "", day: "", month: "", year: "" };

// Demo only: these IDs act as "found in CRM"; any other valid ID is a new customer
const DEMO_EXISTING_IDS = new Set(["000000018"]);

const isValidIsraeliId = (id: string) => {
  const s = id.trim().padStart(9, "0");
  if (!/^\d{9}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
};

// LTR-isolated (U+2066…U+2069) so "••••1234" doesn't flip inside Hebrew text
const maskId = (id: string) => `⁦••••${id.slice(-4)}⁩`;

// "2026-11-02" -> "2.11"
const shortDate = (iso: string | null) => {
  const [, m, d] = (iso || "").split("-");
  return m && d ? `${Number(d)}.${Number(m)}` : "";
};

const btnPrimary =
  "inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[18px] border-0 bg-[#00A247] px-6 font-[inherit] text-[19px] font-extrabold text-[#000144] transition-colors hover:bg-[#008C3D] disabled:cursor-not-allowed disabled:opacity-60";
const btnGhost =
  "inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-[14px] border-2 border-[#D5DAE3] bg-white px-4 font-[inherit] text-[16px] font-bold text-[#000144] hover:border-[#000144]";
const card = "box-border flex flex-col gap-5 rounded-[28px] border-2 border-[#E3E7EE] bg-white p-5 md:p-8";
const h2 = "m-0 text-[26px] font-black leading-[1.1] md:text-[32px]";
const lead = "m-0 text-[17px] font-medium text-[#33405F]";

const MockupPurchase = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // Prefilled from the homepage trip card when present; chosen here otherwise
  const [fromDate, setFromDate] = useState(params.get("from") || "");
  const [toDate, setToDate] = useState(params.get("to") || "");
  const [dateError, setDateError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const tripDates = `יציאה ${shortDate(fromDate)} · חזרה ${shortDate(toDate)}`;

  const [scenario, setScenario] = useState<Scenario>("existing");
  const [step, setStep] = useState<Step>(1);
  const [id, setId] = useState("");
  const [idError, setIdError] = useState("");
  const [checking, setChecking] = useState(false);
  const [family, setFamily] = useState<Set<string>>(new Set(["f1"]));
  const [extra, setExtra] = useState<Traveler[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState("");
  const [addNotFound, setAddNotFound] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [handoffNote, setHandoffNote] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ firstEn: "", lastEn: "", day: "", month: "", year: "", phone: "", email: "", gender: "" });

  const submitId = () => {
    if (!fromDate || !toDate) {
      setDateError("בחרו תאריך יציאה ותאריך חזרה");
      return;
    }
    if (toDate < fromDate) {
      setDateError("תאריך החזרה צריך להיות אחרי היציאה");
      return;
    }
    if (!isValidIsraeliId(id)) {
      setIdError("מספר תעודת הזהות לא תקין. בדקו את 9 הספרות");
      return;
    }
    setIdError("");
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      // The real flow decides by the CRM lookup result; the mockup fakes it by ID
      setScenario(DEMO_EXISTING_IDS.has(id.padStart(9, "0")) ? "existing" : "new");
      setStep(2);
    }, 900);
  };

  const closeAdd = () => {
    setAddingId(null);
    setAddError("");
    setAddNotFound(false);
    setAddForm(EMPTY_ADD_FORM);
  };

  const addTraveler = () => {
    if (addingId === null) return;
    const key = addingId.padStart(9, "0");
    if (!isValidIsraeliId(addingId)) {
      setAddError("מספר תעודת הזהות לא תקין");
      return;
    }
    if (key === id.padStart(9, "0") || extra.some((t) => t.key === key)) {
      setAddError("הנוסע/ת כבר ברשימה");
      return;
    }
    const found = DEMO_ID_LOOKUP[key];
    if (found) {
      setExtra((prev) => [...prev, { key, name: found.name, facts: [`ת״ז ${maskId(key)}`, ...factsOf(found)] }]);
      closeAdd();
      return;
    }
    if (!addNotFound) {
      // Not in CRM: ask only for what Harel needs for this traveler
      setAddNotFound(true);
      setAddError("");
      return;
    }
    const { firstEn, lastEn, day, month, year, gender } = addForm;
    if (!firstEn.trim() || !lastEn.trim() || !day || !month || year.length !== 4 || !gender) {
      setAddError("מלאו את כל הפרטים של הנוסע/ת");
      return;
    }
    setExtra((prev) => [
      ...prev,
      {
        key,
        name: `${firstEn} ${lastEn}`,
        facts: [`ת״ז ${maskId(key)}`, `תאריך לידה ${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`],
      },
    ]);
    closeAdd();
  };

  const primaryName =
    scenario === "existing"
      ? DEMO_CUSTOMER.name
      : [newCustomer.firstEn, newCustomer.lastEn].filter(Boolean).join(" ") || "הנוסע/ת הראשי/ת";

  const travelers: Traveler[] = useMemo(
    () => [
      {
        key: "primary",
        name: primaryName,
        facts: [
          `ת״ז ${maskId(id || "000000000")}`,
          scenario === "existing"
            ? `תאריך לידה ${DEMO_CUSTOMER.birthDate}`
            : `תאריך לידה ${newCustomer.day.padStart(2, "0")}/${newCustomer.month.padStart(2, "0")}/${newCustomer.year}`,
        ],
      },
      ...DEMO_FAMILY.filter((f) => scenario === "existing" && family.has(f.key)),
      ...extra,
    ],
    [primaryName, id, scenario, family, extra, newCustomer.day, newCustomer.month, newCustomer.year],
  );

  const newCustomerReady =
    newCustomer.firstEn.trim() &&
    newCustomer.lastEn.trim() &&
    newCustomer.day &&
    newCustomer.month &&
    newCustomer.year.length === 4 &&
    newCustomer.phone.replace(/\D/g, "").length >= 9 &&
    newCustomer.gender;


  // Travelers joining the main one: CRM family (existing customers) + anyone added by ID
  const companions = (
    <section className={card} aria-labelledby="s2-family">
      <div className="flex flex-col gap-2">
        <h2 id="s2-family" className="m-0 text-[22px] font-black md:text-[26px]">מי נוסע איתך?</h2>
        <p className={lead}>
          {scenario === "existing" && DEMO_FAMILY.length > 0
            ? "מצאנו את בני המשפחה שלך. סמנו מי מצטרף."
            : "נוסעים עוד אנשים? הוסיפו אותם לפי תעודת זהות."}
        </p>
      </div>
      <div className="flex flex-col gap-2.5 empty:hidden">
        {(scenario === "existing" ? DEMO_FAMILY : []).map((f) => {
          const on = family.has(f.key);
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setFamily((prev) => {
                  const next = new Set(prev);
                  if (next.has(f.key)) next.delete(f.key);
                  else next.add(f.key);
                  return next;
                })
              }
              className={`flex min-h-[60px] cursor-pointer items-center gap-3 rounded-[18px] border-2 px-4 text-start font-[inherit] ${
                on ? "border-[#000144] bg-[#F3F5F8] ring-2 ring-inset ring-[#000144]" : "border-[#D5DAE3] bg-white"
              }`}
            >
              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${on ? "bg-[#00A247] text-[#000144]" : "border-2 border-[#D5DAE3]"}`}>
                {on && <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[17px] font-bold text-[#000144]">{f.name}</span>
                <Facts facts={f.facts} />
              </span>
            </button>
          );
        })}
        {extra.map((t) => (
          <div key={t.key} className="flex min-h-[60px] items-center gap-3 rounded-[18px] border-2 border-[#000144] bg-[#F3F5F8] py-2 pe-2 ps-4">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00A247] text-[#000144]"><Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[17px] font-bold">{t.name}</span>
              <Facts facts={t.facts} />
            </span>
            <button
              type="button"
              aria-label={`הסרת ${t.name}`}
              onClick={() => setExtra((prev) => prev.filter((x) => x.key !== t.key))}
              className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border-0 bg-transparent text-[#46557A] hover:bg-white hover:text-[#000144]"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      {addingId === null ? (
        <button type="button" onClick={() => setAddingId("")} className={`${btnGhost} self-start`}>
          <Plus aria-hidden="true" className="h-5 w-5" />
          הוספת נוסע אחר
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-[18px] bg-[#F3F5F8] p-4">
          <label htmlFor="mp-add" className={agencyLabel}>תעודת זהות של הנוסע/ת</label>
          <div className="flex gap-2">
            <input
              id="mp-add"
              inputMode="numeric"
              maxLength={9}
              dir="ltr"
              value={addingId}
              readOnly={addNotFound}
              onChange={(e) => {
                setAddingId(e.target.value.replace(/\D/g, "").slice(0, 9));
                setAddError("");
              }}
              className={`${agencyField} text-center tracking-[0.1em] ${addNotFound ? "!bg-[#F3F5F8]" : ""}`}
            />
            {!addNotFound && (
              <button type="button" onClick={addTraveler} className="min-h-[52px] shrink-0 cursor-pointer rounded-[14px] border-0 bg-[#000144] px-5 font-[inherit] text-[16px] font-bold text-white">בדיקה</button>
            )}
            <button type="button" aria-label="ביטול" onClick={closeAdd} className="inline-flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] border-2 border-[#D5DAE3] bg-white text-[#000144]"><X aria-hidden="true" className="h-5 w-5" /></button>
          </div>

          {addNotFound && (
            <div className="flex flex-col gap-3">
              <p className="m-0 text-[15px] font-semibold text-[#33405F]">לא מצאנו את הנוסע/ת במערכת, אז רק כמה פרטים:</p>
              <fieldset className="m-0 grid grid-cols-2 gap-2.5 border-0 p-0">
                <legend className="sr-only">מין</legend>
                {[["male", "זכר"], ["female", "נקבה"]].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={addForm.gender === v}
                    onClick={() => setAddForm((p) => ({ ...p, gender: v }))}
                    className={`min-h-[48px] cursor-pointer rounded-[14px] border-2 font-[inherit] text-[16px] font-bold ${
                      addForm.gender === v ? "border-[#000144] bg-[#000144] text-white" : "border-[#D5DAE3] bg-white text-[#000144]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </fieldset>
              <div className="grid grid-cols-2 gap-2.5">
                {[["firstEn", "שם פרטי (באנגלית)"], ["lastEn", "שם משפחה (באנגלית)"]].map(([k, l]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <label htmlFor={`mp-add-${k}`} className={agencyLabel}>{l}</label>
                    <input
                      id={`mp-add-${k}`}
                      dir="ltr"
                      value={addForm[k as "firstEn" | "lastEn"]}
                      onChange={(e) => setAddForm((p) => ({ ...p, [k]: e.target.value.replace(/[^A-Za-z' -]/g, "") }))}
                      className={agencyField}
                    />
                  </div>
                ))}
              </div>
              <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
                <legend className={`${agencyLabel} mb-1`}>תאריך לידה</legend>
                <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2.5" dir="ltr">
                  {[["day", "יום", 2, "DD"], ["month", "חודש", 2, "MM"], ["year", "שנה", 4, "YYYY"]].map(([k, l, max, ph]) => (
                    <input
                      key={k as string}
                      aria-label={l as string}
                      inputMode="numeric"
                      maxLength={max as number}
                      placeholder={ph as string}
                      value={addForm[k as "day" | "month" | "year"]}
                      onChange={(e) => setAddForm((p) => ({ ...p, [k as string]: e.target.value.replace(/\D/g, "") }))}
                      className={`${agencyField} text-center`}
                    />
                  ))}
                </div>
              </fieldset>
              <button type="button" onClick={addTraveler} className="min-h-[52px] cursor-pointer rounded-[14px] border-0 bg-[#000144] px-5 font-[inherit] text-[16px] font-bold text-white">הוספת הנוסע/ת</button>
            </div>
          )}
          {addError && <p role="alert" className="m-0 text-[15px] font-semibold text-[#B42318]">{addError}</p>}
        </div>
      )}
    </section>
  );

  return (
    <AgencyPage title="רכישת ביטוח נסיעות" subtitle="שלושה צעדים קצרים, ואתם בדרך להראל" surface="gray">
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
                  active
                    ? "border-[#00A247] bg-[#00A247] text-[#000144]"
                    : done
                      ? "border-[#00A247] bg-white text-[#000144]"
                      : "border-[#D5DAE3] bg-white text-[#46557A]"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-black ${
                    active ? "bg-[#000144] text-white" : done ? "bg-[#00A247] text-[#000144]" : "bg-[#F3F5F8] text-[#46557A]"
                  }`}
                >
                  {done ? <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : n}
                </span>
                {label}
              </li>
            );
          })}
        </ol>

        {/* Step 1 — trip dates + ID */}
        {step === 1 && (
          <section className={card} aria-labelledby="s1-title">
            <div className="flex flex-col gap-2">
              <h2 id="s1-title" className={h2}>מתי טסים, ומי הנוסע/ת הראשי/ת?</h2>
              <p className={lead}>נבדוק אם אתם כבר לקוחות שלנו, ונמלא את הפרטים בשבילכם.</p>
            </div>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submitId();
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["mp-from", "יציאה", fromDate, setFromDate, today],
                    ["mp-to", "חזרה", toDate, setToDate, fromDate || today],
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
              {dateError && <p role="alert" className="m-0 -mt-2 text-[15px] font-semibold text-[#B42318]">{dateError}</p>}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mp-id" className={agencyLabel}>תעודת זהות</label>
                <input
                  id="mp-id"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={9}
                  placeholder="9 ספרות"
                  value={id}
                  aria-invalid={Boolean(idError)}
                  aria-describedby={idError ? "mp-id-err" : undefined}
                  onChange={(e) => {
                    setId(e.target.value.replace(/\D/g, "").slice(0, 9));
                    setIdError("");
                  }}
                  className={`${agencyField} !min-h-[60px] text-center !text-[24px] tracking-[0.12em] ${idError ? "!border-[#B42318]" : ""}`}
                  dir="ltr"
                />
                {idError && (
                  <p id="mp-id-err" role="alert" className="m-0 text-[15px] font-semibold text-[#B42318]">{idError}</p>
                )}
              </div>
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
            </form>
            <p className="m-0 flex items-center gap-2 text-[14px] font-semibold text-[#46557A]">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-[#008C3D]" />
              הפרטים מוצגים חלקית ונשלחים להראל בצורה מאובטחת.
            </p>
          </section>
        )}

        {/* Step 2 — existing customer: confirm + family */}
        {step === 2 && scenario === "existing" && (
          <>
            <section className={card} aria-labelledby="s2-title">
              <div className="flex flex-col gap-2">
                <h2 id="s2-title" className={h2}>שלום {DEMO_CUSTOMER.greeting}, מצאנו אותך</h2>
                <p className={lead}>אלה הפרטים שלך אצלנו. אם הכול נכון, אין צורך למלא כלום.</p>
              </div>
              <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[20px] bg-[#F3F5F8] p-4 text-[16px]">
                {[
                  ["שם", DEMO_CUSTOMER.name],
                  ["תאריך לידה", DEMO_CUSTOMER.birthDate],
                  ["טלפון", DEMO_CUSTOMER.phone],
                  ["מייל", DEMO_CUSTOMER.email],
                ].map(([k, v]) => (
                  <div key={k} className="flex min-w-0 flex-col">
                    <dt className="text-[13px] font-semibold text-[#46557A]">{k}</dt>
                    <dd className="m-0 truncate font-bold" dir={k === "טלפון" || k === "מייל" ? "ltr" : undefined} style={{ textAlign: "right" }}>{v}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" className="self-start border-0 bg-transparent p-0 font-[inherit] text-[15px] font-bold text-[#000144] underline underline-offset-4 min-h-[44px] cursor-pointer">
                הפרטים השתנו? עדכנו כאן
              </button>
            </section>

            {companions}

            <button type="button" onClick={() => setStep(3)} className={btnPrimary}>
              <span>{travelers.length === 1 ? "רק אני נוסע/ת, המשך" : `המשך עם ${travelers.length} נוסעים`}</span>
              <ArrowIcon size={20} />
            </button>
          </>
        )}

        {/* Step 2 — new customer: only what's missing */}
        {step === 2 && scenario === "new" && (
          <section className={card} aria-labelledby="s2n-title">
            <div className="flex flex-col gap-2">
              <h2 id="s2n-title" className={h2}>נעים להכיר</h2>
              <p className={lead}>עוד לא מכירים אותך במערכת, אז רק כמה פרטים. את השם כתבו כמו שהוא מופיע בדרכון.</p>
            </div>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className={`${agencyLabel} mb-1.5`}>מין</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {[["male", "זכר"], ["female", "נקבה"]].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={newCustomer.gender === v}
                    onClick={() => setNewCustomer((p) => ({ ...p, gender: v }))}
                    className={`min-h-[52px] cursor-pointer rounded-[14px] border-2 font-[inherit] text-[17px] font-bold ${
                      newCustomer.gender === v ? "border-[#000144] bg-[#000144] text-white" : "border-[#D5DAE3] bg-white text-[#000144]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              {[["firstEn", "שם פרטי (באנגלית)", "given-name"], ["lastEn", "שם משפחה (באנגלית)", "family-name"]].map(([k, l, ac]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <label htmlFor={`mp-${k}`} className={agencyLabel}>{l}</label>
                  <input
                    id={`mp-${k}`}
                    dir="ltr"
                    autoComplete={ac}
                    value={newCustomer[k as "firstEn" | "lastEn"]}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, [k]: e.target.value.replace(/[^A-Za-z' -]/g, "") }))}
                    className={agencyField}
                  />
                </div>
              ))}
            </div>
            <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
              <legend className={`${agencyLabel} mb-1.5`}>תאריך לידה</legend>
              <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2.5" dir="ltr">
                {[["day", "יום", 2, "DD"], ["month", "חודש", 2, "MM"], ["year", "שנה", 4, "YYYY"]].map(([k, l, max, ph]) => (
                  <input
                    key={k as string}
                    aria-label={l as string}
                    inputMode="numeric"
                    maxLength={max as number}
                    placeholder={ph as string}
                    value={newCustomer[k as "day" | "month" | "year"]}
                    onChange={(e) => setNewCustomer((p) => ({ ...p, [k as string]: e.target.value.replace(/\D/g, "") }))}
                    className={`${agencyField} text-center`}
                  />
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mp-phone" className={agencyLabel}>טלפון נייד</label>
              <input id="mp-phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="05X-XXXXXXX" value={newCustomer.phone} onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))} className={agencyField} style={{ textAlign: "right" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mp-email" className={agencyLabel}>מייל (לא חובה)</label>
              <input id="mp-email" type="email" inputMode="email" autoComplete="email" dir="ltr" value={newCustomer.email} onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))} className={agencyField} style={{ textAlign: "right" }} />
            </div>
          </section>
        )}
        {step === 2 && scenario === "new" && (
          <>
            {companions}
            <button type="button" onClick={() => setStep(3)} disabled={!newCustomerReady} className={btnPrimary}>
              <span>{travelers.length === 1 ? "המשך" : `המשך עם ${travelers.length} נוסעים`}</span>
              <ArrowIcon size={20} />
            </button>
          </>
        )}

        {/* Step 3 — summary */}
        {step === 3 && (
          <section className={card} aria-labelledby="s3-title">
            <div className="flex flex-col gap-2">
              <h2 id="s3-title" className={h2}>הכול מוכן</h2>
              <p className={lead}>בשלב הבא נעביר אתכם לאתר של הראל לבחירת הכיסוי ולתשלום. כל הפרטים כבר יהיו שם.</p>
            </div>
            <div className="flex flex-col gap-1 rounded-[20px] bg-[#F3F5F8] p-4">
              <span className="text-[13px] font-semibold text-[#46557A]">הנסיעה</span>
              <span className="text-[18px] font-bold">{tripDates}</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-[#46557A]">{travelers.length === 1 ? "נוסע אחד" : `${travelers.length} נוסעים`}</span>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {travelers.map((t) => (
                  <li key={t.key} className="flex min-h-[56px] items-center gap-3 rounded-[16px] border-2 border-[#E3E7EE] px-4">
                    <UserRound aria-hidden="true" className="h-5 w-5 shrink-0 text-[#46557A]" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[17px] font-bold">{t.name}</span>
                      <Facts facts={t.facts} />
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setStep(2)} className="self-start border-0 bg-transparent p-0 font-[inherit] text-[15px] font-bold text-[#000144] underline underline-offset-4 min-h-[44px] cursor-pointer">
                עריכת הנוסעים
              </button>
            </div>
            <button type="button" onClick={() => setHandoffNote(true)} className={btnPrimary}>
              <span>להמשך הרכישה בהראל</span>
              <ArrowIcon size={20} />
            </button>
            {handoffNote && (
              <p role="status" className="m-0 rounded-[14px] bg-[#E6ECFA] p-3 text-[15px] font-semibold text-[#000144]">
                במוקאפ הכפתור לא מעביר להראל. בגרסה האמיתית הוא שולח בדיוק את אותם פרטים כמו היום.
              </p>
            )}
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
          מעדיפים שנחזור אליכם? <Link to="/contact" className="font-bold text-[#000144] underline">השאירו פרטים</Link> או <a href="tel:0732721111" className="font-bold text-[#000144] underline" dir="ltr">073-2721111</a>
        </p>
      </div>
    </AgencyPage>
  );
};

export default MockupPurchase;
