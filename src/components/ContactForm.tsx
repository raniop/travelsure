import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(100, "שם ארוך מדי"),
  email: z.string().trim().email("כתובת אימייל לא תקינה").max(255, "אימייל ארוך מדי"),
  phone: z.string().trim().max(20, "מספר טלפון ארוך מדי").optional(),
  message: z.string().trim().min(10, "ההודעה חייבת להכיל לפחות 10 תווים").max(1000, "ההודעה ארוכה מדי"),
});

const ContactForm = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = contactSchema.safeParse(formData);
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
      let sent = false;
      try {
        const { error } = await supabase.functions.invoke("send-contact-email", {
          body: formData,
        });
        if (!error) {
          sent = true;
        }
      } catch {
        sent = false;
      }

      if (!sent) {
        const fallback = await fetch("/api-contact.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!fallback.ok) {
          throw new Error("Fallback failed");
        }
      }

      toast({
        title: "ההודעה נשלחה בהצלחה!",
        description: "נחזור אליך בהקדם האפשרי.",
      });

      // Reset form
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: "אנא נסה שוב מאוחר יותר או צור קשר בטלפון.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div>
        <Input
          name="name"
          placeholder="שם מלא *"
          value={formData.name}
          onChange={handleChange}
          className={`bg-background text-right ${errors.name ? "border-destructive" : ""}`}
          style={{ direction: "rtl", textAlign: "right" }}
          disabled={isLoading}
        />
        {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <Input
          name="email"
          type="email"
          placeholder="אימייל *"
          value={formData.email}
          onChange={handleChange}
          className={`bg-background text-right ${errors.email ? "border-destructive" : ""}`}
          style={{ direction: "rtl", textAlign: "right" }}
          disabled={isLoading}
        />
        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <Input
          name="phone"
          type="tel"
          placeholder="טלפון"
          value={formData.phone}
          onChange={handleChange}
          className={`bg-background text-right ${errors.phone ? "border-destructive" : ""}`}
          style={{ direction: "rtl", textAlign: "right" }}
          disabled={isLoading}
        />
        {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Textarea
          name="message"
          placeholder="ההודעה שלך *"
          value={formData.message}
          onChange={handleChange}
          className={`bg-background min-h-[120px] text-right ${errors.message ? "border-destructive" : ""}`}
          style={{ direction: "rtl", textAlign: "right" }}
          disabled={isLoading}
        />
        {errors.message && <p className="text-destructive text-sm mt-1">{errors.message}</p>}
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
            שלח הודעה
          </>
        )}
      </Button>
    </form>
  );
};

export default ContactForm;
