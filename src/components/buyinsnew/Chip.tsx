import { cn } from "./utils";

interface ChipProps {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}

export function Chip({ tone = "neutral", children }: ChipProps) {
  const map = {
    neutral: "bg-white/70 text-slate-700 ring-1 ring-slate-200/70",
    success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/70",
    warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/70",
    danger: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/70",
    info: "bg-sky-50 text-sky-900 ring-1 ring-sky-200/70",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}
