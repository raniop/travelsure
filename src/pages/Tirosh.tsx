import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

const tiroshSchema = z.object({
  fullName: z.string().trim().min(2, "שם מלא הוא שדה חובה").max(100, "שם מלא ארוך מדי"),
  phone: z.string().trim().min(6, "טלפון הוא שדה חובה").max(20, "טלפון ארוך מדי"),
  birthDate: z.string().trim().min(4, "תאריך לידה הוא שדה חובה").max(20, "תאריך לידה ארוך מדי"),
  idNumber: z.string().trim().min(5, "תעודת זהות היא שדה חובה").max(20, "תעודת זהות ארוכה מדי"),
  notes: z.string().trim().max(2000, "הערות ארוכות מדי").optional(),
});

const Tirosh = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
      const { error } = await supabase.functions.invoke("send-tirosh-lead", {
        body: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          birthDate: formData.birthDate.trim(),
          idNumber: formData.idNumber.trim(),
          notes: formData.notes?.trim() || "",
        },
      });

      if (error) throw error;

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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur">
          <div className="border-b border-slate-200 px-6 py-5 text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0b4e86]">טופס ליד - תירוש</h1>
            <p className="mt-2 text-sm text-slate-500">מלא את הפרטים ונחזור אליך בהקדם</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6" dir="rtl">
            <div>
              <Input
                name="fullName"
                placeholder="שם מלא *"
                value={formData.fullName}
                onChange={handleChange}
                className={`bg-background text-right ${errors.fullName ? "border-destructive" : ""}`}
                style={{ direction: "rtl", textAlign: "right" }}
                disabled={isLoading}
              />
              {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <Input
                name="phone"
                type="tel"
                placeholder="טלפון *"
                value={formData.phone}
                onChange={handleChange}
                className={`bg-background text-right ${errors.phone ? "border-destructive" : ""}`}
                style={{ direction: "rtl", textAlign: "right" }}
                disabled={isLoading}
              />
              {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Input
                name="birthDate"
                type="date"
                placeholder="תאריך לידה *"
                value={formData.birthDate}
                onChange={handleChange}
                className={`bg-background text-right ${errors.birthDate ? "border-destructive" : ""}`}
                style={{ direction: "rtl", textAlign: "right" }}
                disabled={isLoading}
              />
              {errors.birthDate && <p className="text-destructive text-sm mt-1">{errors.birthDate}</p>}
            </div>

            <div>
              <Input
                name="idNumber"
                inputMode="numeric"
                placeholder="תעודת זהות *"
                value={formData.idNumber}
                onChange={handleIdChange}
                className={`bg-background text-right ${errors.idNumber ? "border-destructive" : ""}`}
                style={{ direction: "rtl", textAlign: "right" }}
                disabled={isLoading}
              />
              {errors.idNumber && <p className="text-destructive text-sm mt-1">{errors.idNumber}</p>}
            </div>

            <div>
              <Textarea
                name="notes"
                placeholder="הערות"
                value={formData.notes}
                onChange={handleChange}
                className={`bg-background min-h-[120px] text-right ${errors.notes ? "border-destructive" : ""}`}
                style={{ direction: "rtl", textAlign: "right" }}
                disabled={isLoading}
              />
              {errors.notes && <p className="text-destructive text-sm mt-1">{errors.notes}</p>}
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              className="w-full"
              style={{ background: "#4ade80", color: "#1a5a5a" }}
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default Tirosh;
