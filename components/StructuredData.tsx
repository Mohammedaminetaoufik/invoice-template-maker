import type { Locale } from "@/lib/i18n";
import type { PageKey } from "@/lib/routes";
import { routeMap } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";
import { pageContent } from "@/lib/content";

export function StructuredData({ locale, pageKey }: { locale: Locale; pageKey: PageKey }) {
  const url = `${SITE_URL}${routeMap[pageKey][locale]}`;
  const name = pageKey === "reminderArticle"
    ? (locale === "fr" ? "Comment relancer une facture impayée ? Exemples de mails" : "How to Write a Late Payment Reminder Email (With Examples)")
    : pageKey === "reminder"
      ? (locale === "fr" ? "Générateur de relance de facture impayée" : "Free Late Payment Reminder Generator")
      : pageKey === "blog" ? (locale === "fr" ? "Guides de facturation" : "Invoice guides and payment tips")
      : pageKey === "home" ? (locale === "fr" ? "Générateur de facture gratuit" : "Free Invoice Generator")
      : pageContent[locale][pageKey].h1 || "InvoiceTemplateMaker";
  const page = {
    "@type": pageKey === "reminder" || pageKey === "home" ? "SoftwareApplication" : pageKey === "reminderArticle" ? "BlogPosting" : pageKey === "blog" ? "CollectionPage" : "WebPage",
    "@id": `${url}#page`, name, url, inLanguage: locale,
    ...(pageKey === "reminderArticle" ? { headline: name, author: { "@type": "Organization", name: "InvoiceTemplateMaker" }, publisher: { "@type": "Organization", name: "InvoiceTemplateMaker", url: SITE_URL }, mainEntityOfPage: url } : {}),
    ...(pageKey === "reminder" || pageKey === "home" ? { applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}),
  };
  const nested = pageKey === "reminder" || pageKey === "blog" || pageKey === "reminderArticle" || pageKey === "guide" || pageKey === "simple" || pageKey === "logo";
  const data = nested ? {
    "@context": "https://schema.org",
    "@graph": [page, { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "fr" ? "Accueil" : "Home", item: `${SITE_URL}${routeMap.home[locale]}` },
      ...(pageKey === "reminderArticle" ? [{ "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}${routeMap.blog[locale]}` }, { "@type": "ListItem", position: 3, name, item: url }] : [{ "@type": "ListItem", position: 2, name, item: url }]),
    ] }],
  } : { "@context": "https://schema.org", ...page };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
