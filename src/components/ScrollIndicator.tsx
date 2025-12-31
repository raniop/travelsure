import { useState, useEffect } from "react";

const ScrollIndicator = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Define section IDs that exist in the page
  const sections = [
    { id: "hero", label: "בית" },
    { id: "services", label: "שירותים" },
    { id: "about", label: "אודות" },
    { id: "contact", label: "צור קשר" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsVisible(scrollTop > 100);

      // Find which section is currently in view
      let currentSection = 0;
      
      sections.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const offset = window.innerHeight / 3;
          
          if (rect.top <= offset && rect.bottom >= offset) {
            currentSection = index;
          }
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center">
      {/* Container with glass effect */}
      <div className="bg-background/60 backdrop-blur-md border border-border/40 rounded-full py-4 px-2 shadow-lg">
        <div className="flex flex-col items-center gap-3">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="group relative flex items-center justify-center"
              aria-label={section.label}
            >
              {/* Dot */}
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeSection === index
                    ? "bg-primary scale-125 shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 hover:scale-110"
                }`}
              />
              
              {/* Tooltip on hover */}
              <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-foreground text-background text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
                  {section.label}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollIndicator;
