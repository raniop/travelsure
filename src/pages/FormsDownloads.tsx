import { Download, ExternalLink, FileText, Globe, ShieldCheck, Sparkles, Users } from "lucide-react";
import Header from "@/components/Header";

type DownloadFormItem = {
  title: string;
  description: string;
  url?: string;
};

type FormCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: "travel" | "workers" | "tourists";
  accent: string;
  glow: string;
  forms: DownloadFormItem[];
};

const FORM_CATEGORIES: FormCategory[] = [
  {
    id: "travel",
    title: 'חו"ל',
    subtitle: "טפסים ומסמכים לביטוח נסיעות",
    icon: "travel",
    accent: "from-sky-500/20 via-cyan-400/15 to-blue-500/20",
    glow: "shadow-[0_20px_60px_-25px_rgba(14,116,144,0.35)]",
    forms: [
      {
        title: "תעריפון דמי הביטוח - דרכון First Class",
        description: "קישור ישיר לקובץ תעריפון",
        url: "https://media.harel-group.co.il/media/atjjf1z2/תעריפון-דמי-ביטוח-דרכון-first-class.xlsx",
      },
      {
        title: "הודעה על הגדרת ספורט אתגרי",
        description: "קישור ישיר למסמך הרשמי",
        url: "https://media.harel-group.co.il/media/of1evuu4/הודעה-על-הגדרת-ספורט-אתגרי.pdf",
      },
      {
        title: "תנאי פוליסת ביטוח נסיעות לחו\"ל First Class",
        description: "קישור ישיר לתנאי הפוליסה",
        url: "https://media.harel-group.co.il/media/k2jji3iq/תנאי-פוליסת-ביטוח-נסיעות-לחול-first-class.pdf",
      },
      {
        title: "פוליסת שיר לנוסע - שירביט מבית הראל",
        description: "קישור ישיר לפוליסה",
        url: "https://media.harel-group.co.il/media/cldop4fu/פוליסת-ביטוח-נסיעות-לחו-ל-שיר-לנוסע-שירביט-מבית-הראל-חברה-לביטוח.pdf",
      },
      {
        title: "תנאי פוליסה באנגלית - First Class",
        description: "קישור ישיר לתנאי הפוליסה באנגלית",
        url: "https://media.harel-group.co.il/media/2hum5gui/תנאי-פוליסת-ביטוח-נסיעות-לחול-אנגלית-first-class.pdf",
      },
      {
        title: "תנאי פוליסה ברוסית - First Class",
        description: "קישור ישיר לתנאי הפוליסה ברוסית",
        url: "https://media.harel-group.co.il/media/zh2egmhc/תנאי-פוליסת-ביטוח-נסיעות-לחול-רוסיתfirst-class.pdf",
      },
      {
        title: "תנאי פוליסה בערבית - First Class",
        description: "קישור ישיר לתנאי הפוליסה בערבית",
        url: "https://media.harel-group.co.il/media/hmhbxfow/תנאי-פוליסת-ביטוח-נסיעות-לחול-ערבית-first-class.pdf",
      },
      {
        title: "גבולות אחריות דרכון First Class",
        description: "קישור ישיר למסמך גבולות אחריות",
        url: "https://media.harel-group.co.il/media/1ond1jxt/גבולות-אחריות-דרכון-first-class.pdf",
      },
      {
        title: "טופס הצעה לביטוח נסיעות לחו\"ל - First Class",
        description: "קישור ישיר לטופס ההצעה",
        url: "https://media.harel-group.co.il/media/kgglzwna/טופס-הצעה-לביטוח-נסיעות-לחול-first-class.pdf",
      },
      {
        title: "טופס הצעה לתושבי חוץ - First Class",
        description: "קישור ישיר לטופס ההצעה לתושבי חוץ",
        url: "https://media.harel-group.co.il/media/01qllwu5/טופס-הצעה-לביטוח-נסיעות-לחול-לתושבי-חוץ-first-class.pdf",
      },
    ],
  },
  {
    id: "foreign-workers",
    title: "עובדים זרים",
    subtitle: "מסמכי Safe Stay Plus לעובדים זרים",
    icon: "workers",
    accent: "from-emerald-500/20 via-teal-400/15 to-lime-400/20",
    glow: "shadow-[0_20px_60px_-25px_rgba(5,150,105,0.35)]",
    forms: [
      {
        title: "תנאי פוליסה מלאים - Safe Stay Plus (עברית)",
        description: "קישור ישיר לתנאי הפוליסה",
        url: "https://d1i0hy0ksitt1q.cloudfront.net/media/b44hwgyf/%D7%AA%D7%A0%D7%90%D7%99-%D7%A4%D7%95%D7%9C%D7%99%D7%A1%D7%AA-%D7%91%D7%99%D7%98%D7%95%D7%97-%D7%91%D7%A8%D7%99%D7%90%D7%95%D7%AA-%D7%9C%D7%A2%D7%95%D7%91%D7%93%D7%99%D7%9D-%D7%96%D7%A8%D7%99%D7%9D-safe-stay-plus-%D7%91%D7%A2%D7%91%D7%A8%D7%99%D7%AA.pdf",
      },
      {
        title: "גילוי נאות - Safe Stay Plus",
        description: "קישור ישיר למסמך גילוי נאות",
        url: "https://media.harel-group.co.il/media/yobbke4q/safe-stay-plus-גילוי-נאות.pdf",
      },
      {
        title: "גילוי נאות באנגלית - Safe Stay Plus",
        description: "קישור ישיר למסמך גילוי נאות באנגלית",
        url: "https://media.harel-group.co.il/media/xkldakjb/safe-stayplus-גילוי-נאות-באנגלית.pdf",
      },
      {
        title: "טופס הצעה לביטוח בריאות לעובדים זרים בישראל",
        description: "קישור ישיר לטופס הצעה",
        url: "https://media.harel-group.co.il/media/h5sfypqe/טופס-הצעה-לביטוח-בריאות-לעובדים-זרים-בישראל.pdf",
      },
      {
        title: "הגדרת ספורט אתגרי - ביטוח עובדים זרים",
        description: "קישור ישיר למסמך",
        url: "https://media.harel-group.co.il/media/hc0lmyxj/הגדרת-ספורט-אתגרי-ביטוח-עובדים-זרים-בישראל.pdf",
      },
      {
        title: "טופס הצהרת בריאות - אנגלית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/hb5lz34f/טופס-הצהרת-בריאות-באנגלית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - רוסית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/bv3bc0yk/טופס-הצהרת-בריאות-ברוסית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - תאילנדית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/bqql2nhk/טופס-הצהרת-בריאות-בתאילנדית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - הינדית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/4b1hqtho/טופס-הצהרת-בריאות-בהינדית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - טיגרית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/ivyajkqs/טופס-הצהרת-בריאות-בטיגרית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - סינית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/jezhcg44/טופס-הצהרת-בריאות-בסינית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - רומנית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/iyzhgbxd/טופס-הצהרת-בריאות-ברומנית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - סינהלית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/ptpfonnr/טופס-הצהרת-בריאות-בסינהלית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - אוזבקית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/i2ydavst/טופס-הצהרת-בריאות-באוזבקית-ביטוח-עובדים-זרים.pdf",
      },
      {
        title: "תנאי פוליסה באנגלית - Safe Stay Plus",
        description: "קישור ישיר לתנאי פוליסה באנגלית",
        url: "https://media.harel-group.co.il/media/yfdbic0p/באנגלית-safe-stay-plus-תנאי-פוליסת-ביטוח-בריאות-לעובדים-זרים.pdf",
      },
      {
        title: "תנאי פוליסה בעברית - Safe Stay Plus",
        description: "קישור ישיר לתנאי פוליסה בעברית",
        url: "https://media.harel-group.co.il/media/mq0paqbj/בעברית-safe-stay-plus-תנאי-פוליסת-ביטוח-בריאות-לעובדים-זרים.pdf",
      },
      {
        title: "טופס הצהרת בריאות - פיליפינית",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/3wyfdp3b/טופס-הצהרת-בריאות-בפיליפינית-ביטוח-עובדים-זרים.pdf",
      },
    ],
  },
  {
    id: "tourists",
    title: "תיירים",
    subtitle: "מסמכי Tour & Care לתיירים בישראל",
    icon: "tourists",
    accent: "from-violet-500/20 via-fuchsia-400/15 to-indigo-500/20",
    glow: "shadow-[0_20px_60px_-25px_rgba(109,40,217,0.35)]",
    forms: [
      {
        title: "תנאי פוליסה מלאים - Tour & Care",
        description: "קישור ישיר לתנאי הפוליסה",
        url: "https://d1i0hy0ksitt1q.cloudfront.net/media/izrprnwb/%D7%AA%D7%A0%D7%90%D7%99-%D7%A4%D7%95%D7%9C%D7%99%D7%A1%D7%AA-%D7%91%D7%99%D7%98%D7%95%D7%97-%D7%9C%D7%AA%D7%99%D7%99%D7%A8%D7%99%D7%9D-tour-and-care-%D7%91%D7%A2%D7%91%D7%A8%D7%99%D7%AA.pdf",
      },
      {
        title: "טופס הצעה לביטוח רפואי לתיירים בישראל - Tour & Care",
        description: "קישור ישיר לטופס הצעה",
        url: "https://media.harel-group.co.il/media/wr1amwa5/tour-and-care-טופס-הצעה-לביטוח-לתיירים.pdf",
      },
      {
        title: "תנאי פוליסה בעברית - Tour & Care",
        description: "קישור ישיר לתנאי הפוליסה בעברית",
        url: "https://media.harel-group.co.il/media/izrprnwb/תנאי-פוליסת-ביטוח-לתיירים-tour-and-care-בעברית.pdf",
      },
      {
        title: "תנאי פוליסה באנגלית - Tour & Care",
        description: "קישור ישיר לתנאי הפוליסה באנגלית",
        url: "https://media.harel-group.co.il/media/usfa1dbz/תנאי-פוליסת-ביטוח-לתיירים-tour-and-care-באנגלית.pdf",
      },
      {
        title: "גילוי נאות - Tour & Care",
        description: "קישור ישיר למסמך גילוי נאות",
        url: "https://media.harel-group.co.il/media/nm1pcxg2/גילוי-נאות-לפוליסת-ביטוח-רפואי-לתיירים-בישראל-tour-care.pdf",
      },
      {
        title: "הגדרת ספורט אתגרי - תיירים בישראל",
        description: "קישור ישיר למסמך",
        url: "https://media.harel-group.co.il/media/hkdmyn45/הגדרת-ספורט-אתגרי-ביטוח-תיירים-בישראל.pdf",
      },
      {
        title: "הגדרת ספורט אתגרי באנגלית - תיירים בישראל",
        description: "קישור ישיר למסמך באנגלית",
        url: "https://media.harel-group.co.il/media/bklhrc4g/הגדרת-ספורט-אתגרי-אנגלית-ביטוח-תיירים-בישראל.pdf",
      },
      {
        title: "טופס הצעה לביטוח תיירים באנגלית - Tour & Care",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/q52d3w2r/טופס-הצעה-לביטוח-תיירים-באנגלית-tour-and-care.pdf",
      },
      {
        title: "טופס הצעה לביטוח תיירים ברוסית - Tour & Care",
        description: "קישור ישיר לטופס",
        url: "https://media.harel-group.co.il/media/py0i2zzb/טופס-הצעה-לביטוח-תיירים-ברוסית-tour-and-care.pdf",
      },
      {
        title: "תנאי פוליסה ברוסית - Tour & Care",
        description: "קישור ישיר לתנאי הפוליסה ברוסית",
        url: "https://media.harel-group.co.il/media/skvngvan/תנאי-פוליסת-ביטוח-לתייריםtour-and-care-ברוסית.pdf",
      },
    ],
  },
];

const categoryIcon = (icon: FormCategory["icon"]) => {
  if (icon === "travel") return Globe;
  if (icon === "workers") return Users;
  return ShieldCheck;
};

const FormsDownloads = () => {
  const totalForms = FORM_CATEGORIES.reduce((acc, category) => acc + category.forms.length, 0);

  return (
    <div
      className="min-h-screen font-heebo bg-slate-950 text-slate-100 relative overflow-hidden"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-140px] h-[460px] w-[460px] rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute top-[26%] left-[-120px] h-[420px] w-[420px] rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[32%] h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_55%)]" />
      </div>

      <div className="relative z-10">
        <Header />
        <div className="h-16 md:h-20" />

        <main className="container-wide py-8 md:py-14 space-y-7 md:space-y-10">
          <section className="rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-xl p-6 md:p-10 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.65)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-6 md:gap-8 items-start">
              <div className="text-right">
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  טפסים להורדה
                </p>
                <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight tracking-tight text-white">
                  מרכז הטפסים החדש
                </h1>
                <p className="mt-3 text-sm md:text-base text-slate-200/90 leading-7 max-w-2xl">
                  כל הטפסים הרשמיים של הראל מרוכזים במקום אחד, בעיצוב חדש ומסודר לפי קטגוריות.
                  לחיצה על כל פריט פותחת קישור ישיר למסמך המדויק.
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5 justify-end">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                    {FORM_CATEGORIES.length} קטגוריות
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                    {totalForms} קישורים ישירים
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-slate-900/35 p-4 md:p-5 backdrop-blur-md">
                <p className="text-right text-sm font-bold text-cyan-100">ניווט מהיר לקטגוריה</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                  {FORM_CATEGORIES.map((category) => (
                    <a
                      key={category.id}
                      href={`#${category.id}`}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 transition text-right"
                    >
                      {category.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-7 md:space-y-9">
            {FORM_CATEGORIES.map((category) => (
              <section
                id={category.id}
                key={category.id}
                className={`rounded-[24px] border border-white/20 bg-white/10 backdrop-blur-xl p-4 md:p-6 ${category.glow}`}
              >
                <div className={`rounded-2xl border border-white/20 bg-gradient-to-l ${category.accent} p-4 md:p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="h-12 w-12 rounded-xl border border-white/20 bg-white/15 flex items-center justify-center text-white">
                      {(() => {
                        const Icon = categoryIcon(category.icon);
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div className="text-right flex-1">
                      <h2 className="text-xl md:text-2xl font-extrabold text-white">{category.title}</h2>
                      <p className="mt-1 text-sm md:text-base text-slate-100/90">{category.subtitle}</p>
                      <p className="mt-1 text-xs text-slate-200/85">{category.forms.length} פריטים בקטגוריה</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                  {category.forms.map((form, index) => {
                    const hasUrl = Boolean(form.url && form.url.trim());
                    return (
                      <article
                        key={`${category.id}-${index}`}
                        className="group rounded-2xl border border-white/15 bg-slate-900/35 p-4 md:p-5 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.8)] hover:border-cyan-300/55 hover:bg-slate-900/55 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            className="h-10 w-10 rounded-xl border border-white/20 bg-white/10 flex items-center justify-center text-cyan-100 shrink-0"
                            aria-hidden="true"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <div className="text-right flex-1">
                            <h3 className="text-sm md:text-base font-bold text-slate-100 leading-6">{form.title}</h3>
                            <p className="mt-1 text-xs md:text-sm text-slate-300/90 leading-6">{form.description}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          {hasUrl ? (
                            <a
                              href={form.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/40 bg-gradient-to-l from-cyan-400 to-blue-500 px-3.5 py-2 text-xs md:text-sm font-semibold text-white shadow-[0_10px_25px_-12px_rgba(56,189,248,0.65)] hover:from-cyan-300 hover:to-blue-400 transition"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <Download className="h-4 w-4" />
                              הורד טופס
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs md:text-sm font-semibold text-slate-300">
                              <Download className="h-4 w-4" />
                              יתווסף בקרוב
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FormsDownloads;
