import { Phone, Mail, MessageCircle, Clock, Users, Plane, Building2, Home, Car, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

import ContactForm from "@/components/ContactForm";
import CookieBanner from "@/components/CookieBanner";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.avif";

const Index = () => {
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
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
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 pb-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f3d3a 0%, #134e4a 30%, #1a6b5f 60%, #22877a 100%)' }}>
      <AnimatedBackground />
      
      <div className="container-wide relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            TravelSure
          </h1>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-8" style={{ color: '#86efac' }}>
            {t("hero.subtitle")}
          </h2>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-6 leading-relaxed">
            {t("hero.description")}
          </p>

          {/* Features Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#86efac' }} />
              <span>{t("hero.feature1")}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#86efac' }} />
              <span>{t("hero.feature2")}</span>
            </div>
            <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" style={{ color: '#86efac' }} />
              <span>{t("hero.feature3")}</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link to="/purchase">
              <Button variant="cta" size="xl" className="text-lg shadow-2xl hover:shadow-[0_20px_50px_rgba(134,239,172,0.4)] transition-all duration-300 border-2 border-white/30 hover:scale-105" style={{ background: 'linear-gradient(135deg, #86efac 0%, #4ade80 100%)', color: '#134e4a' }}>
                {t("hero.cta")}
                <Plane className="!w-8 !h-8 shrink-0 animate-bounce" style={{ animationDuration: '2s' }} />
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
  const { t } = useLanguage();
  
  const services = [
    {
      icon: Plane,
      title: t("services.travel.title"),
      description: t("services.travel.desc")
    },
    {
      icon: Car,
      title: t("services.car.title"),
      description: t("services.car.desc")
    },
    {
      icon: Home,
      title: t("services.home.title"),
      description: t("services.home.desc")
    },
    {
      icon: Building2,
      title: t("services.business.title"),
      description: t("services.business.desc")
    }
  ];

  return (
    <section id="services" className="section-padding bg-background">
      <div className="container-wide">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">{t("services.label")}</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t("services.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("services.description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div key={index} className="group p-8 rounded-2xl bg-card border border-border hover:border-secondary/50 hover:shadow-xl transition-all duration-300 h-full">
              <div className="w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:scale-110 transition-all duration-300">
                <service.icon className="w-8 h-8 text-secondary group-hover:text-secondary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{service.description}</p>
              <a href="#contact" className="text-secondary font-semibold hover:underline inline-flex items-center gap-1">
                {t("services.learnMore")}
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
  const { t } = useLanguage();
  
  const stats = [
    { value: "25+", label: t("about.stat1") },
    { value: "10K+", label: t("about.stat2") },
    { value: "24/7", label: t("about.stat3") },
    { value: "$5M", label: t("about.stat4") }
  ];

  return (
    <section id="about" className="section-padding" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 50%, #22877a 100%)' }}>
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="font-semibold text-sm tracking-wider uppercase mb-4 block" style={{ color: '#86efac' }}>{t("about.label")}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {t("about.title")}
              <span className="block mt-2" style={{ color: '#86efac' }}>{t("about.titleHighlight")}</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              {t("about.p1")}
            </p>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              {t("about.p2")}
            </p>
            <Button variant="cta" size="lg" style={{ background: '#86efac', color: '#134e4a' }}>
              <Phone className="w-5 h-5" />
              {t("about.cta")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border border-white/10">
                <div className="text-4xl md:text-5xl font-black mb-2" style={{ color: '#86efac' }}>{stat.value}</div>
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
  const { t } = useLanguage();
  
  const extensions = [
    { title: t("extensions.pregnancy"), description: t("extensions.pregnancy.desc") },
    { title: t("extensions.cancellation"), description: t("extensions.cancellation.desc") },
    { title: t("extensions.luggage"), description: t("extensions.luggage.desc") },
    { title: t("extensions.rental"), description: t("extensions.rental.desc") },
    { title: t("extensions.winter"), description: t("extensions.winter.desc") },
    { title: t("extensions.extreme"), description: t("extensions.extreme.desc") }
  ];

  return (
    <section id="extensions" className="section-padding bg-muted/50">
      <div className="container-wide">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">{t("extensions.label")}</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t("extensions.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("extensions.description")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {extensions.map((ext, index) => (
            <div key={index} className="bg-card rounded-xl p-6 border border-border hover:border-secondary/50 hover:shadow-lg transition-all h-full">
              <h3 className="font-bold text-lg text-foreground mb-2">{ext.title}</h3>
              <p className="text-muted-foreground">{ext.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/purchase">
            <Button variant="cta" size="xl">
              <ArrowLeft className="w-5 h-5" />
              {t("extensions.cta")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  const { t } = useLanguage();
  
  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-wide">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">{t("contact.label")}</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t("contact.title")}</h2>
            <p className="text-muted-foreground text-lg">
              {t("contact.description")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="bg-card rounded-2xl p-8 border border-border">
                <h3 className="text-2xl font-bold text-foreground mb-6">{t("contact.formTitle")}</h3>
                <ContactForm />
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <div className="space-y-6">
                <div className="bg-muted rounded-2xl p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-6 h-6 text-secondary" />
                      </div>
                      <h4 className="font-bold text-foreground mb-2">{t("contact.inIsrael")}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t("contact.inIsraelHours")}<br />
                        {t("contact.inIsraelFriday")}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-secondary" />
                      </div>
                      <h4 className="font-bold text-foreground mb-2">{t("contact.abroad")}</h4>
                      <p className="text-muted-foreground text-sm">
                        {t("contact.abroadHours")}<br />
                        {t("contact.abroadLang")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <p className="text-muted-foreground mb-4">{t("contact.directContact")}</p>
                  <div className="space-y-3">
                    <a href="tel:+972732721111" className="flex items-center gap-3 text-foreground hover:text-secondary transition-colors">
                      <Phone className="w-5 h-5 text-secondary" />
                      073-2721111
                    </a>
                    <a href="https://wa.me/+972523333603" className="flex items-center gap-3 text-foreground hover:text-secondary transition-colors">
                      <MessageCircle className="w-5 h-5 text-secondary" />
                      052-3333603 {t("contact.whatsapp")}
                    </a>
                    <a href="mailto:ophir@ophirins.co.il" className="flex items-center gap-3 text-foreground hover:text-secondary transition-colors">
                      <Mail className="w-5 h-5 text-secondary" />
                      ophir@ophirins.co.il
                    </a>
                  </div>
                </div>
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
  const { t } = useLanguage();
  
  return (
    <footer className="text-white py-12" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 100%)' }}>
      <div className="container-wide">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="TravelSure" className="h-12 w-auto" />
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {t("footer.company")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">{t("nav.services")}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="#services" className="hover:text-white transition-colors">{t("nav.services")}</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">{t("nav.about")}</a></li>
              <li><a href="#extensions" className="hover:text-white transition-colors">{t("extensions.title")}</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">{t("nav.contact")}</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4">{t("nav.contact")}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>073-2721111</li>
              <li>052-3333603 {t("contact.whatsapp")}</li>
              <li>ophir@ophirins.co.il</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/50 space-y-2">
          <p>© {new Date().getFullYear()} TravelSure - {t("footer.company")}. {t("footer.rights")}</p>
          <p>
            <Link to="/privacy-policy" className="underline hover:text-white transition-colors">{t("footer.privacy")}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Index;
