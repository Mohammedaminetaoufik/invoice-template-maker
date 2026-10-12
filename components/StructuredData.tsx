import type { Locale } from "@/lib/i18n";
import type { PageKey } from "@/lib/routes";
import { routeMap } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

export function StructuredData({ locale, pageKey }: { locale: Locale; pageKey: PageKey }) {
  const data = {
    "@context": "https://schema.org",
    "@type": pageKey === "home" ? "SoftwareApplication" : "WebPage",
    name: pageKey === "home" ? (locale === "fr" ? "Générateur de facture gratuit" : "Free Invoice Generator") : "InvoiceTemplateMaker",
    url: `${SITE_URL}${routeMap[pageKey][locale]}`,
    inLanguage: locale,
    ...(pageKey === "home" ? { applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
