import { Link } from "react-router-dom";
import { Headphones, Plane, ShieldCheck, UserRound } from "lucide-react";

const benefits = [
  { icon: ShieldCheck, title: "עד 5 מיליון $", text: "כיסוי רפואי גבוה לנסיעה" },
  { icon: Headphones, title: "24/7", text: "מוקד חירום זמין תמיד" },
  { icon: UserRound, title: "סוכן אישי", text: "ליווי אנושי לאורך הדרך" },
  { icon: Plane, title: "מותאם לכם", text: "הרחבות לפי סוג הנסיעה" },
];

const faqs = ["מה הכיסוי כולל?", "איך מגישים תביעה?", "איך קונים ביטוח לנסיעה?"];

const MockupV2 = () => {
  return (
    <div className="min-h-screen bg-white font-heebo text-[#0b1b4b]" dir="rtl">
      <header className="bg-[#071433] text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-black">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#22c55e] text-sm text-[#071433]">T</span>
            אופיר ושות'
          </div>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#hero">ראשי</a>
            <a href="#benefits">מה מקבלים</a>
            <a href="#steps">איך זה עובד</a>
            <a href="#faq">שאלות</a>
          </nav>
          <Link to="/purchase" className="rounded-full bg-[#22c55e] px-4 py-2 text-sm font-bold text-[#071433]">
            לרכישה
          </Link>
        </div>
      </header>

      <section id="hero" className="bg-[#071433] text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1.1fr_.9fr] md:py-16">
          <div className="text-right">
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              טסים לחו״ל?
              <span className="mt-2 block text-[#22c55e]">ביטוח בכמה דקות.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 md:text-base">
              פוליסה של הראל, סוכן 24/7 בעברית, ומחיר ברור לפני שמתחילים.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {["הראל", "24/7", "ללא ניירת"].map((chip) => (
                <span key={chip} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 text-[#0b1b4b] shadow-2xl">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span>הל אביב</span>
              <span>לאן טסים?</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="rounded-2xl border border-slate-200 p-3 text-right">
                <span className="block text-xs text-slate-400">תאריך חזרה</span>
                <span className="font-bold">בחרו תאריך</span>
              </label>
              <label className="rounded-2xl border border-slate-200 p-3 text-right">
                <span className="block text-xs text-slate-400">תאריך יציאה</span>
                <span className="font-bold">בחרו תאריך</span>
              </label>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 p-3 text-right text-sm">
              <span className="block text-xs text-slate-400">נוסעים</span>
              <span className="font-bold">2</span>
            </div>
            <Link
              to="/purchase"
              className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-[#22c55e] text-sm font-black text-[#071433]"
            >
              קבלו הצעה
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-4 py-10 text-center">
        {[
          ["1977", "שנת הקמה"],
          ["הראל", "חברת הביטוח"],
          ["כ-450", "סוכנים"],
        ].map(([value, label]) => (
          <div key={label} className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-slate-200">
            <div>
              <div className="text-xl font-black">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </section>

      <section id="benefits" className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-6 text-right text-3xl font-black">מה מקבלים</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {benefits.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-right">
              <item.icon className="mb-4 h-6 w-6 text-[#0b1b4b]" />
              <h3 className="font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="steps" className="bg-[#071433] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-right text-3xl font-black">שלושה צעדים, וטסים</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ["1", "מלאו נסיעה", "יעד, תאריכים ומספר נוסעים"],
              ["2", "קבלו מחיר", "הצעה ברורה בלי הפתעות"],
              ["3", "הפוליסה אצלכם", "מסמכים וליווי מיידי"],
            ].map(([n, title, text]) => (
              <div key={n} className="text-right">
                <div className="text-5xl font-black text-[#22c55e]">{n}</div>
                <h3 className="mt-2 text-xl font-black">{title}</h3>
                <p className="mt-1 text-sm text-white/70">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-left">
            <Link to="/purchase" className="inline-flex rounded-full bg-[#22c55e] px-5 py-2.5 text-sm font-black text-[#071433]">
              מתחילים
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-14 md:grid-cols-2">
        <div className="text-right">
          <h2 className="text-3xl font-black leading-tight">
            מעדיפים לדבר
            <br />
            עם בן אדם?
          </h2>
        </div>
        <div className="flex justify-end gap-3">
          <a href="tel:0732721111" className="rounded-full bg-[#071433] px-5 py-3 text-sm font-bold text-white">
            073-272-1111
          </a>
          <Link to="/contact" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold">
            השאירו פרטים
          </Link>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="mb-4 text-center text-3xl font-black">שאלות</h2>
        <div className="space-y-3">
          {faqs.map((q) => (
            <div key={q} className="rounded-2xl bg-slate-100 px-5 py-4 text-right text-sm font-semibold">
              {q}
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#071433] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-white/70 md:flex-row">
          <span>© 2026 אופיר ושות'</span>
          <span>ophir@ophirins.co.il</span>
          <span>ביטוח נסיעות. פשוט.</span>
        </div>
      </footer>
    </div>
  );
};

export default MockupV2;
