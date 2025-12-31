import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t, isRTL } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const stats = [
    { value: "25+", label: t("about.stat1") },
    { value: "10K+", label: t("about.stat2") },
    { value: "24/7", label: t("about.stat3") },
    { value: "$5M", label: t("about.stat4") }
  ];

  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="h-16 md:h-20" />
      
      <section className="section-padding" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 50%, #22877a 100%)' }}>
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection animation="fade-right">
              <span className="font-semibold text-sm tracking-wider uppercase mb-4 block" style={{ color: '#86efac' }}>{t("about.label")}</span>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {t("about.title")}
                <span className="block mt-2" style={{ color: '#86efac' }}>{t("about.titleHighlight")}</span>
              </h1>
              <p className="text-white/80 text-lg leading-relaxed mb-6">
                {t("about.p1")}
              </p>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                {t("about.p2")}
              </p>
              <Link to="/contact">
                <Button variant="hero" size="lg">
                  <Phone className="w-5 h-5" />
                  {t("about.cta")}
                </Button>
              </Link>
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
    </div>
  );
};

export default About;
