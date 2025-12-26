import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.avif";

const Purchase = () => {
  return (
    <div className="min-h-screen font-heebo flex flex-col" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="TravelSure לוגו" className="h-10 md:h-12 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/#services" className="text-foreground hover:text-primary transition-colors font-medium">שירותים</Link>
              <Link to="/#about" className="text-foreground hover:text-primary transition-colors font-medium">אודות</Link>
              <Link to="/faq" className="text-foreground hover:text-primary transition-colors font-medium">שאלות נפוצות</Link>
              <Link to="/#contact" className="text-foreground hover:text-primary transition-colors font-medium">צור קשר</Link>
            </nav>

            {/* CTA Button */}
            <Link to="/purchase">
              <Button variant="cta" size="default" className="hidden sm:flex">
                <Plane className="w-4 h-4" />
                רכישת ביטוח נסיעות
              </Button>
            </Link>
          </div>
        </div>
      </header>

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
