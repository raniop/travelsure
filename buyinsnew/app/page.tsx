"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

/** ========= Utils ========= */
const BASE_PATH = "/buyinsnew";

// Helper function לנתיבי API עם basePath
function getApiPath(path: string): string {
  // אם הנתיב כבר מתחיל ב-basePath, לא נוסיף אותו שוב
  if (path.startsWith(BASE_PATH)) return path;
  // אם הנתיב מתחיל ב-/, נוסיף את basePath
  if (path.startsWith("/")) return `${BASE_PATH}${path}`;
  // אחרת, נוסיף את basePath ו-/
  return `${BASE_PATH}/${path}`;
}

// Helper function לנתיבי תמונות/static assets עם basePath
function getAssetPath(path: string): string {
  // אם הנתיב כבר מתחיל ב-basePath, לא נוסיף אותו שוב
  if (path.startsWith(BASE_PATH)) return path;
  // אם הנתיב מתחיל ב-/, נוסיף את basePath
  if (path.startsWith("/")) return `${BASE_PATH}${path}`;
  // אחרת, נוסיף את basePath ו-/
  return `${BASE_PATH}/${path}`;
}

function isValidIsraeliId(id: string) {
  const s = id.trim().padStart(9, "0");
  if (!/^\d{9}$/.test(s)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

function cn(...x: Array<string | false | undefined | null>) {
  return x.filter(Boolean).join(" ");
}

function fmtDateToInput(d?: string | null) {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

function isoToDDMMYYYY(iso: string) {
  if (!iso) return "";
  // תופס yyyy-mm-dd
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso; // אם זה כבר טקסט חופשי, נשאיר
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function ddmmyyyyToISO(input: string) {
  const v = input.trim();
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  // ולידציה בסיסית
  if (yyyy < 1900 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  // ולידציה אמיתית עם Date
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${yyyy}-${pad(mm)}-${pad(dd)}`;
}

function splitNameHe(full?: string | null) {
  const name = (full || "").trim();
  if (!name) return { first: "", last: "" };
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

function sortCustomersByBirthDate<T extends { birthDate: string; lastNameHe?: string; lastNameEn?: string }>(customers: T[]): T[] {
  // ממיין קודם לפי שם משפחה, ואז לפי תאריך לידה - מהקטן לגדול (כלומר מהגדול לקטן בגיל)
  // הנוסע הראשון (index 0) נשאר במקומו
  if (customers.length <= 1) return customers;
  
  const [first, ...rest] = customers;
  
  // ממיין את השאר קודם לפי שם משפחה, ואז לפי תאריך לידה
  const sorted = [...rest].sort((a, b) => {
    // קודם מיון לפי שם משפחה
    const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
    const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();
    
    if (lastNameA && lastNameB) {
      const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }
    } else if (lastNameA && !lastNameB) {
      return -1; // A קודם
    } else if (!lastNameA && lastNameB) {
      return 1; // B קודם
    }
    
    // אם שם המשפחה זהה או אין שם משפחה, ממיינים לפי תאריך לידה
    const dateA = a.birthDate || "";
    const dateB = b.birthDate || "";
    
    // אם אין תאריך לידה, מניחים אותו בסוף
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // תאריך קטן יותר = גיל גדול יותר, אז ממיינים מהקטן לגדול
    return dateA.localeCompare(dateB);
  });
  
  return [first, ...sorted];
}



/** ========= Types ========= */

/** ========= UI Bits ========= */
function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  const map = {
    neutral: "bg-white/70 text-slate-700 ring-1 ring-slate-200/70",
    success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
    warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
    danger: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/70",
    info: "bg-sky-50 text-sky-900 ring-1 ring-sky-200/70",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function FieldLabel({
  required,
  children,
}: {
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
      {required ? <span className="text-rose-500">*</span> : null}
      <span>{children}</span>
    </div>
  );
}

function Input({
  dir,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { dir?: "rtl" | "ltr" }) {
  return (
    <input
      {...props}
      dir={dir}
      className={cn(
        "w-full bg-transparent px-0 py-2 text-sm text-slate-900 text-right",
        "border-b border-slate-300",
        "placeholder:text-slate-400/60 placeholder:text-xs",
        "focus:outline-none focus:border-b-2 focus:border-sky-500",
        "transition-all duration-200",
        dir === "ltr" ? "text-left" : "",
        className
      )}
    />
  );
}

function FloatingInput({
  label,
  dir = "rtl",
  className,
  value,
  type,
  align,
  focusPlaceholder,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  dir?: "rtl" | "ltr";
  label?: React.ReactNode;
  align?: "left" | "right";
  focusPlaceholder?: string;
}) {
  const inputType = type ?? "text";
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = hasValue || isFocused;

  const effectiveDir = dir || "rtl";
  const effectiveAlign =
    props.style?.textAlign
      ? (props.style.textAlign as any)
      : (align ?? (effectiveDir === "ltr" ? "left" : "right"));

  return (
    <div className="relative w-[92%] ml-auto sm:w-full">
      <input
        {...props}
        type={inputType}
        value={value}
        dir={effectiveDir}
        style={{
          textAlign: effectiveAlign,
          direction: effectiveDir,
          ...props.style,
        }}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "w-full h-11 bg-transparent px-0 pt-6 pb-0.5 text-base sm:text-sm text-slate-900",
          "border-b border-slate-300",
          "focus:outline-none focus:border-b-2 focus:border-sky-500",
          "transition-all duration-200",
          className
        )}
        placeholder={
          hasValue
            ? undefined
            : (isFocused ? (focusPlaceholder ?? props.placeholder ?? "") : "")
        }
      />
      {label && (
        <label
          className={cn(
            "absolute w-full pointer-events-none transition-all duration-200",
            "right-0 left-auto text-right"
          )}
          style={
            shouldFloat
              ? {
                  bottom: "0",
                  transform: "translateY(calc(-100% - 0.375rem))",
                  fontSize: "0.75rem",
                  color: "#64748b",
                  lineHeight: "1rem",
                }
              : {
                  bottom: "0px",
                  fontSize: "0.875rem",
                  color: "#94a3b8",
                  lineHeight: "1.25rem",
                  transform: "translateY(0)",
                }
          }
        >
          {label}
        </label>
      )}
    </div>
  );
}

function GenderToggle({
  value,
  onChange,
}: {
  value: "M" | "F" | "";
  onChange: (v: "M" | "F") => void;
}) {
  const item = (v: "M" | "F", title: string) => {
    const selected = value === v;
    return (
      <button
        type="button"
        onClick={() => onChange(v)}
        className={cn(
          "group aspect-square rounded-lg bg-white p-3 sm:p-4 text-center transition-all",
          "border shadow-sm hover:shadow-md flex-shrink-0 box-border",
          selected
            ? "border-sky-400 ring-2 ring-sky-200"
            : "border-slate-200 hover:border-slate-300"
        )}
        style={{ width: "105px", height: "105px", aspectRatio: "1 / 1", boxSizing: "border-box" }}
      >
        <div className="flex flex-col items-center justify-center gap-2 h-full">
          <div
            className={cn(
              "aspect-square h-10 w-10 sm:h-12 sm:w-12 rounded-full grid place-items-center border-2 transition-all flex-shrink-0",
              selected
                ? "border-sky-400 bg-sky-50"
                : "border-sky-300 bg-sky-50"
            )}
            aria-hidden="true"
            style={{ aspectRatio: "1 / 1" }}
          >
            {v === "F" ? (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2"
                className="text-sky-600"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Z" />
                <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
                <path d="M12 21v-4" strokeLinecap="round" />
                <path d="M10 19h4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2"
                className="text-sky-600"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Z" />
                <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div className="text-sm sm:text-base font-medium text-[#0b4e86]">
            {title}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5" style={{ width: "fit-content" }}>
      {item("F", "נוסעת")}
      {item("M", "נוסע")}
    </div>
  );
}

/** ========= Page ========= */
export default function Home() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [shatapName, setShatapName] = useState<string>("");
  const [status, setStatus] = useState<
    | { type: "idle"; text: string }
    | { type: "checking"; text: string }
    | { type: "ok"; text: string }
    | { type: "notfound"; text: string }
    | { type: "error"; text: string }
  >({ type: "idle", text: "" });

  type CustomerForm = {
    id: string;
    gender: "M" | "F" | "";
    firstNameHe: string;
    lastNameHe: string;
    firstNameEn: string;
    lastNameEn: string;
    birthDate: string;
    email: string;
    phone: string;
  };

  const [customers, setCustomers] = useState<CustomerForm[]>([
    {
      id: "",
      gender: "",
      firstNameHe: "",
      lastNameHe: "",
      firstNameEn: "",
      lastNameEn: "",
      birthDate: "",
      email: "",
      phone: "",
    },
  ]);

  type AdditionalCustomer = {
    personId: string;
    primaryName: string;
    firstNameHe: string;
    lastNameHe: string;
    firstNameEn: string;
    lastNameEn: string;
    gender: "M" | "F" | "";
    birthDate: string;
    email: string;
    phone: string;
  };

  const [additionalCustomers, setAdditionalCustomers] = useState<AdditionalCustomer[]>([]);
  const [selectedAdditionalCustomers, setSelectedAdditionalCustomers] = useState<Set<string>>(new Set());
  const [showAdditionalCustomersModal, setShowAdditionalCustomersModal] = useState(false);
  const [removingCustomerIndex, setRemovingCustomerIndex] = useState<number | null>(null);
  const [previousCustomerIds, setPreviousCustomerIds] = useState<Record<number, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [idValidationErrors, setIdValidationErrors] = useState<Record<number, string>>({});

  // טעינת שם השת"פ מה-URL - מותאם לביצועים
  useEffect(() => {
    const loadShatapName = async () => {
      const params = new URLSearchParams(window.location.search);
      const shatapId = params.get("aff") || params.get("shatapId") || params.get("id");

      if (!shatapId) {
        setShatapName("");
        return;
      }

      // קביעת ה-URL הנכון בהתאם לסביבה
      const isLocalhost = typeof window !== 'undefined' && 
                         (window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname.includes('lovable') ||
                          window.location.hostname.includes('lovable.dev'));
      
      const apiUrl = isLocalhost 
        ? `/api/shatap?id=${encodeURIComponent(shatapId)}`
        : getApiPath(`/api/shatap?id=${encodeURIComponent(shatapId)}`);

      // fetch עם timeout קצר יותר
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 שניות timeout

      try {
        const res = await fetch(apiUrl, {
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            setShatapName(data.name);
            return;
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        // אם יש שגיאה, פשוט לא נציג שם שת"פ
        if (error.name !== 'AbortError') {
          // רק log שגיאות שאינן timeout
        }
      }
      
      // אם נכשל, לא נציג שם שת"פ
      setShatapName("");
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

  // פונקציה לניקוי שגיאות עבור נוסע מסוים
  const clearCustomerErrors = (customerIndex: number) => {
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[customerIndex];
      return updated;
    });
    setIdValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[customerIndex];
      return updated;
    });
  };

  // פונקציה לבדיקת תעודת זהות בזמן אמת
  const validateIdRealTime = (idValue: string, customerIndex: number) => {
    const cleanId = idValue.replace(/[^\d]/g, "");
    
    // אם השדה ריק, אין שגיאה
    if (cleanId.length === 0) {
      setIdValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[customerIndex];
        return updated;
      });
      return;
    }

    // אם יש פחות מ-9 ספרות, אין שגיאה עדיין (המשתמש עדיין מקליד)
    if (cleanId.length < 9) {
      setIdValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[customerIndex];
        return updated;
      });
      return;
    }

    // אם יש בדיוק 9 ספרות, בודקים את תקינות התעודת זהות
    if (cleanId.length === 9) {
      // בדיקה אם תעודת הזהות כבר קיימת אצל נוסע אחר
      const normalizedId = cleanId.padStart(9, "0");
      const isDuplicate = customers.some((c, idx) => {
        if (idx === customerIndex) return false; // מדלגים על הנוסע הנוכחי
        const currentCustomerId = idx === 0 ? id : c.id;
        const normalizedCurrentId = String(currentCustomerId || "").replace(/[^\d]/g, "").padStart(9, "0");
        return normalizedCurrentId === normalizedId && normalizedCurrentId.length === 9;
      });

      if (isDuplicate) {
        setIdValidationErrors((prev) => ({
          ...prev,
          [customerIndex]: "תעודת זהות זו כבר קיימת אצל נוסע אחר",
        }));
        return;
      }

      if (!isValidIsraeliId(cleanId)) {
        setIdValidationErrors((prev) => ({
          ...prev,
          [customerIndex]: "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת",
        }));
      } else {
        setIdValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[customerIndex];
          return updated;
        });
      }
    }
  };

  // פונקציית בדיקת שדות חובה
  const validateForm = (): boolean => {
    const errors: Record<number, string[]> = {};
    let isValid = true;

    customers.forEach((customer, index) => {
      const customerErrors: string[] = [];
      const customerId = index === 0 ? id : customer.id;

      // בדיקת מין הנוסע
      if (!customer.gender) {
        customerErrors.push("מין הנוסע הוא שדה חובה");
        isValid = false;
      }

      // בדיקת תעודת זהות
      const cleanCustomerId = customerId.replace(/[^\d]/g, "");
      if (!customerId || customerId.trim() === "") {
        customerErrors.push("תעודת זהות היא שדה חובה");
        isValid = false;
      } else if (cleanCustomerId.length !== 9) {
        customerErrors.push("תעודת זהות חייבת להכיל 9 ספרות");
        isValid = false;
        setIdValidationErrors((prev) => ({
          ...prev,
          [index]: "תעודת זהות חייבת להכיל 9 ספרות",
        }));
      } else if (!isValidIsraeliId(cleanCustomerId)) {
        customerErrors.push("תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת");
        isValid = false;
        setIdValidationErrors((prev) => ({
          ...prev,
          [index]: "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת",
        }));
      } else {
        // בדיקה אם תעודת הזהות כבר קיימת אצל נוסע אחר
        const normalizedId = cleanCustomerId.padStart(9, "0");
        const isDuplicate = customers.some((c, idx) => {
          if (idx === index) return false; // מדלגים על הנוסע הנוכחי
          const otherCustomerId = idx === 0 ? id : c.id;
          const normalizedOtherId = String(otherCustomerId || "").replace(/[^\d]/g, "").padStart(9, "0");
          return normalizedOtherId === normalizedId && normalizedOtherId.length === 9;
        });

        if (isDuplicate) {
          customerErrors.push("תעודת זהות זו כבר קיימת אצל נוסע אחר");
          isValid = false;
          setIdValidationErrors((prev) => ({
            ...prev,
            [index]: "תעודת זהות זו כבר קיימת אצל נוסע אחר",
          }));
        } else {
          // אם התעודת זהות תקינה ולא כפולה, מנקים את שגיאת הוולידציה בזמן אמת
          setIdValidationErrors((prev) => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });
        }
      }

      // בדיקת תאריך לידה
      if (!customer.birthDate || customer.birthDate.trim() === "") {
        customerErrors.push("תאריך לידה הוא שדה חובה");
        isValid = false;
      }

      // בדיקת שם פרטי באנגלית
      if (!customer.firstNameEn || customer.firstNameEn.trim() === "") {
        customerErrors.push("שם פרטי באנגלית הוא שדה חובה");
        isValid = false;
      }

      // בדיקת שם משפחה באנגלית
      if (!customer.lastNameEn || customer.lastNameEn.trim() === "") {
        customerErrors.push("שם משפחה באנגלית הוא שדה חובה");
        isValid = false;
      }

      // בדיקת אימייל וטלפון (חובה רק אם הגיל >= 18)
      const age = calculateAge(customer.birthDate);
      const isContactRequired = age === null || age >= 18;

      if (isContactRequired) {
        if (!customer.email || customer.email.trim() === "") {
          customerErrors.push("דואר אלקטרוני הוא שדה חובה לנוסעים מעל גיל 18");
          isValid = false;
        } else {
          // בדיקת תקינות אימייל בסיסית
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(customer.email.trim())) {
            customerErrors.push("דואר אלקטרוני לא תקין");
            isValid = false;
          }
        }

        if (!customer.phone || customer.phone.trim() === "") {
          customerErrors.push("טלפון נייד הוא שדה חובה לנוסעים מעל גיל 18");
          isValid = false;
        } else {
          // בדיקת תקינות טלפון (לפחות 9 ספרות)
          const phoneDigits = customer.phone.replace(/[^\d]/g, "");
          if (phoneDigits.length < 9) {
            customerErrors.push("טלפון נייד חייב להכיל לפחות 9 ספרות");
            isValid = false;
          }
        }
      }

      if (customerErrors.length > 0) {
        errors[index] = customerErrors;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  // פונקציה משותפת לחיפוש במערכת
  const searchCustomerInSystem = async (customerId: string, customerIndex: number) => {
    const clean = customerId.replace(/[^\d]/g, "");

    if (clean.length < 9) {
      if (customerIndex === 0) {
        setStatus({ type: "idle", text: "" });
      }
      return;
    }

    if (clean.length !== 9) return;

    if (!isValidIsraeliId(clean)) {
      if (customerIndex === 0) {
        setStatus({ type: "error", text: "ת״ז לא תקינה" });
      }
      setIdValidationErrors((prev) => ({
        ...prev,
        [customerIndex]: "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת",
      }));
      return;
    } else {
      // אם התעודת זהות תקינה, מנקים את שגיאת הוולידציה בזמן אמת
      setIdValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[customerIndex];
        return updated;
      });
    }

    const t = setTimeout(async () => {
      try {
        // הגדרת loading לכל נוסע
        setLoading((prev) => ({ ...prev, [customerIndex]: true }));
        if (customerIndex === 0) {
          setStatus({ type: "checking", text: "בודק במערכת…" });
        }

        // יצירת AbortController ל-timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 שניות timeout

        const res = await fetch(getApiPath(`/api/policy-get-by-id?id=${encodeURIComponent(clean)}`), {
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let json: any = null;
        try {
          json = await res.json();
        } catch {
          if (customerIndex === 0) {
            setStatus({ type: "error", text: "תגובה לא תקינה מהשרת" });
          }
          return;
        }

        if (!res.ok) {
          if (customerIndex === 0) {
            setStatus({ type: "error", text: "שגיאה בבדיקה" });
          }
          return;
        }

        // ✅ השתמש ב-customer שמגיע מה-API
        const customer = json.customer;

        if (customer && json.found) {
          const fullName = customer.primaryName || "";
          // אם יש שמות נפרדים - השתמש בהם, אחרת חלק את השם המלא
          const firstNameHe = customer.firstNameHe || "";
          const lastNameHe = customer.lastNameHe || "";
          const split = (!firstNameHe && !lastNameHe && fullName) ? splitNameHe(fullName) : { first: firstNameHe, last: lastNameHe };

          // ✅ המגדר כבר מנורמל ב-API (M/F או "")
          const gender = customer.gender || "";

          // בדיקה אם תעודת הזהות השתנתה
          const previousId = previousCustomerIds[customerIndex] || "";
          const idChanged = previousId !== clean;

          // ✅ ממלא אוטומטית את הלקוח (ראשון או נוסף) מיד - ללא המתנה!
          setCustomers((prev) => {
            const updated = [...prev];
            if (customerIndex === 0) {
              // עבור הנוסע הראשון
              if (updated.length === 0) {
                updated.push({
                  id: clean,
                  gender: (gender as "M" | "F" | "") || "",
                  firstNameHe: split.first || "",
                  lastNameHe: split.last || "",
                  firstNameEn: customer.firstNameEn || "",
                  lastNameEn: customer.lastNameEn || "",
                  birthDate: customer.birthDate || "",
                  email: customer.email || "",
                  phone: customer.phone || "",
                });
              } else {
                // אם תעודת הזהות השתנתה, דורס את כל הנתונים
                if (idChanged) {
                  updated[0] = {
                    id: clean,
                    gender: (gender as "M" | "F" | "") || "",
                    firstNameHe: split.first || "",
                    lastNameHe: split.last || "",
                    firstNameEn: customer.firstNameEn || "",
                    lastNameEn: customer.lastNameEn || "",
                    birthDate: customer.birthDate || "",
                    email: customer.email || "",
                    phone: customer.phone || "",
                  };
                } else {
                  // אם תעודת הזהות לא השתנתה, מעדכן רק שדות ריקים
                  updated[0] = {
                    ...updated[0],
                    id: clean,
                    gender: updated[0].gender || (gender as "M" | "F" | "") || "",
                    firstNameHe: updated[0].firstNameHe || split.first || "",
                    lastNameHe: updated[0].lastNameHe || split.last || "",
                    firstNameEn: updated[0].firstNameEn || customer.firstNameEn || "",
                    lastNameEn: updated[0].lastNameEn || customer.lastNameEn || "",
                    birthDate: updated[0].birthDate || customer.birthDate || "",
                    email: updated[0].email || customer.email || "",
                    phone: updated[0].phone || customer.phone || "",
                  };
                }
              }
            } else {
              // עבור נוסעים נוספים
              if (updated.length <= customerIndex) {
                // אם אין מספיק נוסעים, מוסיף חדש
                while (updated.length <= customerIndex) {
                  updated.push({
                    id: "",
                    gender: "",
                    firstNameHe: "",
                    lastNameHe: "",
                    firstNameEn: "",
                    lastNameEn: "",
                    birthDate: "",
                    email: "",
                    phone: "",
                  });
                }
              }
              // אם תעודת הזהות השתנתה, דורס את כל הנתונים
              if (idChanged) {
                updated[customerIndex] = {
                  id: clean,
                  gender: (gender as "M" | "F" | "") || "",
                  firstNameHe: split.first || "",
                  lastNameHe: split.last || "",
                  firstNameEn: customer.firstNameEn || "",
                  lastNameEn: customer.lastNameEn || "",
                  birthDate: customer.birthDate || "",
                  email: customer.email || "",
                  phone: customer.phone || "",
                };
              } else {
                // אם תעודת הזהות לא השתנתה, מעדכן רק שדות ריקים
                updated[customerIndex] = {
                  ...updated[customerIndex],
                  id: clean,
                  gender: updated[customerIndex].gender || (gender as "M" | "F" | "") || "",
                  firstNameHe: updated[customerIndex].firstNameHe || split.first || "",
                  lastNameHe: updated[customerIndex].lastNameHe || split.last || "",
                  firstNameEn: updated[customerIndex].firstNameEn || customer.firstNameEn || "",
                  lastNameEn: updated[customerIndex].lastNameEn || customer.lastNameEn || "",
                  birthDate: updated[customerIndex].birthDate || customer.birthDate || "",
                  email: updated[customerIndex].email || customer.email || "",
                  phone: updated[customerIndex].phone || customer.phone || "",
                };
              }
            }
            return updated;
          });

          // עדכון תעודת הזהות הקודמת
          setPreviousCustomerIds((prev) => ({
            ...prev,
            [customerIndex]: clean,
          }));

          // ✅ מציג הודעה מיד - המשתמש רואה שהכל עובד!
          setLoading((prev) => ({ ...prev, [customerIndex]: false })); // מסיים את ה-loading מיד
          if (customerIndex === 0) {
            setStatus({ type: "ok", text: `נמצא במערכת · ${fullName || ""}` });

            // ✅ טוען לקוחות נוספים ברקע - לא חוסם את המשתמש!
            const allCustomersFromApi: AdditionalCustomer[] = json.allCustomers || [];
            const normalizedCurrentId = clean.padStart(9, "0");
            
            const additional = allCustomersFromApi.filter((c) => {
              const custId = String(c.personId || "").padStart(9, "0");
              return custId !== normalizedCurrentId && custId.length === 9;
            });

            // מעדכן את הלקוחות הנוספים ברקע
            setAdditionalCustomers(additional);
            setSelectedAdditionalCustomers(new Set());
            
            // אם יש לקוחות נוספים, פותח את המודאל אוטומטית
            if (additional.length > 0) {
              // עדכון ההודעה להוסיף מידע על לקוחות נוספים
              setTimeout(() => {
                setStatus({ type: "ok", text: `נמצא במערכת · ${fullName || ""} · ${additional.length} מבוטחים נוספים זמינים` });
                // פתיחת המודאל אוטומטית
                setShowAdditionalCustomersModal(true);
              }, 500);
            }
          }

          // ✅ סגירת מקלדת ואיפוס zoom במובייל (עבור כל הנוסעים) - רק אם הפרטים התמלאו
          // נבדוק אם באמת יש פרטים שמילאנו (שם פרטי/משפחה) - רק אז נסגור את המקלדת
          const hasFilledDataFromApi = (split.first || split.last || customer.firstNameEn || customer.lastNameEn || customer.birthDate || customer.email || customer.phone);
          // רק אם זה לא היה חיפוש ראשוני (previousId קיים) והפרטים התמלאו מהחיפוש, נסגור את המקלדת
          // כלומר - רק אם הפרטים התמלאו מהחיפוש ולא מהמשתמש עצמו, ואם זה לא חיפוש ראשוני
          const isNotFirstSearch = previousId !== ""; // אם previousId קיים, זה לא חיפוש ראשוני
          if (hasFilledDataFromApi && isNotFirstSearch) {
            setTimeout(() => {
              // סגירת המקלדת - blur על השדה הפעיל, אבל רק אם זה שדה תעודת זהות
              const activeElement = document.activeElement as HTMLElement;
              if (activeElement && 
                  (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
                  activeElement.getAttribute('maxlength') === '9') { // רק אם זה שדה תעודת זהות
                activeElement.blur();
              }
              // איפוס zoom במובייל - scroll קטן כדי לסגור את המקלדת
              if (window.visualViewport) {
                window.scrollTo({ top: window.scrollY, behavior: 'instant' });
              }
              // איפוס viewport scale במובייל - scroll קצר כדי לסגור מקלדת
              setTimeout(() => {
                window.scrollTo({ top: window.scrollY + 1, behavior: 'instant' });
                setTimeout(() => {
                  window.scrollTo({ top: window.scrollY - 1, behavior: 'instant' });
                }, 50);
              }, 100);
            }, 200);
          }
        } else {
          // אם לא נמצא במערכת, מנקים את הנתונים הקודמים אם תעודת הזהות השתנתה
          const previousId = previousCustomerIds[customerIndex] || "";
          const idChanged = previousId !== clean && previousId !== "";
          
          if (idChanged) {
            setCustomers((prev) => {
              const updated = [...prev];
              if (customerIndex === 0) {
                updated[0] = {
                  id: clean,
                  gender: "",
                  firstNameHe: "",
                  lastNameHe: "",
                  firstNameEn: "",
                  lastNameEn: "",
                  birthDate: "",
                  email: "",
                  phone: "",
                };
              } else {
                if (updated.length <= customerIndex) {
                  while (updated.length <= customerIndex) {
                    updated.push({
                      id: "",
                      gender: "",
                      firstNameHe: "",
                      lastNameHe: "",
                      firstNameEn: "",
                      lastNameEn: "",
                      birthDate: "",
                      email: "",
                      phone: "",
                    });
                  }
                }
                updated[customerIndex] = {
                  id: clean,
                  gender: "",
                  firstNameHe: "",
                  lastNameHe: "",
                  firstNameEn: "",
                  lastNameEn: "",
                  birthDate: "",
                  email: "",
                  phone: "",
                };
              }
              return updated;
            });
          }
          
          // עדכון תעודת הזהות הקודמת גם אם לא נמצא
          setPreviousCustomerIds((prev) => ({
            ...prev,
            [customerIndex]: clean,
          }));
          
          setLoading((prev) => ({ ...prev, [customerIndex]: false })); // מסיים את ה-loading
          if (customerIndex === 0) {
            setStatus({ type: "notfound", text: "לא נמצא — מלא ידנית" });
            setAdditionalCustomers([]);
            setSelectedAdditionalCustomers(new Set());
          }
        }
      } catch (error: any) {
        setLoading((prev) => ({ ...prev, [customerIndex]: false })); // מסיים את ה-loading גם במקרה של שגיאה
        if (customerIndex === 0) {
          if (error.name === 'AbortError') {
            setStatus({ type: "error", text: "הזמן הקצוב לבדיקה פג - נסה שוב" });
          } else {
            setStatus({ type: "error", text: "שגיאת רשת" });
          }
        }
      }
    }, 300); // הקטנתי מ-450ms ל-300ms - יותר מהיר

    return () => clearTimeout(t);
  };

  // useEffect עבור הנוסע הראשון
  useEffect(() => {
    searchCustomerInSystem(id, 0);
  }, [id]);

  // useEffect עבור נוסעים נוספים - מחפש במערכת כשמכניסים תעודת זהות
  useEffect(() => {
    const searchPromises: Array<() => void> = [];
    
    customers.forEach((customer, index) => {
      if (index > 0 && customer.id) {
        const cleanId = customer.id.replace(/[^\d]/g, "");
        if (cleanId.length === 9 && isValidIsraeliId(cleanId)) {
          // משתמש ב-debounce כדי לא לחפש יותר מדי פעמים
          const timeoutId = setTimeout(() => {
            searchCustomerInSystem(customer.id, index);
          }, 500);
          searchPromises.push(() => clearTimeout(timeoutId));
        }
      }
    });

    return () => {
      searchPromises.forEach(cleanup => cleanup());
    };
  }, [customers.map(c => `${c.id || ''}`).join('|')]);

  return (
    <div dir="rtl" className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10 min-h-full">
        {/* Background Image */}
        <img
          src={getAssetPath("/background2.png")}
          alt=""
          className="absolute inset-0 w-full h-full object-cover min-h-full"
        />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/30 bg-white/85 backdrop-blur-xl">
        {/* Dark blue top bar - full width */}
        <div className="bg-[#0b4e86] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-center w-full">
          <div className="mx-auto max-w-4xl w-full flex items-center justify-between">
            {/* Logo on the right (RTL) */}
            <div className="h-10 sm:h-12 flex items-center">
              <img
                src={getAssetPath("/HeaderLogo.png")}
                alt="אופיר ביטוח"
                className="h-full w-auto object-contain"
              />
            </div>
            {/* Text on the left (RTL) - מוצג רק אם יש שם שת"פ */}
            {shatapName && (
              <div className="text-white text-sm sm:text-base font-medium">{shatapName}</div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-3 sm:px-4 py-2 sm:py-3">
        <div className="text-center mb-2 sm:mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            רכישת ביטוח נסיעות לחו״ל
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            נשמח להכיר את הנוסעים שנבטח הפעם
          </p>
        </div>

        <div className="mx-auto max-w-sm sm:max-w-lg">
          {/* Header with status chips - above first customer card */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3 sm:mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {chip && (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium max-w-full truncate">
                  {chip}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {additionalCustomers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAdditionalCustomersModal(true)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 transition whitespace-nowrap"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  הוסף מבוטחים נוספים ({additionalCustomers.length})
                </button>
              )}
              {loading[0] ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                  טוען
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
          {customers.map((customer, index) => (
            <div 
              key={index} 
              data-customer-index={index}
              className={cn(
                "rounded-xl border backdrop-blur-xl shadow-[0_10px_30px_-15px_rgba(2,6,23,.25)] transition-all duration-300",
                validationErrors[index] && validationErrors[index].length > 0
                  ? "border-rose-300 bg-rose-50/80"
                  : "border-white/60 bg-white/90",
                removingCustomerIndex === index 
                  ? "opacity-0 -translate-x-4 scale-95" 
                  : "opacity-100 translate-x-0 scale-100"
              )}
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {index === 0 ? "פרטי הנוסע הראשון" : `פרטי הנוסע ${index === 1 ? "השני" : index === 2 ? "השלישי" : `מספר ${index + 1}`}`}
                    </div>
                    {index === 0 && (
                      <div className="text-sm font-medium text-slate-500 mt-0.5">
                        איש הקשר לצורך רכישת הביטוח
                      </div>
                    )}
                  </div>
                  {customers.length > 1 && index !== 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        // אנימציה של הסרה
                        setRemovingCustomerIndex(index);
                        setTimeout(() => {
                          setCustomers((prev) => prev.filter((_, i) => i !== index));
                          setRemovingCustomerIndex(null);
                        }, 300); // זמן האנימציה
                      }}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      הסר
                    </button>
                  )}
                </div>

                {/* הודעת שגיאה עבור נוסע זה */}
                {validationErrors[index] && validationErrors[index].length > 0 && (
                  <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 p-2">
                    <div className="flex items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-600 flex-shrink-0 mt-0.5">
                        <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <div className="text-xs text-rose-800">
                        <span className="font-semibold">יש למלא שדות חובה:</span>
                        <ul className="list-disc list-inside mr-2 mt-1">
                          {validationErrors[index].map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* מין הנוסע */}
                <div className="mb-5 sm:mb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
                    <div className="grid gap-1 w-fit">
                      <FieldLabel required>מין הנוסע</FieldLabel>
                      <div className="w-fit">
                        <GenderToggle
                          value={customer.gender}
                          onChange={(v) => {
                            clearCustomerErrors(index);
                            setCustomers((prev) => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], gender: v };
                              return updated;
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* תעודת זהות ותאריך לידה */}
                <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
                  <div className="relative">
                    {loading[index] && (
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                        <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    <FloatingInput
                      label={<>תעודת זהות <span className="text-rose-500">*</span></>}
                      dir="rtl"
                      className={cn(
                        "pl-6",
                        idValidationErrors[index] ? "border-rose-400 focus:border-rose-500" : ""
                      )}
                      value={index === 0 ? id : customer.id}
                      onChange={(e) => {
                        clearCustomerErrors(index);
                        const cleanValue = e.target.value.replace(/[^\d]/g, "");
                        // מגביל ל-9 ספרות
                        const limitedValue = cleanValue.slice(0, 9);
                        if (index === 0) {
                          setId(limitedValue);
                          // גם מעדכן את customer.id
                          setCustomers((prev) => {
                            const updated = [...prev];
                            updated[0] = { ...updated[0], id: limitedValue };
                            return updated;
                          });
                          // בדיקת ולידציה בזמן אמת
                          validateIdRealTime(limitedValue, index);
                        } else {
                          setCustomers((prev) => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], id: limitedValue };
                            return updated;
                          });
                          // בדיקת ולידציה בזמן אמת
                          validateIdRealTime(limitedValue, index);
                        }
                      }}
                      onBlur={(e) => {
                        let cleanValue = e.target.value.replace(/[^\d]/g, "");
                        // אם יש בדיוק 8 ספרות, מוסיפים 0 בהתחלה
                        if (cleanValue.length === 8) {
                          cleanValue = "0" + cleanValue;
                          // מעדכן את הערך בשדה
                          if (index === 0) {
                            setId(cleanValue);
                            setCustomers((prev) => {
                              const updated = [...prev];
                              updated[0] = { ...updated[0], id: cleanValue };
                              return updated;
                            });
                          } else {
                            setCustomers((prev) => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], id: cleanValue };
                              return updated;
                            });
                          }
                        }
                        validateIdRealTime(cleanValue, index);
                      }}
                      inputMode="numeric"
                      maxLength={9}
                    />
                    {idValidationErrors[index] && (
                      <div className="mt-1.5 flex items-start gap-1.5 text-xs text-rose-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                          <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <span>{idValidationErrors[index]}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <FloatingInput
                      label={<>תאריך לידה <span className="text-rose-500">*</span></>}
                      dir="ltr"
                      align="right"
                      type="text"
                      inputMode="numeric"
                      focusPlaceholder="DD/MM/YYYY"
                      value={isoToDDMMYYYY(customer.birthDate)}
                      onChange={(e) => {
                        clearCustomerErrors(index);

                        // מאפשרים רק ספרות ו-/
                        let raw = e.target.value.replace(/[^\d/]/g, "");

                        // auto-slash: 12 -> 12/ , 1212 -> 12/12/
                        raw = raw.slice(0, 10);
                        if (raw.length === 2 && !raw.includes("/")) raw = raw + "/";
                        if (raw.length === 5 && raw.split("/").length === 2) raw = raw + "/";

                        // אם הוזן תאריך מלא תקין -> נשמור ISO פנימי
                        const iso = ddmmyyyyToISO(raw);

                        setCustomers((prev) => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], birthDate: iso ?? (raw as any) };
                          return updated;
                        });
                      }}
                      onBlur={(e) => {
                        // אם יצא מהשדה עם טקסט לא תקין, אפשר להשאיר, או לנקות.
                        // אני ממליץ: אם לא ISO תקין -> להשאיר טקסט, אבל הוולידציה שלך תתפוס "חובה".
                      }}
                    />
                  </div>
                </div>

                {/* שמות באנגלית */}
                <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
                  <div>
                    <FloatingInput
                      label={<>שם פרטי באנגלית <span className="text-rose-500">*</span></>}
                      dir="rtl"
                      value={customer.firstNameEn}
                      onChange={(e) => {
                        clearCustomerErrors(index);
                        // מאפשר רק אותיות באנגלית, רווחים, מקפים ואפוסטרופים
                        const englishOnly = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                        setCustomers((prev) => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], firstNameEn: englishOnly };
                          return updated;
                        });
                      }}
                    />
                  </div>

                  <div>
                    <FloatingInput
                      label={<>שם משפחה באנגלית <span className="text-rose-500">*</span></>}
                      dir="rtl"
                      value={customer.lastNameEn}
                      onChange={(e) => {
                        clearCustomerErrors(index);
                        // מאפשר רק אותיות באנגלית, רווחים, מקפים ואפוסטרופים
                        const englishOnly = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                        setCustomers((prev) => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], lastNameEn: englishOnly };
                          return updated;
                        });
                      }}
                    />
                  </div>
                </div>

                {/* פרטי קשר */}
                <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
                  {(() => {
                    const age = calculateAge(customer.birthDate);
                    // required רק אם הגיל >= 18, או אם אין תאריך לידה (נניח שהוא מבוגר)
                    // אופציונלי רק אם הגיל < 18
                    const isRequired = age === null || age >= 18;
                    
                    return (
                      <>
                        <div>
                          <FloatingInput
                            label={<>דואר אלקטרוני{isRequired && <span className="text-rose-500"> *</span>}{!isRequired && " (אופציונלי)"}</>}
                            dir="rtl"
                            type="email"
                            value={customer.email}
                            onChange={(e) => {
                              clearCustomerErrors(index);
                              // מאפשר רק תווים מותרים במייל: אותיות, מספרים, @, ., _, -, +
                              const emailOnly = e.target.value.replace(/[^a-zA-Z0-9@._+-]/g, '');
                              setCustomers((prev) => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], email: emailOnly };
                                return updated;
                              });
                            }}
                          />
                        </div>

                        <div>
                          <FloatingInput
                            label={<>טלפון נייד{isRequired && <span className="text-rose-500"> *</span>}{!isRequired && " (אופציונלי)"}</>}
                            dir="rtl"
                            value={customer.phone}
                            onChange={(e) => {
                              clearCustomerErrors(index);
                              setCustomers((prev) => {
                                const updated = [...prev];
                                updated[index] = { ...updated[index], phone: e.target.value };
                                return updated;
                              });
                            }}
                            inputMode="tel"
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* שמות בעברית */}
                <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
                  <div>
                    <FloatingInput
                      label="שם פרטי בעברית"
                      dir="rtl"
                      value={customer.firstNameHe}
                      onChange={(e) =>
                        setCustomers((prev) => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], firstNameHe: e.target.value };
                          return updated;
                        })
                      }
                    />
                  </div>

                  <div>
                    <FloatingInput
                      label="שם משפחה בעברית"
                      dir="rtl"
                      value={customer.lastNameHe}
                      onChange={(e) =>
                        setCustomers((prev) => {
                          const updated = [...prev];
                          updated[index] = { ...updated[index], lastNameHe: e.target.value };
                          return updated;
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* Bottom Section */}
          <div className="mt-2 sm:mt-3 mx-auto max-w-sm sm:max-w-lg">
            {/* כפתור הוספת נוסע - מחוץ לקוביה */}
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() =>
                  setCustomers((prev) => {
                    const MAX_CUSTOMERS = 10;
                    if (prev.length >= MAX_CUSTOMERS) return prev;
                    
                    const updated: CustomerForm[] = [
                      ...prev,
                      {
                        id: "",
                        gender: "" as "M" | "F" | "",
                        firstNameHe: "",
                        lastNameHe: "",
                        firstNameEn: "",
                        lastNameEn: "",
                        birthDate: "",
                        email: "",
                        phone: "",
                      },
                    ];
                    
                    // ממיין לפי תאריך לידה
                    return sortCustomersByBirthDate(updated);
                  })
                }
                className="h-10 w-10 rounded-full text-white flex items-center justify-center transition shadow-sm hover:shadow-md flex-shrink-0 bg-[#0b4e86] hover:bg-[#0a3d6b]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <span className="text-sm font-medium text-slate-900">להוספת נוסע/ת</span>
            </div>

            <div className="rounded-xl border border-white/60 bg-white/90 backdrop-blur-xl shadow-[0_10px_30px_-15px_rgba(2,6,23,.25)] p-3 sm:p-4">
              {/* הודעה על רכישה בישראל */}
              <div className="mb-4 text-center">
                <p className="text-sm font-medium text-[#0b4e86] leading-relaxed">
                  אפשר לרכוש את הביטוח הזה אך ורק כאשר המבוטח נמצא בישראל. משמעות הרכישה היא כמו הצהרה שהמבוטח נמצא בארץ בזמן הרכישה.
                </p>
              </div>

              {/* כפתורי ניווט */}
              <div className="flex flex-col items-center gap-3">
                {/* הצגת שגיאות ולידציה */}
                {Object.keys(validationErrors).length > 0 && (
                  <div className="w-full rounded-lg bg-rose-50 border border-rose-200 p-3">
                    <div className="flex items-start gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-600 flex-shrink-0 mt-0.5">
                        <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-rose-900 mb-2">נא למלא את כל השדות החובה:</div>
                        <div className="space-y-1">
                          {Object.entries(validationErrors).map(([index, errors]) => (
                            <div key={index} className="text-xs text-rose-800">
                              <span className="font-semibold">
                                {Number(index) === 0 ? "נוסע ראשון" : `נוסע ${Number(index) + 1}`}:
                              </span>
                              <ul className="list-disc list-inside mr-2 mt-1">
                                {errors.map((error, i) => (
                                  <li key={i}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (validateForm()) {
                      // אם כל השדות תקינים, אפשר להמשיך
                      // כאן תוכל להוסיף את הלוגיקה להעברה לאתר הראל
                      window.open("https://www.harel-group.co.il", "_blank");
                    } else {
                      // גלול לשגיאה הראשונה
                      const firstErrorIndex = Number(Object.keys(validationErrors)[0]);
                      const element = document.querySelector(`[data-customer-index="${firstErrorIndex}"]`);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }
                  }}
                  className="w-full sm:w-auto min-w-[280px] rounded-xl px-5 py-3 text-base font-bold transition shadow-sm hover:shadow-md bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0b4e86]"
                >
                  המשך תהליך באתר הראל
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-xs font-medium text-slate-500">
            © {new Date().getFullYear()} Ophir Insurance • Designed for 2026 UI
          </div>
        </div>
      </main>

      {/* Modal for Additional Customers */}
      {additionalCustomers.length > 0 && showAdditionalCustomersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAdditionalCustomersModal(false);
            }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-[95%] sm:max-w-lg md:max-w-xl max-h-[70vh] sm:max-h-[60vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-4" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    <div className="text-xl font-bold" style={{ color: '#18509C', marginBottom: '0px', lineHeight: '1.2' }}>
                      {(() => {
                        const firstCustomer = customers[0];
                        const firstName = firstCustomer?.firstNameHe?.trim() || firstCustomer?.firstNameEn?.trim() || "";
                        return firstName ? `הי ${firstName},` : "הי,";
                      })()}
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#18509C', lineHeight: '1.2' }}>
                      איזה כיף לראות אותך שוב איתנו!
                    </div>
                  </div>
                  <div className="text-sm font-normal" style={{ color: '#18509C', lineHeight: '1.3' }}>
                    <div style={{ marginBottom: '0px' }}>הנה כל פרטי הנוסעים שמצאנו מהנסיעות הקודמות שלך.</div>
                    <div>צריך לבחור את מי שנוסע הפעם.</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdditionalCustomersModal(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-white/50 rounded-lg flex-shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {(() => {
                  const MAX_CUSTOMERS = 10;
                  const availableSlots = MAX_CUSTOMERS - customers.length;
                  if (availableSlots <= 0) {
                    return <Chip tone="warning">הגעת למקסימום נוסעים (10)</Chip>;
                  }
                  return <Chip tone="success">ניתן להוסיף עד {availableSlots} נוסע{availableSlots > 1 ? "ים" : ""}</Chip>;
                })()}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-200">
                {[...additionalCustomers].sort((a, b) => {
                  // קודם מיון לפי שם משפחה
                  const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
                  const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();
                  
                  if (lastNameA && lastNameB) {
                    const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
                    if (lastNameCompare !== 0) {
                      return lastNameCompare;
                    }
                  } else if (lastNameA && !lastNameB) {
                    return -1; // A קודם
                  } else if (!lastNameA && lastNameB) {
                    return 1; // B קודם
                  }
                  
                  // אם שם המשפחה זהה או אין שם משפחה, ממיינים לפי תאריך לידה
                  const dateA = a.birthDate || "";
                  const dateB = b.birthDate || "";
                  
                  // אם אין תאריך לידה, מניחים אותו בסוף
                  if (!dateA && !dateB) return 0;
                  if (!dateA) return 1;
                  if (!dateB) return -1;
                  
                  // תאריך קטן יותר = גיל גדול יותר, אז ממיינים מהקטן לגדול
                  return dateA.localeCompare(dateB);
                }).map((addCust) => {
                  const MAX_CUSTOMERS = 10;
                  const availableSlots = MAX_CUSTOMERS - customers.length;
                  const isSelected = selectedAdditionalCustomers.has(addCust.personId);
                  
                  // בדיקה אם הנוסע כבר נוסף לרשימת הנוסעים
                  const normalizedAddCustId = String(addCust.personId || "").padStart(9, "0");
                  const isAlreadyAdded = customers.some((c) => {
                    const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                    return normalizedCustomerId === normalizedAddCustId;
                  });
                  
                  const canSelect = !isAlreadyAdded && (isSelected || selectedAdditionalCustomers.size < availableSlots);
                  const fullName = addCust.primaryName || `${addCust.firstNameHe} ${addCust.lastNameHe}`.trim();
                  
                  const handleRowClick = () => {
                    if (isAlreadyAdded) return; // לא עושה כלום אם כבר נוסף
                    if (!canSelect && !isSelected) return;
                    const newSet = new Set(selectedAdditionalCustomers);
                    if (isSelected) {
                      newSet.delete(addCust.personId);
                    } else {
                      if (newSet.size < availableSlots) {
                        newSet.add(addCust.personId);
                      }
                    }
                    setSelectedAdditionalCustomers(newSet);
                  };

                  return (
                    <div
                      key={addCust.personId}
                      className={cn(
                        "flex items-center gap-2 px-3 py-3 sm:py-3 md:py-4 transition",
                        isAlreadyAdded ? "bg-green-50/50" : isSelected ? "bg-sky-50/50" : canSelect ? "hover:bg-slate-50/50 cursor-pointer" : "",
                        !isAlreadyAdded && canSelect ? "cursor-pointer" : ""
                      )}
                      onClick={!isAlreadyAdded ? handleRowClick : undefined}
                    >
                      {!isAlreadyAdded && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!canSelect}
                          onChange={(e) => {
                            e.stopPropagation(); // מונע double-click
                            if (!canSelect && !isSelected) return;
                            const newSet = new Set(selectedAdditionalCustomers);
                            if (e.target.checked) {
                              if (newSet.size < availableSlots) {
                                newSet.add(addCust.personId);
                              }
                            } else {
                              newSet.delete(addCust.personId);
                            }
                            setSelectedAdditionalCustomers(newSet);
                          }}
                          onClick={(e) => e.stopPropagation()} // מונע double-click
                          className={cn(
                            "h-4 w-4 rounded border-2 flex-shrink-0",
                            isSelected 
                              ? "border-[#18509C] bg-[#18509C] text-white" 
                              : "border-[#18509C] bg-white",
                            "focus:ring-[#18509C] focus:ring-1",
                            canSelect ? "cursor-pointer" : "cursor-not-allowed"
                          )}
                          style={{
                            accentColor: '#18509C'
                          }}
                        />
                      )}
                      {isAlreadyAdded && (
                        <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: '#18509C' }}>{fullName}</div>
                        {isAlreadyAdded && (
                          <div className="text-xs text-green-600 mt-0.5">כבר נוסף</div>
                        )}
                      </div>
                      {isAlreadyAdded && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // מונע click על השורה
                            // אנימציה של הסרה
                            const normalizedAddCustId = String(addCust.personId || "").padStart(9, "0");
                            const customerIndex = customers.findIndex((c) => {
                              const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                              return normalizedCustomerId === normalizedAddCustId;
                            });
                            
                            if (customerIndex !== -1) {
                              setRemovingCustomerIndex(customerIndex);
                              setTimeout(() => {
                                setCustomers((prev) => {
                                  return prev.filter((c) => {
                                    const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                                    return normalizedCustomerId !== normalizedAddCustId;
                                  });
                                });
                                setRemovingCustomerIndex(null);
                              }, 300); // זמן האנימציה
                            }
                          }}
                          className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition flex-shrink-0"
                        >
                          הסר
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-slate-600">
                  {selectedAdditionalCustomers.size > 0 ? (
                    <span>
                      נבחרו <span className="font-bold text-slate-900">{selectedAdditionalCustomers.size}</span> נוסע{selectedAdditionalCustomers.size > 1 ? "ים" : ""}
                    </span>
                  ) : (
                    <span className="text-slate-400">לא נבחרו נוסעים</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdditionalCustomersModal(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                  onClick={() => {
                    const selected = additionalCustomers.filter((c) =>
                      selectedAdditionalCustomers.has(c.personId)
                    );
                    
                    // אם יש נוסעים שנבחרו, הוסף אותם (רק אם הם לא קיימים כבר)
                    if (selected.length > 0) {
                      const newCustomers = selected
                        .filter((c) => {
                          // בדיקה אם הנוסע כבר קיים
                          const normalizedCustId = String(c.personId || "").padStart(9, "0");
                          return !customers.some((existing) => {
                            const normalizedExistingId = String(existing.id || "").padStart(9, "0");
                            return normalizedExistingId === normalizedCustId;
                          });
                        })
                        .map((c) => {
                          const normalizedGender = (c.gender === "M" || c.gender === "F") ? c.gender : "";
                          return {
                            id: c.personId,
                            gender: normalizedGender as "M" | "F" | "",
                            firstNameHe: c.firstNameHe,
                            lastNameHe: c.lastNameHe,
                            firstNameEn: c.firstNameEn,
                            lastNameEn: c.lastNameEn,
                            birthDate: c.birthDate,
                            email: c.email || "",
                            phone: c.phone || "",
                          };
                        });

                      if (newCustomers.length > 0) {
                        setCustomers((prev) => {
                          const MAX_CUSTOMERS = 10;
                          const currentCount = prev.length;
                          const canAdd = MAX_CUSTOMERS - currentCount;
                          
                          // מוסיף רק עד המקסימום
                          const toAdd = newCustomers.slice(0, canAdd);
                          const updated = [...prev, ...toAdd];
                          
                          // ממיין לפי תאריך לידה
                          return sortCustomersByBirthDate(updated);
                        });
                      }
                      
                      // לא מסירים את המבוטחים מהרשימה - כך הכפתור יישאר תמיד גלוי
                      // המשתמש יכול לפתוח את המודאל שוב ולראות את כל הנוסעים
                    }
                    
                    setSelectedAdditionalCustomers(new Set());
                    
                    // סגור את המודאל תמיד
                    setShowAdditionalCustomersModal(false);
                  }}
                    disabled={(() => {
                      const MAX_CUSTOMERS = 10;
                      const availableSlots = MAX_CUSTOMERS - customers.length;
                      // מושבת רק אם יש בחירות אבל אין מקום
                      return selectedAdditionalCustomers.size > 0 && availableSlots <= 0;
                    })()}
                    className={cn(
                      "px-4 py-1.5 text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm hover:shadow-md",
                      (() => {
                        const MAX_CUSTOMERS = 10;
                        const availableSlots = MAX_CUSTOMERS - customers.length;
                        const hasSelection = selectedAdditionalCustomers.size > 0;
                        const canAdd = availableSlots > 0;
                        
                        // אם יש בחירות ויש מקום - כפתור כחול
                        if (hasSelection && canAdd) {
                          return "bg-sky-600 hover:bg-sky-700 text-white";
                        }
                        // אם אין בחירות - כפתור צהוב (המשך ללא הוספה)
                        if (!hasSelection) {
                          return "bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0b4e86]";
                        }
                        // אם יש בחירות אבל אין מקום - disabled
                        return "bg-slate-300 cursor-not-allowed text-white";
                      })()
                    )}
                  >
                    {selectedAdditionalCustomers.size > 0 ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        הוסף {selectedAdditionalCustomers.size} נוסע{selectedAdditionalCustomers.size > 1 ? "ים" : ""}
                      </>
                    ) : (
                      <span className="font-bold">המשך ללא הוספת נוסעים</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
