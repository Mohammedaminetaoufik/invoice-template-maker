// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOOGLE_ANALYTICS_ID, setAnalyticsConsent, trackEvent } from "@/lib/analytics";

describe("privacy-safe analytics events", () => {
  beforeEach(() => { localStorage.clear(); delete window.gtag; setAnalyticsConsent(false); });
  afterEach(() => { delete window.gtag; vi.restoreAllMocks(); });

  it("does nothing when consent is absent even if gtag exists", () => {
    window.gtag = vi.fn();
    expect(trackEvent("invoice_pdf_download", { locale: "en" })).toBe(false);
    expect(window.gtag).not.toHaveBeenCalledWith("event", expect.anything(), expect.anything());
  });

  it("sends only the named anonymous event parameters", () => {
    window.gtag = vi.fn();
    setAnalyticsConsent(true);
    expect(trackEvent("payment_reminder_copy", { locale: "fr", copy_target: "body", tone: "friendly" })).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith("event", "payment_reminder_copy", { locale: "fr", copy_target: "body", tone: "friendly" });
  });

  it("stops custom events immediately when consent is withdrawn", () => {
    window.gtag = vi.fn();
    setAnalyticsConsent(true);
    expect(trackEvent("invoice_template_selected", { locale: "en", template: "minimal" })).toBe(true);
    setAnalyticsConsent(false);
    expect(trackEvent("invoice_template_selected", { locale: "en", template: "modern" })).toBe(false);
    expect(window.gtag).toHaveBeenCalledTimes(3);
    expect(window.gtag).toHaveBeenLastCalledWith("consent", "update", expect.objectContaining({ analytics_storage: "denied" }));
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${GOOGLE_ANALYTICS_ID}`]).toBe(true);
  });
});
