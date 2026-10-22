import type { Locale } from "./i18n";
import type { InvoiceDraft, TemplateId } from "./invoice";

export function createFictionalInvoice(locale: Locale, template: TemplateId, withLogo = false): InvoiceDraft {
  return {
    businessName: locale === "fr" ? "Atelier Horizon" : "Northstar Studio",
    businessEmail: locale === "fr" ? "bonjour@atelier-exemple.test" : "hello@northstar-example.test",
    businessAddress: locale === "fr" ? "24 rue des Ateliers\nLyon" : "24 Market Street\nPortland, OR",
    clientName: locale === "fr" ? "Société Rivage" : "Riverside Coffee Co.",
    clientEmail: "accounts@example.test",
    clientAddress: locale === "fr" ? "8 avenue du Port\nNantes" : "8 Harbor Avenue\nSeattle, WA",
    invoiceNumber: locale === "fr" ? "F-2026-042" : "INV-2026-042",
    issueDate: "2026-10-21",
    dueDate: "2026-11-04",
    items: [
      { id: "example-1", description: locale === "fr" ? "Conception de l’identité visuelle" : "Brand identity design", quantity: 1, rate: 650 },
      { id: "example-2", description: locale === "fr" ? "Déclinaisons pour les réseaux sociaux" : "Social media asset package", quantity: 1, rate: 250 },
    ],
    currency: locale === "fr" ? "EUR" : "USD",
    taxRate: 0,
    documentLocale: locale,
    template,
    accent: "#b84722",
    notes: locale === "fr" ? "Merci d’indiquer F-2026-042 comme référence du virement." : "Please use INV-2026-042 as the bank-transfer reference.",
    paymentTerms: locale === "fr" ? "Paiement sous 14 jours" : "Payment due within 14 days",
    paperSize: "a4",
    discountType: "fixed",
    discountValue: 0,
    shipping: 0,
    deposit: 0,
    amountPaid: 0,
    wizardStep: 2,
    logoId: withLogo ? "fictional-logo" : undefined,
  };
}
