import { expect, test } from "@playwright/test";

test("Google Analytics loads only after consent and can be withdrawn", async ({ page }) => {
  const requests: string[] = [];
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    requests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });

  await page.goto("/en/");
  const consent = page.getByRole("region", { name: "Help us improve InvoiceTemplateMaker" });
  await expect(consent).toBeVisible();
  expect(requests).toEqual([]);

  await consent.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toContain("id=G-PMW46NFNGD");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("itm-privacy-preferences")!))).toEqual({ version: 1, analytics: true, advertising: false });

  await page.getByRole("button", { name: "Privacy choices" }).click();
  await expect(consent).toBeVisible();
  await consent.getByRole("button", { name: "Decline" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("itm-privacy-preferences")!))).toEqual({ version: 1, analytics: false, advertising: false });
});
