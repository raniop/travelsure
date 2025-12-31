import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plane, Car, Home, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t, isRTL } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="h-16 md:h-20" />
      
      <section className="section-padding bg-background">
        <div className="container-wide">
          <AnimatedSection className="text-center mb-12 md:mb-16">
            <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">{t("services.label")}</span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t("services.title")}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("services.description")}
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
                  <Link to="/contact" className="text-secondary font-semibold hover:underline inline-flex items-center gap-1">
                    {t("services.learnMore")}
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="text-center mt-12" delay={500}>
            <Link to="/purchase">
              <Button variant="hero" size="xl">
                <ArrowLeft className="w-5 h-5" />
                {t("hero.cta")}
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default Services;
