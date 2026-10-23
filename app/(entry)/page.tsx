import type { Metadata } from "next";
import { BrandMark } from "@/components/BrandMark";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "InvoiceTemplateMaker — English or Français",
  description: "Choose English or French to create, customize, and download a professional invoice PDF for free with InvoiceTemplateMaker.",
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: { en: `${SITE_URL}/en/`, fr: `${SITE_URL}/fr/`, "x-default": `${SITE_URL}/` },
  },
  openGraph: {
    type: "website",
    title: "InvoiceTemplateMaker — English or Français",
    description: "Choose English or French to create, customize, and download a professional invoice PDF for free with InvoiceTemplateMaker.",
    url: `${SITE_URL}/`,
    siteName: "InvoiceTemplateMaker",
    locale: "en_US",
    alternateLocale: "fr_FR",
    images: [{
      url: `${SITE_URL}/og/invoice-maker-root-v3.jpg`,
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: "InvoiceTemplateMaker — Free invoice tools in English and French",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoiceTemplateMaker — English or Français",
    description: "Choose English or French to create, customize, and download a professional invoice PDF for free with InvoiceTemplateMaker.",
    images: [{
      url: `${SITE_URL}/og/invoice-maker-root-v3.jpg`,
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: "InvoiceTemplateMaker — Free invoice tools in English and French",
    }],
  },
  robots: { index: true, follow: true },
};

export default function RootFallback() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "InvoiceTemplateMaker",
    url: `${SITE_URL}/`,
    inLanguage: ["en", "fr"],
  };

  return (
    <main className="root-fallback">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <section className="root-fallback-card">
        <a className="brand" href="/en/" aria-label="InvoiceTemplateMaker English homepage">
          <BrandMark />
          <span>InvoiceTemplateMaker</span>
        </a>
        <span className="eyebrow"><span lang="en">English</span> · <span lang="fr">Français</span></span>
        <h1>InvoiceTemplateMaker</h1>
        <p>Choose your language to continue. <span lang="fr">Choisissez votre langue pour continuer.</span></p>
        <div className="root-fallback-actions">
          <a className="button" href="/en/" hrefLang="en" lang="en">Continue in English</a>
          <a className="button button-ghost" href="/fr/" hrefLang="fr" lang="fr">Continuer en français</a>
        </div>
        <p className="root-fallback-language">Free invoice generator · <span lang="fr">Générateur de facture gratuit</span></p>
      </section>
    </main>
  );
}
