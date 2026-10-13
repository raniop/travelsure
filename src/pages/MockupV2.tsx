import { ArrowLeft, BriefcaseBusiness, CheckCircle2, CircleGauge, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import Header from "@/components/Header";

const valueProps = [
  {
    icon: ShieldCheck,
    title: "הגנה מדויקת באמת",
    text: "התאמה חכמה בין צרכי הלקוח לפוליסה, עם שקיפות מלאה לאורך כל הדרך.",
  },
  {
    icon: HeartHandshake,
    title: "שירות אנושי וזמין",
    text: "זמינות גבוהה בוואטסאפ, טלפון ומייל עם ליווי אישי מרגע ההצעה ועד מקרה תביעה.",
  },
  {
    icon: CircleGauge,
    title: "תהליך מהיר ודיגיטלי",
    text: "פחות טפסים, פחות עומס, יותר יעילות - בלי לוותר על איכות מקצועית.",
  },
];

const serviceCards = [
  { title: 'ביטוח נסיעות לחו"ל', subtitle: "כיסוי רפואי, כבודה, ביטול וקיצור נסיעה", tag: "פופולרי" },
  { title: "עובדים זרים", subtitle: "Safe Stay Plus עם תהליך מסודר למעסיקים", tag: "עסקי" },
  { title: "ביטוח תיירים", subtitle: "Tour & Care עם מסמכים וקישורים ישירים", tag: "דיגיטלי" },
  { title: "ביטוחי רכב ודירה", subtitle: "מעטפת למשפחה ולעסק במקום אחד", tag: "משלים" },
];

const MockupV2 = () => {
  return (
    <div className="min-h-screen font-heebo bg-slate-50 text-slate-900" dir="rtl">
      <Header />
      <div className="h-16 md:h-20" />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-28 right-[-110px] h-80 w-80 rounded-full bg-violet-200/65 blur-3xl" />
          <div className="absolute top-[26%] left-[-120px] h-96 w-96 rounded-full bg-blue-200/55 blur-3xl" />
          <div className="absolute bottom-[-140px] right-[28%] h-72 w-72 rounded-full bg-fuchsia-100/55 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_0%,rgba(99,102,241,0.14),transparent_45%)]" />
        </div>

        <section className="container-wide relative py-10 md:py-14">
          <div className="rounded-[32px] border border-white/70 bg-white/80 backdrop-blur-xl p-6 md:p-10 shadow-[0_30px_80px_-35px_rgba(76,29,149,0.25)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr] gap-8 items-center">
              <div className="text-right">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-violet-100 to-blue-100 px-3.5 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  מוקאפ פרימיום מעודכן
                </span>
                <h1 className="mt-4 text-3xl md:text-6xl font-black leading-tight tracking-tight text-slate-900">
                  ביטוח נסיעות
                  <br />
                  עם חוויית AI אישית
                </h1>
                <p className="mt-4 max-w-2xl text-sm md:text-base leading-7 text-slate-600">
                  קונספט עיצובי בהיר ונקי עם היררכיה חזקה, שפה מודרנית ותחושת פרימיום ידידותית.
                  מתאים למותג ביטוח שרוצה אמון, בהירות ומהירות.
                </p>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_-14px_rgba(109,40,217,0.55)] transition hover:from-violet-500 hover:to-indigo-500"
                  >
                    התחלת רכישה
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-violet-50"
                  >
                    טפסים ושירות עצמי
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-indigo-50 to-sky-50 p-5 shadow-[0_20px_45px_-25px_rgba(99,102,241,0.35)]">
                <div className="text-right">
                  <p className="text-xs text-violet-600">ערכי מותג מובילים</p>
                  <h3 className="mt-1 text-xl font-extrabold text-slate-900">אמינות. פשטות. דיוק.</h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {["תוכן ברור עם היררכיה חזקה", "קריאות גבוהה גם במובייל", "עיצוב ממיר עם CTA בולט"].map((item) => (
                    <li key={item} className="flex items-center justify-end gap-2 text-sm text-slate-700">
                      <span>{item}</span>
                      <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="container-wide pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {valueProps.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_18px_40px_-30px_rgba(99,102,241,0.3)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-base font-extrabold text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="container-wide pb-10">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 md:p-7 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.4)]">
            <div className="flex items-center justify-between gap-3">
              <div className="h-11 w-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-slate-900">שירותים וקטגוריות</h2>
                <p className="mt-1 text-sm text-slate-600">כרטיסי תוכן ברורים עם זיהוי מהיר לכל שירות</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {serviceCards.map((service) => (
                <article
                  key={service.title}
                  className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 text-[11px] font-semibold">
                      {service.tag}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 text-right">{service.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 text-right leading-6">{service.subtitle}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container-wide pb-8">
          <div className="rounded-3xl border border-violet-100 bg-gradient-to-l from-indigo-100 via-violet-100 to-fuchsia-100 p-6 md:p-8 shadow-[0_24px_55px_-32px_rgba(109,40,217,0.28)]">
            <div className="grid grid-cols-1 md:grid-cols-[.9fr_1.1fr] gap-6 items-center">
              <button
                type="button"
                className="w-full md:w-auto rounded-full bg-gradient-to-l from-violet-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_-14px_rgba(109,40,217,0.55)] transition hover:from-violet-500 hover:to-indigo-500"
              >
                בואו נבנה גרסה חיה
              </button>
              <div className="text-right">
                <h3 className="text-2xl font-black text-slate-900">אזור CTA חדש וחד</h3>
                <p className="mt-2 text-sm md:text-base text-slate-700">
                  אזור קריאה לפעולה עם נוכחות גבוהה, טקסט תמציתי ומיקוד בהמרה.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="container-wide pb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 text-right">
            <h4 className="text-base font-black text-[#0b4e86]">Footer Style Direction</h4>
            <p className="mt-2 text-sm text-slate-600 leading-6">
              פוטר מינימליסטי עם טקסט קריא, קישורים מסודרים ושמירה על תחושת פרימיום נקייה.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default MockupV2;
