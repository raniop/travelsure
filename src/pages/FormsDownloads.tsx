import { Download, FileText } from "lucide-react";
import Header from "@/components/Header";

type DownloadFormItem = {
  title: string;
  description: string;
  url?: string;
};

type FormCategory = {
  id: string;
  title: string;
  forms: DownloadFormItem[];
};

const FORM_CATEGORIES: FormCategory[] = [
  {
    id: "travel",
    title: 'חו"ל',
    forms: [
      {
        title: "טופס תביעה ביטוח נסיעות",
        description: "הורדת טופס תביעה לנסיעות לחו\"ל",
        url: "",
      },
      {
        title: "טופס הצטרפות לביטוח נסיעות",
        description: "הורדת טופס הצטרפות/עדכון פרטים",
        url: "",
      },
    ],
  },
  {
    id: "foreign-workers",
    title: "עובדים זרים",
    forms: [
      {
        title: "טופס הצטרפות עובד זר",
        description: "הורדת טופס בקשה לביטוח עובדים זרים",
        url: "",
      },
      {
        title: "טופס שינוי פרטי מעסיק",
        description: "הורדת טופס לעדכון פרטי מעסיק/פוליסה",
        url: "",
      },
    ],
  },
  {
    id: "tourists",
    title: "תיירים",
    forms: [
      {
        title: "טופס ביטוח תיירים",
        description: "הורדת טופס הצטרפות לביטוח תיירים בישראל",
        url: "",
      },
      {
        title: "טופס הארכת ביטוח לתייר",
        description: "הורדת טופס בקשה להארכת תקופת הביטוח",
        url: "",
      },
    ],
  },
];

const FormsDownloads = () => {
  return (
    <div className="min-h-screen font-heebo bg-slate-50" dir="rtl">
      <Header />
      <div className="h-16 md:h-20" />

      <main className="container-wide py-8 md:py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8 shadow-sm">
          <div className="text-right">
            <p className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              טפסים להורדה
            </p>
            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold text-[#0b4e86]">מרכז הטפסים</h1>
            <p className="mt-2 text-sm md:text-base text-slate-600">
              כל הטפסים מסודרים לפי קטגוריות לנוחות מקסימלית. אפשר להוריד ולמלא.
            </p>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {FORM_CATEGORIES.map((category) => (
            <section
              key={category.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm"
            >
              <h2 className="text-lg md:text-xl font-bold text-[#0b4e86] text-right">{category.title}</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {category.forms.map((form, index) => {
                  const hasUrl = Boolean(form.url && form.url.trim());
                  return (
                    <article
                      key={`${category.id}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          className="h-9 w-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500"
                          aria-hidden="true"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <div className="text-right flex-1">
                          <h3 className="text-sm md:text-base font-bold text-slate-800">{form.title}</h3>
                          <p className="mt-1 text-xs md:text-sm text-slate-600">{form.description}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        {hasUrl ? (
                          <a
                            href={form.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-[#0b4e86] px-3 py-2 text-xs md:text-sm font-semibold text-white hover:bg-[#0a3f6c] transition"
                          >
                            <Download className="h-4 w-4" />
                            הורד טופס
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm font-semibold text-slate-500">
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
  );
};

export default FormsDownloads;
