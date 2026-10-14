import { Home, CheckCircle2, Droplets, Flame, Lock, Sofa } from "lucide-react";
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
  { icon: Home, title: "ביטוח מבנה", desc: "כיסוי מלא למבנה הדירה כולל קירות, תשתיות ומערכות" },
  { icon: Sofa, title: "ביטוח תכולה", desc: "הגנה על כל תכולת הבית כולל רהיטים, מכשירי חשמל ובגדים" },
  { icon: Droplets, title: "נזקי מים", desc: "כיסוי לנזקי צנרת, הצפות ונזילות" },
  { icon: Flame, title: "שריפה ופיצוץ", desc: "כיסוי מלא לנזקי שריפה, פיצוץ ועשן" },
  { icon: Lock, title: "גניבה ופריצה", desc: "פיצוי על גניבה ופריצה כולל נזק למנעולים" },
];

const additionalCoverages = [
  { title: "אחריות כלפי צד שלישי", desc: "כיסוי לנזקים שנגרמו לאחרים בתוך הדירה" },
  { title: "דיור חלופי", desc: "מימון דיור חלופי בזמן תיקון הדירה" },
  { title: "שמשות וחלונות", desc: "החלפת שמשות שנשברו מכל סיבה" },
  { title: "מזגנים ודודים", desc: "כיסוי למערכות חימום וקירור" },
];

const advantages = [
  { title: "השוואת מחירים", desc: "השוואה בין חברות הביטוח המובילות לקבלת המחיר הטוב ביותר" },
  { title: "התאמה אישית", desc: "פוליסה מותאמת לצרכים הספציפיים של הדירה שלכם" },
  { title: "ליווי בתביעות", desc: "תמיכה מקצועית לאורך כל תהליך התביעה" },
  { title: "שירות אישי", desc: "נציג אישי זמין עבורכם בכל שאלה" },
];

const eyebrow = "text-[16px] font-bold text-[#46557A]";

const HomeInsurance = () => (
  <AgencyPage
    title="ביטוח דירה"
    subtitle="הגנה מלאה על הבית שלכם ותכולתו. שקט נפשי מוחלט עם ביטוח דירה מקיף ומותאם אישית."
    bandContent={
      <Link to="/contact" className={agencyBtnPrimary}>
        <span>קבלו הצעת מחיר</span>
        <ArrowIcon />
      </Link>
    }
  >
    {/* What is home insurance */}
    <AgencySection className="!pb-0">
      <div className={`${agencyCard} flex max-w-[860px] flex-col gap-4 md:p-10`}>
        <h2 className="m-0 text-[clamp(28px,3vw,40px)] font-black leading-[1.05]">מהו ביטוח דירה?</h2>
        <p className={agencyBody}>
          ביטוח דירה הוא פוליסה המעניקה הגנה כלכלית על הנכס שלכם - הן על המבנה עצמו והן על תכולת הבית. הביטוח מכסה
          נזקים שונים כגון שריפה, נזקי מים, פריצה וגניבה, ומספק לכם שקט נפשי ורשת ביטחון כלכלית במקרה של אירוע בלתי צפוי.
        </p>
        <p className={`${agencyBody} font-bold text-[#000144]`}>
          חשוב לדעת: ביטוח דירה סטנדרטי אינו מכסה נזקי חשמל - לכיסוי זה יש לרכוש הרחבה ייעודית.
        </p>
      </div>
    </AgencySection>

    {/* Main coverages */}
    <AgencySection>
      <div className="flex flex-col gap-3">
        <span className={eyebrow}>מה כולל הביטוח?</span>
        <h2 className={agencyH2}>כיסויים עיקריים</h2>
        <p className={`${agencyBody} max-w-[760px]`}>ביטוח דירה מקיף שמכסה את הבית שלכם מכל סיכון אפשרי</p>
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

    {/* Additional coverages */}
    <AgencySection tone="gray">
      <div className="flex flex-col gap-3">
        <span className={eyebrow}>הרחבות</span>
        <h2 className={agencyH2}>כיסויים נוספים</h2>
        <p className={`${agencyBody} max-w-[760px]`}>הרחבות שיעניקו לכם הגנה מקסימלית</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-5">
        {additionalCoverages.map((item) => (
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
            <h2 className={agencyH2}>היתרונות שלנו</h2>
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
          <p className="m-0 text-[18px] font-medium text-[#E3EAFF]">נציג מטעמנו יחזור אליכם עם הצעת מחיר מותאמת לדירה שלכם</p>
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
        <h2 className={agencyH2}>מוכנים להגן על הבית שלכם?</h2>
        <p className="m-0 text-[20px] font-medium text-[#E3EAFF]">קבלו הצעת מחיר מותאמת אישית לדירה שלכם</p>
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

export default HomeInsurance;
