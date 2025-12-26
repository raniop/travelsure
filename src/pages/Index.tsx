import { Phone, Mail, MessageCircle, Clock, Users, Plane, Building2, Home, Car, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import ContactForm from "@/components/ContactForm";
import CookieBanner from "@/components/CookieBanner";
import logo from "@/assets/logo.avif";

const Index = () => {
  return (
    <div className="min-h-screen font-heebo" dir="rtl">
      <Header />
      <HeroSection />
      <ServicesSection />
      <AboutSection />
      <ExtensionsSection />
      <ContactSection />
      <Footer />
      <CookieBanner />
    </div>
  );
};

// Header Component
const Header = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="TravelSure לוגו" className="h-10 md:h-12 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium">שירותים</a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium">אודות</a>
            <Link to="/faq" className="text-foreground hover:text-primary transition-colors font-medium">שאלות נפוצות</Link>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">צור קשר</a>
          </nav>

          {/* CTA Button */}
          <Button variant="cta" size="default" className="hidden sm:flex">
            <Phone className="w-4 h-4" />
            התקשרו עכשיו
          </Button>
        </div>
      </div>
    </header>
  );
};

// Animated Background Component
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient orbs */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl animate-float-slow"
        style={{ 
          background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)',
          top: '-10%',
          right: '-10%',
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-3xl animate-float-medium"
        style={{ 
          background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)',
          bottom: '10%',
          left: '-15%',
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl animate-float-fast"
        style={{ 
          background: 'radial-gradient(circle, #86efac 0%, transparent 70%)',
          top: '40%',
          right: '20%',
        }}
      />
      <div 
        className="absolute w-[300px] h-[300px] rounded-full opacity-25 blur-2xl animate-pulse-slow"
        style={{ 
          background: 'radial-gradient(circle, #2dd4bf 0%, transparent 70%)',
          bottom: '20%',
          right: '10%',
        }}
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Floating particles */}
      <div className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-particle-1" style={{ top: '20%', left: '10%' }} />
      <div className="absolute w-3 h-3 bg-white/15 rounded-full animate-float-particle-2" style={{ top: '60%', left: '80%' }} />
      <div className="absolute w-2 h-2 bg-white/20 rounded-full animate-float-particle-3" style={{ top: '80%', left: '30%' }} />
      <div className="absolute w-1.5 h-1.5 bg-white/25 rounded-full animate-float-particle-1" style={{ top: '30%', left: '70%' }} />
      <div className="absolute w-2.5 h-2.5 bg-white/15 rounded-full animate-float-particle-2" style={{ top: '50%', left: '20%' }} />
    </div>
  );
};

// Hero Section - Clean gradient with logo colors
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f3d3a 0%, #134e4a 30%, #1a6b5f 60%, #22877a 100%)' }}>
      <AnimatedBackground />
      
      <div className="container-wide relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-4 animate-fade-in drop-shadow-lg" style={{ animationDelay: '0.1s' }}>
            TravelSure
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-8 animate-fade-in" style={{ animationDelay: '0.2s', color: '#86efac' }}>
            ביטוח נסיעות לחו״ל
          </h2>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-6 leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            הביטחון שלכם הוא העדיפות שלנו. אנו מספקים פתרונות ביטוח מקיפים ומותאמים אישית לכל לקוח, עם שירות מקצועי וליווי צמוד.
          </p>

          {/* Features Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#86efac' }} />
              <span>ליווי אישי ומקצועי</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#86efac' }} />
              <span>מגוון פתרונות ביטוח</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#86efac' }} />
              <span>שירות 24/7</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Link to="/purchase">
              <Button variant="cta" size="xl" className="text-lg shadow-xl hover:shadow-2xl transition-shadow" style={{ background: 'linear-gradient(135deg, #86efac 0%, #4ade80 100%)', color: '#134e4a' }}>
                לרכישת ביטוח נסיעות לחו״ל
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-white/30 backdrop-blur-sm flex items-center justify-center bg-white/5">
          <ArrowLeft className="w-5 h-5 text-white rotate-[-90deg]" />
        </div>
      </div>
    </section>
  );
};

// Services Section
const ServicesSection = () => {
  const services = [
    {
      icon: Plane,
      title: "ביטוח נסיעות",
      description: "טיסה בראש שקט עם כיסוי מקיף לחו״ל עד 5 מיליון דולר"
    },
    {
      icon: Car,
      title: "ביטוח רכב",
      description: "כיסוי מקיף לרכב שלכם במחירים תחרותיים"
    },
    {
      icon: Home,
      title: "ביטוח דירה",
      description: "הגנה מלאה על הבית ותכולתו"
    },
    {
      icon: Building2,
      title: "ביטוח עסקי",
      description: "פתרונות ביטוח מותאמים לעסקים קטנים וגדולים"
    }
  ];

  return (
    <section id="services" className="section-padding bg-background">
      <div className="container-wide">
        <AnimatedSection className="text-center mb-12 md:mb-16">
          <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">השירותים שלנו</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">פתרונות ביטוח מקיפים</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            אנו מציעים מגוון רחב של שירותי ביטוח, כולם עם ליווי אישי ומקצועי
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <AnimatedSection 
              key={index}
              delay={index * 100}
              animation="scale-up"
            >
              <div className="group p-8 rounded-2xl bg-card border border-border hover:border-secondary/50 hover:shadow-xl transition-all duration-300 h-full">
                <div className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:scale-110 transition-all duration-300">
                  <service.icon className="w-8 h-8 text-secondary group-hover:text-secondary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{service.description}</p>
                <a href="#contact" className="text-secondary font-semibold hover:underline inline-flex items-center gap-1">
                  למידע נוסף
                  <ArrowLeft className="w-4 h-4" />
                </a>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  const stats = [
    { value: "25+", label: "שנות ניסיון" },
    { value: "10K+", label: "לקוחות מרוצים" },
    { value: "24/7", label: "שירות לקוחות" },
    { value: "$5M", label: "כיסוי מקסימלי" }
  ];

  return (
    <section id="about" className="section-padding" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 50%, #22877a 100%)' }}>
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <AnimatedSection animation="fade-right">
            <span className="font-semibold text-sm tracking-wider uppercase mb-4 block" style={{ color: '#86efac' }}>אודותינו</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              מחויבים להגנה
              <span className="block mt-2" style={{ color: '#86efac' }}>שלכם ושל משפחתכם</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              TravelSure היא סוכנות ביטוח מובילה בישראל המתמחה בביטוחי נסיעות לחו״ל. עם ניסיון של שנים רבות בתחום, אנו מספקים ללקוחותינו שירות אישי, מקצועי וזמין 24/7.
            </p>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              אנו מאמינים שכל לקוח ראוי להתייחסות אישית ולפתרון ביטוחי המותאם במדויק לצרכיו. הצוות המנוסה שלנו כאן כדי ללוות אתכם בכל שלב.
            </p>
            <Button variant="cta" size="lg" style={{ background: '#86efac', color: '#134e4a' }}>
              <Phone className="w-5 h-5" />
              דברו איתנו
            </Button>
          </AnimatedSection>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <AnimatedSection 
                key={index}
                delay={index * 100}
                animation="scale-up"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border border-white/10">
                  <div className="text-4xl md:text-5xl font-black mb-2" style={{ color: '#86efac' }}>{stat.value}</div>
                  <div className="text-white/80 font-medium">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Extensions Section
const ExtensionsSection = () => {
  const extensions = [
    { title: "הריון", description: "כיסוי עד 350 אלף דולר, עד שבוע 32" },
    { title: "ביטול נסיעה", description: "החזר עד $5,000 במקרה רפואי" },
    { title: "כבודה", description: "עד $2,250 עבור איבוד או איחור" },
    { title: "רכב שכור", description: "ביטול השתתפות עצמית בנזק" },
    { title: "ספורט חורף", description: "הרחבה לסקי וספורט חורף" },
    { title: "ספורט אתגרי", description: "כיסוי לספורט אקסטרים" }
  ];

  return (
    <section id="extensions" className="section-padding bg-muted/50">
      <div className="container-wide">
        <AnimatedSection className="text-center mb-12 md:mb-16">
          <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">ביטוח נסיעות</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">הרחבות נוספות</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            התאימו את הביטוח לצרכים שלכם עם מגוון הרחבות
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {extensions.map((ext, index) => (
            <AnimatedSection 
              key={index}
              delay={index * 80}
              animation="fade-up"
            >
              <div className="bg-card rounded-xl p-6 border border-border hover:border-secondary/50 hover:shadow-lg transition-all h-full">
                <h3 className="font-bold text-lg text-foreground mb-2">{ext.title}</h3>
                <p className="text-muted-foreground">{ext.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="text-center mt-12" delay={500}>
          <Link to="/purchase">
            <Button variant="cta" size="xl">
              <ArrowLeft className="w-5 h-5" />
              לרכישת ביטוח נסיעות
            </Button>
          </Link>
        </AnimatedSection>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-wide">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-12 md:mb-16">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">צרו קשר</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">נשמח לעמוד לשירותכם</h2>
            <p className="text-muted-foreground text-lg">
              נציגנו זמינים עבורכם 24/7 בעברית ובאנגלית
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <AnimatedSection animation="fade-right">
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="text-2xl font-bold text-foreground mb-6">השאירו פרטים ונחזור אליכם</h3>
                <ContactForm />
              </div>
            </AnimatedSection>

            {/* Contact Info */}
            <AnimatedSection animation="fade-left" delay={200}>
              <div className="space-y-6">
                <div className="bg-muted rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-6 h-6 text-secondary" />
                      </div>
                      <h4 className="font-bold text-foreground mb-2">בארץ</h4>
                      <p className="text-muted-foreground text-sm">
                        א׳-ה׳ 08:00-18:00<br />
                        ו׳ וערבי חג 08:00-13:00
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-secondary" />
                      </div>
                      <h4 className="font-bold text-foreground mb-2">בחו״ל</h4>
                      <p className="text-muted-foreground text-sm">
                        זמינים 24/7<br />
                        בעברית ובאנגלית
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <p className="text-muted-foreground mb-4">או צרו קשר ישירות:</p>
                  <div className="space-y-3">
                    <a href="tel:+972732721111" className="flex items-center gap-3 text-foreground hover:text-secondary transition-colors">
                      <Phone className="w-5 h-5 text-secondary" />
                      073-2721111
                    </a>
                    <a href="https://wa.me/+972523333603" className="flex items-center gap-3 text-foreground hover:text-secondary transition-colors">
                      <MessageCircle className="w-5 h-5 text-secondary" />
                      052-3333603 (וואטסאפ)
                    </a>
                    <a href="mailto:ophir@ophirins.co.il" className="flex items-center gap-3 text-foreground hover:text-secondary transition-colors">
                      <Mail className="w-5 h-5 text-secondary" />
                      ophir@ophirins.co.il
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="text-white py-12" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 100%)' }}>
      <div className="container-wide">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="TravelSure לוגו" className="h-12 w-auto" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              סוכנות ביטוח מובילה המתמחה בביטוחי נסיעות לחו״ל עם שירות אישי ומקצועי.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">קישורים מהירים</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="#services" className="hover:text-white transition-colors">שירותים</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">אודות</a></li>
              <li><a href="#extensions" className="hover:text-white transition-colors">הרחבות</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">צור קשר</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4">פרטי התקשרות</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>טלפון: 073-2721111</li>
              <li>וואטסאפ: 052-3333603</li>
              <li>ophir@ophirins.co.il</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50 space-y-2">
          <p>© {new Date().getFullYear()} TravelSure - אופיר ושות׳ סוכנות לביטוח. כל הזכויות שמורות.</p>
          <p>
            המשך שימושך באתר מהווה הסכמה לשימוש זה בהתאם וכמפורט ב
            <Link to="/privacy-policy" className="underline hover:text-white transition-colors">מדיניות הפרטיות</Link>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Index;
