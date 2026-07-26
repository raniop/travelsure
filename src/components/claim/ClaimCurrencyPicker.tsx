import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { CLAIM_CURRENCIES, filterCurrencies } from "@/lib/claimCurrencies";

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
        <label className="mb-1.5 block text-sm font-semibold text-[#143834]">
          מטבע <span className="text-rose-500">*</span>
        </label>
      ) : null}
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-md border border-input bg-slate-50 px-2.5 text-sm disabled:opacity-50 ${
          compact ? "h-9" : "h-10 px-3"
        }`}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setQuery("");
        }}
      >
        <span className={selected ? "font-semibold text-[#143834]" : "text-slate-400"}>
          {selected ? (compact ? selected.code : `${selected.code} · ${selected.nameHe}`) : "מטבע"}
        </span>
        <span className="text-xs text-slate-400">▼</span>
      </button>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}

      {open ? (
        <div
          className={`absolute z-30 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ${
            compact ? "left-0 w-[min(18rem,70vw)]" : "w-full"
          }`}
        >
          <div className="border-b border-slate-100 p-2">
            <Input
              autoFocus
              className="h-9 bg-slate-50"
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
                    className={`flex w-full items-center justify-between px-3 py-2 text-right text-sm hover:bg-[#e8f4f1] ${
                      c.code === value ? "bg-[#e8f4f1] font-bold text-[#143834]" : "text-slate-700"
                    }`}
                    onClick={() => {
                      onChange(c.code);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span>{c.nameHe}</span>
                    <span className="font-mono text-xs text-slate-500">{c.code}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-xs text-slate-500">לא נמצא מטבע תואם</li>
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
