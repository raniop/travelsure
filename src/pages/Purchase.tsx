import Header from "@/components/Header";

const PURCHASE_URL = "https://ophir.travelsure.co.il/buyinsnew?aff=709";

const Purchase = () => {
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir="rtl">
      <Header />
      <div className="h-16 md:h-20" />
      <div className="flex-1 relative">
        <iframe
          src={PURCHASE_URL}
          title="רכישת ביטוח נסיעות"
          className="absolute inset-0 w-full h-full border-0"
          allow="payment; clipboard-write"
        />
      </div>
    </div>
  );
};

export default Purchase;
