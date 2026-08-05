/** טקסט פשוט ל-WhatsApp/SMS — בלי אמוג'ים שמוצגים כ-� */
export function stripEmojisForPlainText(text: string): string {
  return (
    text
      .normalize("NFKC")
      .replace(/\uFE0F/g, "")
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/\p{Emoji_Presentation}/gu, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}
