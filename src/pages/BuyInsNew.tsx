"use client";

import { useEffect, useMemo, useState, useRef } from "react";

/** ========= Utils ========= */

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

  if (yyyy < 1900 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

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
      ? (props.style.textAlign as "left" | "right")
      : (align ?? (effectiveDir === "ltr" ? "left" : "right"));

  const { onFocus, onBlur, style, placeholder, ...restProps } = props;

  return (
    <div className="relative w-[92%] ml-auto sm:w-full">
      <input
        {...restProps}
        type={inputType}
        value={value}
        dir={effectiveDir}
        style={{
          textAlign: effectiveAlign,
          direction: effectiveDir,
          color: hasValue ? "#0b4e86" : "#0f172a",
          fontWeight: "700",
          fontSize: "0.875rem", // 14px
          fontFamily: "Arial, Helvetica, sans-serif",
          ...style,
        }}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        className={cn(
          "w-full h-11 bg-transparent px-0 pt-6 pb-0.5",
          "border-b border-slate-300",
          "focus:outline-none focus:border-b-2 focus:border-sky-500",
          "transition-all duration-200",
          className
        )}
        placeholder={
          hasValue
            ? undefined
            : (isFocused ? (focusPlaceholder ?? placeholder ?? "") : "")
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
                  fontSize: "0.8125rem",
                  color: "#64748b",
                  lineHeight: "1rem",
                  fontWeight: "600",
                  letterSpacing: "0.01em",
                  fontFamily: "Arial, Helvetica, sans-serif",
                }
              : {
                  bottom: "0px",
                  fontSize: "0.9375rem",
                  color: "#64748b",
                  lineHeight: "1.25rem",
                  transform: "translateY(0)",
                  fontWeight: "600",
                  letterSpacing: "0.01em",
                  fontFamily: "Arial, Helvetica, sans-serif",
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
            ? "border-[#0b4e86] ring-2 ring-[#0b4e86]/20"
            : "border-slate-200 hover:border-slate-300"
        )}
        style={{ width: "105px", height: "105px", aspectRatio: "1 / 1", boxSizing: "border-box" }}
      >
        <div className="flex flex-col items-center justify-center gap-2 h-full">
          <div
            className={cn(
              "aspect-square h-10 w-10 sm:h-12 sm:w-12 rounded-full grid place-items-center border-2 transition-all flex-shrink-0",
              selected
                ? "border-[#0b4e86] bg-[#0b4e86]/10"
                : "border-[#0b4e86]/30 bg-[#0b4e86]/5"
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
                className="text-[#0b4e86]"
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
                className="text-[#0b4e86]"
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

/** ========= Types ========= */
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

/** ========= Page ========= */
export default function BuyInsNew() {
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

  const [additionalCustomers, setAdditionalCustomers] = useState<AdditionalCustomer[]>([]);
  const [selectedAdditionalCustomers, setSelectedAdditionalCustomers] = useState<Set<string>>(new Set());
  const [showAdditionalCustomersModal, setShowAdditionalCustomersModal] = useState(false);
  const [removingCustomerIndex, setRemovingCustomerIndex] = useState<number | null>(null);
  const [previousCustomerIds, setPreviousCustomerIds] = useState<Record<number, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [idValidationErrors, setIdValidationErrors] = useState<Record<number, string>>({});

  const didAutofillRef = useRef<Record<number, boolean>>({});
  const [cameFromVerifyIdentity, setCameFromVerifyIdentity] = useState(false);

  // טעינת נתונים מ-sessionStorage אם הגיע מ-verify-identity
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("buyinsnew_customer_data");
      if (storedData) {
        const customerData = JSON.parse(storedData);
        
        if (customerData.cameFromVerifyIdentity) {
          // מילוי הנתונים ישירות
          if (customerData.primaryCustomer) {
            const primary = customerData.primaryCustomer;
            setId(primary.id);
            setCustomers([primary]);
            setPreviousCustomerIds({ 0: primary.id });
          }

          // הגדרת לקוחות נוספים
          if (customerData.additionalCustomers && customerData.additionalCustomers.length > 0) {
            setAdditionalCustomers(customerData.additionalCustomers);
            setSelectedAdditionalCustomers(new Set());
            
            // פתיחת ה-modal ישר
            setShowAdditionalCustomersModal(true);
          }

          // ניקוי sessionStorage
          sessionStorage.removeItem("buyinsnew_customer_data");
          setCameFromVerifyIdentity(false);
        }
      }
    } catch (error) {
      console.error("Error loading customer data from sessionStorage:", error);
      sessionStorage.removeItem("buyinsnew_customer_data");
    }
  }, []);

  // טעינת שם השת"פ מה-URL - מותאם לביצועים
  useEffect(() => {
    const loadShatapName = async () => {
      const params = new URLSearchParams(window.location.search);
      const shatapId = params.get("aff") || params.get("shatapId") || params.get("id");

      if (!shatapId) {
        setShatapName("");
        return;
      }

      // פונקציה לפרסור XML ולמצוא שם לפי ID
      const findShatapInXml = async (xmlUrl: string, id: string): Promise<string | null> => {
        try {
          const response = await fetch(xmlUrl, {
            headers: {
              Accept: "application/xml, text/xml, */*",
            },
          });

          if (!response.ok) {
            return null;
          }

          const xmlText = await response.text();
          
          // פונקציה לפרסור HTML entities
          const decodeHtmlEntities = (text: string): string => {
            return text
              .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
          };

          // חיפוש ב-XML
          const itemRegex = /<ShatapItem>\s*<Id>(.*?)<\/Id>\s*<Name>(.*?)<\/Name>\s*<\/ShatapItem>/gs;
          let match;

          while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemId = match[1]?.trim() || "";
            const itemName = match[2]?.trim() || "";

            if (itemId === id && itemName) {
              return decodeHtmlEntities(itemName);
            }
          }

          return null;
        } catch (error) {
          console.error("Error fetching XML:", error);
          return null;
        }
      };

      // ניסיון 1: קריאה ישירה מה-XML (הכי פשוט)
      const xmlUrl = "https://www.ophirbit.co.il/aff/XmlShatapim.asp";
      
      try {
        const xmlResponse = await fetch(xmlUrl, {
          method: 'GET',
          cache: "no-store",
          headers: {
            'Accept': 'application/xml, text/xml, */*',
          },
        });

        if (xmlResponse.ok) {
          const xmlText = await xmlResponse.text();
          
          // פונקציה לפרסור HTML entities
          const decodeHtmlEntities = (text: string): string => {
            return text
              .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
          };

          // חיפוש ב-XML
          const itemRegex = /<ShatapItem>\s*<Id>(.*?)<\/Id>\s*<Name>(.*?)<\/Name>\s*<\/ShatapItem>/gs;
          let match;

          while ((match = itemRegex.exec(xmlText)) !== null) {
            const itemId = match[1]?.trim() || "";
            const itemName = match[2]?.trim() || "";

            if (itemId === shatapId && itemName) {
              const decodedName = decodeHtmlEntities(itemName);
              console.log("Shatap name loaded directly from XML:", decodedName);
              setShatapName(decodedName);
              return;
            }
          }
        }
      } catch (error: any) {
        console.log("Direct XML fetch failed (CORS?), trying proxy...", error.message);
      }

      // אם קריאה ישירה נכשלה (CORS), ננסה דרך proxy מקומי על IIS
      // ניסיון 2: ASHX handler (פתרון מקומי - רק על השרת שלך)
      try {
        const ashxUrl = `/api-shatap.ashx?id=${encodeURIComponent(shatapId)}`;
        const res = await fetch(ashxUrl, {
          method: 'GET',
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.name) {
            console.log("Shatap name loaded from ASHX:", data.name);
            setShatapName(data.name);
            return;
          }
        } else {
          console.log("ASHX returned:", res.status, res.statusText);
          // ננסה לקרוא את ה-error message
          try {
            const errorData = await res.json();
            console.log("ASHX error details:", errorData);
          } catch (e) {
            // לא JSON
          }
        }
      } catch (error: any) {
        console.log("ASHX failed:", error.message);
      }
      
      // אם נכשל, נציג את ה-ID במקום השם (פתרון זמני)
      setShatapName(`שת"פ ${shatapId}`);
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
    setValidationErrors((prev) => {
      const updated = { ...prev };
      delete updated[customerIndex];
      return updated;
    });
    setIdValidationErrors((prev) => {
      const updated = { ...prev };
      const currentError = updated[customerIndex];
      if (currentError && currentError.includes("כבר קיימת")) {
        return prev;
      }
      delete updated[customerIndex];
      return updated;
    });
  };

  const validateIdRealTime = (idValue: string, customerIndex: number) => {
    const cleanId = idValue.replace(/[^\d]/g, "");

    if (cleanId.length === 0) {
      setIdValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[customerIndex];
        return updated;
      });
      return;
    }

    if (cleanId.length < 9) {
      setIdValidationErrors((prev) => {
        const updated = { ...prev };
        const currentError = updated[customerIndex];
        if (currentError && currentError.includes("כבר קיימת")) {
          return prev;
        }
        delete updated[customerIndex];
        return updated;
      });
      return;
    }

    if (cleanId.length === 9) {
      setCustomers((currentCustomers) => {
        setId((currentId) => {
          const normalizedId = cleanId.padStart(9, "0");
          const isDuplicate = currentCustomers.some((c, idx) => {
            if (idx === customerIndex) return false;
            const currentCustomerId = idx === 0 ? currentId : c.id;
            const normalizedCurrentId = String(currentCustomerId || "").replace(/[^\d]/g, "").padStart(9, "0");
            return normalizedCurrentId === normalizedId && normalizedCurrentId.length === 9;
          });

          setIdValidationErrors((prev) => {
            const updated = { ...prev };

            if (isDuplicate) {
              updated[customerIndex] = "תעודת זהות זו כבר קיימת אצל נוסע אחר";
            } else if (!isValidIsraeliId(cleanId)) {
              updated[customerIndex] = "תעודת זהות לא תקינה - אנא בדוק את המספר שהזנת";
            } else {
              delete updated[customerIndex];
            }

            return updated;
          });

          return currentId;
        });
        return currentCustomers;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<number, string[]> = {};
    let isValid = true;

    customers.forEach((customer, index) => {
      const customerErrors: string[] = [];
      const customerId = index === 0 ? id : customer.id;

      if (!customer.gender) {
        customerErrors.push("מין הנוסע הוא שדה חובה");
        isValid = false;
      }

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
        const normalizedId = cleanCustomerId.padStart(9, "0");
        const isDuplicate = customers.some((c, idx) => {
          if (idx === index) return false;
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
          setIdValidationErrors((prev) => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });
        }
      }

      if (!customer.birthDate || customer.birthDate.trim() === "") {
        customerErrors.push("תאריך לידה הוא שדה חובה");
        isValid = false;
      }

      if (!customer.firstNameEn || customer.firstNameEn.trim() === "") {
        customerErrors.push("שם פרטי באנגלית הוא שדה חובה");
        isValid = false;
      }

      if (!customer.lastNameEn || customer.lastNameEn.trim() === "") {
        customerErrors.push("שם משפחה באנגלית הוא שדה חובה");
        isValid = false;
      }

      const age = calculateAge(customer.birthDate);
      const isContactRequired = age === null || age >= 18;

      if (isContactRequired) {
        if (!customer.email || customer.email.trim() === "") {
          customerErrors.push("דואר אלקטרוני הוא שדה חובה לנוסעים מעל גיל 18");
          isValid = false;
        } else {
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
    }

    const normalizedId = clean.padStart(9, "0");
    const isDuplicate = customers.some((c, idx) => {
      if (idx === customerIndex) return false;
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

    setIdValidationErrors((prev) => {
      const updated = { ...prev };
      const currentError = updated[customerIndex];
      if (currentError && currentError.includes("כבר קיימת")) {
        return prev;
      }
      delete updated[customerIndex];
      return updated;
    });

    const t = setTimeout(async () => {
      try {
        setLoading((prev) => ({ ...prev, [customerIndex]: true }));
        if (customerIndex === 0) {
          setStatus({ type: "checking", text: "בודק במערכת…" });
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // קביעת ה-URL הנכון בהתאם לסביבה
        const isLocalhost = typeof window !== 'undefined' && 
                           (window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname.includes('lovable') ||
                            window.location.hostname.includes('lovable.dev'));
        
        const apiUrl = isLocalhost 
          ? `/api/policy-get-by-id?id=${encodeURIComponent(clean)}`
          : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/policy-get-by-id?id=${encodeURIComponent(clean)}`;

        const res = await fetch(apiUrl, {
          cache: "no-store",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let json: Record<string, unknown> | null = null;
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

        const customer = json?.customer as Record<string, unknown> | undefined;

        if (customer && json?.found) {
          const fullName = (customer.primaryName as string) || "";
          const firstNameHe = (customer.firstNameHe as string) || "";
          const lastNameHe = (customer.lastNameHe as string) || "";
          const split = (!firstNameHe && !lastNameHe && fullName) ? splitNameHe(fullName) : { first: firstNameHe, last: lastNameHe };

          const gender = (customer.gender as string) || "";

          const previousId = previousCustomerIds[customerIndex] || "";
          const idChanged = previousId !== clean;

          didAutofillRef.current[customerIndex] = false;

          setCustomers((prev) => {
            const updated = [...prev];

            if (customerIndex === 0) {
              if (updated.length === 0) {
                updated.push({
                  id: clean,
                  gender: (gender as "M" | "F" | "") || "",
                  firstNameHe: split.first || "",
                  lastNameHe: split.last || "",
                  firstNameEn: (customer.firstNameEn as string) || "",
                  lastNameEn: (customer.lastNameEn as string) || "",
                  birthDate: (customer.birthDate as string) || "",
                  email: (customer.email as string) || "",
                  phone: (customer.phone as string) || "",
                });
              } else {
                if (idChanged) {
                  updated[0] = {
                    id: clean,
                    gender: (gender as "M" | "F" | "") || "",
                    firstNameHe: split.first || "",
                    lastNameHe: split.last || "",
                    firstNameEn: (customer.firstNameEn as string) || "",
                    lastNameEn: (customer.lastNameEn as string) || "",
                    birthDate: (customer.birthDate as string) || "",
                    email: (customer.email as string) || "",
                    phone: (customer.phone as string) || "",
                  };
                } else {
                  updated[0] = {
                    ...updated[0],
                    id: clean,
                    gender: updated[0].gender || (gender as "M" | "F" | "") || "",
                    firstNameHe: updated[0].firstNameHe || split.first || "",
                    lastNameHe: updated[0].lastNameHe || split.last || "",
                    firstNameEn: updated[0].firstNameEn || (customer.firstNameEn as string) || "",
                    lastNameEn: updated[0].lastNameEn || (customer.lastNameEn as string) || "",
                    birthDate: updated[0].birthDate || (customer.birthDate as string) || "",
                    email: updated[0].email || (customer.email as string) || "",
                    phone: updated[0].phone || (customer.phone as string) || "",
                  };
                }
              }
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
              if (idChanged) {
                updated[customerIndex] = {
                  id: clean,
                  gender: (gender as "M" | "F" | "") || "",
                  firstNameHe: split.first || "",
                  lastNameHe: split.last || "",
                  firstNameEn: (customer.firstNameEn as string) || "",
                  lastNameEn: (customer.lastNameEn as string) || "",
                  birthDate: (customer.birthDate as string) || "",
                  email: (customer.email as string) || "",
                  phone: (customer.phone as string) || "",
                };
              } else {
                updated[customerIndex] = {
                  ...updated[customerIndex],
                  id: clean,
                  gender: updated[customerIndex].gender || (gender as "M" | "F" | "") || "",
                  firstNameHe: updated[customerIndex].firstNameHe || split.first || "",
                  lastNameHe: updated[customerIndex].lastNameHe || split.last || "",
                  firstNameEn: updated[customerIndex].firstNameEn || (customer.firstNameEn as string) || "",
                  lastNameEn: updated[customerIndex].lastNameEn || (customer.lastNameEn as string) || "",
                  birthDate: updated[customerIndex].birthDate || (customer.birthDate as string) || "",
                  email: updated[customerIndex].email || (customer.email as string) || "",
                  phone: updated[customerIndex].phone || (customer.phone as string) || "",
                };
              }
            }
            return updated;
          });

          setPreviousCustomerIds((prev) => ({ ...prev, [customerIndex]: clean }));

          const allCustomersFromApi: AdditionalCustomer[] = (json?.allCustomers as AdditionalCustomer[]) || [];
          const normalizedCurrentId = clean.padStart(9, "0");
          const additional = allCustomersFromApi.filter((c) => {
            const custId = String(c.personId || "").padStart(9, "0");
            return custId !== normalizedCurrentId && custId.length === 9;
          });

          setAdditionalCustomers(additional);
          setSelectedAdditionalCustomers(new Set());
          
          // Remove customerId from URL after search completes
          if (customerIndex === 0 && cameFromVerifyIdentity) {
            const params = new URLSearchParams(window.location.search);
            if (params.has("customerId")) {
              params.delete("customerId");
              const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
              window.history.replaceState({}, '', newUrl);
              setCameFromVerifyIdentity(false);
            }
          }
          
          // Open modal automatically if there are additional customers (for first customer only)
          if (additional.length > 0 && customerIndex === 0) {
            setShowAdditionalCustomersModal(true);
          }

          if (customerIndex === 0) {
            setStatus({ type: "ok", text: `נמצא במערכת · ${fullName || ""}` });
          }
        } else {
          if (customerIndex === 0) {
            setStatus({ type: "notfound", text: "לא נמצא — מלא ידנית" });
            
            // If customer came from verify-identity but not found in system, don't show modal
            // (they need to fill manually)
            setAdditionalCustomers([]);
            
            // Remove customerId from URL
            if (cameFromVerifyIdentity) {
              const params = new URLSearchParams(window.location.search);
              if (params.has("customerId")) {
                params.delete("customerId");
                const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
                window.history.replaceState({}, '', newUrl);
                setCameFromVerifyIdentity(false);
              }
            }
          }
        }
      } catch (error: unknown) {
        if (customerIndex === 0) {
          setStatus({ type: "error", text: "שגיאת רשת" });
        }
      } finally {
        setLoading((prev) => ({ ...prev, [customerIndex]: false }));
      }
    }, 300);

    return () => clearTimeout(t);
  };

  useEffect(() => {
    // אם הגענו מ-verify-identity, החיפוש כבר בוצע בשקט ברקע
    // לא להפעיל את החיפוש הרגיל
    if (cameFromVerifyIdentity) {
      return;
    }
    searchCustomerInSystem(id, 0);
  }, [id, cameFromVerifyIdentity]);

  useEffect(() => {
    const searchPromises: Array<() => void> = [];

    customers.forEach((customer, index) => {
      if (index > 0 && customer.id) {
        const cleanId = customer.id.replace(/[^\d]/g, "");
        if (cleanId.length === 9 && isValidIsraeliId(cleanId)) {
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

  useEffect(() => {
    if (showAdditionalCustomersModal) {
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          activeElement.blur();
        }
        if (window.visualViewport) {
          window.scrollTo({ top: window.scrollY, behavior: 'instant' as ScrollBehavior });
        }
      }, 100);
    }
  }, [showAdditionalCustomersModal]);

  return (
    <div
      dir="rtl"
      className="min-h-screen relative"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* Background */}
      <div className="fixed inset-0 -z-10 min-h-full">
        <img
          src="/buyinsnew/background2.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover min-h-full"
        />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/30 bg-white/85 backdrop-blur-xl">
        <div className="bg-[#0b4e86] px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-center w-full">
          <div className="mx-auto max-w-4xl w-full flex items-center justify-between">
            <div className="h-10 sm:h-12 flex items-center">
              <img
                src="/buyinsnew/HeaderLogo.png"
                alt="אופיר ביטוח"
                className="h-full w-auto object-contain"
              />
            </div>
            {shatapName && (
              <div className="text-white text-sm sm:text-base font-medium">{shatapName}</div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-3 sm:px-4 py-2 sm:py-3">
        <div className="text-center mb-2 sm:mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b4e86]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            רכישת ביטוח נסיעות לחו״ל
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-600">
            נשמח להכיר את הנוסעים שנבטח הפעם
          </p>
        </div>

        <div className="mx-auto max-w-sm sm:max-w-lg">
          {/* Header with status chips */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3 sm:mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {chip && (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium max-w-full truncate">
                  {chip}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(() => {
                // Filter out customers that are already added to show only available ones
                const availableAdditional = additionalCustomers.filter((addCust) => {
                  const normalizedAddCustId = String(addCust.personId || "").padStart(9, "0");
                  return !customers.some((c) => {
                    const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                    return normalizedCustomerId === normalizedAddCustId;
                  });
                });
                
                return availableAdditional.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Clear selected customers that are already added
                      setSelectedAdditionalCustomers((prev) => {
                        const filtered = new Set<string>();
                        prev.forEach((id) => {
                          const normalizedId = String(id || "").padStart(9, "0");
                          const isAlreadyAdded = customers.some((c) => {
                            const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                            return normalizedCustomerId === normalizedId;
                          });
                          if (!isAlreadyAdded) {
                            filtered.add(id);
                          }
                        });
                        return filtered;
                      });
                      setShowAdditionalCustomersModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 transition whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    הוסף מבוטחים נוספים ({availableAdditional.length})
                  </button>
                );
              })()}
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
                      <div className="text-base sm:text-lg font-bold text-[#0b4e86]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
                          setRemovingCustomerIndex(index);
                          setTimeout(() => {
                            setCustomers((prev) => prev.filter((_, i) => i !== index));
                            setRemovingCustomerIndex(null);
                          }, 300);
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
                <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2" dir="rtl">
                    <div className="relative">
                      {loading[index] && (
                        <div className="absolute left-1 bottom-1 z-10">
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
                        data-field-type="id"
                        data-customer-index={index}
                        onChange={(e) => {
                          const cleanValue = e.target.value.replace(/[^\d]/g, "");
                          const limitedValue = cleanValue.slice(0, 9);
                          if (index === 0) {
                            setId(limitedValue);
                            setCustomers((prev) => {
                              const updated = [...prev];
                              updated[0] = { ...updated[0], id: limitedValue };
                              return updated;
                            });
                            validateIdRealTime(limitedValue, index);
                          } else {
                            setCustomers((prev) => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], id: limitedValue };
                              return updated;
                            });
                            validateIdRealTime(limitedValue, index);
                          }
                        }}
                        onBlur={(e) => {
                          let cleanValue = e.target.value.replace(/[^\d]/g, "");
                          if (cleanValue.length === 8) {
                            cleanValue = "0" + cleanValue;
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

                          let raw = e.target.value.replace(/[^\d/]/g, "");

                          raw = raw.slice(0, 10);
                          if (raw.length === 2 && !raw.includes("/")) raw = raw + "/";
                          if (raw.length === 5 && raw.split("/").length === 2) raw = raw + "/";

                          const iso = ddmmyyyyToISO(raw);

                          setCustomers((prev) => {
                            const updated = [...prev];
                            updated[index] = { ...updated[index], birthDate: iso ?? (raw as string) };
                            return updated;
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* שמות באנגלית */}
                <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2" dir="rtl">
                    <div>
                      <FloatingInput
                        label={<>שם פרטי באנגלית <span className="text-rose-500">*</span></>}
                        dir="rtl"
                        value={customer.firstNameEn}
                        onChange={(e) => {
                          clearCustomerErrors(index);
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
                <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2" dir="rtl">
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
                  <div className="mb-5 sm:mb-3 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2" dir="rtl">
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
                onClick={() => {
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
                  });
                  
                  // אחרי שה-state מתעדכן, עושים focus על שדה תעודת הזהות של הנוסע החדש
                  // משתמשים ב-setTimeout כדי לתת ל-DOM להתעדכן
                  setTimeout(() => {
                    // מוצאים את כל שדות תעודת הזהות של נוסעים שאינם ראשונים
                    const idInputs = Array.from(
                      document.querySelectorAll<HTMLInputElement>(
                        'input[data-field-type="id"][data-customer-index]'
                      )
                    ).filter(input => {
                      const customerIndex = parseInt(input.getAttribute('data-customer-index') || '0', 10);
                      const value = input.value.trim();
                      // רק נוסעים שאינם ראשונים ושדה תעודת הזהות שלהם ריק
                      return customerIndex > 0 && value === '';
                    });
                    
                    // מוצאים את השדה עם האינדקס הגבוה ביותר (הנוסע החדש שהוסף)
                    let targetInput: HTMLInputElement | null = null;
                    let maxIndex = -1;
                    
                    for (const input of idInputs) {
                      const customerIndex = parseInt(input.getAttribute('data-customer-index') || '0', 10);
                      if (customerIndex > maxIndex) {
                        maxIndex = customerIndex;
                        targetInput = input;
                      }
                    }
                    
                    // אם לא מצאנו לפי האינדקס, ניקח את השדה הריק הראשון
                    if (!targetInput && idInputs.length > 0) {
                      targetInput = idInputs[0];
                    }
                    
                    // עושים focus על השדה
                    if (targetInput) {
                      // גלילה לשדה במובייל - block: 'center' כדי שהשדה יהיה במרכז המסך
                      targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // focus על השדה אחרי שהגלילה מסתיימת
                      setTimeout(() => {
                        targetInput?.focus();
                      }, 200); // קצת delay כדי שהגלילה תסתיים
                    }
                  }, 150); // קצת delay כדי שה-state וה-DOM יתעדכנו (אחרי המיון)
                }}
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
              <p className="text-xs font-bold text-[#0b4e86] leading-relaxed mb-1.5">
                עצור גבול לפניך :)
              </p>
              <div className="space-y-0">
                <p className="text-xs font-medium text-[#0b4e86] leading-relaxed">
                  תנאי לרכישת הפוליסה היא הימצאות המבוטח בארץ.
                </p>
                <p className="text-xs font-medium text-[#0b4e86] leading-relaxed">
                  רכישת הפוליסה באתר מהווה הצהרה כי כל המועמדים לביטוח מצויים בארץ בעת הרכישה.
                </p>
              </div>
              <p className="text-[10px] font-medium text-[#0b4e86] leading-relaxed mt-1.5">
                שדות החובה מסומנים בכוכבית.
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
                const isValid = validateForm();
                if (isValid) {
                  window.open("https://www.harel-group.co.il", "_blank");
                } else {
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
                {(() => {
                  // Combine additional customers (not yet added) with already added customers (except primary)
                  const notAdded = additionalCustomers.filter((addCust) => {
                    const normalizedAddCustId = String(addCust.personId || "").padStart(9, "0");
                    return !customers.some((c) => {
                      const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                      return normalizedCustomerId === normalizedAddCustId;
                    });
                  });

                  // Get already added customers (except primary customer at index 0)
                  const alreadyAdded = customers.slice(1).map((c) => {
                    // Find matching additional customer or create from customer data
                    const matchingAddCust = additionalCustomers.find((ac) => {
                      const normalizedAddCustId = String(ac.personId || "").padStart(9, "0");
                      const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                      return normalizedAddCustId === normalizedCustomerId;
                    });

                    if (matchingAddCust) {
                      return matchingAddCust;
                    }

                    // Create AdditionalCustomer from customer data
                    return {
                      personId: c.id,
                      primaryName: `${c.firstNameHe || ""} ${c.lastNameHe || ""}`.trim() || `${c.firstNameEn || ""} ${c.lastNameEn || ""}`.trim(),
                      firstNameHe: c.firstNameHe || "",
                      lastNameHe: c.lastNameHe || "",
                      firstNameEn: c.firstNameEn || "",
                      lastNameEn: c.lastNameEn || "",
                      gender: c.gender || "",
                      birthDate: c.birthDate || "",
                      email: c.email || "",
                      phone: c.phone || "",
                    } as AdditionalCustomer;
                  });

                  // Combine both lists
                  const allCustomers = [...notAdded, ...alreadyAdded];

                  return allCustomers.sort((a, b) => {
                  const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
                  const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();

                  if (lastNameA && lastNameB) {
                    const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
                    if (lastNameCompare !== 0) {
                      return lastNameCompare;
                    }
                  } else if (lastNameA && !lastNameB) {
                    return -1;
                  } else if (!lastNameA && lastNameB) {
                    return 1;
                  }

                  const dateA = a.birthDate || "";
                  const dateB = b.birthDate || "";

                  if (!dateA && !dateB) return 0;
                  if (!dateA) return 1;
                  if (!dateB) return -1;

                  return dateA.localeCompare(dateB);
                  });
                })()
                .map((addCust) => {
                  const MAX_CUSTOMERS = 10;
                  const availableSlots = MAX_CUSTOMERS - customers.length;
                  const isSelected = selectedAdditionalCustomers.has(addCust.personId);

                  const normalizedAddCustId = String(addCust.personId || "").padStart(9, "0");
                  const isAlreadyAdded = customers.some((c) => {
                    const normalizedCustomerId = String(c.id || "").padStart(9, "0");
                    return normalizedCustomerId === normalizedAddCustId;
                  });

                  const canSelect = !isAlreadyAdded && (isSelected || selectedAdditionalCustomers.size < availableSlots);
                  const fullName = addCust.primaryName || `${addCust.firstNameHe} ${addCust.lastNameHe}`.trim();

                  const handleRowClick = () => {
                    if (isAlreadyAdded) return;
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
                            e.stopPropagation();
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
                          onClick={(e) => e.stopPropagation()}
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
                            e.stopPropagation();
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
                              }, 300);
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

                      if (selected.length > 0) {
                        const newCustomers = selected
                          .filter((c) => {
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

                            const toAdd = newCustomers.slice(0, canAdd);
                            const updated = [...prev, ...toAdd];

                            return sortCustomersByBirthDate(updated);
                          });
                        }
                      }

                      setSelectedAdditionalCustomers(new Set());
                      setShowAdditionalCustomersModal(false);
                    }}
                    disabled={(() => {
                      const MAX_CUSTOMERS = 10;
                      const availableSlots = MAX_CUSTOMERS - customers.length;
                      return selectedAdditionalCustomers.size > 0 && availableSlots <= 0;
                    })()}
                    className={cn(
                      "px-4 py-1.5 text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm hover:shadow-md",
                      (() => {
                        const MAX_CUSTOMERS = 10;
                        const availableSlots = MAX_CUSTOMERS - customers.length;
                        const hasSelection = selectedAdditionalCustomers.size > 0;
                        const canAdd = availableSlots > 0;

                        if (hasSelection && canAdd) {
                          return "bg-sky-600 hover:bg-sky-700 text-white";
                        }
                        if (!hasSelection) {
                          return "bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0b4e86]";
                        }
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
