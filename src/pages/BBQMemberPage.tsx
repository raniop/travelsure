import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { apiClient, type PublicEvent, type PublicMemberPage } from "@/integrations/api/client";
import { LedgerList, TrustNote } from "@/components/bbq/MemberStatement";
import { ReportTransferDialog, TransferStatusBadge } from "@/components/bbq/Transfers";
import { PAYBOX_GROUP_LINK } from "@/lib/bbq/payboxMessages";
import { isNettedDeposit, PAYBOX_BASELINE_LOCAL, PAYBOX_BASELINE_UTC } from "@/lib/bbq/paybox";
import { useBbqTheme } from "@/lib/bbq/theme";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowDownLeft, CalendarDays, CheckCircle2, ExternalLink, Flame, Lock, ReceiptText, Send, Users, Wallet } from "lucide-react";

const TARGET_BALANCE = 500;

const money = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)} ₪`;

const dayOf = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : format(d, "EEEE, d בMMMM yyyy", { locale: he });
};

const shortDay = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : format(d, "dd/MM/yy");
};

const eventCost = (e: PublicEvent) => {
  const parts = (Number(e.butcher_cost) || 0) + (Number(e.grocery_cost) || 0);
  return parts > 0 ? parts : Number(e.total_cost) || 0;
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ReceiptViewer({ pageKey, receiptId, onClose }: { pageKey: string; receiptId: string; onClose: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    apiClient
      .getPublicReceipt(pageKey, receiptId)
      .then((r) => setSrc(r.image || ""))
      .catch(() => setSrc(""));
  }, [pageKey, receiptId]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">קבלה</DialogTitle>
        </DialogHeader>
        {src ? <img src={src} alt="קבלה" className="max-h-[75vh] w-full object-contain" /> : <p className="py-10 text-center text-muted-foreground">טוען...</p>}
      </DialogContent>
    </Dialog>
  );
}

type TimelineItem = { at: string; amount: number; title: string; detail?: string; kind: "in" | "out" | "fix"; receipts?: PublicEvent["receipts"]; pending?: boolean };

/**
 * Deposits and charges in one list, by date: PayBox deposits (or deposits written in the app when
 * there is no PayBox file, or after its last row), event charges on the event's date, manual fixes.
 */
function MoneyTimeline({ data, onReceipt }: { data: PublicMemberPage; onReceipt: (id: string) => void }) {
  const items: TimelineItem[] = [];
  const pb = data.paybox;
  const pbLast = pb ? pb.meta.last_date.replace(" ", "T") : "";
  if (pb) {
    for (const d of pb.deposits) {
      items.push({ at: d.date.replace(" ", "T"), amount: Number(d.amount) || 0, title: "הפקדה ב-PayBox", detail: d.note || undefined, kind: "in" });
    }
  }
  for (const n of pb?.notes || []) {
    items.push({ at: n.date.replace(" ", "T"), amount: Number(n.amount) || 0, title: "התחשבנות מול הקופה", detail: n.note, kind: "fix" });
  }
  for (const e of data.ledger) {
    const amt = Number(e.amount) || 0;
    if (e.type === "deposit" || e.type === "transfer") {
      // With a PayBox file, app deposits are already in it, unless they came after its last row
      const netted = isNettedDeposit(e.note || e.note_added);
      if (pb && !netted && e.created_at.slice(0, 19) <= new Date(pbLast).toISOString().slice(0, 19)) continue;
      items.push({
        at: e.created_at,
        amount: amt,
        title: netted ? "הפקדה בקיזוז" : e.type === "transfer" ? "העברה שאושרה" : "הפקדה",
        detail: e.note || e.note_added || undefined,
        kind: "in",
      });
    } else if (e.type === "adjustment") {
      items.push({ at: e.created_at, amount: amt, title: "תיקון ידני", detail: e.note || e.note_added || undefined, kind: "fix" });
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const ev of data.events) {
    const mine = Number(ev.my_amount) || 0;
    const past = (ev.event_date || "").slice(0, 10) < today;
    if (!mine && !(ev.attending && past)) continue;
    const cost = eventCost(ev);
    items.push({
      at: ev.event_date.replace(" ", "T"),
      amount: -mine,
      title: ev.description?.trim() || "מפגש",
      detail: `${ev.participants} משתתפים${cost > 0 ? ` · עלות כוללת ${cost.toFixed(2)} ₪` : ""}`,
      kind: "out",
      receipts: ev.receipts,
      pending: !mine,
    });
  }
  items.sort((a, b) => b.at.localeCompare(a.at));
  if (items.length === 0) return <p className="text-sm text-muted-foreground">עדיין אין הפקדות או חיובים.</p>;

  let lastMonth = "";
  return (
    <div className="rounded-2xl border bg-card/50">
      {items.map((it, i) => {
        const d = new Date(it.at);
        const month = Number.isNaN(d.getTime()) ? "" : format(d, "MMMM yyyy", { locale: he });
        const showMonth = month !== lastMonth;
        lastMonth = month;
        return (
          <div key={`${it.at}-${i}`}>
            {showMonth && (
              <div className="border-b bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground first:rounded-t-2xl">{month}</div>
            )}
            <div className={`flex items-center justify-between gap-3 px-3 py-2.5 ${it.receipts && it.receipts.length > 0 ? "" : "border-b last:border-b-0"}`}>
              <div className="flex min-w-0 flex-1 items-center gap-2.5 text-right">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${
                    it.kind === "in" ? "bg-emerald-500" : it.kind === "out" ? "bg-red-500" : "bg-slate-400"
                  }`}
                >
                  {it.kind === "in" ? <ArrowDownLeft className="h-4 w-4" /> : it.kind === "out" ? <Flame className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{it.title}</div>
                  <div className={`${it.kind === "fix" ? "whitespace-normal" : "truncate"} text-xs text-muted-foreground`}>
                    {Number.isNaN(d.getTime()) ? "" : format(d, "EEEE, d/M", { locale: he })}
                    {it.detail ? ` · ${it.detail}` : ""}
                  </div>
                </div>
              </div>
              {it.pending ? (
                <span className="shrink-0 text-xs text-muted-foreground">עוד לא חושב</span>
              ) : (
                <span
                  dir="ltr"
                  className={`shrink-0 font-bold tabular-nums ${it.amount > 0 ? "text-emerald-700" : it.amount < 0 ? "text-red-600" : ""}`}
                >
                  {it.amount > 0 ? "+" : it.amount < 0 ? "−" : ""}
                  {Math.abs(it.amount).toFixed(2)} ₪
                </span>
              )}
            </div>
            {it.receipts && it.receipts.length > 0 && (
              <div className="-mt-1 flex flex-wrap gap-1.5 border-b px-3 pb-2.5 pr-[52px]">
                {it.receipts.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onReceipt(r.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground hover:bg-accent/70"
                  >
                    <ReceiptText className="h-3 w-3" />
                    {r.label || "קבלה"}
                    {r.amount ? <span dir="ltr" className="tabular-nums"> · {Number(r.amount).toFixed(0)} ₪</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The member's personal page (travelsure.co.il/bbq/me?k=...): no sign-in, read-only, everything
 * that is theirs — balance, every movement, the events they paid for with receipts, their reports.
 */
const BBQMemberPage = () => {
  useBbqTheme();
  const [params] = useSearchParams();
  const key = params.get("k") || "";
  const [data, setData] = useState<PublicMemberPage | null>(null);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");

  const load = useCallback(() => {
    if (!key) {
      setError("הקישור לא שלם");
      return;
    }
    apiClient
      .getPublicPage(key)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e: Error) => setError(e.message === "link_not_found" ? "הקישור לא פעיל. בקשו קישור חדש ממנהל הקבוצה." : "לא הצלחנו לטעון. נסו לרענן."));
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (data?.group?.name) document.title = `${data.group.name} · הדף שלי`;
  }, [data?.group?.name]);

  const events = useMemo(() => new Map((data?.events || []).map((e) => [e.id, e])), [data]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (data?.events || [])
    .filter((e) => (e.event_date || "").slice(0, 10) >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  if (error) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
          <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const balance = Number(data.member.balance) || 0;
  const name = data.member.nickname || data.member.name;
  const toTarget = Math.max(0, TARGET_BALANCE - balance);
  const status =
    balance < 0
      ? { text: "היתרה במינוס — צריך להפקיד", tone: "bg-red-50 text-red-800 border-red-200" }
      : balance < 100
        ? { text: "היתרה נמוכה — כדאי להפקיד בקרוב", tone: "bg-amber-50 text-amber-900 border-amber-200" }
        : { text: "היתרה תקינה", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  const pendingTransfers = data.transfers.filter((t) => t.status === "pending");

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-16 text-right text-foreground">
      <header className="px-4 pb-24 pt-8">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4 text-primary" />
              {data.group.name}
            </div>
            <h1 className="mt-1 truncate text-2xl font-extrabold sm:text-3xl">שלום {name}</h1>
          </div>
          {data.group.group_image ? (
            <img src={data.group.group_image} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-white/70" />
          ) : null}
        </div>
      </header>

      <main className="mx-auto -mt-20 max-w-xl space-y-4 px-4">
        <section className="rounded-3xl border bg-card p-5 shadow-lg">
          <div className="text-sm text-muted-foreground">היתרה שלי בקופה</div>
          <div dir="ltr" className={`bbq-display text-right text-5xl font-extrabold tabular-nums ${balance < 0 ? "text-red-600" : "text-foreground"}`}>
            {money(balance)}
          </div>
          <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${status.tone}`}>{status.text}</div>
          {toTarget > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              כדי לחזור ל-{TARGET_BALANCE} ₪ חסרים <span dir="ltr" className="font-semibold tabular-nums">{money(toTarget)}</span>
            </p>
          )}
          {pendingTransfers.length > 0 && (
            <p className="mt-2 text-sm text-amber-800">
              יש לך {pendingTransfers.length === 1 ? "דיווח העברה אחד" : `${pendingTransfers.length} דיווחי העברה`} שמחכה לאישור המנהל.
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ReportTransferDialog
              suggestedAmount={toTarget || undefined}
              onSubmit={(d) => apiClient.createPublicTransfer(key, d)}
              onDone={load}
            >
              <Button className="h-12 text-base">
                <Send className="ml-2 h-5 w-5" />
                העברתי
              </Button>
            </ReportTransferDialog>
            <Button asChild variant="outline" className="h-12 text-base">
              <a href={PAYBOX_GROUP_LINK} target="_blank" rel="noreferrer">
                PayBox
                <ExternalLink className="mr-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        <TrustNote />

        {upcoming.length > 0 && (
          <Section title="המפגש הבא" icon={<CalendarDays className="h-5 w-5" />}>
            <ul className="divide-y">
              {upcoming.slice(0, 2).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="text-right">
                    <div className="font-semibold">{e.description?.trim() || "מפגש"}</div>
                    <div className="text-sm text-muted-foreground">{dayOf(e.event_date)}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${e.attending ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                    {e.attending ? "רשום/ה" : "לא רשום/ה"}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="ההפקדות והחיובים שלי" icon={<Wallet className="h-5 w-5" />}>
          {(() => {
            // Before 18/11/2026 the app overwrote the balance on each deposit and kept no record of it,
            // so single old deposits cannot be listed. Their total is exact: what is left + what was charged.
            const myCharges = (data.events || []).reduce((sum, e) => sum + (Number(e.my_amount) || 0), 0);
            const totalIn = balance + myCharges;
            // With a PayBox file: what they really put in (PayBox + app deposits after the file) and the
            // settlement lines, exactly as in the list below. Used only when it adds up to the balance.
            const pb = data.paybox;
            let shownIn = totalIn;
            let settled = 0;
            if (pb) {
              const pbLastIso = new Date(pb.meta.last_date.replace(" ", "T")).toISOString().slice(0, 19);
              const afterFile = data.ledger
                .filter((e) => (e.type === "deposit" || e.type === "transfer") && (e.created_at.slice(0, 19) > pbLastIso || isNettedDeposit(e.note || e.note_added)))
                .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
              const fixes = data.ledger.filter((e) => e.type === "adjustment").reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
              const deposited = Number(pb.total) + afterFile;
              const lines = (pb.notes || []).reduce((sum, n) => sum + (Number(n.amount) || 0), 0) + fixes;
              if (Math.abs(deposited + lines - myCharges - balance) < 0.01) {
                shownIn = deposited;
                settled = lines;
              }
            }
            const showSettled = Math.abs(settled) >= 0.01;
            const box = (label: string, value: string, tone: string) => (
              <div className={`flex h-full flex-col gap-1 rounded-xl p-3 ${tone}`}>
                <div className="text-xs leading-snug text-muted-foreground">{label}</div>
                {/* mt-auto, not justify-between: a site-wide RTL rule turns .flex.justify-between into row-reverse */}
                <div dir="ltr" className="mt-auto whitespace-nowrap text-right text-base font-bold tabular-nums sm:text-lg">
                  {value}
                </div>
              </div>
            );
            const settleLines = showSettled ? [...(pb?.notes || [])].sort((x, y) => x.date.localeCompare(y.date)) : [];
            return (
              <div className="mb-3">
              <div className={`grid gap-2 ${showSettled ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                {box("הפקדתי עד היום", money(shownIn), "bg-emerald-500/10 text-emerald-700")}
                {showSettled && box("התחשבנויות מול הקופה", `${settled < 0 ? "−" : "+"}${Math.abs(settled).toFixed(2)} ₪`, "bg-slate-500/10 text-slate-700")}
                {box("חויבתי על מפגשים", `−${myCharges.toFixed(2)} ₪`, "bg-red-500/10 text-red-600")}
                {box("נשאר ביתרה", money(balance), "bg-muted text-foreground")}
              </div>
              {settleLines.length > 0 && (
                <div className="mt-2 rounded-xl bg-slate-500/10 p-3 text-sm">
                  <div className="mb-1 font-semibold">מה זה «התחשבנויות מול הקופה»?</div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    חלק מהכסף שהעברת ל-PayBox לא היה הפקדה שלך לקופה, אלא כסף שעבר דרכך בשביל הקבוצה:
                  </p>
                  <ul className="space-y-1.5">
                    {settleLines.map((n) => (
                      <li key={n.id} className="flex items-start justify-between gap-3">
                        <span className="min-w-0 flex-1 text-right">
                          <span className="text-xs text-muted-foreground">{shortDay(n.date.replace(" ", "T"))} · </span>
                          {n.note}
                        </span>
                        <span dir="ltr" className="shrink-0 font-semibold tabular-nums">
                          {Number(n.amount) < 0 ? "−" : "+"}
                          {Math.abs(Number(n.amount)).toFixed(2)} ₪
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            );
          })()}
          {data.paybox ? (
            (() => {
              const pb = data.paybox;
              const list = [...pb.deposits].sort((a, b) => b.date.localeCompare(a.date));
              const pbSince = pb.deposits.filter((d) => d.date > PAYBOX_BASELINE_LOCAL).reduce((s, d) => s + (Number(d.amount) || 0), 0);
              const appSince = data.ledger
                .filter((e) => (e.type === "deposit" || e.type === "transfer") && e.created_at >= PAYBOX_BASELINE_UTC && !isNettedDeposit(e.note || e.note_added))
                .reduce((s, e) => s + (Number(e.amount) || 0), 0);
              const sinceOk = Math.abs(pbSince - appSince) < 0.01;
              return (
                <div className="mb-4 space-y-3">
                  <div className={`rounded-2xl p-3 text-sm ${sinceOk ? "bg-emerald-500/10 text-emerald-900" : "bg-amber-500/10 text-amber-900"}`}>
                    {sinceOk ? (
                      <>
                        <CheckCircle2 className="ml-1 inline h-4 w-4" />
                        הקופה נבדקה מול PayBox ב-18/11/2026 ותאמה. מאז כל הפקדה שלך נרשמת כאן ונבדקת מול PayBox
                        {pbSince > 0 ? (
                          <>
                            {" "}
                            — עד עכשיו <span dir="ltr" className="font-bold tabular-nums">{money(pbSince)}</span>, הכל נרשם.
                          </>
                        ) : (
                          "."
                        )}
                      </>
                    ) : (
                      <>
                        מאז 18/11/2026 הפקדת ב-PayBox <span dir="ltr" className="font-bold tabular-nums">{money(pbSince)}</span>, ונרשם
                        באפליקציה <span dir="ltr" className="font-bold tabular-nums">{money(appSince)}</span>. מנהל הקבוצה רואה את אותה
                        השוואה ויעדכן.
                      </>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <p className="mb-3 text-xs text-muted-foreground">
              «הפקדתי עד היום» = מה שנשאר ביתרה + כל מה שחויב על מפגשים. עד 18/11/2026 המערכת לא שמרה כל הפקדה בנפרד
              (רק עדכנה את היתרה), ולכן ההפקדות הישנות מופיעות כסכום אחד. מעכשיו כל הפקדה נרשמת כאן עם התאריך והסכום.
            </p>
          )}
          <MoneyTimeline data={data} onReceipt={setReceipt} />
        </Section>

        {data.transfers.length > 0 && (
          <Section title="הדיווחים שלי על העברות" icon={<Send className="h-5 w-5" />}>
            <ul className="divide-y">
              {data.transfers.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="text-right">
                    <div dir="ltr" className="text-right font-semibold tabular-nums">{money(Number(t.amount))}</div>
                    <div className="text-xs text-muted-foreground">{shortDay(t.created_at)}{t.note ? ` · ${t.note}` : ""}</div>
                    {t.status === "rejected" && t.reject_reason && <div className="text-xs text-red-600">סיבה: {t.reject_reason}</div>}
                  </div>
                  <TransferStatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="קופת הקבוצה" icon={<Users className="h-5 w-5" />}>
          {(() => {
            const past = (data.events || []).filter((e) => (e.event_date || "").slice(0, 10) < today);
            const allCosts = past.reduce((sum, e) => sum + eventCost(e), 0);
            const deposits = Number(data.group_totals.deposits) || 0;
            return (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-xs text-muted-foreground">חברים</div>
                    <div className="text-xl font-bold">{data.group_totals.members}</div>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-xs text-muted-foreground">סך היתרות של כולם עכשיו</div>
                    <div dir="ltr" className="text-right text-xl font-bold tabular-nums">{money(Number(data.group_totals.balances_sum))}</div>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-xs text-muted-foreground">מפגשים שהתקיימו</div>
                    <div className="text-xl font-bold">{past.length}</div>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <div className="text-xs text-muted-foreground">עלות כל המפגשים</div>
                    <div dir="ltr" className="text-right text-xl font-bold tabular-nums">{money(allCosts)}</div>
                  </div>
                  {deposits > 0 && (
                    <div className="col-span-2 rounded-xl bg-muted p-3">
                      <div className="text-xs text-muted-foreground">הפקדות שנרשמו ביומן</div>
                      <div dir="ltr" className="text-right text-xl font-bold tabular-nums text-emerald-700">{money(deposits)}</div>
                    </div>
                  )}
                </div>
                {deposits <= 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    רישום ההפקדות ביומן התחיל ב-18/11/2026 — מכאן כל הפקדה שתאושר תופיע גם כאן.
                  </p>
                )}
              </>
            );
          })()}
        </Section>

        <p className="px-2 text-center text-xs text-muted-foreground">
          <Lock className="ml-1 inline h-3 w-3" />
          זה הקישור האישי שלך — לא להעביר הלאה. מנהל הקבוצה יכול להחליף אותו בכל רגע.
        </p>
      </main>

      {receipt && <ReceiptViewer pageKey={key} receiptId={receipt} onClose={() => setReceipt("")} />}
    </div>
  );
};

export default BBQMemberPage;
