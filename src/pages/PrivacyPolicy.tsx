import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const PrivacyPolicy = () => {
  const { t, isRTL, language } = useLanguage();
  
  return (
    <div className="min-h-screen font-heebo bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="h-16 md:h-20" />

      <main className="container-wide py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">{t("privacy.title")}</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.general")}</h2>
              <p>{t("privacy.generalText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.collection")}</h2>
              <p>{t("privacy.collectionText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.usage")}</h2>
              <p>{t("privacy.usageText")}</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t("privacy.usage1")}</li>
                <li>{t("privacy.usage2")}</li>
                <li>{t("privacy.usage3")}</li>
                <li>{t("privacy.usage4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.security")}</h2>
              <p>{t("privacy.securityText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.sharing")}</h2>
              <p>{t("privacy.sharingText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.cookies")}</h2>
              <p>{t("privacy.cookiesText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.rights")}</h2>
              <p>{t("privacy.rightsText")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">{t("privacy.contactTitle")}</h2>
              <p>
                {t("privacy.contactText")}<br />
                ophir@ophirins.co.il<br />
                073-2721111
              </p>
            </section>

            <section className="pt-4 border-t border-border">
              <p className="text-sm">
                {t("privacy.lastUpdated")} {new Date().toLocaleDateString(language === "he" ? 'he-IL' : 'en-US')}
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="text-white py-8" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 100%)' }}>
        <div className="container-wide text-center text-sm text-white/50">
          <p>© {new Date().getFullYear()} TravelSure - {t("footer.company")}. {t("footer.rights")}</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
