import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Plane, Car, Home, Building2 } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";
import { AgencyContactStrip, AgencySection, ArrowIcon, agencyBtnPrimary, agencyCard, agencyH2 } from "@/components/AgencyUi";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const services = [
    { icon: Plane, title: t("services.travel.title"), description: t("services.travel.desc"), to: "/services/travel" },
    { icon: Car, title: t("services.car.title"), description: t("services.car.desc"), to: "/services/car" },
    { icon: Home, title: t("services.home.title"), description: t("services.home.desc"), to: "/services/home" },
    { icon: Building2, title: t("services.business.title"), description: t("services.business.desc"), to: "/services/business" },
  ];

  return (
    <AgencyPage
      title={t("services.title")}
      subtitle={t("services.description")}
      bandContent={
        <Link to="/purchase" className={agencyBtnPrimary}>
          <span>{t("hero.cta")}</span>
          <ArrowIcon />
        </Link>
      }
    >
      <AgencySection>
        <h2 className={agencyH2}>{t("services.label")}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(250px,100%),1fr))] gap-5">
          {services.map(({ icon: Icon, title, description, to }) => (
            <div key={title} className={`${agencyCard} flex min-h-[260px] !flex-col justify-between gap-6`}>
              <Icon aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />
              <div className="flex flex-col gap-2">
                <h3 className="m-0 text-[28px] font-black leading-[1.05]">{title}</h3>
                <p className="m-0 text-[17px] font-medium text-[#33405F]">{description}</p>
                <Link
                  to={to}
                  className="group mt-1 inline-flex min-h-[44px] items-center gap-2 self-start text-[18px] font-extrabold text-[#000144] underline-offset-4 hover:underline"
                >
                  <span>{t("services.learnMore")}</span>
                  <span className="transition-transform group-hover:-translate-x-1">
                    <ArrowIcon size={18} />
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </AgencySection>

      <AgencyContactStrip />
    </AgencyPage>
  );
};

export default Services;
