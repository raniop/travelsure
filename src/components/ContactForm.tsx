import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { agencyBtnPrimary, agencyField, agencyLabel } from "@/components/AgencyUi";

const contactSchema = z.object({
  name: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(100, "שם ארוך מדי"),
  email: z.string().trim().email("כתובת אימייל לא תקינה").max(255, "אימייל ארוך מדי"),
  phone: z.string().trim().max(20, "מספר טלפון ארוך מדי").optional(),
  message: z.string().trim().min(10, "ההודעה חייבת להכיל לפחות 10 תווים").max(1000, "ההודעה ארוכה מדי"),
});

const errorFieldClass = "!border-[#B42318]";
const errorTextClass = "m-0 text-[15px] font-semibold text-[#B42318]";

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
        const fallback = await fetch("/api-contact.ashx", {
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
    } catch (error: unknown) {
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

  const fieldProps = (name: keyof typeof formData) => ({
    id: `contact-${name}`,
    name,
    value: formData[name],
    onChange: handleChange,
    disabled: isLoading,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  const fieldError = (name: keyof typeof formData) =>
    errors[name] ? (
      <p id={`contact-${name}-error`} className={errorTextClass}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" dir="rtl">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-name" className={agencyLabel}>
          שם מלא *
        </label>
        <input
          {...fieldProps("name")}
          type="text"
          autoComplete="name"
          className={`${agencyField} text-right ${errors.name ? errorFieldClass : ""}`}
        />
        {fieldError("name")}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-email" className={agencyLabel}>
          אימייל *
        </label>
        <input
          {...fieldProps("email")}
          type="email"
          autoComplete="email"
          dir="ltr"
          className={`${agencyField} text-right ${errors.email ? errorFieldClass : ""}`}
        />
        {fieldError("email")}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-phone" className={agencyLabel}>
          טלפון
        </label>
        <input
          {...fieldProps("phone")}
          type="tel"
          autoComplete="tel"
          dir="ltr"
          className={`${agencyField} text-right ${errors.phone ? errorFieldClass : ""}`}
        />
        {fieldError("phone")}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className={agencyLabel}>
          ההודעה שלך *
        </label>
        <textarea
          {...fieldProps("message")}
          rows={5}
          className={`${agencyField} min-h-[140px] resize-y py-3 text-right ${errors.message ? errorFieldClass : ""}`}
        />
        {fieldError("message")}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`${agencyBtnPrimary} w-full cursor-pointer border-0 font-[inherit] disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {isLoading ? (
          <>
            <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
            שולח...
          </>
        ) : (
          <>
            <Send aria-hidden="true" className="h-5 w-5" />
            שלח הודעה
          </>
        )}
      </button>
    </form>
  );
};

export default ContactForm;
