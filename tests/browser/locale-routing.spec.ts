import { expect, test } from "@playwright/test";

test("the language-neutral root respects the browser language", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "languages", { configurable: true, get: () => ["fr-FR", "en-US"] });
    Object.defineProperty(navigator, "language", { configurable: true, get: () => "fr-FR" });
  });
  await page.goto("/");
  await expect(page).toHaveURL("/fr/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Générateur de facture gratuit");
});

test("a saved locale overrides the browser only at the root", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("itm-preferred-language", "fr"));
  await page.goto("/");
  await expect(page).toHaveURL("/fr/");

  await page.goto("/en/");
  await expect(page).toHaveURL("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Free Invoice Generator");
});

test("manual language switching stores the choice and preserves the equivalent route", async ({ page }) => {
  await page.goto("/en/how-to-make-an-invoice/");
  await page.locator(".language-switcher").getByRole("link", { name: "FR", exact: true }).click();
  await expect(page).toHaveURL("/fr/comment-faire-une-facture/");
  expect(await page.evaluate(() => localStorage.getItem("itm-preferred-language"))).toBe("fr");
});
