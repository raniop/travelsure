#!/usr/bin/env python3
"""
הצלבה: ייצוא פייבוקס (xlsx) ↔ אופציונלי קובץ מהאפליקציה (CSV).

שימוש:
  python scripts/reconcile_paybox.py "path/to/paybox.xlsx"
  python scripts/reconcile_paybox.py paybox.xlsx --app app_moves.csv

פורמט app_moves.csv (UTF-8) — ניתן לייצא מעמוד תשלומים (מנהל): "ייצוא להצלבה (פייבוקס)":
  date,amount_signed,note,... (עמודות נוספות מתעלמים)
  ניכויים מהקופה מיוצגים כשלילי (כמו redeem בפייבוקס).
  2026-01-14,500,הפקדה
  2026-02-10,-642.85,ניכוי
  (amount_signed: חיובי = כניסה, שלילי = יציאה)
"""
from __future__ import annotations

import argparse
import csv
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def load_paybox(path: Path) -> list[dict]:
    try:
        import openpyxl
    except ImportError:
        print("pip install openpyxl", file=sys.stderr)
        sys.exit(1)
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    out = []
    for r in rows:
        if not r or len(r) < 4:
            continue
        name, phone, kind, amt = r[0], r[1], r[2], r[3]
        if kind is None or amt is None:
            continue
        kind_s = str(kind).strip().lower()
        try:
            amount = float(amt)
        except (TypeError, ValueError):
            continue
        dt = r[4]
        note = (r[5] or "") if len(r) > 5 else ""
        out.append(
            {
                "name": name,
                "phone": str(phone).strip() if phone else "",
                "kind": kind_s,
                "amount": amount,
                "date": dt,
                "note": note,
            }
        )
    return out


def paybox_totals(rows: list[dict]) -> tuple[float, float, float]:
    pay = sum(r["amount"] for r in rows if r["kind"] == "payment")
    redeem = sum(r["amount"] for r in rows if r["kind"] == "redeem")
    return pay, redeem, pay + redeem


def norm_date(d) -> str:
    if d is None:
        return ""
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d %H:%M:%S")
    return str(d).strip()


def fingerprint(r: dict) -> tuple:
    """התאמה גסה: תאריך (יום) + סכום מוחלט + סוג."""
    d = r.get("date")
    if isinstance(d, datetime):
        day = d.strftime("%Y-%m-%d")
    else:
        day = str(d)[:10] if d else ""
    amt = round(abs(float(r["amount"])), 2)
    return (day, amt, r["kind"])


def load_app_csv(path: Path) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            amt = float(row["amount_signed"].strip())
            rows.append(
                {
                    "date": row.get("date", "").strip(),
                    "amount_signed": amt,
                    "note": row.get("note", ""),
                }
            )
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("paybox_xlsx", type=Path)
    ap.add_argument("--app", type=Path, help="CSV מהאפליקציה (date,amount_signed,note)")
    ap.add_argument("--out", type=Path, help="דוח טקסט לקובץ")
    args = ap.parse_args()

    pb = load_paybox(args.paybox_xlsx)
    pay, redeem, net = paybox_totals(pb)

    lines: list[str] = []
    lines.append("=== דוח הצלבה – פייבוקס (ייצוא אקסל) ===\n")
    lines.append(f"שורות תנועות: {len(pb)}")
    lines.append(f"סה\"כ payment (הפקדות): {pay:.2f} ₪")
    lines.append(f"סה\"כ redeem (משיכות, כולל שלילי): {redeem:.2f} ₪")
    lines.append(f"יתרה נטו (payment + redeem): {net:.2f} ₪")
    lines.append("")

    # fingerprints for matching
    fp_paybox = defaultdict(int)
    for r in pb:
        fp_paybox[fingerprint(r)] += 1

    if args.app and args.app.exists():
        app_rows = load_app_csv(args.app)
        app_sum = sum(r["amount_signed"] for r in app_rows)
        lines.append("=== קובץ אפליקציה ===\n")
        lines.append(f"שורות: {len(app_rows)}")
        lines.append(f"סכום signed (אמור להתקרב ליתרה נטו אם זה מלא): {app_sum:.2f} ₪")
        lines.append("")
        lines.append("=== התאמות לפי (יום + סכום + סוג) ===\n")
        # Build app fingerprints: positive = payment-like, negative = redeem
        for r in app_rows:
            amt = r["amount_signed"]
            kind = "payment" if amt > 0 else "redeem"
            day = r["date"][:10] if len(r["date"]) >= 10 else r["date"]
            fp = (day, round(abs(amt), 2), kind)
            cnt = fp_paybox.get(fp, 0)
            status = "✓ יש התאמה בפייבוקס" if cnt > 0 else "✗ אין התאמה בפייבוקס"
            lines.append(f"  {r['date']} | {amt:+.2f} | {status} | {r.get('note','')}")

        lines.append("")
        lines.append("=== שורות בפייבוקס בלי התאמה באפליקציה (לפי אותו fingerprint) ===\n")
        fp_app = defaultdict(int)
        for r in app_rows:
            amt = r["amount_signed"]
            kind = "payment" if amt > 0 else "redeem"
            day = r["date"][:10] if len(r["date"]) >= 10 else r["date"]
            fp_app[(day, round(abs(amt), 2), kind)] += 1
        for r in pb:
            fp = fingerprint(r)
            if fp_app.get(fp, 0) <= 0:
                lines.append(
                    f"  {norm_date(r['date'])} | {r['kind']:7} | {r['amount']:.2f} | {r['name']} | {r['note']}"
                )
            else:
                fp_app[fp] -= 1
    else:
        lines.append(
            "(לא סופק קובץ אפליקציה. צור CSV עם עמודות date,amount_signed,note והרץ עם --app)\n"
        )
        lines.append("=== כל תנועות פייבוקס (לעתק ידני / השוואה) ===\n")
        for r in sorted(pb, key=lambda x: (norm_date(x["date"]), x["kind"])):
            lines.append(
                f"{norm_date(r['date'])} | {r['kind']:7} | {r['amount']:>10.2f} | {r.get('name','')} | {r.get('phone','')} | {r.get('note','')}"
            )

    text = "\n".join(lines)
    print(text)
    if args.out:
        args.out.write_text(text, encoding="utf-8")
        print(f"\nנשמר: {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
