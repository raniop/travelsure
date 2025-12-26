import Header from "@/components/Header";

const Purchase = () => {
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir="rtl">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />

      {/* Embedded Purchase Page */}
      <div className="flex-1">
        <iframe
          src="https://www.ophirbit.co.il/aff/?aid=468"
          className="w-full h-full min-h-[calc(100vh-80px)]"
          title="רכישת ביטוח נסיעות לחו״ל"
          frameBorder="0"
        />
      </div>
    </div>
  );
};

export default Purchase;
