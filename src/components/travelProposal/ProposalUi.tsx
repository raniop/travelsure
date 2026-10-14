import { type ReactNode, useEffect, useState } from "react";
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
        <h3 className="text-[24px] font-black text-[#000144]" style={{ textAlign: "center" }}>
          בחרו יעד נסיעה
        </h3>
      </div>
      <div className="mx-auto max-w-[860px] rounded-[28px] bg-[#F3F5F8] px-3 py-6 sm:px-6 sm:py-8">
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
                      ? "outline outline-[3.5px] outline-[#00A247] outline-offset-0"
                      : "outline outline-2 outline-[#E3E7EE] outline-offset-0 hover:outline-[#000144]/30",
                  )}
                >
                  <DestMapIcon id={d.id} active={active} />
                  <span
                    className="mt-0 max-w-[120px] text-center text-[12px] font-bold leading-snug text-[#000144] sm:max-w-[132px] sm:text-[13px]"
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
  const [month, setMonth] = useState<Date>(() => selected ?? minDay ?? new Date());

  useEffect(() => {
    if (selected) setMonth(selected);
  }, [value]);

  const field = (
    <>
      <p className={cn("font-extrabold text-[#000144]", compact ? "text-[13px]" : "text-[16px]")}>{label}</p>
      {!compact && <p className="mt-1 text-[12px] font-medium text-[#8A94AD]">{hint}</p>}
      <div className={cn("relative", compact ? "mt-1.5" : "mt-2")}>
        <input
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          placeholder="DD/MM/YYYY"
          value={value}
          onChange={(e) => onValueChange(maskDate(e.target.value))}
          onClick={() => {
            setMonth(selected ?? minDay ?? new Date());
            setOpen(true);
          }}
          className={cn(
            "h-[52px] w-full rounded-[14px] border-2 border-[#D5DAE3] bg-white px-3 pe-11 text-center text-[17px] font-bold tracking-wide text-[#000144] outline-none transition focus:border-[#00A247]",
          )}
        />
        <button
          type="button"
          aria-label="פתיחת תאריכון"
          onClick={() => {
            setMonth(selected ?? minDay ?? new Date());
            setOpen(true);
          }}
          className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#000144] transition hover:bg-[#F3F5F8]"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setMonth(selected ?? minDay ?? new Date());
        }}
      >
        <DialogContent
          className="max-h-[90vh] w-[min(100vw-1.5rem,360px)] overflow-y-auto rounded-[24px] p-4 font-rubik sm:rounded-[24px]"
          dir="rtl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-[18px] font-black text-[#000144]">
              {label}
            </DialogTitle>
            <DialogDescription className="sr-only">בחירת תאריך בלוח שנה</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center" dir="ltr">
            <Calendar
              mode="single"
              locale={he}
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              disabled={minDay ? { before: minDay } : undefined}
              onSelect={(date) => {
                if (!date) return;
                onValueChange(toDdMmYyyy(date));
                setOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </>
  );

  if (compact) return <div className="text-right">{field}</div>;

  return (
    <div className="rounded-[20px] border-2 border-[#E3E7EE] bg-white px-4 py-3 text-right">{field}</div>
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
    <div className="rounded-[20px] border-2 border-[#E3E7EE] bg-[#F3F5F8] p-4">
      <p className="mb-3 text-[16px] font-bold text-[#000144]">תקופת שהייה בארה״ב (אם רלוונטי)</p>
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
        <p className="text-center text-[16px] font-bold text-[#000144]" style={{ textAlign: "center" }}>
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
      className="inline-flex overflow-hidden rounded-full border-2 border-[#D5DAE3] bg-white"
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
            "min-h-[44px] min-w-[72px] px-5 py-2.5 text-[15px] font-extrabold transition",
            value === opt.v
              ? "bg-[#000144] text-white"
              : "bg-transparent text-[#000144] hover:bg-[#F3F5F8]",
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
    <div className="rounded-[24px] border-2 border-[#E3E7EE] bg-white p-4 sm:p-5">
      {/* Avoid justify-between — global RTL CSS reverses it and puts כן/לא on the right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 gap-3 text-right">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#000144] text-sm font-bold text-white">
            {number}
          </span>
          <div className="min-w-0">
            <p className="text-[16px] font-extrabold leading-relaxed text-[#000144]">{title}</p>
            {note && <p className="mt-2 text-[13px] font-medium leading-relaxed text-[#46557A]">{note}</p>}
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
        "overflow-hidden rounded-[20px] bg-white transition duration-200",
        checked ? "ring-2 ring-[#000144]" : "ring-2 ring-[#E3E7EE]",
        locked && "ring-[#000144]",
      )}
    >
      <div
        className={cn(
          "flex w-full items-stretch",
          checked || locked ? "bg-[#F3F5F8]" : "bg-white",
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
                ? "border-[#00A247] bg-[#00A247] text-[#000144]"
                : "border-[#D5DAE3] bg-white text-transparent",
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
            "flex shrink-0 items-center px-1 text-[#000144]",
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
          <p className="text-[16px] font-extrabold leading-snug text-[#000144]">{title}</p>
          {description && (
            <p className="mt-1 whitespace-pre-line text-[13px] font-medium leading-relaxed text-[#33405F]">
              {description}
            </p>
          )}
          {locked && (
            <p className="mt-1.5 text-[12px] font-bold text-[#000144]">
              חובה לפי הצהרת הבריאות — לא ניתן להסיר
            </p>
          )}
          {footnote && !locked && <p className="mt-1.5 text-[12px] font-medium text-[#46557A]">{footnote}</p>}
          {variant === "included" && checked && !locked && (
            <p className="mt-1 text-[12px] font-bold text-[#00A247]">כלול ברובד הבסיס</p>
          )}
        </button>

        {/* Far left in RTL: מידע נוסף — opens centered dialog (not toast) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setInfoOpen(true);
          }}
          className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-1 border-e-2 border-[#E3E7EE] bg-white px-1.5 py-3 text-[#000144] transition hover:bg-[#F3F5F8]"
          aria-label={`מידע נוסף על ${title}`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#000144] text-[11px] font-bold">
            <Info className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
          <span className="text-center text-[10px] font-bold leading-tight">
            מידע
            <br />
            נוסף
          </span>
        </button>
      </div>
      {checked && children && (
        <div className="border-t-2 border-[#E3E7EE] bg-white px-4 py-3">{children}</div>
      )}

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md overflow-hidden rounded-[24px] border-[#E3E7EE] p-0 font-rubik sm:rounded-[24px]" dir="rtl">
          <DialogHeader className="space-y-3 border-b-2 border-[#E3E7EE] bg-[#F3F5F8] px-5 py-4 text-right">
            <div className="flex items-center gap-3">
              <span className="text-[#00A247]">{icon || <Umbrella className="h-7 w-7" strokeWidth={1.5} />}</span>
              <DialogTitle className="text-right text-[20px] font-black text-[#000144]">
                {title}
              </DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="space-y-3 px-5 py-4 text-right text-[15px] font-medium leading-relaxed text-[#33405F]">
              <p className="whitespace-pre-line">
                {detailText || "פרטי הכיסוי יופיעו בהצעה לאחר חיתום בהראל."}
              </p>
              {locked && (
                <p className="rounded-[14px] bg-[#F3F5F8] px-3 py-2 text-[13px] font-bold text-[#000144]">
                  כיסוי זה חובה לפי תשובות בהצהרת הבריאות ולא ניתן להסרה.
                </p>
              )}
              <p className="text-[12px] font-medium text-[#46557A]">
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
                      ? "border-[#000144] bg-[#000144] text-white"
                      : done
                        ? "border-[#00A247] bg-[#00A247] text-[#000144]"
                        : "border-[#D5DAE3] bg-white text-[#46557A]",
                  )}
                >
                  {done ? (
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  )}
                  {done && (
                    <span className="absolute -left-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#000144] text-white ring-2 ring-[#F3F5F8]">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-bold sm:text-[12px]",
                    active || done ? "text-[#000144]" : "text-[#46557A]",
                  )}
                >
                  {meta?.label || s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mb-5 h-0.5 w-3 shrink-0 sm:w-5",
                    i < currentIndex ? "bg-[#00A247]" : "bg-[#D5DAE3]",
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
