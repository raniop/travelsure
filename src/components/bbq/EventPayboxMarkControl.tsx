import { useState } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Banknote, CheckCircle2, Pencil, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";

export type EventPayboxFields = {
  id: string;
  event_date: string;
  description?: string | null;
  butcher_cost?: number;
  grocery_cost?: number;
  total_cost?: number;
  paybox_cash_out?: number | null;
};

function eventTotalCost(event: EventPayboxFields): number {
  const butcher = Number(event.butcher_cost) || 0;
  const grocery = Number(event.grocery_cost) || 0;
  const summed = butcher + grocery;
  return summed > 0 ? summed : Number(event.total_cost) || 0;
}

function hasPayboxMark(event: EventPayboxFields): boolean {
  const v = event.paybox_cash_out;
  return v != null && v !== undefined && !Number.isNaN(Number(v));
}

interface EventPayboxMarkControlProps {
  event: EventPayboxFields;
  onUpdated: () => void;
  /** כרטיס קומפקטי ברשימת אירועים */
  compact?: boolean;
  showDate?: boolean;
}

export function EventPayboxMarkControl({
  event,
  onUpdated,
  compact = false,
  showDate = false,
}: EventPayboxMarkControlProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const total = eventTotalCost(event);
  const marked = hasPayboxMark(event);
  const markedAmount = marked ? Number(event.paybox_cash_out) : 0;

  const savePaybox = async (amount: number | null) => {
    try {
      setSaving(true);
      const fresh = await apiClient.getEvent(event.id);
      await apiClient.updateEvent(event.id, {
        ...fresh,
        paybox_cash_out: amount,
      });
      toast({
        title: amount != null ? "נשמר" : "הסימון הוסר",
        description:
          amount != null
            ? `סומן ששילמת מפייבוקס ${amount.toFixed(2)} ₪`
            : "אפשר לסמן שוב מאוחר יותר",
      });
      setEditingAmount(false);
      setCustomAmount("");
      onUpdated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "שגיאה בשמירה";
      toast({ title: "שגיאה", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = event.event_date
    ? format(new Date(event.event_date), "d/M/yyyy", { locale: he })
    : "";

  if (compact) {
    return compactPayboxBadge({
      marked,
      markedAmount,
      onMark: () => void savePaybox(total),
      onClear: () => void savePaybox(null),
      saving,
      total,
    });
  }

  return (
    <div
      className={`rounded-lg border p-3 text-right space-y-2 ${
        marked
          ? "border-green-300 bg-green-50/80 dark:bg-green-950/20"
          : "border-amber-300 bg-amber-50/60 dark:bg-amber-950/15"
      }`}
      dir="rtl"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {marked ? (
            <Badge className="bg-green-600 hover:bg-green-600 gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              שולם מפייבוקס
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-800 bg-amber-50">
              לא סומן תשלום פייבוקס
            </Badge>
          )}
        </div>
        <div className="min-w-0 text-right">
          {showDate && <div className="text-sm font-semibold">{dateLabel}</div>}
          {event.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{event.description}</div>
          )}
          <div className="text-xs text-muted-foreground mt-0.5">
            עלות אירוע: <span dir="ltr" className="tabular-nums font-medium">{total.toFixed(2)} ₪</span>
          </div>
        </div>
      </div>

      {marked && (
        <p className="text-sm">
          משיכה/תשלום מפייבוקס שסומן:{" "}
          <strong dir="ltr" className="tabular-nums">
            {markedAmount.toFixed(2)} ₪
          </strong>
          {Math.abs(markedAmount - total) > 0.01 && (
            <span className="text-xs text-muted-foreground mr-2">
              (הפרש מעלות: {(markedAmount - total).toFixed(2)} ₪)
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-2 justify-end">
        {!marked && !editingAmount && (
          <>
            <Button
              type="button"
              size="sm"
              disabled={saving || total <= 0}
              onClick={() => void savePaybox(total)}
              className="gap-1.5 bg-green-600 hover:bg-green-700"
            >
              <Banknote className="w-4 h-4" />
              סמן ששילמתי ({total.toFixed(2)} ₪)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setEditingAmount(true);
                setCustomAmount(total > 0 ? total.toFixed(2) : "");
              }}
            >
              <Pencil className="w-4 h-4 ml-1" />
              סכום אחר
            </Button>
          </>
        )}
        {editingAmount && (
          <div className="flex flex-wrap items-center gap-2 w-full justify-end">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="max-w-[140px] text-left tabular-nums"
              dir="ltr"
              placeholder="סכום"
            />
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => {
                const n = parseFloat(customAmount);
                if (isNaN(n) || n < 0) {
                  toast({ title: "סכום לא תקין", variant: "destructive" });
                  return;
                }
                void savePaybox(parseFloat(n.toFixed(2)));
              }}
            >
              שמור
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditingAmount(false)}>
              ביטול
            </Button>
          </div>
        )}
        {marked && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setEditingAmount(true);
                setCustomAmount(markedAmount.toFixed(2));
              }}
            >
              ערוך סכום
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={saving}
              className="text-muted-foreground"
              onClick={() => void savePaybox(null)}
            >
              <X className="w-4 h-4 ml-1" />
              בטל סימון
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function compactPayboxBadge({
  marked,
  markedAmount,
  onMark,
  onClear,
  saving,
  total,
}: {
  marked: boolean;
  markedAmount: number;
  onMark: () => void;
  onClear: () => void;
  saving: boolean;
  total: number;
}) {
  if (marked) {
    return (
      <button
        type="button"
        title="לחץ לביטול סימון פייבוקס"
        disabled={saving}
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="flex items-center gap-1 px-2 py-1 rounded-md border border-green-300 bg-green-100 text-green-800 text-[10px] font-bold"
      >
        <CheckCircle2 className="w-3 h-3" />
        <span>פייבוקס {markedAmount.toFixed(0)} ₪</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      title="סמן ששילמת מקופת פייבוקס"
      disabled={saving || total <= 0}
      onClick={(e) => {
        e.stopPropagation();
        onMark();
      }}
      className="flex items-center gap-1 px-2 py-1 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-[10px] font-medium hover:bg-amber-100"
    >
      <Banknote className="w-3 h-3" />
      <span>סמן פייבוקס</span>
    </button>
  );
}
