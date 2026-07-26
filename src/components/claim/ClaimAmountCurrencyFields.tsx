import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { CLAIM_CURRENCIES, filterCurrencies, suggestCurrencyForDestination } from "@/lib/claimCurrencies";

type Props = {
  amount: string;
  currency: string;
  destination?: string;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  amountError?: string;
  currencyError?: string;
  /** When true, amount+currency locked (e.g. baggage delay fixed 155 USD). */
  locked?: boolean;
  lockedHint?: string;
};

export function ClaimAmountCurrencyFields({
  amount,
  currency,
  destination = "",
  onAmountChange,
  onCurrencyChange,
  amountError,
  currencyError,
  locked = false,
  lockedHint,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [manualCurrency, setManualCurrency] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => CLAIM_CURRENCIES.find((c) => c.code === currency) || null,
    [currency]
  );
  const suggestions = useMemo(() => filterCurrencies(query), [query]);
  const suggestedCode = useMemo(() => suggestCurrencyForDestination(destination), [destination]);

  useEffect(() => {
    if (locked || manualCurrency) return;
    if (!destination.trim()) return;
    if (currency !== suggestedCode) onCurrencyChange(suggestedCode);
  }, [destination, suggestedCode, locked, manualCurrency, currency, onCurrencyChange]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (locked) {
    return (
      <div className="rounded-2xl border border-[#2f6b63]/15 bg-[#e8f4f1]/60 p-4">
        <p className="text-sm font-bold text-[#143834]">סכום פיצוי קבוע לאיחור בכבודה</p>
        <p className="mt-1 text-2xl font-extrabold tracking-wide text-[#2f6b63]">
          {amount} {currency}
        </p>
        {lockedHint ? <p className="mt-2 text-xs text-slate-500">{lockedHint}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#143834]">
          סכום נתבע <span className="text-rose-500">*</span>
        </label>
        <Input
          className="bg-slate-50"
          inputMode="decimal"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="לדוגמה 250"
        />
        {amountError ? <p className="mt-1 text-xs text-rose-600">{amountError}</p> : null}
      </div>

      <div ref={wrapRef} className="relative">
        <label className="mb-1.5 block text-sm font-semibold text-[#143834]">
          מטבע <span className="text-rose-500">*</span>
        </label>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-slate-50 px-3 text-sm"
          onClick={() => {
            setOpen((v) => !v);
            setQuery("");
          }}
        >
          <span className={selected ? "font-semibold text-[#143834]" : "text-slate-400"}>
            {selected ? `${selected.code} · ${selected.nameHe}` : "בחרו מטבע"}
          </span>
          <span className="text-xs text-slate-400">▼</span>
        </button>
        {destination.trim() && selected?.code === suggestedCode ? (
          <p className="mt-1 text-[11px] font-medium text-[#2f6b63]">הוצע לפי היעד: {destination}</p>
        ) : null}
        {currencyError ? <p className="mt-1 text-xs text-rose-600">{currencyError}</p> : null}

        {open ? (
          <div className="absolute z-30 mt-1 max-h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 p-2">
              <Input
                autoFocus
                className="h-9 bg-slate-50"
                placeholder="חיפוש מטבע / מדינה / יעד..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.length ? (
                suggestions.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between px-3 py-2 text-right text-sm hover:bg-[#e8f4f1] ${
                        c.code === currency ? "bg-[#e8f4f1] font-bold text-[#143834]" : "text-slate-700"
                      }`}
                      onClick={() => {
                        setManualCurrency(true);
                        onCurrencyChange(c.code);
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
                <li className="px-3 py-3 text-xs text-slate-500">לא נמצא מטבע תואם — נסו קוד מטבע (למשל RUB) או שם מדינה</li>
              )}
            </ul>
            {suggestions.length ? (
              <p className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-400">
                {query.trim() ? `${suggestions.length} תוצאות` : `${suggestions.length} מטבעות בעולם — חפשו מדינה או קוד`}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
