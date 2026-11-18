import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { apiClient, type LedgerEntry, type PayboxMeta, type PayboxNote, type PayboxStoredRow } from "@/integrations/api/client";
import { localPhone, parsePayboxCsv, PAYBOX_BASELINE_LOCAL, PAYBOX_BASELINE_UTC } from "@/lib/bbq/paybox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileUp, Plus, Scale, Trash2 } from "lucide-react";

type MemberMoney = { id: string; name: string; phone: string; balance: number; charges: number };

const money = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)} ₪`;


const close = (a: number, b: number) => Math.abs(a - b) < 0.01;

/**
 * Owner: upload the group's PayBox export and compare it with the app, member by member.
 * In the app, "deposited" = balance + every event charge; in PayBox it is the sum of transfers in.
 */
export function PayboxReconcileCard({ groupId }: { groupId: string }) {
  const [meta, setMeta] = useState<PayboxMeta | null>(null);
  const [rows, setRows] = useState<PayboxStoredRow[]>([]);
  const [members, setMembers] = useState<MemberMoney[]>([]);
  const [uncalculated, setUncalculated] = useState<{ date: string; cost: number }[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [notes, setNotes] = useState<PayboxNote[]>([]);
  const [draft, setDraft] = useState({ member_id: "", date: "", amount: "", note: "" });
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const loadApp = useCallback(async () => {
    const [ms, events, led] = await Promise.all([
      apiClient.getMembers(groupId),
      apiClient.getEvents(groupId),
      apiClient.getLedger(groupId).catch(() => [] as LedgerEntry[]),
    ]);
    setLedger(led);
    const charges: Record<string, number> = {};
    const missing: { date: string; cost: number }[] = [];
    const now = new Date();
    for (const e of events) {
      const ps = await apiClient.getPayments(e.id);
      const mem = ps.filter((p: any) => p.payer_type === "member");
      const cost = (Number(e.butcher_cost) || 0) + (Number(e.grocery_cost) || 0) || Number(e.total_cost) || 0;
      if (mem.length === 0 && new Date(e.event_date) < now && cost > 0) missing.push({ date: e.event_date, cost });
      for (const p of mem) if (p.payment_status !== "paid") charges[p.payer_id] = (charges[p.payer_id] || 0) + (Number(p.amount) || 0);
    }
    setUncalculated(missing);
    setMembers(
      ms.map((m: any) => ({
        id: m.id,
        name: m.nickname || m.name,
        phone: localPhone(m.phone || ""),
        balance: Number(m.balance) || 0,
        charges: Math.round((charges[m.id] || 0) * 100) / 100,
      })),
    );
  }, [groupId]);

  const loadPaybox = useCallback(async () => {
    const r = await apiClient.getPaybox(groupId).catch(() => ({ meta: null, rows: [] }));
    setMeta(r.meta);
    setRows(r.rows || []);
    setNotes(await apiClient.getPayboxNotes(groupId).catch(() => []));
  }, [groupId]);

  useEffect(() => {
    loadPaybox();
    loadApp().catch(() => undefined);
  }, [loadPaybox, loadApp]);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const parsed = parsePayboxCsv(await file.text());
      const m = await apiClient.uploadPaybox(groupId, parsed);
      toast({ title: "קובץ PayBox נטען", description: `${m.count} תנועות · החברים רואים עכשיו את ההפקדות שלהם בדף האישי` });
      await loadPaybox();
    } catch (e) {
      toast({ title: "לא נטען", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const report = useMemo(() => {
    const sincePb: Record<string, number> = {};
    let inSum = 0;
    let outSum = 0;
    for (const r of rows) {
      if (r.kind === "in") {
        inSum += r.amount;
        if (r.date > PAYBOX_BASELINE_LOCAL) sincePb[r.phone] = (sincePb[r.phone] || 0) + r.amount;
      } else outSum += r.amount;
    }
    const sinceApp: Record<string, number> = {};
    for (const e of ledger) {
      if ((e.type === "deposit" || e.type === "transfer") && e.created_at >= PAYBOX_BASELINE_UTC) {
        sinceApp[e.member_id] = (sinceApp[e.member_id] || 0) + (Number(e.amount) || 0);
      }
    }
    const lines = members
      .map((m) => {
        const app = Math.round((sinceApp[m.id] || 0) * 100) / 100;
        const pb = Math.round((sincePb[m.phone] || 0) * 100) / 100;
        return { ...m, app, pb, gap: Math.round((pb - app) * 100) / 100 };
      })
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
    const appTotal = members.reduce((s, m) => s + m.balance, 0);
    return { lines, inSum, outSum, cash: inSum + outSum, appTotal };
  }, [rows, members, ledger]);

  const matched = report.lines.filter((l) => close(l.gap, 0)).length;

  return (
    <Card className="border shadow-sm" dir="rtl">
      <CardHeader className="pb-2 text-right">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5 text-primary" />
          השוואה ל-PayBox
        </CardTitle>
        <CardDescription className="text-right">
          מעלים את קובץ הקבוצה מ-PayBox (שמירה בשם CSV מתוך האקסל). כל חבר יראה בדף האישי את ההפקדות שלו עם התאריכים.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild disabled={busy}>
            <label className="cursor-pointer">
              <FileUp className="ml-1.5 h-4 w-4" />
              {busy ? "טוען..." : meta ? "העלאת קובץ מעודכן" : "העלאת קובץ PayBox"}
              <input type="file" accept=".csv,text/csv" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </Button>
          {meta && (
            <span className="text-xs text-muted-foreground">
              נטען {format(new Date(meta.imported_at), "dd/MM/yyyy HH:mm")} · {meta.count} תנועות · {meta.first_date.slice(0, 10)} עד{" "}
              {meta.last_date.slice(0, 10)}
            </span>
          )}
        </div>

        {meta && members.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-muted p-3">
                <div className="text-xs text-muted-foreground">נשאר בקופת ה-PayBox</div>
                <div dir="ltr" className="text-right text-xl font-bold tabular-nums">{money(report.cash)}</div>
                <div className="text-[11px] text-muted-foreground">
                  נכנס <span dir="ltr">{money(report.inSum)}</span> · יצא <span dir="ltr">{money(-report.outSum)}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-muted p-3">
                <div className="text-xs text-muted-foreground">סך היתרות באפליקציה</div>
                <div dir="ltr" className="text-right text-xl font-bold tabular-nums">{money(report.appTotal)}</div>
                <div className={`text-[11px] ${close(report.cash, report.appTotal) ? "text-emerald-700" : "text-amber-700"}`}>
                  {close(report.cash, report.appTotal) ? "תואם בדיוק" : `פער ${money(report.appTotal - report.cash)}`}
                </div>
              </div>
            </div>

            {uncalculated.length > 0 && (
              <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-900">
                אירועים שעברו ועוד לא חושבו (העלות כבר יצאה מ-PayBox, אבל עוד לא ירדה מהיתרות):{" "}
                {uncalculated.map((u) => `${format(new Date(u.date), "dd/MM")} (${u.cost.toFixed(0)} ₪)`).join(", ")}. לחצו «חשב תשלומים» באירוע.
              </p>
            )}

            <div>
              <div className="mb-2 text-sm font-medium">
                הפקדות מאז 18/11/2026: {matched} מתוך {report.lines.length} חברים תואמים ל-PayBox
              </div>
              <ul className="divide-y rounded-2xl border bg-card/50">
                {report.lines.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1 text-right">
                      <div className="truncate font-medium">{l.name}</div>
                      <div className="text-xs text-muted-foreground">
                        PayBox <span dir="ltr" className="tabular-nums">{money(l.pb)}</span> · נרשם באפליקציה{" "}
                        <span dir="ltr" className="tabular-nums">{money(l.app)}</span>
                      </div>
                    </div>
                    {close(l.gap, 0) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        תואם
                      </span>
                    ) : (
                      <span dir="ltr" className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold tabular-nums text-amber-800">
                        {l.gap > 0 ? "+" : "−"}
                        {Math.abs(l.gap).toFixed(2)} ₪
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                ההיסטוריה עד 18/11/2026 סוגרה: הקופה תאמה ל-PayBox. מכאן נבדקת כל הפקדה: מה שנכנס ל-PayBox מול מה שנרשם באפליקציה
                (הפקדה או «העברתי» שאושר). פער = הפקדה שעוד לא נרשמה או נרשמה בסכום אחר.
              </p>
            </div>

            {/* Settlement lines: shown in the member's dated list, never change a balance */}
            <div className="space-y-2 rounded-2xl border bg-card/50 p-3">
              <div className="text-sm font-medium">שורות התחשבנות מול הקופה</div>
              <p className="text-xs text-muted-foreground">
                לכסף שעבר דרך חבר בשביל הקבוצה (עודף שהוחזר, אורח ששולם מההפקדה, כסף שחזר באותו יום). השורה מופיעה ברשימה האישית
                של החבר עם ההסבר, כדי שהרשימה תתחבר ל-PayBox. היתרה לא משתנה.
              </p>
              {notes.length > 0 && (
                <ul className="divide-y">
                  {[...notes].sort((a, b) => a.date.localeCompare(b.date)).map((n) => (
                    <li key={n.id} className="flex items-start justify-between gap-2 py-2">
                      <div className="min-w-0 flex-1 text-right text-sm">
                        <span className="font-medium">{members.find((m) => m.id === n.member_id)?.name || "חבר"}</span> ·{" "}
                        {n.date.slice(0, 10)} ·{" "}
                        <span dir="ltr" className="tabular-nums">{money(Number(n.amount))}</span>
                        <div className="text-xs text-muted-foreground">{n.note}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-red-600"
                        onClick={async () => {
                          if (!confirm("למחוק את השורה?")) return;
                          setNotes(await apiClient.deletePayboxNote(groupId, n.id));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid gap-2 sm:grid-cols-[1fr_9rem_7rem]">
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={draft.member_id}
                  onChange={(e) => setDraft({ ...draft, member_id: e.target.value })}
                >
                  <option value="">בחירת חבר</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <Input type="date" className="h-9" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                <Input
                  type="number"
                  step="0.01"
                  dir="ltr"
                  placeholder="−600"
                  className="h-9 text-left"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                />
              </div>
              <Input placeholder="ההסבר שהחבר יראה" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} maxLength={300} />
              <Button
                size="sm"
                variant="outline"
                disabled={!draft.member_id || !draft.date || !parseFloat(draft.amount) || !draft.note.trim()}
                onClick={async () => {
                  try {
                    setNotes(
                      await apiClient.addPayboxNote(groupId, {
                        member_id: draft.member_id,
                        date: draft.date,
                        amount: parseFloat(draft.amount),
                        note: draft.note.trim(),
                      }),
                    );
                    setDraft({ member_id: draft.member_id, date: "", amount: "", note: "" });
                  } catch (e) {
                    toast({ title: "לא נשמר", description: (e as Error).message, variant: "destructive" });
                  }
                }}
              >
                <Plus className="ml-1 h-4 w-4" />
                הוספת שורה
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
