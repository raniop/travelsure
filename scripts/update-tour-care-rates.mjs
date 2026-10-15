// Reads the Tour & Care rates from Harel's page into scripts/pdf/tour-care-rates.json.
// Harel reprices monthly (CPI-linked, around the 15th). Fails without writing anything when
// the page no longer looks as expected, so a broken parse never ships a wrong PDF.
// Prints changed=true|false (also to $GITHUB_OUTPUT when running in Actions).
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

const FILE = "scripts/pdf/tour-care-rates.json";
const current = JSON.parse(readFileSync(FILE, "utf8"));

const res = await fetch(current.source, {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36" },
  signal: AbortSignal.timeout(60_000),
});
if (!res.ok) throw new Error(`Harel page returned ${res.status}`);
const html = await res.text();

const text = (fragment) =>
  fragment
    .replace(/<br[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|\u200b|\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

// The rates column: the list right after this heading.
const heading = html.indexOf("שירותי בריאות מכבי / כללית / מערך פרטי של הראל");
if (heading < 0) throw new Error("rates heading not found");
const listStart = html.indexOf("<ul", heading);
const listEnd = html.indexOf("</ul>", listStart);
const items = [...html.slice(listStart, listEnd).matchAll(/<li[\s\S]*?<\/li>/g)].map((m) => text(m[0])).filter(Boolean);

const PRICE = /^(\d+(?:\.\d+)?) ₪$/;
const base = items.filter((t) => PRICE.test(t)).map((t) => t.match(PRICE)[1]);
const riders = items
  .filter((t) => t.includes("גיל"))
  .map((t) => [...t.matchAll(/גיל [\d-]+: (\d+(?:\.\d+)?) ₪/g)].map((m) => m[1]));

const indexMatch = text(html).match(/צמודים למדד שפורסם בחודש (\S+ \d{4}) \( ?([\d.]+) נקודות\)/);

const problems = [];
if (base.length !== 4) problems.push(`expected 4 base rates, got ${base.length}`);
if (riders.length !== 5 || riders.some((r) => r.length !== 2)) problems.push(`expected 5 add-ons x 2 ages, got ${JSON.stringify(riders)}`);
if (!indexMatch) problems.push("CPI line not found");
// Coverage limits printed in the PDF text; if Harel changes them the template needs a human.
for (const fixed of ["350,000", "18,000", "35,000", "50,000", "700"]) {
  if (!html.includes(fixed)) problems.push(`coverage value ${fixed} no longer on the page`);
}
// Monthly CPI moves are well under 1%; a big jump means a misparse or a real repricing to review.
const pairs = [
  ...base.map((v, i) => [v, current.base[i]]),
  ...riders.flatMap((r, i) => r.map((v, j) => [v, current.riders[i]?.[j]])),
];
for (const [next, prev] of pairs) {
  if (prev && Math.abs(Number(next) / Number(prev) - 1) > 0.25) problems.push(`rate jumped ${prev} -> ${next}`);
}
if (problems.length) {
  console.error("Not updating the Tour & Care PDF:\n- " + problems.join("\n- "));
  process.exit(1);
}

const next = { ...current, indexMonth: indexMatch[1], indexPoints: indexMatch[2], base, riders };
const changed = JSON.stringify({ ...next, checkedAt: "" }) !== JSON.stringify({ ...current, checkedAt: "" });
if (changed) {
  next.checkedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(FILE, JSON.stringify(next, null, 2) + "\n");
}
console.log(`changed=${changed}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
