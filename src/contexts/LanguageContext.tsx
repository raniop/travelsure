import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "he" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  he: {
    // Header
    "nav.home": "בית",
    "nav.services": "שירותים",
    "nav.about": "אודות",
    "nav.faq": "שאלות נפוצות",
    "nav.contact": "צור קשר",
    "nav.purchase": "לרכישה",
    "nav.openMenu": "פתח תפריט",

    // Hero
    "hero.subtitle": "ביטוח נסיעות לחו״ל",
    "hero.description":
      "הביטחון שלכם הוא העדיפות שלנו. אנו מספקים פתרונות ביטוח מקיפים ומותאמים אישית לכל לקוח, עם שירות מקצועי וליווי צמוד.",
    "hero.feature1": "ליווי אישי ומקצועי גם במקרה תביעה",
    "hero.feature2": "מגוון פתרונות ביטוח",
    "hero.feature3": "שירות אנושי 24/7",
    "hero.cta": "לרכישת ביטוח נסיעות",

    // Services
    "services.label": "השירותים שלנו",
    "services.title": "פתרונות ביטוח מקיפים",
    "services.description": "אנו מציעים מגוון רחב של שירותי ביטוח, כולם עם ליווי אישי ומקצועי",
    "services.travel.title": "ביטוח נסיעות",
    "services.travel.desc": "טיסה בראש שקט עם כיסוי מקיף לחו״ל עד 5 מיליון דולר",
    "services.car.title": "ביטוח רכב",
    "services.car.desc": "כיסוי מקיף לרכב שלכם במחירים תחרותיים",
    "services.home.title": "ביטוח דירה",
    "services.home.desc": "הגנה מלאה על הבית ותכולתו",
    "services.business.title": "ביטוח עסקי",
    "services.business.desc": "פתרונות ביטוח מותאמים לעסקים קטנים וגדולים",
    "services.learnMore": "למידע נוסף",

    // About
    "about.label": "אודותינו",
    "about.title": "מחויבים להגנה",
    "about.titleHighlight": "שלכם ושל משפחתכם",
    "about.p1":
      "TravelSure היא סוכנות ביטוח מובילה בישראל המתמחה בביטוחי נסיעות לחו״ל. עם ניסיון של שנים רבות בתחום, אנו מספקים ללקוחותינו שירות אישי, מקצועי וזמין 24/7.",
    "about.p2":
      "אנו מאמינים שכל לקוח ראוי להתייחסות אישית ולפתרון ביטוחי המותאם במדויק לצרכיו. הצוות המנוסה שלנו כאן כדי ללוות אתכם בכל שלב.",
    "about.cta": "דברו איתנו",
    "about.stat1": "שנות ניסיון",
    "about.stat2": "לקוחות מרוצים",
    "about.stat3": "שירות לקוחות",
    "about.stat4": "כיסוי מקסימלי",

    // Extensions
    "extensions.label": "ביטוח נסיעות",
    "extensions.title": "הרחבות נוספות",
    "extensions.description": "התאימו את הביטוח לצרכים שלכם עם מגוון הרחבות",
    "extensions.pregnancy": "הריון",
    "extensions.pregnancy.desc": "כיסוי עד 350 אלף דולר, עד שבוע 32",
    "extensions.cancellation": "ביטול נסיעה",
    "extensions.cancellation.desc": "החזר עד $5,000 במקרה רפואי",
    "extensions.luggage": "כבודה",
    "extensions.luggage.desc": "עד $2,250 עבור איבוד או איחור",
    "extensions.rental": "רכב שכור",
    "extensions.rental.desc": "ביטול השתתפות עצמית בנזק",
    "extensions.winter": "ספורט חורף",
    "extensions.winter.desc": "הרחבה לסקי וספורט חורף",
    "extensions.extreme": "ספורט אתגרי",
    "extensions.extreme.desc": "כיסוי לספורט אקסטרים",
    "extensions.cta": "לרכישת ביטוח נסיעות",

    // Contact
    "contact.label": "צרו קשר",
    "contact.title": "נשמח לעמוד לשירותכם",
    "contact.description": "נציגנו זמינים עבורכם 24/7 בעברית ובאנגלית",
    "contact.formTitle": "השאירו פרטים ונחזור אליכם",
    "contact.inIsrael": "בארץ",
    "contact.inIsraelHours": "א׳-ה׳ 08:00-18:00",
    "contact.inIsraelFriday": "ו׳ וערבי חג 08:00-13:00",
    "contact.abroad": "בחו״ל",
    "contact.abroadHours": "זמינים 24/7",
    "contact.abroadLang": "בעברית ובאנגלית",
    "contact.directContact": "או צרו קשר ישירות:",
    "contact.whatsapp": "(וואטסאפ)",

    // Footer
    "footer.rights": "כל הזכויות שמורות.",
    "footer.privacy": "מדיניות פרטיות",
    "footer.terms": "תנאי שימוש",
    "footer.accessibility": "נגישות",
    "footer.company": "אופיר ושות׳ סוכנות לביטוח",

    // FAQ Page
    "faq.title": "שאלות ותשובות",
    "faq.subtitle": "כל מה שרציתם לדעת על ביטוח נסיעות לחו״ל",
    "faq.notFound": "לא מצאתם תשובה לשאלה שלכם?",
    "faq.contactUs": "צרו איתנו קשר ונשמח לעזור",
    "faq.q1": "מה כולל ביטוח נסיעות לחו״ל?",
    "faq.a1":
      "ביטוח נסיעות לחו״ל כולל כיסוי להוצאות רפואיות, אשפוז, תרופות, פינוי רפואי, ביטול או קיצור נסיעה, אובדן או עיכוב כבודה, ועוד. הכיסוי המדויק תלוי בפוליסה שנבחרה ובהרחבות הנוספות.",
    "faq.q2": "עד כמה זמן לפני הנסיעה אפשר לרכוש ביטוח?",
    "faq.a2":
      "ניתן לרכוש ביטוח נסיעות עד רגע לפני היציאה מהארץ. עם זאת, מומלץ לרכוש את הביטוח מוקדם יותר כדי ליהנות מכיסוי לביטול נסיעה מסיבות רפואיות.",
    "faq.q3": "האם יש כיסוי למצבים רפואיים קיימים?",
    "faq.a3":
      "כן, ברוב הפוליסות יש כיסוי להחמרה פתאומית ובלתי צפויה של מצב רפואי קיים. חשוב לציין את המצבים הרפואיים הקיימים בעת הרכישה ולבדוק את תנאי הפוליסה.",
    "faq.q4": "מה הכיסוי המקסימלי בביטוח נסיעות?",
    "faq.a4":
      "הכיסוי המקסימלי להוצאות רפואיות מגיע עד 5 מיליון דולר, תלוי בסוג הפוליסה שנבחרה. כיסויים נוספים כמו כבודה וביטול נסיעה יש להם תקרות נפרדות.",
    "faq.q5": "האם הביטוח מכסה ספורט אתגרי?",
    "faq.a5":
      "ספורט אתגרי וספורט חורף (כמו סקי) דורשים הרחבה מיוחדת לפוליסה. ניתן להוסיף את ההרחבה בעת רכישת הביטוח בתוספת תשלום קטנה.",
    "faq.q6": "מה עושים במקרה חירום בחו״ל?",
    "faq.a6":
      "במקרה חירום יש להתקשר למוקד החירום שלנו הפועל 24/7 בעברית ובאנגלית. המוקד יספק הכוונה רפואית, יתאם טיפול, ויטפל בכל הבירוקרטיה מול בתי החולים והרופאים.",
    "faq.q7": "האם יש כיסוי להריון?",
    "faq.a7":
      "כן, ניתן להוסיף הרחבת הריון לפוליסה עם כיסוי עד 350,000 דולר. ההרחבה תקפה עד שבוע 32 להריון ומכסה סיבוכי הריון ולידה מוקדמת.",
    "faq.q8": "כמה עולה ביטוח נסיעות?",
    "faq.a8":
      "מחיר הביטוח תלוי במספר גורמים: יעד הנסיעה, משך הנסיעה, גיל המבוטחים, והרחבות נוספות שנבחרו. ניתן לקבל הצעת מחיר מיידית באתר שלנו.",
    "faq.q9": "האם יש השתתפות עצמית?",
    "faq.a9":
      "ברוב הפוליסות אין השתתפות עצמית על הוצאות רפואיות. על כיסויים מסוימים כמו כבודה או ביטול נסיעה עשויה להיות השתתפות עצמית קטנה.",
    "faq.q10": "איך מגישים תביעה?",
    "faq.a10":
      "להגשת תביעה יש לשמור את כל הקבלות והאישורים הרפואיים. לאחר החזרה לארץ יש למלא טופס תביעה ולצרף את המסמכים. הצוות שלנו מלווה אתכם לאורך כל התהליך.",

    // Privacy Policy
    "privacy.title": "מדיניות פרטיות",
    "privacy.general": "כללי",
    "privacy.generalText":
      'אופיר ושות׳ סוכנות לביטוח (להלן: "החברה") מכבדת את פרטיות המשתמשים באתר. מדיניות פרטיות זו מתארת את האופן בו אנו אוספים, משתמשים ומגנים על המידע שלך.',
    "privacy.collection": "איסוף מידע",
    "privacy.collectionText":
      'אנו אוספים מידע שאתה מספק לנו באופן ישיר, כגון שם, כתובת דוא"ל, מספר טלפון ופרטים נוספים הנדרשים לצורך מתן שירותי ביטוח. בנוסף, אנו עשויים לאסוף מידע טכני אודות הגלישה שלך באתר.',
    "privacy.usage": "שימוש במידע",
    "privacy.usageText": "המידע שנאסף משמש אותנו למטרות הבאות:",
    "privacy.usage1": "מתן שירותי ביטוח ותמיכה",
    "privacy.usage2": "יצירת קשר בנוגע לפניות ובקשות",
    "privacy.usage3": "שיפור השירותים והאתר שלנו",
    "privacy.usage4": "עמידה בדרישות חוקיות ורגולטוריות",
    "privacy.security": "אבטחת מידע",
    "privacy.securityText":
      "אנו נוקטים באמצעי אבטחה מתקדמים על מנת להגן על המידע האישי שלך מפני גישה בלתי מורשית, שימוש לרעה או חשיפה.",
    "privacy.sharing": "שיתוף מידע",
    "privacy.sharingText":
      "איננו מוכרים, סוחרים או מעבירים לצדדים שלישיים את המידע האישי שלך, למעט במקרים הנדרשים לצורך מתן השירותים (כגון חברות ביטוח) או כנדרש על פי חוק.",
    "privacy.cookies": "עוגיות (Cookies)",
    "privacy.cookiesText":
      "האתר עשוי להשתמש בעוגיות לצורך שיפור חווית המשתמש. באפשרותך לשלוט בהגדרות העוגיות דרך הדפדפן שלך.",
    "privacy.rights": "זכויותיך",
    "privacy.rightsText":
      "יש לך זכות לבקש גישה למידע האישי שלך, לתקן אותו או למחוק אותו. לכל בקשה ניתן לפנות אלינו בפרטי ההתקשרות המופיעים באתר.",
    "privacy.contactTitle": "יצירת קשר",
    "privacy.contactText": "לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו:",
    "privacy.lastUpdated": "מדיניות זו עודכנה לאחרונה בתאריך:",

    // Purchase
    "purchase.title": "רכישת ביטוח נסיעות לחו״ל",
  },
  en: {
    // Header
    "nav.home": "Home",
    "nav.services": "Services",
    "nav.about": "About",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "nav.purchase": "Purchase",
    "nav.openMenu": "Open menu",

    // Hero
    "hero.subtitle": "Travel Insurance",
    "hero.description":
      "Your security is our priority. We provide comprehensive and personalized insurance solutions for every client, with professional service and close support.",
    "hero.feature1": "Personal & Professional Support",
    "hero.feature2": "Variety of Insurance Solutions",
    "hero.feature3": "24/7 Service",
    "hero.cta": "Purchase Travel Insurance",

    // Services
    "services.label": "Our Services",
    "services.title": "Comprehensive Insurance Solutions",
    "services.description": "We offer a wide range of insurance services, all with personal and professional support",
    "services.travel.title": "Travel Insurance",
    "services.travel.desc": "Travel with peace of mind with coverage up to $5 million",
    "services.car.title": "Car Insurance",
    "services.car.desc": "Comprehensive coverage for your vehicle at competitive prices",
    "services.home.title": "Home Insurance",
    "services.home.desc": "Full protection for your home and its contents",
    "services.business.title": "Business Insurance",
    "services.business.desc": "Tailored insurance solutions for small and large businesses",
    "services.learnMore": "Learn more",

    // About
    "about.label": "About Us",
    "about.title": "Committed to Protection",
    "about.titleHighlight": "For You and Your Family",
    "about.p1":
      "TravelSure is a leading insurance agency in Israel specializing in travel insurance. With many years of experience, we provide our clients with personal, professional service available 24/7.",
    "about.p2":
      "We believe every client deserves personal attention and an insurance solution tailored exactly to their needs. Our experienced team is here to accompany you every step of the way.",
    "about.cta": "Talk to Us",
    "about.stat1": "Years of Experience",
    "about.stat2": "Happy Customers",
    "about.stat3": "Customer Service",
    "about.stat4": "Maximum Coverage",

    // Extensions
    "extensions.label": "Travel Insurance",
    "extensions.title": "Additional Coverage",
    "extensions.description": "Customize your insurance with a variety of extensions",
    "extensions.pregnancy": "Pregnancy",
    "extensions.pregnancy.desc": "Coverage up to $350K, until week 32",
    "extensions.cancellation": "Trip Cancellation",
    "extensions.cancellation.desc": "Refund up to $5,000 for medical reasons",
    "extensions.luggage": "Luggage",
    "extensions.luggage.desc": "Up to $2,250 for loss or delay",
    "extensions.rental": "Rental Car",
    "extensions.rental.desc": "Deductible waiver for damage",
    "extensions.winter": "Winter Sports",
    "extensions.winter.desc": "Extension for skiing and winter sports",
    "extensions.extreme": "Extreme Sports",
    "extensions.extreme.desc": "Coverage for extreme sports",
    "extensions.cta": "Purchase Travel Insurance",

    // Contact
    "contact.label": "Contact Us",
    "contact.title": "We're Here to Help",
    "contact.description": "Our representatives are available 24/7 in Hebrew and English",
    "contact.formTitle": "Leave your details and we'll get back to you",
    "contact.inIsrael": "In Israel",
    "contact.inIsraelHours": "Sun-Thu 08:00-18:00",
    "contact.inIsraelFriday": "Fri & Holiday Eve 08:00-13:00",
    "contact.abroad": "Abroad",
    "contact.abroadHours": "Available 24/7",
    "contact.abroadLang": "In Hebrew and English",
    "contact.directContact": "Or contact us directly:",
    "contact.whatsapp": "(WhatsApp)",

    // Footer
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.accessibility": "Accessibility",
    "footer.company": "Ophir Insurance Agency",

    // FAQ Page
    "faq.title": "FAQ",
    "faq.subtitle": "Everything you wanted to know about travel insurance",
    "faq.notFound": "Didn't find an answer to your question?",
    "faq.contactUs": "Contact us and we'll be happy to help",
    "faq.q1": "What does travel insurance include?",
    "faq.a1":
      "Travel insurance includes coverage for medical expenses, hospitalization, medications, medical evacuation, trip cancellation or curtailment, luggage loss or delay, and more. The exact coverage depends on the policy chosen and additional extensions.",
    "faq.q2": "How far in advance can I purchase insurance?",
    "faq.a2":
      "You can purchase travel insurance up until the moment you leave the country. However, it's recommended to purchase earlier to enjoy coverage for trip cancellation due to medical reasons.",
    "faq.q3": "Is there coverage for pre-existing conditions?",
    "faq.a3":
      "Yes, most policies cover sudden and unexpected worsening of pre-existing conditions. It's important to declare existing conditions when purchasing and check the policy terms.",
    "faq.q4": "What is the maximum coverage?",
    "faq.a4":
      "Maximum coverage for medical expenses reaches up to $5 million, depending on the policy type. Other coverages like luggage and trip cancellation have separate limits.",
    "faq.q5": "Does the insurance cover extreme sports?",
    "faq.a5":
      "Extreme sports and winter sports (like skiing) require a special policy extension. The extension can be added when purchasing insurance for a small additional fee.",
    "faq.q6": "What to do in case of emergency abroad?",
    "faq.a6":
      "In case of emergency, call our 24/7 emergency center available in Hebrew and English. The center will provide medical guidance, coordinate treatment, and handle all bureaucracy with hospitals and doctors.",
    "faq.q7": "Is there pregnancy coverage?",
    "faq.a7":
      "Yes, you can add pregnancy coverage to the policy with coverage up to $350,000. The extension is valid until week 32 of pregnancy and covers pregnancy complications and premature birth.",
    "faq.q8": "How much does travel insurance cost?",
    "faq.a8":
      "Insurance price depends on several factors: destination, trip duration, insured age, and additional extensions chosen. You can get an instant quote on our website.",
    "faq.q9": "Is there a deductible?",
    "faq.a9":
      "Most policies have no deductible for medical expenses. For certain coverages like luggage or trip cancellation, there may be a small deductible.",
    "faq.q10": "How do I file a claim?",
    "faq.a10":
      "To file a claim, keep all receipts and medical documents. After returning, fill out a claim form and attach the documents. Our team accompanies you throughout the process.",

    // Privacy Policy
    "privacy.title": "Privacy Policy",
    "privacy.general": "General",
    "privacy.generalText":
      'Ophir Insurance Agency ("the Company") respects the privacy of website users. This privacy policy describes how we collect, use, and protect your information.',
    "privacy.collection": "Information Collection",
    "privacy.collectionText":
      "We collect information you provide directly, such as name, email address, phone number, and other details required for insurance services. We may also collect technical information about your browsing.",
    "privacy.usage": "Use of Information",
    "privacy.usageText": "The collected information is used for the following purposes:",
    "privacy.usage1": "Providing insurance services and support",
    "privacy.usage2": "Contacting regarding inquiries and requests",
    "privacy.usage3": "Improving our services and website",
    "privacy.usage4": "Compliance with legal and regulatory requirements",
    "privacy.security": "Information Security",
    "privacy.securityText":
      "We take advanced security measures to protect your personal information from unauthorized access, misuse, or disclosure.",
    "privacy.sharing": "Information Sharing",
    "privacy.sharingText":
      "We do not sell, trade, or transfer your personal information to third parties, except as required for service provision (such as insurance companies) or as required by law.",
    "privacy.cookies": "Cookies",
    "privacy.cookiesText":
      "The website may use cookies to improve user experience. You can control cookie settings through your browser.",
    "privacy.rights": "Your Rights",
    "privacy.rightsText":
      "You have the right to request access to your personal information, correct it, or delete it. For any request, contact us using the contact details on the website.",
    "privacy.contactTitle": "Contact",
    "privacy.contactText": "For questions about the privacy policy, contact us:",
    "privacy.lastUpdated": "This policy was last updated on:",

    // Purchase
    "purchase.title": "Purchase Travel Insurance",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "he";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === "he";

  return <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
