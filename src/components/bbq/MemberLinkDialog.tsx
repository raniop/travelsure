import { useEffect, useState, type ReactNode } from "react";
import { apiClient } from "@/integrations/api/client";
import { whatsAppUrl } from "@/lib/bbq/payboxMessages";
import { stripEmojisForPlainText } from "@/lib/bbq/plainText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageCircle, RefreshCw } from "lucide-react";

const PAGE_URL = "https://travelsure.co.il/bbq/me?k=";

/** Admin: each member's permanent personal link (read-only page, no sign-in). */
export function MemberLinkDialog({
  member,
  groupName,
  children,
}: {
  member: { id: string; name: string; phone?: string | null };
  groupName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setBusy(true);
    apiClient
      .getMemberLink(member.id)
      .then(async (r) => setKey(r.key || (await apiClient.createMemberLink(member.id)).key))
      .catch((e: Error) => toast({ title: "שגיאה", description: e.message, variant: "destructive" }))
      .finally(() => setBusy(false));
  }, [open, member.id, toast]);

  const url = key ? PAGE_URL + key : "";

  const message = () =>
    [
      `שלום ${stripEmojisForPlainText(member.name) || member.name}!`,
      "",
      `זה הקישור האישי שלך לקופה של ${groupName ? `«${stripEmojisForPlainText(groupName)}»` : "הקבוצה"}.`,
      "רואים בו בכל רגע את היתרה, כל הפקדה וכל חיוב על מפגש — עם הקבלות — ואפשר לדווח שהעברת כסף.",
      "",
      url,
      "",
      "שמור/י אותו, ולא להעביר הלאה — הוא אישי.",
    ].join("\n");

  const regenerate = async () => {
    if (!confirm("להחליף את הקישור? הקישור הקודם יפסיק לעבוד מיד.")) return;
    setBusy(true);
    try {
      setKey((await apiClient.createMemberLink(member.id)).key);
      toast({ title: "נוצר קישור חדש", description: "הקישור הקודם כבר לא עובד" });
    } catch (e) {
      toast({ title: "שגיאה", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[460px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">הקישור האישי של {member.name}</DialogTitle>
          <DialogDescription className="text-right">
            דף קבוע בלי סיסמה: יתרה, כל התנועות, המפגשים והקבלות, וכפתור «העברתי». רק צפייה — אי אפשר לשנות בו כלום.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input readOnly value={busy && !url ? "יוצר קישור..." : url} dir="ltr" className="text-left text-xs" onFocus={(e) => e.target.select()} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={!url}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  toast({ title: "הועתק" });
                } catch {
                  toast({ title: "סמנו והעתיקו ידנית", variant: "destructive" });
                }
              }}
            >
              <Copy className="ml-1.5 h-4 w-4" />
              העתקה
            </Button>
            <Button
              variant="outline"
              disabled={!url || !member.phone}
              onClick={() => member.phone && window.open(whatsAppUrl(member.phone, message()), "_blank")}
            >
              <MessageCircle className="ml-1.5 h-4 w-4" />
              שליחה בוואטסאפ
            </Button>
          </div>
          <Button variant="ghost" size="sm" disabled={busy || !url} onClick={regenerate} className="justify-start text-muted-foreground">
            <RefreshCw className="ml-1.5 h-4 w-4" />
            החלפת הקישור (אם דלף)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
