"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { hasStoredPrivacyPreferences, readPrivacyPreferences, writePrivacyPreferences, type PrivacyPreferences } from "@/lib/privacy-preferences";
import type { Locale } from "@/lib/i18n";
import { routeMap } from "@/lib/routes";

const GOOGLE_ANALYTICS_ID = "G-PMW46NFNGD";
export const OPEN_PRIVACY_PREFERENCES_EVENT = "itm:open-privacy-preferences";

const copy = {
  en: {
    title: "Help us improve InvoiceTemplateMaker",
    body: "Allow Google Analytics to measure visits and improve the site. Your invoice details are never sent to Analytics.",
    accept: "Allow analytics",
    decline: "Decline",
    privacy: "Privacy policy",
  },
  fr: {
    title: "Aidez-nous à améliorer InvoiceTemplateMaker",
    body: "Autorisez Google Analytics à mesurer les visites et à améliorer le site. Les données de vos factures ne sont jamais envoyées à Analytics.",
    accept: "Autoriser les statistiques",
    decline: "Refuser",
    privacy: "Politique de confidentialité",
  },
} as const;

export function AnalyticsConsent({ locale }: { locale: Locale }) {
  const [preferences, setPreferences] = useState<PrivacyPreferences>();
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const stored = hasStoredPrivacyPreferences(window.localStorage);
    setPreferences(readPrivacyPreferences(window.localStorage));
    setPanelOpen(!stored);
    const open = () => setPanelOpen(true);
    window.addEventListener(OPEN_PRIVACY_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PRIVACY_PREFERENCES_EVENT, open);
  }, []);

  function choose(analytics: boolean) {
    const next: PrivacyPreferences = { version: 1, analytics, advertising: false };
    writePrivacyPreferences(window.localStorage, next);
    setPreferences(next);
    setPanelOpen(false);
    if (!analytics && window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
  }

  const t = copy[locale];
  return <>
    {preferences?.analytics && <>
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GOOGLE_ANALYTICS_ID}');
      `}</Script>
    </>}
    {panelOpen && <section className="privacy-consent" role="region" aria-labelledby="privacy-consent-title">
      <div>
        <strong id="privacy-consent-title">{t.title}</strong>
        <p>{t.body} <a href={routeMap.privacy[locale]}>{t.privacy}</a>.</p>
      </div>
      <div className="privacy-consent-actions">
        <button className="button" type="button" onClick={() => choose(true)}>{t.accept}</button>
        <button className="button button-ghost" type="button" onClick={() => choose(false)}>{t.decline}</button>
      </div>
    </section>}
  </>;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
