import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const distIndex = join(process.cwd(), "dist", "index.html");
const bbqIndex = join(process.cwd(), "dist", "bbq", "index.html");

if (!existsSync(distIndex)) {
  console.log("sync-bbq-assets: dist/index.html not found, skipping.");
  process.exit(0);
}

if (!existsSync(bbqIndex)) {
  console.log("sync-bbq-assets: dist/bbq/index.html not found, skipping.");
  process.exit(0);
}

const main = readFileSync(distIndex, "utf8");
const jsMatch = main.match(/src="(\/assets\/index-[^"]+\.js)"/);
const cssMatch = main.match(/href="(\/assets\/index-[^"]+\.css)"/);

if (!jsMatch || !cssMatch) {
  console.error("sync-bbq-assets: could not find asset paths in dist/index.html");
  process.exit(1);
}

const jsPath = jsMatch[1];
const cssPath = cssMatch[1];

let bbq = readFileSync(bbqIndex, "utf8");
bbq = bbq.replace(/src="\/assets\/index-[^"]+\.js"/, `src="${jsPath}"`);
bbq = bbq.replace(/href="\/assets\/index-[^"]+\.css"/, `href="${cssPath}"`);
writeFileSync(bbqIndex, bbq, "utf8");

console.log(`sync-bbq-assets: updated dist/bbq/index.html -> ${jsPath}, ${cssPath}`);
