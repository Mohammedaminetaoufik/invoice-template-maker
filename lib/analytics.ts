export type AnalyticsEvent = "invoice_template_selected" | "invoice_customization_started" | "invoice_pdf_download" | "payment_reminder_generated" | "payment_reminder_copy" | "invoice_to_reminder";

export function trackEvent(name: AnalyticsEvent, parameters: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return false;
  window.gtag("event", name, parameters);
  return true;
}
