"use client";

import type { Locale } from "@/lib/i18n";
import { OPEN_PRIVACY_PREFERENCES_EVENT } from "./AnalyticsConsent";

export function PrivacyChoicesButton({ locale }: { locale: Locale }) {
  return <button className="footer-privacy-button" type="button" onClick={() => window.dispatchEvent(new Event(OPEN_PRIVACY_PREFERENCES_EVENT))}>
    {locale === "fr" ? "Choix de confidentialité" : "Privacy choices"}
  </button>;
}
