#!/usr/bin/env python3
"""
Runs full reconciliation in one shot:
  - Finds newest Paybox xlsx in Downloads (pattern *_*_DD-MM-YYYY.xlsx or any *.xlsx with redeem rows)
  - Finds newest bbq-pool-deductions*.csv if present
  - Loads optional scripts/reconcile_config.json for app totals (fallback: example values)
  - Writes docs/reconcile_full_report.txt

Usage:
  python scripts/reconcile_all.py
  python scripts/reconcile_all.py --paybox "C:/path/file.xlsx" --app "C:/path/deductions.csv"
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = SCRIPT_DIR / "reconcile_config.json"
EXAMPLE_CONFIG = SCRIPT_DIR / "reconcile_config.json.example"
OUT_REPORT = REPO_ROOT / "docs" / "reconcile_full_report.txt"


def _need_openpyxl():
    try:
        import openpyxl  # noqa: F401
    except ImportError:
        print("pip install openpyxl", file=sys.stderr)
        sys.exit(1)


def load_paybox(path: Path) -> list[dict]:
    import openpyxl

    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active
    out = []
    for r in ws.iter_rows(min_row=2, values_only=True):
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
    d = r.get("date")
    if isinstance(d, datetime):
        day = d.strftime("%Y-%m-%d")
    else:
        day = str(d)[:10] if d else ""
    amt = round(abs(float(r["amount"])), 2)
    return (day, amt, r["kind"])


def discover_downloads() -> Path:
    return Path.home() / "Downloads"


def find_paybox_xlsx(downloads: Path, explicit: Path | None) -> Path | None:
    if explicit and explicit.is_file():
        return explicit
    # Prefer known Paybox export name pattern (day-month-year in name)
    for pattern in ("*_05-04-2026.xlsx", "*_2026.xlsx"):
        found = sorted(
            (p for p in downloads.glob(pattern) if p.is_file()),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if found:
            return found[0]
    # Fallback: newest xlsx in Downloads
    all_xlsx = sorted(
        downloads.glob("*.xlsx"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    return all_xlsx[0] if all_xlsx else None


def find_app_csv(downloads: Path, explicit: Path | None) -> Path | None:
    if explicit and explicit.is_file():
        return explicit
    matches = list(downloads.glob("bbq-pool-deductions*.csv"))
    if not matches:
        return None
    matches.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return matches[0]


def load_app_csv(path: Path) -> list[dict]:
    import csv

    rows = []
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if "amount_signed" not in row:
                continue
            amt = float(row["amount_signed"].strip())
            rows.append(
                {
                    "date": row.get("date", "").strip(),
                    "amount_signed": amt,
                    "note": row.get("note", ""),
                }
            )
    return rows


def load_config() -> tuple[float, float]:
    if CONFIG_PATH.is_file():
        data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        return float(data["app_total_deposited"]), float(data["app_balance"])
    if EXAMPLE_CONFIG.is_file():
        data = json.loads(EXAMPLE_CONFIG.read_text(encoding="utf-8"))
        return float(data["app_total_deposited"]), float(data["app_balance"])
    return 11000.0, 1054.26


def main() -> None:
    import argparse

    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    _need_openpyxl()

    ap = argparse.ArgumentParser(description="Full Paybox vs app reconciliation")
    ap.add_argument("--paybox", type=Path, default=None, help="Path to Paybox xlsx")
    ap.add_argument("--app", type=Path, default=None, help="Path to bbq-pool-deductions CSV")
    args = ap.parse_args()

    downloads = discover_downloads()
    paybox_path = find_paybox_xlsx(downloads, args.paybox)
    app_csv_path = find_app_csv(downloads, args.app)

    lines: list[str] = []
    lines.append("=== reconcile_all.py (full report) ===\n")
    lines.append(f"Downloads folder: {downloads}")
    lines.append(f"Paybox file: {paybox_path or 'NOT FOUND'}")
    lines.append(f"App deductions CSV: {app_csv_path or 'NOT FOUND (export from BBQ Payments page)'}")

    app_dep, app_bal = load_config()
    lines.append(f"App config (reconcile_config.json or example): deposited={app_dep}, balance={app_bal}")
    lines.append("")

    if not paybox_path:
        lines.append("ERROR: No Paybox xlsx found. Place export in Downloads or pass --paybox.")
        text = "\n".join(lines)
        OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
        OUT_REPORT.write_text(text, encoding="utf-8")
        print(text)
        sys.exit(1)

    pb = load_paybox(paybox_path)
    pay, redeem, net = paybox_totals(pb)
    implied_deduct = app_dep - app_bal
    paybox_red_abs = abs(redeem)

    lines.append("=== Paybox (xlsx) ===")
    lines.append(f"Rows: {len(pb)}")
    lines.append(f"Total payment: {pay:.2f}")
    lines.append(f"Total redeem: {redeem:.2f}")
    lines.append(f"Net balance: {net:.2f}")
    lines.append("")
    lines.append("=== App (config numbers) ===")
    lines.append(f"Implied deductions (deposited - balance): {implied_deduct:.2f}")
    lines.append("")
    lines.append("=== Summary gaps ===")
    lines.append(f"Deposits gap (Paybox - app deposited): {pay - app_dep:+.2f}")
    lines.append(f"Outflows gap (implied app - |Paybox redeem|): {implied_deduct - paybox_red_abs:+.2f}")
    lines.append(f"Balance gap (Paybox net - app balance): {net - app_bal:+.2f}")
    lines.append("")

    fp_paybox: dict = defaultdict(int)
    for r in pb:
        fp_paybox[fingerprint(r)] += 1

    if app_csv_path and app_csv_path.is_file():
        app_rows = load_app_csv(app_csv_path)
        app_sum = sum(r["amount_signed"] for r in app_rows)
        lines.append("=== App CSV (deductions export) ===")
        lines.append(f"Rows: {len(app_rows)}")
        lines.append(f"Sum of amount_signed: {app_sum:.2f}")
        lines.append("")
        lines.append("=== Row match (day + amount + payment|redeem) ===")
        for r in app_rows:
            amt = r["amount_signed"]
            kind = "payment" if amt > 0 else "redeem"
            day = r["date"][:10] if len(r["date"]) >= 10 else r["date"]
            fp = (day, round(abs(amt), 2), kind)
            cnt = fp_paybox.get(fp, 0)
            ok = "OK Paybox" if cnt > 0 else "NO match in Paybox"
            lines.append(f"  {r['date']} | {amt:+.2f} | {ok} | {r.get('note','')}")

        lines.append("")
        lines.append("=== Paybox rows with no matching app row ===")
        fp_app: dict = defaultdict(int)
        for r in app_rows:
            amt = r["amount_signed"]
            kind = "payment" if amt > 0 else "redeem"
            day = r["date"][:10] if len(r["date"]) >= 10 else r["date"]
            fp_app[(day, round(abs(amt), 2), kind)] += 1
        for r in pb:
            fp = fingerprint(r)
            if fp_app.get(fp, 0) <= 0:
                lines.append(
                    f"  {norm_date(r['date'])} | {r['kind']:7} | {r['amount']:.2f} | {r.get('name','')} | {r.get('note','')}"
                )
            else:
                fp_app[fp] -= 1
        lines.append("")
    else:
        lines.append("=== No app CSV: fingerprint matching skipped ===")
        lines.append("Export from BBQ: Payments -> 'Yitzua lehatzlava (Paybox)' then re-run.")
        lines.append("")

    lines.append("=== All Paybox transactions ===")
    for r in sorted(pb, key=lambda x: (norm_date(x["date"]), x["kind"])):
        lines.append(
            f"{norm_date(r['date'])} | {r['kind']:7} | {r['amount']:>10.2f} | {r.get('name','')} | {r.get('phone','')} | {r.get('note','')}"
        )

    text = "\n".join(lines)
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text(text, encoding="utf-8")
    print(text)
    print(f"\nSaved: {OUT_REPORT}", file=sys.stderr)


if __name__ == "__main__":
    main()
