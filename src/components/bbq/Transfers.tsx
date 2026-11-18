import { useCallback, useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { apiClient, type TransferRequest } from "@/integrations/api/client";
import { PAYBOX_GROUP_LINK } from "@/lib/bbq/payboxMessages";
import { compressImage } from "@/lib/bbq/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, ExternalLink, ImagePlus, Send, X, Clock, Image as ImageIcon } from "lucide-react";

const when = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : format(d, "dd/MM/yyyy HH:mm");
};

export function TransferStatusBadge({ status }: { status: TransferRequest["status"] }) {
  if (status === "approved") return <Badge className="bg-emerald-600 hover:bg-emerald-600">אושר ונוסף ליתרה</Badge>;
  if (status === "rejected") return <Badge variant="destructive">לא אושר</Badge>;
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      ממתין לאישור
    </Badge>
  );
}

/**
 * "העברתי": the member transfers in PayBox, then reports the amount (and optionally a screenshot).
 * The balance changes only after the group admin approves; the approval is written to the ledger.
 */
export function ReportTransferDialog({
  suggestedAmount,
  onSubmit,
  onDone,
  children,
}: {
  suggestedAmount?: number;
  onSubmit: (data: { amount: number; note?: string; proof_image?: string }) => Promise<unknown>;
  onDone?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setAmount(suggestedAmount && suggestedAmount > 0 ? String(Math.ceil(suggestedAmount)) : "");
    setNote("");
    setProof("");
  }, [open, suggestedAmount]);

  const value = parseFloat(amount);
  const valid = !Number.isNaN(value) && value > 0 && value <= 20000;

  const pickImage = async (file?: File) => {
    if (!file) return;
    try {
      setProof(await compressImage(file, 1400, 0.75));
    } catch (e) {
      toast({ title: "שגיאה", description: (e as Error).message, variant: "destructive" });
    }
  };

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onSubmit({ amount: Math.round(value * 100) / 100, note: note.trim() || undefined, proof_image: proof || undefined });
      toast({ title: "הדיווח נשלח", description: "מנהל הקבוצה יאשר, והסכום יתווסף ליתרה שלך וליומן." });
      setOpen(false);
      onDone?.();
    } catch (e) {
      toast({ title: "לא נשלח", description: (e as Error).message || "נסו שוב", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">העברתי כסף לקופה</DialogTitle>
          <DialogDescription className="text-right">
            1. מעבירים בקבוצת ה-PayBox. 2. מדווחים כאן כמה. 3. המנהל מאשר — והסכום נכנס ליתרה, עם שורה ביומן.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Button asChild variant="outline" className="justify-between">
            <a href={PAYBOX_GROUP_LINK} target="_blank" rel="noreferrer">
              פתיחת קבוצת ה-PayBox
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>

          <div className="grid gap-2">
            <Label htmlFor="transfer-amount">כמה העברת? (₪)</Label>
            <Input
              id="transfer-amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              dir="ltr"
              className="text-left tabular-nums text-lg"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="למשל 300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transfer-note">הערה (לא חובה)</Label>
            <Input id="transfer-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="למשל: העברתי היום ב-PayBox" />
          </div>

          <div className="grid gap-2">
            <Label>צילום מסך של ההעברה (לא חובה, עוזר לאשר מהר)</Label>
            {proof ? (
              <div className="relative">
                <img src={proof} alt="צילום ההעברה" className="max-h-48 w-full rounded-lg border object-contain bg-muted" />
                <Button type="button" size="sm" variant="secondary" className="absolute top-2 left-2" onClick={() => setProof("")}>
                  הסר
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/50">
                <ImagePlus className="h-5 w-5" />
                צירוף צילום מסך
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0])} />
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button type="button" disabled={!valid || busy} onClick={submit}>
            <Send className="h-4 w-4 ml-1.5" />
            {busy ? "שולח..." : "שליחת הדיווח"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProofButton({ load }: { load: () => Promise<string | undefined> }) {
  const [src, setSrc] = useState<string>("");
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={async (o) => {
        setOpen(o);
        if (o && !src) setSrc((await load().catch(() => "")) || "");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 px-2">
          <ImageIcon className="h-4 w-4 ml-1" />
          צילום
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">צילום ההעברה</DialogTitle>
        </DialogHeader>
        {src ? <img src={src} alt="צילום ההעברה" className="max-h-[70vh] w-full object-contain" /> : <p className="py-8 text-center text-muted-foreground">טוען...</p>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Admin: pending reports to approve or reject. Member: their own reports and what happened to them.
 */
export function TransfersCard({
  groupId,
  isAdmin,
  myMemberId,
  memberNames,
  refreshKey,
  onChanged,
}: {
  groupId: string;
  isAdmin: boolean;
  myMemberId?: string;
  memberNames: Record<string, string>;
  refreshKey?: number;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<TransferRequest[]>([]);
  const [busyId, setBusyId] = useState("");
  const { toast } = useToast();

  const load = useCallback(() => {
    apiClient
      .getTransfers(groupId)
      .then(setItems)
      .catch(() => setItems([]));
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const decide = async (t: TransferRequest, decision: "approve" | "reject") => {
    let reason = "";
    if (decision === "reject") {
      const r = window.prompt("למה לא לאשר? (החבר יראה את הסיבה)", "ההעברה לא הגיעה לקבוצת ה-PayBox");
      if (r === null) return;
      reason = r;
    }
    setBusyId(t.id);
    try {
      await apiClient.decideTransfer(t.id, decision, reason);
      toast({
        title: decision === "approve" ? "אושר" : "נדחה",
        description:
          decision === "approve"
            ? `${t.amount.toFixed(2)} ₪ נוספו ליתרה של ${memberNames[t.member_id] || "החבר"} ונרשמו ביומן`
            : "החבר יראה שהדיווח לא אושר",
      });
      load();
      onChanged?.();
    } catch (e) {
      toast({ title: "שגיאה", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusyId("");
    }
  };

  const visible = isAdmin
    ? items.filter((t) => t.status === "pending")
    : items.filter((t) => t.member_id === myMemberId).slice(0, 6);
  if (visible.length === 0) return null;

  return (
    <Card className={isAdmin ? "border-2 border-amber-300 shadow-md" : "border shadow-sm"} dir="rtl">
      <CardHeader className="pb-2 text-right">
        <CardTitle className="text-lg">{isAdmin ? `העברות שמחכות לאישור (${visible.length})` : "הדיווחים שלי על העברות"}</CardTitle>
        {isAdmin && (
          <CardDescription className="text-right">בדקו בקבוצת ה-PayBox שהכסף הגיע, ואשרו. האישור מוסיף ליתרה ונרשם ביומן.</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {visible.map((t) => (
            <li key={t.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 text-right">
                <div className="font-medium">
                  {isAdmin ? `${memberNames[t.member_id] || "חבר"} · ` : ""}
                  <span dir="ltr" className="tabular-nums font-bold">
                    {t.amount.toFixed(2)} ₪
                  </span>
                </div>
                {t.note && <div className="text-sm text-muted-foreground break-words">{t.note}</div>}
                {t.status === "rejected" && t.reject_reason && (
                  <div className="text-sm text-red-600 break-words">סיבה: {t.reject_reason}</div>
                )}
                <div className="text-xs text-muted-foreground">
                  {when(t.created_at)}
                  {t.source === "link" ? " · מהקישור האישי" : ""}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {t.has_proof_image && <ProofButton load={() => apiClient.getTransfer(t.id).then((x) => x.proof_image)} />}
                {isAdmin ? (
                  <>
                    <Button size="sm" disabled={busyId === t.id} onClick={() => decide(t, "approve")} className="bg-emerald-600 hover:bg-emerald-700">
                      <Check className="h-4 w-4 ml-1" />
                      אישור
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === t.id} onClick={() => decide(t, "reject")}>
                      <X className="h-4 w-4 ml-1" />
                      דחייה
                    </Button>
                  </>
                ) : (
                  <TransferStatusBadge status={t.status} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
