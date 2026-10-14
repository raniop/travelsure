import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

  // Extra room on the right (desktop) / bottom (phone) keeps the floating accessibility button uncovered

  return (
    <div
      role="region"
      aria-label="הודעה על שימוש בעוגיות"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[88px] font-rubik animate-in slide-in-from-bottom duration-500 md:pb-4 md:pr-[96px]"
      dir="rtl"
    >
      <div className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-4 rounded-[24px] border-2 border-[#E3E7EE] bg-white py-5 pl-16 pr-5 text-[#000144] shadow-[0_24px_48px_-20px_rgba(7,20,51,0.45)] md:flex-row md:items-center md:gap-8 md:py-6 md:pr-7">
        <button
          type="button"
          onClick={handleClose}
          className="absolute left-3 top-3 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-[12px] border-0 bg-transparent text-[#46557A] transition-colors hover:bg-[#F3F5F8] hover:text-[#000144]"
          aria-label="סגור"
        >
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <h3 className="m-0 text-[19px] font-black leading-[1.2]">אנחנו משתמשים בעוגיות</h3>
          <p className="m-0 text-[16px] font-medium leading-[1.55] text-[#33405F]">
            אתר זה משתמש בעוגיות (Cookies) לשיפור חווית הגלישה שלך.
            המשך שימושך באתר מהווה הסכמה לשימוש זה בהתאם וכמפורט ב
            <Link to="/privacy-policy" className="ms-1 font-bold text-[#000144] underline underline-offset-2 hover:text-[#008C3D]">
              מדיניות הפרטיות
            </Link>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex min-h-[48px] w-full shrink-0 cursor-pointer items-center justify-center rounded-[14px] border-0 bg-[#00A247] px-7 font-[inherit] text-[17px] font-extrabold text-[#000144] transition-colors hover:bg-[#008C3D] md:w-auto"
        >
          מאשר/ת
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
