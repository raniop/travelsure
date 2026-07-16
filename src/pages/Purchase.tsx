import { useEffect } from "react";

const PURCHASE_URL = "https://ophir.travelsure.co.il/buyinsnew?aff=709";

const Purchase = () => {
  useEffect(() => {
    window.location.replace(PURCHASE_URL);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <p className="text-muted-foreground">מעביר לרכישת ביטוח...</p>
    </div>
  );
};

export default Purchase;
