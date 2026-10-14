import { Shield, Clock, CheckCircle2, Wrench, FileText, AlertTriangle, Zap } from "lucide-react";
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
  agencyH2,
  agencyH3,
} from "@/components/AgencyUi";

const coverageItems = [
  { icon: Shield, title: "ביטוח מקיף", desc: "כיסוי מלא לרכב שלכם כולל נזקי תאונה, גניבה ושריפה" },
  { icon: AlertTriangle, title: "צד ג׳", desc: "כיסוי לנזקים שנגרמו לצד שלישי כולל רכוש וגוף" },
  { icon: Wrench, title: "רכב חלופי", desc: "רכב חלופי בזמן תיקון הרכב שלכם" },
  { icon: Zap, title: "שירות חירום", desc: "גרירה ושירות דרך 24/7 בכל רחבי הארץ" },
  { icon: FileText, title: "ייעוץ מקצועי", desc: "ליווי מלא בתהליך התביעה מול חברת הביטוח" },
  { icon: Clock, title: "טיפול מהיר", desc: "טיפול מהיר ויעיל בתביעות עם מעקב אישי" },
];

const advantages = [
  "מחירים תחרותיים מחברות הביטוח המובילות",
  "השוואת מחירים בין מספר חברות ביטוח",
  "ליווי אישי לאורך כל תקופת הפוליסה",
  "טיפול מקצועי בתביעות",
  "הנחות מיוחדות לנהגים טובים",
  "אפשרות לתשלומים ללא ריבית",
];

const eyebrow = "text-[16px] font-bold text-[#46557A]";

const CarInsurance = () => (
  <AgencyPage
    title="ביטוח רכב"
    subtitle="כיסוי מקיף לרכב שלכם במחירים תחרותיים. הגנה מלאה לכל מצב עם שירות אישי ומקצועי."
    bandContent={
      <Link to="/contact" className={agencyBtnPrimary}>
        <span>קבלו הצעת מחיר</span>
        <ArrowIcon />
      </Link>
    }
  >
    {/* What is car insurance */}
    <AgencySection className="!pb-0">
      <div className={`${agencyCard} flex max-w-[860px] flex-col gap-4 md:p-10`}>
        <h2 className="m-0 text-[clamp(28px,3vw,40px)] font-black leading-[1.05]">מהו ביטוח רכב?</h2>
        <p className={agencyBody}>
          ביטוח רכב הוא פוליסה המעניקה הגנה כלכלית במקרה של נזק לרכב או לצד שלישי. ישנם סוגי ביטוח שונים: ביטוח חובה
          (המכסה נזקי גוף), ביטוח צד ג׳ (המכסה נזקי רכוש לאחרים) וביטוח מקיף (המכסה גם נזקים לרכב שלכם). הביטוח כולל גם
          שירותי דרך, רכב חלופי וליווי בתביעות.
        </p>
      </div>
    </AgencySection>

    {/* Main coverages */}
    <AgencySection>
      <div className="flex flex-col gap-3">
        <span className={eyebrow}>מה כולל הביטוח?</span>
        <h2 className={agencyH2}>כיסויים עיקריים</h2>
        <p className={`${agencyBody} max-w-[760px]`}>ביטוח הרכב שלנו מעניק לכם הגנה מלאה לכל מצב על הכביש</p>
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

    {/* Advantages */}
    <AgencySection tone="gray">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-x-12 gap-y-9">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <span className={eyebrow}>למה אנחנו?</span>
            <h2 className={agencyH2}>היתרונות שלנו</h2>
            <p className={agencyBody}>אנו מציעים לכם את השירות הטוב ביותר בשוק עם יתרונות בלעדיים</p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {advantages.map((advantage) => (
              <li key={advantage} className="flex items-start gap-3 text-[18px] font-semibold">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-[#00A247]" strokeWidth={2} />
                <span>{advantage}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="box-border flex flex-col gap-4 rounded-[28px] bg-[#000144] p-8 text-white md:p-10">
          <h3 className={agencyH3}>רוצים לשמוע עוד?</h3>
          <p className="m-0 text-[18px] font-medium text-[#E3EAFF]">
            השאירו פרטים ונציג מטעמנו יחזור אליכם עם הצעת מחיר מותאמת אישית
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
        <h2 className={agencyH2}>מוכנים לחסוך בביטוח הרכב?</h2>
        <p className="m-0 text-[20px] font-medium text-[#E3EAFF]">צרו קשר עכשיו וקבלו הצעת מחיר אטרקטיבית</p>
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

export default CarInsurance;
