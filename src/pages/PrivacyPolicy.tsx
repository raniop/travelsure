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
                  ? "סוכנות הביטוח אופיר ושות' סוכנות לביטוח (להלן: \"הסוכנות\") מייחסת חשיבות רבה לפרטיותך ומתחייבת להגן על המידע האישי שתמסור. השימוש באתר ו/או ההתקשרות עם הסוכנות מהווים הסכמה לאיסוף המידע ושימוש בו בהתאם למדיניות זו."
                  : "Ophir Insurance Agency (\"the Agency\") places great importance on your privacy and is committed to protecting your personal information. Using the website and/or engaging with the Agency constitutes consent to the collection and use of information in accordance with this policy."}
              </p>
              <p className="mt-2">
                {language === "he" 
                  ? "יובהר כי אינך מחויב על פי חוק למסור מידע אישי (כגון שם, ת\"ז, כתובת וכו'), אך מסירתו נדרשת לצורך קבלת שירותי ביטוח וייעוץ."
                  : "It is clarified that you are not legally required to provide personal information (such as name, ID, address, etc.), but providing it is necessary for receiving insurance and consulting services."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "2. רישום לשירותים ואיסוף מידע" : "2. Service Registration and Information Collection"}
              </h2>
              <p className="font-medium text-foreground">
                {language === "he" ? "רישום:" : "Registration:"}
              </p>
              <p>
                {language === "he" 
                  ? "חלק מהשירותים דורשים מסירת פרטים אישיים כגון שם, טלפון ודוא\"ל. ללא מסירת נתוני החובה, לא ניתן יהיה להירשם לשירותים אלו."
                  : "Some services require providing personal details such as name, phone, and email. Without providing mandatory data, it will not be possible to register for these services."}
              </p>
              <p className="font-medium text-foreground mt-3">
                {language === "he" ? "מידע שנאסף:" : "Information Collected:"}
              </p>
              <p>
                {language === "he" 
                  ? "בעת הגלישה עשוי להיאסף מידע על מאפייני הגלישה, עמודים שנצפו והצעות שעניינו אותך."
                  : "While browsing, information may be collected about browsing characteristics, pages viewed, and offers that interested you."}
              </p>
              <p className="font-medium text-foreground mt-3">
                {language === "he" ? "מאגר מידע:" : "Database:"}
              </p>
              <p>
                {language === "he" 
                  ? "המידע יישמר במאגרי הסוכנות. בעל המאגר הוא: אופיר ושות' סוכנות לביטוח."
                  : "The information will be stored in the Agency's databases. The database owner is: Ophir Insurance Agency."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "3. השימוש במידע" : "3. Use of Information"}
              </h2>
              <p>
                {language === "he" 
                  ? "הסוכנות תעשה שימוש במידע למטרות הבאות:"
                  : "The Agency will use the information for the following purposes:"}
              </p>
              <ul className={`list-disc mt-2 space-y-1 ${isRTL ? "mr-6" : "ml-6"}`}>
                <li>{language === "he" ? "יצירת קשר, מענה לפניות ואספקת תמיכה." : "Contact, responding to inquiries, and providing support."}</li>
                <li>{language === "he" ? "שיפור ושדרוג איכות השירותים והתכנים באתר." : "Improving and upgrading the quality of services and content on the website."}</li>
                <li>{language === "he" ? "דיוור ישיר ומידע שיווקי (בכפוף לזכותך לבקש הסרה מרשימת התפוצה בכל עת)." : "Direct mail and marketing information (subject to your right to request removal from the mailing list at any time)."}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "4. מסירת מידע לצד שלישי" : "4. Transfer of Information to Third Parties"}
              </h2>
              <p>
                {language === "he" 
                  ? "הסוכנות לא תעביר את פרטיך לצדדים שלישיים, למעט במקרים הבאים:"
                  : "The Agency will not transfer your details to third parties, except in the following cases:"}
              </p>
              <ul className={`list-disc mt-2 space-y-1 ${isRTL ? "mr-6" : "ml-6"}`}>
                <li>{language === "he" ? "בהסכמתך המפורשת." : "With your explicit consent."}</li>
                <li>{language === "he" ? "לצורך קבלת ייעוץ או שירותי ביטוח מצדדי ג' רלוונטיים." : "For receiving advice or insurance services from relevant third parties."}</li>
                <li>{language === "he" ? "במקרה של הפרת תנאי השימוש או ביצוע פעולות בניגוד לדין." : "In case of violation of terms of use or actions against the law."}</li>
                <li>{language === "he" ? "מכוח צו שיפוטי או לצורך מניעת נזק חמור לגוף או לרכוש." : "By court order or to prevent serious harm to person or property."}</li>
                <li>{language === "he" ? "במקרה של שינוי מבני בסוכנות (מיזוג או ארגון מחדש), בכפוף להתחייבות הגוף החדש למדיניות זו." : "In case of structural change in the Agency (merger or reorganization), subject to the new entity's commitment to this policy."}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "5. זכות עיון ותיקון מידע" : "5. Right to View and Correct Information"}
              </h2>
              <p>
                {language === "he" 
                  ? "על פי חוק הגנת הפרטיות, הינך זכאי לעיין במידע המוחזק עליך ולבקש לתקנו או למחקו אם מצאת שאינו נכון או מעודכן. אם המידע משמש ל\"פניה בהצעה מסחרית\", הינך זכאי לדרוש את מחיקתך מהמאגר המשמש לכך."
                  : "Under the Privacy Protection Law, you are entitled to review the information held about you and request to correct or delete it if you find it incorrect or outdated. If the information is used for \"commercial proposal contact,\" you are entitled to demand your deletion from the database used for this purpose."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "6. אבטחת מידע ו-Cookies" : "6. Information Security and Cookies"}
              </h2>
              <p className="font-medium text-foreground">
                {language === "he" ? "אבטחה:" : "Security:"}
              </p>
              <p>
                {language === "he" 
                  ? "הסוכנות מיישמת מערכות ונהלים לאבטחת מידע, אך אינה יכולה להבטיח חסינות מוחלטת מפני גישה בלתי מורשית."
                  : "The Agency implements systems and procedures for information security but cannot guarantee absolute immunity from unauthorized access."}
              </p>
              <p className="font-medium text-foreground mt-3">
                Cookies:
              </p>
              <p>
                {language === "he" 
                  ? "האתר משתמש בעוגיות לצורך תפעול שוטף, איסוף נתונים סטטיסטיים והתאמה אישית. באפשרותך לנטרל את העוגיות דרך הגדרות הדפדפן שלך."
                  : "The website uses cookies for regular operation, statistical data collection, and personalization. You can disable cookies through your browser settings."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "7. שינויים במדיניות" : "7. Policy Changes"}
              </h2>
              <p>
                {language === "he" 
                  ? "הסוכנות רשאית לשנות את מדיניות הפרטיות. שינויים מהותיים ייכנסו לתוקפם 14 ימים לאחר פרסום הודעה באתר. המשך השימוש מהווה הסכמה למדיניות המעודכנת."
                  : "The Agency reserves the right to change the privacy policy. Significant changes will take effect 14 days after posting a notice on the website. Continued use constitutes consent to the updated policy."}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                {language === "he" ? "8. יצירת קשר" : "8. Contact"}
              </h2>
              <p>
                {language === "he" 
                  ? "בכל שאלה או תלונה בנושא הגנת הפרטיות, ניתן לפנות למנהל השירות במייל:"
                  : "For any question or complaint regarding privacy protection, you can contact the service manager by email:"}
                <br />
                eli@ophirins.co.il
                <br />
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
