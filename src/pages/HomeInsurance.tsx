import { Home, Shield, Clock, Phone, CheckCircle2, Droplets, Flame, Lock, Sofa, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import { useLanguage } from "@/contexts/LanguageContext";

const HomeInsurance = () => {
  const { isRTL } = useLanguage();
  
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

  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)' }}>
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              ביטוח דירה
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              הגנה מלאה על הבית שלכם ותכולתו. שקט נפשי מוחלט עם ביטוח דירה מקיף ומותאם אישית.
            </p>
            <Link to="/contact">
              <Button size="xl" className="shadow-lg bg-gradient-to-r from-purple-400 to-violet-500 text-white font-bold hover:from-purple-500 hover:to-violet-600 hover:scale-105 transition-all border-0">
                <Mail className="w-5 h-5" />
                קבלו הצעת מחיר
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is Home Insurance Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">מהו ביטוח דירה?</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              ביטוח דירה הוא פוליסה המעניקה הגנה כלכלית על הנכס שלכם - הן על המבנה עצמו והן על תכולת הבית. 
              הביטוח מכסה נזקים שונים כגון שריפה, נזקי מים, פריצה וגניבה, ומספק לכם שקט נפשי ורשת ביטחון כלכלית במקרה של אירוע בלתי צפוי.
              חשוב לדעת: ביטוח דירה סטנדרטי אינו מכסה נזקי חשמל - לכיסוי זה יש לרכוש הרחבה ייעודית.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">מה כולל הביטוח?</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">כיסויים עיקריים</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              ביטוח דירה מקיף שמכסה את הבית שלכם מכל סיכון אפשרי
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverageItems.map((item, index) => (
              <div key={index} className="bg-card rounded-2xl p-6 border border-border hover:border-secondary/50 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Coverage Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">הרחבות</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">כיסויים נוספים</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              הרחבות שיעניקו לכם הגנה מקסימלית
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {additionalCoverages.map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border hover:border-secondary/50 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <h3 className="font-bold text-foreground">{item.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">למה אנחנו?</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                היתרונות שלנו
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">השוואת מחירים</span>
                    <p className="text-muted-foreground text-sm">השוואה בין חברות הביטוח המובילות לקבלת המחיר הטוב ביותר</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">התאמה אישית</span>
                    <p className="text-muted-foreground text-sm">פוליסה מותאמת לצרכים הספציפיים של הדירה שלכם</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">ליווי בתביעות</span>
                    <p className="text-muted-foreground text-sm">תמיכה מקצועית לאורך כל תהליך התביעה</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">שירות אישי</span>
                    <p className="text-muted-foreground text-sm">נציג אישי זמין עבורכם בכל שאלה</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-4">רוצים לשמוע עוד?</h3>
              <p className="text-muted-foreground mb-6">
                נציג מטעמנו יחזור אליכם עם הצעת מחיר מותאמת לדירה שלכם
              </p>
              <Link to="/contact">
                <Button variant="cta" className="w-full">
                  השאירו פרטים
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' }}>
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              מוכנים להגן על הבית שלכם?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              קבלו הצעת מחיר מותאמת אישית לדירה שלכם
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link to="/contact">
                <Button size="xl" className="bg-gradient-to-r from-purple-400 to-violet-500 text-white font-bold hover:from-purple-500 hover:to-violet-600 hover:scale-105 transition-all border-0 shadow-lg">
                  <Mail className="w-5 h-5" />
                  קבלו הצעת מחיר
                </Button>
              </Link>
              <a href="https://wa.me/972523333603" target="_blank" rel="noopener noreferrer">
                <Button variant="serviceWhite" size="xl" className="bg-green-500 text-white hover:bg-green-600 border-0">
                  <MessageCircle className="w-5 h-5" />
                  וואטסאפ
                </Button>
              </a>
              <a href="tel:+972732721111">
                <Button variant="serviceWhite" size="xl">
                  <Phone className="w-5 h-5" />
                  073-2721111
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <CookieBanner />
    </div>
  );
};

export default HomeInsurance;
