"""One-off analysis: Paybox xlsx vs app numbers (no app CSV required)."""
import sys
from pathlib import Path

import openpyxl


def main():
    if len(sys.argv) < 2:
        print("Usage: python run_reconcile_analysis.py <paybox.xlsx> [app_total_deposited] [app_balance]")
        sys.exit(1)
    path = Path(sys.argv[1])
    app_dep = float(sys.argv[2]) if len(sys.argv) > 2 else 11000.0
    app_bal = float(sys.argv[3]) if len(sys.argv) > 3 else 1054.26

    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r or len(r) < 4:
            continue
        kind, amt = r[2], r[3]
        if kind is None or amt is None:
            continue
        kind = str(kind).strip().lower()
        try:
            amt = float(amt)
        except (TypeError, ValueError):
            continue
        rows.append((kind, amt, r[0], r[4]))

    pay = sum(a for k, a, _, _ in rows if k == "payment")
    red = sum(a for k, a, _, _ in rows if k == "redeem")
    net = pay + red
    implied_deduct = app_dep - app_bal
    paybox_red_abs = abs(red)

    lines = []
    lines.append("=== Paybox (from xlsx) ===")
    lines.append(f"Total payment: {pay:.2f}")
    lines.append(f"Total redeem: {red:.2f}")
    lines.append(f"Net balance: {net:.2f}")
    lines.append("")
    lines.append(f"=== App (you said: deposited {app_dep}, balance {app_bal}) ===")
    lines.append(f"Implied deductions (deposited - balance): {implied_deduct:.2f}")
    lines.append("")
    lines.append("=== Gaps ===")
    lines.append(f"Deposits: Paybox vs app total: {pay - app_dep:+.2f} (positive = more in Paybox)")
    lines.append(
        f"Outflows: implied app deductions vs |Paybox redeem|: {implied_deduct - paybox_red_abs:+.2f} (positive = app shows more outflow than Paybox redeems)"
    )
    lines.append(f"Balance: Paybox net vs app balance: {net - app_bal:+.2f}")
    lines.append("")
    lines.append("=== Interpretation ===")
    lines.append(
        "If Paybox is the cash truth: the ~430 NIS gap in deposits means either "
        "not all Paybox payments are in the app 'total deposited', or the 11000 figure is incomplete."
    )
    lines.append(
        "The ~212 NIS gap in outflows means the app recorded more deduction from the pool than "
        "appears as redeem in Paybox (double booking, or redeem not yet, or different definition)."
    )
    lines.append(
        "Together these explain the ~642 NIS balance gap (430.75 + 211.75 ~= 642.5)."
    )
    lines.append("")
    lines.append("=== Paybox redeem lines ===")
    for k, a, name, dt in sorted(rows, key=lambda x: str(x[3] or "")):
        if k != "redeem":
            continue
        lines.append(f"  {dt} | {a:.2f} | {name}")

    text = "\n".join(lines)
    print(text)
    out = Path(__file__).resolve().parent.parent / "docs" / "reconcile_analysis_result.txt"
    out.write_text(text, encoding="utf-8")
    print(f"\nSaved: {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
