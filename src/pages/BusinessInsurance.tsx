import { Building2, CheckCircle2, Users, FileText, Briefcase, TrendingUp, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import AgencyPage from "@/components/AgencyPage";
import CookieBanner from "@/components/CookieBanner";
import {
  AgencyContactStrip,
  AgencySection,
  ArrowIcon,
  agencyBody,
  agencyBtnPrimary,
  agencyCard,
  agencyCardWhite,
  agencyH2,
  agencyH3,
} from "@/components/AgencyUi";

const coverageItems = [
  { icon: Building2, title: "ביטוח רכוש", desc: "הגנה על מבנה העסק, ציוד, מלאי ותכולה מפני נזקים" },
  { icon: Users, title: "אחריות מקצועית", desc: "כיסוי לתביעות בגין טעויות או רשלנות מקצועית" },
  { icon: Briefcase, title: "אחריות מעבידים", desc: "כיסוי לתאונות עבודה ופציעות עובדים" },
  { icon: Lock, title: "אחריות צד ג׳", desc: "הגנה מפני תביעות של לקוחות או ספקים" },
  { icon: TrendingUp, title: "אובדן הכנסות", desc: "פיצוי על הכנסות שאבדו בעקבות נזק לעסק" },
  { icon: FileText, title: "ביטוח סייבר", desc: "הגנה מפני התקפות סייבר ודליפת מידע" },
];

const businessTypes = [
  { title: "עסקים קטנים", desc: "חבילות מותאמות לעסקים קטנים ובינוניים" },
  { title: "חברות הייטק", desc: "פתרונות מתקדמים לחברות טכנולוגיה" },
  { title: "קמעונאות", desc: "ביטוח לחנויות ורשתות מסחריות" },
  { title: "שירותים מקצועיים", desc: "עורכי דין, רואי חשבון ויועצים" },
];

const advantages = [
  { title: "ניתוח סיכונים מקצועי", desc: "בדיקה מעמיקה של הסיכונים הייחודיים לעסק שלכם" },
  { title: "חבילות מותאמות אישית", desc: "פתרונות ביטוח שנבנים במיוחד לצרכים שלכם" },
  { title: "ליווי לאורך כל הדרך", desc: "תמיכה מקצועית בתביעות ושאלות" },
  { title: "מחירים תחרותיים", desc: "עבודה עם חברות הביטוח המובילות לקבלת המחיר הטוב ביותר" },
];

const eyebrow = "text-[16px] font-bold text-[#46557A]";

const BusinessInsurance = () => (
  <AgencyPage
    title="ביטוח עסקים"
    subtitle="פתרונות ביטוח מקיפים ומותאמים אישית לעסקים בכל גודל. הגנה מלאה שתאפשר לכם להתמקד בצמיחה."
    bandContent={
      <Link to="/contact" className={agencyBtnPrimary}>
        <span>קבלו הצעת מחיר</span>
        <ArrowIcon />
      </Link>
    }
  >
    {/* What is business insurance */}
    <AgencySection className="!pb-0">
      <div className={`${agencyCard} flex max-w-[860px] flex-col gap-4 md:p-10`}>
        <h2 className="m-0 text-[clamp(28px,3vw,40px)] font-black leading-[1.05]">מהו ביטוח עסקים?</h2>
        <p className={agencyBody}>
          ביטוח עסקים הוא מארז פוליסות המיועד להגן על העסק שלכם מפני סיכונים שונים. הביטוח כולל הגנה על הרכוש הפיזי של
          העסק, כיסוי לאחריות מקצועית ואחריות כלפי צד שלישי, ביטוח אובדן הכנסות במקרה של נזק, וכיסוי לתביעות עובדים. כל
          עסק זקוק לחבילת ביטוח מותאמת לפעילותו הייחודית.
        </p>
      </div>
    </AgencySection>

    {/* Main coverages */}
    <AgencySection>
      <div className="flex flex-col gap-3">
        <span className={eyebrow}>מה כולל הביטוח?</span>
        <h2 className={agencyH2}>כיסויים עיקריים</h2>
        <p className={`${agencyBody} max-w-[760px]`}>מגוון פתרונות ביטוח שיגנו על העסק שלכם מכל כיוון</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
        {coverageItems.map(({ icon: Icon, title, desc }) => (
          <div key={title} className={`${agencyCard} flex min-h-[220px] !flex-col justify-between gap-6`}>
            <Icon aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[28px] font-black leading-[1.05]">{title}</h3>
              <p className="m-0 text-[17px] font-medium text-[#33405F]">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AgencySection>

    {/* Business types */}
    <AgencySection tone="gray">
      <div className="flex flex-col gap-3">
        <span className={eyebrow}>התמחויות</span>
        <h2 className={agencyH2}>סוגי עסקים</h2>
        <p className={`${agencyBody} max-w-[760px]`}>אנו מתמחים בביטוח למגוון רחב של תחומים עסקיים</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-5">
        {businessTypes.map((item) => (
          <div key={item.title} className={`${agencyCardWhite} flex flex-col gap-3`}>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 aria-hidden="true" className="h-7 w-7 shrink-0 text-[#00A247]" strokeWidth={2} />
              <h3 className="m-0 text-[22px] font-black leading-[1.1]">{item.title}</h3>
            </div>
            <p className="m-0 text-[17px] font-medium text-[#33405F]">{item.desc}</p>
          </div>
        ))}
      </div>
    </AgencySection>

    {/* Why us */}
    <AgencySection>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-x-12 gap-y-9">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className={eyebrow}>למה אנחנו?</span>
            <h2 className={agencyH2}>היתרונות שלנו לעסקים</h2>
          </div>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {advantages.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-[#00A247]" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[19px] font-extrabold">{item.title}</span>
                  <span className="text-[17px] font-medium text-[#33405F]">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="box-border flex flex-col gap-4 rounded-[28px] bg-[#000144] p-8 text-white md:p-10">
          <h3 className={agencyH3}>רוצים לשמוע עוד?</h3>
          <p className="m-0 text-[18px] font-medium text-[#E3EAFF]">
            נציג מטעמנו יחזור אליכם עם ניתוח סיכונים והצעת מחיר מותאמת לעסק שלכם
          </p>
          <Link to="/contact" className={`${agencyBtnPrimary} mt-2 w-full box-border`}>
            <span>השאירו פרטים</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </AgencySection>

    {/* CTA */}
    <AgencySection tone="navy">
      <div className="flex flex-col gap-3">
        <h2 className={agencyH2}>מוכנים להגן על העסק שלכם?</h2>
        <p className="m-0 text-[20px] font-medium text-[#E3EAFF]">צרו קשר עכשיו לקבלת ייעוץ מקצועי והצעת מחיר</p>
      </div>
      <div className="flex flex-wrap gap-3.5">
        <Link to="/contact" className={agencyBtnPrimary}>
          <span>קבלו הצעת מחיר</span>
          <ArrowIcon />
        </Link>
      </div>
    </AgencySection>

    <AgencyContactStrip />
    <CookieBanner />
  </AgencyPage>
);

export default BusinessInsurance;
