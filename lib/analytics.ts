import { readPrivacyPreferences } from "./privacy-preferences";

export type AnalyticsEvent = "invoice_template_selected" | "invoice_customization_started" | "invoice_pdf_download" | "payment_reminder_generated" | "payment_reminder_copy" | "invoice_to_reminder";

export const GOOGLE_ANALYTICS_ID = "G-PMW46NFNGD";
let activeAnalyticsConsent: boolean | undefined;

export function hasAnalyticsConsent() {
  if (activeAnalyticsConsent !== undefined) return activeAnalyticsConsent;
  if (typeof window === "undefined") return false;
  try { return readPrivacyPreferences(window.localStorage).analytics; }
  catch { return false; }
}

export function setAnalyticsConsent(granted: boolean) {
  activeAnalyticsConsent = granted;
  if (typeof window === "undefined") return;
  const disabledKey = `ga-disable-${GOOGLE_ANALYTICS_ID}`;
  (window as unknown as Record<string, unknown>)[disabledKey] = !granted;
  window.gtag?.("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function trackEvent(name: AnalyticsEvent, parameters: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent() || typeof window.gtag !== "function") return false;
  window.gtag("event", name, parameters);
  return true;
}
