import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createDefaultDraft, type InvoiceDraft } from "../lib/invoice";
import { generateInvoicePdf } from "../lib/pdf";
import { templateIds } from "../lib/templates";

const [regular, semibold] = await Promise.all([
  readFile("public/fonts/NotoSans-Regular.woff"),
  readFile("public/fonts/NotoSans-Semibold.woff"),
]);
globalThis.fetch = async (url) => new Response(String(url).includes("Semibold") ? semibold : regular);
await mkdir("output/pdf", { recursive: true });
const allTemplates = process.argv.includes("--qa-templates");
if (allTemplates) await mkdir("tmp/pdfs/v2-templates", { recursive: true });
const fixturePath = process.argv.find((value) => value.startsWith("--logo="))?.slice(7);
const logo = fixturePath ? { id: "sample-logo", bytes: new Uint8Array(await readFile(fixturePath)), width: 180, height: 60 } : undefined;

for (const locale of ["en", "fr"] as const) {
  const draft: InvoiceDraft = {
    ...createDefaultDraft(locale),
    businessName: "Atelier Élan",
    businessEmail: "atelier@example.com",
    businessAddress: "Studio 14, Bâtiment des Créateurs\n24 avenue des Ateliers\nMarrakech, Maroc",
    clientName: "André & Fils",
    clientEmail: "client@example.com",
    clientAddress: "Établissement principal\n120 rue des Fleurs\nMontréal, Canada",
    invoiceNumber: "INV-2026-V2-001",
    issueDate: "2026-10-13", dueDate: "2026-10-27",
    template: locale === "fr" ? "classic" : "modern",
    paperSize: locale === "fr" ? "a4" : "letter",
    currency: locale === "fr" ? "MAD" : "USD",
    taxRate: 20,
    discountType: "percent", discountValue: 5,
    shipping: 15.5, deposit: 150, amountPaid: 25,
    logoId: logo?.id,
    purchaseOrder: "PO-EXAMPLE-001",
    businessIdentifiers: locale === "fr" ? "Identifiant d’exemple : EX-001" : "Example registration identifier: EX-001",
    paymentTerms: locale === "fr" ? "Paiement sous 14 jours" : "Payment within 14 days",
    items: Array.from({ length: 25 }, (_, index) => ({
      id: String(index + 1), quantity: index % 2 === 0 ? 1.25 : 2, rate: 72.35 + index,
      description: locale === "fr"
        ? `Mission ${index + 1} : création, intégration et vérification des livrables. Coordination avec le client et documentation complète des résultats.`
        : `Service ${index + 1}: design, implementation and verification of deliverables. Client coordination and complete documentation of results.`,
    })),
    notes: locale === "fr"
      ? "Merci pour votre confiance.\nPaiement par virement bancaire sous 14 jours. Utilisez le numéro de facture comme référence.\nLes coordonnées de paiement sont convenues séparément avec le client.\nToutes les missions et instructions doivent rester intégrales dans le PDF."
      : "Thank you for your business.\nPayment by bank transfer within 14 days. Use the invoice number as the payment reference.\nPayment details are agreed separately with the client.\nAll services and instructions must remain complete in the PDF.",
  };
  for (const template of allTemplates ? templateIds : [draft.template]) {
    const filename = allTemplates ? `tmp/pdfs/v2-templates/${template}-${locale}.pdf` : `output/pdf/v2-invoice-${locale}.pdf`;
    await writeFile(filename, await generateInvoicePdf({ ...draft, template }, logo));
    console.log(filename);
  }
}
