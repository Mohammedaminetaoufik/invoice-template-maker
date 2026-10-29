import { expect, test } from "@playwright/test";

test("the root consistently resolves to the English canonical", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "languages", { configurable: true, get: () => ["fr-FR", "en-US"] });
    Object.defineProperty(navigator, "language", { configurable: true, get: () => "fr-FR" });
  });
  await page.goto("/");
  await expect(page).toHaveURL("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Free Invoice Generator");
});

test("saved preferences do not override canonical root or explicit language routes", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("itm-preferred-language", "fr"));
  await page.goto("/");
  await expect(page).toHaveURL("/en/");

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
