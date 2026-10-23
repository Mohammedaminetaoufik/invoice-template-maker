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

function verifyMetadataDescriptionMinimum(html, file) {
  const minimum = 100;
  const values = [
    [html.match(/<meta name="description" content="([^"]*)"/)?.[1], "page description"],
    [html.match(/<meta property="og:description" content="([^"]*)"/)?.[1], "Open Graph description"],
  ];
  for (const [raw, label] of values) {
    if (!raw) { console.error(`${file}: missing ${label}`); failures++; continue; }
    const length = decodeMetadata(raw).length;
    if (length < minimum) { console.error(`${file}: ${label} is ${length} characters; expected at least ${minimum}`); failures++; }
  }
}

function routeMapPath(locale, target) {
  if (target === "article") return locale === "fr" ? "/fr/blog/comment-relancer-une-facture-impayee/" : "/en/blog/how-to-write-a-late-payment-reminder/";
  if (target === "reminder") return locale === "fr" ? "/fr/generateur-relance-facture-impayee/" : "/en/late-payment-reminder-generator/";
  return `/${locale}/`;
}

function verifyJsonLd(html, file) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (scripts.length !== 1) { console.error(`${file}: expected one JSON-LD block, found ${scripts.length}`); failures++; return; }
  try {
    const value = JSON.parse(decodeMetadata(scripts[0][1]));
    if (value?.["@context"] !== "https://schema.org") throw new Error("missing schema.org context");
  } catch (error) { console.error(`${file}: invalid JSON-LD (${error instanceof Error ? error.message : "parse error"})`); failures++; }
}

function verifyInternalLinks(html, file) {
  for (const match of html.matchAll(/href="(\/[^"#]*)/g)) {
    const href = decodeMetadata(match[1]);
    const pathname = href.split(/[?#]/)[0];
    if (!pathname || pathname.startsWith("//")) continue;
    const relative = decodeURIComponent(pathname.slice(1));
    const target = pathname.endsWith("/") || pathname === "/" ? resolve("out", relative, "index.html") : resolve("out", relative);
    if (!existsSync(target)) { console.error(`${file}: broken internal link ${href}`); failures++; }
  }
}

function htmlHead(html) {
  return html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
}

function sitemapEntry(url) {
  return sitemapXml.split("<url>").find((entry) => entry.includes(`<loc>${url}</loc>`)) ?? "";
}

function verifyLanguageGroup(html, file, key, englishUrl, frenchUrl) {
  const head = htmlHead(html);
  const canonical = file.includes(`${resolve("out", "en")}`) ? englishUrl : frenchUrl;
  const expected = { en: englishUrl, fr: frenchUrl, ...(key === "home" ? { "x-default": "https://invoicetemplatemaker.com/" } : {}) };
  const canonicalCount = head.split(`rel="canonical" href="${canonical}"`).length - 1;
  if (canonicalCount !== 1) { console.error(`${file}: expected one canonical ${canonical}, found ${canonicalCount}`); failures++; }
  for (const [language, url] of Object.entries(expected)) {
    const count = head.split(`rel="alternate" hrefLang="${language}" href="${url}"`).length - 1;
    if (count !== 1) { console.error(`${file}: expected one ${language} alternate ${url}, found ${count}`); failures++; }
  }
  const expectedLanguages = Object.keys(expected).sort().join(",");
  const actualLanguages = [...head.matchAll(/rel="alternate" hrefLang="([^"]+)"/g)].map((match) => match[1]).sort().join(",");
  if (actualLanguages !== expectedLanguages) { console.error(`${file}: hreflang set ${actualLanguages || "(empty)"}; expected ${expectedLanguages}`); failures++; }
  const entry = sitemapEntry(canonical);
  if (!entry) { console.error(`${file}: missing canonical sitemap entry`); failures++; return; }
  for (const [language, url] of Object.entries(expected)) {
    const needle = `hreflang="${language}" href="${url}"`;
    if (!entry.includes(needle)) { console.error(`${file}: sitemap entry missing ${language} alternate ${url}`); failures++; }
  }
  const sitemapLanguages = [...entry.matchAll(/hreflang="([^"]+)"/g)].map((match) => match[1]).sort().join(",");
  if (sitemapLanguages !== expectedLanguages) { console.error(`${file}: sitemap hreflang set ${sitemapLanguages || "(empty)"}; expected ${expectedLanguages}`); failures++; }
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

const pageKeyByEnglishSlug = new Map([
  ["", "home"], ["invoice-templates", "templates"], ["simple-invoice-template", "simple"], ["freelance-invoice", "freelance"],
  ["invoice-with-logo", "logo"], ["how-to-make-an-invoice", "guide"], ["late-payment-reminder-generator", "reminder"], ["blog", "blog"],
  ["blog/how-to-write-a-late-payment-reminder", "reminderArticle"], ["privacy", "privacy"], ["terms", "terms"], ["about", "about"], ["contact", "contact"],
]);

let failures = 0;
const sitemapXml = readFileSync(resolve("out/sitemap.xml"), "utf8");
const titles = new Set();
const socialImages = new Set();
for (const [englishSlug, frenchSlug] of pairs) {
const key = pageKeyByEnglishSlug.get(englishSlug);
for (const locale of ["en", "fr"]) {
  const slug = locale === "en" ? englishSlug : frenchSlug;
  const frenchPath = `fr/${frenchSlug ? frenchSlug + "/" : ""}`;
  const englishPath = `en/${englishSlug ? englishSlug + "/" : ""}`;
  const file = resolve("out", locale, slug, "index.html");
  if (!existsSync(file)) { console.error(`Missing static route: ${file}`); failures++; continue; }
  const html = readFileSync(file, "utf8");
  const socialImageName = `invoice-maker-${key}-${locale}-v3.jpg`;
  const socialImageUrl = `https://invoicetemplatemaker.com/og/${socialImageName}`;
  const checks = [
    [`lang=\"${locale}\"`, `correct ${locale} html language`],
    ["application/ld+json", "structured data"],
    ["<h1", "static primary heading"],
    ["name=\"description\"", "meta description"],
    [`property=\"og:locale\" content=\"${locale === "fr" ? "fr_FR" : "en_US"}\"`, "localized Open Graph locale"],
    [`property=\"og:image\" content=\"${socialImageUrl}\"`, "page-specific Open Graph image"],
    ["property=\"og:image:width\" content=\"1200\"", "Open Graph image width"],
    ["property=\"og:image:height\" content=\"630\"", "Open Graph image height"],
    ["property=\"og:image:type\" content=\"image/jpeg\"", "Open Graph image MIME type"],
    ["property=\"og:image:alt\"", "Open Graph image alt text"],
    ["name=\"twitter:card\" content=\"summary_large_image\"", "large Twitter card"],
    [`name=\"twitter:image\" content=\"${socialImageUrl}\"`, "page-specific Twitter image"],
    ["name=\"twitter:image:alt\"", "Twitter image alt text"],
    ["src=\"/icon.svg\"", "shared brand mark"],
    ["rel=\"icon\" href=\"/icons/icon-192.png\"", "stable Google-compatible PNG favicon"],
    ["rel=\"manifest\"", "installable app manifest"],
    ["rel=\"apple-touch-icon\"", "Apple home-screen icon"],
  ];
  for (const [needle, label] of checks) {
    if (!html.includes(needle)) { console.error(`${file}: missing ${label}`); failures++; }
  }
  if (socialImages.has(socialImageUrl)) { console.error(`${file}: reuses social image ${socialImageUrl}`); failures++; }
  socialImages.add(socialImageUrl);
  const socialImageFile = resolve("out", "og", socialImageName);
  if (!existsSync(socialImageFile)) { console.error(`${file}: missing social image asset ${socialImageFile}`); failures++; }
  else {
    const dimensions = jpegDimensions(socialImageFile);
    if (dimensions?.width !== 1200 || dimensions?.height !== 630) { console.error(`${socialImageFile}: expected a 1200x630 JPEG`); failures++; }
    if (statSync(socialImageFile).size >= 500_000) { console.error(`${socialImageFile}: social image must be under 500 KB`); failures++; }
  }
  verifyLanguageGroup(html, file, key, `https://invoicetemplatemaker.com/${englishPath}`, `https://invoicetemplatemaker.com/${frenchPath}`);
  verifyUniqueSocialTags(html, file);
  verifyMetadataDescriptionMinimum(html, file);
  verifyJsonLd(html, file);
  verifyInternalLinks(html, file);
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) { console.error(`${file}: expected exactly one H1, found ${h1Count}`); failures++; }
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title || titles.has(title)) { console.error(`${file}: missing or duplicate title`); failures++; }
  if (title) titles.add(title);
  if (/name="robots" content="[^"]*noindex/i.test(html)) { console.error(`${file}: localized canonical must be indexable`); failures++; }
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
  if (englishSlug === "how-to-make-an-invoice") {
    for (const needle of ["quick-answer", "annotated-example", "invoice-annotations", "template=freelance", routeMapPath(locale, "reminder")]) {
      if (!html.includes(needle)) { console.error(`${file}: invoice guide missing ${needle}`); failures++; }
    }
  }
  if (englishSlug === "simple-invoice-template") {
    for (const needle of ["template-feature-preview", "template=minimal", "compact-seo-content", routeMapPath(locale, "reminder")]) {
      if (!html.includes(needle)) { console.error(`${file}: simple template page missing ${needle}`); failures++; }
    }
  }
  if (englishSlug === "invoice-with-logo") {
    for (const needle of ["logo-feature-preview", "template=modern", "/icon.svg", "compact-seo-content"]) {
      if (!html.includes(needle)) { console.error(`${file}: logo invoice page missing ${needle}`); failures++; }
    }
  }
}
}

if (socialImages.size !== pairs.length * 2) {
  console.error(`Expected ${pairs.length * 2} unique localized social images, found ${socialImages.size}`);
  failures++;
}

if (sitemapXml.includes("<lastmod>")) { console.error("Sitemap must not fabricate modification dates"); failures++; }

for (const path of ["out/index.html", "out/icon.svg", "out/apple-icon.png", "out/manifest.webmanifest", "out/sw.js", "out/_headers", "out/sitemap.xml", "out/robots.txt", "out/fonts/NotoSans-Regular.woff", "out/fonts/NotoSans-Semibold.woff", "out/og/invoice-maker-root-v3.jpg"]) {
  if (!existsSync(resolve(path))) { console.error(`Missing export artifact: ${path}`); failures++; }
}

const headersFile = readFileSync(resolve("out/_headers"), "utf8").replaceAll("\r\n", "\n");
const edgeHtmlCachePolicy = "Cloudflare-CDN-Cache-Control: public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800";
for (const routePattern of ["/", "/en/*", "/fr/*"]) {
  if (!headersFile.includes(`${routePattern}\n  ${edgeHtmlCachePolicy}`)) {
    console.error(`out/_headers: missing edge HTML cache policy for ${routePattern}`);
    failures++;
  }
}
if (!headersFile.includes("/sw.js\n  Cache-Control: no-cache, no-store, must-revalidate")) {
  console.error("out/_headers: service worker must remain uncached");
  failures++;
}

const rootHtml = readFileSync(resolve("out/index.html"), "utf8");
const rootChecks = [
  ["itm-root-locale-redirect", "root locale redirect script"],
  ["location.replace", "history-safe automatic redirect"],
  ["lang=\"en\"", "valid root HTML language"],
  ["lang=\"fr\"", "French fallback language annotation"],
  ["/en/", "crawlable English fallback link"],
  ["/fr/", "crawlable French fallback link"],
  ["root-fallback-actions", "language-neutral fallback choices"],
  ["property=\"og:locale\" content=\"en_US\"", "root Open Graph locale"],
  ["property=\"og:locale:alternate\" content=\"fr_FR\"", "root alternate Open Graph locale"],
  ["property=\"og:image\" content=\"https://invoicetemplatemaker.com/og/invoice-maker-root-v3.jpg\"", "root Open Graph image"],
  ["property=\"og:image:type\" content=\"image/jpeg\"", "root Open Graph image MIME type"],
  ["name=\"twitter:card\" content=\"summary_large_image\"", "root large Twitter card"],
  ["name=\"twitter:image\" content=\"https://invoicetemplatemaker.com/og/invoice-maker-root-v3.jpg\"", "root Twitter image"],
  ["src=\"/icon.svg\"", "root brand mark"],
  ["rel=\"icon\" href=\"/icons/icon-192.png\"", "root stable Google-compatible PNG favicon"],
  ["rel=\"manifest\"", "root installable app manifest"],
  ["rel=\"apple-touch-icon\"", "root Apple home-screen icon"],
];
for (const [needle, label] of rootChecks) {
  if (!rootHtml.includes(needle)) { console.error(`out/index.html: missing ${label}`); failures++; }
}
const rootSocialImage = resolve("out", "og", "invoice-maker-root-v3.jpg");
if (existsSync(rootSocialImage)) {
  const dimensions = jpegDimensions(rootSocialImage);
  if (dimensions?.width !== 1200 || dimensions?.height !== 630) { console.error(`${rootSocialImage}: expected a 1200x630 JPEG`); failures++; }
  if (statSync(rootSocialImage).size >= 500_000) { console.error(`${rootSocialImage}: social image must be under 500 KB`); failures++; }
}
const rootHead = htmlHead(rootHtml);
const rootAlternates = { en: "https://invoicetemplatemaker.com/en/", fr: "https://invoicetemplatemaker.com/fr/", "x-default": "https://invoicetemplatemaker.com/" };
if (rootHead.split('rel="canonical" href="https://invoicetemplatemaker.com/"').length - 1 !== 1) {
  console.error("out/index.html: expected exactly one self-referencing root canonical"); failures++;
}
for (const [language, url] of Object.entries(rootAlternates)) {
  if (rootHead.split(`rel="alternate" hrefLang="${language}" href="${url}"`).length - 1 !== 1) {
    console.error(`out/index.html: missing root ${language} alternate ${url}`); failures++;
  }
}
const rootEntry = sitemapEntry("https://invoicetemplatemaker.com/");
for (const [language, url] of Object.entries(rootAlternates)) {
  if (!rootEntry.includes(`hreflang="${language}" href="${url}"`)) {
    console.error(`sitemap root entry missing ${language} alternate ${url}`); failures++;
  }
}
verifyUniqueSocialTags(rootHtml, "out/index.html");
verifyMetadataDescriptionMinimum(rootHtml, "out/index.html");
verifyJsonLd(rootHtml, "out/index.html");
verifyInternalLinks(rootHtml, "out/index.html");
if ((rootHtml.match(/<h1(?:\s|>)/g) ?? []).length !== 1) { console.error("out/index.html: expected exactly one H1"); failures++; }
verifyHomeMetadataLengths(rootHtml, "out/index.html");
if (rootHtml.includes("Create a professional invoice online.") || rootHtml.includes("Free Invoice Generator | InvoiceTemplateMaker")) {
  console.error("out/index.html: root fallback still duplicates the English homepage");
  failures++;
}

for (const localizedFile of [resolve("out/en/index.html"), resolve("out/fr/index.html")]) {
  const html = readFileSync(localizedFile, "utf8");
  verifyHomeMetadataLengths(html, localizedFile);
  verifyInternalLinks(html, localizedFile);
  if (html.includes("itm-root-locale-redirect")) {
    console.error(`${localizedFile}: root redirect must not run on an explicit localized URL`);
    failures++;
  }
  for (const needle of ["invoice-templates", "ternyxa-discovery", "https://ternyxa.com", "faq-list"]) {
    if (!html.includes(needle)) { console.error(`${localizedFile}: missing crawlable V3 content: ${needle}`); failures++; }
  }
  if (!html.includes("Use this template") && !html.includes("Utiliser ce modèle")) { console.error(`${localizedFile}: template entry must be static HTML`); failures++; }
}
if (!readFileSync(resolve("out/fr/index.html"), "utf8").includes("french-home-growth")) { console.error("out/fr/index.html: missing French three-step supporting content"); failures++; }

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
