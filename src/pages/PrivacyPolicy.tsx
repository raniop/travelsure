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
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            {language === "he" ? "מדיניות פרטיות" : "Privacy Policy"}
          </h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "1. מבוא והסכמה" : "1. Introduction and Consent"}
              </h2>
              <p>
                {language === "he" 
                  ? "סוכנות אופיר ביטוח ושות' (להלן: \"הסוכנות\") מייחסת חשיבות רבה לפרטיותך. הסוכנות מתחייבת להגן על המידע האישי שתמסור, בהתאם למדיניות זו."
                  : "Ophir Insurance Agency (\"the Agency\") places great importance on your privacy. The Agency is committed to protecting the personal information you provide, in accordance with this policy."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "2. הרשמה לשירותים ואיסוף מידע" : "2. Service Registration and Information Collection"}
              </h2>
              <p>
                {language === "he" 
                  ? "לצורך רישום לשירותים, יש למסור פרטים אישיים כגון: שם, טלפון, דוא\"ל. מסירת הפרטים הללו היא חובה."
                  : "To register for services, you must provide personal details such as: name, phone, email. Providing these details is mandatory."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "3. מידע שנאסף" : "3. Information Collected"}
              </h2>
              <p>
                {language === "he" 
                  ? "בעת הגלישה באתר, עשוי להיאסף מידע על מאפייני הגלישה שלך. המידע יישמר במאגרי הסוכנות."
                  : "While browsing the website, information about your browsing characteristics may be collected. The information will be stored in the Agency's databases."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "4. שימוש במידע" : "4. Use of Information"}
              </h2>
              <p>
                {language === "he" 
                  ? "הסוכנות תעשה שימוש במידע למטרות תמיכה, מענה לפניות, שיפור איכות השירותים והתכנים באתר."
                  : "The Agency will use the information for support purposes, responding to inquiries, and improving the quality of services and content on the website."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "5. העברת מידע לצדדים שלישיים" : "5. Transfer of Information to Third Parties"}
              </h2>
              <p>
                {language === "he" 
                  ? "הסוכנות לא תעביר את פרטיך לצדדים שלישיים, למעט במקרים המפורשים בהסכמתך."
                  : "The Agency will not transfer your details to third parties, except in cases explicitly stated with your consent."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "6. זכויותיך" : "6. Your Rights"}
              </h2>
              <p>
                {language === "he" 
                  ? "הינך זכאי לעיין במידע המוחזק עליך, לתקן אותו או לבקש את מחיקתו אם הוא אינו נכון או מעודכן."
                  : "You are entitled to review the information held about you, correct it, or request its deletion if it is incorrect or outdated."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "7. אבטחת מידע ו-Cookies" : "7. Information Security and Cookies"}
              </h2>
              <p>
                {language === "he" 
                  ? "הסוכנות מיישמת נהלים ואבטחת מידע, אך אינה יכולה להבטיח חסינות מוחלטת. ניתן לנטר את העוגיות דרך הגדרות הדפדפן שלך."
                  : "The Agency implements information security procedures but cannot guarantee absolute immunity. You can monitor cookies through your browser settings."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "8. שינויים במדיניות" : "8. Policy Changes"}
              </h2>
              <p>
                {language === "he" 
                  ? "שינויים מהותיים במדיניות הפרטיות ייכנסו לתוקפם 14 ימים לאחר פרסום המדיניות המעודכנת. הסוכנות רשאית לשנות את המדיניות. המשך השימוש באתר מהווה הסכמה."
                  : "Significant changes to the privacy policy will take effect 14 days after publication of the updated policy. The Agency reserves the right to change the policy. Continued use of the website constitutes consent."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "9. יצירת קשר" : "9. Contact"}
              </h2>
              <p>
                {language === "he" 
                  ? "ניתן לפנות למנהל השירות במייל:"
                  : "You can contact the service manager by email:"}
                <br />
                eli@ophirins.co.il<br />
                {language === "he" ? "או בטלפון:" : "Or by phone:"} 073-2721100
              </p>
            </section>

            <section className="pt-4 border-t border-border">
              <p className="text-sm">
                {language === "he" ? "עודכן לאחרונה בתאריך:" : "Last updated:"} 31.12.2025
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
