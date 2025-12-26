import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plane, Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/logo.avif";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"he" | "en">("he");
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const navLinks = [
    { href: isHomePage ? "#services" : "/#services", label: language === "he" ? "שירותים" : "Services", isAnchor: isHomePage },
    { href: isHomePage ? "#about" : "/#about", label: language === "he" ? "אודות" : "About", isAnchor: isHomePage },
    { href: "/faq", label: language === "he" ? "שאלות נפוצות" : "FAQ", isAnchor: false },
    { href: isHomePage ? "#contact" : "/#contact", label: language === "he" ? "צור קשר" : "Contact", isAnchor: isHomePage },
  ];

  const ctaText = language === "he" ? "רכישת ביטוח נסיעות" : "Purchase Travel Insurance";

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left side - Language Selector & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <Select value={language} onValueChange={(val: "he" | "en") => setLanguage(val)}>
              <SelectTrigger className="w-[80px] h-9 text-sm">
                <Globe className="w-4 h-4 ml-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">עברית</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>

            {/* Hamburger Menu - Mobile */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{language === "he" ? "פתח תפריט" : "Open menu"}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={language === "he" ? "right" : "left"} className="w-[280px] font-heebo" dir={language === "he" ? "rtl" : "ltr"}>
                <SheetHeader>
                  <SheetTitle className={language === "he" ? "text-right" : "text-left"}>
                    <img src={logo} alt="TravelSure לוגו" className="h-10 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) =>
                    link.isAnchor ? (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-foreground hover:text-primary transition-colors font-medium text-lg py-2 border-b border-border"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-foreground hover:text-primary transition-colors font-medium text-lg py-2 border-b border-border"
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                  <Link to="/purchase" onClick={() => setIsOpen(false)} className="mt-4">
                    <Button variant="cta" size="lg" className="w-full">
                      <Plane className="w-4 h-4" />
                      {ctaText}
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center - Logo */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
            <img src={logo} alt="TravelSure לוגו" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Right side - Desktop Navigation & CTA */}
          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.isAnchor ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-foreground hover:text-primary transition-colors font-medium"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-foreground hover:text-primary transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* CTA Button - Desktop */}
            <Link to="/purchase">
              <Button variant="cta" size="default" className="hidden sm:flex">
                <Plane className="w-4 h-4" />
                {ctaText}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
