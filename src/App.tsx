import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollIndicator from "@/components/ScrollIndicator";
import Index from "./pages/Index";
import Purchase from "./pages/Purchase";
import BuyInsNew from "./pages/BuyInsNew";
import Tirosh from "./pages/Tirosh";
import Claim from "./pages/Claim";
import Foreigners from "./pages/Foreigners";
import InsuranceProposal from "./pages/InsuranceProposal";
import FAQ from "./pages/FAQ";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TravelInsurance from "./pages/TravelInsurance";
import TravelPolicy from "./pages/TravelPolicy";
import VerifyIdentity from "./pages/VerifyIdentity";
import CarInsurance from "./pages/CarInsurance";
import HomeInsurance from "./pages/HomeInsurance";
import BusinessInsurance from "./pages/BusinessInsurance";
import BBQManager from "./pages/BBQManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isBBQPage = location.pathname === "/bbq" || location.pathname === "/on-the-fire";
  
  return (
    <>
      {!isBBQPage && <AccessibilityMenu />}
      <ScrollToTop />
      <ScrollIndicator />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/buyinsnew" element={<BuyInsNew />} />
        <Route path="/tirosh" element={<Tirosh />} />
        <Route path="/claim" element={<Claim />} />
        <Route path="/Foreigners" element={<Foreigners />} />
        <Route path="/foreigners" element={<Foreigners />} />
        <Route path="/Insurance-Proposal" element={<InsuranceProposal />} />
        <Route path="/insurance-proposal" element={<InsuranceProposal />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/travel" element={<TravelInsurance />} />
        <Route path="/travel-policy" element={<TravelPolicy />} />
        <Route path="/verify-identity" element={<VerifyIdentity />} />
        <Route path="/services/car" element={<CarInsurance />} />
        <Route path="/services/home" element={<HomeInsurance />} />
        <Route path="/services/business" element={<BusinessInsurance />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/on-the-fire" element={<BBQManager />} />
        <Route path="/bbq" element={<BBQManager />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
