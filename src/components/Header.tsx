import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plane, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/logo.avif";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const navLinks = [
    { href: isHomePage ? "#services" : "/#services", label: "שירותים", isAnchor: isHomePage },
    { href: isHomePage ? "#about" : "/#about", label: "אודות", isAnchor: isHomePage },
    { href: "/faq", label: "שאלות נפוצות", isAnchor: false },
    { href: isHomePage ? "#contact" : "/#contact", label: "צור קשר", isAnchor: isHomePage },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="TravelSure לוגו" className="h-10 md:h-12 w-auto" />
          </Link>

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

          {/* Mobile Menu & CTA */}
          <div className="flex items-center gap-3">
            {/* CTA Button - Desktop */}
            <Link to="/purchase">
              <Button variant="cta" size="default" className="hidden sm:flex">
                <Plane className="w-4 h-4" />
                רכישת ביטוח נסיעות
              </Button>
            </Link>

            {/* Hamburger Menu - Mobile */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">פתח תפריט</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] font-heebo" dir="rtl">
                <SheetHeader>
                  <SheetTitle className="text-right">
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
                      רכישת ביטוח נסיעות
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
