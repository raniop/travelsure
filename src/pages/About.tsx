import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Building2, Users, Award, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { isRTL } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const highlights = [
    { icon: Building2, title: "מאז 1977", description: "שנות ניסיון בתחום הביטוח" },
    { icon: Users, title: "18+ עובדים", description: "צוות מקצועי ומנוסה" },
    { icon: Award, title: "מוניטין רב", description: "אמינות ומקצועיות" },
    { icon: Shield, title: "450+ סוכנויות", description: "רשת שיווק ארצית" }
  ];

  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="h-16 md:h-20" />
      
      {/* Hero Section */}
      <section className="section-padding" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 50%, #22877a 100%)' }}>
        <div className="container-wide">
          <AnimatedSection animation="fade-up">
            <div className="text-center max-w-4xl mx-auto">
              <span className="font-semibold text-sm tracking-wider uppercase mb-4 block" style={{ color: '#86efac' }}>אודותינו</span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                סוכנות אופיר ושות׳
                <span className="block mt-2" style={{ color: '#86efac' }}>סוכנות לביטוח</span>
              </h1>
            </div>
          </AnimatedSection>

          {/* Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {highlights.map((item, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                animation="scale-up"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
                  <item.icon className="w-8 h-8 mx-auto mb-3" style={{ color: '#86efac' }} />
                  <div className="text-xl font-bold text-white mb-1">{item.title}</div>
                  <div className="text-white/70 text-sm">{item.description}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* About Text */}
            <div className="lg:col-span-2">
              <AnimatedSection animation="fade-right">
                <div className="prose prose-lg max-w-none">
                  <p className="text-foreground/80 text-lg leading-relaxed mb-6">
                    סוכנות אופיר ושות׳ הוקמה בשנת 1977 ומנוהלת ע״י מר אלי אופיר ומר הדר גלעד.
                    בנוסף להם עובדים בסוכנות עוד 18 איש, ביניהם אנשי שיווק ומכירות הפועלים בכל רחבי הארץ.
                  </p>
                  <p className="text-foreground/80 text-lg leading-relaxed mb-6">
                    הסוכנות רכשה לה מוניטין רב בקרב חברות הביטוח והלקוחות, הן מבחינה מקצועית והן מבחינת המהימנות והמוסריות.
                    הסוכנות פועלת כסוכנות חיתום בעלת סמכויות רחבות בתחום ההפקה ובתחום התביעות כאחד.
                  </p>
                  <p className="text-foreground/80 text-lg leading-relaxed mb-6">
                    היקף פעילות החברה גדל משנה לשנה, ועמו גדל גם מספר הלקוחות. סוכנות אופיר ושות׳ משרתת בנאמנות ובאמינות לקוחות מכל רחבי הארץ בכל תחומי ענפי הביטוח, החל בביטוח דירה, רכב, עסקים, ביטוחי נסיעות לחו״ל, ביטוח עובדים זרים ותיירים, ביטוח ימי וכלה בביטוחי חיים, בריאות וביטוחים פנסיוניים שונים.
                  </p>
                  <p className="text-foreground/80 text-lg leading-relaxed mb-6">
                    לסוכנות אופיר ושות׳ התמחות מיוחדת בביטוחי נסיעות לחו״ל ובתחום זה היא משמשת הזרוע השיווקית הבלעדית של חברת הראל בקרב כ-450 סוכנויות נסיעות המפוזרות בכל רחבי הארץ, מקרית שמונה שבצפון ועד אילת שבדרום.
                  </p>
                  <p className="text-foreground/80 text-lg leading-relaxed mb-6">
                    סוכנות אופיר ושות׳ משווקת את דרכוני הביטוח השונים לחו״ל המותאמים אישית לכל מבוטח, בהתאם לאופי הנסיעה שלו ולמצב בריאותו. בשנים האחרונות החלה החברה לבטח עובדים זרים וכן תיירים הנכנסים לישראל. ביטוחים אלו נעשים בשיתוף עם הראל חברה לביטוח.
                  </p>
                  <p className="text-foreground/80 text-lg leading-relaxed mb-8 font-medium" style={{ color: '#134e4a' }}>
                    אנו מזמינים אתכם להיכנס לאתר ולהיות חלק ממשפחה אחת גדולה.
                    נשמח לעמוד לשירותכם בכל עת.
                  </p>
                  <p className="text-xl font-bold" style={{ color: '#134e4a' }}>
                    אופיר ושות׳ סוכנות לביטוח
                  </p>
                </div>
              </AnimatedSection>
            </div>

            {/* Contact Card */}
            <div className="lg:col-span-1">
              <AnimatedSection animation="fade-left">
                <div className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-border sticky top-24">
                  <h3 className="text-xl font-bold text-foreground mb-6">פרטי התקשרות</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#134e4a' }} />
                      <div>
                        <p className="text-foreground font-medium">כתובתנו:</p>
                        <p className="text-foreground/70 text-sm">
                          רח׳ מצדה 9 (מגדל בסר 3, קומה 24, ת.ד. 161)
                          <br />
                          בני-ברק
                          <br />
                          מיקוד: 5120109
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 flex-shrink-0" style={{ color: '#134e4a' }} />
                      <div>
                        <p className="text-foreground font-medium">טלפון:</p>
                        <a href="tel:073-2721111" className="text-foreground/70 text-sm hover:underline">
                          073-2721111
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 flex-shrink-0" style={{ color: '#134e4a' }} />
                      <div>
                        <p className="text-foreground font-medium">פקס:</p>
                        <span className="text-foreground/70 text-sm">03-5480688</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 flex-shrink-0" style={{ color: '#134e4a' }} />
                      <div>
                        <p className="text-foreground font-medium">מייל:</p>
                        <a href="mailto:ophir@ophirins.co.il" className="text-foreground/70 text-sm hover:underline">
                          ophir@ophirins.co.il
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link to="/contact">
                      <Button variant="hero" size="lg" className="w-full">
                        <Phone className="w-5 h-5" />
                        צרו קשר
                      </Button>
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-8" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 100%)' }}>
        <div className="container-wide text-center text-sm text-white/50">
          <p>© {new Date().getFullYear()} אופיר ושות׳ סוכנות לביטוח. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
