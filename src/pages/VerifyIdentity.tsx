import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Phone, CreditCard, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Header from "@/components/Header";
import CookieBanner from "@/components/CookieBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import { isValidIsraeliId } from "@/components/buyinsnew/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VerifyIdentity = () => {
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"id-phone" | "otp" | "verifying">("id-phone");
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{ id?: string; phone?: string; otp?: string }>({});

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateId = (idValue: string): boolean => {
    const cleanId = idValue.replace(/[^\d]/g, "");
    if (!cleanId || cleanId.length === 0) {
      setErrors((prev) => ({ ...prev, id: "תעודת זהות היא שדה חובה" }));
      return false;
    }
    if (cleanId.length !== 9) {
      setErrors((prev) => ({ ...prev, id: "תעודת זהות חייבת להכיל 9 ספרות" }));
      return false;
    }
    if (!isValidIsraeliId(cleanId)) {
      setErrors((prev) => ({ ...prev, id: "תעודת זהות לא תקינה" }));
      return false;
    }
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.id;
      return updated;
    });
    return true;
  };

  const validatePhone = (phoneValue: string): boolean => {
    const cleanPhone = phoneValue.replace(/[^\d]/g, "");
    if (!cleanPhone || cleanPhone.length === 0) {
      setErrors((prev) => ({ ...prev, phone: "מספר טלפון הוא שדה חובה" }));
      return false;
    }
    if (cleanPhone.length < 9 || cleanPhone.length > 10) {
      setErrors((prev) => ({ ...prev, phone: "מספר טלפון לא תקין" }));
      return false;
    }
    // Israeli phone validation (should start with 05 or 0)
    if (!cleanPhone.startsWith("0")) {
      setErrors((prev) => ({ ...prev, phone: "מספר טלפון צריך להתחיל ב-0" }));
      return false;
    }
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated.phone;
      return updated;
    });
    return true;
  };

  const handleIdChange = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, "").slice(0, 9);
    setId(cleanValue);
    if (cleanValue.length === 9) {
      validateId(cleanValue);
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.id;
        return updated;
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, "").slice(0, 10);
    setPhone(cleanValue);
    if (cleanValue.length >= 9) {
      validatePhone(cleanValue);
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.phone;
        return updated;
      });
    }
  };

  const handleSendOTP = async () => {
    const cleanId = id.replace(/[^\d]/g, "");
    const cleanPhone = phone.replace(/[^\d]/g, "");

    if (!validateId(cleanId) || !validatePhone(cleanPhone)) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          id: cleanId,
          phone: cleanPhone,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "קוד אימות נשלח",
          description: `קוד אימות נשלח למספר ${cleanPhone}`,
        });
        setStep("otp");
        setCountdown(60); // 60 seconds countdown
      } else {
        throw new Error(data?.error || "שגיאה בשליחת קוד האימות");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "שגיאה בשליחת קוד האימות",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "אנא הזן קוד אימות בן 6 ספרות" }));
      return;
    }

    setStep("verifying");
    const cleanId = id.replace(/[^\d]/g, "");
    const cleanPhone = phone.replace(/[^\d]/g, "");

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          id: cleanId,
          phone: cleanPhone,
          otp: otp,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "אימות הצליח",
          description: "אתה מועבר לתהליך הרכישה...",
        });
        
        // Store verified identity in sessionStorage
        sessionStorage.setItem("verifiedId", cleanId);
        sessionStorage.setItem("verifiedPhone", cleanPhone);
        
        // Redirect to purchase page after short delay
        setTimeout(() => {
          navigate("/purchase");
        }, 1000);
      } else {
        throw new Error(data?.error || "קוד אימות לא תקין");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "אימות נכשל",
        description: error.message || "קוד האימות לא תקין. אנא נסה שוב",
        variant: "destructive",
      });
      setStep("otp");
      setErrors((prev) => ({ ...prev, otp: "קוד אימות לא תקין" }));
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen font-heebo bg-gradient-to-b from-sky-100 to-blue-50 relative overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <Header />
      
      <main className="relative z-10 pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container-wide">
          <div className="max-w-md mx-auto">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-blue-100">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                  הזדהות למבוטחים קיימים
                </h1>
                <p className="text-slate-600 text-sm md:text-base">
                  אנא הזן את פרטיך לאימות
                </p>
              </div>

              {/* Step 1: ID and Phone */}
              {step === "id-phone" && (
                <div className="space-y-6">
                  {/* ID Input */}
                  <div>
                    <Label htmlFor="id" className="text-slate-700 font-medium mb-2 block">
                      תעודת זהות <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="id"
                        type="text"
                        inputMode="numeric"
                        value={id}
                        onChange={(e) => handleIdChange(e.target.value)}
                        placeholder="123456789"
                        maxLength={9}
                        className={`pr-10 h-12 text-lg ${errors.id ? "border-red-500" : ""}`}
                        dir="ltr"
                      />
                    </div>
                    {errors.id && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.id}
                      </p>
                    )}
                  </div>

                  {/* Phone Input */}
                  <div>
                    <Label htmlFor="phone" className="text-slate-700 font-medium mb-2 block">
                      מספר טלפון <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="phone"
                        type="text"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="0501234567"
                        maxLength={10}
                        className={`pr-10 h-12 text-lg ${errors.phone ? "border-red-500" : ""}`}
                        dir="ltr"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSendOTP}
                    disabled={loading}
                    size="lg"
                    className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        שולח קוד אימות...
                      </>
                    ) : (
                      <>
                        שלח קוד אימות
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Step 2: OTP Verification */}
              {step === "otp" && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-slate-700 mb-2">
                      קוד אימות נשלח למספר:
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div>
                    <Label className="text-slate-700 font-medium mb-4 block text-center">
                      הזן את קוד האימות <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => {
                          setOtp(value);
                          if (value.length === 6) {
                            setErrors((prev) => {
                              const updated = { ...prev };
                              delete updated.otp;
                              return updated;
                            });
                          }
                        }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {errors.otp && (
                      <p className="text-red-500 text-sm mt-2 text-center flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.otp}
                      </p>
                    )}
                  </div>

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6 || loading}
                    size="lg"
                    className="w-full h-12 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        בודק...
                      </>
                    ) : (
                      <>
                        אמת קוד
                        <CheckCircle2 className="w-5 h-5" />
                      </>
                    )}
                  </Button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    <button
                      onClick={handleResendOTP}
                      disabled={countdown > 0}
                      className="text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      {countdown > 0
                        ? `שלח קוד מחדש בעוד ${countdown} שניות`
                        : "שלח קוד מחדש"}
                    </button>
                  </div>

                  {/* Back to ID/Phone */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setStep("id-phone");
                        setOtp("");
                        setErrors({});
                      }}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      חזור להזנת פרטים
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Verifying */}
              {step === "verifying" && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-slate-700 text-lg font-medium">
                    מאמת את הפרטים...
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    אנא המתן
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <CookieBanner />
    </div>
  );
};

export default VerifyIdentity;
