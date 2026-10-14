import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const pairs = [
  ["", ""],
  ["invoice-templates", "modeles-factures"],
  ["simple-invoice-template", "modele-facture-simple"],
  ["freelance-invoice", "facture-freelance"],
  ["invoice-with-logo", "facture-avec-logo"],
  ["how-to-make-an-invoice", "comment-faire-une-facture"],
  ["privacy", "confidentialite"],
  ["terms", "conditions"],
  ["about", "a-propos"],
  ["contact", "contact"],
];

let failures = 0;
const sitemapXml = readFileSync(resolve("out/sitemap.xml"), "utf8");
const titles = new Set();
for (const [englishSlug, frenchSlug] of pairs) {
for (const locale of ["en", "fr"]) {
  const slug = locale === "en" ? englishSlug : frenchSlug;
  const frenchPath = `fr/${frenchSlug ? frenchSlug + "/" : ""}`;
  const englishPath = `en/${englishSlug ? englishSlug + "/" : ""}`;
  const file = resolve("out", locale, slug, "index.html");
  if (!existsSync(file)) { console.error(`Missing static route: ${file}`); failures++; continue; }
  const html = readFileSync(file, "utf8");
  const checks = [
    [`lang=\"${locale}\"`, `correct ${locale} html language`],
    [`rel=\"canonical\" href=\"https://invoicetemplatemaker.com/${locale}/${slug ? slug + "/" : ""}\"`, "correct canonical link"],
    ["hrefLang=\"en\"", "English hreflang"],
    ["hrefLang=\"fr\"", "French hreflang"],
    ["hrefLang=\"x-default\"", "x-default hreflang"],
    [frenchPath, "French alternate URL"],
    [englishPath, "English alternate URL"],
    ["application/ld+json", "structured data"],
    ["<h1", "static primary heading"],
    ["name=\"description\"", "meta description"],
  ];
  for (const [needle, label] of checks) {
    if (!html.includes(needle)) { console.error(`${file}: missing ${label}`); failures++; }
  }
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title || titles.has(title)) { console.error(`${file}: missing or duplicate title`); failures++; }
  if (title) titles.add(title);
  if (/name="robots" content="[^"]*noindex/i.test(html)) { console.error(`${file}: localized canonical must be indexable`); failures++; }
  const path = `https://invoicetemplatemaker.com/${locale}/${slug ? slug + "/" : ""}`;
  if (!sitemapXml.includes(`<loc>${path}</loc>`)) { console.error(`${file}: missing canonical sitemap entry`); failures++; }
  for (const match of html.matchAll(/(?:src|href)="(\/_next\/[^"?]+)(?:\?[^" ]*)?"/g)) {
    const assetPath = resolve("out", decodeURIComponent(match[1].slice(1)));
    if (!existsSync(assetPath)) { console.error(`Missing referenced static asset: ${assetPath}`); failures++; }
  }
}
}

if (sitemapXml.includes("<lastmod>")) { console.error("Sitemap must not fabricate modification dates"); failures++; }

for (const path of ["out/index.html", "out/sitemap.xml", "out/robots.txt", "out/fonts/NotoSans-Regular.woff", "out/fonts/NotoSans-Semibold.woff"]) {
  if (!existsSync(resolve(path))) { console.error(`Missing export artifact: ${path}`); failures++; }
}

const rootHtml = readFileSync(resolve("out/index.html"), "utf8");
const rootChecks = [
  ["itm-root-locale-redirect", "root locale redirect script"],
  ["location.replace", "history-safe automatic redirect"],
  ["/en/", "crawlable English fallback link"],
  ["/fr/", "crawlable French fallback link"],
  ["rel=\"canonical\" href=\"https://invoicetemplatemaker.com/\"", "root canonical"],
  ["hrefLang=\"x-default\"", "root x-default hreflang"],
];
for (const [needle, label] of rootChecks) {
  if (!rootHtml.includes(needle)) { console.error(`out/index.html: missing ${label}`); failures++; }
}
if (rootHtml.includes("Choose Your Language") || rootHtml.includes("entry-choices")) {
  console.error("out/index.html: obsolete language-selection screen is still present");
  failures++;
}

for (const localizedFile of [resolve("out/en/index.html"), resolve("out/fr/index.html")]) {
  const html = readFileSync(localizedFile, "utf8");
  if (html.includes("itm-root-locale-redirect")) {
    console.error(`${localizedFile}: root redirect must not run on an explicit localized URL`);
    failures++;
  }
  for (const needle of ["invoice-templates", "ternyxa-discovery", "https://ternyxa.com", "faq-list"]) {
    if (!html.includes(needle)) { console.error(`${localizedFile}: missing crawlable V3 content: ${needle}`); failures++; }
  }
  if (!html.includes("Use this template") && !html.includes("Utiliser ce modèle")) { console.error(`${localizedFile}: template entry must be static HTML`); failures++; }
}

if (failures) process.exit(1);
console.log(`Static export verified: root locale routing, ${pairs.length * 2} localized routes, unique metadata, canonicals, hreflang, sitemap, robots, referenced static resources and embedded PDF fonts.`);
