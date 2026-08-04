import { type ReactNode } from "react";
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

const maskDate = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
};

const DestMapIcon = ({ id, active }: { id: DestinationId; active: boolean }) => {
  // Harel 1:1 — idle: light-blue fill + medium-blue outline; selected: light-green fill + green outline
  const stroke = active ? "#2f9e3a" : "#4a90c8";
  const fill = active ? "#b7df9e" : "#c8dff0";
  return (
    <svg viewBox="0 0 48 48" className="h-[46px] w-[52px] sm:h-[52px] sm:w-[58px]" aria-hidden>
      <path
        d={DESTINATION_MAP_PATHS[id]}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
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
    <div className="space-y-4">
      <div className="tp-center" style={{ textAlign: "center" }}>
        <h3 className="text-xl font-extrabold text-[#143834]" style={{ textAlign: "center" }}>
          בחרו יעד נסיעה
        </h3>
      </div>
      {/* Pale blue panel matching Harel destination screen */}
      <div className="mx-auto max-w-[760px] rounded-2xl bg-[#e8f1f8] px-2 py-5 sm:px-5 sm:py-7">
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-5 sm:gap-y-6">
          {DESTINATION_OPTIONS.map((d) => {
            const active = selected.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onToggle(d.id)}
                aria-pressed={active}
                className="mx-auto flex flex-col items-center justify-center focus-visible:outline-none"
              >
                {/* White circle · soft shadow · label inside · thick black ring when selected */}
                <span
                  className={cn(
                    "flex h-[120px] w-[120px] flex-col items-center justify-center rounded-full bg-white px-2 transition sm:h-[132px] sm:w-[132px]",
                    active
                      ? "shadow-[0_4px_14px_rgba(0,0,0,0.14)] outline outline-[3.5px] outline-black outline-offset-0"
                      : "shadow-[0_3px_12px_rgba(40,80,130,0.14)]",
                  )}
                >
                  <DestMapIcon id={d.id} active={active} />
                  <span
                    className={cn(
                      "mt-1 max-w-[96px] text-center text-[11.5px] font-semibold leading-snug sm:max-w-[108px] sm:text-[13px]",
                      active ? "text-[#1a2f4a]" : "text-[#4a90c8]",
                    )}
                    style={{ textAlign: "center" }}
                  >
                    {d.labelHe}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {error && (
        <p className="text-center text-xs text-rose-600" style={{ textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Manual trip dates only — no calendar popup */
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
  const days = (() => {
    const f = parseDdMmYyyy(from);
    const t = parseDdMmYyyy(to);
    if (!f || !t) return null;
    return Math.round((t.getTime() - f.getTime()) / 86400000) + 1;
  })();

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2f6b63]/15 bg-white px-4 py-3 text-right">
          <p className="text-sm font-extrabold text-[#143834]">מתי יוצאים?</p>
          <p className="mt-1 text-[11px] text-slate-400">* תאריך יציאה · DD/MM/YYYY</p>
          <input
            dir="ltr"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={from}
            onChange={(e) => onChange(maskDate(e.target.value), to)}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-center text-base font-bold tracking-wide text-[#143834] outline-none transition focus:border-[#2f6b63] focus:bg-white focus:ring-2 focus:ring-[#2f6b63]/20"
          />
          {fromError && <p className="mt-1 text-xs text-rose-600">{fromError}</p>}
        </div>
        <div className="rounded-2xl border border-[#2f6b63]/15 bg-white px-4 py-3 text-right">
          <p className="text-sm font-extrabold text-[#143834]">מתי חוזרים?</p>
          <p className="mt-1 text-[11px] text-slate-400">* תאריך חזרה · DD/MM/YYYY</p>
          <input
            dir="ltr"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={to}
            onChange={(e) => onChange(from, maskDate(e.target.value))}
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-center text-base font-bold tracking-wide text-[#143834] outline-none transition focus:border-[#2f6b63] focus:bg-white focus:ring-2 focus:ring-[#2f6b63]/20"
          />
          {toError && <p className="mt-1 text-xs text-rose-600">{toError}</p>}
        </div>
      </div>
      {days != null && days > 0 && (
        <p className="text-center text-sm font-bold text-[#2f6b63]" style={{ textAlign: "center" }}>
          סה״כ: {days === 1 ? "יום אחד" : `${days} ימים`}
        </p>
      )}
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
            <p className="text-[15px] font-extrabold text-[#143834]">{title}</p>
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

const STEP_META: Partial<Record<Step, { label: string; icon: typeof Plane; short?: string }>> = {
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
