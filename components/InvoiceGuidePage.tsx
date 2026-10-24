import { ArrowRight, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { pageContent } from "@/lib/content";
import { createFictionalInvoice } from "@/lib/example-invoices";
import { routeMap } from "@/lib/routes";
import { InvoicePreview } from "./InvoicePreview";

const guide = {
  en: {
    answer: "To make an invoice, add your business and client details, assign a unique invoice number, list the work and prices, calculate the total, set a due date, include payment instructions, then review and download the final PDF.",
    exampleTitle: "A complete freelance invoice example", exampleBody: "This fictional example uses the same renderer as the invoice generator. The details demonstrate structure only and are never copied into your draft.",
    customize: "Customize This Invoice Example", disclaimer: "Selects the Freelance Services layout; your current draft details stay yours.",
    annotations: [["Sender information", "Who is issuing the invoice and how the client can contact them."], ["Client details", "The customer or company responsible for payment."], ["Invoice number", "A unique reference for records and payment matching."], ["Invoice date", "The date the invoice was issued."], ["Due date", "The agreed deadline for payment."], ["Itemized services", "Clear descriptions, quantities, and rates for the completed work."], ["Total amount", "Subtotal, applicable adjustments, and the final balance due."], ["Payment instructions", "The method, reference, and terms the client needs to pay."]],
    steps: [
      ["1. Identify your business and client", "Add the freelancer or business name, useful contact details, and the client’s correct billing identity. Match the names used in your agreement and check any local requirements that apply to you."],
      ["2. Assign a unique invoice number", "Use a consistent sequence such as INV-2026-042. A unique reference helps both parties find the document and match a payment without exposing private information in the email subject."],
      ["3. Choose the invoice and due dates", "Record the issue date and the payment deadline agreed with the client. Do not describe an invoice as overdue until that deadline has passed."],
      ["4. Describe products or services", "Use one line per deliverable, product, phase, or time period. Add the quantity and unit rate so the amount can be checked without asking for clarification."],
      ["5. Calculate subtotal, tax, and total", "Multiply each quantity by its rate, add the lines, apply valid taxes or discounts, and subtract deposits or partial payments. The remaining balance should be unmistakable."],
      ["6. Add payment information", "State the accepted payment method, account or secure payment details, the reference to use, and concise terms. Share sensitive information only through channels appropriate for your client."],
      ["7. Review before sending", "Check spelling, client identity, dates, line items, currency, tax treatment, calculations, and the final balance. Preview the full document, including extra pages."],
      ["8. Download a professional PDF", "Choose a design, download the PDF, and open it once before sending. Keep a private copy with the records needed for your business."],
    ],
    mistakesTitle: "Common invoice mistakes to avoid", mistakes: ["Reusing an invoice number", "Leaving the due date or currency unclear", "Using vague line-item descriptions", "Forgetting a deposit or partial payment", "Sending before checking the final PDF", "Assuming one country’s legal rules apply everywhere"],
    faqTitle: "Invoice questions", faqs: [["Can I make an invoice for free?", "Yes. InvoiceTemplateMaker lets you edit and download a PDF without signup, a subscription, or a watermark."], ["Do I need to be a registered company?", "Requirements depend on where and how you work. Freelancers and sole traders commonly invoice clients, but you should verify the rules that apply to your activity."], ["What payment deadline should I use?", "Use the deadline agreed with your client or required for your situation. Avoid inventing a universal deadline."], ["Can I edit the invoice after downloading?", "Yes. The browser keeps the working draft on your device, so you can correct it and generate a new PDF."]],
    journey: [["Use the simple invoice template", "simple"], ["Customize an invoice with your logo", "logo"], ["Create a free invoice", "home"], ["Create a late payment reminder", "reminder"]] as const,
  },
  fr: {
    answer: "Pour faire une facture, indiquez les coordonnées du vendeur et du client, attribuez un numéro unique, détaillez les prestations et les prix, calculez le total, fixez l’échéance, ajoutez les modalités de règlement, puis vérifiez et téléchargez le PDF.",
    exampleTitle: "Un exemple complet de facture freelance", exampleBody: "Cet exemple fictif utilise exactement le même moteur de rendu que le générateur. Il montre la structure et ne sera jamais copié dans votre brouillon.",
    customize: "Personnaliser ce modèle de facture", disclaimer: "Sélectionne la mise en page Freelance ; vos propres informations sont conservées.",
    annotations: [["Coordonnées de l’émetteur", "L’indépendant ou l’entreprise qui établit la facture."], ["Informations du client", "L’identité exacte de l’entreprise ou de la personne facturée."], ["Numéro de facture", "Une référence unique pour le classement et le rapprochement du paiement."], ["Date d’émission", "La date à laquelle la facture est établie."], ["Date d’échéance", "La date de règlement convenue avec le client."], ["Prestations détaillées", "Des descriptions, quantités et tarifs faciles à vérifier."], ["Montant total", "Le sous-total, les ajustements applicables et le solde à régler."], ["Modalités de paiement", "Le moyen, la référence et les conditions nécessaires au règlement."]],
    steps: [
      ["1. Identifier votre activité et le client", "Ajoutez le nom du freelance ou de l’entreprise, les coordonnées utiles et l’identité de facturation exacte du client. Vérifiez les mentions qui s’appliquent réellement à votre situation."],
      ["2. Attribuer un numéro unique", "Adoptez une séquence cohérente, par exemple F-2026-042. Cette référence facilite le suivi du document et du règlement."],
      ["3. Choisir les dates", "Indiquez la date d’émission et l’échéance convenue. Une facture ne doit pas être présentée comme en retard avant cette date."],
      ["4. Décrire les produits ou prestations", "Consacrez une ligne à chaque livrable, produit, phase ou période. Précisez la quantité et le prix unitaire pour rendre le calcul compréhensible."],
      ["5. Calculer le sous-total et le solde", "Additionnez les lignes, appliquez uniquement les taxes et remises pertinentes, puis déduisez les acomptes et paiements partiels. Le reste à payer doit être évident."],
      ["6. Ajouter les modalités de règlement", "Précisez le moyen de paiement, la référence utile et des conditions concises. Protégez les informations bancaires sensibles avec un canal adapté."],
      ["7. Relire la facture", "Vérifiez l’identité du client, les dates, la devise, les lignes, les calculs, les taxes applicables et le solde. Contrôlez toutes les pages de l’aperçu."],
      ["8. Télécharger le PDF", "Choisissez la présentation, téléchargez le PDF et ouvrez-le avant l’envoi. Conservez une copie privée avec vos documents professionnels."],
    ],
    mistakesTitle: "Erreurs de facturation à éviter", mistakes: ["Réutiliser un numéro de facture", "Oublier l’échéance ou la devise", "Décrire les prestations de façon trop vague", "Omettre un acompte ou paiement partiel", "Envoyer le document sans vérifier le PDF", "Appliquer les règles d’un pays à toutes les situations"],
    faqTitle: "Questions sur la création d’une facture", faqs: [["Puis-je créer une facture gratuitement ?", "Oui. InvoiceTemplateMaker permet de modifier et télécharger un PDF sans inscription, abonnement ni filigrane."], ["Faut-il avoir une société ?", "Les obligations dépendent du pays et de votre activité. Les indépendants facturent couramment leurs clients, mais vous devez vérifier les règles qui vous concernent."], ["Quelle échéance choisir ?", "Utilisez le délai convenu avec votre client ou requis dans votre situation. Il n’existe pas de délai universel valable partout."], ["Puis-je corriger la facture après le téléchargement ?", "Oui. Le brouillon reste dans votre navigateur et vous pouvez générer un nouveau PDF après correction."]],
    journey: [["Utiliser un modèle de facture simple", "simple"], ["Créer une facture avec logo", "logo"], ["Créer une facture gratuite", "home"], ["Créer une relance de paiement", "reminder"]] as const,
  },
} as const;

export function InvoiceGuidePage({ locale }: { locale: Locale }) {
  const meta = pageContent[locale].guide; const c = guide[locale]; const draft = createFictionalInvoice(locale, "freelance");
  return <main>
    <section className="content-hero guide-growth-hero"><div className="shell content-hero-inner"><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.h1}</h1><p>{meta.intro}</p><div className="quick-answer"><Check size={21} /><p>{c.answer}</p></div><div className="content-hero-actions"><a className="button" href={`${routeMap.home[locale]}?template=freelance#generator`}>{c.customize}<ArrowRight size={17} /></a></div></div></section>
    <section className="annotated-example"><div className="shell"><div className="section-heading"><span className="eyebrow">{locale === "fr" ? "Exemple fictif" : "Fictional example"}</span><h2>{c.exampleTitle}</h2><p>{c.exampleBody}</p></div><div className="annotated-example-grid"><div className="guide-invoice-preview"><InvoicePreview draft={draft} /></div><ol className="invoice-annotations">{c.annotations.map(([title, body], index) => <li key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol></div><div className="example-action"><a className="button" href={`${routeMap.home[locale]}?template=freelance#generator`}>{c.customize}<ArrowRight size={17} /></a><small>{c.disclaimer}</small></div></div></section>
    <section className="guide-steps"><div className="shell"><div className="section-heading"><span className="eyebrow">{locale === "fr" ? "Guide étape par étape" : "Step-by-step guide"}</span><h2>{locale === "fr" ? "Créer une facture claire, du brouillon au PDF" : "Make a clear invoice, from draft to PDF"}</h2></div><div className="guide-step-grid">{c.steps.map(([title, body]) => <article key={title}><h2>{title}</h2><p>{body}</p></article>)}</div></div></section>
    <section className="guide-practical"><div className="shell"><div><h2>{c.mistakesTitle}</h2><ul>{c.mistakes.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div><div><h2>{c.faqTitle}</h2><div className="faq-list">{c.faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></div></section>
    <nav className="related-journey" aria-label={locale === "fr" ? "Étapes de facturation associées" : "Related invoice steps"}><div className="shell">{c.journey.map(([label, key]) => <a key={key} href={routeMap[key][locale]}>{label}<ArrowRight size={16} /></a>)}</div></nav>
  </main>;
}
