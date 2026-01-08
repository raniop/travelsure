import { AdditionalCustomer, CustomerForm } from "./types";
import { cn, sortCustomersByBirthDate } from "./utils";
import { Chip } from "./Chip";

interface AdditionalCustomersModalProps {
  additionalCustomers: AdditionalCustomer[];
  setAdditionalCustomers: React.Dispatch<React.SetStateAction<AdditionalCustomer[]>>;
  selectedAdditionalCustomers: Set<string>;
  setSelectedAdditionalCustomers: React.Dispatch<React.SetStateAction<Set<string>>>;
  customers: CustomerForm[];
  setCustomers: React.Dispatch<React.SetStateAction<CustomerForm[]>>;
  onClose: () => void;
}

export function AdditionalCustomersModal({
  additionalCustomers,
  setAdditionalCustomers,
  selectedAdditionalCustomers,
  setSelectedAdditionalCustomers,
  customers,
  setCustomers,
  onClose,
}: AdditionalCustomersModalProps) {
  const MAX_CUSTOMERS = 10;
  const availableSlots = MAX_CUSTOMERS - customers.length;

  const handleConfirm = () => {
    const selected = additionalCustomers.filter((c) =>
      selectedAdditionalCustomers.has(c.personId)
    );

    if (selected.length > 0) {
      const newCustomers = selected.map((c) => {
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

      setCustomers((prev) => {
        const canAdd = MAX_CUSTOMERS - prev.length;
        const toAdd = newCustomers.slice(0, canAdd);
        const updated = [...prev, ...toAdd];
        return sortCustomersByBirthDate(updated);
      });

      const remainingCustomers = additionalCustomers.filter((c) =>
        !selectedAdditionalCustomers.has(c.personId)
      );
      setAdditionalCustomers(remainingCustomers);
    }

    setSelectedAdditionalCustomers(new Set());
    onClose();
  };

  const sortedCustomers = [...additionalCustomers].sort((a, b) => {
    const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
    const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();

    if (lastNameA && lastNameB) {
      const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
      if (lastNameCompare !== 0) return lastNameCompare;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-white/50 rounded-lg flex-shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {availableSlots <= 0 ? (
              <Chip tone="warning">הגעת למקסימום נוסעים (10)</Chip>
            ) : (
              <Chip tone="success">ניתן להוסיף עד {availableSlots} נוסע{availableSlots > 1 ? "ים" : ""}</Chip>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-200">
            {sortedCustomers.map((addCust) => {
              const isSelected = selectedAdditionalCustomers.has(addCust.personId);
              const canSelect = isSelected || selectedAdditionalCustomers.size < availableSlots;
              const fullName = addCust.primaryName || `${addCust.firstNameHe} ${addCust.lastNameHe}`.trim();

              return (
                <label
                  key={addCust.personId}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 transition",
                    canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                    isSelected ? "bg-sky-50/50" : canSelect ? "hover:bg-slate-50/50" : ""
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={!canSelect}
                    onChange={(e) => {
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
                    className={cn(
                      "h-4 w-4 rounded border-2 flex-shrink-0",
                      isSelected
                        ? "border-[#18509C] bg-[#18509C] text-white"
                        : "border-[#18509C] bg-white",
                      "focus:ring-[#18509C] focus:ring-1",
                      canSelect ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                    style={{ accentColor: '#18509C' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#18509C' }}>{fullName}</div>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0" style={{ color: '#18509C' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </label>
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
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedAdditionalCustomers.size > 0 && availableSlots <= 0}
                className={cn(
                  "px-4 py-1.5 text-xs rounded-lg transition flex items-center gap-1.5 shadow-sm hover:shadow-md",
                  (() => {
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
  );
}
