import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Purchase from "./pages/Purchase";
import FAQ from "./pages/FAQ";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TravelInsurance from "./pages/TravelInsurance";
import CarInsurance from "./pages/CarInsurance";
import HomeInsurance from "./pages/HomeInsurance";
import BusinessInsurance from "./pages/BusinessInsurance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AccessibilityMenu />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/purchase" element={<Purchase />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/travel" element={<TravelInsurance />} />
            <Route path="/services/car" element={<CarInsurance />} />
            <Route path="/services/home" element={<HomeInsurance />} />
            <Route path="/services/business" element={<BusinessInsurance />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
