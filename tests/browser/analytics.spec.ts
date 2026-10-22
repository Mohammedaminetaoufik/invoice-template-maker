import { expect, test } from "@playwright/test";
import { createDefaultDraft } from "../../lib/invoice";

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

test("consented tool actions emit anonymous conversion events without invoice content", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
  await page.goto("/en/");
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await page.getByRole("button", { name: "Use this template: Modern Professional", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "invoice_template_selected"))).toBe(true);
  await page.getByRole("button", { name: "Business or full name", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Business or full name", { exact: true }).fill("Anonymous test value");
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "invoice_customization_started"))).toBe(true);
  const serialized = await page.evaluate(() => JSON.stringify(window.dataLayer));
  expect(serialized).not.toContain("clientName");
  expect(serialized).not.toContain("invoiceNumber");

  const completeDraft = { ...createDefaultDraft("en"), wizardStep: 2 as const, businessName: "Example Studio", clientName: "Example Client", items: [{ id: "one", description: "Example service", quantity: 1, rate: 50 }] };
  await page.evaluate((draft) => localStorage.setItem("itm-invoice-draft-v1", JSON.stringify({ version: 2, draft })), completeDraft);
  await page.goto("/en/");
  await page.getByRole("button", { name: "Review invoice", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Invoice PDF", exact: true }).click();
  await download;
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "invoice_pdf_download"))).toBe(true);

  await page.goto("/en/late-payment-reminder-generator/");
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } }));
  await page.getByLabel("Outstanding balance").fill("120");
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "payment_reminder_generated"))).toBe(true);
  await page.getByRole("button", { name: "Copy full message" }).click();
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "payment_reminder_copy"))).toBe(true);
});
