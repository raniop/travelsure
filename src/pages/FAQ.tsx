import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const FAQ = () => {
  const { t, isRTL } = useLanguage();
  
  const faqs = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
    { question: t("faq.q7"), answer: t("faq.a7") },
    { question: t("faq.q8"), answer: t("faq.a8") },
    { question: t("faq.q9"), answer: t("faq.a9") },
    { question: t("faq.q10"), answer: t("faq.a10") },
  ];

  return (
    <div className="min-h-screen font-heebo" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="h-16 md:h-20" />

      <section className="py-16 md:py-24" style={{ background: 'linear-gradient(135deg, #1a5a5a 0%, #2a7a7a 50%, #3a9a9a 100%)' }}>
        <div className="container-wide text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{t("faq.title")}</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">{t("faq.subtitle")}</p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AnimatedSection key={index} delay={index * 50} animation="fade-up">
                  <AccordionItem 
                    value={`item-${index}`}
                    className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-secondary/50 data-[state=open]:shadow-lg transition-all"
                  >
                    <AccordionTrigger className={`${isRTL ? "text-right" : "text-left"} text-lg font-semibold hover:no-underline py-5`}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </AnimatedSection>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container-wide text-center">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{t("faq.notFound")}</h2>
            <p className="text-muted-foreground mb-8">{t("faq.contactUs")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/purchase">
                <Button variant="cta" size="xl" style={{ background: '#4ade80', color: '#1a5a5a' }}>
                  {t("nav.purchase")}
                </Button>
              </Link>
              <a href="tel:+972732721111">
                <Button variant="outline" size="xl" className="gap-2">
                  <Phone className="w-5 h-5" />
                  073-2721111
                </Button>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <footer className="text-white py-8" style={{ background: 'linear-gradient(135deg, #1a5a5a 0%, #2a7a7a 100%)' }}>
        <div className="container-wide text-center">
          <p className="text-white/70 text-sm">
            © {new Date().getFullYear()} TravelSure - {t("footer.company")}. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;
