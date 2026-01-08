import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const BuyInsNew = () => {
  const { isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      <div className="h-16 md:h-20" />
      <main className="flex-1 container-wide section-padding">
        <h1 className="text-3xl font-bold text-center">
          {isRTL ? "רכישת ביטוח" : "Buy Insurance"}
        </h1>
      </main>
    </div>
  );
};

export default BuyInsNew;
