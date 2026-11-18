import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { he } from "date-fns/locale/he";
import { apiClient, type PublicEvent, type PublicMemberPage } from "@/integrations/api/client";
import { LedgerList, TrustNote } from "@/components/bbq/MemberStatement";
import { ReportTransferDialog, TransferStatusBadge } from "@/components/bbq/Transfers";
import { PAYBOX_GROUP_LINK } from "@/lib/bbq/payboxMessages";
import { useBbqTheme } from "@/lib/bbq/theme";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, ExternalLink, Flame, Lock, ReceiptText, Send, Users, Wallet } from "lucide-react";

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

function EventRow({ e, onReceipt }: { e: PublicEvent; onReceipt: (id: string) => void }) {
  const cost = eventCost(e);
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold">{e.description?.trim() || "מפגש"}</div>
          <div className="text-sm text-muted-foreground">{dayOf(e.event_date)}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {cost > 0 && <>עלות כוללת <span dir="ltr" className="tabular-nums">{money(cost)}</span> · </>}
            {e.participants} משתתפים
            {(Number(e.butcher_cost) || 0) > 0 && (
              <>
                {" "}
                · קצב <span dir="ltr" className="tabular-nums">{money(Number(e.butcher_cost))}</span>
              </>
            )}
            {(Number(e.grocery_cost) || 0) > 0 && (
              <>
                {" "}
                · סופר <span dir="ltr" className="tabular-nums">{money(Number(e.grocery_cost))}</span>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0 text-left">
          {e.my_amount != null ? (
            <>
              <div dir="ltr" className="font-bold tabular-nums text-red-600">
                −{Number(e.my_amount).toFixed(2)} ₪
              </div>
              <div className="text-xs text-muted-foreground">החלק שלי</div>
            </>
          ) : e.attending ? (
            <div className="text-xs text-muted-foreground">עוד לא חושב</div>
          ) : null}
        </div>
      </div>
      {e.receipts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {e.receipts.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onReceipt(r.id)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/70"
            >
              <ReceiptText className="h-3.5 w-3.5" />
              {r.label || "קבלה"}
              {r.amount ? <span dir="ltr" className="tabular-nums"> · {Number(r.amount).toFixed(0)} ₪</span> : null}
            </button>
          ))}
        </div>
      )}
    </li>
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
  const mine = (data?.events || [])
    .filter((e) => (e.attending || e.my_amount != null) && (e.event_date || "").slice(0, 10) < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

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
    <div dir="rtl" className="min-h-screen bg-background pb-16 text-foreground">
      <header className="bg-secondary px-4 pb-24 pt-8 text-secondary-foreground">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Flame className="h-4 w-4 text-primary" />
              {data.group.name}
            </div>
            <h1 className="mt-1 truncate text-2xl font-extrabold sm:text-3xl">שלום {name}</h1>
          </div>
          {data.group.group_image ? (
            <img src={data.group.group_image} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-white/20" />
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
                  <div>
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

        <Section title="התנועות שלי" icon={<Wallet className="h-5 w-5" />}>
          {data.ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">הרישום המפורט מתחיל מהשינוי הבא ביתרה — כל הפקדה וכל חיוב יופיעו כאן.</p>
          ) : (
            <LedgerList entries={data.ledger} events={events} />
          )}
        </Section>

        <Section title="המפגשים שהשתתפתי בהם" icon={<Flame className="h-5 w-5" />}>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">עדיין אין מפגשים.</p>
          ) : (
            <ul className="divide-y">
              {mine.map((e) => (
                <EventRow key={e.id} e={e} onReceipt={setReceipt} />
              ))}
            </ul>
          )}
        </Section>

        {data.transfers.length > 0 && (
          <Section title="הדיווחים שלי על העברות" icon={<Send className="h-5 w-5" />}>
            <ul className="divide-y">
              {data.transfers.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
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
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3">
              <div className="text-xs text-muted-foreground">חברים</div>
              <div className="text-xl font-bold">{data.group_totals.members}</div>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <div className="text-xs text-muted-foreground">סך היתרות של כולם</div>
              <div dir="ltr" className="text-xl font-bold tabular-nums">{money(Number(data.group_totals.balances_sum))}</div>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <div className="text-xs text-muted-foreground">הופקד מאז תחילת הרישום</div>
              <div dir="ltr" className="text-lg font-bold tabular-nums text-emerald-700">{money(Number(data.group_totals.deposits))}</div>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <div className="text-xs text-muted-foreground">חויב על מפגשים</div>
              <div dir="ltr" className="text-lg font-bold tabular-nums text-red-600">{money(Number(data.group_totals.charges))}</div>
            </div>
          </div>
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
