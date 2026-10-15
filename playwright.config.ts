import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser", timeout: 60_000, workers: 1,
  outputDir: "tmp/playwright", reporter: "list",
  use: { baseURL: "http://127.0.0.1:4137", screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: process.env.CI ? [
    { name: "chromium-desktop", use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } } },
    { name: "chromium-mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ] : [
    { name: "chrome-desktop", use: { channel: "chrome", viewport: { width: 1440, height: 1000 } } },
    { name: "edge-desktop", use: { channel: "msedge", viewport: { width: 1440, height: 1000 } } },
    { name: "chrome-mobile", use: { channel: "chrome", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: "node scripts/serve-static.mjs", url: "http://127.0.0.1:4137/en/", reuseExistingServer: !process.env.CI },
});
