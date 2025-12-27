import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const isPurchasePage = location.pathname === "/purchase";

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/about", label: t("nav.about") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/contact", label: t("nav.contact") },
  ];

  // Search data - pages and keywords with FAQ content
  const searchData = useMemo(() => [
    { href: "/", label: t("nav.home"), keywords: ["בית", "home", "ראשי", "main"] },
    { href: "/services", label: t("nav.services"), keywords: ["שירותים", "services", "ביטוח", "insurance", "נסיעות", "travel", "רכב", "car", "דירה", "home", "עסקי", "business"] },
    { href: "/about", label: t("nav.about"), keywords: ["אודות", "about", "מי אנחנו", "who we are", "החברה", "company", "ניסיון", "experience"] },
    { href: "/faq", label: t("nav.faq"), keywords: [
      // General FAQ keywords
      "שאלות", "faq", "תשובות", "answers", "שאלות נפוצות", "frequently asked",
      // Coverage keywords
      "כיסוי", "coverage", "פוליסה", "policy", "הוצאות רפואיות", "medical expenses", "אשפוז", "hospitalization",
      // Specific topics
      "ביטול נסיעה", "trip cancellation", "כבודה", "luggage", "פינוי רפואי", "medical evacuation",
      "מצב רפואי קיים", "pre-existing", "החמרה", "worsening",
      "ספורט אתגרי", "extreme sports", "ספורט חורף", "winter sports", "סקי", "skiing",
      "חירום", "emergency", "מוקד", "center", "24/7",
      "הריון", "pregnancy", "לידה מוקדמת", "premature birth",
      "מחיר", "price", "עלות", "cost", "הצעת מחיר", "quote",
      "השתתפות עצמית", "deductible",
      "תביעה", "claim", "קבלות", "receipts"
    ] },
    { href: "/contact", label: t("nav.contact"), keywords: ["צור קשר", "contact", "טלפון", "phone", "מייל", "email", "וואטסאפ", "whatsapp", "073", "054"] },
    { href: "/purchase", label: t("nav.purchase"), keywords: ["רכישה", "purchase", "קנייה", "buy", "ביטוח נסיעות", "travel insurance", "5 מיליון", "5 million", "הרחבות", "extensions"] },
    { href: "/privacy", label: t("footer.privacy"), keywords: ["פרטיות", "privacy", "מדיניות", "policy", "עוגיות", "cookies"] },
  ], [t]);

  // Filter search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return searchData.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }, [searchQuery, searchData]);

  const handleSearchSelect = (href: string) => {
    navigate(href);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSearchSelect(searchResults[0].href);
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container-wide">
        <div className="flex items-center justify-between h-24 md:h-28">
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
            <img src={logo} alt="TravelSure" className="h-20 md:h-24 w-auto max-h-none" />
          </Link>

          {/* Right side - Language, Search & CTA */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Language Toggle - Hidden on Purchase page */}
            {!isPurchasePage && !isSearchOpen && (
              <div className="flex items-center bg-background border border-border rounded-full px-4 py-2 shadow-sm">
                <button
                  onClick={() => setLanguage("en")}
                  className={`text-sm font-medium transition-colors ${
                    language === "en"
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  En
                </button>
                <span className="text-muted-foreground/50 mx-2">|</span>
                <button
                  onClick={() => setLanguage("he")}
                  className={`text-sm font-medium transition-colors ${
                    language === "he"
                      ? "text-foreground"
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
                  <div className="relative animate-fade-in">
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder={isRTL ? "חיפוש..." : "Search..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
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
                    {/* Search Results Dropdown */}
                    {searchQuery.trim() && (
                      <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                        {searchResults.length > 0 ? (
                          searchResults.map((result) => (
                            <button
                              key={result.href}
                              onClick={() => handleSearchSelect(result.href)}
                              className="w-full px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-right"
                            >
                              {result.label}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                            {isRTL ? "לא נמצאו תוצאות" : "No results found"}
                          </div>
                        )}
                      </div>
                    )}
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
