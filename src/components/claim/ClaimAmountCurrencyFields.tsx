import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { suggestCurrencyForDestination } from "@/lib/claimCurrencies";
import { ClaimCurrencyPicker } from "@/components/claim/ClaimCurrencyPicker";
import { agencyField, agencyLabel } from "@/components/AgencyUi";

const claimField = `${agencyField} h-auto md:text-[17px] focus-visible:ring-0 focus-visible:ring-offset-0`;

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
  /** Amount auto-calculated from expense rows — not editable. */
  computed?: boolean;
  computedHint?: string;
  amountLabel?: string;
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
  computed = false,
  computedHint,
  amountLabel = "סכום נתבע",
}: Props) {
  const [manualCurrency, setManualCurrency] = useState(false);
  const suggestedCode = useMemo(() => suggestCurrencyForDestination(destination), [destination]);

  useEffect(() => {
    if (locked || computed || manualCurrency) return;
    if (!destination.trim()) return;
    if (currency !== suggestedCode) onCurrencyChange(suggestedCode);
  }, [destination, suggestedCode, locked, computed, manualCurrency, currency, onCurrencyChange]);

  if (locked) {
    return (
      <div className="rounded-[20px] bg-[#F3F5F8] p-5">
        <p className="text-sm font-bold text-[#000144]">סכום פיצוי קבוע לאיחור בכבודה</p>
        <p className="mt-1 text-2xl font-extrabold tracking-wide text-[#008C3D]">
          {amount} {currency}
        </p>
        {lockedHint ? <p className="mt-2 text-xs text-[#46557A]">{lockedHint}</p> : null}
      </div>
    );
  }

  if (computed) {
    return (
      <div className="rounded-[20px] bg-[#F3F5F8] p-5">
        <p className="text-sm font-bold text-[#000144]">
          {amountLabel} <span className="text-rose-500">*</span>
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-wide text-[#008C3D]" dir="ltr">
          {amount ? `${amount} ${currency}` : "—"}
        </p>
        <p className="mt-2 text-xs font-medium text-[#008C3D]">
          {computedHint || "מחושב אוטומטית לפי פירוט ההוצאות"}
        </p>
        {amountError ? <p className="mt-1 text-xs text-rose-600">{amountError}</p> : null}
        {currencyError ? <p className="mt-1 text-xs text-rose-600">{currencyError}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
      <div>
        <label className={`mb-1.5 block ${agencyLabel}`}>
          {amountLabel} <span className="text-rose-500">*</span>
        </label>
        <Input
          className={claimField}
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
          <p className="mt-1 text-[11px] font-medium text-[#008C3D]">הוצע לפי היעד: {destination}</p>
        ) : null}
      </div>
    </div>
  );
}
