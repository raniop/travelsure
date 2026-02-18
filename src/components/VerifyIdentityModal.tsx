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

  const API_BASE_URL = "https://mobile.ophirins.co.il";

  const normalizeIdValue = (value: unknown) => {
    const digits = String(value || "").replace(/[^\d]/g, "");
    if (!digits) return "";
    return digits.padStart(9, "0");
  };

  const pickString = (obj: Record<string, unknown> | null | undefined, keys: string[]) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return "";
  };

  const normalizeGender = (value: unknown): "M" | "F" | "" => {
    if (!value) return "";
    const v = String(value).trim().toLowerCase();
    if (v === "m" || v === "male") return "M";
    if (v === "f" || v === "female") return "F";
    if (v === "1") return "M";
    if (v === "2") return "F";
    return "";
  };

  const extractPersonEntriesFromPolicies = (policies: unknown): Array<Record<string, unknown>> => {
    if (!Array.isArray(policies)) return [];
    const entries: Array<Record<string, unknown>> = [];
    const arrayKeys = [
      "persons",
      "people",
      "insureds",
      "insuredPersons",
      "policyPersons",
      "customers",
      "insuredPersonsList",
    ];

    for (const policy of policies) {
      if (policy && typeof policy === "object") {
        entries.push(policy as Record<string, unknown>);
        for (const key of arrayKeys) {
          const maybeArray = (policy as Record<string, unknown>)[key];
          if (Array.isArray(maybeArray)) {
            maybeArray.forEach((item) => {
              if (item && typeof item === "object") {
                entries.push(item as Record<string, unknown>);
              }
            });
          }
        }
      }
    }

    return entries;
  };

  const buildCustomerFromEntry = (entry: Record<string, unknown>, fallbackId: string) => {
    const personId =
      normalizeIdValue(
        entry.personId ||
          entry.PersonId ||
          entry.personID ||
          entry.PersonID ||
          entry.id ||
          entry.ID
      ) || fallbackId;

    const fullName =
      pickString(entry, [
        "primaryName",
        "fullName",
        "FullName",
        "clientName",
        "ClientName",
        "name",
        "Name",
        "customerName",
        "insuredName",
      ]) || "";
    const firstNameHe = pickString(entry, [
      "firstNameHe",
      "FirstNameHe",
      "firstNameHebrew",
      "firstName",
      "hebFname",
      "hebFirstName",
    ]);
    const lastNameHe = pickString(entry, [
      "lastNameHe",
      "LastNameHe",
      "lastNameHebrew",
      "lastName",
      "hebLname",
      "hebLastName",
    ]);
    const split = (!firstNameHe && !lastNameHe && fullName) ? splitNameHe(fullName) : { first: firstNameHe, last: lastNameHe };

    const firstNameEn = pickString(entry, [
      "firstNameEn",
      "FirstNameEn",
      "firstNameEnglish",
      "engFname",
      "engFirstName",
    ]);
    const lastNameEn = pickString(entry, [
      "lastNameEn",
      "LastNameEn",
      "lastNameEnglish",
      "engLname",
      "engLastName",
    ]);

    return {
      id: personId,
      gender: normalizeGender(
        entry.gender || entry.Gender || entry.sex || entry.Sex || entry.sexType || entry.SexType
      ),
      firstNameHe: split.first || "",
      lastNameHe: split.last || "",
      firstNameEn: firstNameEn || "",
      lastNameEn: lastNameEn || "",
      birthDate: pickString(entry, ["birthDate", "BirthDate", "dateOfBirth", "DateOfBirth", "dob"]),
      email: pickString(entry, ["email", "Email", "mail", "Mail"]),
      phone: pickString(entry, ["phone", "Phone", "phoneNumber", "PhoneNumber", "mobile", "Mobile", "cell", "Cell"]),
    };
  };

  const handleSendOTP = async () => {
    const cleanId = id.replace(/[^\d]/g, "");
    const normalizedId = cleanId.padStart(9, "0");
    const cleanPhone = phone.replace(/[^\d]/g, "");

    if (!validateId(cleanId) || !validatePhone(cleanPhone)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sendotp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: normalizedId,
          phoneNumber: cleanPhone,
        }),
      });
      const text = await response.text();
      let data: { isSuccess?: boolean; message?: string } | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok || data?.isSuccess === false) {
        throw new Error(
          data?.message ||
            (text && text.length < 200 ? text : "שליחת קוד האימות נכשלה")
        );
      }

      toast({
        title: "קוד אימות נשלח",
        description: data?.message || "אנא הזן את הקוד שנשלח למספר הטלפון שלך",
      });
      setStep("otp");
      setCountdown(60);
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "שגיאה בשליחת קוד האימות",
        description: error.message || "שגיאת תקשורת עם השרת, נסה שוב",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchCustomerAndNavigate = async (cleanId: string, accessToken?: string) => {
    try {
      setStep("verifying");
      setLoading(true);

      const normalizedId = cleanId.padStart(9, "0");
      const storedTokens = sessionStorage.getItem("auth_tokens");
      const parsedTokens = storedTokens ? JSON.parse(storedTokens) : null;
      const token = accessToken || parsedTokens?.accessToken;

      if (!token) {
        throw new Error("לא נמצא טוקן גישה לביצוע הבדיקה");
      }

      const res = await fetch(`${API_BASE_URL}/api/policy/GetMyPolicies`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const text = await res.text();
      let policies: unknown = null;
      try {
        policies = text ? JSON.parse(text) : null;
      } catch {
        policies = null;
      }

      if (!res.ok) {
        throw new Error(
          text && text.length < 200 ? text : "שגיאה בחיפוש במערכת"
        );
      }

      const entries = extractPersonEntriesFromPolicies(policies);
      const primaryEntry =
        entries.find((entry) => normalizeIdValue(entry.personId || entry.PersonId) === normalizedId) ||
        entries[0];

      if (primaryEntry) {
        const primaryCustomer = buildCustomerFromEntry(primaryEntry, normalizedId);

        const additional = entries
          .map((entry) => {
            const personId = normalizeIdValue(
              entry.personId || entry.PersonId || entry.personID || entry.PersonID || entry.id || entry.ID
            );
            if (!personId || personId === normalizedId) return null;
            const customer = buildCustomerFromEntry(entry, personId);
            return {
              personId: customer.id,
              primaryName: `${customer.firstNameHe} ${customer.lastNameHe}`.trim(),
              firstNameHe: customer.firstNameHe,
              lastNameHe: customer.lastNameHe,
              firstNameEn: customer.firstNameEn,
              lastNameEn: customer.lastNameEn,
              gender: customer.gender,
              birthDate: customer.birthDate,
              email: customer.email,
              phone: customer.phone,
            };
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item));

        const uniqueAdditional = Array.from(
          new Map(additional.map((item) => [String(item.personId), item])).values()
        );

        const customerData = {
          primaryCustomer,
          additionalCustomers: uniqueAdditional,
          cameFromVerifyIdentity: true,
        };

        sessionStorage.setItem("buyinsnew_customer_data", JSON.stringify(customerData));
        onOpenChange(false);
        navigate("/buyinsnew");
        return;
      }

      const customerData = {
        primaryCustomer: {
          id: normalizedId,
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
    const normalizedId = cleanId.padStart(9, "0");
    const cleanPhone = phone.replace(/[^\d]/g, "");
    if (!validatePhone(cleanPhone) || !validateId(cleanId)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verifyotp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personId: normalizedId,
          otpCode: otp,
        }),
      });

      const text = await response.text();
      let data:
        | {
            accessToken?: string;
            refreshToken?: string;
            message?: string;
            isSuccess?: boolean;
          }
        | null = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      const parsed = data ?? {};
      const accessToken = (parsed as any)?.accessToken;
      const refreshToken = (parsed as any)?.refreshToken;

      if (!response.ok || (parsed as any)?.isSuccess === false) {
        throw new Error(
          (parsed as any)?.message ||
            (text && text.length < 200 ? text : "קוד האימות לא תקין")
        );
      }

      if (accessToken || refreshToken) {
        sessionStorage.setItem(
          "auth_tokens",
          JSON.stringify({
            accessToken: accessToken || "",
            refreshToken: refreshToken || "",
          })
        );
      }

      await searchCustomerAndNavigate(cleanId, accessToken);
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setErrors((prev) => ({ ...prev, otp: error.message || "קוד אימות לא תקין" }));
      toast({
        title: "שגיאה באימות הקוד",
        description: error.message || "שגיאת תקשורת עם השרת, נסה שוב",
        variant: "destructive",
      });
      setLoading(false);
    }
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
