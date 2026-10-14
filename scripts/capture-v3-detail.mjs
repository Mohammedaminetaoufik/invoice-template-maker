// Focused visual evidence for the locally served export; fictional data only.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
await mkdir("output/v3-1", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4137/en/?template=modern");
    for (const [field, label, value] of [["Business or full name", "Business or full name", "Example Studio"], ["Client or company name", "Client or company name", "Example Client"], ["Description (1)", "Description", "Design services"], ["Rate (1)", "Rate", "125.50"]]) {
      await page.getByRole("button", { name: field, exact: true }).first().click();
      await page.getByRole("dialog").getByLabel(label, { exact: true }).fill(value);
      await page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click();
    }
    const suffix = mobile ? "mobile" : "desktop";
    await page.locator(".document-canvas").screenshot({ path: `output/v3-1/document-detail-${suffix}.png` });
    if (mobile) {
      await page.locator(".mobile-field-navigation summary").click();
      await page.getByLabel("Invoice field", { exact: true }).selectOption({ label: "Rate (1)" });
    } else await page.getByRole("button", { name: "Rate (1)", exact: true }).click();
    await page.screenshot({ path: `output/v3-1/contextual-field-${suffix}.png` });
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "Change template", exact: true }).click();
    await page.getByRole("button", { name: "Preview template: Modern Professional", exact: true }).click();
    await page.screenshot({ path: `output/v3-1/template-comparison-${suffix}.png` });
    console.log(`${suffix}: horizontal overflow = ${await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)}`);
    await context.close();
  }
} finally { await browser.close(); }
