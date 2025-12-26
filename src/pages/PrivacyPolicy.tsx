import Header from "@/components/Header";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen font-heebo bg-background" dir="rtl">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Content */}
      <main className="container-wide py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">מדיניות פרטיות</h1>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">כללי</h2>
              <p>
                אופיר ושות׳ סוכנות לביטוח (להלן: "החברה") מכבדת את פרטיות המשתמשים באתר. 
                מדיניות פרטיות זו מתארת את האופן בו אנו אוספים, משתמשים ומגנים על המידע שלך.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">איסוף מידע</h2>
              <p>
                אנו אוספים מידע שאתה מספק לנו באופן ישיר, כגון שם, כתובת דוא"ל, מספר טלפון 
                ופרטים נוספים הנדרשים לצורך מתן שירותי ביטוח. בנוסף, אנו עשויים לאסוף מידע 
                טכני אודות הגלישה שלך באתר.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">שימוש במידע</h2>
              <p>המידע שנאסף משמש אותנו למטרות הבאות:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>מתן שירותי ביטוח ותמיכה</li>
                <li>יצירת קשר בנוגע לפניות ובקשות</li>
                <li>שיפור השירותים והאתר שלנו</li>
                <li>עמידה בדרישות חוקיות ורגולטוריות</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">אבטחת מידע</h2>
              <p>
                אנו נוקטים באמצעי אבטחה מתקדמים על מנת להגן על המידע האישי שלך מפני גישה 
                בלתי מורשית, שימוש לרעה או חשיפה.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">שיתוף מידע</h2>
              <p>
                איננו מוכרים, סוחרים או מעבירים לצדדים שלישיים את המידע האישי שלך, למעט 
                במקרים הנדרשים לצורך מתן השירותים (כגון חברות ביטוח) או כנדרש על פי חוק.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">עוגיות (Cookies)</h2>
              <p>
                האתר עשוי להשתמש בעוגיות לצורך שיפור חווית המשתמש. באפשרותך לשלוט בהגדרות 
                העוגיות דרך הדפדפן שלך.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">זכויותיך</h2>
              <p>
                יש לך זכות לבקש גישה למידע האישי שלך, לתקן אותו או למחוק אותו. לכל בקשה 
                ניתן לפנות אלינו בפרטי ההתקשרות המופיעים באתר.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">יצירת קשר</h2>
              <p>
                לשאלות בנוגע למדיניות הפרטיות, ניתן לפנות אלינו:<br />
                דוא"ל: ophir@ophirins.co.il<br />
                טלפון: 073-2721111
              </p>
            </section>

            <section className="pt-4 border-t border-border">
              <p className="text-sm">
                מדיניות זו עודכנה לאחרונה בתאריך: {new Date().toLocaleDateString('he-IL')}
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-white py-8" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 100%)' }}>
        <div className="container-wide text-center text-sm text-white/50">
          <p>© {new Date().getFullYear()} TravelSure - אופיר ושות׳ סוכנות לביטוח. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
