import { useState, useEffect } from "react";

const ScrollIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      setScrollProgress(progress);
      setIsVisible(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-2">
      {/* Track */}
      <div className="relative w-1.5 h-32 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-border/30">
        {/* Progress fill */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/60 rounded-full transition-all duration-150 ease-out"
          style={{ height: `${scrollProgress}%` }}
        />
        {/* Glow effect */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-primary/40 blur-sm rounded-full transition-all duration-150 ease-out"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>
      
      {/* Percentage indicator */}
      <div className="text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full border border-border/30 shadow-sm">
        {Math.round(scrollProgress)}%
      </div>
    </div>
  );
};

export default ScrollIndicator;
