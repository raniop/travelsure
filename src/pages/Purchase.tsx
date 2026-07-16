import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";

const Purchase = () => {
  const { t, isRTL } = useLanguage();
  
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir="rtl">
      <Header />
      <div className="h-16 md:h-20" />
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background px-4 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            {isRTL ? "המעבר מתבצע בטאב חדש." : "Opening in a new tab."}
          </p>
          <a
            href="https://www.ophirbit.co.il/aff/?aid=468"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-white font-semibold shadow hover:shadow-md transition"
          >
            {isRTL ? "פתח טאב חדש" : "Open new tab"}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Purchase;
