import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(root, "public/og");

const [background, regularFont, semiboldFont, brandIcon] = await Promise.all([
  readFile(resolve(root, "scripts/assets/og-background.jpg")),
  readFile(resolve(root, "public/fonts/NotoSans-Regular.woff")),
  readFile(resolve(root, "public/fonts/NotoSans-Semibold.woff")),
  readFile(resolve(root, "app/icon.svg"), "utf8"),
]);

const dataUrl = (mime, bytes) => `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
const backgroundUrl = dataUrl("image/jpeg", background);
const regularFontUrl = dataUrl("font/woff", regularFont);
const semiboldFontUrl = dataUrl("font/woff", semiboldFont);
const iconUrl = dataUrl("image/svg+xml", Buffer.from(brandIcon));

const locales = {
  en: {
    headline: "Professional Invoices.<br>Made Simple.",
    supporting: "Create <span>•</span> Customize <span>•</span> Download",
    benefits: ["100% Free", "No Signup", "PDF Download"],
    builtBy: "Built by",
    imageAlt: "InvoiceTemplateMaker — Professional invoices made simple",
  },
  fr: {
    headline: "Des factures professionnelles,<br>en toute simplicité.",
    supporting: "Créez <span>•</span> Personnalisez <span>•</span> Téléchargez",
    benefits: ["100 % gratuit", "Sans inscription", "PDF à télécharger"],
    builtBy: "Créé par",
    imageAlt: "InvoiceTemplateMaker — Des factures professionnelles, en toute simplicité",
  },
};

function invoiceCard(kind, className, badge) {
  const rows = [72, 46, 61];
  return `
    <article class="invoice-card ${kind} ${className}" aria-label="${badge} invoice template preview">
      <div class="paper-edge"></div>
      <header class="invoice-header">
        <div class="invoice-logo"><i></i><i></i></div>
        <div class="invoice-title">INVOICE</div>
      </header>
      <section class="invoice-addresses">
        <div><small>FROM</small><b></b><i></i><i></i></div>
        <div><small>BILL TO</small><b></b><i></i><i></i></div>
      </section>
      <div class="invoice-meta"><span>No. 001</span><span>DATE</span></div>
      <section class="invoice-table">
        <div class="invoice-table-head"><span>DESCRIPTION</span><span>QTY</span><span>AMOUNT</span></div>
        ${rows.map((width, index) => `<div class="invoice-row"><span style="width:${width}%"></span><span></span><span style="width:${42 + index * 9}%"></span></div>`).join("")}
      </section>
      <section class="invoice-total"><span></span><strong>TOTAL</strong><b></b></section>
      <footer class="invoice-footer"><span></span><span></span></footer>
      <div class="template-label">${badge}</div>
    </article>`;
}

function document(locale) {
  const copy = locales[locale];
  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${copy.imageAlt}</title>
  <style>
    @font-face { font-family: "Noto Sans"; src: url("${regularFontUrl}") format("woff"); font-weight: 400; }
    @font-face { font-family: "Noto Sans"; src: url("${semiboldFontUrl}") format("woff"); font-weight: 600 800; }
    * { box-sizing: border-box; }
    html, body { width: 1200px; height: 630px; margin: 0; overflow: hidden; }
    body { font-family: "Noto Sans", Arial, sans-serif; color: #17201f; background: #f7f4ee url("${backgroundUrl}") center/cover no-repeat; }
    .canvas { position: relative; width: 1200px; height: 630px; overflow: hidden; }
    .canvas::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 0 1px rgba(24,76,73,.08); }
    .copy { position: absolute; z-index: 4; left: 58px; top: 47px; width: 550px; }
    .brand { display: flex; align-items: center; gap: 13px; color: #184c49; font-size: 20px; font-weight: 800; letter-spacing: -.02em; }
    .brand img { width: 42px; height: 42px; filter: drop-shadow(0 7px 14px rgba(24,76,73,.16)); }
    .eyebrow { display: inline-flex; align-items: center; gap: 8px; margin-top: 45px; color: #a43b17; font-size: 12px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    .eyebrow::before { content: ""; width: 25px; height: 3px; border-radius: 3px; background: #b84722; }
    h1 { width: ${locale === "fr" ? "570px" : "510px"}; margin: 13px 0 17px; color: #102f2d; font: 700 ${locale === "fr" ? "42px/1.08" : "49px/1.04"} Georgia, serif; letter-spacing: -.035em; }
    .supporting { margin: 0; color: #4f5d59; font-size: ${locale === "fr" ? "17px" : "18px"}; font-weight: 600; letter-spacing: .005em; }
    .supporting span { padding: 0 7px; color: #b84722; }
    .benefits { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 27px; }
    .benefit { display: flex; align-items: center; gap: 7px; min-height: 31px; padding: 0 11px; border: 1px solid rgba(24,76,73,.16); border-radius: 999px; color: #184c49; background: rgba(255,255,255,.74); font-size: 11.5px; font-weight: 700; box-shadow: 0 6px 18px rgba(25,40,37,.045); }
    .benefit::before { content: "✓"; display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; color: white; background: #184c49; font-size: 10px; }
    .built-by { position: absolute; z-index: 5; left: 58px; bottom: 41px; display: flex; align-items: baseline; gap: 7px; color: #65706c; font-size: 12px; }
    .built-by strong { color: #102f2d; font-size: 17px; letter-spacing: .02em; }
    .built-by::after { content: ""; width: 32px; height: 1px; margin-left: 4px; background: #f4a282; }
    .product-stage { position: absolute; z-index: 3; top: 0; right: 0; width: 650px; height: 630px; }
    .stage-glow { position: absolute; right: 48px; top: 45px; width: 485px; height: 525px; border-radius: 50%; background: radial-gradient(circle, rgba(244,162,130,.19), rgba(24,76,73,0) 66%); filter: blur(4px); }
    .invoice-card { position: absolute; width: 226px; height: 324px; padding: 24px 20px 18px; color: #293633; background: #fff; border: 1px solid rgba(23,32,31,.09); border-radius: 4px; box-shadow: 0 25px 55px rgba(7,35,33,.24), 0 5px 16px rgba(7,35,33,.12); overflow: hidden; }
    .invoice-card.back { left: 81px; top: 126px; transform: rotate(-9deg); opacity: .96; }
    .invoice-card.middle { left: 254px; top: 80px; transform: rotate(5.5deg); }
    .invoice-card.front { left: 185px; top: 235px; transform: rotate(-1.5deg); box-shadow: 0 29px 68px rgba(7,35,33,.29), 0 6px 19px rgba(7,35,33,.15); }
    .paper-edge { position: absolute; left: 0; top: 0; width: 100%; height: 6px; background: #b84722; }
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; min-height: 46px; }
    .invoice-logo { width: 32px; height: 32px; border: 1px solid #d7dfdc; border-radius: 50%; display: grid; place-content: center; gap: 3px; }
    .invoice-logo i { display: block; width: 14px; height: 2px; border-radius: 2px; background: #184c49; }
    .invoice-logo i:last-child { width: 9px; background: #b84722; }
    .invoice-title { color: #b84722; font: 700 22px/1 Georgia, serif; letter-spacing: -.03em; }
    .invoice-addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 19px; margin-top: 19px; }
    .invoice-addresses small { display: block; margin-bottom: 5px; color: #8b9692; font-size: 5px; font-weight: 700; letter-spacing: .12em; }
    .invoice-addresses b, .invoice-addresses i { display: block; height: 3px; margin-bottom: 4px; border-radius: 3px; background: #596763; }
    .invoice-addresses i { width: 83%; background: #dce2df; }
    .invoice-addresses i:last-child { width: 61%; }
    .invoice-meta { display: flex; justify-content: space-between; margin-top: 17px; padding: 7px 8px; color: #7a8682; background: #f4f6f4; font-size: 5px; font-weight: 700; }
    .invoice-table { margin-top: 14px; }
    .invoice-table-head, .invoice-row { display: grid; grid-template-columns: 1fr 30px 48px; align-items: center; gap: 8px; }
    .invoice-table-head { height: 18px; padding: 0 7px; color: white; background: #184c49; font-size: 4.5px; font-weight: 700; letter-spacing: .06em; }
    .invoice-row { min-height: 27px; padding: 0 7px; border-bottom: 1px solid #e5e9e7; }
    .invoice-row > span { display: block; height: 3px; border-radius: 2px; background: #ccd4d1; }
    .invoice-row > span:nth-child(2) { width: 25%; justify-self: center; background: #9eaaa6; }
    .invoice-row > span:last-child { justify-self: end; background: #85938e; }
    .invoice-total { display: grid; grid-template-columns: 1fr auto 41px; align-items: center; gap: 8px; margin-top: 13px; font-size: 5px; color: #6b7874; }
    .invoice-total > span { height: 1px; background: #e0e5e3; }
    .invoice-total > b { height: 6px; border-radius: 2px; background: #b84722; }
    .invoice-footer { position: absolute; left: 20px; right: 20px; bottom: 26px; display: flex; gap: 6px; border-top: 1px solid #e4e8e6; padding-top: 8px; }
    .invoice-footer span { display: block; width: 38%; height: 3px; background: #d7ddda; border-radius: 2px; }
    .invoice-footer span:last-child { width: 22%; }
    .template-label { position: absolute; right: 13px; bottom: 10px; color: #b3bbb8; font-size: 4px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .minimal .paper-edge { height: 2px; background: #cbd2cf; }
    .minimal .invoice-title { color: #293633; font-size: 18px; }
    .minimal .invoice-logo { border-radius: 3px; }
    .minimal .invoice-table-head { color: #293633; background: #eff2f0; border-bottom: 1px solid #b9c2be; }
    .minimal .invoice-total > b { background: #52615c; }
    .corporate { padding-top: 62px; }
    .corporate .paper-edge { height: 45px; background: #184c49; }
    .corporate .invoice-header { position: absolute; top: 14px; left: 20px; right: 20px; min-height: 28px; align-items: center; }
    .corporate .invoice-title { color: white; font: 700 16px/1 "Noto Sans", sans-serif; letter-spacing: .08em; }
    .corporate .invoice-logo { width: 24px; height: 24px; border-color: rgba(255,255,255,.45); }
    .corporate .invoice-logo i { background: white; }
    .corporate .invoice-logo i:last-child { background: #f4a282; }
    .corporate .invoice-table-head { background: #b84722; }
    .corporate .invoice-total > b { background: #184c49; }
  </style>
</head>
<body>
  <main class="canvas" role="img" aria-label="${copy.imageAlt}">
    <section class="copy">
      <div class="brand"><img src="${iconUrl}" alt=""><span>InvoiceTemplateMaker</span></div>
      <div class="eyebrow">Free invoice generator</div>
      <h1>${copy.headline}</h1>
      <p class="supporting">${copy.supporting}</p>
      <div class="benefits">${copy.benefits.map((benefit) => `<div class="benefit">${benefit}</div>`).join("")}</div>
    </section>
    <div class="built-by"><span>${copy.builtBy}</span><strong>Ternyxa</strong></div>
    <section class="product-stage" aria-hidden="true">
      <div class="stage-glow"></div>
      ${invoiceCard("minimal", "back", "Minimal")}
      ${invoiceCard("corporate", "middle", "Corporate")}
      ${invoiceCard("modern", "front", "Modern")}
    </section>
  </main>
</body>
</html>`;
}

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of Object.keys(locales)) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(document(locale), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: resolve(outputDirectory, `invoice-maker-${locale}.jpg`),
      type: "jpeg",
      quality: 89,
      fullPage: false,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log("Generated public/og/invoice-maker-en.jpg and public/og/invoice-maker-fr.jpg (1200x630).");
