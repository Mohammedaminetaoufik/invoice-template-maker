// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "@/lib/analytics";

describe("privacy-safe analytics events", () => {
  afterEach(() => { delete window.gtag; vi.restoreAllMocks(); });

  it("does nothing until the consent-controlled gtag function exists", () => {
    expect(trackEvent("invoice_pdf_download", { locale: "en" })).toBe(false);
  });

  it("sends only the named anonymous event parameters", () => {
    window.gtag = vi.fn();
    expect(trackEvent("payment_reminder_copy", { locale: "fr", copy_target: "body", tone: "friendly" })).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith("event", "payment_reminder_copy", { locale: "fr", copy_target: "body", tone: "friendly" });
  });
});
