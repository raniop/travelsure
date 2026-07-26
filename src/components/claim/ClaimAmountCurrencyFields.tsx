import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { suggestCurrencyForDestination } from "@/lib/claimCurrencies";
import { ClaimCurrencyPicker } from "@/components/claim/ClaimCurrencyPicker";

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
  const [manualCurrency, setManualCurrency] = useState(false);
  const suggestedCode = useMemo(() => suggestCurrencyForDestination(destination), [destination]);

  useEffect(() => {
    if (locked || manualCurrency) return;
    if (!destination.trim()) return;
    if (currency !== suggestedCode) onCurrencyChange(suggestedCode);
  }, [destination, suggestedCode, locked, manualCurrency, currency, onCurrencyChange]);

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

      <div>
        <ClaimCurrencyPicker
          value={currency}
          onChange={(code) => {
            setManualCurrency(true);
            onCurrencyChange(code);
          }}
          error={currencyError}
        />
        {destination.trim() && currency === suggestedCode ? (
          <p className="mt-1 text-[11px] font-medium text-[#2f6b63]">הוצע לפי היעד: {destination}</p>
        ) : null}
      </div>
    </div>
  );
}
