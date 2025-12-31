import { Plane, Shield, Clock, Phone, CheckCircle2, AlertCircle, Globe, Heart, Briefcase, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import { useLanguage } from "@/contexts/LanguageContext";

const TravelInsurance = () => {
  const { isRTL, t } = useLanguage();
  
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

  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24" style={{ background: 'linear-gradient(135deg, #0f3d3a 0%, #134e4a 30%, #1a6b5f 60%, #22877a 100%)' }}>
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Plane className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              ביטוח נסיעות לחו״ל
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              טסו בראש שקט עם כיסוי מקיף ומושלם לכל מצב. הגנה מלאה לכם ולמשפחתכם בכל יעד בעולם.
            </p>
            <Link to="/purchase">
              <Button variant="hero" size="xl" className="shadow-lg">
                לרכישת ביטוח נסיעות
                <Plane className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What is Travel Insurance Section */}
      <section className="section-padding bg-muted/30">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">מהו ביטוח נסיעות לחו״ל?</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              ביטוח נסיעות לחו״ל הוא פוליסה המעניקה כיסוי רפואי ונלווה בזמן שהייה בחו״ל. 
              הביטוח מכסה הוצאות רפואיות, אשפוז, פינוי רפואי, אובדן כבודה וביטול נסיעה. 
              בנוסף, מעניק הביטוח גישה למוקד חירום 24/7 שיסייע לכם בכל מצב רפואי או לוגיסטי במהלך הנסיעה.
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
              ביטוח הנסיעות שלנו מכסה אתכם מכל כיוון עם הכיסויים המקיפים ביותר בשוק
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

      {/* Extensions Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">הרחבות</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">הרחבות נוספות</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              התאימו את הביטוח לצרכים הייחודיים שלכם עם מגוון הרחבות
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {extensions.map((ext, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border hover:border-secondary/50 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <h3 className="font-bold text-foreground">{ext.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{ext.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 100%)' }}>
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              מוכנים לטוס בראש שקט?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              קבלו הצעת מחיר מיידית והזמינו את ביטוח הנסיעות שלכם עכשיו
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/purchase">
                <Button variant="hero" size="xl">
                  לרכישת ביטוח
                  <Plane className="w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+972732721111">
                <Button variant="outline" size="xl" className="border-white/30 text-white hover:bg-white/10">
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

export default TravelInsurance;
