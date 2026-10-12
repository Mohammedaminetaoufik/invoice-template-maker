import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const pairs = [
  ["en", "", "fr/"],
  ["en", "invoice-templates", "fr/modeles-factures/"],
  ["en", "simple-invoice-template", "fr/modele-facture-simple/"],
  ["en", "freelance-invoice", "fr/facture-freelance/"],
  ["en", "invoice-with-logo", "fr/facture-avec-logo/"],
  ["en", "how-to-make-an-invoice", "fr/comment-faire-une-facture/"],
];

let failures = 0;
for (const [locale, slug, frenchPath] of pairs) {
  const file = resolve("out", locale, slug, "index.html");
  if (!existsSync(file)) { console.error(`Missing static route: ${file}`); failures++; continue; }
  const html = readFileSync(file, "utf8");
  const checks = [
    [`lang=\"${locale}\"`, `correct ${locale} html language`],
    ["rel=\"canonical\"", "canonical link"],
    ["hrefLang=\"en\"", "English hreflang"],
    ["hrefLang=\"fr\"", "French hreflang"],
    ["hrefLang=\"x-default\"", "x-default hreflang"],
    [frenchPath, "French alternate URL"],
  ];
  for (const [needle, label] of checks) {
    if (!html.includes(needle)) { console.error(`${file}: missing ${label}`); failures++; }
  }
}

for (const path of ["out/index.html", "out/sitemap.xml", "out/robots.txt", "out/fonts/NotoSans-Regular.woff", "out/fonts/NotoSans-Semibold.woff"]) {
  if (!existsSync(resolve(path))) { console.error(`Missing export artifact: ${path}`); failures++; }
}

if (failures) process.exit(1);
console.log(`Static export verified: ${pairs.length} primary localized routes, metadata, sitemap, robots, and embedded PDF font.`);
