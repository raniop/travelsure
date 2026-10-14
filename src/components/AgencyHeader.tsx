import { Link } from "react-router-dom";
import logo from "@/assets/ophir-logo.png";

// Where the agency landing page lives (switch to "/" once it becomes the homepage)
export const AGENCY_LANDING_PATH = "/mockup-v2";

const sections = [
  ["get", "מה מקבלים"],
  ["how", "איך זה עובד"],
  ["services", "ביטוחים נוספים"],
  ["faq", "שאלות"],
];

interface AgencyHeaderProps {
  /** True on the landing page itself: links scroll in-page and the quote CTA jumps to the trip card. */
  onLanding?: boolean;
}

/** White rounded top bar from the agency design; sits on a navy (#000144) background. */
const AgencyHeader = ({ onLanding = false }: AgencyHeaderProps) => {
  const base = onLanding ? "" : AGENCY_LANDING_PATH;

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[20px] bg-white py-2 pl-2 pr-3 md:gap-x-7 md:py-2.5 md:pl-2.5 md:pr-5 font-rubik text-[#000144]">
      <a href={`${base}#top`} aria-label="אופיר ושות׳ סוכנות לביטוח, לדף הבית" className="flex min-h-[52px] items-center gap-2.5 text-[#000144] md:gap-3 no-underline">
        <img src={logo} alt="" className="block h-10 w-auto md:h-12" />
        <span className="flex flex-col leading-[1.1]">
          <span className="text-[20px] font-extrabold md:text-[23px]">אופיר ושות׳</span>
          <span className="text-sm font-semibold text-[#46557A]">סוכנות לביטוח</span>
        </span>
      </a>
      <nav aria-label="ניווט ראשי" className="hidden flex-[1_1_280px] flex-wrap justify-center gap-x-7 md:flex">
        {sections.map(([id, label]) => (
          <a key={id} href={`${base}#${id}`} className="flex min-h-[44px] items-center text-[17px] font-semibold text-[#000144] no-underline hover:text-[#00A247]">
            {label}
          </a>
        ))}
      </nav>
      <div className="ms-auto flex flex-wrap items-center gap-x-[18px] gap-y-2 md:ms-0">
        <a href="tel:0732721111" dir="ltr" className="hidden min-h-[44px] md:flex items-center text-[17px] font-bold text-[#000144] no-underline">
          073-2721111
        </a>
        <Link to="/claim" className="box-border inline-flex min-h-[46px] items-center justify-center rounded-[14px] border-2 border-[#000144] px-3 text-[15px] font-bold md:px-[18px] md:text-[17px] text-[#000144] no-underline">
          הגשת תביעה
        </Link>
        {onLanding && (
          <a href="#top" className="hidden min-h-[46px] md:inline-flex items-center justify-center rounded-[14px] bg-[#00A247] px-[22px] text-[17px] font-bold text-[#000144] no-underline">
            להצעת מחיר
          </a>
        )}
      </div>
    </header>
  );
};

export default AgencyHeader;
