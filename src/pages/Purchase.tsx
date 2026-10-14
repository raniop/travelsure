import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

// Served by this same app, so a Lovable publish updates the purchase form too
const PURCHASE_PATH = "/buyinsnew";
const DEFAULT_AFF = "709";

// Trip details from the landing-page form that the purchase flow understands
const FORWARDED_PARAMS = ["from", "to", "pax"];

const buildPurchaseUrl = (search: string) => {
  const incoming = new URLSearchParams(search);
  const params = new URLSearchParams({ aff: DEFAULT_AFF });
  FORWARDED_PARAMS.forEach((key) => {
    const value = incoming.get(key);
    if (value) params.set(key, value);
  });
  return `${PURCHASE_PATH}?${params}`;
};

const Purchase = () => {
  const { t, isRTL } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const purchaseUrl = useMemo(() => buildPurchaseUrl(location.search), [location.search]);

  return (
    <div className="min-h-screen font-heebo flex flex-col" dir="rtl">
      <Header />
      <div className="h-16 md:h-20" />
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">
              {isRTL ? "טוען..." : "Loading..."}
            </p>
          </div>
        )}

        <iframe
          src={purchaseUrl}
          title={t("purchase.title")}
          className="absolute inset-0 w-full h-full border-0"
          allow="payment; clipboard-write"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default Purchase;
