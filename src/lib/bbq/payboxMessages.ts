import { stripEmojisForPlainText } from "@/lib/bbq/plainText";

export const PAYBOX_GROUP_LINK = "https://links.payboxapp.com/k5qia1URTZb";

export function buildGuestPaymentWhatsAppMessage(opts: {
  guestName: string;
  amount: number;
  eventDateLabel: string;
  groupName?: string;
  eventDescription?: string;
}): string {
  const name = stripEmojisForPlainText(opts.guestName) || opts.guestName.trim();
  const group = opts.groupName ? stripEmojisForPlainText(opts.groupName) : "";
  const groupLabel = group ? `קבוצת «${group}»` : "הקבוצה";
  const eventLine = opts.eventDescription?.trim()
    ? `אירוע: ${stripEmojisForPlainText(opts.eventDescription)} (${opts.eventDateLabel})`
    : `אירוע בתאריך ${opts.eventDateLabel}`;

  return [
    `שלום ${name}!`,
    "",
    `זו הודעה מ${groupLabel} — תשלום על ${eventLine}.`,
    "",
    "אורחים לא משלמים מהקופה המשותפת של החברים; מעבירים ישירות ל-PayBox של הקבוצה.",
    "",
    `סכום לתשלום: ${opts.amount.toFixed(2)} ₪`,
    "",
    "מה לעשות:",
    "1. העבר/י את הסכום לקבוצת PayBox:",
    PAYBOX_GROUP_LINK,
    "2. שלח/י לי הודעה לאחר התשלום.",
    "",
    "תודה!",
  ].join("\n");
}

export function buildDepositRecordedWhatsAppMessage(opts: {
  memberName: string;
  depositAmount: number;
  newBalance: number;
  previousBalance: number;
  groupName?: string;
}): string {
  const name = stripEmojisForPlainText(opts.memberName) || opts.memberName.trim();
  const group = opts.groupName ? stripEmojisForPlainText(opts.groupName) : "";
  const groupLabel = group ? `קבוצת «${group}»` : "הקבוצה";
  const wasNegative = opts.previousBalance < 0;
  const balanceNote =
    opts.newBalance >= 500
      ? "היתרה שלך מעודכנת ואת/ה מסודר/ת לקראת האירועים הקרובים."
      : wasNegative && opts.newBalance < 0
        ? "עדיין חסרה יתרה — אפשר להשלים בהמשך לפי הצורך."
        : opts.newBalance < 500
          ? `אם תרצה/י להגיע ליתרת בסיס של 500 ₪, נשאר להשלים עוד ${(500 - opts.newBalance).toFixed(2)} ₪.`
          : "היתרה שלך מעודכנת.";

  return [
    `שלום ${name}!`,
    "",
    `קיבלנו ורשמנו את ההפקדה שלך לקופת האירועים המשותפת (${groupLabel}).`,
    "",
    `סכום שהתקבל: ${opts.depositAmount.toFixed(2)} ₪`,
    `יתרה מעודכנת: ${opts.newBalance.toFixed(2)} ₪`,
    "",
    balanceNote,
    "",
    "תודה על ההעברה — נתראה באירוע הבא!",
  ].join("\n");
}

export function whatsAppUrl(phone: string, message: string): string {
  let phoneNumber = phone.replace(/[^0-9]/g, "");
  if (phoneNumber.startsWith("0")) phoneNumber = "972" + phoneNumber.slice(1);
  else if (!phoneNumber.startsWith("972")) phoneNumber = "972" + phoneNumber;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
