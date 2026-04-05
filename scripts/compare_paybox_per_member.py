#!/usr/bin/env python3
"""Compare Paybox payments per phone vs app: balance + sum(deductions) from export CSV."""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path


def norm_phone(s: str | None) -> str:
    if not s:
        return ""
    d = re.sub(r"\D", "", str(s))
    if d.startswith("972"):
        d = "0" + d[3:]
    if len(d) >= 9:
        return d[-9:]
    return d


def main() -> None:
    downloads = Path.home() / "Downloads"
    members_path = downloads / "bbq-members-balance-2026-04-05-1055.csv"
    ded_path = downloads / "bbq-pool-deductions-2026-04-05-1055.csv"
    xlsx = next(iter(sorted(downloads.glob("*_05-04-2026.xlsx"), key=lambda p: p.stat().st_mtime, reverse=True)), None)
    if not members_path.is_file() or not ded_path.is_file() or not xlsx:
        print("Need in Downloads: bbq-members-balance-*.csv, bbq-pool-deductions-*.csv, Paybox xlsx", file=sys.stderr)
        sys.exit(1)

    try:
        import openpyxl
    except ImportError:
        print("pip install openpyxl", file=sys.stderr)
        sys.exit(1)

    members: dict[str, dict] = {}
    with members_path.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            ph = norm_phone(row.get("phone"))
            members[ph] = {"name": (row.get("name") or "").strip(), "balance": float(row["balance"])}

    name_to_deducted: dict[str, float] = {}
    with ded_path.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            n = (row.get("payer_name") or "").strip()
            a = abs(float(row["amount_signed"]))
            name_to_deducted[n] = name_to_deducted.get(n, 0.0) + a

    paybox_by_phone: dict[str, float] = {}
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    ws = wb.active
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or len(row) < 4:
            continue
        kind, amt = row[2], row[3]
        if kind is None or amt is None:
            continue
        if str(kind).strip().lower() != "payment":
            continue
        ph = norm_phone(row[1])
        paybox_by_phone[ph] = paybox_by_phone.get(ph, 0.0) + float(amt)

    lines: list[str] = []
    lines.append("=== השוואה: פייבוקס (סהכ payment) מול אפליקציה (יתרה + ניכויים) ===\n")
    lines.append(
        "עמודות: פייבוקס=סכום הפקדות לפי טלפון בייצוא | יתרה+ניכוי=מה שאמור להסתדר אם כל ההפקדות רשומות | פער=פייבוקס-(יתרה+ניכוי)\n"
    )
    lines.append(
        f"{'שם':20} | {'טלפון':9} | {'פייבוקס':>10} | {'יתרה':>8} | {'ניכויים':>8} | {'יתרה+ניכוי':>12} | {'פער':>8}"
    )
    lines.append("-" * 95)

    total_gap = 0.0
    flagged: list[tuple[str, float]] = []

    for ph in sorted(members.keys(), key=lambda p: members[p]["name"]):
        info = members[ph]
        name = info["name"]
        bal = info["balance"]
        ded = name_to_deducted.get(name, 0.0)
        implied = bal + ded
        pb = paybox_by_phone.get(ph, 0.0)
        gap = pb - implied
        total_gap += gap
        if abs(gap) >= 5:
            flagged.append((name, gap))
        lines.append(
            f"{name[:20]:20} | {ph:9} | {pb:10.2f} | {bal:8.2f} | {ded:8.2f} | {implied:12.2f} | {gap:+8.2f}"
        )

    lines.append("")
    lines.append(f"סהכ פער (סכום עמודת פער): {total_gap:+.2f} (אמור להיות קרוב ל-430.75 אם הכל מדויק)")
    lines.append("")

    # Names in deductions but not in members export
    member_names = {m["name"] for m in members.values()}
    for n in sorted(name_to_deducted.keys()):
        if n not in member_names:
            lines.append(f"ניכויים לשם '{n}' — לא מופיע בייצוא חברים (בדוק התאמת שם)")

    # Paybox phones not in members
    extra = {p: a for p, a in paybox_by_phone.items() if p not in members and a > 0}
    if extra:
        lines.append("")
        lines.append("טלפונים בפייבוקס עם הפקדה אבל לא בייצוא חברים (שמות באנגלית וכו'):")
        for p, a in sorted(extra.items(), key=lambda x: -x[1]):
            lines.append(f"  {p} -> {a:.2f} ₪")

    lines.append("")
    lines.append("=== חשודים לעדכון חסר באפליקציה (פער חיובי גדול) ===")
    for name, gap in sorted(flagged, key=lambda x: -x[1]):
        if gap > 1:
            lines.append(f"  {name}: פייבוקס מראה {gap:.2f} ₪ יותר ממה שמתקבל מיתרה+ניכוי — אולי לא עדכנת יתרה אחרי הפקדה")

    text = "\n".join(lines)
    out = Path(__file__).resolve().parent.parent / "docs" / "paybox_per_member_gap.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(text)
    print(f"\nSaved: {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
