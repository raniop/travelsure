import { useState } from "react";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

const Purchase = () => {
  const { t, isRTL } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir="rtl">
      <Header />
      <div className="h-16 md:h-20" />
      <div className="flex-1 relative">
        {/* Loading Animation */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">
              {isRTL ? "טוען..." : "Loading..."}
            </p>
          </div>
        )}
        
        <iframe
          src="https://www.ophirbit.co.il/aff/?aid=468"
          className="w-full h-full min-h-[calc(100vh-80px)]"
          title={t("purchase.title")}
          frameBorder="0"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default Purchase;
