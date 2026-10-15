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
    about: {
      title: "About InvoiceTemplateMaker | Free Invoice Tools",
      description: "Learn about InvoiceTemplateMaker, a free English and French invoice tool in the Ternyxa ecosystem with browser-local PDF processing.",
      eyebrow: "About the tool", h1: "Useful invoicing, without an account",
      intro: "InvoiceTemplateMaker helps independent professionals and small businesses create readable invoices in English and French. It is part of the Ternyxa tools ecosystem.",
      sections: [
        { title: "Built around the essentials", body: "Enter your business and customer names, add products or services, and review your invoice before downloading. Optional settings cover logos, payment instructions, taxes and discounts." },
        { title: "Your documents stay with you", body: "The browser performs calculations and creates PDFs. Drafts and logos are stored on your device; you can download a backup or clear them. No registration or invoice upload is required." },
        { title: "A practical document tool", body: "Templates help present information consistently, but you remain responsible for the details and the requirements that apply to your activity. The tool does not provide accounting, tax or legal advice." },
      ],
    },
    contact: {
      title: "Contact and Feedback | InvoiceTemplateMaker",
      description: "Report a problem or suggest an improvement for InvoiceTemplateMaker through the project repository. Find more tools at Ternyxa.",
      eyebrow: "Contact and feedback", h1: "Help us make the tool more useful",
      intro: "For bug reports and feature suggestions, use the public issue tracker linked below. Describe the steps, browser, language and template involved.",
      sections: [
        { title: "Report a reproducible issue", body: "Explain what you expected and what happened. Use made-up invoice details when reproducing a problem; public reports should not contain customer names, addresses, banking details or real invoices." },
        { title: "Questions about your invoice", body: "We cannot verify tax treatment or local invoicing obligations. Ask your accountant or the relevant authority about rules that apply to your business." },
        { title: "Discover more tools", body: "Visit Ternyxa to explore its tools ecosystem. Following this link is optional and does not transfer the invoice draft stored in your browser." },
      ],
    },
    home: {
      title: "Free Invoice Generator & Templates | InvoiceTemplateMaker",
      description: "Create professional invoices online for free. Choose an editable invoice template, customize it directly and download a PDF. No signup or watermark.",
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
        { title: "One invoice maker, eight useful styles", body: "Explore centred, compact, framed and expressive layouts for different business needs. Change a template without changing invoice details, logos, payments or document language." },
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
        { title: "Local draft and logo storage", body: "The generator uses local storage for invoice drafts and preferences, and IndexedDB for logos. Reset clears the active draft and its logo; browser settings can clear all site storage, including recovery copies. Downloaded backups may contain payment details and logos, so keep them private." },
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
    about: {
      title: "À Propos d’InvoiceTemplateMaker | Facturation Gratuite",
      description: "Découvrez InvoiceTemplateMaker, un outil gratuit de facturation en français et anglais dans l’écosystème Ternyxa, avec traitement local des PDF.",
      eyebrow: "À propos de l’outil", h1: "Une facturation utile, sans compte",
      intro: "InvoiceTemplateMaker aide les indépendants et petites entreprises à créer des factures lisibles en français et en anglais. Il fait partie de l’écosystème d’outils Ternyxa.",
      sections: [
        { title: "Pensé pour l’essentiel", body: "Saisissez votre nom et celui du client, ajoutez vos produits ou services, puis vérifiez la facture avant le téléchargement. Des options permettent d’ajouter un logo, des consignes de paiement, des taxes et des remises." },
        { title: "Vos documents restent chez vous", body: "Le navigateur effectue les calculs et crée les PDF. Brouillons et logos restent sur votre appareil. Vous pouvez télécharger une sauvegarde ou les effacer, sans inscription ni envoi de facture." },
        { title: "Un outil pratique de création de documents", body: "Les modèles présentent les informations de façon cohérente. Vous restez responsable des données et des obligations liées à votre activité. L’outil ne fournit pas de conseil comptable, fiscal ou juridique." },
      ],
    },
    contact: {
      title: "Contact et Suggestions | InvoiceTemplateMaker",
      description: "Signalez un problème ou proposez une amélioration via le dépôt du projet InvoiceTemplateMaker. Découvrez les autres outils de Ternyxa.",
      eyebrow: "Contact et suggestions", h1: "Aidez-nous à rendre l’outil plus utile",
      intro: "Pour signaler un bug ou proposer une fonction, utilisez le suivi public des problèmes ci-dessous. Précisez les étapes, le navigateur, la langue et le modèle concernés.",
      sections: [
        { title: "Décrire un problème reproductible", body: "Expliquez le résultat attendu et le résultat obtenu. Utilisez des données fictives : les signalements publics ne doivent pas contenir de vrais noms, adresses, coordonnées bancaires ou factures de clients." },
        { title: "Questions sur votre facture", body: "Nous ne pouvons pas vérifier le traitement fiscal ou les obligations de facturation locales. Consultez votre comptable ou l’autorité compétente pour votre activité." },
        { title: "Découvrir d’autres outils", body: "Visitez Ternyxa pour explorer ses outils. Ce lien est facultatif et ne transmet pas le brouillon conservé dans votre navigateur." },
      ],
    },
    home: {
      title: "Générateur de facture gratuit | InvoiceTemplateMaker",
      description: "Créez une facture professionnelle gratuitement en ligne. Choisissez un modèle, personnalisez-le directement et téléchargez un PDF sans inscription ni filigrane.",
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
        { title: "Huit styles adaptés à vos besoins", body: "Choisissez une présentation centrée, compacte, encadrée ou expressive. Changez de modèle sans modifier les coordonnées, le logo, les paiements ou la langue du document." },
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
      description: "Découvrez les étapes pour faire une facture claire : coordonnées, numérotation, prestations, taxes applicables et conditions de règlement.",
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
        { title: "Stockage local des brouillons et logos", body: "Le stockage local conserve vos brouillons et préférences ; IndexedDB conserve les logos. La remise à zéro efface le brouillon actif et son logo. Les réglages du navigateur permettent d’effacer toutes les données du site, y compris les copies de récupération. Gardez vos sauvegardes privées : elles peuvent contenir des coordonnées bancaires et des logos." },
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
