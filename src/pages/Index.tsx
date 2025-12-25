import { Plane, Building2, Home, Car, Shield, Phone, HeartHandshake, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-travel.jpg";

const Header = () => (
  <header className="fixed top-0 right-0 left-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
    <div className="container mx-auto px-4">
      <nav className="flex items-center justify-between h-16 md:h-20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-right">
            <h1 className="font-bold text-lg text-foreground leading-tight">אופיר ושות׳</h1>
            <p className="text-xs text-muted-foreground">סוכנות לביטוח</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#services" className="text-foreground hover:text-primary transition-colors">שירותים</a>
          <a href="#benefits" className="text-foreground hover:text-primary transition-colors">יתרונות</a>
          <a href="#about" className="text-foreground hover:text-primary transition-colors">אודות</a>
          <a href="#contact" className="text-foreground hover:text-primary transition-colors">צור קשר</a>
        </div>
        
        <Button variant="cta" size="lg">
          <Phone className="w-4 h-4" />
          התקשרו עכשיו
        </Button>
      </nav>
    </div>
  </header>
);

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center pt-20" dir="rtl">
    <div className="absolute inset-0 z-0">
      <img 
        src={heroImage} 
        alt="חופשה משפחתית בחוף טרופי" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-foreground/80 via-foreground/50 to-transparent" />
    </div>
    
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 mb-6 animate-fade-up">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">מומחים בביטוח נסיעות לחו״ל</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-card mb-6 leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
          נסיעה בראש שקט
          <span className="block text-gold mt-2">עם סוכן אישי וצמוד</span>
        </h1>
        
        <p className="text-lg md:text-xl text-card/90 mb-8 leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
          ביטוח נסיעות מקיף עד 5 מיליון דולר, כיסוי הוצאות רפואיות, איתור וחילוץ, ושירות אישי 24/7
        </p>
        
        <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button variant="hero" size="xl">
            <Plane className="w-5 h-5" />
            לרכישת ביטוח נסיעות
          </Button>
          <Button variant="heroOutline" size="xl">
            <Phone className="w-5 h-5" />
            צור קשר
          </Button>
        </div>
      </div>
    </div>
  </section>
);

const services = [
  {
    icon: Plane,
    title: "ביטוח נסיעות לחו״ל",
    description: "כיסוי מקיף להוצאות רפואיות, איתור וחילוץ, ביטול טיסה ועוד",
    highlight: true,
  },
  {
    icon: Building2,
    title: "ביטוח עסקים",
    description: "הגנה מלאה לעסק שלכם - רכוש, אחריות מקצועית וצד שלישי",
    highlight: false,
  },
  {
    icon: Home,
    title: "ביטוח דירות",
    description: "ביטוח מבנה ותכולה, נזקי טבע, פריצה ואחריות כלפי צד שלישי",
    highlight: false,
  },
  {
    icon: Car,
    title: "ביטוח רכב",
    description: "ביטוח מקיף וחובה, הגנה משפטית ושירותי דרך מתקדמים",
    highlight: false,
  },
];

const ServicesSection = () => (
  <section id="services" className="py-20 md:py-32 bg-muted" dir="rtl">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">השירותים שלנו</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          מגוון פתרונות ביטוח מותאמים אישית לכל צורך
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, index) => (
          <div 
            key={index}
            className={`group relative bg-card rounded-2xl p-8 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 ${
              service.highlight ? 'ring-2 ring-primary' : ''
            }`}
          >
            {service.highlight && (
              <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                מומלץ
              </div>
            )}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${
              service.highlight 
                ? 'bg-gradient-hero text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground'
            }`}>
              <service.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const benefits = [
  {
    icon: HeartHandshake,
    title: "סוכן אישי וצמוד",
    description: "ליווי מקצועי לאורך כל הדרך",
  },
  {
    icon: Clock,
    title: "שירות 24/7",
    description: "זמינים תמיד בכל שעות היממה",
  },
  {
    icon: Shield,
    title: "כיסוי עד 5 מיליון $",
    description: "הגנה מקסימלית להוצאות רפואיות",
  },
  {
    icon: Globe,
    title: "ניסיון של שנים",
    description: "מאות לקוחות מרוצים מדי שנה",
  },
];

const BenefitsSection = () => (
  <section id="benefits" className="py-20 md:py-32 bg-gradient-hero relative overflow-hidden" dir="rtl">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-20 right-20 w-64 h-64 bg-card rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gold rounded-full blur-3xl" />
    </div>
    
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">למה לבחור בנו?</h2>
        <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
          אנחנו כאן כדי להבטיח לכם שקט נפשי בכל נסיעה
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {benefits.map((benefit, index) => (
          <div 
            key={index}
            className="text-center group"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-card/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-card/30 transition-all duration-300 group-hover:scale-110">
              <benefit.icon className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-primary-foreground mb-2">{benefit.title}</h3>
            <p className="text-primary-foreground/80">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const AboutSection = () => (
  <section id="about" className="py-20 md:py-32 bg-card" dir="rtl">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            אופיר ושות׳ - 
            <span className="text-gradient"> הבית שלכם לביטוח</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            אנחנו סוכנות ביטוח משפחתית עם ניסיון של שנים בתחום. ההתמחות העיקרית שלנו היא ביטוח נסיעות לחו״ל, אך אנחנו מספקים גם מגוון רחב של פתרונות ביטוח לעסקים, דירות ורכב.
          </p>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            אצלנו תקבלו יחס אישי, מענה מהיר ומקצועי, וליווי צמוד מרגע הרכישה ועד לטיפול בתביעות.
          </p>
          <Button variant="cta" size="lg">
            <Phone className="w-5 h-5" />
            דברו איתנו
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary rounded-2xl p-8 text-center">
            <div className="text-4xl font-bold text-primary mb-2">15+</div>
            <p className="text-muted-foreground">שנות ניסיון</p>
          </div>
          <div className="bg-secondary rounded-2xl p-8 text-center">
            <div className="text-4xl font-bold text-primary mb-2">5000+</div>
            <p className="text-muted-foreground">לקוחות מרוצים</p>
          </div>
          <div className="bg-secondary rounded-2xl p-8 text-center">
            <div className="text-4xl font-bold text-primary mb-2">24/7</div>
            <p className="text-muted-foreground">שירות זמין</p>
          </div>
          <div className="bg-secondary rounded-2xl p-8 text-center">
            <div className="text-4xl font-bold text-primary mb-2">98%</div>
            <p className="text-muted-foreground">שביעות רצון</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ContactSection = () => (
  <section id="contact" className="py-20 md:py-32 bg-muted" dir="rtl">
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">צור קשר</h2>
        <p className="text-lg text-muted-foreground mb-8">
          רוצים לשמוע עוד? השאירו פרטים ונחזור אליכם בהקדם
        </p>
        
        <div className="bg-card rounded-2xl p-8 shadow-card">
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="שם מלא" 
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
              <input 
                type="tel" 
                placeholder="טלפון" 
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            <input 
              type="email" 
              placeholder="אימייל" 
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <textarea 
              placeholder="איך נוכל לעזור?" 
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
            />
            <Button variant="cta" size="xl" className="w-full">
              שליחה
            </Button>
          </form>
        </div>
        
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-muted-foreground">
          <a href="tel:+972-3-1234567" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone className="w-5 h-5" />
            03-1234567
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-foreground py-8" dir="rtl">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-primary-foreground font-semibold">אופיר ושות׳ סוכנות לביטוח</span>
        </div>
        <p className="text-primary-foreground/60 text-sm">
          © 2025 כל הזכויות שמורות
        </p>
      </div>
    </div>
  </footer>
);

const Index = () => {
  return (
    <main className="min-h-screen" dir="rtl">
      <Header />
      <HeroSection />
      <ServicesSection />
      <BenefitsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
};

export default Index;
