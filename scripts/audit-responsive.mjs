// Local visual QA against the exported site. All invoice data is fictional.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = "http://127.0.0.1:4137";
const widths = [320, 375, 390, 768, 1024, 1440];
const browser = await chromium.launch({ channel: "chrome" });
await mkdir("tmp/visual-audit", { recursive: true });
await mkdir("output/v3-1", { recursive: true });

try {
  for (const locale of ["en", "fr"]) {
    for (const width of widths) {
      const mobile = width <= 390;
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: mobile, hasTouch: mobile, acceptDownloads: true });
      const page = await context.newPage();
      const errors = [];
      const externalRequests = [];
      const scriptRequests = new Set();
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (/^https?:/.test(request.url()) && !request.url().startsWith(base)) externalRequests.push(request.url());
        if (request.url().includes("/_next/static/") && request.url().endsWith(".js")) scriptRequests.add(request.url());
      });
      const prefix = `tmp/visual-audit/${locale}-${width}`;
      const capture = async (state) => {
        await page.screenshot({ path: `${prefix}-${state}.png` });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (overflow > 0) throw new Error(`${locale} ${width} ${state}: ${overflow}px horizontal overflow`);
      };
      await page.goto(`${base}/${locale}/`);
      await page.evaluate(() => document.fonts.ready);
      const heroColor = await page.locator(".generator-intro .button:not(.button-ghost)").evaluate((element) => getComputedStyle(element).color);
      if (heroColor !== "rgb(255, 255, 255)") throw new Error(`${locale} ${width}: primary CTA text is ${heroColor}`);
      const headerFit = await page.evaluate(() => {
        const brand = document.querySelector(".site-header .brand");
        const label = brand?.querySelector("span:last-child");
        const actions = document.querySelector(".site-header .header-actions");
        return brand && label && actions && label.scrollWidth <= label.clientWidth + 1 && brand.getBoundingClientRect().right + 4 <= actions.getBoundingClientRect().left;
      });
      if (!headerFit) throw new Error(`${locale} ${width}: header brand is clipped or overlaps controls`);
      await capture("home");
      const initialScripts = scriptRequests.size;
      if (width === 390) await page.screenshot({ path: `output/v3-1/audit-after-${locale}-390-home.png` });
      await page.locator(".visual-template-grid").scrollIntoViewIfNeeded();
      await capture("gallery");
      await page.locator(".visual-template-card .template-thumbnail").first().click();
      await capture("template-preview");
      await page.keyboard.press("Escape");
      await page.locator(".visual-template-card .button").first().click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("itm-invoice-draft-v1") || "null")?.draft?.wizardStep === 2);
      await page.evaluate(() => {
        const key = "itm-invoice-draft-v1";
        const saved = JSON.parse(localStorage.getItem(key));
        saved.draft.businessName = "Example Studio";
        saved.draft.clientName = "Example Client";
        saved.draft.items[0].description = "Design service";
        saved.draft.items[0].rate = 125;
        localStorage.setItem(key, JSON.stringify(saved));
      });
      await page.reload();
      await page.locator(".document-canvas").scrollIntoViewIfNeeded();
      await capture("edit");
      if (mobile) {
        await page.locator(".mobile-field-navigation summary").click();
        await page.locator(".mobile-field-navigation select").selectOption("0");
        await capture("field-sheet");
        await page.keyboard.press("Escape");
      }
      await page.locator(".editor-toolbar button").nth(1).click();
      await page.locator(".advanced-panel").scrollIntoViewIfNeeded();
      await capture("advanced");
      await page.getByRole("button", { name: locale === "fr" ? "Vérifier la facture" : "Review invoice", exact: true }).click();
      await page.locator(".document-canvas").scrollIntoViewIfNeeded();
      await capture("review");
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: locale === "fr" ? "Télécharger ma facture PDF" : "Download Invoice PDF", exact: true }).click();
      await download;
      await page.locator("main[data-invoice-complete=true]").waitFor();
      await page.locator(".document-canvas").scrollIntoViewIfNeeded();
      await capture("result");
      if ([320, 1440].includes(width)) {
        await page.goto(`${base}/${locale}/${locale === "fr" ? "modeles-factures" : "invoice-templates"}/`);
        await capture("support-templates");
        await page.goto(`${base}/${locale}/${locale === "fr" ? "confidentialite" : "privacy"}/`);
        await capture("support-privacy");
        await page.locator(".footer").scrollIntoViewIfNeeded();
        await capture("footer");
      }
      if (errors.length) throw new Error(`${locale} ${width}: ${errors.join("; ")}`);
      if (externalRequests.length) throw new Error(`${locale} ${width}: unexpected external requests ${externalRequests.join(", ")}`);
      console.log(`${locale} ${width}px: homepage, gallery, preview, editing, advanced, review, result${mobile ? ", bottom sheet" : ""}; no overflow or page errors; JS files ${initialScripts} initial / ${scriptRequests.size} after PDF`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
