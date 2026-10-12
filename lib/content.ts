import type { Locale } from "./i18n";
import type { PageKey } from "./routes";

export interface PageContent {
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
}

export const pageContent: Record<Locale, Record<PageKey, PageContent>> = {
  en: {
    home: {
      title: "Free Invoice Generator | InvoiceTemplateMaker",
      description: "Create a professional invoice online for free. Choose a template, customize your details, and download a bilingual-ready PDF—no sign-up required.",
      eyebrow: "Free invoice generator",
      h1: "Professional invoices, ready in minutes.",
      intro: "Create a polished invoice PDF in your browser without an account.",
      sections: [],
    },
    templates: {
      title: "Free Invoice Templates for Small Businesses",
      description: "Explore free invoice templates for freelancers, consultants, and small businesses. Customize any design and download an English or French PDF.",
      eyebrow: "Invoice template gallery",
      h1: "A professional template for every kind of work",
      intro: "Pick a layout, add your details, and make it yours. Every template is editable, bilingual, and ready for a clean PDF export.",
      sections: [
        { title: "One invoice maker, three useful styles", body: "Modern is expressive, Minimal is restrained, and Classic follows proven accounting standards." },
        { title: "Built for small business workflows", body: "Use the templates for consulting, design, trade services, or retail sales. Your data stays in the browser." },
      ],
    },
    simple: {
      title: "Simple Invoice Template | Free Downloadable PDF",
      description: "Create a simple invoice in minutes with clear line items, tax, and payment terms. Free and easy to use online.",
      eyebrow: "Simple invoice template",
      h1: "A clean invoice that gets straight to the point",
      intro: "Clean spacing, readable totals, and no clutter. Perfect for fast billing.",
      sections: [
        { title: "What belongs on a simple invoice", body: "Your business name, client contact, issue date, due date, invoice number, line items, and payment instructions." },
        { title: "Clear payment terms", body: "Include payment methods, bank details, and the due date so customers know exactly how and when to pay." },
      ],
    },
    freelance: {
      title: "Freelance Invoice Template | Free Online Generator",
      description: "Create a professional freelance invoice for design, writing, consulting, or development. Instant PDF download in English or French.",
      eyebrow: "Freelance invoice",
      h1: "Bill clients confidently for independent work",
      intro: "Turn your hours, milestones, and project fees into an invoice clients respect.",
      sections: [
        { title: "Describe the deliverable clearly", body: "Itemize project phases, hourly blocks, or final deliverables so the scope is clear." },
        { title: "Set realistic due dates", body: "Give clients a clear window to review and pay, whether that is due upon receipt, 14 days, or 30 days." },
      ],
    },
    logo: {
      title: "Invoice Template with Logo | Free Online Tool",
      description: "Create a custom invoice with your business branding. Add your details, pick a layout, and export a clean PDF.",
      eyebrow: "Custom invoice",
      h1: "An invoice that reflects your brand",
      intro: "Keep your branding consistent across quotes, invoices, and payment receipts.",
      sections: [
        { title: "Consistency builds recognition", body: "Use the same business name, contact details, number format, and payment language across invoices. It helps clients recognize your documents and your process." },
      ],
    },
    guide: {
      title: "How to Make an Invoice — Step-by-Step Guide",
      description: "Learn how to make an invoice with the essential details, clear line items, tax, payment terms, and a professional downloadable PDF.",
      eyebrow: "Invoice guide",
      h1: "How to make an invoice clients can act on",
      intro: "A good invoice documents the work, makes the amount due unambiguous, and tells your client what to do next.",
      sections: [
        { title: "1. Identify both parties", body: "Start with your business name and contact details, then add the legal or trading name and address of the customer you are billing." },
        { title: "2. Number and date the invoice", body: "Give each invoice a unique reference. Include the issue date and a realistic due date that matches the terms agreed with the client." },
        { title: "3. Itemize the work", body: "Describe each service or product, quantity, and unit price. Show subtotal, applicable tax, and total separately so the calculation is easy to follow." },
        { title: "4. Add payment instructions", body: "Explain how to pay, which reference to use, and any relevant terms. Review local invoicing and tax requirements before sending." },
      ],
    },
    privacy: {
      title: "Privacy Policy | InvoiceTemplateMaker",
      description: "Learn how InvoiceTemplateMaker handles invoice drafts and website data.",
      eyebrow: "Privacy",
      h1: "Your invoice draft stays in your browser",
      intro: "We designed this tool to minimize data collection. The invoice information you enter is stored locally on your device.",
      sections: [
        { title: "Local draft storage", body: "The generator uses browser local storage to preserve your unfinished invoice and preferences. You can remove it at any time with the reset control or your browser settings." },
        { title: "PDF generation", body: "PDF files are generated in your browser. Invoice content does not need to be uploaded to our servers to create the file." },
        { title: "Website measurement", body: "If privacy-respecting analytics are introduced, this policy will be updated with the provider, purpose, and available controls." },
      ],
    },
    terms: {
      title: "Terms of Use | InvoiceTemplateMaker",
      description: "Read the terms that apply when using the InvoiceTemplateMaker website and invoice generator.",
      eyebrow: "Terms of use",
      h1: "Clear tools, sensible terms",
      intro: "You may use the generator to create invoices for lawful personal or business purposes.",
      sections: [
        { title: "Your responsibility", body: "You are responsible for the accuracy of invoice content and for checking the invoicing, record-keeping, and tax rules that apply to you." },
        { title: "No professional advice", body: "The website provides a document-making tool, not legal, tax, accounting, or financial advice. Country-specific fields do not guarantee compliance." },
      ],
    },
  },
  fr: {
    home: {
      title: "Générateur de Facture Gratuit | InvoiceTemplateMaker",
      description: "Créez une facture professionnelle gratuite en ligne en quelques secondes. Choisissez un modèle, personnalisez vos détails et téléchargez un PDF bilingue sans inscription.",
      eyebrow: "Générateur de facture gratuit",
      h1: "Des factures professionnelles, prêtes en quelques minutes.",
      intro: "Créez une facture soignée dans votre navigateur, choisissez un modèle et téléchargez un PDF net sans compte.",
      sections: [],
    },
    templates: {
      title: "Modèles de Facture Gratuits pour Entreprises",
      description: "Découvrez nos modèles de factures gratuits pour indépendants, consultants et petites entreprises. Téléchargement PDF en français et anglais.",
      eyebrow: "Galerie de modèles",
      h1: "Un modèle professionnel pour chaque activité",
      intro: "Choisissez un design, complétez vos informations et exportez immédiatement un document PDF impeccable.",
      sections: [
        { title: "Trois styles adaptés à vos besoins", body: "Le style Moderne est expressif, Minimaliste va à l'essentiel, et Classique respecte les présentations comptables traditionnelles." },
        { title: "Conçu pour les flux réels", body: "Idéal pour les prestations de services, le conseil, les créatifs ou les ventes. Vos informations restent dans votre navigateur." },
      ],
    },
    simple: {
      title: "Modèle de Facture Simple — Générateur PDF Gratuit",
      description: "Créez une facture simple, claire et professionnelle en ligne en quelques secondes. Outil gratuit, rapide et accessible sans création de compte.",
      eyebrow: "Modèle de facture simple",
      h1: "Une facture simple qui va droit à l'essentiel",
      intro: "Une mise en page aérée et lisible sans superflu visuel, conçue pour que vos clients comprennent immédiatement le montant à régler.",
      sections: [
        { title: "Ce qu'une facture simple doit comporter", body: "L'identité de votre entreprise, les coordonnées du client, un numéro unique, les dates d'émission et d'échéance, le détail des prestations et le montant total." },
        { title: "Des instructions de règlement explicites", body: "Renseignez vos coordonnées bancaires et vos délais de paiement. Des consignes claires facilitent le traitement comptable." },
      ],
    },
    freelance: {
      title: "Modèle Facture Freelance — Générateur Gratuit en Ligne",
      description: "Créez votre facture freelance pour prestations de conseil, développement, graphisme ou rédaction. Modèle personnalisable avec export PDF net.",
      eyebrow: "Facture freelance",
      h1: "Facturez vos prestations freelance en toute sérénité",
      intro: "Transformez vos forfaits, taux journaliers et livrables en une facture nette et irréprochable.",
      sections: [
        { title: "Décrivez des livrables intelligibles", body: "Utilisez des intitulés explicites : phase de projet, livrable validé ou période de prestation. Une description claire évite les allers-retours." },
        { title: "Favorisez un règlement rapide", body: "Précisez l'échéance convenue et vos coordonnées bancaires bien en évidence sur chaque document." },
      ],
    },
    logo: {
      title: "Facture Avec Logo — Modèle Personnalisé Gratuit",
      description: "Insérez le logo de votre entreprise et générez une facture PDF à vos couleurs. Traitement local dans le navigateur, haute définition et bilingue.",
      eyebrow: "Facture personnalisée",
      h1: "Une facture à l'image de votre entreprise",
      intro: "Ajoutez vos informations, sélectionnez votre couleur d'accentuation et renforcez votre image de marque auprès de vos clients.",
      sections: [
        { title: "Une reconnaissance visuelle immédiate", body: "L'association de votre logo et d'une couleur soignée valorise vos documents commerciaux et inspire confiance." },
      ],
    },
    guide: {
      title: "Comment Faire une Facture — Guide Étape par Étape",
      description: "Découvrez les étapes essentielles pour établir une facture conforme : mentions obligatoires, numérotation, taux de TVA et conditions de règlement.",
      eyebrow: "Guide de facturation",
      h1: "Comment faire une facture claire et efficace",
      intro: "Une bonne facture documente précisément la prestation, clarifie les montants dus et indique clairement les modalités de paiement.",
      sections: [
        { title: "1. Identifiez les deux parties", body: "Indiquez lisiblement votre nom ou raison sociale, adresse et coordonnées, ainsi que ceux de votre client." },
        { title: "2. Numérotez et datez le document", body: "Attribuez un identifiant unique basé sur une séquence chronologique continue. Indiquez la date d'émission et l'échéance convenue." },
        { title: "3. Détaillez chaque prestation", body: "Précisez la description, la quantité, le prix unitaire, le sous-total HT, le taux de TVA applicable et le montant total TTC." },
        { title: "4. Renseignez les modalités de paiement", body: "Fournissez vos coordonnées bancaires (IBAN, BIC) et les conditions applicables en cas de retard de paiement." },
      ],
    },
    privacy: {
      title: "Politique de Confidentialité | InvoiceTemplateMaker",
      description: "Découvrez comment InvoiceTemplateMaker protège vos informations avec un fonctionnement 100 % local dans votre navigateur.",
      eyebrow: "Confidentialité",
      h1: "Votre brouillon reste dans votre navigateur",
      intro: "Cet outil a été conçu selon le principe de minimisation des données. Les informations saisies sont conservées localement sur votre appareil.",
      sections: [
        { title: "Stockage local des brouillons", body: "Le générateur utilise le stockage local de votre navigateur pour conserver votre saisie et vos préférences sans téléversement sur nos serveurs." },
        { title: "Génération PDF côté client", body: "La création du fichier PDF est effectuée directement sur votre machine. Vos données de facturation ne transitent par aucun serveur distant." },
        { title: "Mesure d'audience", body: "Si des outils d'analyse anonymes sont introduits, cette politique sera mise à jour avec l'ensemble des détails techniques et des choix disponibles." },
      ],
    },
    terms: {
      title: "Conditions d'Utilisation | InvoiceTemplateMaker",
      description: "Consultez les conditions d'utilisation applicables à la création de factures gratuites avec InvoiceTemplateMaker.",
      eyebrow: "Conditions d'utilisation",
      h1: "Des outils clairs, des règles transparentes",
      intro: "Vous pouvez utiliser librement ce générateur pour créer des factures dans le cadre d'activités personnelles ou professionnelles licites.",
      sections: [
        { title: "Votre responsabilité", body: "Vous êtes seul responsable de l'exactitude des informations saisies et de leur conformité avec la réglementation fiscale et légale en vigueur." },
        { title: "Absence de conseil professionnel", body: "Le site fournit un outil d'édition documentaire et ne constitue en aucun cas un service de conseil juridique, fiscal ou comptable." },
      ],
    },
  },
};
