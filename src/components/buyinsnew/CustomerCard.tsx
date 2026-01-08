import { CustomerForm } from "./types";
import { cn, calculateAge } from "./utils";
import { FieldLabel, FloatingInput } from "./FormInputs";
import { GenderToggle } from "./GenderToggle";

interface CustomerCardProps {
  customer: CustomerForm;
  index: number;
  id: string;
  setId: (id: string) => void;
  setCustomers: React.Dispatch<React.SetStateAction<CustomerForm[]>>;
  validationErrors: Record<number, string[]>;
  idValidationErrors: Record<number, string>;
  clearCustomerErrors: (index: number) => void;
  validateIdRealTime: (idValue: string, customerIndex: number) => void;
}

export function CustomerCard({
  customer,
  index,
  id,
  setId,
  setCustomers,
  validationErrors,
  idValidationErrors,
  clearCustomerErrors,
  validateIdRealTime,
}: CustomerCardProps) {
  const age = calculateAge(customer.birthDate);
  const isContactRequired = age === null || age >= 18;

  return (
    <div
      data-customer-index={index}
      className={cn(
        "rounded-xl border backdrop-blur-xl shadow-[0_10px_30px_-15px_rgba(2,6,23,.25)] transition-all",
        validationErrors[index] && validationErrors[index].length > 0
          ? "border-rose-300 bg-rose-50/80"
          : "border-white/60 bg-white/90"
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
          {index > 0 && (
            <button
              type="button"
              onClick={() => setCustomers((prev) => prev.filter((_, i) => i !== index))}
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
        <div className="mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="grid gap-1 max-w-[160px]">
              <FieldLabel required>מין הנוסע</FieldLabel>
              <div>
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
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <FloatingInput
              label={<>תעודת זהות <span className="text-rose-500">*</span></>}
              dir="rtl"
              value={index === 0 ? id : customer.id}
              onChange={(e) => {
                clearCustomerErrors(index);
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
                  validateIdRealTime(cleanValue, index);
                }
              }}
            />
            {idValidationErrors[index] && (
              <div className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {idValidationErrors[index]}
              </div>
            )}
          </div>

          <div>
            <FloatingInput
              label={<>תאריך לידה <span className="text-rose-500">*</span></>}
              type="date"
              dir="ltr"
              value={customer.birthDate}
              onChange={(e) => {
                clearCustomerErrors(index);
                setCustomers((prev) => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], birthDate: e.target.value };
                  return updated;
                });
              }}
            />
          </div>
        </div>

        {/* שמות באנגלית */}
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <FloatingInput
              label={<>שם פרטי באנגלית <span className="text-rose-500">*</span></>}
              dir="ltr"
              value={customer.firstNameEn}
              onChange={(e) => {
                clearCustomerErrors(index);
                setCustomers((prev) => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], firstNameEn: e.target.value };
                  return updated;
                });
              }}
            />
          </div>

          <div>
            <FloatingInput
              label={<>שם משפחה באנגלית <span className="text-rose-500">*</span></>}
              dir="ltr"
              value={customer.lastNameEn}
              onChange={(e) => {
                clearCustomerErrors(index);
                setCustomers((prev) => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], lastNameEn: e.target.value };
                  return updated;
                });
              }}
            />
          </div>
        </div>

        {/* אימייל וטלפון */}
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <FloatingInput
              label={<>דואר אלקטרוני{isContactRequired && <span className="text-rose-500"> *</span>}{!isContactRequired && " (אופציונלי)"}</>}
              dir="rtl"
              type="email"
              value={customer.email}
              onChange={(e) => {
                clearCustomerErrors(index);
                setCustomers((prev) => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], email: e.target.value };
                  return updated;
                });
              }}
            />
          </div>

          <div>
            <FloatingInput
              label={<>טלפון נייד{isContactRequired && <span className="text-rose-500"> *</span>}{!isContactRequired && " (אופציונלי)"}</>}
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
        </div>

        {/* שמות בעברית */}
        <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
  );
}
