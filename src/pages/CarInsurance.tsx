import { Car, Shield, Clock, Phone, CheckCircle2, Wrench, FileText, AlertTriangle, Zap, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import { useLanguage } from "@/contexts/LanguageContext";

const CarInsurance = () => {
  const { isRTL } = useLanguage();
  
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

  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)' }}>
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Car className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              ביטוח רכב
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              כיסוי מקיף לרכב שלכם במחירים תחרותיים. הגנה מלאה לכל מצב עם שירות אישי ומקצועי.
            </p>
            <Link to="/contact">
              <Button size="xl" className="shadow-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold hover:from-blue-500 hover:to-blue-700 hover:scale-105 transition-all border-0">
                <Mail className="w-5 h-5" />
                קבלו הצעת מחיר
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is Car Insurance Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">מהו ביטוח רכב?</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              ביטוח רכב הוא פוליסה המעניקה הגנה כלכלית במקרה של נזק לרכב או לצד שלישי. 
              ישנם סוגי ביטוח שונים: ביטוח חובה (המכסה נזקי גוף), ביטוח צד ג׳ (המכסה נזקי רכוש לאחרים) וביטוח מקיף (המכסה גם נזקים לרכב שלכם). 
              הביטוח כולל גם שירותי דרך, רכב חלופי וליווי בתביעות.
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
              ביטוח הרכב שלנו מעניק לכם הגנה מלאה לכל מצב על הכביש
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

      {/* Advantages Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">למה אנחנו?</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                היתרונות שלנו
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                אנו מציעים לכם את השירות הטוב ביותר בשוק עם יתרונות בלעדיים
              </p>
              <ul className="space-y-4">
                {advantages.map((advantage, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-foreground">{advantage}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-4">רוצים לשמוע עוד?</h3>
              <p className="text-muted-foreground mb-6">
                השאירו פרטים ונציג מטעמנו יחזור אליכם עם הצעת מחיר מותאמת אישית
              </p>
              <div className="space-y-4">
                <a href="tel:+972732721111" className="flex items-center gap-3 text-foreground hover:text-secondary transition-colors">
                  <Phone className="w-5 h-5 text-secondary" />
                  073-2721111
                </a>
                <Link to="/contact">
                  <Button variant="cta" className="w-full">
                    השאירו פרטים
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}>
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <Car className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              מוכנים לחסוך בביטוח הרכב?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              צרו קשר עכשיו וקבלו הצעת מחיר אטרקטיבית
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link to="/contact">
                <Button size="xl" className="bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold hover:from-blue-500 hover:to-blue-700 hover:scale-105 transition-all border-0 shadow-lg">
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

export default CarInsurance;
