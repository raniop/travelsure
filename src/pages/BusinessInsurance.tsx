import { Building2, Shield, Clock, Phone, CheckCircle2, Users, FileText, Briefcase, TrendingUp, Lock, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import { useLanguage } from "@/contexts/LanguageContext";

const BusinessInsurance = () => {
  const { isRTL } = useLanguage();
  
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

  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24" style={{ background: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)' }}>
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              ביטוח עסקים
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              פתרונות ביטוח מקיפים ומותאמים אישית לעסקים בכל גודל. הגנה מלאה שתאפשר לכם להתמקד בצמיחה.
            </p>
            <Link to="/contact">
              <Button variant="hero" size="xl" className="shadow-lg">
                קבלו הצעת מחיר
                <Building2 className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is Business Insurance Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">מהו ביטוח עסקים?</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              ביטוח עסקים הוא מארז פוליסות המיועד להגן על העסק שלכם מפני סיכונים שונים. 
              הביטוח כולל הגנה על הרכוש הפיזי של העסק, כיסוי לאחריות מקצועית ואחריות כלפי צד שלישי, 
              ביטוח אובדן הכנסות במקרה של נזק, וכיסוי לתביעות עובדים. כל עסק זקוק לחבילת ביטוח מותאמת לפעילותו הייחודית.
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
              מגוון פתרונות ביטוח שיגנו על העסק שלכם מכל כיוון
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

      {/* Business Types Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">התמחויות</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">סוגי עסקים</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              אנו מתמחים בביטוח למגוון רחב של תחומים עסקיים
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {businessTypes.map((item, index) => (
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
                היתרונות שלנו לעסקים
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">ניתוח סיכונים מקצועי</span>
                    <p className="text-muted-foreground text-sm">בדיקה מעמיקה של הסיכונים הייחודיים לעסק שלכם</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">חבילות מותאמות אישית</span>
                    <p className="text-muted-foreground text-sm">פתרונות ביטוח שנבנים במיוחד לצרכים שלכם</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">ליווי לאורך כל הדרך</span>
                    <p className="text-muted-foreground text-sm">תמיכה מקצועית בתביעות ושאלות</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <span className="font-bold text-foreground">מחירים תחרותיים</span>
                    <p className="text-muted-foreground text-sm">עבודה עם חברות הביטוח המובילות לקבלת המחיר הטוב ביותר</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="text-2xl font-bold text-foreground mb-4">רוצים לשמוע עוד?</h3>
              <p className="text-muted-foreground mb-6">
                נציג מטעמנו יחזור אליכם עם ניתוח סיכונים והצעת מחיר מותאמת לעסק שלכם
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
      <section className="section-padding" style={{ background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' }}>
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              מוכנים להגן על העסק שלכם?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              צרו קשר עכשיו לקבלת ייעוץ מקצועי והצעת מחיר
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
              <Link to="/contact">
                <Button variant="hero" size="xl">
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

export default BusinessInsurance;
