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
import { DESTINATION_MAP_PATHS } from "@/components/travelProposal/destinationMaps";
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

const DestMapIcon = ({ id, active }: { id: DestinationId; active: boolean }) => {
  const stroke = active ? "#0f2f2c" : "#1f4b46";
  const fill = active ? "#5fa898" : "#9ecfc2";
  return (
    <svg viewBox="0 0 48 48" className="h-[58px] w-[58px] sm:h-16 sm:w-16" aria-hidden>
      <path
        d={DESTINATION_MAP_PATHS[id]}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
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
    <div className="space-y-5">
      <div className="tp-center" style={{ textAlign: "center" }}>
        <h3
          className="text-xl font-extrabold text-[#143834]"
          style={{ textAlign: "center" }}
        >
          בחרו יעד נסיעה
        </h3>
        <p className="mt-1 text-sm text-slate-500" style={{ textAlign: "center" }}>
          לחצו על כל יעד שרלוונטי — אפשר יותר מאחד
        </p>
      </div>
      <div className="mx-auto grid max-w-2xl grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-6">
        {DESTINATION_OPTIONS.map((d) => {
          const active = selected.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onToggle(d.id)}
              aria-pressed={active}
              className="group flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6b63]/40"
            >
              <span
                className={cn(
                  "relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-white transition duration-200 sm:h-[112px] sm:w-[112px]",
                  active
                    ? "shadow-[0_12px_28px_-12px_rgba(20,56,52,.55)] ring-[3px] ring-[#143834] scale-[1.04]"
                    : "shadow-[0_8px_20px_-12px_rgba(20,56,52,.4)] ring-1 ring-slate-200/80 group-hover:ring-[#2f6b63]/45",
                )}
              >
                <DestMapIcon id={d.id} active={active} />
                {active && (
                  <span className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#2f6b63] text-white shadow-md">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "max-w-[120px] text-center text-sm font-extrabold leading-snug",
                  active ? "text-[#143834]" : "text-slate-600",
                )}
                style={{ textAlign: "center" }}
              >
                {d.labelHe}
              </span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-center text-xs font-semibold text-[#2f6b63]" style={{ textAlign: "center" }}>
          נבחרו:{" "}
          {selected
            .map((id) => DESTINATION_OPTIONS.find((o) => o.id === id)?.labelHe)
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {error && (
        <p className="text-center text-xs text-rose-600" style={{ textAlign: "center" }}>
          {error}
        </p>
      )}
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
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="text-center sm:text-right">
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
        <div className="text-center sm:text-right">
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
      {/* Avoid justify-between — global RTL CSS reverses it and puts כן/לא on the right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
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
        <div className="shrink-0 self-end sm:ms-auto sm:self-start">
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
