import { useEffect, useMemo, useState, type ReactNode } from "react";
import { he } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  DESTINATION_OPTIONS,
  type DestinationId,
  type Step,
  type YesNo,
} from "@/lib/travelProposal/types";
import {
  Baby,
  Bike,
  BriefcaseMedical,
  Camera,
  Car,
  Check,
  CreditCard,
  HeartPulse,
  Laptop,
  Luggage,
  MountainSnow,
  Phone,
  Plane,
  Send,
  ShieldAlert,
  Snowflake,
  Umbrella,
  UserRound,
  Users,
} from "lucide-react";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const toDdMmYyyy = (d: Date) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

export const parseDdMmYyyy = (value: string): Date | undefined => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return undefined;
  const [dd, mm, yyyy] = value.split("/").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return undefined;
  return d;
};

/** Simple line-art region marks — Harel-like circular destination tiles */
const DestMark = ({ id, active }: { id: DestinationId; active: boolean }) => {
  const stroke = active ? "#1f4b46" : "#2f6b63";
  const fill = active ? "rgba(47,107,99,0.12)" : "transparent";
  const common = { fill, stroke, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "europe":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <path d="M14 34c2-8 6-14 12-16 4-1 8 1 10 5 2 4 1 9-2 12-4 4-10 5-14 3-3-1-5-2-6-4z" {...common} />
          <path d="M18 18c2-3 5-5 9-5 3 0 5 1 7 3" fill="none" stroke={stroke} strokeWidth={1.6} />
        </svg>
      );
    case "usa":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <path d="M10 18h22l2 4v10l-4 4H14l-4-6V18z" {...common} />
          <path d="M32 20l6-2v8l-4 2" fill="none" stroke={stroke} strokeWidth={1.6} />
        </svg>
      );
    case "canada":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <path d="M24 12l3 7h7l-5.5 4.5 2 7L24 26l-6.5 4.5 2-7L14 19h7z" {...common} />
        </svg>
      );
    case "africa":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <path d="M24 10c8 2 12 8 11 16-1 7-6 12-12 14-7 1-12-3-13-10-1-8 4-16 14-20z" {...common} />
        </svg>
      );
    case "asia":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <path d="M12 28c2-10 8-16 16-18 6-1 10 2 12 8 2 6-1 12-6 15-6 4-14 3-18 0-3-2-5-3-4-5z" {...common} />
          <circle cx="28" cy="22" r="2" fill={stroke} />
        </svg>
      );
    case "australia":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <ellipse cx="24" cy="24" rx="12" ry="9" {...common} />
          <circle cx="34" cy="34" r="2.5" fill={active ? "#1f4b46" : "#2f6b63"} />
        </svg>
      );
    case "latam":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <path d="M22 8c6 2 10 6 11 12 1 5-1 9-4 13-2 3-4 6-5 9-4-2-7-7-8-13-1-7 1-14 6-21z" {...common} />
        </svg>
      );
    case "antarctica":
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden>
          <path d="M24 10l10 18H14L24 10z" {...common} />
          <path d="M14 30h20v4H14z" fill={active ? "rgba(47,107,99,0.2)" : "none"} stroke={stroke} strokeWidth={1.6} />
        </svg>
      );
    default:
      return null;
  }
};

export function DestinationPicker({
  selected,
  onToggle,
  error,
}: {
  selected: DestinationId[];
  onToggle: (id: DestinationId) => void;
  error?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-extrabold text-[#143834]">בחרו יעד נסיעה</h3>
        <p className="mt-1 text-sm text-slate-500">אפשר לבחור יותר מיעד אחד</p>
      </div>
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4 sm:gap-y-5">
        {DESTINATION_OPTIONS.map((d) => {
          const active = selected.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onToggle(d.id)}
              aria-pressed={active}
              className="group flex flex-col items-center gap-2.5 rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b63]/40"
            >
              <span
                className={cn(
                  "relative flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] bg-white transition duration-200 sm:h-[92px] sm:w-[92px]",
                  active
                    ? "border-[#143834] shadow-[0_12px_28px_-16px_rgba(20,56,52,.55)] scale-[1.03]"
                    : "border-[#2f6b63]/22 group-hover:border-[#2f6b63]/55 group-hover:shadow-md",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-2 rounded-full transition",
                    active ? "bg-gradient-to-br from-[#e8f4f1] to-white" : "bg-[#f7fbfa]",
                  )}
                />
                <span className="relative z-[1]">
                  <DestMark id={d.id} active={active} />
                </span>
                {active && (
                  <span className="absolute -left-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2f6b63] text-white shadow">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-bold transition",
                  active ? "text-[#143834]" : "text-slate-600",
                )}
              >
                {d.labelHe}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function TripDateRangePicker({
  from,
  to,
  onChange,
  fromError,
  toError,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  fromError?: string;
  toError?: string;
}) {
  const selected = useMemo<DateRange | undefined>(() => {
    const f = parseDdMmYyyy(from);
    const t = parseDdMmYyyy(to);
    if (!f && !t) return undefined;
    return { from: f, to: t };
  }, [from, to]);

  const [month, setMonth] = useState<Date>(() => selected?.from || new Date());
  const [months, setMonths] = useState(1);

  useEffect(() => {
    const sync = () => setMonths(window.innerWidth < 720 ? 1 : 2);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const days =
    selected?.from && selected?.to
      ? Math.round((selected.to.getTime() - selected.from.getTime()) / 86400000) + 1
      : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="text-right">
          <p className="text-base font-extrabold text-[#143834]">מתי יוצאים?</p>
          <p className="mt-2 text-[11px] text-slate-400">* תאריך יציאה</p>
          <p
            className={cn(
              "mt-1 border-b-2 pb-1 text-lg font-bold tracking-wide",
              from ? "border-[#2f6b63] text-[#143834]" : "border-slate-200 text-slate-300",
            )}
            dir="ltr"
          >
            {from || "DD/MM/YYYY"}
          </p>
          {fromError && <p className="mt-1 text-xs text-rose-600">{fromError}</p>}
        </div>
        <div className="text-right">
          <p className="text-base font-extrabold text-[#143834]">מתי חוזרים?</p>
          <p className="mt-2 text-[11px] text-slate-400">* תאריך חזרה</p>
          <p
            className={cn(
              "mt-1 border-b-2 pb-1 text-lg font-bold tracking-wide",
              to ? "border-[#2f6b63] text-[#143834]" : "border-slate-200 text-slate-300",
            )}
            dir="ltr"
          >
            {to || "DD/MM/YYYY"}
          </p>
          {toError && <p className="mt-1 text-xs text-rose-600">{toError}</p>}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white bg-white p-3 shadow-[0_18px_50px_-28px_rgba(20,56,52,.45)] sm:p-5">
        <Calendar
          mode="range"
          locale={he}
          numberOfMonths={months}
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={(range) => {
            onChange(
              range?.from ? toDdMmYyyy(range.from) : "",
              range?.to ? toDdMmYyyy(range.to) : range?.from ? toDdMmYyyy(range.from) : "",
            );
          }}
          disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
          className="mx-auto w-full"
          classNames={{
            months: "flex flex-col gap-4 sm:flex-row sm:gap-8 justify-center",
            caption_label: "text-base font-bold text-[#143834]",
            head_cell: "text-[#2f6b63]/70 rounded-md w-10 font-semibold text-[0.8rem]",
            day: "h-10 w-10 rounded-full text-sm",
            day_selected:
              "bg-[#2f6b63] text-white hover:bg-[#275a53] hover:text-white focus:bg-[#2f6b63] focus:text-white rounded-full",
            day_range_start: "rounded-full bg-[#2f6b63] text-white",
            day_range_end: "rounded-full bg-[#2f6b63] text-white",
            day_range_middle: "aria-selected:bg-[#e8f4f1] aria-selected:text-[#143834] rounded-none",
            day_today: "bg-[#e8f4f1] text-[#143834] font-bold",
          }}
        />
        <p className="mt-3 text-center text-sm font-bold text-[#2f6b63]">
          {days != null
            ? `סה״כ: ${days === 1 ? "יום אחד" : `${days} ימים`}`
            : "בחרו טווח תאריכים בלוח"}
        </p>
      </div>
    </div>
  );
}

export function PillYesNo({
  value,
  onChange,
  name,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  name: string;
}) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-full border-2 border-[#2f6b63]/30 bg-white shadow-sm"
      role="group"
      aria-label={name}
    >
      {(
        [
          { v: "yes" as const, label: "כן" },
          { v: "no" as const, label: "לא" },
        ] as const
      ).map((opt) => (
        <button
          key={opt.v}
          type="button"
          onClick={() => onChange(opt.v)}
          className={cn(
            "min-w-[72px] px-5 py-2.5 text-sm font-extrabold transition",
            value === opt.v
              ? "bg-[#2f6b63] text-white"
              : "bg-transparent text-[#2f6b63] hover:bg-[#e8f4f1]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function HealthQuestionCard({
  number,
  title,
  note,
  value,
  onChange,
  error,
  children,
}: {
  number: number | string;
  title: string;
  note?: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#d7e8e3] bg-white p-4 shadow-[0_8px_24px_-20px_rgba(20,56,52,.35)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3 text-right">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f6b63] text-sm font-bold text-white shadow-sm">
            {number}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold leading-relaxed text-[#143834]">{title}</p>
            {note && <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{note}</p>}
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>
        </div>
        <div className="shrink-0 self-end sm:self-start">
          <PillYesNo value={value} onChange={onChange} name={`q-${number}`} />
        </div>
      </div>
      {children}
    </div>
  );
}

export type CoverageCardProps = {
  title: string;
  description?: string;
  footnote?: string;
  priceHint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
  variant?: "included" | "optional" | "optout";
  children?: ReactNode;
};

export function CoverageCard({
  title,
  description,
  footnote,
  priceHint,
  checked,
  onChange,
  icon,
  variant = "optional",
  children,
}: CoverageCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition duration-200",
        checked
          ? "border-[#2f6b63]/40 shadow-[0_14px_32px_-22px_rgba(47,107,99,.75)]"
          : "border-[#cfe0db] hover:border-[#2f6b63]/30",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex w-full items-stretch gap-0 text-right"
        aria-pressed={checked}
      >
        <div className="flex w-[58px] shrink-0 flex-col items-center justify-center gap-1 border-l border-[#e5efec] bg-[#f0f7f5] px-2 py-3 text-[#2f6b63]">
          {icon || <Umbrella className="h-6 w-6" strokeWidth={1.6} />}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[15px] font-extrabold text-[#143834]">{title}</p>
              {priceHint && (
                <span
                  className={cn(
                    "text-xs font-bold",
                    checked ? "text-[#2f6b63]" : "text-[#143834]",
                  )}
                >
                  {priceHint}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{description}</p>
            )}
            {footnote && <p className="mt-1.5 text-[11px] text-slate-400">{footnote}</p>}
            {variant === "included" && checked && (
              <p className="mt-1.5 text-xs font-bold text-[#2f6b63]">כלול ברובד הבסיס</p>
            )}
          </div>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[2.5px] transition",
              checked
                ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                : "border-slate-300 bg-white text-transparent",
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        </div>
      </button>
      {checked && children && (
        <div className="border-t border-[#e5efec] bg-[#f7fbfa] px-4 py-3">{children}</div>
      )}
    </div>
  );
}

const STEP_META: Partial<
  Record<Step, { label: string; icon: typeof Plane; short?: string }>
> = {
  identity: { label: "זיהוי", icon: UserRound },
  trip: { label: "לאן?", icon: Plane, short: "יעד" },
  insureds: { label: "נוסעים", icon: Users },
  health: { label: "בריאות", icon: HeartPulse },
  plan: { label: "כיסויים", icon: Umbrella },
  payment: { label: "תשלום", icon: CreditCard },
  review: { label: "שליחה", icon: Send },
};

export function ProposalIconStepper({
  steps,
  currentIndex,
}: {
  steps: { id: Step; label: string }[];
  currentIndex: number;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="mx-auto flex min-w-max items-start justify-center gap-0 px-1">
        {steps.map((s, i) => {
          const meta = STEP_META[s.id];
          const Icon = meta?.icon || Plane;
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s.id} className="flex items-center">
              <div className="flex w-[64px] flex-col items-center gap-1.5 sm:w-[72px]">
                <span
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition sm:h-12 sm:w-12",
                    active
                      ? "border-[#143834] bg-[#143834] text-white shadow-md"
                      : done
                        ? "border-[#2f6b63] bg-[#2f6b63] text-white"
                        : "border-[#2f6b63]/25 bg-white text-[#2f6b63]",
                  )}
                >
                  {done ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  )}
                  {done && (
                    <span className="absolute -left-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#4ade80] text-white ring-2 ring-[#eef6fb]">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold sm:text-[11px]",
                    active || done ? "text-[#143834]" : "text-slate-400",
                  )}
                >
                  {meta?.label || s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mb-5 h-0.5 w-3 shrink-0 sm:w-5",
                    i < currentIndex ? "bg-[#2f6b63]" : "bg-[#2f6b63]/20",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export const COVERAGE_ICONS = {
  rescue: <ShieldAlert className="h-6 w-6" strokeWidth={1.6} />,
  thirdParty: <Users className="h-6 w-6" strokeWidth={1.6} />,
  baggage: <Luggage className="h-6 w-6" strokeWidth={1.6} />,
  cancel: <Plane className="h-6 w-6" strokeWidth={1.6} />,
  health: <HeartPulse className="h-6 w-6" strokeWidth={1.6} />,
  pregnancy: <Baby className="h-6 w-6" strokeWidth={1.6} />,
  adventure: <MountainSnow className="h-6 w-6" strokeWidth={1.6} />,
  winter: <Snowflake className="h-6 w-6" strokeWidth={1.6} />,
  pro: <BriefcaseMedical className="h-6 w-6" strokeWidth={1.6} />,
  accident: <ShieldAlert className="h-6 w-6" strokeWidth={1.6} />,
  laptop: <Laptop className="h-6 w-6" strokeWidth={1.6} />,
  phone: <Phone className="h-6 w-6" strokeWidth={1.6} />,
  bike: <Bike className="h-6 w-6" strokeWidth={1.6} />,
  car: <Car className="h-6 w-6" strokeWidth={1.6} />,
  camera: <Camera className="h-6 w-6" strokeWidth={1.6} />,
};
