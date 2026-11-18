import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { apiClient, type PayboxMeta, type PayboxStoredRow } from "@/integrations/api/client";
import { localPhone, parsePayboxCsv } from "@/lib/bbq/paybox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, FileUp, Scale } from "lucide-react";

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
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const loadApp = useCallback(async () => {
    const [ms, events] = await Promise.all([apiClient.getMembers(groupId), apiClient.getEvents(groupId)]);
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
    const byPhone: Record<string, number> = {};
    let inSum = 0;
    let outSum = 0;
    for (const r of rows) {
      if (r.kind === "in") {
        inSum += r.amount;
        byPhone[r.phone] = (byPhone[r.phone] || 0) + r.amount;
      } else outSum += r.amount;
    }
    const known = new Set(members.map((m) => m.phone));
    const unmatched = Object.entries(byPhone).filter(([p]) => !known.has(p));
    const lines = members
      .map((m) => {
        const app = Math.round((m.balance + m.charges) * 100) / 100;
        const pb = Math.round((byPhone[m.phone] || 0) * 100) / 100;
        return { ...m, app, pb, gap: Math.round((pb - app) * 100) / 100 };
      })
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
    const appTotal = members.reduce((s, m) => s + m.balance, 0);
    return { lines, unmatched, inSum, outSum, cash: inSum + outSum, appTotal };
  }, [rows, members]);

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
                {matched} מתוך {report.lines.length} חברים תואמים בדיוק ל-PayBox
              </div>
              <ul className="divide-y rounded-2xl border bg-card/50">
                {report.lines.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1 text-right">
                      <div className="truncate font-medium">{l.name}</div>
                      <div className="text-xs text-muted-foreground">
                        PayBox <span dir="ltr" className="tabular-nums">{money(l.pb)}</span> · באפליקציה{" "}
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
                «באפליקציה» = יתרה + כל החיובים על אירועים. פער חיובי = ב-PayBox הופקד יותר (למשל הפקדה שעוד לא נרשמה, תשלום על אורח,
                או העברה שהוחזרה).
              </p>
            </div>

            {report.unmatched.length > 0 && (
              <p className="text-xs text-muted-foreground">
                הפקדות ממספרים שאינם חברים בקבוצה: {report.unmatched.map(([, sum]) => money(sum)).join(", ")}.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
