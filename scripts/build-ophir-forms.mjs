// Builds the standalone forms page served at ophir.travelsure.co.il/forms.
// Same design and documents as the React /forms page (src/pages/FormsDownloads.tsx),
// as one static file because the ophir IIS copy of the site isn't redeployed.
//
//   node scripts/build-ophir-forms.mjs
//
// Writes public/ophir-forms/index.html (+ logo.png). On IIS, web.config rewrites
// ^forms/?$ to /ophir-forms/index.html (see public/web.config).
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "ophir-forms");

const categories = JSON.parse(readFileSync(join(root, "src", "data", "formCategories.json"), "utf8"));
// "<" escaped so a title can never close the <script> tag the JSON sits in
const json = JSON.stringify(categories).replace(/</g, "\\u003c");

const template = readFileSync(join(root, "scripts", "ophir-forms.template.html"), "utf8");
if (!template.includes("__FORMS_DATA__")) throw new Error("template is missing __FORMS_DATA__");

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), template.replace("__FORMS_DATA__", () => json), "utf8");
copyFileSync(join(root, "src", "assets", "ophir-logo.png"), join(outDir, "logo.png"));

const total = categories.reduce((n, c) => n + c.forms.length, 0);
console.log(`ophir-forms: wrote public/ophir-forms/index.html (${categories.length} categories, ${total} documents)`);
