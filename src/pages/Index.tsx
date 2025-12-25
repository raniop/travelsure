import { Phone, Mail, MessageCircle, Clock, Users, Plane, Building2, Home, Car, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    </div>
  );
};

// Header Component
const Header = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ background: 'linear-gradient(135deg, #0d4a4a 0%, #0f5555 100%)' }}>
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="אופיר ושות׳ לוגו" className="h-10 md:h-12 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-white/80 hover:text-secondary transition-colors font-medium">שירותים</a>
            <a href="#about" className="text-white/80 hover:text-secondary transition-colors font-medium">אודות</a>
            <a href="#contact" className="text-white/80 hover:text-secondary transition-colors font-medium">צור קשר</a>
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

// Hero Section - Teal gradient with orange accent
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20" style={{ background: 'linear-gradient(135deg, #0d4a4a 0%, #0f5555 50%, #127070 100%)' }}>
      <div className="container-wide relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <img src={logo} alt="אופיר ושות׳ לוגו" className="h-28 md:h-36 w-auto mx-auto" />
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            אופיר ושות׳
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-bold text-secondary mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            סוכנות לביטוח
          </h2>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-6 leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            הביטחון שלכם הוא העדיפות שלנו. אנו מספקים פתרונות ביטוח מקיפים ומותאמים אישית לכל לקוח, עם שירות מקצועי וליווי צמוד.
          </p>

          {/* Features Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              <span>ליווי אישי ומקצועי</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              <span>מגוון פתרונות ביטוח</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              <span>שירות 24/7</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Button variant="cta" size="xl" className="text-lg">
              קבלו הצעת מחיר
            </Button>
            <Button variant="ctaOutline" size="xl" className="text-lg border-white/30 text-white hover:bg-white/10">
              למידע נוסף
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-secondary"></div>
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
        <div className="text-center mb-12 md:mb-16">
          <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">השירותים שלנו</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">פתרונות ביטוח מקיפים</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            אנו מציעים מגוון רחב של שירותי ביטוח, כולם עם ליווי אישי ומקצועי
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-secondary/50 hover:shadow-xl transition-all duration-300"
            >
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
    <section id="about" className="section-padding" style={{ background: 'linear-gradient(135deg, #0d4a4a 0%, #0f5555 50%, #127070 100%)' }}>
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">אודותינו</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              מחויבים להגנה
              <span className="text-secondary block mt-2">שלכם ושל משפחתכם</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              סוכנות אופיר ושות׳ היא סוכנות ביטוח מובילה בישראל המתמחה בביטוחי נסיעות לחו״ל. עם ניסיון של שנים רבות בתחום, אנו מספקים ללקוחותינו שירות אישי, מקצועי וזמין 24/7.
            </p>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              אנו מאמינים שכל לקוח ראוי להתייחסות אישית ולפתרון ביטוחי המותאם במדויק לצרכיו. הצוות המנוסה שלנו כאן כדי ללוות אתכם בכל שלב.
            </p>
            <Button variant="cta" size="lg">
              <Phone className="w-5 h-5" />
              דברו איתנו
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border border-white/10"
              >
                <div className="text-4xl md:text-5xl font-black text-secondary mb-2">{stat.value}</div>
                <div className="text-white/80 font-medium">{stat.label}</div>
              </div>
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
        <div className="text-center mb-12 md:mb-16">
          <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">ביטוח נסיעות</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">הרחבות נוספות</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            התאימו את הביטוח לצרכים שלכם עם מגוון הרחבות
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {extensions.map((ext, index) => (
            <div 
              key={index}
              className="bg-card rounded-xl p-6 border border-border hover:border-secondary/50 hover:shadow-lg transition-all"
            >
              <h3 className="font-bold text-lg text-foreground mb-2">{ext.title}</h3>
              <p className="text-muted-foreground">{ext.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="cta" size="xl">
            <ArrowLeft className="w-5 h-5" />
            לרכישת ביטוח נסיעות
          </Button>
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const contactMethods = [
    {
      icon: Phone,
      title: "טלפון",
      value: "073-2721111",
      href: "tel:+972732721111"
    },
    {
      icon: MessageCircle,
      title: "וואטסאפ",
      value: "052-3333603",
      href: "https://wa.me/+972523333603"
    },
    {
      icon: Mail,
      title: "אימייל",
      value: "ophir@ophirins.co.il",
      href: "mailto:ophir@ophirins.co.il"
    }
  ];

  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">צרו קשר</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">נשמח לעמוד לשירותכם</h2>
            <p className="text-muted-foreground text-lg">
              נציגנו זמינים עבורכם 24/7 בעברית ובאנגלית
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="flex flex-col items-center p-8 bg-card rounded-2xl border border-border hover:border-secondary hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary transition-colors">
                  <method.icon className="w-7 h-7 text-secondary group-hover:text-secondary-foreground transition-colors" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{method.title}</h3>
                <p className="text-secondary font-semibold text-lg">{method.value}</p>
              </a>
            ))}
          </div>

          <div className="bg-muted rounded-2xl p-8 text-center">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-bold text-foreground mb-2">בארץ</h4>
                <p className="text-muted-foreground">
                  א׳-ה׳ 08:00-18:00<br />
                  ו׳ וערבי חג 08:00-13:00
                </p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h4 className="font-bold text-foreground mb-2">בחו״ל</h4>
                <p className="text-muted-foreground">
                  זמינים 24/7<br />
                  בעברית ובאנגלית
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="text-white py-12" style={{ background: 'linear-gradient(135deg, #0d4a4a 0%, #0f5555 100%)' }}>
      <div className="container-wide">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="אופיר ושות׳ לוגו" className="h-12 w-auto" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              סוכנות ביטוח מובילה המתמחה בביטוחי נסיעות לחו״ל עם שירות אישי ומקצועי.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">קישורים מהירים</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="#services" className="hover:text-secondary transition-colors">שירותים</a></li>
              <li><a href="#about" className="hover:text-secondary transition-colors">אודות</a></li>
              <li><a href="#extensions" className="hover:text-secondary transition-colors">הרחבות</a></li>
              <li><a href="#contact" className="hover:text-secondary transition-colors">צור קשר</a></li>
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

        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50">
          <p>© {new Date().getFullYear()} אופיר ושות׳ סוכנות לביטוח. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

export default Index;
