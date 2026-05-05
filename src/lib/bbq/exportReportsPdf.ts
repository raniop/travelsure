/**
 * ייצוא דוח לקבוצה כ־PDF אמין לעברית:
 * פותח חלון עם הדוח ומריץ הדפסה — בוחרים «שמירה כ‑PDF» / «Microsoft Print to PDF».
 * (html2canvas לא משרטט עקבית RTL/גריד/תוכן ארוך, ולכן הוסר מנתיב הייצוא.)
 */

export interface ExportReportsPdfMemberRow {
  name: string;
  nickname: string | null;
  eventsAttended: number;
  totalPaid: number;
  currentBalance: number;
  totalDeposited: number;
  owes: number;
}

export interface ExportReportsPdfEventRow {
  dateLabel: string;
  description: string;
  cost: number;
}

export interface ExportReportsPdfMonthlyRow {
  month: string;
  events: number;
  deducted: number;
}

export interface ExportReportsPdfAttendanceRow {
  name: string;
  events: number;
}

export interface ExportReportsPdfHostRow {
  name: string;
  nickname: string | null;
  count: number;
}

export interface ExportReportsPdfPayload {
  groupName: string;
  generatedAt: string;
  rangeLabel: string;
  reportScopeLabel: string;
  summary: {
    events: number;
    totalDeducted: number;
    totalBalance: number;
    guestPayments: number;
  };
  members: ExportReportsPdfMemberRow[];
  eventsInPeriod: ExportReportsPdfEventRow[];
  monthlyOverview: ExportReportsPdfMonthlyRow[];
  attendance: ExportReportsPdfAttendanceRow[];
  hosts: ExportReportsPdfHostRow[];
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  return n.toFixed(2);
}

function sectionTitle(text: string): string {
  return `<h2 class="sec">${esc(text)}</h2>`;
}

function tableWrap(headRow: string, bodyRows: string, cls?: string): string {
  return `<table class="data ${cls || ""}" dir="rtl"><thead>${headRow}</thead><tbody>${bodyRows}</tbody></table>`;
}

function th(text: string, wPct?: number): string {
  const style = wPct != null ? ` style="width:${wPct}%;"` : "";
  return `<th${style}>${esc(text)}</th>`;
}

function buildBodyHtml(p: ExportReportsPdfPayload): string {
  const title = p.groupName.trim() || "דוח קבוצה";

  /* סיכום — טבלה 2x2 במקום grid (מתאים להדפסה) */
  const summaryTable = `
  <table class="summary4" dir="rtl">
    <tbody>
      <tr>
        <td class="sb blue">
          <div class="sl">סה״כ אירועים · ${esc(p.rangeLabel)}</div>
          <div class="sbig">${p.summary.events}</div>
        </td>
        <td class="sb red">
          <div class="sl">סה״כ קוזז מהיתרה</div>
          <div class="sbig">${money(p.summary.totalDeducted)} ₪</div>
        </td>
      </tr>
      <tr>
        <td class="sb green">
          <div class="sl">סה״כ יתרות (חברים פעילים)</div>
          <div class="sbig">${money(p.summary.totalBalance)} ₪</div>
        </td>
        <td class="sb orange">
          <div class="sl">תשלומי אורחים (טווח הדוח)</div>
          <div class="sbig">${money(p.summary.guestPayments)} ₪</div>
        </td>
      </tr>
    </tbody>
  </table>`;

  let membersHead = `<tr>${th("חבר", 26)}${th("אירועים", 8)}${th("קוזז בטווח", 14)}${th("יתרה", 14)}${th("סה״כ שהופקד", 16)}${th("חוב", 10)}</tr>`;

  let membersRows = "";
  if (p.members.length === 0) {
    membersRows = `<tr><td colspan="6" class="empty">אין חברים פעילים בתקופה</td></tr>`;
  } else {
    for (const m of p.members) {
      const nick = m.nickname ? ` <span class="nick">(${esc(m.nickname)})</span>` : "";
      membersRows += `<tr>
        <td><strong>${esc(m.name)}</strong>${nick}</td>
        <td class="num">${m.eventsAttended}</td>
        <td class="num">${money(m.totalPaid)} ₪</td>
        <td class="num">${money(m.currentBalance)} ₪</td>
        <td class="num">${money(m.totalDeposited)} ₪</td>
        <td class="num">${m.owes > 0 ? `${money(m.owes)} ₪` : "—"}</td>
      </tr>`;
    }
  }

  let eventsHead = `<tr>${th("תאריך", 24)}${th("פרטים")}${th("עלות", 12)}</tr>`;
  let eventsRows = "";
  if (p.eventsInPeriod.length === 0) {
    eventsRows = `<tr><td colspan="3" class="empty">אין אירועים בטווח</td></tr>`;
  } else {
    for (const e of p.eventsInPeriod) {
      eventsRows += `<tr>
        <td>${esc(e.dateLabel)}</td>
        <td>${esc(e.description || "—")}</td>
        <td class="num">${money(e.cost)} ₪</td>
      </tr>`;
    }
  }

  let monthlyHead = `<tr>${th("חודש", 42)}${th("אירועים", 16)}${th("קוזז מהיתרה")}</tr>`;
  let monthlyRows = "";
  for (const row of p.monthlyOverview) {
    monthlyRows += `<tr>
      <td>${esc(row.month)}</td>
      <td class="num">${row.events}</td>
      <td class="num">${money(row.deducted)} ₪</td>
    </tr>`;
  }

  let attendanceHead = `<tr>${th("חבר")}${th("אירועים", 14)}</tr>`;
  let attendanceRows = "";
  if (p.attendance.length === 0) {
    attendanceRows = `<tr><td colspan="2" class="empty">אין נתוני נוכחות בתקופה</td></tr>`;
  } else {
    for (const a of p.attendance) {
      attendanceRows += `<tr><td>${esc(a.name)}</td><td class="num">${a.events}</td></tr>`;
    }
  }

  let hostsHead = `<tr>${th("מארח")}${th("מספר אירועים", 18)}</tr>`;
  let hostsRows = "";
  if (p.hosts.length === 0) {
    hostsRows = `<tr><td colspan="2" class="empty">אין שיוכי מארחים באירועים</td></tr>`;
  } else {
    for (const h of p.hosts) {
      const nick = h.nickname ? ` (${esc(h.nickname)})` : "";
      hostsRows += `<tr><td>${esc(h.name)}${nick}</td><td class="num">${h.count}</td></tr>`;
    }
  }

  const header = `
  <header class="hdr">
    <h1>${esc(title)}</h1>
    <p class="sub">דוח מסכם לקבוצה</p>
    <p class="meta"><strong>תקופה:</strong> ${esc(p.rangeLabel)} · <strong>היקף:</strong> ${esc(p.reportScopeLabel)}<br/>
    <strong>נוצר:</strong> ${esc(p.generatedAt)}</p>
  </header>`;

  return `
  ${header}
  ${summaryTable}
  ${sectionTitle("דוח לפי חברים (פעילים)")}
  ${tableWrap(membersHead, membersRows)}
  <div class="pb"></div>
  ${sectionTitle("אירועים בטווח הדוח")}
  ${tableWrap(eventsHead, eventsRows)}
  <div class="pb"></div>
  ${sectionTitle("מגמות — 6 חודשים אחרונים")}
  ${tableWrap(monthlyHead, monthlyRows)}
  ${sectionTitle("נוכחות חברים בטווח הדוח")}
  ${tableWrap(attendanceHead, attendanceRows)}
  ${sectionTitle("אירוח — מי אירח הכי הרבה (סה״כ)")}
  ${tableWrap(hostsHead, hostsRows)}
  <footer class="ftr">הופק באמצעות מערכת ניהול הקבוצה · לשימוש פנימי בלבד</footer>
  `;
}

/** שם קובץ מוצע בהורדת הדפסה (הדפדפן לא תמיד מכבד) */
export function suggestedReportPdfFilename(payload: ExportReportsPdfPayload): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const part = safeFilenamePart(payload.groupName);
  return `doh-${part}-${stamp}.pdf`;
}

function safeFilenamePart(name: string): string {
  return (
    name
      .normalize("NFKC")
      .replace(/\p{Emoji_Presentation}/gu, "")
      .replace(/\uFE0F/g, "")
      .replace(/[^\p{L}\p{N}\s'-]/gu, "")
      .replace(/[<>:"/\\|?*]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "kvutsa"
  );
}

function buildPrintDocument(p: ExportReportsPdfPayload): string {
  const body = buildBodyHtml(p);
  const ttl = esc(p.groupName.trim() || "דוח קבוצה");
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${ttl}</title>
  <style>
    @page { margin: 12mm 14mm; size: A4 portrait; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: Tahoma, Arial, "Arial Hebrew", "Segoe UI", "David", sans-serif;
      font-size: 11pt;
      color: #111827;
      line-height: 1.45;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { padding: 8px 12px 24px; }
    .hdr h1 {
      margin: 0 0 4px 0;
      font-size: 20pt;
      color: #134e4a;
      border-bottom: 3px solid #14b8a6;
      padding-bottom: 10px;
    }
    .hdr .sub { margin: 6px 0 0 0; font-size: 12pt; color: #0f766e; font-weight: 700; }
    .hdr .meta { margin: 10px 0 16px 0; font-size: 10pt; color: #64748b; }
    h2.sec {
      margin: 18px 0 8px 0;
      font-size: 12pt;
      color: #0f766e;
      border-bottom: 2px solid #99f6e4;
      padding-bottom: 4px;
      page-break-after: avoid;
    }
    table.data, table.summary4 {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 14px 0;
      font-size: 10pt;
      page-break-inside: auto;
    }
    table.data th, table.data td {
      border: 1px solid #d1d5db;
      padding: 7px 9px;
      text-align: right;
      vertical-align: top;
    }
    table.data th {
      background: #ccfbf1;
      color: #115e59;
      font-weight: 700;
    }
    table.data td.empty {
      color: #9ca3af;
      text-align: center;
      padding: 12px;
    }
    td.num {
      direction: ltr;
      unicode-bidi: isolate;
      text-align: left;
      font-variant-numeric: tabular-nums;
    }
    .nick { color: #6b7280; font-size: 9pt; font-weight: 400; }
    table.summary4 { margin-bottom: 18px; page-break-inside: avoid; }
    table.summary4 td.sb {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      width: 50%;
      vertical-align: top;
    }
    table.summary4 td.blue { background: #eff6ff; border-color: #bfdbfe; }
    table.summary4 td.red { background: #fef2f2; border-color: #fecaca; }
    table.summary4 td.green { background: #ecfdf5; border-color: #a7f3d0; }
    table.summary4 td.orange { background: #fff7ed; border-color: #fed7aa; }
    .sl { font-size: 9pt; color: #52525b; margin-bottom: 6px; }
    .sbig { font-size: 17pt; font-weight: 800; letter-spacing: -0.02em; }
    .pb { page-break-before: always; height: 0; margin: 0; padding: 0; border: none; }
    footer.ftr {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .banner { display: none !important; }
    }
    .banner {
      margin-bottom:12px;padding:10px 12px;background:#fef9c3;border:1px solid #fde047;
      border-radius:6px;font-size:10pt;color:#713f12;text-align:right;
    }
  </style>
</head>
<body dir="rtl">
  <div class="banner"><strong>איך שומרים PDF:</strong> בחלון ההדפסה בחרו מדפיס — <strong>Microsoft Print to PDF</strong>,
  <strong>Save as PDF</strong> או דומה · שם הקובץ: <code dir="ltr" style="font-size:10pt;">${esc(suggestedReportPdfFilename(p))}</code></div>
  ${body}
  <script>
    (function(){
      function go(){
        window.focus();
        setTimeout(function(){ window.print(); }, 350);
      }
      if(document.readyState === "complete") go();
      else window.addEventListener("load", go);
    })();
  <\/script>
</body>
</html>`;
}

/**
 * פותח דף הדפסה — בתפריט ההדפסה בוחרים «שמירה כ‑PDF».
 * @throws אם החלון נחסם
 */
export function exportReportsPdf(payload: ExportReportsPdfPayload): void {
  const doc = buildPrintDocument(payload);
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    throw new Error("הדפדפן חוסם חלון קופץ — הרשו חלונות קופצים לאתר");
  }
  w.document.open();
  w.document.write(doc);
  w.document.close();
}
