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
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.avif";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t, isRTL } = useLanguage();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isPurchasePage = location.pathname === "/purchase";

  const navLinks = [
    { href: "/", label: t("nav.home"), isAnchor: false },
    { href: "#services", label: t("nav.services"), isAnchor: true, sectionId: "services" },
    { href: "#about", label: t("nav.about"), isAnchor: true, sectionId: "about" },
    { href: "/faq", label: t("nav.faq"), isAnchor: false },
    { href: "#contact", label: t("nav.contact"), isAnchor: true, sectionId: "contact" },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    
    if (!isHomePage) {
      // Navigate to home page first, then scroll
      window.location.href = `/#${sectionId}`;
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left side - Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{t("nav.openMenu")}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? "right" : "left"} className="w-[280px] font-heebo" dir={isRTL ? "rtl" : "ltr"}>
                <SheetHeader>
                  <SheetTitle className={isRTL ? "text-right" : "text-left"}>
                    <img src={logo} alt="TravelSure" className="h-10 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) =>
                    link.isAnchor && link.sectionId ? (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={(e) => {
                          handleAnchorClick(e, link.sectionId!);
                          setIsOpen(false);
                        }}
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
                      {t("nav.purchase")}
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Left side - Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.isAnchor && link.sectionId ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.sectionId!)}
                  className="text-foreground hover:text-primary transition-colors font-medium cursor-pointer"
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

          {/* Center - Logo */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
            <img src={logo} alt="TravelSure" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Right side - Language & CTA */}
          <div className="flex items-center gap-3">
            {/* Language Selector - Hidden on Purchase page */}
            {!isPurchasePage && (
              <Select value={language} onValueChange={(val: "he" | "en") => setLanguage(val)}>
                <SelectTrigger className="w-[90px] h-9 text-sm bg-background">
                  <Globe className="w-4 h-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* CTA Button - Desktop */}
            <Link to="/purchase">
              <Button variant="cta" size="default" className="hidden sm:flex">
                <Plane className="w-4 h-4" />
                {t("nav.purchase")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
