import { useState } from "react";
import { Smartphone, Shield, DollarSign, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import AgencyHeader from "@/components/AgencyHeader";
import AgencyFooter from "@/components/AgencyFooter";
import { AgencySection, agencyBtnPrimary, agencyCard, agencyH2 } from "@/components/AgencyUi";
import CookieBanner from "@/components/CookieBanner";
import VerifyIdentityModal from "@/components/VerifyIdentityModal";
import { useLanguage } from "@/contexts/LanguageContext";

const TravelPolicy = () => {
  const { isRTL, language } = useLanguage();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white font-rubik text-[18px] leading-[1.45] text-[#000144]" dir="rtl">
      {/* Navy band: shared header + hero */}
      <section className="relative overflow-hidden bg-[#000144] text-white">
        <div aria-hidden="true" className="absolute left-[-120px] top-[-160px] h-[380px] w-[380px] rounded-full bg-[#0C1060]" />
        <div className="relative mx-auto max-w-[1200px] px-6 pt-5">
          <AgencyHeader />
        </div>
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-3 px-6 pb-12 pt-12 md:pb-16 md:pt-14">
          <p className="m-0 text-[18px] font-bold text-[#00A247]">
            ביטוח נסיעות לחו״ל
          </p>

          {/* Main Title */}
          <h1 className="m-0 text-[clamp(38px,5.6vw,80px)] font-black leading-[0.98] tracking-[-0.02em]">
            הגעת לאופיר
          </h1>

          {/* Subtitle */}
          <p className="m-0 max-w-[760px] text-[clamp(18px,1.6vw,22px)] font-medium text-[#E3EAFF]">
            המקום הכי בריא לרכישת ביטוח נסיעות לחו״ל.
          </p>

          {/* CTA Buttons */}
          <div className="mt-4 flex flex-col gap-3.5 sm:flex-row">
            <Link to="/buyinsnew" className="block w-full sm:w-auto">
              <button className={`${agencyBtnPrimary} w-full sm:min-w-[240px]`}>
                לרכישה בפעם הראשונה
              </button>
            </Link>

            <button
              onClick={() => setShowVerifyModal(true)}
              className="box-border inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-[18px] border-[3px] border-white px-7 text-[19px] font-extrabold text-white transition-colors hover:bg-white hover:text-[#000144] sm:w-auto sm:min-w-[240px]"
            >
              לרכישה פעם נוספת
            </button>
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* What You Get Section */}
        <AgencySection>
          <h2 className={agencyH2}>
            מה מקבלים כשרוכשים את ביטוח הנסיעות לחו״ל שלנו?
          </h2>

          {/* Feature Blocks */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1: App */}
            <div className={`${agencyCard} flex flex-col gap-5`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#000144]">
                <Smartphone className="h-7 w-7 text-[#00A247]" aria-hidden="true" />
              </div>
              <p className="m-0 text-[18px] font-medium text-[#33405F]">
                אפליקציה שמלווה אותך בחו״ל לכל מקרה שלא יקרה
              </p>
            </div>

            {/* Feature 2: Continued Medical Treatment */}
            <div className={`${agencyCard} flex flex-col gap-5`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#000144]">
                <Shield className="h-7 w-7 text-[#00A247]" aria-hidden="true" />
              </div>
              <p className="m-0 text-[18px] font-medium text-[#33405F]">
                <span className="font-black text-[#000144]">בלעדי לאופיר.</span> המשך טיפול רפואי בארץ
              </p>
            </div>

            {/* Feature 3: Luggage Coverage */}
            <div className={`${agencyCard} flex flex-col gap-5`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#000144]">
                <DollarSign className="h-7 w-7 text-[#00A247]" aria-hidden="true" />
              </div>
              <p className="m-0 text-[18px] font-medium text-[#33405F]">
                ברכישת כיסוי כבודה, תשלום עבור מזוודה שמאחרת בחו״ל
              </p>
            </div>

            {/* Feature 4: Air Doctor */}
            <div className={`${agencyCard} flex flex-col gap-5`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#000144]">
                <Heart className="h-7 w-7 text-[#00A247]" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="m-0 text-[22px] font-black text-[#000144]">
                  Air doctor
                </p>
                <p className="m-0 text-[18px] font-medium text-[#33405F]">
                  ייעוץ רפואי בחו״ל עלינו*
                </p>
              </div>
            </div>
          </div>
        </AgencySection>

        {/* Footer Section with Policy Link */}
        <section className="px-6 pb-[72px] md:pb-[88px]">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
            <p className="m-0 text-[18px] font-medium text-[#33405F]">
              וכמובן שעוד הרבה כיסויים חשובים שתוכלו למצוא כאן{" "}
              <Link to="/travel-policy" className="font-bold text-[#000144] underline underline-offset-4 hover:text-[#0C1060]">
                בחוברת הפוליסה
              </Link>
            </p>

            {/* Air Doctor Disclaimer */}
            <div className="box-border max-w-[860px] rounded-[28px] bg-[#F3F5F8] p-6">
              <p className="m-0 text-base font-medium text-[#33405F]">
                *אופיר בשיתוף עם Air Doctor מאפשרות לך לאתר רופא בסביבתך בחו״ל ולקבל ייעוץ רפואי מכוח הפוליסה, ללא תשלום מצדך וללא צורך בהגשת תביעה.
              </p>
            </div>
          </div>
        </section>
      </main>

      <AgencyFooter />

      <CookieBanner />
      <VerifyIdentityModal open={showVerifyModal} onOpenChange={setShowVerifyModal} />
    </div>
  );
};

export default TravelPolicy;
