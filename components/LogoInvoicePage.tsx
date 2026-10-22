import { ArrowRight, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/content";
import { createFictionalInvoice } from "@/lib/example-invoices";
import { routeMap } from "@/lib/routes";
import { InvoiceBuilder } from "./InvoiceBuilder";
import { InvoicePreview } from "./InvoicePreview";

const logoCopy = {
  en: {
    title: "See a real invoice layout with a logo", body: "This fictional preview uses the same invoice renderer as the editor. Your uploaded logo appears in the reserved header area and is fitted automatically without changing its proportions.", cta: "Create an Invoice with My Logo", preview: "Fictional logo invoice preview",
    sections: [["Upload your logo safely", "Open Advanced options and choose a PNG, JPEG, or WebP file up to 2 MB. The image is processed and stored on your device; it is not required to be uploaded to a remote invoice server."], ["How logo placement works", "The selected template reserves a balanced logo area in the invoice header. The renderer scales the image proportionally to fit that area. Choose a logo with clear edges and avoid excess empty space around the artwork."], ["Keep the invoice readable", "A logo should identify the sender, not compete with the invoice number, client details, or balance. Use the accent-colour control for a restrained brand connection and verify contrast in the live preview."], ["Download the customized PDF", "Review every page, then download the PDF. The same layout engine drives the browser preview and exported document, including the logo position and size."]],
  },
  fr: {
    title: "Un véritable exemple de facture avec logo", body: "Cet aperçu fictif utilise le même moteur de rendu que l’éditeur. Le logo apparaît dans la zone prévue de l’en-tête et s’adapte automatiquement sans déformation.", cta: "Créer ma facture avec logo", preview: "Aperçu fictif d’une facture avec logo",
    sections: [["Importer le logo en toute confidentialité", "Ouvrez les options avancées et choisissez un fichier PNG, JPEG ou WebP de 2 Mo maximum. L’image est traitée et conservée sur votre appareil ; elle n’a pas besoin d’être envoyée à un serveur de facturation."], ["Comprendre le positionnement du logo", "Le modèle réserve une zone équilibrée dans l’en-tête. Le moteur redimensionne automatiquement l’image en conservant ses proportions. Préférez un visuel net, sans grande marge vide autour du dessin."], ["Préserver la lisibilité", "Le logo doit identifier l’émetteur sans concurrencer le numéro, le client ou le solde. Utilisez la couleur d’accent avec mesure et vérifiez le contraste dans l’aperçu."], ["Télécharger le PDF personnalisé", "Contrôlez chaque page, puis téléchargez le PDF. Le même moteur gère l’aperçu et le document exporté, y compris la taille et la position du logo."]],
  },
} as const;

export function LogoInvoicePage({ locale }: { locale: Locale }) {
  const meta = pageContent[locale].logo; const c = logoCopy[locale]; const example = createFictionalInvoice(locale, "modern", true);
  return <main><section className="template-product-hero"><div className="shell template-product-grid"><div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.h1}</h1><p>{meta.intro}</p><div className="logo-explainer"><h2>{c.title}</h2><p>{c.body}</p></div><a className="button" href={`${routeMap.logo[locale]}?template=modern#generator`}>{c.cta}<ArrowRight size={17} /></a></div><figure className="template-feature-preview logo-feature-preview"><InvoicePreview draft={example} logoUrl="/icon.svg" /><figcaption>{c.preview}</figcaption></figure></div></section><InvoiceBuilder locale={locale} initialTemplate="modern" /><section className="compact-seo-content"><div className="shell compact-content-grid">{c.sections.map(([title, body]) => <article key={title}><Check size={18} /><div><h2>{title}</h2><p>{body}</p></div></article>)}</div></section><nav className="related-journey" aria-label={locale === "fr" ? "Ressources associées" : "Related resources"}><div className="shell"><a href={routeMap.guide[locale]}>{locale === "fr" ? "Apprendre à faire une facture" : "Learn how to make an invoice"}<ArrowRight size={16} /></a><a href={routeMap.simple[locale]}>{locale === "fr" ? "Voir le modèle de facture simple" : "See the simple invoice template"}<ArrowRight size={16} /></a><a href={routeMap.reminder[locale]}>{locale === "fr" ? "Préparer une relance" : "Prepare a payment reminder"}<ArrowRight size={16} /></a></div></nav></main>;
}
