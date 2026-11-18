import { useCallback, useEffect, useState } from "react";
import { apiClient, type Receipt } from "@/integrations/api/client";
import { compressImage } from "@/lib/bbq/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, ReceiptText, Trash2 } from "lucide-react";

const LABELS = ["קצב", "סופר", "אחר"];

/** The bills behind an event's cost: everyone can open them; the admin adds or removes. */
export function EventReceipts({ eventId, isAdmin }: { eventId: string; isAdmin: boolean }) {
  const [items, setItems] = useState<Receipt[]>([]);
  const [viewing, setViewing] = useState<{ id: string; src: string } | null>(null);
  const [label, setLabel] = useState(LABELS[0]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    apiClient
      .getReceipts(eventId)
      .then(setItems)
      .catch(() => setItems([]));
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (id: string) => {
    setViewing({ id, src: "" });
    try {
      const r = await apiClient.getReceipt(id);
      setViewing({ id, src: r.image || "" });
    } catch {
      setViewing(null);
    }
  };

  const add = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const image = await compressImage(file, 1800, 0.8);
      await apiClient.createReceipt({ event_id: eventId, image, label, amount: parseFloat(amount) || undefined });
      setAmount("");
      toast({ title: "הקבלה נשמרה", description: "כל חברי הקבוצה יכולים לראות אותה" });
      load();
    } catch (e) {
      toast({ title: "לא נשמר", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את הקבלה?")) return;
    try {
      await apiClient.deleteReceipt(id);
      setViewing(null);
      load();
    } catch (e) {
      toast({ title: "שגיאה", description: (e as Error).message, variant: "destructive" });
    }
  };

  if (!isAdmin && items.length === 0) return null;

  return (
    <div className="space-y-3 text-right" dir="rtl">
      <h3 className="flex items-center gap-2 font-semibold">
        <ReceiptText className="h-4 w-4 text-primary" />
        קבלות
      </h3>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => open(r.id)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/70"
            >
              <ReceiptText className="h-4 w-4" />
              {r.label || "קבלה"}
              {r.amount ? <span dir="ltr" className="tabular-nums">· {Number(r.amount).toFixed(0)} ₪</span> : null}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">צלמו את החשבוניות מהקצב ומהסופר — החברים יראו על מה חויבו.</p>
      )}

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {LABELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLabel(l)}
                className={`rounded-md px-3 py-1 text-sm ${label === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="סכום (לא חובה)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 w-36 text-left"
            dir="ltr"
          />
          <Button asChild size="sm" variant="outline" disabled={busy}>
            <label className="cursor-pointer">
              <ImagePlus className="ml-1.5 h-4 w-4" />
              {busy ? "שומר..." : "הוספת קבלה"}
              <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => add(e.target.files?.[0])} />
            </label>
          </Button>
        </div>
      )}

      {viewing && (
        <Dialog open onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="sm:max-w-[620px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">קבלה</DialogTitle>
            </DialogHeader>
            {viewing.src ? (
              <img src={viewing.src} alt="קבלה" className="max-h-[70vh] w-full object-contain" />
            ) : (
              <p className="py-10 text-center text-muted-foreground">טוען...</p>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" className="justify-start text-red-600" onClick={() => remove(viewing.id)}>
                <Trash2 className="ml-1.5 h-4 w-4" />
                מחיקת הקבלה
              </Button>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
