import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomerForm, AdditionalCustomer, StatusType } from "@/components/buyinsnew/types";
import { isValidIsraeliId, cn, splitNameHe, sortCustomersByBirthDate, calculateAge } from "@/components/buyinsnew/utils";
import { Chip } from "@/components/buyinsnew/Chip";
import { CustomerCard } from "@/components/buyinsnew/CustomerCard";
import { AdditionalCustomersModal } from "@/components/buyinsnew/AdditionalCustomersModal";

const BuyInsNew = () => {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [shatapName, setShatapName] = useState<string>("אופיר מיוחד 20");
  const [status, setStatus] = useState<StatusType>({ type: "idle", text: "" });

  const [customers, setCustomers] = useState<CustomerForm[]>([
    { id: "", gender: "", firstNameHe: "", lastNameHe: "", firstNameEn: "", lastNameEn: "", birthDate: "", email: "", phone: "" },
  ]);

  const [additionalCustomers, setAdditionalCustomers] = useState<AdditionalCustomer[]>([]);
  const [selectedAdditionalCustomers, setSelectedAdditionalCustomers] = useState<Set<string>>(new Set());
  const [showAdditionalCustomersModal, setShowAdditionalCustomersModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [idValidationErrors, setIdValidationErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadShatapName = async () => {
      const params = new URLSearchParams(window.location.search);
      const shatapId = params.get("aff") || params.get("shatapId") || params.get("id");
      if (!shatapId) return;

      try {
        const { data, error } = await supabase.functions.invoke("shatap", {
          body: null,
          headers: {},
        });
        
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shatap?id=${encodeURIComponent(shatapId)}`;
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json" },
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.name) setShatapName(data.name);
        }
      } catch (error) {
        console.error("Error loading shatap name:", error);
      }
    };
    loadShatapName();
  }, []);

  const chip = useMemo(() => {
    if (status.type === "checking") return <Chip tone="info">בודק במערכת…</Chip>;
    if (status.type === "ok") return <Chip tone="success">{status.text}</Chip>;
    if (status.type === "notfound") return <Chip tone="warning">{status.text}</Chip>;
    if (status.type === "error") return <Chip tone="danger">{status.text}</Chip>;
    return null;
  }, [status]);

  const clearCustomerErrors = (customerIndex: number) => {
    setValidationErrors((prev) => { const updated = { ...prev }; delete updated[customerIndex]; return updated; });
    setIdValidationErrors((prev) => { const updated = { ...prev }; delete updated[customerIndex]; return updated; });
  };

  const validateIdRealTime = (idValue: string, customerIndex: number) => {
    const cleanId = idValue.replace(/[^\d]/g, "");
    if (cleanId.length === 0 || cleanId.length < 9) {
      setIdValidationErrors((prev) => { const updated = { ...prev }; delete updated[customerIndex]; return updated; });
      return;
    }
    if (cleanId.length === 9 && !isValidIsraeliId(cleanId)) {
      setIdValidationErrors((prev) => ({ ...prev, [customerIndex]: "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת" }));
    } else {
      setIdValidationErrors((prev) => { const updated = { ...prev }; delete updated[customerIndex]; return updated; });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<number, string[]> = {};
    let isValid = true;

    customers.forEach((customer, index) => {
      const customerErrors: string[] = [];
      const customerId = index === 0 ? id : customer.id;

      if (!customer.gender) { customerErrors.push("מין הנוסע הוא שדה חובה"); isValid = false; }

      const cleanCustomerId = customerId.replace(/[^\d]/g, "");
      if (!customerId || customerId.trim() === "") {
        customerErrors.push("תעודת זהות היא שדה חובה"); isValid = false;
      } else if (cleanCustomerId.length !== 9) {
        customerErrors.push("תעודת זהות חייבת להכיל 9 ספרות"); isValid = false;
      } else if (!isValidIsraeliId(cleanCustomerId)) {
        customerErrors.push("תעודת זהות לא תקינה"); isValid = false;
      }

      if (!customer.birthDate) { customerErrors.push("תאריך לידה הוא שדה חובה"); isValid = false; }
      if (!customer.firstNameEn?.trim()) { customerErrors.push("שם פרטי באנגלית הוא שדה חובה"); isValid = false; }
      if (!customer.lastNameEn?.trim()) { customerErrors.push("שם משפחה באנגלית הוא שדה חובה"); isValid = false; }

      const age = calculateAge(customer.birthDate);
      const isContactRequired = age === null || age >= 18;
      if (isContactRequired) {
        if (!customer.email?.trim()) { customerErrors.push("דואר אלקטרוני הוא שדה חובה לנוסעים מעל גיל 18"); isValid = false; }
        if (!customer.phone?.trim()) { customerErrors.push("טלפון נייד הוא שדה חובה לנוסעים מעל גיל 18"); isValid = false; }
      }

      if (customerErrors.length > 0) errors[index] = customerErrors;
    });

    setValidationErrors(errors);
    return isValid;
  };

  useEffect(() => {
    const clean = id.replace(/[^\d]/g, "");
    if (clean.length < 9) { setStatus({ type: "idle", text: "" }); return; }
    if (clean.length !== 9) return;
    if (!isValidIsraeliId(clean)) {
      setStatus({ type: "error", text: "ת״ז לא תקינה" });
      setIdValidationErrors((prev) => ({ ...prev, [0]: "תעודת זהות לא תקינה" }));
      return;
    } else {
      setIdValidationErrors((prev) => { const updated = { ...prev }; delete updated[0]; return updated; });
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setStatus({ type: "checking", text: "בודק במערכת…" });

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/policy-get-by-id?id=${encodeURIComponent(clean)}`;
        const res = await fetch(url, { headers: { "Content-Type": "application/json" } });

        let json: any = null;
        try { json = await res.json(); } catch { setStatus({ type: "error", text: "תגובה לא תקינה מהשרת" }); return; }
        if (!res.ok) { setStatus({ type: "error", text: "שגיאה בבדיקה" }); return; }

        const customer = json.customer;
        if (customer && json.found) {
          const fullName = customer.primaryName || "";
          const split = splitNameHe(fullName);

          setCustomers((prev) => {
            const updated = [...prev];
            updated[0] = {
              ...updated[0],
              id: clean,
              gender: updated[0].gender || customer.gender || "",
              firstNameHe: updated[0].firstNameHe || split.first || "",
              lastNameHe: updated[0].lastNameHe || split.last || "",
              firstNameEn: updated[0].firstNameEn || customer.firstNameEn || "",
              lastNameEn: updated[0].lastNameEn || customer.lastNameEn || "",
              birthDate: updated[0].birthDate || customer.birthDate || "",
              email: updated[0].email || customer.email || "",
              phone: updated[0].phone || customer.phone || "",
            };
            return updated;
          });

          const allCustomersFromApi: AdditionalCustomer[] = json.allCustomers || [];
          const normalizedCurrentId = clean.padStart(9, "0");
          const additional = allCustomersFromApi.filter((c) => {
            const custId = String(c.personId || "").padStart(9, "0");
            return custId !== normalizedCurrentId && custId.length === 9;
          });

          setAdditionalCustomers(additional);
          setSelectedAdditionalCustomers(new Set());
          if (additional.length > 0) setShowAdditionalCustomersModal(true);

          setStatus({ type: "ok", text: `נמצא במערכת · ${fullName || ""}` });
        } else {
          setStatus({ type: "notfound", text: "לא נמצא — מלא ידנית" });
          setAdditionalCustomers([]);
        }
      } catch { setStatus({ type: "error", text: "שגיאת רשת" }); }
      finally { setLoading(false); }
    }, 450);

    return () => clearTimeout(t);
  }, [id]);

  return (
    <div dir="rtl" className="min-h-screen">
      <div className="fixed inset-0 -z-10">
        <img src="/buyinsnew/background2.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/30 bg-white/85 backdrop-blur-xl">
        <div className="bg-[#0b4e86] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-center w-full">
          <div className="mx-auto max-w-4xl w-full flex items-center justify-between">
            <div className="h-10 sm:h-12 flex items-center">
              <img src="/buyinsnew/HeaderLogo.png" alt="אופיר ביטוח" className="h-full w-auto object-contain" />
            </div>
            <div className="text-white text-sm sm:text-base font-medium">{shatapName}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-3 sm:px-4 py-2 sm:py-3">
        <div className="text-center mb-2 sm:mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">רכישת ביטוח נסיעות לחו״ל</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">נשמח להכיר את הנוסעים שנבטח הפעם</p>
        </div>

        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3 sm:mb-4">
            <div className="flex items-center gap-2">{chip}</div>
            <div className="flex items-center gap-2">
              {additionalCustomers.length > 0 && !showAdditionalCustomersModal && (
                <button type="button" onClick={() => setShowAdditionalCustomersModal(true)} className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  הוסף מבוטחים נוספים ({additionalCustomers.length})
                </button>
              )}
              {loading && <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500"><span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />טוען</span>}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {customers.map((customer, index) => (
              <CustomerCard key={index} customer={customer} index={index} id={id} setId={setId} setCustomers={setCustomers} validationErrors={validationErrors} idValidationErrors={idValidationErrors} clearCustomerErrors={clearCustomerErrors} validateIdRealTime={validateIdRealTime} />
            ))}
          </div>

          <div className="mt-2 sm:mt-3 mx-auto max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <button type="button" onClick={() => setCustomers((prev) => prev.length >= 10 ? prev : sortCustomersByBirthDate([...prev, { id: "", gender: "", firstNameHe: "", lastNameHe: "", firstNameEn: "", lastNameEn: "", birthDate: "", email: "", phone: "" }]))} disabled={customers.length >= 10} className={cn("h-10 w-10 rounded-full text-white flex items-center justify-center transition shadow-sm hover:shadow-md flex-shrink-0", customers.length >= 10 ? "bg-slate-300 cursor-not-allowed" : "bg-[#0b4e86] hover:bg-[#0a3d6b]")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <span className="text-sm font-medium text-slate-900">להוספת נוסע/ת</span>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-[0_10px_30px_-15px_rgba(2,6,23,.25)] p-3 sm:p-4">
              <div className="mb-4 text-center">
                <p className="text-sm font-medium text-[#0b4e86] leading-relaxed">אפשר לרכוש את הביטוח הזה אך ורק כאשר המבוטח נמצא בישראל.</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                {Object.keys(validationErrors).length > 0 && (
                  <div className="w-full rounded-lg bg-rose-50 border border-rose-200 p-3">
                    <div className="text-sm font-bold text-rose-900 mb-2">נא למלא את כל השדות החובה</div>
                  </div>
                )}
                <button type="button" onClick={() => { if (validateForm()) window.open("https://www.harel-group.co.il", "_blank"); }} className="w-full sm:w-auto min-w-[280px] rounded-xl px-5 py-3 text-base font-bold transition shadow-sm hover:shadow-md bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0b4e86]">
                  המשך תהליך באתר הראל
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-xs font-medium text-slate-500">© {new Date().getFullYear()} Ophir Insurance</div>
        </div>
      </main>

      {additionalCustomers.length > 0 && showAdditionalCustomersModal && (
        <AdditionalCustomersModal additionalCustomers={additionalCustomers} setAdditionalCustomers={setAdditionalCustomers} selectedAdditionalCustomers={selectedAdditionalCustomers} setSelectedAdditionalCustomers={setSelectedAdditionalCustomers} customers={customers} setCustomers={setCustomers} onClose={() => setShowAdditionalCustomersModal(false)} />
      )}
    </div>
  );
};

export default BuyInsNew;
