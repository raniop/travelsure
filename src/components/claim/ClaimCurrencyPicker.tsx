import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { CLAIM_CURRENCIES, filterCurrencies } from "@/lib/claimCurrencies";
import { agencyField, agencyLabel } from "@/components/AgencyUi";

type Props = {
  value: string;
  onChange: (code: string) => void;
  /** Compact control for expense rows. */
  compact?: boolean;
  disabled?: boolean;
  error?: string;
  "aria-label"?: string;
};

export function ClaimCurrencyPicker({
  value,
  onChange,
  compact = false,
  disabled = false,
  error,
  "aria-label": ariaLabel = "מטבע",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => CLAIM_CURRENCIES.find((c) => c.code === value) || null,
    [value]
  );
  const suggestions = useMemo(() => filterCurrencies(query), [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${compact ? "min-w-[5.5rem]" : ""}`}>
      {!compact ? (
        <label className={`mb-1.5 block ${agencyLabel}`}>
          מטבע <span className="text-rose-500">*</span>
        </label>
      ) : null}
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-[14px] border-2 border-[#D5DAE3] bg-white px-2.5 text-[17px] font-semibold disabled:opacity-50 ${
          compact ? "min-h-[52px]" : "min-h-[52px] px-[14px]"
        }`}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setQuery("");
        }}
      >
        <span className={selected ? "font-semibold text-[#000144]" : "text-[#46557A]"}>
          {selected ? (compact ? selected.code : `${selected.code} · ${selected.nameHe}`) : "מטבע"}
        </span>
        <span className="text-xs text-[#46557A]">▼</span>
      </button>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}

      {open ? (
        <div
          className={`absolute z-30 mt-1 overflow-hidden rounded-[14px] border-2 border-[#D5DAE3] bg-white shadow-lg ${
            compact ? "left-0 w-[min(18rem,70vw)]" : "w-full"
          }`}
        >
          <div className="border-b border-[#E3E7EE] p-2">
            <Input
              autoFocus
              className={`${agencyField} min-h-[44px] focus-visible:ring-0 focus-visible:ring-offset-0`}
              placeholder="חיפוש מטבע / מדינה..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {suggestions.length ? (
              suggestions.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-right text-sm hover:bg-[#F3F5F8] ${
                      c.code === value ? "bg-[#F3F5F8] font-bold text-[#000144]" : "text-[#33405F]"
                    }`}
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span>{c.nameHe}</span>
                    <span className="font-mono text-xs text-[#46557A]">{c.code}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-xs text-[#46557A]">לא נמצא מטבע תואם</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
