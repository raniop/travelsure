// Renders scripts/pdf/tour-and-care.html (filled from tour-care-rates.json) to
// public/docs/tourists/tour-and-care-coverages.pdf with headless Chrome/Edge.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const HEBREW_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

const browsers = [
  process.env.CHROME_PATH,
  "/usr/bin/google-chrome",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = browsers.find((p) => existsSync(p));
if (!browser) throw new Error("Chrome/Edge not found; set CHROME_PATH");

const rates = JSON.parse(readFileSync("scripts/pdf/tour-care-rates.json", "utf8"));
const [year, month] = rates.checkedAt.split("-").map(Number);
const values = { ...rates, checkedAtLabel: `${HEBREW_MONTHS[month - 1]} ${year}` };
const lookup = (path) => path.split(".").reduce((v, k) => (v == null ? undefined : v[k]), values);

const template = readFileSync("scripts/pdf/tour-and-care.html", "utf8");
const filled = template.replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
  const v = lookup(key);
  return v == null || typeof v === "object" ? m : String(v);
});
const leftover = filled.match(/<body[\s\S]*\{\{[\w.]+\}\}/);
if (leftover) throw new Error("unfilled placeholder in the page body");

// Written next to the template so the relative logo path still resolves.
const tmp = resolve("scripts/pdf/.tour-and-care.filled.html");
writeFileSync(tmp, filled);
const out = resolve("public/docs/tourists/tour-and-care-coverages.pdf");
rmSync(out, { force: true });
try {
  execFileSync(browser, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", "--virtual-time-budget=8000",
    `--print-to-pdf=${out}`, pathToFileURL(tmp).href,
  ], { stdio: "inherit" });
  // Edge on Windows hands off to a background process and returns before the PDF is written.
  for (let i = 0; i < 40 && !(existsSync(out) && statSync(out).size > 0); i++) {
    await new Promise((r) => setTimeout(r, 500));
  }
} finally {
  setTimeout(() => rmSync(tmp, { force: true }), 3000);
}
if (!existsSync(out)) throw new Error("PDF was not written");
// Without Rubik the Hebrew text falls back to a font with no Hebrew glyphs and silently disappears.
if (!readFileSync(out, "latin1").includes("Rubik")) {
  rmSync(out, { force: true });
  throw new Error("Rubik is not embedded in the PDF (font failed to load); not writing a PDF without Hebrew text");
}
console.log("wrote", out);
