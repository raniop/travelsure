import { Phone, Mail, MessageCircle, Shield, Clock, Users, Award, ChevronDown, Plane, Building2, Home, Car, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-heebo" dir="rtl">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <ServicesSection />
      <ExtensionsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

// Header Component
const Header = () => {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-secondary-foreground" />
            </div>
            <div className="text-right">
              <h1 className="text-lg md:text-xl font-bold text-primary leading-tight">TravelSure</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">אופיר ושות׳</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-foreground hover:text-secondary transition-colors font-medium">שירותים</a>
            <a href="#extensions" className="text-foreground hover:text-secondary transition-colors font-medium">הרחבות</a>
            <a href="#contact" className="text-foreground hover:text-secondary transition-colors font-medium">צור קשר</a>
          </nav>

          {/* CTA Button */}
          <Button variant="cta" size="default" className="hidden sm:flex">
            <ArrowLeft className="w-4 h-4" />
            לרכישת ביטוח
          </Button>
        </div>
      </div>
    </header>
  );
};

// Hero Section - Clean like PassportCard
const HeroSection = () => {
  return (
    <section className="pt-20 md:pt-24">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-5rem)]">
          {/* Text Content */}
          <div className="text-center lg:text-right order-2 lg:order-1 py-8 lg:py-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight mb-6 animate-fade-in">
              נסיעה בראש שקט
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              ביטוח נסיעות עם סוכן אישי מנוסה וצמוד
            </p>
            <p className="text-base md:text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              מבית אופיר ושות׳ סוכנות לביטוח
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button variant="cta" size="xl">
                <ArrowLeft className="w-5 h-5" />
                לרכישת ביטוח נסיעות לחו״ל
              </Button>
              <Button variant="ctaOutline" size="xl">
                צור קשר
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              כיסוי רפואי עד 5 מיליון דולר • שירות 24/7 • סוכן אישי צמוד
            </p>
          </div>

          {/* Hero Image */}
          <div className="order-1 lg:order-2 relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop" 
                alt="נוסעים מאושרים בחופשה"
                className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover"
              />
              {/* Floating Card */}
              <div className="absolute bottom-4 right-4 left-4 md:bottom-8 md:right-8 md:left-auto md:w-72 bg-background/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">כיסוי מקיף</p>
                    <p className="text-sm text-muted-foreground">עד 5 מיליון דולר</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">הוצאות רפואיות</span>
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">פינוי</span>
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">חילוץ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hidden lg:flex justify-center pb-8">
          <a href="#how-it-works" className="animate-bounce">
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
          </a>
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      number: "1",
      title: "בחירת ביטוח",
      description: "בחרו את הכיסוי המתאים לנסיעה שלכם"
    },
    {
      number: "2", 
      title: "רכישה מהירה",
      description: "תהליך רכישה פשוט ומהיר באתר"
    },
    {
      number: "3",
      title: "טסים בראש שקט",
      description: "אנחנו כאן עבורכם 24/7 בכל מקום בעולם"
    }
  ];

  return (
    <section id="how-it-works" className="section-padding bg-muted/30">
      <div className="container-wide">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">איך זה עובד?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            לפני נסיעה לחו״ל, ודאו כי אתם מכוסים בשלושה צעדים פשוטים
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary text-secondary-foreground text-2xl md:text-3xl font-bold flex items-center justify-center mx-auto mb-6">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
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
      title: "ביטוח נסיעות לחו״ל",
      description: "כיסוי מקיף להוצאות רפואיות בחו״ל עד 5 מיליון דולר, כולל איתור וחילוץ, פינוי רפואי והטסה לארץ",
      featured: true
    },
    {
      icon: Building2,
      title: "ביטוח עסקים",
      description: "הגנה מקיפה לעסק שלכם - מבנה, תכולה, אחריות מקצועית וביטוח אובדן הכנסות"
    },
    {
      icon: Home,
      title: "ביטוח דירה",
      description: "ביטוח מקיף למבנה ותכולת הבית, כולל נזקי טבע, גניבה ואחריות כלפי צד שלישי"
    },
    {
      icon: Car,
      title: "ביטוח רכב",
      description: "ביטוח מקיף או צד שלישי לרכב הפרטי שלכם עם שירות מהיר ומקצועי"
    }
  ];

  return (
    <section id="services" className="section-padding">
      <div className="container-wide">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">השירותים שלנו</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            מגוון פתרונות ביטוח מותאמים אישית עבורכם
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div 
              key={index}
              className={`group p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                service.featured 
                  ? "bg-secondary text-secondary-foreground border-secondary" 
                  : "bg-card border-border hover:border-secondary/50"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                service.featured 
                  ? "bg-secondary-foreground/20" 
                  : "bg-secondary/10"
              }`}>
                <service.icon className={`w-7 h-7 ${service.featured ? "text-secondary-foreground" : "text-secondary"}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${service.featured ? "" : "text-foreground"}`}>
                {service.title}
              </h3>
              <p className={`text-sm leading-relaxed ${service.featured ? "text-secondary-foreground/90" : "text-muted-foreground"}`}>
                {service.description}
              </p>
            </div>
          ))}
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
    <section id="extensions" className="section-padding bg-primary text-primary-foreground">
      <div className="container-wide">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">הרחבות נוספות</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            התאימו את הביטוח לצרכים שלכם עם מגוון הרחבות
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {extensions.map((ext, index) => (
            <div 
              key={index}
              className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-5 border border-primary-foreground/20 hover:bg-primary-foreground/15 transition-colors"
            >
              <h3 className="font-semibold text-lg mb-2">{ext.title}</h3>
              <p className="text-primary-foreground/80 text-sm">{ext.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="secondary" size="xl" className="bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90">
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
    <section id="contact" className="section-padding">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">צרו איתנו קשר</h2>
            <p className="text-muted-foreground text-lg">
              נציגנו זמינים עבורכם 24/7 בעברית ובאנגלית
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border hover:border-secondary hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                  <method.icon className="w-6 h-6 text-secondary group-hover:text-secondary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
                <p className="text-secondary font-medium">{method.value}</p>
              </a>
            ))}
          </div>

          <div className="bg-muted/50 rounded-2xl p-6 md:p-8 text-center">
            <div className="grid md:grid-cols-2 gap-6 text-right md:text-center">
              <div>
                <h4 className="font-semibold text-foreground mb-2">בארץ?</h4>
                <p className="text-muted-foreground text-sm">
                  א׳-ה׳ 08:00-18:00<br />
                  ו׳ וערבי חג 08:00-13:00
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">בחו״ל?</h4>
                <p className="text-muted-foreground text-sm">
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
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container-wide">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-lg">TravelSure</h3>
                <p className="text-xs text-primary-foreground/70">אופיר ושות׳ סוכנות לביטוח</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              סוכנות ביטוח מובילה המתמחה בביטוחי נסיעות לחו״ל עם שירות אישי ומקצועי.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">קישורים מהירים</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#services" className="hover:text-secondary transition-colors">שירותים</a></li>
              <li><a href="#extensions" className="hover:text-secondary transition-colors">הרחבות</a></li>
              <li><a href="#contact" className="hover:text-secondary transition-colors">צור קשר</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">פרטי התקשרות</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>טלפון: 073-2721111</li>
              <li>וואטסאפ: 052-3333603</li>
              <li>ophir@ophirins.co.il</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} אופיר ושות׳ סוכנות לביטוח. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

export default Index;
