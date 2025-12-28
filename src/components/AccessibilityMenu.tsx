import { useState } from "react";
import { Accessibility, Plus, Minus, Moon, Sun, Type, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const increaseFontSize = () => {
    if (fontSize < 150) {
      const newSize = fontSize + 10;
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}%`;
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 80) {
      const newSize = fontSize - 10;
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}%`;
    }
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle("high-contrast");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const resetAll = () => {
    setFontSize(100);
    setHighContrast(false);
    setDarkMode(false);
    document.documentElement.style.fontSize = "100%";
    document.documentElement.classList.remove("high-contrast", "dark");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Menu Options */}
      <div
        className={`flex flex-col gap-2 transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Reset */}
        <button
          onClick={resetAll}
          className="w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
          title="איפוס"
          aria-label="איפוס הגדרות נגישות"
        >
          <RotateCcw className="w-5 h-5 text-foreground" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className={`w-12 h-12 rounded-full border shadow-lg flex items-center justify-center transition-colors ${
            darkMode ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
          }`}
          title={darkMode ? "מצב בהיר" : "מצב כהה"}
          aria-label={darkMode ? "עבור למצב בהיר" : "עבור למצב כהה"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-foreground" />}
        </button>

        {/* High Contrast Toggle */}
        <button
          onClick={toggleHighContrast}
          className={`w-12 h-12 rounded-full border shadow-lg flex items-center justify-center transition-colors ${
            highContrast ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"
          }`}
          title="ניגודיות גבוהה"
          aria-label="החלף מצב ניגודיות גבוהה"
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Font Size Controls */}
        <div className="flex flex-col gap-1">
          <button
            onClick={increaseFontSize}
            disabled={fontSize >= 150}
            className="w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="הגדל טקסט"
            aria-label="הגדל גודל טקסט"
          >
            <Plus className="w-5 h-5 text-foreground" />
          </button>
          <span className="text-xs text-center text-muted-foreground font-medium">
            {fontSize}%
          </span>
          <button
            onClick={decreaseFontSize}
            disabled={fontSize <= 80}
            className="w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="הקטן טקסט"
            aria-label="הקטן גודל טקסט"
          >
            <Minus className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-destructive text-destructive-foreground rotate-0"
            : "bg-primary text-primary-foreground hover:scale-110"
        }`}
        aria-label={isOpen ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Accessibility className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default AccessibilityMenu;
