import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, FileSpreadsheet, FileText, Search } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";
import formCategories from "@/data/formCategories.json";
import {
  AgencyContactStrip,
  AgencySection,
  agencyBody,
  agencyBtnNavy,
  agencyBtnOutline,
  agencyCard,
} from "@/components/AgencyUi";

type DownloadFormItem = {
  title: string;
  url?: string;
};

type FormCategory = {
  id: string;
  title: string;
  subtitle: string;
  icon: "travel" | "workers" | "tourists";
  forms: DownloadFormItem[];
};

// Shared with the standalone ophir.travelsure.co.il/forms page (scripts/build-ophir-forms.mjs)
const FORM_CATEGORIES = formCategories as FormCategory[];

/** Languages that appear in document titles, matched by their Hebrew stem. */
const LANGUAGES = [
  "עברית",
  "אנגלית",
  "רוסית",
  "ערבית",
  "תאילנדית",
  "הינדית",
  "טיגרית",
  "סינית",
  "רומנית",
  "סינהלית",
  "אוזבקית",
  "פיליפינית",
] as const;

const languageOf = (title: string) => LANGUAGES.find((lang) => title.includes(lang));

const fileTypeOf = (url: string): "PDF" | "Excel" | null => {
  let path = url;
  try {
    path = decodeURI(url);
  } catch {
    // keep the raw URL if it is not valid percent-encoding
  }
  const clean = path.split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith(".xlsx") || clean.endsWith(".xls")) return "Excel";
  if (clean.endsWith(".pdf")) return "PDF";
  return null;
};

/** Lowercase and drop quote marks (so חו"ל matches חול) to keep search forgiving. */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/["'׳״`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const ALL = "all";

const FormsDownloads = () => {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  const normalizedQuery = normalize(query);

  const visibleCategories = useMemo(
    () =>
      FORM_CATEGORIES.filter((category) => activeCategory === ALL || category.id === activeCategory)
        .map((category) => ({
          ...category,
          forms: normalizedQuery
            ? category.forms.filter((form) => normalize(form.title).includes(normalizedQuery))
            : category.forms,
        }))
        .filter((category) => category.forms.length > 0),
    [activeCategory, normalizedQuery],
  );

  const totalForms = FORM_CATEGORIES.reduce((acc, category) => acc + category.forms.length, 0);
  const visibleCount = visibleCategories.reduce((acc, category) => acc + category.forms.length, 0);
  const isFiltered = Boolean(normalizedQuery) || activeCategory !== ALL;

  const filters = [
    { id: ALL, label: "הכל", count: totalForms },
    ...FORM_CATEGORIES.map((category) => ({ id: category.id, label: category.title, count: category.forms.length })),
  ];

  return (
    <AgencyPage
      title="מרכז הטפסים"
      subtitle="כל הטפסים והפוליסות הרשמיים של הראל, מסודרים לפי קטגוריה. לחיצה על מסמך פותחת אותו בחלון חדש."
      bandContent={
        <div className="max-w-[760px]" role="search">
          <label htmlFor={searchId} className="sr-only">
            חיפוש טופס
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#46557A]"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="חפשו טופס, פוליסה או שפה"
              autoComplete="off"
              className="box-border min-h-[64px] w-full rounded-[18px] border-2 border-transparent bg-white pl-5 pr-14 font-[inherit] text-[19px] font-semibold text-[#000144] placeholder:text-[#5A6788] focus:border-[#00A247] focus:outline-none"
            />
          </div>
        </div>
      }
    >
      <AgencySection className="!pt-10 md:!pt-12">
        <div className="flex flex-col gap-4">
          <div role="group" aria-label="סינון לפי קטגוריה" className="flex flex-wrap gap-2.5">
            {filters.map((filter) => {
              const selected = activeCategory === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveCategory(filter.id)}
                  className={`inline-flex min-h-[48px] items-center gap-2 rounded-full border-2 px-5 text-[17px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000144] ${
                    selected
                      ? "border-[#00A247] bg-[#00A247] text-[#000144]"
                      : "border-[#E3E7EE] bg-[#F3F5F8] text-[#000144] hover:border-[#D5DAE3] hover:bg-[#E9EDF3]"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[14px] font-extrabold ${selected ? "bg-white/40" : "bg-white"}`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="m-0 text-[16px] font-semibold text-[#46557A]">
            {isFiltered
              ? `נמצאו ${visibleCount} מסמכים מתוך ${totalForms}`
              : `${totalForms} מסמכים ב-${FORM_CATEGORIES.length} קטגוריות`}
          </p>
        </div>

        {visibleCategories.length === 0 ? (
          <div className={`${agencyCard} flex flex-col items-start gap-4`}>
            <h2 className="m-0 text-[28px] font-black leading-[1.1]">לא מצאנו מסמך כזה</h2>
            <p className={agencyBody}>
              נסו מילה אחרת, או בחרו &quot;הכל&quot;. ואם בכל זאת לא מוצאים, נשמח לשלוח לכם את הטופס.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://wa.me/972523333603" className={agencyBtnNavy}>
                כתבו לנו בוואטסאפ
              </a>
              <Link to="/contact" className={agencyBtnOutline}>
                צור קשר
              </Link>
            </div>
          </div>
        ) : (
          visibleCategories.map((category) => (
            <section
              key={category.id}
              id={category.id}
              aria-labelledby={`${category.id}-title`}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 id={`${category.id}-title`} className="m-0 text-[clamp(30px,3.4vw,44px)] font-black leading-[1.05]">
                    {category.title}
                  </h2>
                  <span className="text-[17px] font-bold text-[#46557A]">{category.forms.length} מסמכים</span>
                </div>
                <p className={agencyBody}>{category.subtitle}</p>
              </div>

              <ul className="m-0 list-none divide-y-2 divide-[#E3E7EE] overflow-hidden rounded-[28px] border-2 border-[#E3E7EE] bg-white p-0">
                {category.forms.map((form) => {
                  const url = form.url?.trim();
                  const fileType = url ? fileTypeOf(url) : null;
                  const language = languageOf(form.title);
                  const Icon = fileType === "Excel" ? FileSpreadsheet : FileText;

                  const content = (
                    <>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#F3F5F8] text-[#000144]">
                        <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
                        <span className="min-w-0 break-words text-[17px] font-bold leading-[1.35] md:flex-1 md:text-[18px]">
                          {form.title}
                        </span>
                        <span className="flex shrink-0 flex-wrap items-center gap-2">
                          {language && (
                            <span className="rounded-full bg-[#E6ECFA] px-2.5 py-0.5 text-[14px] font-bold text-[#000144]">
                              {language}
                            </span>
                          )}
                          {url ? (
                            fileType && (
                              <span className="rounded-full border border-[#D5DAE3] px-2.5 py-0.5 text-[14px] font-bold text-[#46557A]">
                                {fileType}
                              </span>
                            )
                          ) : (
                            <span className="text-[14px] font-bold text-[#46557A]">יתווסף בקרוב</span>
                          )}
                        </span>
                      </span>
                      {url && <ExternalLink aria-hidden="true" className="h-5 w-5 shrink-0 text-[#46557A]" />}
                    </>
                  );

                  return (
                    <li key={`${category.id}-${form.title}`}>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-[64px] items-center gap-4 px-4 py-3 text-[#000144] no-underline transition-colors hover:bg-[#F3F5F8] focus-visible:bg-[#F3F5F8] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#000144] md:px-6"
                        >
                          {content}
                          <span className="sr-only">(נפתח בחלון חדש)</span>
                        </a>
                      ) : (
                        <div className="flex min-h-[64px] items-center gap-4 px-4 py-3 text-[#46557A] md:px-6">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </AgencySection>

      <AgencyContactStrip
        title={
          <>
            לא מוצאים
            <br />
            את הטופס?
          </>
        }
      />
    </AgencyPage>
  );
};

export default FormsDownloads;
