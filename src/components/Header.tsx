import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.avif";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, setLanguage, t, isRTL } = useLanguage();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isPurchasePage = location.pathname === "/purchase";

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/about", label: t("nav.about") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
  ];

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
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-foreground hover:text-primary transition-colors font-medium text-lg py-2 border-b border-border"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link to="/purchase" onClick={() => setIsOpen(false)} className="mt-4">
                    <Button variant="cta" size="lg" className="w-full">
                      {t("nav.purchase")}
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Left side - Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Center - Logo */}
          <Link to="/" className="absolute left-1/2 transform -translate-x-1/2">
            <img src={logo} alt="TravelSure" className="h-10 md:h-12 w-auto" />
          </Link>

          {/* Right side - Language, Search & CTA */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Language Toggle - Hidden on Purchase page */}
            {!isPurchasePage && !isSearchOpen && (
              <div className="flex items-center bg-muted rounded-full px-1 py-1">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    language === "en"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  En
                </button>
                <span className="text-muted-foreground text-sm">|</span>
                <button
                  onClick={() => setLanguage("he")}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                    language === "he"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  עב
                </button>
              </div>
            )}

            {/* Search */}
            {!isPurchasePage && (
              <div className="relative">
                {isSearchOpen ? (
                  <div className="flex items-center gap-2 animate-fade-in">
                    <Input
                      type="text"
                      placeholder={isRTL ? "חיפוש..." : "Search..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[140px] md:w-[200px] h-9 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="p-2 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Search className="w-4 h-4 text-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* CTA Button - Desktop */}
            <Link to="/purchase">
              <Button variant="cta" size="default" className="hidden sm:flex">
                {t("nav.purchase")}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
