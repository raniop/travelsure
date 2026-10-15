import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/ophir-logo.png";

// Where the agency landing page lives
export const AGENCY_LANDING_PATH = "/";

type NavLink = { to: string; label: string };
type NavGroup = { id: string; label: string; items: NavLink[] };

interface AgencyHeaderProps {
  /** True on the landing page itself: the quote CTA jumps to the trip card instead of /purchase. */
  onLanding?: boolean;
  /** Logo only (no navigation, buttons or home link), for partner links that should stay in the flow. */
  minimal?: boolean;
}

const linkClass =
  "flex min-h-[44px] items-center whitespace-nowrap text-[16px] font-semibold text-[#000144] no-underline hover:text-[#008C3D] xl:text-[17px]";

/** White rounded top bar from the agency design; sits on a navy (#000144) background. */
const AgencyHeader = ({ onLanding = false, minimal = false }: AgencyHeaderProps) => {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const groups: NavGroup[] = [
    {
      id: "services",
      label: t("nav.services"),
      items: [
        { to: "/services/travel", label: t("services.travel.title") },
        { to: "/services/car", label: t("services.car.title") },
        { to: "/services/home", label: t("services.home.title") },
        { to: "/services/business", label: t("services.business.title") },
        { to: "/services", label: "כל השירותים" },
      ],
    },
    {
      id: "self-service",
      label: t("nav.selfService"),
      items: [
        { to: "/claim", label: t("nav.selfService.claim") },
        { to: "/foreigners", label: t("nav.selfService.foreigners") },
        { to: "/insurance-proposal", label: t("nav.selfService.proposal") },
        { to: "/forms", label: "טפסים להורדה" },
      ],
    },
  ];
  const plainLinks: NavLink[] = [
    { to: "/about", label: t("nav.about") },
    { to: "/faq", label: t("nav.faq") },
    { to: "/contact", label: t("nav.contact") },
  ];

  // Close menus on navigation, outside click and Escape
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const ctaClass =
    "inline-flex min-h-[46px] items-center justify-center whitespace-nowrap rounded-[14px] bg-[#00A247] px-5 text-[17px] font-bold text-[#000144] no-underline";
  const quoteCta = onLanding ? (
    <a href="#top" className={ctaClass}>
      להצעת מחיר
    </a>
  ) : (
    <Link to="/purchase" className={ctaClass}>
      {t("nav.purchase")}
    </Link>
  );

  const brand = (
    <>
      <img src={logo} alt="" className="block h-10 w-auto lg:h-12" />
      <span className="flex flex-col leading-[1.1]">
        <span className="text-[20px] font-extrabold lg:text-[22px]">אופיר ושות׳</span>
        <span className="text-sm font-semibold text-[#46557A]">סוכנות לביטוח</span>
      </span>
    </>
  );

  if (minimal) {
    return (
      <header className="relative z-30 rounded-[20px] bg-white font-rubik text-[#000144]">
        <div className="flex items-center py-2 pl-2 pr-3 lg:py-2.5 lg:pl-2.5 lg:pr-5">
          <div className="flex min-h-[52px] shrink-0 items-center gap-2.5 lg:gap-3">{brand}</div>
        </div>
      </header>
    );
  }

  return (
    <header ref={headerRef} className="relative z-30 rounded-[20px] bg-white font-rubik text-[#000144]">
      <div className="flex items-center gap-3 py-2 pl-2 pr-3 lg:gap-6 lg:py-2.5 lg:pl-2.5 lg:pr-5">
        <Link to={AGENCY_LANDING_PATH} aria-label="אופיר ושות׳ סוכנות לביטוח, לדף הבית" className="flex min-h-[52px] shrink-0 items-center gap-2.5 text-[#000144] no-underline lg:gap-3">
          {brand}
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="ניווט ראשי" className="hidden flex-1 items-center justify-center gap-x-5 lg:flex xl:gap-x-6">
          <Link to={AGENCY_LANDING_PATH} className={linkClass} aria-current={pathname === "/" ? "page" : undefined}>
            {t("nav.home")}
          </Link>
          {groups.map((group) => {
            const open = openGroup === group.id;
            return (
              <div key={group.id} className="relative">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`menu-${group.id}`}
                  onClick={() => setOpenGroup(open ? null : group.id)}
                  className={`${linkClass} cursor-pointer gap-1 border-0 bg-transparent p-0 font-[inherit]`}
                >
                  {group.label}
                  <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.4} />
                </button>
                {open && (
                  <ul
                    id={`menu-${group.id}`}
                    className="absolute right-0 top-full z-40 m-0 mt-2 min-w-[240px] list-none rounded-[18px] border-2 border-[#E3E7EE] bg-white p-2 shadow-[0_18px_40px_-16px_rgba(7,20,51,0.35)]"
                  >
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          aria-current={pathname.toLowerCase() === item.to ? "page" : undefined}
                          className="flex min-h-[44px] items-center rounded-[12px] px-3 text-[16px] font-semibold text-[#000144] no-underline hover:bg-[#F3F5F8]"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {plainLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass} aria-current={pathname === link.to ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2.5 lg:ms-0 xl:gap-3.5">
          <Link to="/claim" className="box-border hidden min-h-[46px] items-center justify-center whitespace-nowrap rounded-[14px] border-2 border-[#000144] px-4 text-[16px] font-bold text-[#000144] no-underline sm:inline-flex lg:hidden xl:inline-flex xl:text-[17px]">
            הגשת תביעה
          </Link>
          <span className="hidden lg:inline-flex">{quoteCta}</span>
          <button
            type="button"
            aria-label={mobileOpen ? "סגירת התפריט" : t("nav.openMenu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[14px] border-0 bg-[#000144] text-white lg:hidden"
          >
            {mobileOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav id="mobile-menu" aria-label="ניווט ראשי" className="border-t-2 border-[#E3E7EE] px-4 pb-4 pt-2 lg:hidden">
          <Link to={AGENCY_LANDING_PATH} className="flex min-h-[48px] items-center text-[18px] font-bold text-[#000144] no-underline">
            {t("nav.home")}
          </Link>
          {groups.map((group) => (
            <div key={group.id} className="border-t border-[#E3E7EE] py-2">
              <p className="m-0 pb-1 pt-2 text-sm font-semibold text-[#46557A]">{group.label}</p>
              <ul className="m-0 list-none p-0">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="flex min-h-[46px] items-center text-[17px] font-semibold text-[#000144] no-underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="border-t border-[#E3E7EE] py-2">
            {plainLinks.map((link) => (
              <Link key={link.to} to={link.to} className="flex min-h-[46px] items-center text-[17px] font-semibold text-[#000144] no-underline">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5 border-t border-[#E3E7EE] pt-4">
            {quoteCta}
            <a href="tel:0732721111" className="box-border inline-flex min-h-[46px] items-center justify-center rounded-[14px] border-2 border-[#000144] px-4 text-[17px] font-bold text-[#000144] no-underline">
              <span dir="ltr">073-2721111</span>
            </a>
          </div>
        </nav>
      )}
    </header>
  );
};

export default AgencyHeader;
