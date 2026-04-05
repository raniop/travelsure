import { useState } from "react";
import { apiClient } from "@/integrations/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Scale, Loader2 } from "lucide-react";

/** מחלק את gap (בשקלים) ל-n חלקים שווים באגורות, סכום מדויק */
function splitGapShekels(gap: number, n: number): number[] {
  if (n <= 0) return [];
  const cents = Math.round(gap * 100);
  const sign = cents >= 0 ? 1 : -1;
  const abs = Math.abs(cents);
  const q = Math.floor(abs / n);
  const r = abs % n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const c = q + (i < r ? 1 : 0);
    out.push((sign * c) / 100);
  }
  return out;
}

interface PayboxBalanceAlignDialogProps {
  groupId: string;
  /** סכום יתרות כל החברים הפעילים (כמו בכרטיס "יתרה נוכחית" למנהל) */
  currentSumBalances: number;
  onApplied: () => void;
}

/**
 * מאפשר להתאים את סכום יתרות החברים בקבוצה ליעד (למשל יתרה בפייבוקס),
 * על ידי חלוקת ההפרש **שווה** בין כל החברים הפעילים.
 */
export function PayboxBalanceAlignDialog({
  groupId,
  currentSumBalances,
  onApplied,
}: PayboxBalanceAlignDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetStr, setTargetStr] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const target = parseFloat(targetStr.replace(",", "."));
  const gap = Number.isFinite(target) ? target - currentSumBalances : NaN;

  const handleApply = async () => {
    if (!Number.isFinite(target) || !Number.isFinite(gap)) {
      toast({
        title: "סכום לא תקין",
        description: "הזן מספר (למשל 1696.76)",
        variant: "destructive",
      });
      return;
    }
    if (Math.abs(gap) < 0.005) {
      toast({ title: "אין מה לעדכן", description: "היעד שווה לסכום היתרות הנוכחי" });
      setOpen(false);
      return;
    }

    try {
      setLoading(true);
      const members = await apiClient.getMembers(groupId);
      const active = members.filter((m: any) => m.is_active !== false);
      if (active.length === 0) {
        toast({ title: "אין חברים פעילים", variant: "destructive" });
        return;
      }

      const sumActive = active.reduce((s: number, m: any) => {
        const b = m.balance != null ? (typeof m.balance === "string" ? parseFloat(m.balance) : m.balance) : 0;
        return s + parseFloat(b.toFixed(2));
      }, 0);

      const actualGap = parseFloat((target - sumActive).toFixed(2));
      if (Math.abs(actualGap) < 0.005) {
        toast({ title: "כבר מסונכרן", description: "סכום יתרות החברים כבר תואם ליעד" });
        setOpen(false);
        return;
      }

      const parts = splitGapShekels(actualGap, active.length);
      for (let i = 0; i < active.length; i++) {
        const m = active[i];
        const cur =
          m.balance != null ? (typeof m.balance === "string" ? parseFloat(m.balance) : m.balance) : 0;
        const newBal = parseFloat((cur + parts[i]).toFixed(2));
        await apiClient.updateMember(m.id, { ...m, balance: newBal });
      }

      toast({
        title: "התאמה בוצעה",
        description: `עודכנו ${active.length} חברים. סה״כ שינוי: ${actualGap >= 0 ? "+" : ""}${actualGap.toFixed(2)} ₪`,
      });
      setOpen(false);
      setTargetStr("");
      onApplied();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "שגיאה",
        description: e?.message || "לא הצלחנו לעדכן",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm" className="gap-2 shrink-0">
          <Scale className="w-4 h-4" />
          התאמה לפייבוקס
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">התאמת יתרות ליעד (פייבוקס)</DialogTitle>
          <DialogDescription className="text-right text-pretty">
            מחשב את ההפרש בין <strong>סכום יתרות כל החברים הפעילים</strong> לבין היעד שהזנת (למשל יתרה
            שמופיעה בפייבוקס), ומחלק את ההפרש <strong>שווה</strong> בין כל החברים — מעדכן יתרה לכל חבר
            בנפרד. זה מתאים כשהכסף בפייבוקס תואם את הקופה אבל הרישום באפליקציה היה חסר או שונה.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-md bg-muted/50 p-3 text-sm text-right">
            <div>
              סכום יתרות נוכחי (חברים פעילים):{" "}
              <span dir="ltr" className="tabular-nums font-semibold">
                {currentSumBalances.toFixed(2)} ₪
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paybox-target" className="text-right block">
              יעד — סה״כ יתרות רצוי (₪)
            </Label>
            <Input
              id="paybox-target"
              dir="ltr"
              className="tabular-nums"
              placeholder="למשל 1696.76"
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
            />
          </div>
          {Number.isFinite(gap) && (
            <p className="text-sm text-right text-muted-foreground">
              הפרש לחלוקה:{" "}
              <span dir="ltr" className="tabular-nums font-medium text-foreground">
                {gap >= 0 ? "+" : ""}
                {gap.toFixed(2)} ₪
              </span>
            </p>
          )}
        </div>
        <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            ביטול
          </Button>
          <Button onClick={() => void handleApply()} disabled={loading || !Number.isFinite(gap)}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            החל התאמה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
