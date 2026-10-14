import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AgencyHeader from "@/components/AgencyHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

// Served by this same app, so a Lovable publish updates the purchase form too
const PURCHASE_PATH = "/buyinsnew";
const DEFAULT_AFF = "709";

// Trip details from the landing-page form that the purchase flow understands
const FORWARDED_PARAMS = ["from", "to", "pax"];

const buildPurchaseUrl = (search: string) => {
  const incoming = new URLSearchParams(search);
  // theme=agency: render the form in the agency look (navy/green, no own top bar)
  const params = new URLSearchParams({ aff: DEFAULT_AFF, theme: "agency" });
  FORWARDED_PARAMS.forEach((key) => {
    const value = incoming.get(key);
    if (value) params.set(key, value);
  });
  return `${PURCHASE_PATH}?${params}`;
};

// "2026-11-02" -> "2.11"
const shortDate = (iso: string) => {
  const [, month, day] = iso.split("-");
  return month && day ? `${Number(day)}.${Number(month)}` : "";
};

const Purchase = () => {
  const { t, isRTL } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const purchaseUrl = useMemo(() => buildPurchaseUrl(location.search), [location.search]);

  const trip = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const from = shortDate(params.get("from") || "");
    const to = shortDate(params.get("to") || "");
    const pax = parseInt(params.get("pax") || "", 10);
    return {
      dates: from && to ? `יציאה ${from} · חזרה ${to}` : "",
      travelers: Number.isFinite(pax) && pax > 0 ? (pax === 1 ? "נוסע אחד" : `${pax} נוסעים`) : "",
    };
  }, [location.search]);

  return (
    <div className="flex h-screen flex-col bg-[#F3F5F8] font-rubik text-[#000144]" dir="rtl">
      <section className="relative z-20 shrink-0 overflow-x-clip bg-[#000144] text-white">
        <div aria-hidden="true" className="absolute left-[-120px] top-[-160px] h-[360px] w-[360px] rounded-full bg-[#0C1060]" />
        <div className="relative mx-auto max-w-[1200px] px-6 pt-5">
          <AgencyHeader />
        </div>
        <div className="relative mx-auto flex max-w-[1200px] flex-wrap items-end gap-x-8 gap-y-3 px-6 pb-7 pt-7">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-black leading-[1.02] tracking-[-0.01em]">
              רכישת ביטוח נסיעות
            </h1>
            <p className="m-0 text-[18px] font-medium text-[#E3EAFF]">נשמח להכיר את הנוסעים שנבטח הפעם</p>
          </div>
          {(trip.dates || trip.travelers) && (
            <ul aria-label="פרטי הנסיעה" className="m-0 flex list-none flex-wrap gap-2 p-0">
              {[trip.dates, trip.travelers].filter(Boolean).map((item) => (
                <li key={item} className="rounded-full border-2 border-[#00A247] px-4 py-1.5 text-[16px] font-bold text-white">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F3F5F8]">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#00A247]" />
            <p className="text-lg text-[#33405F]">{isRTL ? "טוען..." : "Loading..."}</p>
          </div>
        )}

        <iframe
          src={purchaseUrl}
          title={t("purchase.title")}
          className="absolute inset-0 h-full w-full border-0"
          allow="payment; clipboard-write"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default Purchase;
