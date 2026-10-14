import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, Building2, Mail, MapPin, Phone, Printer, Shield, Users } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";
import { agencyBody, agencyBtnPrimary, agencyCard, agencyH2, agencyH3, AgencySection, ArrowIcon } from "@/components/AgencyUi";

const highlights = [
  { icon: Building2, title: "מאז 1977", description: "47+ שנות ניסיון" },
  { icon: Users, title: "10 עובדים", description: "צוות מקצועי ומנוסה" },
  { icon: Award, title: "מוניטין רב", description: "אמינות ומקצועיות" },
  { icon: Shield, title: "100%", description: "מחויבות ללקוח" },
];

const paragraphs = [
  "סוכנות אופיר ושות׳ הוקמה בשנת 1977 ומנוהלת ע״י מר אלי אופיר ומר הדר גלעד. בנוסף להם עובדים בסוכנות צוות מקצועי ומנוסה, ביניהם אנשי שיווק ומכירות הפועלים בכל רחבי הארץ.",
  "הסוכנות רכשה לה מוניטין רב בקרב חברות הביטוח והלקוחות, הן מבחינה מקצועית והן מבחינת המהימנות והמוסריות. הסוכנות פועלת כסוכנות חיתום בעלת סמכויות רחבות בתחום ההפקה ובתחום התביעות כאחד.",
  "היקף פעילות החברה גדל משנה לשנה, ועמו גדל גם מספר הלקוחות. סוכנות אופיר ושות׳ משרתת בנאמנות ובאמינות לקוחות מכל רחבי הארץ בכל תחומי ענפי הביטוח, החל בביטוח דירה, רכב, עסקים, ביטוחי נסיעות לחו״ל, ביטוח עובדים זרים ותיירים, ביטוח ימי וכלה בביטוחי חיים, בריאות וביטוחים פנסיוניים שונים.",
  "לסוכנות אופיר ושות׳ התמחות מיוחדת בביטוחי נסיעות לחו״ל ובתחום זה היא משמשת הזרוע השיווקית הבלעדית של חברת הראל בקרב כ-450 סוכנויות נסיעות המפוזרות בכל רחבי הארץ, מקרית שמונה שבצפון ועד אילת שבדרום.",
  "סוכנות אופיר ושות׳ משווקת את דרכוני הביטוח השונים לחו״ל המותאמים אישית לכל מבוטח, בהתאם לאופי הנסיעה שלו ולמצב בריאותו. בשנים האחרונות החלה החברה לבטח עובדים זרים וכן תיירים הנכנסים לישראל. ביטוחים אלו נעשים בשיתוף עם הראל חברה לביטוח.",
];

const contactIcon = "mt-0.5 h-6 w-6 flex-shrink-0";
const contactLabel = "m-0 text-[17px] font-bold text-[#000144]";
const contactValue = "m-0 text-[17px] font-medium text-[#33405F]";

const About = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <AgencyPage title="סוכנות אופיר ושות׳" subtitle="סוכנות לביטוח">
      {/* Highlights */}
      <AgencySection className="!pb-0">
        <h2 className="sr-only">אודותינו</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-5">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className={`${agencyCard} flex min-h-[200px] !flex-col justify-between gap-6`}>
              <Icon aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />
              <div className="flex flex-col gap-1">
                <span className="text-[32px] font-black leading-[1.05]">{title}</span>
                <span className="text-[18px] font-medium text-[#33405F]">{description}</span>
              </div>
            </div>
          ))}
        </div>
      </AgencySection>

      {/* Story + contact details */}
      <AgencySection>
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex max-w-[760px] flex-col gap-6">
            <h2 className={agencyH2}>הסיפור שלנו</h2>
            {paragraphs.map((text) => (
              <p key={text.slice(0, 24)} className={`${agencyBody} leading-[1.7]`}>
                {text}
              </p>
            ))}
            <p className="m-0 text-[20px] font-bold leading-[1.6] text-[#000144]">
              אנו מזמינים אתכם להיכנס לאתר ולהיות חלק ממשפחה אחת גדולה.
              <br />
              נשמח לעמוד לשירותכם בכל עת.
            </p>
            <p className="m-0 text-[24px] font-black text-[#000144]">אופיר ושות׳ סוכנות לביטוח</p>
          </div>

          <aside aria-labelledby="about-contact" className={`${agencyCard} flex flex-col gap-6 lg:sticky lg:top-6`}>
            <h2 id="about-contact" className={agencyH3}>
              פרטי התקשרות
            </h2>
            <ul className="m-0 flex list-none flex-col gap-5 p-0">
              <li className="flex items-start gap-3">
                <MapPin aria-hidden="true" className={contactIcon} strokeWidth={1.8} />
                <div>
                  <p className={contactLabel}>כתובתנו:</p>
                  <p className={contactValue}>
                    רח׳ מצדה 9 (מגדל בסר 3, קומה 24, ת.ד. 161)
                    <br />
                    בני-ברק
                    <br />
                    מיקוד: 5120109
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone aria-hidden="true" className={contactIcon} strokeWidth={1.8} />
                <div>
                  <p className={contactLabel}>טלפון:</p>
                  <a href="tel:073-2721111" className={`${contactValue} inline-flex min-h-[44px] items-center underline hover:text-[#000144]`}>
                    <span dir="ltr">073-2721111</span>
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Printer aria-hidden="true" className={contactIcon} strokeWidth={1.8} />
                <div>
                  <p className={contactLabel}>פקס:</p>
                  <p className={contactValue}>
                    <span dir="ltr">03-5480688</span>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail aria-hidden="true" className={contactIcon} strokeWidth={1.8} />
                <div className="min-w-0">
                  <p className={contactLabel}>מייל:</p>
                  <a href="mailto:ophir@ophirins.co.il" className={`${contactValue} inline-flex min-h-[44px] items-center break-all underline hover:text-[#000144]`}>
                    ophir@ophirins.co.il
                  </a>
                </div>
              </li>
            </ul>
            <Link to="/contact" className={`${agencyBtnPrimary} w-full`}>
              <span>צרו קשר</span>
              <ArrowIcon />
            </Link>
          </aside>
        </div>
      </AgencySection>
    </AgencyPage>
  );
};

export default About;
