import { type ReactNode, useState } from "react";
import { he } from "date-fns/locale/he";
import { cn } from "@/lib/utils";
import {
  DESTINATION_OPTIONS,
  type DestinationId,
  type Step,
  type YesNo,
} from "@/lib/travelProposal/types";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Baby,
  Bike,
  CalendarDays,
  Camera,
  Car,
  Check,
  HeartPulse,
  Info,
  Laptop,
  Luggage,
  Medal,
  Phone,
  Plane,
  Send,
  ShieldAlert,
  Snowflake,
  Umbrella,
  UserRound,
  Users,
} from "lucide-react";
import europeBlue from "@/assets/destinations/europe-blue.png";
import europeGreen from "@/assets/destinations/europe-green.png";
import africaBlue from "@/assets/destinations/africa-blue.png";
import africaGreen from "@/assets/destinations/africa-green.png";
import canadaBlue from "@/assets/destinations/canada-blue.png";
import canadaGreen from "@/assets/destinations/canada-green.png";
import usaBlue from "@/assets/destinations/usa-blue.png";
import usaGreen from "@/assets/destinations/usa-green.png";
import antarcticaBlue from "@/assets/destinations/antarctica-blue.png";
import antarcticaGreen from "@/assets/destinations/antarctica-green.png";
import australiaBlue from "@/assets/destinations/australia-blue.png";
import australiaGreen from "@/assets/destinations/australia-green.png";
import latamBlue from "@/assets/destinations/latam-blue.png";
import latamGreen from "@/assets/destinations/latam-green.png";
import asiaBlue from "@/assets/destinations/asia-blue.png";
import asiaGreen from "@/assets/destinations/asia-green.png";

const DEST_ICON_SRC: Record<DestinationId, { blue: string; green: string }> = {
  europe: { blue: europeBlue, green: europeGreen },
  africa: { blue: africaBlue, green: africaGreen },
  canada: { blue: canadaBlue, green: canadaGreen },
  usa: { blue: usaBlue, green: usaGreen },
  antarctica: { blue: antarcticaBlue, green: antarcticaGreen },
  australia: { blue: australiaBlue, green: australiaGreen },
  latam: { blue: latamBlue, green: latamGreen },
  asia: { blue: asiaBlue, green: asiaGreen },
};

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
  const src = DEST_ICON_SRC[id][active ? "green" : "blue"];
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="pointer-events-none h-[96px] w-[96px] object-contain sm:h-[108px] sm:w-[108px]"
    />
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
        <h3 className="text-xl font-extrabold text-[#0d3b6e]" style={{ textAlign: "center" }}>
          בחרו יעד נסיעה
        </h3>
      </div>
      <div className="mx-auto max-w-[860px] rounded-[28px] bg-[#e4eef7] px-3 py-6 sm:px-6 sm:py-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-7">
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
                <span
                  className={cn(
                    "flex h-[142px] w-[142px] flex-col items-center justify-center rounded-full bg-white transition sm:h-[156px] sm:w-[156px]",
                    active
                      ? "shadow-[0_6px_18px_rgba(47,158,58,0.28)] outline outline-[3.5px] outline-[#2f9e3a] outline-offset-0"
                      : "shadow-[0_6px_18px_rgba(45,110,170,0.18)]",
                  )}
                >
                  <DestMapIcon id={d.id} active={active} />
                  <span
                    className="mt-0 max-w-[120px] text-center text-[12px] font-semibold leading-snug text-[#2f6fa8] sm:max-w-[132px] sm:text-[13px]"
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

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function TripDateField({
  label,
  hint,
  value,
  onValueChange,
  error,
  disabledBefore,
  compact,
}: {
  label: string;
  hint: string;
  value: string;
  onValueChange: (next: string) => void;
  error?: string;
  /** Dates strictly before this day are disabled in the calendar */
  disabledBefore?: Date;
  /** Simpler Harel-style field without outer card chrome */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDdMmYyyy(value);
  const minDay = disabledBefore ? startOfDay(disabledBefore) : undefined;

  const field = (
    <>
      <p className={cn("font-extrabold text-[#143834]", compact ? "text-xs" : "text-sm")}>{label}</p>
      {!compact && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      <Popover open={open} onOpenChange={setOpen}>
        <div className={cn("relative", compact ? "mt-1.5" : "mt-2")}>
          <input
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            placeholder="DD/MM/YYYY"
            value={value}
            onChange={(e) => onValueChange(maskDate(e.target.value))}
            onClick={() => setOpen(true)}
            onFocus={() => setOpen(true)}
            className={cn(
              "h-12 w-full border border-slate-200 bg-white px-3 pe-11 text-center text-base font-bold tracking-wide text-[#143834] outline-none transition focus:border-[#2f6b63] focus:ring-2 focus:ring-[#2f6b63]/20",
              compact ? "rounded-full" : "rounded-xl bg-slate-50/80 focus:bg-white",
            )}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="פתיחת תאריכון"
              className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#2f6b63] transition hover:bg-[#e8f4f1]"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className="w-auto p-0"
          align="center"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Calendar
            mode="single"
            locale={he}
            selected={selected}
            defaultMonth={selected ?? minDay ?? new Date()}
            disabled={minDay ? { before: minDay } : undefined}
            onSelect={(date) => {
              if (!date) return;
              onValueChange(toDdMmYyyy(date));
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </>
  );

  if (compact) return <div className="text-right">{field}</div>;

  return (
    <div className="rounded-2xl border border-[#2f6b63]/15 bg-white px-4 py-3 text-right">{field}</div>
  );
}

export function UsaStayDateFields({
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
  const fromDate = parseDdMmYyyy(from);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-[#f4f7f9] p-4">
      <p className="mb-3 text-sm font-bold text-[#143834]">תקופת שהייה בארה״ב (אם רלוונטי)</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TripDateField
          compact
          label="ארה״ב מ-"
          hint=""
          value={from}
          onValueChange={(next) => onChange(next, to)}
          error={fromError}
        />
        <TripDateField
          compact
          label="ארה״ב עד-"
          hint=""
          value={to}
          onValueChange={(next) => onChange(from, next)}
          error={toError}
          disabledBefore={fromDate ? startOfDay(fromDate) : undefined}
        />
      </div>
    </div>
  );
}

/** Calendar on click for the specific field + manual DD/MM/YYYY typing */
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
  const fromDate = parseDdMmYyyy(from);
  const toDate = parseDdMmYyyy(to);
  const days =
    fromDate && toDate
      ? Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1
      : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <TripDateField
          label="מתי יוצאים?"
          hint="* תאריך יציאה · בחרו בלוח או הזינו ידנית"
          value={from}
          onValueChange={(next) => onChange(next, to)}
          error={fromError}
          disabledBefore={startOfDay(new Date())}
        />
        <TripDateField
          label="מתי חוזרים?"
          hint="* תאריך חזרה · בחרו בלוח או הזינו ידנית"
          value={to}
          onValueChange={(next) => onChange(from, next)}
          error={toError}
          disabledBefore={fromDate ? startOfDay(fromDate) : startOfDay(new Date())}
        />
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
  /** Longer copy for the «מידע נוסף» dialog; falls back to description */
  infoDetail?: string;
  footnote?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
  variant?: "included" | "optional" | "optout";
  /** Required by health declaration — cannot be unchecked */
  locked?: boolean;
  children?: ReactNode;
};

/** Harel 1:1 coverage row — no premium/price amounts, coverage-limit copy only */
export function CoverageCard({
  title,
  description,
  infoDetail,
  footnote,
  checked,
  onChange,
  icon,
  variant = "optional",
  locked = false,
  children,
}: CoverageCardProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const detailText = infoDetail || description;
  const toggle = () => {
    if (locked) return;
    onChange(!checked);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(20,60,110,0.08)] transition duration-200",
        checked ? "ring-[1.5px] ring-[#1a6bb5]" : "ring-1 ring-[#d5e4f0]",
        locked && "ring-[#1a6bb5]",
      )}
    >
      <div
        className={cn(
          "flex w-full items-stretch",
          checked || locked ? "bg-[#eaf4fb]" : "bg-white",
        )}
      >
        {/* RTL: first = right — selection circle */}
        <button
          type="button"
          onClick={toggle}
          disabled={locked}
          aria-pressed={checked}
          aria-label={
            locked
              ? `${title} — חובה לפי הצהרת בריאות`
              : checked
                ? `הסרת ${title}`
                : `בחירת ${title}`
          }
          className={cn(
            "flex shrink-0 items-center pe-2 ps-3",
            locked && "cursor-not-allowed",
          )}
        >
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] transition",
              checked || locked
                ? "border-[#2f9e3a] bg-[#2f9e3a] text-white"
                : "border-[#9bb8d4] bg-white text-transparent",
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
        </button>

        {/* Icon */}
        <button
          type="button"
          onClick={toggle}
          disabled={locked}
          className={cn(
            "flex shrink-0 items-center px-1 text-[#1a6bb5]",
            locked && "cursor-not-allowed",
          )}
          tabIndex={-1}
          aria-hidden
        >
          {icon || <Umbrella className="h-7 w-7" strokeWidth={1.5} />}
        </button>

        {/* Title + coverage detail (limits OK, no premium price) */}
        <button
          type="button"
          onClick={toggle}
          disabled={locked}
          className={cn(
            "min-w-0 flex-1 px-2 py-3.5 text-right",
            locked && "cursor-not-allowed",
          )}
        >
          <p className="text-[15px] font-bold leading-snug text-[#0d3b6e]">{title}</p>
          {description && (
            <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#3a5f86]">
              {description}
            </p>
          )}
          {locked && (
            <p className="mt-1.5 text-[11px] font-bold text-[#1a6bb5]">
              חובה לפי הצהרת הבריאות — לא ניתן להסיר
            </p>
          )}
          {footnote && !locked && <p className="mt-1.5 text-[11px] text-[#7a93ad]">{footnote}</p>}
          {variant === "included" && checked && !locked && (
            <p className="mt-1 text-[11px] font-semibold text-[#1a6bb5]">כלול ברובד הבסיס</p>
          )}
        </button>

        {/* Far left in RTL: מידע נוסף — opens centered dialog (not toast) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setInfoOpen(true);
          }}
          className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-1 border-e border-[#d5e4f0] bg-[#eef5fb] px-1.5 py-3 text-[#1a6bb5] transition hover:bg-[#e0eef8]"
          aria-label={`מידע נוסף על ${title}`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-[#1a6bb5] text-[11px] font-bold">
            <Info className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
          <span className="text-center text-[9px] font-semibold leading-tight">
            מידע
            <br />
            נוסף
          </span>
        </button>
      </div>
      {checked && children && (
        <div className="border-t border-[#d5e4f0] bg-[#f5f9fc] px-4 py-3">{children}</div>
      )}

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md rounded-2xl border-[#d5e4f0] p-0 sm:rounded-2xl" dir="rtl">
          <DialogHeader className="space-y-3 border-b border-[#e8f1f8] bg-[#eaf4fb] px-5 py-4 text-right">
            <div className="flex items-center gap-3">
              <span className="text-[#1a6bb5]">{icon || <Umbrella className="h-7 w-7" strokeWidth={1.5} />}</span>
              <DialogTitle className="text-right text-lg font-extrabold text-[#0d3b6e]">
                {title}
              </DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-3 px-5 py-4 text-right text-sm leading-relaxed text-[#3a5f86]">
              <p className="whitespace-pre-line">
                {detailText || "פרטי הכיסוי יופיעו בהצעה לאחר חיתום בהראל."}
              </p>
              {locked && (
                <p className="rounded-xl bg-[#eaf4fb] px-3 py-2 text-xs font-semibold text-[#0d3b6e]">
                  כיסוי זה חובה לפי תשובות בהצהרת הבריאות ולא ניתן להסרה.
                </p>
              )}
              <p className="text-xs text-[#7a93ad]">
                הפירוט להמחשה לפי הראל · הכיסוי הסופי בהתאם לתנאי הפוליסה ולחיתום.
              </p>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const STEP_META: Partial<Record<Step, { label: string; icon: typeof Plane; short?: string }>> = {
  identity: { label: "זיהוי", icon: UserRound },
  trip: { label: "לאן?", icon: Plane, short: "יעד" },
  insureds: { label: "נוסעים", icon: Users },
  health: { label: "בריאות", icon: HeartPulse },
  plan: { label: "כיסויים", icon: Umbrella },
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
  rescue: <ShieldAlert className="h-7 w-7" strokeWidth={1.5} />,
  thirdParty: <Users className="h-7 w-7" strokeWidth={1.5} />,
  baggage: <Luggage className="h-7 w-7" strokeWidth={1.5} />,
  cancel: <Plane className="h-7 w-7" strokeWidth={1.5} />,
  health: <HeartPulse className="h-7 w-7" strokeWidth={1.5} />,
  pregnancy: <Baby className="h-7 w-7" strokeWidth={1.5} />,
  adventure: <Bike className="h-7 w-7" strokeWidth={1.5} />,
  winter: <Snowflake className="h-7 w-7" strokeWidth={1.5} />,
  pro: <Medal className="h-7 w-7" strokeWidth={1.5} />,
  accident: <Users className="h-7 w-7" strokeWidth={1.5} />,
  laptop: <Laptop className="h-7 w-7" strokeWidth={1.5} />,
  phone: <Phone className="h-7 w-7" strokeWidth={1.5} />,
  bike: <Bike className="h-7 w-7" strokeWidth={1.5} />,
  car: <Car className="h-7 w-7" strokeWidth={1.5} />,
  camera: <Camera className="h-7 w-7" strokeWidth={1.5} />,
};
