import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  formatClaimDateDisplay,
  maskClaimDateInput,
  parseClaimDateToIso,
} from "@/lib/claimCrmLookup";
import { cn } from "@/lib/utils";

type ClaimDateInputProps = {
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
};

/** Always shows DD/MM/YYYY regardless of OS/browser locale. Value is ISO YYYY-MM-DD. */
export function ClaimDateInput({
  value,
  onChange,
  className,
  disabled,
  placeholder = "DD/MM/YYYY",
  required,
  name,
  id,
  "aria-label": ariaLabel,
}: ClaimDateInputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState(() => formatClaimDateDisplay(value));

  useEffect(() => {
    setText(formatClaimDateDisplay(value));
  }, [value]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      setText("");
      return;
    }
    const iso = parseClaimDateToIso(trimmed);
    if (iso) {
      onChange(iso);
      setText(formatClaimDateDisplay(iso));
      return;
    }
    setText(formatClaimDateDisplay(value));
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        id={inputId}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        dir="ltr"
        lang="he-IL"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={text}
        onChange={(e) => setText(maskClaimDateInput(e.target.value))}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
          }
        }}
        className="bg-slate-50 pe-10 text-left"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="בחירת תאריך מלוח שנה"
        className="absolute left-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#2f6b63] hover:bg-[#e8f4f1] disabled:opacity-50"
        onClick={() => {
          const el = pickerRef.current;
          if (!el) return;
          try {
            el.showPicker?.();
          } catch {
            el.click();
          }
        }}
      >
        <CalendarDays className="h-4 w-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={value || ""}
        onChange={(e) => {
          const iso = e.target.value;
          onChange(iso);
          setText(formatClaimDateDisplay(iso));
        }}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
    </div>
  );
}
