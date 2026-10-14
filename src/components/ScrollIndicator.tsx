import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// Section ids on the homepage (src/pages/MockupV2.tsx)
const sections = [
  { id: "top", label: "ראשי" },
  { id: "get", label: "מה מקבלים" },
  { id: "how", label: "איך זה עובד" },
  { id: "services", label: "ביטוחים נוספים" },
  { id: "faq", label: "שאלות" },
];

const ScrollIndicator = () => {
  const location = useLocation();
  // הצג רק בדף הראשי
  const isHome = location.pathname === "/" || location.pathname === "/mockup-v2";
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (!isHome) return;

    const handleScroll = () => {
      // Active = the last section whose top has passed a third of the viewport
      const line = window.innerHeight / 3;
      let current = 0;
      sections.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= line) {
          current = index;
        }
      });
      // At the very bottom the last section may never reach the line
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections.length - 1;
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isHome]);

  if (!isHome) return null;

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    // xl only: below that the 1200px content column reaches the screen edge and the dots would cover it
    <nav aria-label="ניווט בין חלקי העמוד" className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 xl:flex">
      <div className="flex flex-col items-center gap-1 rounded-full border-2 border-[#E3E7EE] bg-white/90 px-1 py-2 shadow-[0_10px_30px_-12px_rgba(7,20,51,0.35)]">
        {sections.map((section, index) => {
          const active = activeSection === index;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              aria-label={section.label}
              aria-current={active ? "true" : undefined}
              className="group relative flex h-7 w-7 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`block rounded-full transition-all duration-300 ${
                  active ? "h-3.5 w-3.5 bg-[#00A247] ring-2 ring-[#000144]" : "h-2.5 w-2.5 bg-[#000144]/30 group-hover:bg-[#000144]/60"
                }`}
              />
              <span className="pointer-events-none absolute right-9 whitespace-nowrap rounded-[10px] bg-[#000144] px-2.5 py-1 font-rubik text-[13px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                {section.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ScrollIndicator;
