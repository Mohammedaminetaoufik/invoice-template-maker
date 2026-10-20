import { expect, test } from "@playwright/test";
import { createDefaultDraft } from "../../lib/invoice";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("itm-privacy-preferences", JSON.stringify({ version: 1, analytics: false, advertising: false })));
});

test("English reminder adapts dates and exposes deliberate copy and email actions", async ({ page }) => {
  let copied = "";
  await page.exposeFunction("recordClipboard", (value: string) => { copied = value; });
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (value: string) => (window as unknown as { recordClipboard(value: string): Promise<void> }).recordClipboard(value) } }));
  await page.goto("/en/late-payment-reminder-generator/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Late Payment Reminder Generator");
  await page.getByLabel("Client or company name").fill("Zoë & Company");
  await page.getByLabel("Invoice number").fill("INV-900");
  await page.getByLabel("Outstanding balance").fill("375.5");
  await page.getByLabel("Due date").fill("2099-01-01");
  await expect(page.locator(".email-preview")).toContainText("is due on");
  await expect(page.locator(".email-preview")).not.toContainText("was due");
  await page.getByLabel("Firm reminder").check();
  const mail = page.getByRole("link", { name: "Open in email app" });
  await expect(mail).toHaveAttribute("href", /^mailto:\?subject=/);
  await page.getByRole("button", { name: "Copy full message" }).click();
  await expect(page.getByRole("status")).toContainText("Copied to clipboard");
  expect(copied).toContain("INV-900"); expect(copied).toContain("Zoë & Company");
  await page.getByLabel("Outstanding balance").fill("0");
  await expect(page.getByText("This invoice has no outstanding balance")).toBeVisible();
  await expect(mail).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("invoice review hands a partial balance to the French reminder without a query string", async ({ page }) => {
  const seeded = { ...createDefaultDraft("fr"), wizardStep: 2 as const, businessName: "Atelier Démo", clientName: "Client Test", invoiceNumber: "F-77", dueDate: "2026-09-15", amountPaid: 25, items: [{ id: "one", description: "Prestation", quantity: 1, rate: 100 }] };
  await page.goto("/fr/");
  await page.evaluate((draft) => localStorage.setItem("itm-invoice-draft-v1", JSON.stringify({ version: 2, draft })), seeded);
  await page.reload();
  await page.getByRole("button", { name: "Vérifier la facture", exact: true }).click();
  await page.getByRole("button", { name: "Créer une relance de paiement", exact: true }).click();
  await expect(page).toHaveURL("/fr/generateur-relance-facture-impayee/");
  expect(new URL(page.url()).search).toBe("");
  await expect(page.getByLabel("Client ou entreprise")).toHaveValue("Client Test");
  await expect(page.getByLabel("Numéro de facture")).toHaveValue("F-77");
  await expect(page.getByLabel("Solde restant")).toHaveValue("75");
  await expect(page.getByLabel("Signature (facultatif)")).toHaveValue("Atelier Démo");
  expect(await page.evaluate(() => sessionStorage.getItem("itm-payment-reminder-prefill-v1"))).toBeNull();
});

test("French blog and article are crawlable, localized, and linked through the tool journey", async ({ page }) => {
  await page.goto("/fr/blog/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("factures");
  await page.getByRole("link", { name: "Lire le guide" }).click();
  await expect(page).toHaveURL("/fr/blog/comment-relancer-une-facture-impayee/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Comment relancer");
  await expect(page.locator("article")).toContainText("Exemple de dernière relance ferme");
  await expect(page.getByRole("link", { name: "Ouvrir le générateur de relance" })).toHaveAttribute("href", "/fr/generateur-relance-facture-impayee/");
});
