import { useEffect, useMemo, useState, type ReactNode } from "react";
import { he } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  DESTINATION_OPTIONS,
  type DestinationId,
  type YesNo,
} from "@/lib/travelProposal/types";
import {
  Baby,
  Bike,
  BriefcaseMedical,
  Camera,
  Car,
  Check,
  Globe2,
  HeartPulse,
  Laptop,
  Luggage,
  MountainSnow,
  Phone,
  Plane,
  ShieldAlert,
  Snowflake,
  Sun,
  Trees,
  Umbrella,
  Users,
  Waves,
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

const DEST_META: Record<DestinationId, { icon: typeof Globe2 }> = {
  europe: { icon: Globe2 },
  usa: { icon: Plane },
  canada: { icon: Snowflake },
  africa: { icon: Sun },
  asia: { icon: Trees },
  australia: { icon: Waves },
  latam: { icon: Sun },
  antarctica: { icon: Snowflake },
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
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-extrabold text-[#143834]">בחרו יעד נסיעה</h3>
        <p className="mt-1 text-xs text-slate-500">אפשר לבחור יותר מיעד אחד</p>
      </div>
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        {DESTINATION_OPTIONS.map((d) => {
          const active = selected.includes(d.id);
          const MetaIcon = DEST_META[d.id].icon;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onToggle(d.id)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-3xl border bg-white/90 p-3 transition",
                active
                  ? "border-[#143834] shadow-[0_10px_30px_-18px_rgba(20,56,52,.55)]"
                  : "border-slate-200/80 hover:border-[#2f6b63]/35",
              )}
            >
              <span
                className={cn(
                  "flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 transition sm:h-20 sm:w-20",
                  active
                    ? "border-[#143834] bg-gradient-to-br from-[#e8f4f1] to-white text-[#1f4b46]"
                    : "border-[#2f6b63]/20 bg-[#f7fbfa] text-[#2f6b63] group-hover:border-[#2f6b63]/45",
                )}
              >
                <MetaIcon className={cn("h-8 w-8", active && "text-[#1f4b46]")} strokeWidth={1.6} />
              </span>
              <span
                className={cn(
                  "text-xs font-bold",
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2f6b63]/15 bg-white px-4 py-3 text-right">
          <p className="text-sm font-extrabold text-[#143834]">מתי יוצאים?</p>
          <p className="mt-1 text-[11px] text-slate-400">* תאריך יציאה</p>
          <p className="mt-1 text-base font-bold tracking-wide text-[#2f6b63]" dir="ltr">
            {from || "—"}
          </p>
          {fromError && <p className="mt-1 text-xs text-rose-600">{fromError}</p>}
        </div>
        <div className="rounded-2xl border border-[#2f6b63]/15 bg-white px-4 py-3 text-right">
          <p className="text-sm font-extrabold text-[#143834]">מתי חוזרים?</p>
          <p className="mt-1 text-[11px] text-slate-400">* תאריך חזרה</p>
          <p className="mt-1 text-base font-bold tracking-wide text-[#2f6b63]" dir="ltr">
            {to || "—"}
          </p>
          {toError && <p className="mt-1 text-xs text-rose-600">{toError}</p>}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white bg-white p-2 shadow-[0_18px_50px_-28px_rgba(20,56,52,.45)] sm:p-4">
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
            months: "flex flex-col gap-4 sm:flex-row sm:gap-6",
            caption_label: "text-sm font-bold text-[#143834]",
            head_cell: "text-[#2f6b63]/70 rounded-md w-9 font-semibold text-[0.75rem]",
            day_selected:
              "bg-[#2f6b63] text-white hover:bg-[#275a53] hover:text-white focus:bg-[#2f6b63] focus:text-white",
            day_range_middle: "aria-selected:bg-[#e8f4f1] aria-selected:text-[#143834]",
            day_today: "bg-[#e8f4f1] text-[#143834]",
          }}
        />
        <p className="mt-2 text-center text-sm font-semibold text-[#2f6b63]">
          {days != null ? `סה״כ: ${days} ימים` : "בחרו טווח תאריכים בלוח"}
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
      className="inline-flex overflow-hidden rounded-full border border-[#2f6b63]/25 bg-white shadow-sm"
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
            "min-w-[64px] px-4 py-2 text-sm font-bold transition",
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
    <div className="rounded-[22px] border border-[#d7e8e3] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3 text-right">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f6b63] text-sm font-bold text-white">
            {number}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-relaxed text-[#143834]">{title}</p>
            {note && <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{note}</p>}
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
  checked,
  onChange,
  icon,
  variant = "optional",
  children,
}: CoverageCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-white transition",
        checked ? "border-[#2f6b63]/35 shadow-[0_12px_28px_-22px_rgba(47,107,99,.7)]" : "border-[#cfe0db]",
      )}
    >
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex w-full items-stretch gap-0 text-right"
      >
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 border-l border-[#e5efec] bg-[#f4faf8] px-2 py-3 text-[10px] font-semibold text-[#2f6b63]">
          {icon || <Umbrella className="h-5 w-5" />}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[#143834]">{title}</p>
            {description && (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{description}</p>
            )}
            {footnote && <p className="mt-1 text-[10px] text-slate-400">{footnote}</p>}
            {variant === "included" && checked && (
              <p className="mt-1 text-xs font-bold text-[#2f6b63]">כלול ברובד הבסיס</p>
            )}
            {variant === "optout" && (
              <p className="mt-1 text-[10px] text-slate-400">ניתן להסיר כיסוי זה</p>
            )}
          </div>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition",
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

export const COVERAGE_ICONS = {
  rescue: <ShieldAlert className="h-5 w-5" />,
  thirdParty: <Users className="h-5 w-5" />,
  baggage: <Luggage className="h-5 w-5" />,
  cancel: <Plane className="h-5 w-5" />,
  health: <HeartPulse className="h-5 w-5" />,
  pregnancy: <Baby className="h-5 w-5" />,
  adventure: <MountainSnow className="h-5 w-5" />,
  winter: <Snowflake className="h-5 w-5" />,
  pro: <BriefcaseMedical className="h-5 w-5" />,
  accident: <ShieldAlert className="h-5 w-5" />,
  laptop: <Laptop className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  bike: <Bike className="h-5 w-5" />,
  car: <Car className="h-5 w-5" />,
  camera: <Camera className="h-5 w-5" />,
};
