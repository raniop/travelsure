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
  align?: "left" | "right";
  focusPlaceholder?: string;
}

export function FloatingInput({
  label,
  dir = "rtl",
  className,
  value,
  type,
  align,
  focusPlaceholder,
  ...props
}: FloatingInputProps) {
  const inputType = type ?? "text";
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = hasValue || isFocused;

  const effectiveDir = dir || "rtl";
  const effectiveAlign =
    props.style?.textAlign
      ? (props.style.textAlign as any)
      : (align ?? (effectiveDir === "ltr" ? "left" : "right"));

  // מוציא props ספציפיים כדי לא לדרוס אותם
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
                  fontSize: "1rem",
                  color: "#000000",
                  lineHeight: "1rem",
                  fontWeight: "900",
                  letterSpacing: "0.02em",
                  textShadow: "0 0 0.5px rgba(0,0,0,0.1)",
                }
              : {
                  bottom: "0px",
                  fontSize: "1.125rem",
                  color: "#000000",
                  lineHeight: "1.25rem",
                  transform: "translateY(0)",
                  fontWeight: "900",
                  letterSpacing: "0.02em",
                  textShadow: "0 0 0.5px rgba(0,0,0,0.1)",
                }
          }
        >
          {label}
        </label>
      )}
    </div>
  );
}
