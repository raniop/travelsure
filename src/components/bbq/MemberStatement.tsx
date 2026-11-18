import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { apiClient, type LedgerEntry } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShieldCheck, ReceiptText } from "lucide-react";

type EventInfo = { id: string; event_date?: string; description?: string | null };

const money = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)} ₪`;
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)} ₪`;

const dateOf = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : format(d, "dd/MM/yyyy");
};

const dateTimeOf = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : format(d, "dd/MM/yyyy HH:mm");
};

function eventLabel(eventId: string | undefined, events: Map<string, EventInfo>): string {
  if (!eventId) return "";
  const e = events.get(eventId);
  if (!e) return "אירוע שנמחק";
  const day = e.event_date ? format(new Date(e.event_date), "dd/MM/yyyy") : "";
  return [e.description?.trim() || "אירוע", day].filter(Boolean).join(" · ");
}

/** What the line means, in plain Hebrew. */
function describeLedgerEntry(entry: LedgerEntry, events: Map<string, EventInfo>): { title: string; detail: string } {
  const ev = eventLabel(entry.event_id, events);
  switch (entry.type) {
    case "opening":
      return { title: "יתרת פתיחה", detail: "היתרה שהייתה לפני שהתחיל הרישום המפורט" };
    case "deposit":
      return { title: "הפקדה", detail: entry.note || "" };
    case "transfer":
      return { title: "העברה שאושרה", detail: entry.note || "" };
    case "charge":
      return { title: "חיוב על אירוע", detail: ev };
    case "refund":
      return { title: "החזר חיוב", detail: [ev, entry.note].filter(Boolean).join(" · ") };
    default:
      return { title: "תיקון ידני", detail: entry.note || "" };
  }
}

function useLedger(groupId: string, memberId: string | undefined, active: boolean, refreshKey = 0) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [events, setEvents] = useState<Map<string, EventInfo>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([apiClient.getLedger(groupId, memberId), apiClient.getEvents(groupId)])
      .then(([ledger, evs]) => {
        if (cancelled) return;
        setEntries(ledger);
        setEvents(new Map((evs as EventInfo[]).map((e) => [e.id, e])));
      })
      .catch((e: Error) => !cancelled && setError(e.message || "לא הצלחנו לטעון את התנועות"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupId, memberId, active, refreshKey]);

  return { entries, events, loading, error };
}

const TrustNote = () => (
  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
    <span>כל שינוי ביתרה נרשם אוטומטית בשרת, עם התאריך ומי ביצע אותו. אי אפשר למחוק או לערוך שורות ביומן.</span>
  </div>
);

function EntryRow({ entry, events, memberName }: { entry: LedgerEntry; events: Map<string, EventInfo>; memberName?: string }) {
  const { title, detail } = describeLedgerEntry(entry, events);
  const amount = Number(entry.amount) || 0;
  const isOpening = entry.type === "opening";
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0 flex-1 text-right">
        <div className="font-medium text-foreground">
          {memberName ? `${memberName} · ` : ""}
          {title}
        </div>
        {detail && <div className="text-sm text-muted-foreground break-words">{detail}</div>}
        <div className="text-xs text-muted-foreground mt-0.5">
          {dateTimeOf(entry.created_at)}
          {entry.created_by_name ? ` · עודכן ע״י ${entry.created_by_name}` : ""}
        </div>
      </div>
      <div className="shrink-0 text-left">
        <div
          dir="ltr"
          className={`font-bold tabular-nums ${
 isOpening ? "text-foreground" : amount > 0 ? "text-emerald-600" : amount < 0 ? "text-red-600" : "text-foreground"
 }`}
        >
          {isOpening ? money(amount) : signed(amount)}
        </div>
        <div className="text-xs text-muted-foreground">
          יתרה: <span dir="ltr" className="tabular-nums">{money(Number(entry.balance_after) || 0)}</span>
        </div>
      </div>
    </li>
  );
}

/** A member's ledger lines, newest first (used by the personal page too). */
export function LedgerList({ entries, events }: { entries: LedgerEntry[]; events: Map<string, EventInfo> }) {
  const newestFirst = [...entries].reverse();
  return (
    <ul className="divide-y">
      {newestFirst.map((entry) => (
        <EntryRow key={entry.id} entry={entry} events={events} />
      ))}
    </ul>
  );
}

export { TrustNote };

/** One member's account statement: every deposit, charge and fix, with the balance after each. */
export function MemberStatementDialog({
  groupId,
  member,
  children,
}: {
  groupId: string;
  member: { id: string; name: string; balance?: number | null };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { entries, events, loading, error } = useLedger(groupId, member.id, open);
  const newestFirst = useMemo(() => [...entries].reverse(), [entries]);
  const currentBalance = Number(member.balance) || 0;
  const firstDate = entries.length ? dateOf(entries[0].created_at) : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">דף חשבון — {member.name}</DialogTitle>
          <DialogDescription className="text-right">כל התנועות ביתרה, מהחדשה לישנה</DialogDescription>
        </DialogHeader>

        <div
          className={`rounded-lg border px-3 py-2.5 text-right ${
 currentBalance < 0
 ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
 : "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
 }`}
        >
          <div className="text-xs opacity-80">יתרה נוכחית</div>
          <div className="text-xl font-bold tabular-nums" dir="ltr">
            {money(currentBalance)}
          </div>
        </div>

        <TrustNote />

        {loading ? (
          <p className="py-6 text-center text-muted-foreground">טוען תנועות...</p>
        ) : error ? (
          <p className="py-6 text-center text-red-600">{error}</p>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            עדיין אין תנועות רשומות. מהשינוי הבא ביתרה — כל הפקדה וכל חיוב יופיעו כאן.
          </p>
        ) : (
          <>
            <ul className="divide-y">
              {newestFirst.map((entry) => (
                <EntryRow key={entry.id} entry={entry} events={events} />
              ))}
            </ul>
            <p className="text-xs text-muted-foreground text-right">הרישום המפורט התחיל ב-{firstDate}.</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** The whole group's cash box: totals in and out, and every movement, visible to all members. */
export function GroupLedgerCard({ groupId, refreshKey = 0 }: { groupId: string; refreshKey?: number }) {
  const [showAll, setShowAll] = useState(false);
  const { entries, events, loading, error } = useLedger(groupId, undefined, true, refreshKey);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getMembers(groupId)
      .then((ms: { id: string; name: string; nickname?: string | null }[]) => {
        if (!cancelled) setMemberNames(Object.fromEntries(ms.map((m) => [m.id, m.nickname || m.name])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const totals = useMemo(() => {
    let deposits = 0;
    let charges = 0;
    let fixes = 0;
    for (const e of entries) {
      const a = Number(e.amount) || 0;
      if (e.type === "deposit" || e.type === "transfer") deposits += a;
      else if (e.type === "charge" || e.type === "refund") charges += a;
      else if (e.type === "adjustment") fixes += a;
    }
    return { deposits, charges: -charges, fixes };
  }, [entries]);

  const newestFirst = useMemo(() => [...entries].reverse(), [entries]);
  const visible = showAll ? newestFirst : newestFirst.slice(0, 15);

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center justify-end gap-2 text-lg">
          יומן הקופה
          <ReceiptText className="h-5 w-5 text-primary" />
        </CardTitle>
        <CardDescription className="text-right">כל הפקדה, חיוב ותיקון של כל החברים — גלוי לכל חברי הקבוצה</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TrustNote />
        {loading ? (
          <p className="py-4 text-center text-muted-foreground">טוען...</p>
        ) : error ? (
          <p className="py-4 text-center text-red-600">{error}</p>
        ) : entries.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">
            היומן התחיל לפעול עכשיו. ההפקדה או החיוב הבאים יופיעו כאן.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/60 p-2">
                <div className="text-xs text-muted-foreground">הופקד</div>
                <div className="font-bold text-emerald-600 tabular-nums" dir="ltr">{money(totals.deposits)}</div>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <div className="text-xs text-muted-foreground">חויב על אירועים</div>
                <div className="font-bold text-red-600 tabular-nums" dir="ltr">{money(totals.charges)}</div>
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <div className="text-xs text-muted-foreground">תיקונים ידניים</div>
                <div className="font-bold tabular-nums" dir="ltr">{signed(totals.fixes)}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              הסכומים הם מאז שהתחיל הרישום ({dateOf(entries[0].created_at)}).
            </p>
            <ul className="divide-y">
              {visible.map((entry) => (
                <EntryRow key={entry.id} entry={entry} events={events} memberName={memberNames[entry.member_id] || "חבר"} />
              ))}
            </ul>
            {newestFirst.length > visible.length && (
              <Button variant="outline" className="w-full" onClick={() => setShowAll(true)}>
                הצג את כל {newestFirst.length} התנועות
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
