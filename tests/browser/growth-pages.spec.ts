import { expect, test } from "@playwright/test";
import { createDefaultDraft } from "../../lib/invoice";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("itm-privacy-preferences", JSON.stringify({ version: 1, analytics: false, advertising: false })));
});

test("invoice guide gives an immediate answer, real rendered example, annotations, and tool journey", async ({ page }) => {
  await page.goto("/en/how-to-make-an-invoice/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How to Make an Invoice: Step-by-Step with Example");
  await expect(page.locator(".quick-answer")).toContainText("To make an invoice");
  await expect(page.locator(".guide-invoice-preview .invoice-svg")).toBeVisible();
  await expect(page.locator(".invoice-annotations li")).toHaveCount(8);
  await expect(page.getByRole("link", { name: "Customize This Invoice Example" }).first()).toHaveAttribute("href", "/en/?template=freelance#generator");
  await expect(page.locator(".guide-step-grid article")).toHaveCount(8);
  await expect(page.getByRole("link", { name: "Create a late payment reminder" })).toHaveAttribute("href", "/en/late-payment-reminder-generator/");
  expect(await page.evaluate(() => document.querySelectorAll("h1").length)).toBe(1);
});

test("simple-template CTA selects minimal while preserving an existing draft", async ({ page }) => {
  const saved = { ...createDefaultDraft("en"), wizardStep: 2 as const, template: "classic" as const, businessName: "Saved Studio", clientName: "Saved Client", items: [{ id: "saved", description: "Saved service", quantity: 2, rate: 80 }] };
  await page.goto("/en/simple-invoice-template/");
  await page.evaluate((draft) => localStorage.setItem("itm-invoice-draft-v1", JSON.stringify({ version: 2, draft })), saved);
  await page.reload();
  await expect(page.locator(".template-feature-preview .invoice-svg")).toBeVisible();
  await page.getByRole("link", { name: "Use This Free Template" }).click();
  await expect(page).toHaveURL(/\/en\/simple-invoice-template\/\?template=minimal#generator$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("itm-invoice-draft-v1")!).draft)).toMatchObject({ template: "minimal", businessName: "Saved Studio", clientName: "Saved Client" });
});

test("French homepage adds concise contextual paths without displacing the generator", async ({ page }) => {
  await page.goto("/fr/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Générateur de facture gratuit");
  await expect(page.locator("#generator")).toBeVisible();
  const section = page.locator(".french-home-growth");
  await expect(section.getByRole("heading", { name: "Comment créer une facture gratuitement en 3 étapes ?" })).toBeVisible();
  await expect(section.getByRole("link", { name: "Personnaliser un modèle de facture simple" })).toHaveAttribute("href", "/fr/modele-facture-simple/");
  await expect(section.getByRole("link", { name: "Ajouter un logo à sa facture" })).toHaveAttribute("href", "/fr/facture-avec-logo/");
});

test("French logo page uses the real renderer and explains local logo handling", async ({ page }) => {
  await page.goto("/fr/facture-avec-logo/");
  await expect(page.locator(".logo-feature-preview .invoice-svg image")).toHaveAttribute("href", "/icon.svg");
  const guidance = page.locator(".compact-seo-content");
  await expect(guidance.getByText(/PNG, JPEG ou WebP/)).toBeVisible();
  await expect(guidance.getByText(/conservée sur votre appareil/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Créer ma facture avec logo" })).toHaveAttribute("href", "/fr/facture-avec-logo/?template=modern#generator");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("priority pages remain usable at 375px, 390px, tablet, and desktop widths", async ({ page }) => {
  for (const viewport of [{ width: 375, height: 780 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/en/how-to-make-an-invoice/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/fr/modele-facture-simple/");
    await expect(page.getByRole("link", { name: "Utiliser ce modèle gratuit" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
