import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Phone } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";
import { agencyBody, agencyBtnOutline, agencyBtnPrimary, agencyH2, AgencySection, ArrowIcon } from "@/components/AgencyUi";
import { useLanguage } from "@/contexts/LanguageContext";

const faqNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const FAQ = () => {
  const { t } = useLanguage();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AgencyPage title={t("faq.title")} subtitle={t("faq.subtitle")}>
      <AgencySection>
        <div className="mx-auto flex w-full max-w-[860px] flex-col gap-3">
          {faqNumbers.map((n) => (
            <details key={n} className="group rounded-[20px] bg-[#F3F5F8] px-6 py-1">
              <summary className="flex min-h-[64px] cursor-pointer list-none !flex-row items-center justify-between gap-4 py-3 text-[20px] font-bold leading-[1.3] md:text-[22px] [&::-webkit-details-marker]:hidden">
                <span>{t(`faq.q${n}`)}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="h-6 w-6 flex-shrink-0 transition-transform group-open:rotate-180"
                  strokeWidth={2.2}
                />
              </summary>
              <p className="mb-5 mt-0 leading-[1.6] text-[#33405F]">{t(`faq.a${n}`)}</p>
            </details>
          ))}
        </div>
      </AgencySection>

      <section aria-labelledby="faq-more" className="px-6 pb-[72px]">
        <div className="mx-auto box-border flex max-w-[1200px] !flex-row flex-wrap items-center justify-between gap-x-12 gap-y-7 rounded-[36px] bg-[#F3F5F8] p-8 md:p-12">
          <div className="flex max-w-[620px] flex-col gap-3">
            <h2 id="faq-more" className={agencyH2}>
              {t("faq.notFound")}
            </h2>
            <p className={`${agencyBody} text-[20px]`}>{t("faq.contactUs")}</p>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <Link to="/purchase" className={agencyBtnPrimary}>
              <span>{t("nav.purchase")}</span>
              <ArrowIcon />
            </Link>
            <a href="tel:+972732721111" className={agencyBtnOutline}>
              <Phone aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              <span dir="ltr">073-2721111</span>
            </a>
          </div>
        </div>
      </section>
    </AgencyPage>
  );
};

export default FAQ;
