import { cn } from "./utils";

interface GenderToggleProps {
  value: "M" | "F" | "";
  onChange: (v: "M" | "F") => void;
}

export function GenderToggle({ value, onChange }: GenderToggleProps) {
  const item = (v: "M" | "F", title: string) => {
    const selected = value === v;
    return (
      <button
        type="button"
        onClick={() => onChange(v)}
        className={cn(
          "group w-full rounded-lg bg-white p-1 text-center transition-all",
          "border shadow-sm hover:shadow-md",
          selected
            ? "border-sky-400 ring-2 ring-sky-200"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "h-7 w-7 rounded-full grid place-items-center border-2 transition-all",
              selected
                ? "border-sky-400 bg-sky-50"
                : "border-sky-300 bg-sky-50"
            )}
            aria-hidden="true"
          >
            {v === "F" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-sky-600"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Z" />
                <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
                <path d="M12 21v-4" strokeLinecap="round" />
                <path d="M10 19h4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-sky-600"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Z" />
                <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div className="text-xs font-medium text-[#0b4e86]">
            {title}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {item("F", "נוסעת")}
      {item("M", "נוסע")}
    </div>
  );
}
