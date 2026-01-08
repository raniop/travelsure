import { useState } from "react";
import { cn } from "./utils";

interface FieldLabelProps {
  required?: boolean;
  children: React.ReactNode;
}

export function FieldLabel({ required, children }: FieldLabelProps) {
  return (
    <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
      {required ? <span className="text-rose-500">*</span> : null}
      <span>{children}</span>
    </div>
  );
}

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  dir?: "rtl" | "ltr";
  label?: React.ReactNode;
}

export function FloatingInput({
  label,
  dir = "rtl",
  className,
  value,
  type,
  ...props
}: FloatingInputProps) {
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = hasValue || isFocused;

  return (
    <div className="relative w-full" style={{ minHeight: "2.75rem" }}>
      <input
        {...props}
        type={type}
        value={value}
        dir={dir}
        style={{
          textAlign: dir === "ltr" ? "left" : "right",
          direction: dir || "rtl",
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
          "w-full bg-transparent px-0 pt-6 pb-0.5 text-sm text-slate-900",
          "border-b border-slate-300",
          "focus:outline-none focus:border-b-2 focus:border-sky-500",
          "transition-all duration-200",
          dir === "ltr" ? "text-left" : "text-right",
          type === "date" && "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden",
          type === "date" && "[&::placeholder]:opacity-0 [&::placeholder]:hidden [&::-webkit-input-placeholder]:opacity-0 [&::-webkit-input-placeholder]:hidden [&::-moz-placeholder]:opacity-0 [&::-moz-placeholder]:hidden [&:-ms-input-placeholder]:opacity-0 [&:-ms-input-placeholder]:hidden",
          type === "date" && !hasValue && !isFocused && "date-empty",
          className
        )}
        {...(type === "date" ? {} : { placeholder: shouldFloat ? undefined : (props.placeholder || "") })}
      />
      {label && (
        <label
          className={cn(
            "absolute transition-all duration-200 pointer-events-none text-right",
            "right-0"
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
