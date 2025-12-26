import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const Purchase = () => {
  const { t, isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="h-16 md:h-20" />
      <div className="flex-1">
        <iframe
          src="https://www.ophirbit.co.il/aff/?aid=468"
          className="w-full h-full min-h-[calc(100vh-80px)]"
          title={t("purchase.title")}
          frameBorder="0"
        />
      </div>
    </div>
  );
};

export default Purchase;
