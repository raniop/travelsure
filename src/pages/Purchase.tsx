import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import CookieBanner from "@/components/CookieBanner";
import logo from "@/assets/logo.avif";

const Purchase = () => {
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm py-4">
        <div className="container-wide">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="TravelSure לוגו" className="h-10 w-auto" />
            </Link>
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                חזרה לדף הבית
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Embedded Purchase Page */}
      <div className="flex-1">
        <iframe
          src="https://www.ophirbit.co.il/aff/?aid=468"
          className="w-full h-full min-h-[calc(100vh-80px)]"
          title="רכישת ביטוח נסיעות לחו״ל"
          frameBorder="0"
        />
      </div>
      <CookieBanner />
    </div>
  );
};

export default Purchase;
