import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageCircle } from "lucide-react";

import { shortGroupLink } from "@/lib/bbq/groupLinks";

export const groupLinkFor = (groupId: string) => shortGroupLink(groupId);

const defaultMessage = (url: string) =>
  [
    "היי חבר'ה 🔥",
    "",
    "מהיום כל אחד יכול לראות בכל רגע את מצב הקופה שלו:",
    "💰 היתרה שלך",
    "📋 כל הפקדה וכל חיוב על מפגש — עם תאריכים וקבלות",
    "✅ הכל נבדק מול PayBox — הקופה תואמת עד האגורה",
    "",
    "נכנסים עם מספר הטלפון (מגיע קוד ב-SMS):",
    url,
    "",
    "העברתם כסף ב-PayBox? לוחצים בדף «העברתי» — ואני מאשר.",
  ].join("\n");

/** Owner: the one link for the whole group (each member signs in with phone + SMS code). */
export function GroupLinkDialog({ groupId, children }: { groupId: string; children: ReactNode }) {
  const url = groupLinkFor(groupId);
  const [message, setMessage] = useState(() => defaultMessage(url));
  const { toast } = useToast();

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${what} הועתק` });
    } catch {
      toast({ title: "סמנו והעתיקו ידנית", variant: "destructive" });
    }
  };

  return (
    <Dialog onOpenChange={(o) => o && setMessage(defaultMessage(url))}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">קישור אחד לכל הקבוצה</DialogTitle>
          <DialogDescription className="text-right">
            שולחים פעם אחת לקבוצת הוואטסאפ. כל חבר נכנס עם מספר הטלפון שלו ומקבל קוד ב-SMS — ורואה רק את הדף שלו.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code dir="ltr" className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-left text-xs">
              {url}
            </code>
            <Button size="sm" variant="outline" onClick={() => copy(url, "הקישור")}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={11} className="text-sm leading-relaxed" />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => copy(message, "ההודעה")}>
              <Copy className="ml-1.5 h-4 w-4" />
              העתקת ההודעה
            </Button>
            <Button variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")}>
              <MessageCircle className="ml-1.5 h-4 w-4" />
              שליחה בוואטסאפ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
