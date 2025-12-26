import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!hasAccepted) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setIsVisible(false);
  };

  const handleClose = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500"
      dir="rtl"
    >
      <div className="container-wide">
        <div 
          className="relative bg-card border border-border rounded-xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4"
          style={{ 
            background: 'linear-gradient(135deg, #134e4a 0%, #1a6b5f 100%)',
          }}
        >
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-3 left-3 text-white/60 hover:text-white transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="flex-1 text-white pr-0 md:pr-2">
            <h3 className="font-bold text-lg mb-1">🍪 אנחנו משתמשים בעוגיות</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              אתר זה משתמש בעוגיות (Cookies) לשיפור חווית הגלישה שלך. 
              המשך שימושך באתר מהווה הסכמה לשימוש זה בהתאם וכמפורט ב
              <Link 
                to="/privacy-policy" 
                className="underline hover:text-white transition-colors mx-1"
              >
                מדיניות הפרטיות
              </Link>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              onClick={handleAccept}
              className="flex-1 md:flex-none bg-white text-primary hover:bg-white/90 font-semibold"
            >
              מאשר/ת
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
