import { useEffect } from "react";
import { Phone, Mail, MessageCircle, Clock, Users } from "lucide-react";
import { AnimatedSection } from "@/hooks/useScrollAnimation";
import ContactForm from "@/components/ContactForm";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { t, isRTL } = useLanguage();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen font-heebo" dir="rtl">
      <Header />
      <div className="h-16 md:h-20" />
      
      <section className="section-padding bg-background">
        <div className="container-wide">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-12 md:mb-16">
              <span className="text-secondary font-semibold text-sm tracking-wider uppercase mb-4 block">{t("contact.label")}</span>
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t("contact.title")}</h1>
              <p className="text-muted-foreground text-lg">
                {t("contact.description")}
              </p>
            </AnimatedSection>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <AnimatedSection animation="fade-right">
                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h3 className="text-2xl font-bold text-foreground mb-6">{t("contact.formTitle")}</h3>
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
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
