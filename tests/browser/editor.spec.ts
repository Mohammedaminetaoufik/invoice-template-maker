import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { getDictionary } from "../../lib/i18n";
import { templateIds } from "../../lib/templates";
import { createDefaultDraft } from "../../lib/invoice";
const storageKey = "itm-invoice-draft-v1";
async function draft(page: Page) { return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).draft, storageKey); }
async function edit(page: Page, button: string, label: string, value: string) {
  await page.getByRole("button", { name: button, exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel(label, { exact: true })).toBeFocused();
  await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
}
async function screenshot(page: Page, name: string, project: string) {
  await mkdir("output/v3-1", { recursive: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: `output/v3-1/${name}-${project}.png`, fullPage: true });
}
test("template-first editor, validation, rows, live amounts and correction after a real download", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free Invoice Generator — Create Professional Invoices Online");
  await screenshot(page, "homepage-en", info.project.name);
  await page.getByRole("button", { name: "Use this template: Modern Professional", exact: true }).click();
  await page.getByRole("button", { name: "Review invoice", exact: true }).click();
  await expect(page.getByRole("dialog").getByLabel("Business or full name", { exact: true })).toBeFocused();
  await page.getByRole("dialog").getByLabel("Business or full name", { exact: true }).fill("Élan Example Studio");
  await page.getByRole("dialog").getByRole("button", { name: "Done" }).click();
  await edit(page, "Client or company name", "Client or company name", "Example Client");
  await edit(page, "Description (1)", "Description", "Website design");
  await edit(page, "Rate (1)", "Rate", "125.50");
  await edit(page, "Qty (1)", "Qty", "2");
  await page.getByRole("button", { name: "Add line item", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Description", { exact: true }).fill("Remove this row");
  await page.getByRole("dialog").getByRole("button", { name: "Remove item" }).click();
  expect((await draft(page)).items).toHaveLength(1);
  await expect(page.locator(".document-actions")).toContainText("251.00");
  await screenshot(page, "editing-en", info.project.name);
  await page.getByRole("button", { name: "Review invoice", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your Invoice Is Ready" })).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Invoice PDF", exact: true }).click();
  const download = await downloadEvent;
  await mkdir("tmp/pdfs", { recursive: true });
  await download.saveAs(`tmp/pdfs/v3-1-${info.project.name}.pdf`);
  const pdfBytes = await readFile((await download.path())!);
  const task = getDocument({ data: new Uint8Array(pdfBytes), disableFontFace: true, useSystemFonts: false });
  const pdf = await task.promise;
  const text = (await (await pdf.getPage(1)).getTextContent()).items.map((item) => "str" in item ? item.str : "").join(" ");
  expect(text).toContain("Élan Example Studio"); expect(text).toContain("Website design"); expect(text).toContain("251.00");
  expect(text).not.toContain("Address (optional)"); expect(text).not.toContain("Add your logo");
  await task.destroy();
  await expect(page.getByText(/PDF download initiated/)).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-invoice-complete", "true");
  expect(await page.locator("#generator").evaluate((element) => element.nextElementSibling?.matches(".ternyxa-discovery"))).toBe(true);
  await expect(page.locator(".cta-section")).toBeHidden();
  await expect(page.locator(".hero-actions")).toBeHidden();
  await expect(page.getByRole("button", { name: "Download again", exact: true })).toBeVisible();
  await screenshot(page, "result-en", info.project.name);
  await page.getByRole("button", { name: "Edit Invoice", exact: true }).click();
  await edit(page, "Client or company name", "Client or company name", "Corrected Example Client");
  const secondDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Invoice PDF", exact: true }).click();
  await secondDownload;
  expect((await draft(page)).clientName).toBe("Corrected Example Client");
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("all eight templates preserve data; interface language, PDF language, logo and reload stay independent", async ({ page }, info) => {
  test.setTimeout(120000);
  await page.goto("/en/?template=modern");
  await edit(page, "Business or full name", "Business or full name", "Saved Example Studio");
  await edit(page, "Client or company name", "Client or company name", "Fictional Client");
  await edit(page, "Description (1)", "Description", "Demonstration service");
  await page.getByRole("button", { name: "Advanced options", exact: true }).click();
  await page.getByLabel("PDF language", { exact: true }).selectOption("fr");
  await page.getByText("Advanced settings (optional)", { exact: true }).click();
  await page.getByLabel("Shipping", { exact: true }).fill("5");
  const logo = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 160; canvas.height = 64;
    const context = canvas.getContext("2d")!;
    context.strokeStyle = "#2563eb"; context.lineWidth = 4; context.strokeRect(2, 2, 156, 60);
    context.fillStyle = "#2563eb"; context.font = "bold 32px sans-serif"; context.fillText("DEMO", 30, 43);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator(".logo-control input[type=file]").setInputFiles({ name: "fictional-demo-logo.png", mimeType: "image/png", buffer: Buffer.from(logo, "base64") });
  await expect(page.locator(".logo-upload-preview img")).toBeVisible();
  const before = await draft(page);
  await page.locator(".advanced-panel").getByRole("button", { name: "Close", exact: true }).click();
  for (const id of templateIds) {
    await page.getByRole("button", { name: "Change template", exact: true }).click();
    await page.getByRole("button", { name: `Use this template: ${getDictionary("en").builder.templates[id]}`, exact: true }).click();
    expect(await draft(page)).toEqual({ ...before, template: id });
    await expect(page.locator(".document-canvas image").first()).toBeVisible();
    if (info.project.name === "chrome-desktop") {
      const downloadEvent = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download Invoice PDF", exact: true }).click();
      const download = await downloadEvent;
      await mkdir("tmp/pdfs", { recursive: true });
      await download.saveAs(`tmp/pdfs/v3-1-logo-${id}.pdf`);
      const task = getDocument({ data: new Uint8Array(await readFile((await download.path())!)), disableFontFace: true, useSystemFonts: false });
      const pdf = await task.promise;
      expect((await (await pdf.getPage(1)).getOperatorList()).fnArray).toContain(OPS.paintImageXObject);
      await task.destroy();
      await page.getByRole("button", { name: "Edit Invoice", exact: true }).click();
    }
  }
  await page.locator(".language-switcher").getByRole("link", { name: "FR", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Générateur de facture gratuit — Créez votre facture en ligne");
  expect(await draft(page)).toEqual({ ...before, template: "retail" });
  await screenshot(page, "editing-fr", info.project.name);
  await page.reload();
  expect(await draft(page)).toEqual({ ...before, template: "retail" });
  await expect(page.locator(".document-canvas image").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("keyboard controls and template preview keep focus accessible", async ({ page }) => {
  await page.goto("/en/");
  const preview = page.getByRole("button", { name: "Preview template: Modern Professional", exact: true });
  await preview.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next template", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("2 / 8");
  await expect(page.getByRole("dialog")).toContainText("Fictional preview");
  await page.getByRole("button", { name: "Previous template", exact: true }).click();
  await page.keyboard.press("Escape"); await expect(preview).toBeFocused();
  await page.getByRole("button", { name: "Use this template: Modern Professional", exact: true }).click();
  const field = page.locator("button.document-field").filter({ has: page.locator(".sr-only", { hasText: "Business or full name" }) });
  await field.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByLabel("Business or full name")).toBeFocused();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(field).toBeFocused();
});
test("compact mobile Quick Edit keeps the active invoice field visible", async ({ page }, info) => {
  test.skip(!info.project.name.includes("mobile"), "Mobile bottom-sheet behavior");
  await page.goto("/en/?template=modern");
  const navigator = page.locator(".mobile-field-navigation");
  await expect(navigator).not.toHaveAttribute("open", "");
  await navigator.locator("summary").click();
  await page.getByLabel("Invoice field", { exact: true }).selectOption({ label: "Business or full name" });
  await expect(navigator).not.toHaveAttribute("open", "");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Business or full name", { exact: true })).toBeFocused();
  await expect(page.locator(".document-field.active")).toHaveCount(1);
  await expect.poll(async () => {
    const sheet = (await dialog.boundingBox())!;
    const field = (await page.locator(".document-field.active").boundingBox())!;
    return sheet.height <= 300 && field.y >= 0 && field.y + field.height < sheet.y;
  }).toBe(true);
  await mkdir("output/v3-1", { recursive: true });
  await page.screenshot({ path: "output/v3-1/mobile-bottom-sheet.png" });
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("button", { name: "Business or full name", exact: true })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("long French invoices have matching review/PDF page counts and retain the last row", async ({ page }, info) => {
  const seeded = { ...createDefaultDraft("fr"), wizardStep: 2 as const, paperSize: "letter" as const,
    businessName: "Société Exemple", businessEmail: "studio@example.test", businessAddress: "42 rue des Exemples\nMarrakech",
    clientName: "Client Exemple", clientEmail: "client@example.test", clientAddress: "Montréal",
    notes: "Merci pour votre confiance. ".repeat(30), paymentTerms: "Paiement sous 14 jours",
    items: Array.from({ length: 50 }, (_, index) => ({ id: `row-${index}`, description: `Service-${index + 1} création et développement. ` + "Description détaillée de la prestation. ".repeat(6), quantity: 1.25, rate: 12.01 })) };
  await page.goto("/fr/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify({ version: 2, draft: value })), { key: storageKey, value: seeded });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Vérifier la facture", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger ma facture PDF", exact: true }).click();
  const download = await downloadEvent;
  await mkdir("tmp/pdfs", { recursive: true });
  await download.saveAs(`tmp/pdfs/v3-1-long-fr-${info.project.name}.pdf`);
  const task = getDocument({ data: new Uint8Array(await readFile((await download.path())!)), disableFontFace: true, useSystemFonts: false });
  const pdf = await task.promise;
  expect(pdf.numPages).toBeGreaterThan(1);
  await expect(page.locator(".document-canvas .invoice-svg")).toHaveCount(pdf.numPages);
  const lastPage = await pdf.getPage(pdf.numPages);
  const allText: string[] = [];
  for (let index = 1; index <= pdf.numPages; index++) allText.push((await (await pdf.getPage(index)).getTextContent()).items.map((item) => "str" in item ? item.str : "").join(" "));
  expect(allText.join(" ")).toContain("Service-50");
  expect((await lastPage.getTextContent()).items.map((item) => "str" in item ? item.str : "").join(" ")).toContain("Paiement sous 14 jours");
  await task.destroy();
  await page.getByRole("button", { name: "Modifier la facture", exact: true }).click();
  expect((await draft(page)).items).toHaveLength(50);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
