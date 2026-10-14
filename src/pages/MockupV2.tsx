import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Car, FileDown, FileText, Home, Users } from "lucide-react";
import AgencyFooter from "@/components/AgencyFooter";
import AgencyHeader from "@/components/AgencyHeader";
import CookieBanner from "@/components/CookieBanner";
import { useLanguage } from "@/contexts/LanguageContext";

const NAVY = "#000144";
const GREEN = "#00A247";

const destinations = ["אירופה", "ארה״ב", "תאילנד", "יוון", "דובאי", "יעד אחר"];

// Same cap as the purchase form (BuyInsNew)
const MAX_TRAVELERS = 10;

const localIsoDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const otherInsurance = [
  { to: "/services/car", icon: Car, key: "car" },
  { to: "/services/home", icon: Home, key: "home" },
  { to: "/services/business", icon: Briefcase, key: "business" },
];

const ArrowIcon = ({ size = 22 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </svg>
);

const PhoneIcon = ({ size = 48, stroke = NAVY }: { size?: number; stroke?: string }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const iconProps = {
  "aria-hidden": true,
  width: 48,
  height: 48,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: NAVY,
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const benefits = [
  {
    title: "עד 5 מיליון $",
    text: "כיסוי בחו״ל",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  { title: "24/7", text: "מוקד בעברית ובאנגלית", icon: <PhoneIcon /> },
  {
    title: "סוכן אישי",
    text: "מלווה אתכם גם בתביעה",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
    ),
  },
  {
    title: "מותאם לכם",
    text: "לפי סוג הנסיעה והבריאות",
    icon: (
      <svg {...iconProps}>
        <path d="M4 6h8" />
        <path d="M16 6h4" />
        <circle cx="14" cy="6" r="2" />
        <path d="M4 12h2" />
        <path d="M10 12h10" />
        <circle cx="8" cy="12" r="2" />
        <path d="M4 18h10" />
        <path d="M18 18h2" />
        <circle cx="16" cy="18" r="2" />
      </svg>
    ),
  },
];

const steps = [
  ["1", "ממלאים", "פרטי נסיעה"],
  ["2", "משלמים", "אונליין"],
  ["3", "הפוליסה", "אצלכם"],
];

const stamps = [
  { top: "מבטחים מאז", big: "1977", rotate: -7, bigFirst: false, bigSize: "text-[44px] leading-none" },
  { top: "פוליסה של", big: "הראל", rotate: 5, bigFirst: false, bigSize: "text-[40px] leading-[1.05]" },
  { top: "סוכנויות נסיעות", big: "כ-450", rotate: -4, bigFirst: true, bigSize: "text-[44px] leading-none" },
];

// Keys into the shared FAQ translations (same answers as /faq)
const faqKeys = [1, 3, 6, 5, 9, 10];

const h2Class = "m-0 text-[clamp(34px,4.4cqw,60px)] font-black leading-[1.02] tracking-[-0.01em]";
const fieldClass =
  "min-h-[52px] w-full box-border rounded-[14px] border-2 border-[#D5DAE3] bg-white px-[14px] font-[inherit] text-[17px] font-semibold text-[#000144]";
const labelClass = "text-sm font-semibold text-[#46557A]";

const MockupV2 = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dest, setDest] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pax, setPax] = useState("2");
  const [formError, setFormError] = useState("");
  const destLabel = dest && dest !== "יעד אחר" ? dest : "לאן טסים?";
  const today = localIsoDate();

  // Hand the trip details to the purchase flow, which forwards them to Harel
  const goToPurchase = () => {
    if (Boolean(fromDate) !== Boolean(toDate)) {
      setFormError("בחרו גם תאריך יציאה וגם תאריך חזרה");
      return;
    }
    if (fromDate && toDate < fromDate) {
      setFormError("תאריך החזרה צריך להיות אחרי היציאה");
      return;
    }
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    const travelers = Math.min(Math.max(parseInt(pax, 10) || 1, 1), MAX_TRAVELERS);
    params.set("pax", String(travelers));
    navigate(`/purchase?${params}`);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white font-rubik text-[18px] leading-[1.45] text-[#000144] [container-type:inline-size]"
    >
      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-[#000144] text-white">
        <div aria-hidden="true" className="absolute left-[-10cqw] top-[-12cqw] h-[36cqw] w-[36cqw] rounded-full bg-[#0C1060]" />
        <div aria-hidden="true" className="absolute left-[22cqw] top-[9cqw] h-[4cqw] w-[15cqw] rounded-full bg-white/[0.07]" />
        <div aria-hidden="true" className="absolute left-[30cqw] top-[13.5cqw] h-[3cqw] w-[9cqw] rounded-full bg-white/[0.05]" />

        <div className="relative mx-auto max-w-[1200px] px-6 pt-5">
          <AgencyHeader onLanding />
        </div>

        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-8 px-6 pb-[88px] pt-16">
          <div className="flex flex-col gap-3.5">
            <h1 className="m-0 text-[clamp(46px,7.4cqw,108px)] font-black leading-[0.98] tracking-[-0.02em]">
              טסים לחו״ל?
              <br />
              <span className="text-[#00A247]">ביטוח בכמה דקות.</span>
            </h1>
            <p className="m-0 text-[clamp(18px,1.8cqw,24px)] font-medium text-[#E3EAFF]">פוליסה של הראל · מוקד 24/7 בעברית</p>
          </div>

          {/* Boarding-pass card */}
          <div className="flex flex-wrap overflow-hidden rounded-[28px] bg-white text-[#000144] shadow-[0_30px_60px_rgba(7,20,51,0.35)]">
            <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-8 py-7">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3.5">
                <div className="flex flex-col">
                  <span className={labelClass}>מ־</span>
                  <span className="text-[34px] font-extrabold leading-[1.1]">תל אביב</span>
                </div>
                <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "scaleX(-1)" }}>
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
                <div className="flex flex-col">
                  <span className={labelClass}>אל</span>
                  <span className="text-[34px] font-extrabold leading-[1.1] text-[#00A247]">{destLabel}</span>
                </div>
              </div>
              <div role="group" aria-label="בחירת יעד" className="-mt-2 flex flex-wrap gap-2">
                {destinations.map((label) => {
                  const on = dest === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDest(label)}
                      className={`min-h-[44px] cursor-pointer rounded-full border-2 px-[18px] font-[inherit] text-[16px] font-bold ${
                        on ? "border-[#00A247] bg-[#00A247] text-[#000144]" : "border-[#D5DAE3] bg-white text-[#000144] hover:border-[#000144]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="t-from" className={labelClass}>יציאה</label>
                  <input
                    id="t-from"
                    type="date"
                    min={today}
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setFormError("");
                    }}
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="t-to" className={labelClass}>חזרה</label>
                  <input
                    id="t-to"
                    type="date"
                    min={fromDate || today}
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setFormError("");
                    }}
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="t-pax" className={labelClass}>נוסעים</label>
                  <input
                    id="t-pax"
                    type="number"
                    min={1}
                    max={MAX_TRAVELERS}
                    value={pax}
                    onChange={(e) => setPax(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
            <div className="box-border flex flex-[1_1_250px] flex-col justify-center gap-4 bg-[#F3F5F8] p-7 [border-inline-start:3px_dashed_#C5CCD8]">
              <button
                type="button"
                onClick={goToPurchase}
                className="flex min-h-[64px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[18px] border-0 bg-[#00A247] font-[inherit] text-[22px] font-extrabold text-[#000144]"
              >
                <span>להצעת מחיר</span>
                <ArrowIcon />
              </button>
              {formError && (
                <p role="alert" className="m-0 text-center text-base font-semibold text-[#B42318]">
                  {formError}
                </p>
              )}
              <div
                aria-hidden="true"
                className="h-[30px]"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #000144 0 3px, transparent 3px 7px, #000144 7px 8px, transparent 8px 13px, #000144 13px 17px, transparent 17px 20px)",
                }}
              />
            </div>
          </div>

        </div>
      </section>

      {/* Trust stamps */}
      <section aria-label="למה אפשר לסמוך עלינו" className="px-6 pb-2 pt-14">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-x-16 gap-y-7">
          {stamps.map((s) => (
            <div
              key={s.big}
              className="box-border flex h-[164px] w-[164px] flex-col items-center justify-center rounded-full border-4 border-dashed border-[#000144] text-center text-[#000144]"
              style={{ transform: `rotate(${s.rotate}deg)` }}
            >
              {s.bigFirst ? (
                <>
                  <span className={`${s.bigSize} font-black`}>{s.big}</span>
                  <span className="text-base font-bold">{s.top}</span>
                </>
              ) : (
                <>
                  <span className="text-base font-bold">{s.top}</span>
                  <span className={`${s.bigSize} font-black`}>{s.big}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="get" className="px-6 pb-[88px] pt-[72px]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-9">
          <h2 className={h2Class}>מה מקבלים</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="box-border flex min-h-[220px] !flex-col justify-between gap-6 rounded-[28px] bg-[#F3F5F8] p-7">
                {b.icon}
                <div className="flex flex-col gap-1">
                  <span className="text-[32px] font-black leading-[1.05]">{b.title}</span>
                  <span className="text-[18px] font-medium text-[#33405F]">{b.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#000144] px-6 py-[88px] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-11">
          <h2 className={h2Class}>שלושה צעדים, וטסים</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-10 gap-y-7">
            {steps.map(([n, a, b]) => (
              <div key={n} className="flex items-center gap-5">
                <span className="text-[112px] font-black leading-[0.9] text-[#00A247]">{n}</span>
                <span className="text-[28px] font-extrabold leading-[1.15]">
                  {a}
                  <br />
                  {b}
                </span>
              </div>
            ))}
          </div>
          <div className="flex">
            <a href="#top" className="inline-flex min-h-[60px] items-center justify-center gap-2.5 rounded-[18px] bg-[#00A247] px-9 text-[21px] font-extrabold text-[#000144] no-underline">
              <span>מתחילים</span>
              <ArrowIcon size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Existing customers + other insurance lines */}
      <section id="services" className="px-6 pt-[88px]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-9">
          <div className="box-border flex !flex-row flex-wrap items-center justify-between gap-x-12 gap-y-7 rounded-[36px] border-[3px] border-[#000144] p-12">
            <div className="flex max-w-[620px] flex-col gap-3">
              <h2 className={h2Class}>כבר מבוטחים אצלנו?</h2>
              <p className="m-0 text-[20px] font-medium text-[#33405F]">
                מגישים תביעה אונליין ומעלים את המסמכים ישר מהטלפון. הסוכן שלכם מלווה אתכם עד הסוף.
              </p>
            </div>
            <div className="flex flex-wrap gap-3.5">
              <Link to="/claim" className="inline-flex min-h-[60px] items-center justify-center gap-2.5 rounded-[18px] bg-[#00A247] px-[30px] text-[20px] font-extrabold text-[#000144] no-underline">
                <FileText aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2.2} />
                <span>להגשת תביעה</span>
              </Link>
              <Link to="/forms" className="box-border inline-flex min-h-[60px] items-center justify-center gap-2.5 rounded-[18px] border-[3px] border-[#000144] px-[30px] text-[20px] font-extrabold text-[#000144] no-underline">
                <FileDown aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={2.2} />
                <span>טפסים להורדה</span>
              </Link>
            </div>
          </div>

          <h2 className={`${h2Class} mt-12`}>ביטוחים נוספים בסוכנות</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-5">
            {otherInsurance.map(({ to, icon: Icon, key }) => (
              <Link
                key={key}
                to={to}
                className="group box-border flex min-h-[200px] !flex-col justify-between gap-6 rounded-[28px] bg-[#F3F5F8] p-7 text-[#000144] no-underline transition-colors hover:bg-[#E6EAF0]"
              >
                <Icon aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 text-[28px] font-black leading-[1.05]">
                    {t(`services.${key}.title`)}
                    <span className="transition-transform group-hover:-translate-x-1">
                      <ArrowIcon size={20} />
                    </span>
                  </span>
                  <span className="text-[17px] font-medium text-[#33405F]">{t(`services.${key}.desc`)}</span>
                </div>
              </Link>
            ))}
            <Link
              to="/foreigners"
              className="group box-border flex min-h-[200px] !flex-col justify-between gap-6 rounded-[28px] bg-[#F3F5F8] p-7 text-[#000144] no-underline transition-colors hover:bg-[#E6EAF0]"
            >
              <Users aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-[28px] font-black leading-[1.05]">
                  עובדים זרים
                  <span className="transition-transform group-hover:-translate-x-1">
                    <ArrowIcon size={20} />
                  </span>
                </span>
                <span className="text-[17px] font-medium text-[#33405F]">ביטוח רפואי, עם טופס בקשה אונליין</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section aria-label="יצירת קשר" className="px-6 pb-10 pt-[88px]">
        <div className="mx-auto box-border flex max-w-[1200px] !flex-row flex-wrap items-center justify-between gap-x-12 gap-y-7 rounded-[36px] bg-[#F3F5F8] p-12">
          <h2 className={h2Class}>
            מעדיפים לדבר
            <br />
            עם בן אדם?
          </h2>
          <div className="flex flex-wrap gap-3.5">
            <a href="https://wa.me/972523333603" className="inline-flex min-h-[60px] items-center justify-center gap-2.5 rounded-[18px] bg-[#000144] px-[30px] text-[20px] font-extrabold text-white no-underline">
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>וואטסאפ</span>
            </a>
            <a href="tel:0732721111" className="box-border inline-flex min-h-[60px] items-center justify-center gap-2.5 rounded-[18px] border-[3px] border-[#000144] px-[30px] text-[20px] font-extrabold text-[#000144] no-underline">
              <span dir="ltr">073-2721111</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 pb-[88px] pt-14">
        <div className="mx-auto flex max-w-[860px] flex-col gap-6">
          <h2 className={h2Class}>שאלות</h2>
          <div className="flex flex-col gap-3">
            {faqKeys.map((n) => (
              <details key={n} className="rounded-[20px] bg-[#F3F5F8] px-6 py-1">
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center text-[22px] font-bold [&::-webkit-details-marker]:hidden">
                  {t(`faq.q${n}`)}
                </summary>
                <p className="mb-5 mt-0 text-[#33405F]">{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
          <Link to="/faq" className="self-start text-[18px] font-bold text-[#000144] underline hover:text-[#00A247]">
            לכל השאלות
          </Link>
        </div>
      </section>

      <AgencyFooter />
      <CookieBanner />
    </div>
  );
};

export default MockupV2;
