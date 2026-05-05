import html2pdf from "html2pdf.js";

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
  return `
    <div style="page-break-inside:avoid;margin-top:22px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #0d9488;">
      <h2 style="margin:0;font-size:15px;font-weight:700;color:#0f766e;">${esc(text)}</h2>
    </div>`;
}

function tableWrap(inner: string): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:10.5px;">
      ${inner}
    </table>`;
}

function th(text: string, width?: string): string {
  const w = width ? `width:${width};` : "";
  return `<th style="${w}text-align:right;padding:8px 10px;background:#f0fdfa;color:#115e59;border:1px solid #99f6e4;font-weight:600;">${esc(text)}</th>`;
}

function td(text: string, opts?: { strong?: boolean; dirLtr?: boolean }): string {
  const weight = opts?.strong ? "font-weight:600;" : "";
  const dir = opts?.dirLtr ? "direction:ltr;text-align:left;" : "text-align:right;";
  return `<td style="${dir}${weight}padding:7px 10px;border:1px solid #e5e7eb;vertical-align:middle;">${text}</td>`;
}

function buildHtml(p: ExportReportsPdfPayload): string {
  const title = p.groupName.trim() || "דוח קבוצה";

  const summaryGrid = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:8px;page-break-inside:avoid;">
      <div style="border:1px solid #dbeafe;border-radius:10px;padding:12px;background:#eff6ff;">
        <div style="font-size:10px;color:#1e40af;margin-bottom:4px;">סה״כ אירועים · ${esc(p.rangeLabel)}</div>
        <div style="font-size:20px;font-weight:800;color:#1d4ed8;">${p.summary.events}</div>
      </div>
      <div style="border:1px solid #fee2e2;border-radius:10px;padding:12px;background:#fef2f2;">
        <div style="font-size:10px;color:#991b1b;margin-bottom:4px;">סה״כ קוזז מהיתרה</div>
        <div style="font-size:20px;font-weight:800;color:#b91c1c;">${money(p.summary.totalDeducted)} ₪</div>
      </div>
      <div style="border:1px solid #d1fae5;border-radius:10px;padding:12px;background:#ecfdf5;">
        <div style="font-size:10px;color:#065f46;margin-bottom:4px;">סה״כ יתרות (חברים פעילים)</div>
        <div style="font-size:20px;font-weight:800;color:#047857;">${money(p.summary.totalBalance)} ₪</div>
      </div>
      <div style="border:1px solid #ffedd5;border-radius:10px;padding:12px;background:#fff7ed;">
        <div style="font-size:10px;color:#9a3412;margin-bottom:4px;">תשלומי אורחים (טווח הדוח)</div>
        <div style="font-size:20px;font-weight:800;color:#c2410c;">${money(p.summary.guestPayments)} ₪</div>
      </div>
    </div>`;

  let membersTable =
    `<tr>${th("חבר")}${th("אירועים")}${th("קוזז בטווח")}${th("יתרה")}${th('סה״כ שהופקד')}${th("חוב")}</tr>`;
  if (p.members.length === 0) {
    membersTable += `<tr><td colspan="6" style="text-align:right;padding:10px;border:1px solid #e5e7eb;color:#9ca3af;">אין חברים פעילים בתקופה</td></tr>`;
  } else {
    for (const m of p.members) {
      const nick = m.nickname ? ` <span style="color:#6b7280;font-size:9px;">(${esc(m.nickname)})</span>` : "";
      membersTable += `<tr>
      ${td(esc(m.name) + nick, { strong: true })}
      ${td(String(m.eventsAttended))}
      ${td(money(m.totalPaid) + " ₪", { dirLtr: true })}
      ${td(money(m.currentBalance) + " ₪", { dirLtr: true })}
      ${td(money(m.totalDeposited) + " ₪", { dirLtr: true })}
      ${td(m.owes > 0 ? money(m.owes) + " ₪" : "—", { dirLtr: true })}
    </tr>`;
    }
  }

  let eventsTable =
    `<tr>${th("תאריך", "22%")}${th("פרטים")}${th("עלות", "14%")}</tr>`;
  if (p.eventsInPeriod.length === 0) {
    eventsTable += `<tr><td colspan="3" style="text-align:right;padding:10px;border:1px solid #e5e7eb;color:#9ca3af;">אין אירועים בטווח</td></tr>`;
  } else {
    for (const e of p.eventsInPeriod) {
      eventsTable += `<tr>
        ${td(esc(e.dateLabel))}
        ${td(esc(e.description || "—"))}
        ${td(money(e.cost) + " ₪", { dirLtr: true })}
      </tr>`;
    }
  }

  let monthlyTable = `<tr>${th("חודש")}${th("אירועים", "14%")}${th("קוזז מהיתרה", "26%")}</tr>`;
  for (const row of p.monthlyOverview) {
    monthlyTable += `<tr>
      ${td(esc(row.month))}
      ${td(String(row.events))}
      ${td(money(row.deducted) + " ₪", { dirLtr: true })}
    </tr>`;
  }

  let attendanceTable = `<tr>${th("חבר")}${th("אירועים בהם השתתף", "22%")}</tr>`;
  if (p.attendance.length === 0) {
    attendanceTable += `<tr><td colspan="2" style="text-align:right;padding:10px;border:1px solid #e5e7eb;color:#9ca3af;">אין נתוני נוכחות בתקופה</td></tr>`;
  } else {
    for (const a of p.attendance) {
      attendanceTable += `<tr>${td(esc(a.name))}${td(String(a.events), { dirLtr: true })}</tr>`;
    }
  }

  let hostsTable = `<tr>${th("מארח")}${th("מספר אירועים", "22%")}</tr>`;
  if (p.hosts.length === 0) {
    hostsTable += `<tr><td colspan="2" style="text-align:right;padding:10px;border:1px solid #e5e7eb;color:#9ca3af;">אין שיוכי מארחים באירועים</td></tr>`;
  } else {
    for (const h of p.hosts) {
      const nick = h.nickname ? ` (${esc(h.nickname)})` : "";
      hostsTable += `<tr>${td(esc(h.name) + nick)}${td(String(h.count), { dirLtr: true })}</tr>`;
    }
  }

  const header = `
    <div style="page-break-inside:avoid;margin-bottom:20px;text-align:right;border-bottom:3px solid #0d9488;padding-bottom:16px;">
      <div style="font-size:22px;font-weight:800;color:#134e4a;letter-spacing:-0.02em;">${esc(title)}</div>
      <div style="font-size:13px;color:#0f766e;margin-top:6px;font-weight:600;">דוח מסכם לקבוצה</div>
      <div style="font-size:11px;color:#64748b;margin-top:10px;line-height:1.6;">
        <div><strong>תקופה:</strong> ${esc(p.rangeLabel)} · <strong>היקף:</strong> ${esc(p.reportScopeLabel)}</div>
        <div><strong>נוצר:</strong> ${esc(p.generatedAt)}</div>
      </div>
    </div>`;

  return `
    ${header}
    ${summaryGrid}
    ${sectionTitle("דוח לפי חברים (פעילים)")}
    ${tableWrap(membersTable)}
    ${sectionTitle("אירועים בטווח הדוח")}
    ${tableWrap(eventsTable)}
    <div style="page-break-before:always;"></div>
    ${sectionTitle("מגמות — 6 חודשים אחרונים")}
    ${tableWrap(monthlyTable)}
    ${sectionTitle("נוכחות חברים בטווח הדוח")}
    ${tableWrap(attendanceTable)}
    ${sectionTitle("אירוח — מי אירח הכי הרבה (סה״כ)")}
    ${tableWrap(hostsTable)}
    <div style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:9px;color:#94a3b8;text-align:center;">
      הופק באמצעות מערכת ניהול הקבוצה · לשימוש פנימי בלבד
    </div>
  `;
}

function safeFilenamePart(name: string): string {
  const n = name
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return n || "kvutsa";
}

export async function exportReportsPdf(payload: ExportReportsPdfPayload): Promise<void> {
  const el = document.createElement("div");
  el.setAttribute("dir", "rtl");
  el.style.cssText =
    "position:absolute;left:-9999px;top:0;width:210mm;max-width:794px;box-sizing:border-box;padding:24px 28px;background:#ffffff;color:#171717;font-family:'Segoe UI',Tahoma,'Helvetica Neue','Arial Hebrew',Arial,sans-serif;";
  el.innerHTML = buildHtml(payload);
  document.body.appendChild(el);

  const stamp = new Date().toISOString().slice(0, 10);
  const fname = `doh-${safeFilenamePart(payload.groupName)}-${stamp}.pdf`;

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: fname,
    image: { type: "jpeg" as const, quality: 0.93 },
    html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
    pagebreak: { mode: ["css", "legacy"] as ("css" | "legacy")[] },
  };

  try {
    await html2pdf().set(opt).from(el).save();
  } finally {
    document.body.removeChild(el);
  }
}
