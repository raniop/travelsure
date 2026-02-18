import { useState } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

const isValidIsraeliId = (id: string) => {
  const s = id.trim().padStart(9, "0");
  if (!/^\d{9}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
};

const tiroshSchema = z.object({
  fullName: z.string().trim().min(2, "שם מלא הוא שדה חובה").max(100, "שם מלא ארוך מדי"),
  phone: z.string().trim().min(6, "טלפון הוא שדה חובה").max(20, "טלפון ארוך מדי"),
  birthDate: z
    .string()
    .trim()
    .min(4, "תאריך לידה הוא שדה חובה")
    .max(20, "תאריך לידה ארוך מדי")
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "יש להזין תאריך בפורמט DD/MM/YYYY"),
  idNumber: z
    .string()
    .trim()
    .min(5, "תעודת זהות היא שדה חובה")
    .max(20, "תעודת זהות ארוכה מדי")
    .regex(/^\d{5,9}$/, "תעודת זהות לא תקינה")
    .refine((value) => isValidIsraeliId(value), "תעודת זהות לא תקינה"),
  notes: z.string().trim().max(2000, "הערות ארוכות מדי").optional(),
});

const Tirosh = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    birthDate: "",
    idNumber: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d/]/g, "");
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const parts = [];
    if (digits.length >= 2) parts.push(digits.slice(0, 2));
    if (digits.length >= 4) parts.push(digits.slice(2, 4));
    if (digits.length > 4) parts.push(digits.slice(4));
    const nextValue = parts.join("/");
    setFormData((prev) => ({ ...prev, birthDate: nextValue }));
    if (errors.birthDate) {
      setErrors((prev) => ({ ...prev, birthDate: "" }));
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^\d]/g, "").slice(0, 9);
    setFormData((prev) => ({ ...prev, idNumber: clean }));
    if (errors.idNumber) {
      setErrors((prev) => ({ ...prev, idNumber: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = tiroshSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = "https://ophir.travelsure.co.il/api-tirosh.php";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          birthDate: formData.birthDate.trim(),
          idNumber: formData.idNumber.trim(),
          notes: formData.notes?.trim() || "",
        }),
      });

      if (!res.ok) {
        throw new Error("tirosh_request_failed");
      }

      toast({
        title: "הפנייה נשלחה בהצלחה!",
        description: "נחזור אליך בהקדם האפשרי.",
      });

      setFormData({
        fullName: "",
        phone: "",
        birthDate: "",
        idNumber: "",
        notes: "",
      });
    } catch (err) {
      console.error("Error sending tirosh lead:", err);
      toast({
        title: "שגיאה בשליחת הפנייה",
        description: "אנא נסה שוב מאוחר יותר או צור קשר בטלפון.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "radial-gradient(circle at top, #f5faff 0%, #f8fafc 40%, #eef2f7 100%)",
      }}
    >
      <style>{`
        .tirosh-date-input::-webkit-datetime-edit {
          text-align: right;
        }
        .tirosh-date-input::-webkit-datetime-edit-fields-wrapper {
          display: flex;
          justify-content: flex-end;
        }
        .tirosh-date-input::-webkit-datetime-edit-text {
          padding: 0 2px;
        }
        .tirosh-date-input::-webkit-calendar-picker-indicator {
          margin-left: 0;
          margin-right: 8px;
        }
        .tirosh-date-input {
          text-align: right;
          text-align-last: right;
          direction: rtl;
        }
      `}</style>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="grid gap-6 place-items-center text-center" dir="rtl">
          {!logoError ? (
            <img
              src="/tirosh/logo.png"
              alt="תירוש ביטוח ופיננסים"
              className="h-auto w-[min(280px,70vw)]"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="rounded-xl bg-[#2f6b63] px-5 py-3 text-white font-bold">
              תירוש ביטוח ופיננסים
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1f4b46]">טופס ליד - תירוש</h1>
            <p className="mt-2 text-sm text-slate-500">מלאו את הפרטים ונחזור אליכם בהקדם</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#2f6b63]">
            שדות חובה מסומנים בכוכבית
          </span>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/95 shadow-xl">
          <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-[#2f6b63] to-[#4ade80]" />
          <div className="flex flex-col gap-2 px-6 pt-6 text-right" dir="rtl">
            <h2 className="text-base font-semibold text-[#1f4b46]">נשמח לעזור לכם במהירות</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#2f6b63] w-fit">
              חוזרים אליכם תוך זמן קצר
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 px-6 pb-6 pt-4" dir="rtl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 text-right">
                  שם מלא <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="fullName"
                  placeholder="לדוגמה: ישראל ישראלי"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`bg-slate-50 text-right ${errors.fullName ? "border-destructive" : ""}`}
                  style={{ direction: "rtl", textAlign: "right" }}
                  disabled={isLoading}
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 text-right">
                  טלפון <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="לדוגמה: 052-1234567"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`bg-slate-50 text-right ${errors.phone ? "border-destructive" : ""}`}
                  style={{ direction: "rtl", textAlign: "right" }}
                  disabled={isLoading}
                />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 text-right">
                  תאריך לידה <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleBirthDateChange}
                  placeholder="dd/mm/yyyy"
                  className={`tirosh-date-input bg-slate-50 text-right ${errors.birthDate ? "border-destructive" : ""}`}
                  style={{ direction: "rtl", textAlign: "right" }}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-400 mt-1">פורמט: יום/חודש/שנה</p>
                {errors.birthDate && <p className="text-destructive text-xs mt-1">{errors.birthDate}</p>}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 text-right">
                  תעודת זהות <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="idNumber"
                  inputMode="numeric"
                  placeholder="9 ספרות"
                  value={formData.idNumber}
                  onChange={handleIdChange}
                  className={`bg-slate-50 text-right ${errors.idNumber ? "border-destructive" : ""}`}
                  style={{ direction: "rtl", textAlign: "right" }}
                  disabled={isLoading}
                />
                {errors.idNumber && <p className="text-destructive text-xs mt-1">{errors.idNumber}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700 text-right">
                הערות
              </label>
              <Textarea
                name="notes"
                placeholder="כל דבר שחשוב לדעת..."
                value={formData.notes}
                onChange={handleChange}
                className={`bg-slate-50 min-h-[120px] text-right ${errors.notes ? "border-destructive" : ""}`}
                style={{ direction: "rtl", textAlign: "right" }}
                disabled={isLoading}
              />
              {errors.notes && <p className="text-destructive text-xs mt-1">{errors.notes}</p>}
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              className="w-full rounded-xl bg-[#2f6b63] text-white hover:bg-[#25564f]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  שלח
                </>
              )}
            </Button>

            <p className="text-center text-xs text-slate-400">
              הפרטים נשמרים בצורה מאובטחת לצורך חזרה אליכם בלבד.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Tirosh;
