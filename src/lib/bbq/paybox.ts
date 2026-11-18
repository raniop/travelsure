/**
 * PayBox group export (CSV, as saved from the PayBox Excel file):
 * שם,פלאפון,סוג,סכום,תאריך,הערות,...   — סוג is "העברה לקבוצה" (in) or "תשלום מהקבוצה" (out).
 */
export interface PayboxRow {
  date: string;
  kind: "in" | "out";
  name: string;
  phone: string;
  amount: number;
  note: string;
}

/** Minimal CSV parser (quotes, escaped quotes, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function localPhone(phone: string): string {
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("972")) d = "0" + d.slice(3);
  return d;
}

export function parsePayboxCsv(text: string): PayboxRow[] {
  const table = parseCsv(text.replace(/^﻿/, ""));
  if (table.length < 2) throw new Error("הקובץ ריק");
  const head = table[0].map((h) => h.trim());
  const col = (name: string) => head.indexOf(name);
  const iName = col("שם"), iPhone = col("פלאפון"), iType = col("סוג"), iAmount = col("סכום"), iDate = col("תאריך"), iNote = col("הערות");
  if ([iName, iPhone, iType, iAmount, iDate].some((i) => i < 0)) {
    throw new Error("זה לא נראה כמו קובץ PayBox (חסרות העמודות שם, פלאפון, סוג, סכום, תאריך)");
  }
  const rows: PayboxRow[] = [];
  for (const r of table.slice(1)) {
    const amount = parseFloat((r[iAmount] || "").replace(/[^\d.-]/g, ""));
    const date = (r[iDate] || "").trim();
    if (Number.isNaN(amount) || !/^\d{4}-\d{2}-\d{2}/.test(date)) continue;
    const type = (r[iType] || "").trim();
    rows.push({
      date,
      kind: type.includes("תשלום מהקבוצה") || amount < 0 ? "out" : "in",
      name: (r[iName] || "").trim(),
      phone: localPhone(r[iPhone] || ""),
      amount,
      note: iNote >= 0 ? (r[iNote] || "").trim() : "",
    });
  }
  if (rows.length === 0) throw new Error("לא נמצאו תנועות בקובץ");
  return rows;
}
