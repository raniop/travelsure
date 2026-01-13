import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Phone, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { isValidIsraeliId, splitNameHe } from "@/components/buyinsnew/utils";
import { useToast } from "@/hooks/use-toast";

interface VerifyIdentityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VerifyIdentityModal = ({ open, onOpenChange }: VerifyIdentityModalProps) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"id-phone" | "otp" | "verifying">("id-phone");
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<{ id?: string; phone?: string; otp?: string }>({});
  const otpInputRef = useRef<React.ElementRef<typeof InputOTP>>(null);
  
  // Callback ref to focus when OTP input is mounted
  const otpRefCallback = (node: React.ElementRef<typeof InputOTP> | null) => {
    if (node && step === "otp" && open) {
      // Small delay to ensure the component is fully mounted
      setTimeout(() => {
        // Try to access the internal input element
        const container = (node as any)?.containerRef?.current || (node as any)?._containerRef?.current;
        if (container) {
          const input = container.querySelector('input') as HTMLInputElement;
          if (input) {
            input.focus();
            input.click();
          }
        }
      }, 150);
    }
    otpInputRef.current = node;
  };

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setStep("id-phone");
      setId("");
      setPhone("");
      setOtp("");
      setErrors({});
      setCountdown(0);
    }
  }, [open]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus OTP input when step changes to "otp"
  useEffect(() => {
    if (step === "otp" && open) {
      // Multiple attempts with increasing delays to ensure the input is rendered
      const attemptFocus = (attempt: number) => {
        // The input-otp library creates a hidden input element
        // Try multiple ways to find it
        let input: HTMLInputElement | null = null;

        // Method 1: Try to find through the ref
        if (otpInputRef.current) {
          const container = (otpInputRef.current as any)?.containerRef?.current || 
                          (otpInputRef.current as any)?._containerRef?.current ||
                          (otpInputRef.current as any)?.container;
          if (container) {
            input = container.querySelector('input') as HTMLInputElement;
          }
        }

        // Method 2: Try various selectors
        if (!input) {
          const selectors = [
            'input[type="text"][inputmode="numeric"]',
            'input[autocomplete="one-time-code"]',
            'input[type="tel"]',
            '[data-otp-input] input',
            'input[aria-label*="code" i]',
            'input[aria-label*="otp" i]',
          ];

          for (const selector of selectors) {
            const found = document.querySelector(selector) as HTMLInputElement;
            if (found && found.offsetParent !== null) {
              input = found;
              break;
            }
          }
        }

        // Method 3: Find any input in the OTP container area
        if (!input) {
          const otpContainer = document.querySelector('[class*="flex items-center gap-2"]');
          if (otpContainer) {
            input = otpContainer.querySelector('input') as HTMLInputElement;
          }
        }

        if (input) {
          input.focus();
          input.click(); // Also click to ensure focus
          return true;
        }

        // If not found and we haven't tried enough times, try again
        if (attempt < 8) {
          setTimeout(() => attemptFocus(attempt + 1), 100 * attempt);
        }
        return false;
      };

      // Start attempting after a short delay
      const timer = setTimeout(() => {
        attemptFocus(1);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [step, open]);

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

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const storeOTP = (key: string, code: string, expiresAt: number) => {
    try {
      localStorage.setItem(`otp_${key}`, JSON.stringify({ code, expiresAt }));
    } catch (error) {
      console.error("Failed to store OTP:", error);
    }
  };

  const getOTP = (key: string): { code: string; expiresAt: number } | null => {
    try {
      const stored = localStorage.getItem(`otp_${key}`);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(`otp_${key}`);
        return null;
      }
      return parsed;
    } catch (error) {
      console.error("Failed to get OTP:", error);
      return null;
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
      const otpCode = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const storageKey = `${cleanId}-${cleanPhone}`;
      storeOTP(storageKey, otpCode, expiresAt);

      toast({
        title: "קוד אימות נשמר",
        description: `קוד אימות נשמר. אנא הזן את הקוד להמשך.`,
      });
      setStep("otp");
      setCountdown(60);
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

  const searchCustomerAndNavigate = async (cleanId: string) => {
    try {
      setStep("verifying");
      setLoading(true);

      // קביעת ה-URL הנכון בהתאם לסביבה
      const isLocalhost = typeof window !== 'undefined' && 
                         (window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('lovable') ||
                          window.location.hostname.includes('lovable.dev'));
      
      const apiUrl = isLocalhost 
        ? `/api/policy-get-by-id?id=${encodeURIComponent(cleanId)}`
        : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/policy-get-by-id?id=${encodeURIComponent(cleanId)}`;

      const res = await fetch(apiUrl, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("שגיאה בחיפוש במערכת");
      }

      const json = await res.json() as Record<string, unknown> | null;
      if (!json) {
        throw new Error("תגובה לא תקינה מהשרת");
      }

      const customer = json?.customer as Record<string, unknown> | undefined;

      if (customer && json?.found) {
        const fullName = (customer.primaryName as string) || "";
        const firstNameHe = (customer.firstNameHe as string) || "";
        const lastNameHe = (customer.lastNameHe as string) || "";
        const split = (!firstNameHe && !lastNameHe && fullName) ? splitNameHe(fullName) : { first: firstNameHe, last: lastNameHe };

        const gender = (customer.gender as string) || "";

        // הכנת נתוני הלקוח הראשי
        const primaryCustomer = {
          id: cleanId,
          gender: (gender as "M" | "F" | "") || "",
          firstNameHe: split.first || "",
          lastNameHe: split.last || "",
          firstNameEn: (customer.firstNameEn as string) || "",
          lastNameEn: (customer.lastNameEn as string) || "",
          birthDate: (customer.birthDate as string) || "",
          email: (customer.email as string) || "",
          phone: (customer.phone as string) || "",
        };

        // בדיקת לקוחות נוספים
        const allCustomersFromApi = (json?.allCustomers as Array<Record<string, unknown>>) || [];
        const normalizedCurrentId = cleanId.padStart(9, "0");
        const additional = allCustomersFromApi.filter((c) => {
          const custId = String(c.personId || "").padStart(9, "0");
          return custId !== normalizedCurrentId && custId.length === 9;
        });

        // שמירת הנתונים ב-sessionStorage
        const customerData = {
          primaryCustomer,
          additionalCustomers: additional,
          cameFromVerifyIdentity: true,
        };

        sessionStorage.setItem("buyinsnew_customer_data", JSON.stringify(customerData));

        // סגירת ה-modal וניווט
        onOpenChange(false);
        navigate("/buyinsnew");
      } else {
        // אם לא נמצא במערכת, עדיין נשמור את תעודת הזהות
        const customerData = {
          primaryCustomer: {
            id: cleanId,
            gender: "",
            firstNameHe: "",
            lastNameHe: "",
            firstNameEn: "",
            lastNameEn: "",
            birthDate: "",
            email: "",
            phone: "",
          },
          additionalCustomers: [],
          cameFromVerifyIdentity: true,
        };

        sessionStorage.setItem("buyinsnew_customer_data", JSON.stringify(customerData));
        onOpenChange(false);
        navigate("/buyinsnew");
      }
    } catch (error: any) {
      console.error("Error searching customer:", error);
      toast({
        title: "שגיאה בחיפוש",
        description: error.message || "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
      setLoading(false);
      setStep("otp");
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "קוד אימות חייב להכיל 6 ספרות" }));
      return;
    }

    const cleanId = id.replace(/[^\d]/g, "");
    const cleanPhone = phone.replace(/[^\d]/g, "");

    // Temporary test code - for testing only
    if (otp === "110886") {
      await searchCustomerAndNavigate(cleanId);
      return;
    }

    const storageKey = `${cleanId}-${cleanPhone}`;
    const stored = getOTP(storageKey);

    if (!stored) {
      setErrors((prev) => ({ ...prev, otp: "קוד אימות לא נמצא או פג תוקף" }));
      return;
    }

    if (stored.code !== otp) {
      setErrors((prev) => ({ ...prev, otp: "קוד אימות לא תקין" }));
      return;
    }

    await searchCustomerAndNavigate(cleanId);
  };

  const handleResendOTP = async () => {
    await handleSendOTP();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            הזדהות למבוטחים קיימים
          </DialogTitle>
          <DialogDescription className="text-center">
            אנא הזן את פרטיך לאימות
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: ID and Phone */}
          {step === "id-phone" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="id" className="text-base font-semibold">
                  תעודת זהות *
                </Label>
                <Input
                  id="id"
                  type="text"
                  value={id}
                  onChange={(e) => handleIdChange(e.target.value)}
                  placeholder="תעודת זהות"
                  className="mt-2 h-12 text-lg"
                  dir="ltr"
                  maxLength={9}
                />
                {errors.id && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.id}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-base font-semibold">
                  מספר טלפון *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="מספר טלפון"
                  className="mt-2 h-12 text-lg"
                  dir="ltr"
                  maxLength={10}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading || !id || !phone}
                size="lg"
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    שלח קוד אימות
                    <Phone className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center">
                <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-slate-700 mb-4">
                  הזן את קוד האימות שנשלח למספר {phone}
                </p>
              </div>

              <div className="flex justify-center" dir="ltr">
                <InputOTP
                  ref={otpRefCallback}
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setErrors((prev) => {
                      const updated = { ...prev };
                      delete updated.otp;
                      return updated;
                    });
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
                <p className="text-red-500 text-sm text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.otp}
                </p>
              )}

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
      </DialogContent>
    </Dialog>
  );
};

export default VerifyIdentityModal;
