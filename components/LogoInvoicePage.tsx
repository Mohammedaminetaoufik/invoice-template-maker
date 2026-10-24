import { ArrowRight, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/content";
import { createFictionalInvoice } from "@/lib/example-invoices";
import { routeMap } from "@/lib/routes";
import { InvoiceBuilder } from "./InvoiceBuilder";
import { InvoicePreview } from "./InvoicePreview";

const logoCopy = {
  en: {
    benefits: ["Free to customize", "No signup required", "Watermark-free PDF", "Private browser processing"],
    cta: "Create an Invoice with My Logo",
    preview: "Fictional invoice-with-logo preview rendered by the real tool",
    guideTitle: "Create an invoice with your logo in 3 steps",
    steps: [
      ["1. Upload your logo", "Choose a PNG, JPEG, or WebP file up to 2 MB. The image is validated, converted, and stored on your device."],
      ["2. Customize the invoice", "Edit your business and client details, services, dates, payment information, template, and accent colour."],
      ["3. Download the PDF", "Review the real preview, then download a professional, watermark-free PDF directly from your browser."],
    ],
    tips: [["How logo placement works", "The selected template reserves a balanced area in the invoice header. The renderer scales the image proportionally without stretching it."], ["Keep the invoice readable", "Use a clear logo without large empty margins. It should identify your business without competing with the invoice number, client details, or amount due."]],
  },
  fr: {
    benefits: ["Personnalisation gratuite", "Sans inscription", "PDF sans filigrane", "Traitement dans le navigateur"],
    cta: "Créer ma facture avec logo",
    preview: "Exemple fictif de facture avec logo rendu par l’outil réel",
    guideTitle: "Créer une facture avec logo en 3 étapes",
    steps: [
      ["1. Importez votre logo", "Choisissez un fichier PNG, JPEG ou WebP de 2 Mo maximum. L’image est validée, convertie et conservée sur votre appareil."],
      ["2. Personnalisez les informations", "Modifiez vos coordonnées, le client, les prestations, les dates, les modalités de règlement, le modèle et la couleur."],
      ["3. Téléchargez la facture PDF", "Relisez l’aperçu réel, puis téléchargez un PDF professionnel sans filigrane directement depuis votre navigateur."],
    ],
    tips: [["Comment le logo est positionné", "Le modèle réserve une zone équilibrée dans l’en-tête. Le moteur redimensionne l’image proportionnellement, sans la déformer."], ["Préserver la lisibilité", "Utilisez un logo net sans grande marge vide. Il doit identifier votre activité sans concurrencer le numéro, le client ou le montant à payer."]],
  },
} as const;

export function LogoInvoicePage({ locale }: { locale: Locale }) {
  const meta = pageContent[locale].logo; const c = logoCopy[locale]; const example = createFictionalInvoice(locale, "modern", true);
  return <main>
    <section className="template-product-hero"><div className="shell template-product-grid"><div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.h1}</h1><p>{meta.intro}</p><ul className="template-benefits">{c.benefits.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul><a className="button" href={`${routeMap.logo[locale]}?template=modern#generator`}>{c.cta}<ArrowRight size={17} /></a></div><figure className="template-feature-preview logo-feature-preview"><InvoicePreview draft={example} logoUrl="/icon.svg" /><figcaption>{c.preview}</figcaption></figure></div></section>
    <InvoiceBuilder locale={locale} initialTemplate="modern" prioritizeLogo />
    <section className="compact-seo-content logo-guidance"><div className="shell"><div className="section-heading"><span className="eyebrow">{locale === "fr" ? "Mode d’emploi" : "How it works"}</span><h2>{c.guideTitle}</h2></div><div className="growth-step-grid">{c.steps.map(([title, body]) => <article key={title}><Check size={19} /><div><h3>{title}</h3><p>{body}</p></div></article>)}</div><div className="compact-content-grid logo-tips">{c.tips.map(([title, body]) => <article key={title}><Check size={18} /><div><h2>{title}</h2><p>{body}</p></div></article>)}</div></div></section>
    <nav className="related-journey" aria-label={locale === "fr" ? "Ressources associées" : "Related resources"}><div className="shell"><a href={routeMap.home[locale]}>{locale === "fr" ? "Ouvrir le générateur de facture gratuit" : "Open the free invoice generator"}<ArrowRight size={16} /></a><a href={routeMap.simple[locale]}>{locale === "fr" ? "Utiliser un modèle de facture simple gratuit" : "Use the free simple invoice template"}<ArrowRight size={16} /></a><a href={routeMap.guide[locale]}>{locale === "fr" ? "Apprendre à faire une facture" : "Learn how to make an invoice"}<ArrowRight size={16} /></a></div></nav>
  </main>;
}
