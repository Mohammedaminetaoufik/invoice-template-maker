import { expect, test } from "@playwright/test";
import { createDefaultDraft } from "../../lib/invoice";

const measurementId = "G-PMW46NFNGD";

test("Google Analytics follows active consent across withdrawal, reload, and re-grant", async ({ page }) => {
  const scriptRequests: string[] = [];
  const collectionRequests: string[] = [];
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    scriptRequests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/javascript", body: `
      window.dataLayer = window.dataLayer || [];
      var originalPush = window.dataLayer.push.bind(window.dataLayer);
      window.dataLayer.push = function(entry) {
        var result = originalPush(entry);
        var args = Array.from(entry || []);
        if (args[0] === 'event' && !window['ga-disable-${measurementId}']) {
          fetch('https://www.google-analytics.com/g/collect?en=' + encodeURIComponent(args[1]), { mode: 'no-cors' });
        }
        return result;
      };
      window.__itmAnalyticsProviderReady = true;
    ` });
  });
  await page.route("https://www.google-analytics.com/**", async (route) => {
    collectionRequests.push(route.request().url());
    await route.fulfill({ status: 204, body: "" });
  });

  await page.goto("/en/");
  const consent = page.getByRole("region", { name: "Help us improve InvoiceTemplateMaker" });
  await expect(consent).toBeVisible();
  expect(scriptRequests).toEqual([]);
  expect(collectionRequests).toEqual([]);

  await consent.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => scriptRequests.length).toBe(1);
  expect(scriptRequests[0]).toContain(`id=${measurementId}`);
  await expect.poll(() => page.evaluate(() => Boolean((window as Window & { __itmAnalyticsProviderReady?: boolean }).__itmAnalyticsProviderReady))).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("itm-privacy-preferences")!))).toEqual({ version: 1, analytics: true, advertising: false });
  await page.getByRole("button", { name: "Use this template: Modern Professional", exact: true }).click();
  await expect.poll(() => collectionRequests.some((url) => url.includes("en=invoice_template_selected"))).toBe(true);

  await page.getByRole("button", { name: "Privacy choices" }).click();
  await expect(consent).toBeVisible();
  await consent.getByRole("button", { name: "Decline" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("itm-privacy-preferences")!))).toEqual({ version: 1, analytics: false, advertising: false });
  expect(await page.evaluate((id) => (window as unknown as Record<string, unknown>)[`ga-disable-${id}`], measurementId)).toBe(true);
  const eventsBeforeWithdrawalAction = collectionRequests.length;
  const dataLayerEventsBeforeWithdrawalAction = await page.evaluate(() => window.dataLayer?.filter((entry) => Array.from(entry as ArrayLike<unknown>)[0] === "event").length ?? 0);
  await page.getByRole("button", { name: "Change template", exact: true }).click();
  await page.getByRole("button", { name: "Use this template: Clean Minimal", exact: true }).click();
  await expect(page.getByRole("button", { name: "Change template", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.dataLayer?.filter((entry) => Array.from(entry as ArrayLike<unknown>)[0] === "event").length ?? 0)).toBe(dataLayerEventsBeforeWithdrawalAction);
  expect(collectionRequests).toHaveLength(eventsBeforeWithdrawalAction);

  await page.reload();
  await expect(consent).toBeHidden();
  expect(scriptRequests).toHaveLength(1);
  await page.getByRole("button", { name: "Privacy choices" }).click();
  await consent.getByRole("button", { name: "Allow analytics" }).click();
  await expect.poll(() => scriptRequests.length).toBe(2);
  await expect.poll(() => page.evaluate(() => Boolean((window as Window & { __itmAnalyticsProviderReady?: boolean }).__itmAnalyticsProviderReady))).toBe(true);
  await page.getByRole("button", { name: "Change template", exact: true }).click();
  await page.getByRole("button", { name: "Use this template: Classic Business", exact: true }).click();
  await expect.poll(() => collectionRequests.filter((url) => url.includes("en=invoice_template_selected")).length).toBe(2);
});

test("a blocked analytics provider never breaks invoice creation", async ({ page }) => {
  await page.route("https://www.googletagmanager.com/**", (route) => route.abort("blockedbyclient"));
  await page.goto("/en/");
  await page.getByRole("button", { name: "Allow analytics" }).click();
  await page.getByRole("button", { name: "Use this template: Modern Professional", exact: true }).click();
  await expect(page.getByRole("button", { name: "Review invoice", exact: true })).toBeVisible();
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
  await page.getByLabel("Outstanding balance").fill("0");
  await expect(page.getByText("This invoice has no outstanding balance")).toBeVisible();
  expect(await page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "payment_reminder_generated"))).not.toBe(true);
  await page.getByLabel("Outstanding balance").fill("120");
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "payment_reminder_generated"))).toBe(true);
  await page.getByRole("button", { name: "Copy full message" }).click();
  await expect.poll(() => page.evaluate(() => window.dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[1] === "payment_reminder_copy"))).toBe(true);
});
