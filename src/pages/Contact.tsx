import { useEffect } from "react";
import { Clock, Mail, MessageCircle, Phone, Users } from "lucide-react";
import AgencyPage from "@/components/AgencyPage";
import { agencyBody, agencyCard, agencyCardWhite, agencyH3, AgencySection } from "@/components/AgencyUi";
import ContactForm from "@/components/ContactForm";
import { useLanguage } from "@/contexts/LanguageContext";

const directLink =
  "flex min-h-[48px] items-center gap-3 text-[18px] font-bold text-[#000144] no-underline hover:underline";

const Contact = () => {
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hours = [
    { icon: Clock, title: t("contact.inIsrael"), lines: [t("contact.inIsraelHours"), t("contact.inIsraelFriday")] },
    { icon: Users, title: t("contact.abroad"), lines: [t("contact.abroadHours"), t("contact.abroadLang")] },
  ];

  return (
    <AgencyPage title={t("contact.title")} subtitle={t("contact.description")}>
      <AgencySection>
        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* Contact form */}
          <div className={`${agencyCard} flex flex-col gap-6 md:p-9`}>
            <h2 className={agencyH3}>{t("contact.formTitle")}</h2>
            <ContactForm />
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-5">
            <h2 className={agencyH3}>{t("contact.label")}</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-5">
              {hours.map(({ icon: Icon, title, lines }) => (
                <div key={title} className={`${agencyCard} flex min-h-[200px] !flex-col justify-between gap-6`}>
                  <Icon aria-hidden="true" className="h-12 w-12" strokeWidth={1.8} />
                  <div className="flex flex-col gap-1">
                    <h3 className="m-0 text-[28px] font-black leading-[1.05]">{title}</h3>
                    {lines.map((line) => (
                      <p key={line} className={`${agencyBody} text-[17px]`}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={`${agencyCardWhite} flex flex-col gap-2`}>
              <p className={agencyBody}>{t("contact.directContact")}</p>
              <a href="tel:+972732721111" className={directLink}>
                <Phone aria-hidden="true" className="h-6 w-6 flex-shrink-0" strokeWidth={1.8} />
                <span dir="ltr">073-2721111</span>
              </a>
              <a href="https://wa.me/+972523333603" className={directLink}>
                <MessageCircle aria-hidden="true" className="h-6 w-6 flex-shrink-0" strokeWidth={1.8} />
                <span>
                  <span dir="ltr">052-3333603</span> {t("contact.whatsapp")}
                </span>
              </a>
              <a href="mailto:ophir@ophirins.co.il" className={`${directLink} break-all`}>
                <Mail aria-hidden="true" className="h-6 w-6 flex-shrink-0" strokeWidth={1.8} />
                <span>ophir@ophirins.co.il</span>
              </a>
            </div>
          </div>
        </div>
      </AgencySection>
    </AgencyPage>
  );
};

export default Contact;
