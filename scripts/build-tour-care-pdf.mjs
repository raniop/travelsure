// Renders scripts/pdf/tour-and-care.html to public/docs/tourists/tour-and-care-coverages.pdf with headless Chrome/Edge.
import { execFileSync } from "node:child_process";
import { existsSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const browsers = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = browsers.find((p) => existsSync(p));
if (!browser) throw new Error("Chrome/Edge not found; set CHROME_PATH");

const src = pathToFileURL(resolve("scripts/pdf/tour-and-care.html")).href;
const out = resolve("public/docs/tourists/tour-and-care-coverages.pdf");
rmSync(out, { force: true });
execFileSync(browser, [
  "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000",
  `--print-to-pdf=${out}`, src,
], { stdio: "inherit" });
// Edge on Windows hands off to a background process and returns before the PDF is written.
for (let i = 0; i < 40 && !(existsSync(out) && statSync(out).size > 0); i++) {
  await new Promise((r) => setTimeout(r, 500));
}
if (!existsSync(out)) throw new Error("PDF was not written");
console.log("wrote", out);
