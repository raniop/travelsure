import { Smartphone, Shield, DollarSign, Heart, Plane } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import { useLanguage } from "@/contexts/LanguageContext";

const TravelPolicy = () => {
  const { isRTL, language } = useLanguage();

  return (
    <div className="min-h-screen font-heebo bg-gradient-to-b from-sky-100 to-blue-50 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Background decorative elements - clouds and sun */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Sun in top right */}
        <div className="absolute top-8 right-8 md:top-12 md:right-12 w-24 h-24 md:w-32 md:h-32 bg-yellow-300 rounded-full opacity-80 blur-sm" />
        <div className="absolute top-8 right-8 md:top-12 md:right-12 w-20 h-20 md:w-28 md:h-28 bg-yellow-200 rounded-full opacity-90" />
        
        {/* Clouds */}
        <div className="absolute top-20 left-10 w-32 h-24 bg-white/60 rounded-full blur-xl opacity-70" />
        <div className="absolute top-32 left-40 w-40 h-28 bg-white/50 rounded-full blur-xl opacity-60" />
        <div className="absolute top-16 right-32 w-36 h-26 bg-white/55 rounded-full blur-xl opacity-65" />
        <div className="absolute top-40 left-1/4 w-28 h-22 bg-white/45 rounded-full blur-xl opacity-50" />
        
        {/* Bottom decorative elements - buildings and windmills */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
          {/* Simple building outlines */}
          <div className="absolute bottom-0 left-10 w-16 h-24 bg-slate-600 rounded-t-lg" />
          <div className="absolute bottom-0 left-32 w-12 h-20 bg-slate-500 rounded-t-lg" />
          <div className="absolute bottom-0 left-52 w-20 h-28 bg-slate-600 rounded-t-lg" />
          {/* Windmill */}
          <div className="absolute bottom-0 right-20 w-8 h-16 bg-slate-500 rounded-t" />
          <div className="absolute bottom-12 right-18 w-12 h-1 bg-slate-400" />
          <div className="absolute bottom-16 right-18 w-12 h-1 bg-slate-400 rotate-90" />
        </div>
      </div>

      <Header />

      <main className="relative z-10">
        {/* Header Section with Logo */}
        <section className="pt-28 pb-8 md:pt-32 md:pb-12">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                {/* Logo placeholder - using text for now */}
                <div className="text-3xl md:text-4xl font-black text-slate-800">
                  הראל
                </div>
                {/* Decorative colorful swirl */}
                <div className="w-12 h-12 md:w-16 md:h-16 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 via-blue-400 to-orange-400 opacity-80" />
                  <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-blue-500 via-green-500 to-yellow-400 opacity-90 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-600 text-sm md:text-base font-medium">
                ביטוח נסיעות לחו״ל
              </p>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="pb-12 md:pb-16">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto text-center">
              {/* Airplane with flight path */}
              <div className="relative mb-8 flex justify-center">
                <div className="relative">
                  {/* Dashed flight path */}
                  <svg className="w-64 h-16 md:w-96 md:h-20" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M 20 50 Q 100 30, 180 50 T 360 50"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="8 6"
                      fill="none"
                      opacity="0.6"
                    />
                  </svg>
                  {/* Airplane icon */}
                  <div className="absolute top-0 right-0 w-8 h-8 md:w-10 md:h-10 text-blue-500">
                    <Plane className="w-full h-full transform rotate-45" />
                  </div>
                </div>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl md:text-6xl font-black text-blue-900 mb-4">
                הגעת להראל
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-blue-700 mb-10 font-medium">
                המקום הכי בריא לרכישת ביטוח נסיעות לחו״ל.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" dir="rtl">
                {/* First Purchase Button - Yellow/Orange on right (appears first in RTL) */}
                <Link to="/buyinsnew">
                  <button className="px-8 py-4 bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400 hover:from-orange-500 hover:via-orange-600 hover:to-yellow-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[240px] w-full sm:w-auto">
                    לרכישה בפעם הראשונה
                  </button>
                </Link>

                {/* Second Purchase Button - White with orange border on left (appears second in RTL) */}
                <Link to="/verify-identity">
                  <button className="px-8 py-4 bg-white border-2 border-orange-300 text-slate-700 font-bold text-lg rounded-xl shadow-md hover:shadow-lg hover:bg-orange-50 hover:border-orange-400 transform hover:scale-105 transition-all duration-300 min-w-[240px] w-full sm:w-auto">
                    לרכישה פעם נוספת
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-12 md:py-16">
          <div className="container-wide">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900 text-center mb-10 md:mb-12">
                מה מקבלים כשרוכשים את ביטוח הנסיעות לחו״ל שלנו?
              </h2>

              {/* Feature Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {/* Feature 1: App */}
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center relative">
                      <Smartphone className="w-10 h-10 text-blue-500" />
                      <div className="absolute top-1 right-1 w-6 h-6 bg-green-400 rounded-lg flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8">
                      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-400">
                        <path d="M12 3L3 12h5v8h8v-8h5L12 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-slate-700 text-center text-sm md:text-base font-medium leading-relaxed">
                    אפליקציה שמלווה אותך בחו״ל לכל מקרה שלא יקרה
                  </p>
                </div>

                {/* Feature 2: Continued Medical Treatment */}
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-green-100 relative">
                  <div className="w-20 h-20 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-4 relative">
                    <Shield className="w-10 h-10 text-green-600" />
                    {/* Medical cross inside shield */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 flex flex-col items-center justify-center">
                        <div className="w-0.5 h-4 bg-green-700" />
                        <div className="w-4 h-0.5 bg-green-700 -mt-2" />
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-700 text-center text-sm md:text-base font-medium leading-relaxed">
                    <span className="font-bold text-green-700">בלעדי להראל.</span> המשך טיפול רפואי בארץ
                  </p>
                </div>

                {/* Feature 3: Luggage Coverage */}
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-yellow-100">
                  <div className="w-20 h-20 mx-auto bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
                    <DollarSign className="w-10 h-10 text-yellow-600" />
                  </div>
                  <p className="text-slate-700 text-center text-sm md:text-base font-medium leading-relaxed">
                    ברכישת כיסוי כבודה, תשלום עבור מזוודה שמאחרת בחו״ל
                  </p>
                </div>

                {/* Feature 4: Air Doctor */}
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-green-100">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center mb-4 relative">
                    {/* Air Doctor Logo - Heart with stylized M shape */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <Heart className="absolute inset-0 w-full h-full text-green-500 fill-green-500/20" />
                      {/* M shape overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <div className="absolute left-0 top-0 w-1 h-6 bg-blue-600 rounded-full" />
                          <div className="absolute left-2 top-2 w-1 h-4 bg-blue-600 rounded-full rotate-45" />
                          <div className="absolute right-2 top-2 w-1 h-4 bg-blue-600 rounded-full -rotate-45" />
                          <div className="absolute right-0 top-0 w-1 h-6 bg-blue-600 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-700 text-center text-sm md:text-base font-bold mb-2">
                    Air doctor
                  </p>
                  <p className="text-slate-600 text-center text-xs md:text-sm leading-relaxed">
                    ייעוץ רפואי בחו״ל עלינו*
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section with Policy Link */}
        <section className="py-8 md:py-12">
          <div className="container-wide">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-slate-600 text-sm md:text-base mb-4 leading-relaxed">
                וכמובן שעוד הרבה כיסויים חשובים שתוכלו למצוא כאן{" "}
                <Link to="/travel-policy" className="underline text-blue-600 hover:text-blue-800 font-medium">
                  בחוברת הפוליסה
                </Link>
              </p>
              
              {/* Air Doctor Disclaimer */}
              <div className="mt-6 p-4 bg-white/60 rounded-xl backdrop-blur-sm border border-blue-100 max-w-3xl mx-auto">
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  *הראל בשיתוף עם Air Doctor מאפשרות לך לאתר רופא בסביבתך בחו״ל ולקבל ייעוץ רפואי מכוח הפוליסה, ללא תשלום מצדך וללא צורך בהגשת תביעה.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CookieBanner />
    </div>
  );
};

export default TravelPolicy;
