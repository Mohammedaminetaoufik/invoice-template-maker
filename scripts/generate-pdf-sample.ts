import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDefaultDraft } from "../lib/invoice";
import { generateInvoicePdf } from "../lib/pdf";

const [regular, semibold] = await Promise.all([
  readFile(resolve("public/fonts/NotoSans-Regular.woff")),
  readFile(resolve("public/fonts/NotoSans-Semibold.woff")),
]);

globalThis.fetch = async (url) => new Response(String(url).includes("Semibold") ? semibold : regular);

const draft = createDefaultDraft("fr");
Object.assign(draft, {
  documentLocale: "fr",
  template: "classic",
  businessName: "Ternyxa Studio",
  businessEmail: "contact@ternyxa.com",
  businessAddress: "Marrakech, Maroc",
  clientName: "Lamali Groupe",
  clientEmail: "lamali@gmail.com",
  clientAddress: "Marrakech, Maroc",
  invoiceNumber: "INV-2026-001",
  issueDate: "2026-10-12",
  dueDate: "2026-10-26",
  currency: "MAD",
  taxRate: 20,
  items: [{ id: "sample", description: "Conception et développement du site web", quantity: 1, rate: 2500 }],
  notes: "Merci pour votre confiance. Paiement par virement à réception de la facture.",
});

const bytes = await generateInvoicePdf(draft);
const directory = resolve("output/pdf");
await mkdir(directory, { recursive: true });
const output = resolve(directory, "invoice-sample-fr.pdf");
await writeFile(output, bytes);
console.log(output);
