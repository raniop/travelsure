import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type StreakPrize, type StreakTable } from "@/integrations/api/client";
import { Crown, Gift, MessageCircle, Sparkles, Trophy, Wallet } from "lucide-react";
import { shortGroupLink } from "@/lib/bbq/groupLinks";

/**
 * "אלוף ההתמדה": who came to the most events this month. On a tie (or when everyone is tied) the
 * server draws the winner once; the wheel here only shows that result. Every member pays the same
 * share (the winner too), and the winner takes it as credit or as a gift bought from the cash box.
 */

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const currentMonth = () => monthKey(new Date());
export const previousMonth = () => {
  const d = new Date();
  return monthKey(new Date(d.getFullYear(), d.getMonth() - 1, 1));
};

const displayName = (r: { name: string; nickname?: string }) => r.nickname?.trim() || r.name.split(" ")[0] || r.name;

type Photos = Record<string, string | undefined>;

function Avatar({ name, src, size = 40, crown = false }: { name: string; src?: string; size?: number; crown?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover ring-2 ring-white" />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/15 font-bold text-primary" style={{ fontSize: size * 0.4 }}>
          {name.trim().charAt(0)}
        </span>
      )}
      {crown && (
        <span aria-hidden="true" className="absolute -top-[38%] left-1/2 -translate-x-1/2 -rotate-12 drop-shadow" style={{ fontSize: size * 0.62 }}>
          👑
        </span>
      )}
    </span>
  );
}

/** The month's table: count per member, leaders highlighted. */
export function StreakBoard({ table, photos = {}, highlightId, limit }: { table: StreakTable; photos?: Photos; highlightId?: string; limit?: number }) {
  const rows = limit ? table.rows.slice(0, limit) : table.rows;
  let rank = 0;
  let last = -1;
  return (
    <ol className="divide-y rounded-2xl border bg-card/60">
      {rows.map((r, i) => {
        if (r.count !== last) {
          rank = i + 1;
          last = r.count;
        }
        const leader = table.best > 0 && r.count === table.best;
        return (
          <li key={r.id} className={`flex items-center gap-3 px-3 py-2 ${r.id === highlightId ? "bg-primary/5" : ""}`}>
            <span className={`w-5 text-center text-sm font-bold ${leader ? "text-amber-600" : "text-muted-foreground"}`}>{rank}</span>
            <Avatar name={r.name} src={photos[r.id]} size={30} />
            <span className={`min-w-0 flex-1 truncate text-right ${leader ? "font-bold" : ""}`}>
              {r.name}
              {r.id === highlightId && <span className="text-xs font-normal text-muted-foreground"> (את/ה)</span>}
            </span>
            <span dir="ltr" className={`text-sm tabular-nums ${leader ? "font-bold text-amber-700" : "text-muted-foreground"}`}>
              {r.count}/{table.events}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Banner of the month's champion, with a crown on the photo. */
export function ChampionBanner({ prize, photo }: { prize: StreakPrize; photo?: string }) {
  const others = prize.candidates.filter((c) => c.id !== prize.winner_id).map((c) => c.name.split(" ")[0]);
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-l from-amber-100 to-amber-50 p-4 text-amber-900 dark:from-amber-500/20 dark:to-amber-500/5 dark:text-amber-100">
      <Avatar name={prize.winner_name} src={photo} size={64} crown />
      <div className="min-w-0 flex-1 text-right">
        <div className="text-xs font-semibold opacity-80">אלוף ההתמדה — {prize.month_label}</div>
        <div className="truncate text-xl font-extrabold">{prize.winner_name}</div>
        <div className="text-xs opacity-80">
          {prize.best} מתוך {prize.events} מפגשים
          {others.length > 0 && ` · ניצח בגלגל את ${others.join(", ")}`}
        </div>
      </div>
    </div>
  );
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

/** The wheel: spins and stops on the winner the server already drew. */
function PrizeWheel({ names, winnerIndex, spinning }: { names: string[]; winnerIndex: number | null; spinning: boolean }) {
  const n = Math.max(names.length, 1);
  const seg = 360 / n;
  const rotation = winnerIndex === null ? 0 : 360 * 6 + (360 - (winnerIndex * seg + seg / 2));
  const r = 100;
  const slice = (i: number) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
    const large = seg > 180 ? 1 : 0;
    return `M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
  };
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <div aria-hidden="true" className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 text-3xl leading-none text-foreground">▼</div>
      <svg
        viewBox="-104 -104 208 208"
        className="h-full w-full"
        style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 5s cubic-bezier(0.17, 0.67, 0.21, 1)" : "none" }}
      >
        {names.map((name, i) => {
          const mid = ((i * seg + seg / 2 - 90) * Math.PI) / 180;
          return (
            <g key={`${name}-${i}`}>
              {n === 1 ? <circle r={r} fill={COLORS[0]} /> : <path d={slice(i)} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={1.5} />}
              <text
                x={n === 1 ? 0 : 60 * Math.cos(mid)}
                y={n === 1 ? 0 : 60 * Math.sin(mid)}
                fill="#fff"
                fontSize={n > 6 ? 11 : 14}
                fontWeight={700}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={n === 1 ? undefined : `rotate(${i * seg + seg / 2}, ${60 * Math.cos(mid)}, ${60 * Math.sin(mid)})`}
              >
                {name}
              </text>
            </g>
          );
        })}
        <circle r={14} fill="#fff" stroke="#e5e7eb" />
      </svg>
    </div>
  );
}

const shareText = (prize: StreakPrize, groupId: string) => {
  const others = prize.candidates.filter((c) => c.id !== prize.winner_id).map((c) => c.name.split(" ")[0]);
  return [
    `👑 ${prize.winner_name} הוא אלוף ההתמדה של ${prize.month_label}!`,
    `${prize.best} מתוך ${prize.events} מפגשים${others.length ? ` — ניצח בגלגל את ${others.join(", ")}` : ""} 🔥`,
    "",
    `הפרס: ${prize.total} ₪ (${prize.share} ₪ מכל אחד)`,
    "מי יהיה האלוף של החודש הבא? 😎",
    shortGroupLink(groupId),
  ].join("\n");
};

/** Owner card in the members tab: this month's race, last month's closing, and the hall of fame. */
export function StreakManagerCard({ groupId, isOwner, onChanged }: { groupId: string; isOwner: boolean; onChanged?: () => void }) {
  const { toast } = useToast();
  const [current, setCurrent] = useState<StreakTable | null>(null);
  const [previous, setPrevious] = useState<StreakTable | null>(null);
  const [photos, setPhotos] = useState<Photos>({});
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [drawn, setDrawn] = useState<StreakPrize | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, p, members] = await Promise.all([
        apiClient.getStreak(groupId, currentMonth()),
        apiClient.getStreak(groupId, previousMonth()),
        apiClient.getMembers(groupId).catch(() => []),
      ]);
      setCurrent(c);
      setPrevious(p);
      setPhotos(Object.fromEntries((members as Array<{ id: string; profile_image?: string }>).map((m) => [m.id, m.profile_image || undefined])));
    } catch {
      setCurrent(null);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const hall = current?.hall || [];
  const prev = previous;
  const prevPrize = drawn || prev?.prize || null;
  const canClose = isOwner && prev && !prev.prize && prev.events >= prev.min_events && prev.leaders.length > 0;
  const wheelNames = useMemo(
    () => (prev ? prev.rows.filter((r) => prev.leaders.includes(r.id)).map(displayName) : []),
    [prev],
  );
  const winnerIndex = drawn && prev ? prev.rows.filter((r) => prev.leaders.includes(r.id)).findIndex((r) => r.id === drawn.winner_id) : null;

  const draw = async () => {
    if (!prev) return;
    setBusy(true);
    try {
      const prize = await apiClient.closeStreak(groupId, prev.month);
      setDrawn(prize);
      setSpinning(true);
      // A single leader needs no suspense; a tie spins the wheel to the winner the server drew
      window.setTimeout(() => setRevealed(true), prev.leaders.length > 1 ? 5200 : 300);
      onChanged?.();
    } catch (e) {
      const m = (e as Error).message;
      toast({
        title: m === "already_closed" ? "החודש כבר נסגר" : m === "not_enough_events" ? "היו פחות מ-2 מפגשים בחודש" : "לא הצלחנו לסגור את החודש",
        variant: "destructive",
      });
      setOpen(false);
      load();
    } finally {
      setBusy(false);
    }
  };

  const choose = async (choice: "credit" | "gift") => {
    if (!prevPrize || !prev) return;
    setBusy(true);
    try {
      const prize = await apiClient.chooseStreakPrize(groupId, prev.month, choice, choice === "gift" ? giftNote : "");
      setDrawn(prize);
      toast({ title: choice === "credit" ? `${prize.total} ₪ נכנסו ליתרה של ${prize.winner_name}` : "נרשם: מתנה מהקופה" });
      onChanged?.();
      load();
    } catch {
      toast({ title: "לא הצלחנו לשמור", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!current) return null;
  const leadersNow = current.rows.filter((r) => current.leaders.includes(r.id));

  const choiceBlock = prevPrize && (
    <div className="space-y-2">
      {prevPrize.choice === "" ? (
        isOwner && (
          <>
            <p className="text-sm text-muted-foreground">
              מה {prevPrize.winner_name.split(" ")[0]} בוחר? ({prevPrize.total} ₪ — כבר נגבו {prevPrize.share} ₪ מכל אחד)
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled={busy} onClick={() => choose("credit")}>
                <Wallet className="ml-1.5 h-4 w-4" />
                זיכוי {prevPrize.total} ₪ ליתרה
              </Button>
              <div className="flex gap-2">
                <Input value={giftNote} onChange={(e) => setGiftNote(e.target.value)} placeholder="כרטיסי גירוד" className="min-w-0" />
                <Button variant="outline" disabled={busy} onClick={() => choose("gift")}>
                  <Gift className="ml-1.5 h-4 w-4" />
                  מתנה
                </Button>
              </div>
            </div>
          </>
        )
      ) : (
        <p className="rounded-xl bg-muted px-3 py-2 text-sm">
          {prevPrize.choice === "credit"
            ? `✅ ${prevPrize.total} ₪ נכנסו ליתרה של ${prevPrize.winner_name}`
            : `🎁 מתנה מהקופה${prevPrize.gift_note ? `: ${prevPrize.gift_note}` : ""} — להוציא ${prevPrize.total} ₪ מ-PayBox`}
        </p>
      )}
      <Button variant="outline" className="w-full" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText(prevPrize, groupId))}`, "_blank")}>
        <MessageCircle className="ml-1.5 h-4 w-4" />
        שליחה לקבוצה בוואטסאפ
      </Button>
    </div>
  );

  return (
    <div className="space-y-3 rounded-3xl border bg-card p-4 text-right shadow-sm" dir="rtl">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-bold">אלוף ההתמדה</h3>
      </div>

      {prevPrize && <ChampionBanner prize={prevPrize} photo={photos[prevPrize.winner_id]} />}
      {prevPrize && !open && choiceBlock}

      {canClose && !drawn && (
        <div className="rounded-2xl bg-amber-500/10 p-3 text-sm">
          <div className="font-semibold">{prev!.month_label} נגמר</div>
          <div className="text-muted-foreground">
            {prev!.leaders.length > 1
              ? `תיקו בין ${prev!.leaders.length} חברים עם ${prev!.best}/${prev!.events} — הזוכה ייקבע בגלגל`
              : `${wheelNames[0]} הגיע הכי הרבה: ${prev!.best}/${prev!.events}`}
          </div>
          <Button className="mt-2 w-full" onClick={() => setOpen(true)}>
            <Sparkles className="ml-1.5 h-4 w-4" />
            {prev!.leaders.length > 1 ? "סגירת חודש וסיבוב הגלגל" : "סגירת חודש"}
          </Button>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex !flex-row items-center justify-between text-sm">
          <span className="font-semibold">{current.month_label}</span>
          <span className="text-muted-foreground">{current.events} מפגשים עד עכשיו</span>
        </div>
        {current.events === 0 ? (
          <p className="text-sm text-muted-foreground">עוד לא היו מפגשים החודש.</p>
        ) : (
          <>
            {leadersNow.length > 0 && (
              <p className="mb-2 text-sm">
                🔥 כרגע בהובלה: <span className="font-semibold">{leadersNow.map(displayName).join(", ")}</span> ({current.best}/{current.events})
              </p>
            )}
            <StreakBoard table={current} photos={photos} />
          </>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          בסוף החודש: מי שהגיע הכי הרבה זוכה. בתיקו — גלגל. כל חבר (גם הזוכה) משתתף ב-{current.share} ₪, והזוכה בוחר זיכוי של {current.prize_total} ₪ או מתנה מהקופה. צריך לפחות {current.min_events} מפגשים בחודש.
        </p>
      </div>

      {hall.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <Crown className="h-4 w-4 text-amber-500" />
            היכל התהילה
          </div>
          <ul className="divide-y rounded-2xl border text-sm">
            {hall.map((p) => (
              <li key={p.month} className="flex !flex-row items-center justify-between gap-3 px-3 py-2">
                <span className="text-muted-foreground">{p.month_label}</span>
                <span className="font-semibold">
                  👑 {p.winner_name} <span className="text-xs font-normal text-muted-foreground">({p.best}/{p.events})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (spinning && !revealed) return;
          setOpen(o);
          if (!o) {
            setSpinning(false);
            setRevealed(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">אלוף ההתמדה — {prev?.month_label}</DialogTitle>
            <DialogDescription className="text-right">
              {prev && prev.leaders.length > 1
                ? `תיקו בין ${prev.leaders.length} חברים. השרת מגריל פעם אחת — אי אפשר לסובב שוב.`
                : "הזוכה נקבע לפי מספר המפגשים."}
            </DialogDescription>
          </DialogHeader>
          {prev && prev.leaders.length > 1 && <PrizeWheel names={wheelNames} winnerIndex={winnerIndex} spinning={spinning} />}
          {revealed && drawn ? (
            <div className="space-y-3">
              <div className="text-center text-4xl" aria-hidden="true">
                🎉🏆🎉
              </div>
              <ChampionBanner prize={drawn} photo={photos[drawn.winner_id]} />
              {choiceBlock}
            </div>
          ) : (
            <Button className="w-full" disabled={busy || spinning} onClick={draw}>
              {spinning ? "מסתובב..." : prev && prev.leaders.length > 1 ? "סובבו את הגלגל!" : "הכרזה על הזוכה"}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Read-only section on a member's personal page. */
export function StreakMemberSection({ streak, memberId }: { streak: NonNullable<import("@/integrations/api/client").PublicMemberPage["streak"]>; memberId: string }) {
  const prize = streak.previous?.prize || null;
  const mine = streak.rows.find((r) => r.id === memberId);
  const rank = mine ? streak.rows.filter((r) => r.count > mine.count).length + 1 : 0;
  const leaders = streak.rows.filter((r) => streak.leaders.includes(r.id));
  const gap = mine ? streak.best - mine.count : 0;
  return (
    <div className="space-y-3">
      {prize && <ChampionBanner prize={prize} />}
      {streak.events > 0 ? (
        <>
          {mine && (
            <div className="rounded-xl bg-muted p-3 text-sm">
              <div className="text-xs text-muted-foreground">את/ה ב{streak.month_label}</div>
              <div className="font-semibold">
                {mine.count} מתוך {streak.events} מפגשים · מקום {rank}
              </div>
              <div className="text-xs text-muted-foreground">
                {gap === 0 && streak.best > 0 ? "את/ה בהובלה! 🔥" : gap > 0 ? `עוד ${gap === 1 ? "מפגש אחד" : `${gap} מפגשים`} והיית בהובלה` : ""}
              </div>
            </div>
          )}
          {leaders.length > 0 && (
            <p className="text-sm">
              🔥 כרגע בהובלה: <span className="font-semibold">{leaders.map(displayName).join(", ")}</span>
            </p>
          )}
          <StreakBoard table={streak} highlightId={memberId} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">עוד לא היו מפגשים ב{streak.month_label}.</p>
      )}
      {streak.hall.length > 0 && (
        <ul className="divide-y rounded-2xl border text-sm">
          {streak.hall.map((p) => (
            <li key={p.month} className="flex !flex-row items-center justify-between gap-3 px-3 py-2">
              <span className="text-muted-foreground">{p.month_label}</span>
              <span className="font-semibold">👑 {p.winner_name}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        מי שמגיע הכי הרבה בחודש זוכה. בתיקו — גלגל מזל. כל חבר משתתף ב-{streak.share} ₪ והזוכה מקבל {streak.prize_total} ₪ או מתנה מהקופה.
      </p>
    </div>
  );
}
