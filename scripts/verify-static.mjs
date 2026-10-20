import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

function jpegDimensions(file) {
  const bytes = readFileSync(file);
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let offset = 2;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset++; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) break;
    const segmentLength = bytes.readUInt16BE(offset);
    if (startOfFrame.has(marker)) return { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
    offset += segmentLength;
  }
  return undefined;
}

function verifyUniqueSocialTags(html, file) {
  for (const needle of ['<meta property="og:title"', '<meta property="og:description"', '<meta property="og:image"', '<meta name="twitter:card"', '<meta name="twitter:title"', '<meta name="twitter:description"', '<meta name="twitter:image"']) {
    const count = html.split(needle).length - 1;
    if (count !== 1) { console.error(`${file}: expected one ${needle}, found ${count}`); failures++; }
  }
}

function decodeMetadata(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function verifyHomeMetadataLengths(html, file) {
  const values = [
    [html.match(/<title>(.*?)<\/title>/)?.[1], 60, "page title"],
    [html.match(/<meta property="og:title" content="([^"]*)"/)?.[1], 60, "Open Graph title"],
    [html.match(/<meta name="description" content="([^"]*)"/)?.[1], 125, "page description"],
    [html.match(/<meta property="og:description" content="([^"]*)"/)?.[1], 125, "Open Graph description"],
  ];
  for (const [raw, maximum, label] of values) {
    if (!raw) { console.error(`${file}: missing ${label}`); failures++; continue; }
    const length = decodeMetadata(raw).length;
    if (length > maximum) { console.error(`${file}: ${label} is ${length} characters; expected at most ${maximum}`); failures++; }
  }
}

function routeMapPath(locale, target) {
  if (target === "article") return locale === "fr" ? "/fr/blog/comment-relancer-une-facture-impayee/" : "/en/blog/how-to-write-a-late-payment-reminder/";
  if (target === "reminder") return locale === "fr" ? "/fr/generateur-relance-facture-impayee/" : "/en/late-payment-reminder-generator/";
  return `/${locale}/`;
}

const pairs = [
  ["", ""],
  ["invoice-templates", "modeles-factures"],
  ["simple-invoice-template", "modele-facture-simple"],
  ["freelance-invoice", "facture-freelance"],
  ["invoice-with-logo", "facture-avec-logo"],
  ["how-to-make-an-invoice", "comment-faire-une-facture"],
  ["late-payment-reminder-generator", "generateur-relance-facture-impayee"],
  ["blog", "blog"],
  ["blog/how-to-write-a-late-payment-reminder", "blog/comment-relancer-une-facture-impayee"],
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
    [`property=\"og:locale\" content=\"${locale === "fr" ? "fr_FR" : "en_US"}\"`, "localized Open Graph locale"],
    [`property=\"og:image\" content=\"https://invoicetemplatemaker.com/og/invoice-maker-${locale}.jpg\"`, "localized Open Graph image"],
    ["property=\"og:image:width\" content=\"1200\"", "Open Graph image width"],
    ["property=\"og:image:height\" content=\"630\"", "Open Graph image height"],
    ["property=\"og:image:alt\"", "Open Graph image alt text"],
    ["name=\"twitter:card\" content=\"summary_large_image\"", "large Twitter card"],
    [`name=\"twitter:image\" content=\"https://invoicetemplatemaker.com/og/invoice-maker-${locale}.jpg\"`, "localized Twitter image"],
    ["name=\"twitter:image:alt\"", "Twitter image alt text"],
    ["src=\"/icon.svg\"", "shared brand mark"],
    ["rel=\"icon\"", "browser icon"],
    ["rel=\"manifest\"", "installable app manifest"],
    ["rel=\"apple-touch-icon\"", "Apple home-screen icon"],
  ];
  for (const [needle, label] of checks) {
    if (!html.includes(needle)) { console.error(`${file}: missing ${label}`); failures++; }
  }
  verifyUniqueSocialTags(html, file);
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
  if (englishSlug === "late-payment-reminder-generator") {
    for (const needle of ["reminder-workspace", '"SoftwareApplication"', '"BreadcrumbList"', routeMapPath(locale, "article")]) {
      if (!html.includes(needle)) { console.error(`${file}: reminder page missing ${needle}`); failures++; }
    }
  }
  if (englishSlug === "blog") {
    for (const needle of ["article-card", '"CollectionPage"', routeMapPath(locale, "article")]) {
      if (!html.includes(needle)) { console.error(`${file}: blog index missing ${needle}`); failures++; }
    }
  }
  if (englishSlug === "blog/how-to-write-a-late-payment-reminder") {
    for (const needle of ["article-body", '"BlogPosting"', '"BreadcrumbList"', routeMapPath(locale, "reminder"), routeMapPath(locale, "home")]) {
      if (!html.includes(needle)) { console.error(`${file}: article missing ${needle}`); failures++; }
    }
  }
}
}

if (sitemapXml.includes("<lastmod>")) { console.error("Sitemap must not fabricate modification dates"); failures++; }

for (const path of ["out/index.html", "out/icon.svg", "out/apple-icon.png", "out/manifest.webmanifest", "out/sw.js", "out/_headers", "out/sitemap.xml", "out/robots.txt", "out/fonts/NotoSans-Regular.woff", "out/fonts/NotoSans-Semibold.woff", "out/og/invoice-maker-en.jpg", "out/og/invoice-maker-fr.jpg"]) {
  if (!existsSync(resolve(path))) { console.error(`Missing export artifact: ${path}`); failures++; }
}

for (const locale of ["en", "fr"]) {
  const file = resolve(`out/og/invoice-maker-${locale}.jpg`);
  if (!existsSync(file)) continue;
  const dimensions = jpegDimensions(file);
  if (dimensions?.width !== 1200 || dimensions?.height !== 630) { console.error(`${file}: expected a 1200x630 JPEG`); failures++; }
  if (statSync(file).size >= 500_000) { console.error(`${file}: social image must be under 500 KB`); failures++; }
}

const rootHtml = readFileSync(resolve("out/index.html"), "utf8");
const rootChecks = [
  ["itm-root-locale-redirect", "root locale redirect script"],
  ["location.replace", "history-safe automatic redirect"],
  ["/en/", "crawlable English fallback link"],
  ["/fr/", "crawlable French fallback link"],
  ["rel=\"canonical\" href=\"https://invoicetemplatemaker.com/\"", "root canonical"],
  ["hrefLang=\"x-default\"", "root x-default hreflang"],
  ["property=\"og:locale\" content=\"en_US\"", "root Open Graph locale"],
  ["property=\"og:locale:alternate\" content=\"fr_FR\"", "root alternate Open Graph locale"],
  ["property=\"og:image\" content=\"https://invoicetemplatemaker.com/og/invoice-maker-en.jpg\"", "root Open Graph image"],
  ["name=\"twitter:card\" content=\"summary_large_image\"", "root large Twitter card"],
  ["src=\"/icon.svg\"", "root brand mark"],
  ["rel=\"icon\"", "root browser icon"],
  ["rel=\"manifest\"", "root installable app manifest"],
  ["rel=\"apple-touch-icon\"", "root Apple home-screen icon"],
];
for (const [needle, label] of rootChecks) {
  if (!rootHtml.includes(needle)) { console.error(`out/index.html: missing ${label}`); failures++; }
}
verifyUniqueSocialTags(rootHtml, "out/index.html");
verifyHomeMetadataLengths(rootHtml, "out/index.html");
if (rootHtml.includes("Choose Your Language") || rootHtml.includes("entry-choices")) {
  console.error("out/index.html: obsolete language-selection screen is still present");
  failures++;
}

for (const localizedFile of [resolve("out/en/index.html"), resolve("out/fr/index.html")]) {
  const html = readFileSync(localizedFile, "utf8");
  verifyHomeMetadataLengths(html, localizedFile);
  if (html.includes("itm-root-locale-redirect")) {
    console.error(`${localizedFile}: root redirect must not run on an explicit localized URL`);
    failures++;
  }
  for (const needle of ["invoice-templates", "ternyxa-discovery", "https://ternyxa.com", "faq-list"]) {
    if (!html.includes(needle)) { console.error(`${localizedFile}: missing crawlable V3 content: ${needle}`); failures++; }
  }
  if (!html.includes("Use this template") && !html.includes("Utiliser ce modèle")) { console.error(`${localizedFile}: template entry must be static HTML`); failures++; }
}

if (existsSync(resolve("out/manifest.webmanifest"))) {
  const manifest = JSON.parse(readFileSync(resolve("out/manifest.webmanifest"), "utf8"));
  if (manifest.id !== "/" || manifest.start_url !== "/" || manifest.scope !== "/" || manifest.display !== "standalone") {
    console.error("PWA manifest has an invalid identity, start URL, scope or display mode"); failures++;
  }
  for (const [size, purpose] of [[192, undefined], [512, undefined], [512, "maskable"]]) {
    const icon = manifest.icons?.find((candidate) => candidate.sizes === `${size}x${size}` && candidate.purpose === purpose);
    if (!icon) { console.error(`PWA manifest missing ${size}px${purpose ? ` ${purpose}` : ""} icon`); failures++; continue; }
    const iconFile = resolve("out", icon.src.slice(1));
    if (!existsSync(iconFile)) { console.error(`Missing PWA icon: ${iconFile}`); failures++; continue; }
    const png = readFileSync(iconFile);
    if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || png.readUInt32BE(16) !== size || png.readUInt32BE(20) !== size) {
      console.error(`PWA icon has wrong format or dimensions: ${iconFile}`); failures++;
    }
  }
}

if (existsSync(resolve("out/sw.js"))) {
  const worker = readFileSync(resolve("out/sw.js"), "utf8");
  for (const needle of ["itm-static-", '"/"', '"/en/"', '"/fr/"', '"/manifest.webmanifest"', '"/fonts/NotoSans-Regular.woff"', '"/_next/static/']) {
    if (!worker.includes(needle)) { console.error(`Service worker missing offline resource: ${needle}`); failures++; }
  }
  if (worker.includes("__BUILD_ID__") || worker.includes("__PRECACHE_URLS__")) { console.error("Service worker still contains template placeholders"); failures++; }
}

if (failures) process.exit(1);
console.log(`Static export verified: root locale routing, ${pairs.length * 2} localized routes, unique metadata, canonicals, hreflang, sitemap, robots, referenced static resources and embedded PDF fonts.`);
