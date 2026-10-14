import { Plane, Clock, CheckCircle2, AlertCircle, Globe, Heart, Briefcase } from "lucide-react";
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
} from "@/components/AgencyUi";

const coverageItems = [
  { icon: Heart, title: "הוצאות רפואיות", desc: "כיסוי עד 5 מיליון דולר להוצאות רפואיות, אשפוז ותרופות" },
  { icon: Plane, title: "פינוי רפואי", desc: "פינוי רפואי חירום והטסה רפואית לארץ במקרה הצורך" },
  { icon: Briefcase, title: "אובדן כבודה", desc: "פיצוי על אובדן, גניבה או עיכוב כבודה עד $2,250" },
  { icon: AlertCircle, title: "ביטול נסיעה", desc: "החזר הוצאות עד $5,000 במקרה של ביטול מסיבות רפואיות" },
  { icon: Globe, title: "כיסוי עולמי", desc: "כיסוי בכל יעד בעולם ללא הגבלה גאוגרפית" },
  { icon: Clock, title: "מוקד 24/7", desc: "מוקד חירום זמין 24 שעות ביממה, 7 ימים בשבוע" },
];

const extensions = [
  { title: "הריון", desc: "כיסוי עד 350,000$ לסיבוכי הריון עד שבוע 32" },
  { title: "ספורט חורף", desc: "הרחבה לסקי, סנובורד ופעילויות חורף" },
  { title: "ספורט אתגרי", desc: "כיסוי לפעילויות אקסטרים כמו צניחה וצלילה" },
  { title: "מצבים כרוניים", desc: "כיסוי להחמרה פתאומית של מצבים רפואיים קיימים" },
];

const eyebrow = "text-[16px] font-bold text-[#46557A]";

const TravelInsurance = () => (
  <AgencyPage
    title="ביטוח נסיעות לחו״ל"
    subtitle="טסו בראש שקט עם כיסוי מקיף ומושלם לכל מצב. הגנה מלאה לכם ולמשפחתכם בכל יעד בעולם."
    bandContent={
      <Link to="/purchase" className={agencyBtnPrimary}>
        <span>לרכישת ביטוח נסיעות</span>
        <ArrowIcon />
      </Link>
    }
  >
    {/* What is travel insurance */}
    <AgencySection className="!pb-0">
      <div className={`${agencyCard} flex max-w-[860px] flex-col gap-4 md:p-10`}>
        <h2 className="m-0 text-[clamp(28px,3vw,40px)] font-black leading-[1.05]">מהו ביטוח נסיעות לחו״ל?</h2>
        <p className={agencyBody}>
          ביטוח נסיעות לחו״ל הוא פוליסה המעניקה כיסוי רפואי ונלווה בזמן שהייה בחו״ל. הביטוח מכסה הוצאות רפואיות, אשפוז,
          פינוי רפואי, אובדן כבודה וביטול נסיעה. בנוסף, מעניק הביטוח גישה למוקד חירום 24/7 שיסייע לכם בכל מצב רפואי או
          לוגיסטי במהלך הנסיעה.
        </p>
      </div>
    </AgencySection>

    {/* Main coverages */}
    <AgencySection>
      <div className="flex flex-col gap-3">
        <span className={eyebrow}>מה כולל הביטוח?</span>
        <h2 className={agencyH2}>כיסויים עיקריים</h2>
        <p className={`${agencyBody} max-w-[760px]`}>
          ביטוח הנסיעות שלנו מכסה אתכם מכל כיוון עם הכיסויים המקיפים ביותר בשוק
        </p>
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

    {/* Extensions */}
    <AgencySection tone="gray">
      <div className="flex flex-col gap-3">
        <span className={eyebrow}>הרחבות</span>
        <h2 className={agencyH2}>הרחבות נוספות</h2>
        <p className={`${agencyBody} max-w-[760px]`}>התאימו את הביטוח לצרכים הייחודיים שלכם עם מגוון הרחבות</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-5">
        {extensions.map((ext) => (
          <div key={ext.title} className={`${agencyCardWhite} flex flex-col gap-3`}>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 aria-hidden="true" className="h-7 w-7 shrink-0 text-[#00A247]" strokeWidth={2} />
              <h3 className="m-0 text-[22px] font-black leading-[1.1]">{ext.title}</h3>
            </div>
            <p className="m-0 text-[17px] font-medium text-[#33405F]">{ext.desc}</p>
          </div>
        ))}
      </div>
    </AgencySection>

    {/* CTA */}
    <AgencySection tone="navy">
      <div className="flex flex-col gap-3">
        <h2 className={agencyH2}>מוכנים לטוס בראש שקט?</h2>
        <p className="m-0 text-[20px] font-medium text-[#E3EAFF]">קבלו הצעת מחיר מיידית והזמינו את ביטוח הנסיעות שלכם עכשיו</p>
      </div>
      <div className="flex flex-wrap gap-3.5">
        <Link to="/purchase" className={agencyBtnPrimary}>
          <span>לרכישת ביטוח</span>
          <ArrowIcon />
        </Link>
      </div>
    </AgencySection>

    <AgencyContactStrip />
    <CookieBanner />
  </AgencyPage>
);

export default TravelInsurance;
