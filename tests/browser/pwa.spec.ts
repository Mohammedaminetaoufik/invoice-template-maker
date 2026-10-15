import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createDefaultDraft } from "../../lib/invoice";

test("install metadata and cached generator support an offline PDF", async ({ page, context }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/en/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ id: "/", start_url: "/", scope: "/", display: "standalone" });
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ sizes: "192x192", type: "image/png" }),
    expect.objectContaining({ sizes: "512x512", type: "image/png" }),
    expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
  ]));
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 60_000 });
  const cdp = await context.newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  // Playwright creates an incognito context, which Chromium itself does not offer to install.
  expect(installabilityErrors.filter((error) => error.errorId !== "in-incognito")).toEqual([]);
  await page.getByRole("button", { name: "Use this template: Modern Professional", exact: true }).click();
  await expect(page.locator(".saved-indicator")).toContainText("Draft saved on this device");
  const draft = { ...createDefaultDraft("en"), wizardStep: 2 as const,
    businessName: "Offline Example Studio", clientName: "Offline Example Client",
    items: [{ id: "offline-row", description: "Offline design service", quantity: 1, rate: 125 }],
  };
  await page.evaluate((value) => localStorage.setItem("itm-invoice-draft-v1", JSON.stringify({ version: 2, draft: value })), draft);
  await page.reload();
  await expect(page.locator(".document-canvas")).toContainText("Offline Example Studio");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".document-canvas")).toContainText("Offline Example Studio");
  await page.getByRole("button", { name: "Review invoice", exact: true }).click();
  const pendingDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Invoice PDF", exact: true }).click();
  const download = await pendingDownload;
  const bytes = await readFile((await download.path())!);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(1000);
  await page.goto("/fr/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Générateur de facture gratuit");
  expect(errors).toEqual([]);
});
