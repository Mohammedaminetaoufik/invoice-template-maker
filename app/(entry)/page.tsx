import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free Invoice Generator in English and French | InvoiceTemplateMaker",
  description: "Create a free professional invoice online. InvoiceTemplateMaker is available in English and French with private, browser-based PDF generation.",
  alternates: {
    canonical: `${SITE_URL}/`,
    languages: { en: `${SITE_URL}/en/`, fr: `${SITE_URL}/fr/`, "x-default": `${SITE_URL}/` },
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
        <span className="eyebrow">Free invoice generator</span>
        <h1>Create a professional invoice online.</h1>
        <p>Build, preview, and download a polished invoice PDF without creating an account. Your invoice information stays in your browser.</p>
        <a className="button" href="/en/">Open the invoice generator <ArrowRight size={18} /></a>
        <p className="root-fallback-language">Vous préférez le français ? <a href="/fr/" lang="fr">Ouvrir le générateur de factures</a>.</p>
      </section>
    </main>
  );
}
