import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { calculateTotals, createDefaultDraft, formatMoney, type CurrencyCode, type InvoiceDraft, type PaperSize, type TemplateId } from "@/lib/invoice";
import { generateInvoicePdf } from "@/lib/pdf";
import { createInvoiceLayout, normalizePdfText, type TextMeasure, type TextOperation } from "@/lib/pdf-layout";
import { templateIds } from "@/lib/templates";

let measure: TextMeasure;

beforeAll(async () => {
  const [regular, semibold] = await Promise.all([
    readFile("public/fonts/NotoSans-Regular.woff"),
    readFile("public/fonts/NotoSans-Semibold.woff"),
  ]);
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) => new Response(String(url).includes("Semibold") ? semibold : regular)));
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fonts = { regular: await pdf.embedFont(regular), semibold: await pdf.embedFont(semibold) };
  measure = (text, size, role) => fonts[role].widthOfTextAtSize(text, size);
});

function makeDraft(count: number, locale: "en" | "fr", template: TemplateId = "modern", paperSize: PaperSize = "a4"): InvoiceDraft {
  return {
    ...createDefaultDraft(locale), template, paperSize,
    businessName: "Société Élan",
    businessEmail: "factures@example.com",
    businessAddress: "Bâtiment C, deuxième étage\n42 avenue des métiers\nMarrakech, Maroc",
    clientName: "André & Fils",
    clientAddress: "Établissement principal\n120 rue des Fleurs\nMontréal, Canada",
    items: Array.from({ length: count }, (_, index) => ({ id: String(index), description: `Item-${String(index + 1).padStart(3, "0")} création et développement`, quantity: 1.25, rate: 12.01 })),
    currency: "EUR", taxRate: 20,
    notes: "Merci pour votre confiance. Paiement par virement à réception. Fin des instructions.",
  };
}

async function extractPdf(draft: InvoiceDraft) {
  const bytes = await generateInvoicePdf(draft);
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, disableFontFace: true });
  const pdf = await task.promise;
  const pages: string[] = [];
  const dimensions: Array<[number, number]> = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    const viewport = page.getViewport({ scale: 1 });
    dimensions.push([viewport.width, viewport.height]);
  }
  await task.destroy();
  return { pages, dimensions, text: pages.join(" ") };
}

const withoutSpaces = (text: string) => text.replace(/\s/g, "");

describe("actual exported PDF reliability", () => {
  it("preserves dedicated registration identifiers, bank details and payment terms", async () => {
    const draft = makeDraft(1, "fr");
    Object.assign(draft, { siren: "001234567", siret: "00123456700012", vatNumber: "EX-VAT-001", ice: "000000000000001", taxIdentifier: "IF-00001", commercialRegister: "RC-00002", registrationNumber: "GEN-00003", iban: "EXAMPLE-IBAN-001", swift: "EXAMPLE-BIC-001", purchaseOrder: "PO-00004", paymentTerms: "Paiement sous 14 jours" });
    const result = await extractPdf(draft);
    for (const value of [draft.siren, draft.siret, draft.vatNumber, draft.ice, draft.taxIdentifier, draft.commercialRegister, draft.registrationNumber, draft.iban, draft.swift, draft.purchaseOrder, draft.paymentTerms]) expect(result.text).toContain(value);
  }, 15000);
  it("rejects unsupported characters rather than exporting missing-glyph boxes", async () => {
    const draft = makeDraft(1, "en");
    draft.items[0].description = "Service 🦄";
    await expect(generateInvoicePdf(draft)).rejects.toMatchObject({ name: "UnsupportedInvoiceCharacterError" });
  });
  for (const locale of ["en", "fr"] as const) {
    for (const paperSize of ["a4", "letter"] as const) {
      for (const count of [1, 10, 11, 25, 50, 100]) {
        it(`exports every item and totals: ${locale}, ${paperSize}, ${count} items`, async () => {
          const draft = makeDraft(count, locale, "modern", paperSize);
          const result = await extractPdf(draft);
          for (let index = 1; index <= count; index += 1) {
            expect(result.text).toContain(`Item-${String(index).padStart(3, "0")}`);
          }
          const totals = calculateTotals(draft);
          expect(result.text).toContain(normalizePdfText(formatMoney(totals.balance, draft.currency, locale)));
          expect(result.text).toContain("Société Élan");
          expect(result.text).toContain("André & Fils");
          expect(result.text).toContain("Fin des instructions.");
          expect(result.text).not.toContain("InvoiceTemplateMaker");
          expect(result.text).not.toContain("Created in your browser");
          for (const [width, height] of result.dimensions) {
            expect(width).toBeCloseTo(paperSize === "letter" ? 612 : 595.28, 1);
            expect(height).toBeCloseTo(paperSize === "letter" ? 792 : 841.89, 1);
          }
          result.pages.forEach((page, index) => expect(page).toContain(`Page ${index + 1} / ${result.pages.length}`));
          if (count >= 25) expect(result.pages.length).toBeGreaterThan(1);
        }, 15000);
      }
    }
  }

  for (const template of templateIds) {
    for (const locale of ["en", "fr"] as const) {
      it(`preserves text across pages and repeats table headings: ${template} ${locale}`, async () => {
        const draft = makeDraft(50, locale, template, "letter");
        const result = await extractPdf(draft);
        for (const page of result.pages.filter((text) => text.includes("Item-"))) {
          expect(page).toContain("Description");
          expect(page).toContain(locale === "fr" ? "Quantité" : "Quantity");
          expect(page).toContain(locale === "fr" ? "Prix unitaire" : "Unit Price");
        }
        expect(result.text).toContain("Item-050");
      }, 15000);
    }
  }

  it("preserves a description, address, and notes each longer than an entire page", async () => {
    const draft = makeDraft(1, "fr", "classic", "letter");
    draft.businessAddress = Array.from({ length: 90 }, (_, i) => `Adresse-${i + 1} : bâtiment de création, étage et coordonnées complètes.`).join("\n");
    draft.clientAddress = "Rue très longue " + "AdresseSansEspace".repeat(50) + " fin-client";
    draft.items[0].description = Array.from({ length: 110 }, (_, i) => `Prestation-${i + 1} — études détaillées, développement et vérifications.`).join("\n");
    draft.notes = Array.from({ length: 100 }, (_, i) => `Instruction-${i + 1} : règlement, référence bancaire et conditions détaillées.`).join("\n");
    const result = await extractPdf(draft);
    expect(result.pages.length).toBeGreaterThan(8);
    // Ignore running page labels and repeated headings when reconstructing
    // content split across a physical page boundary.
    const text = withoutSpaces(result.text)
      .replace(/Page\d+\/\d+/g, "")
      .replace(/Facture/g, "")
      .replace(/DescriptionQuantitéPrixunitaireTotal/g, "");
    expect(text).toContain(withoutSpaces(draft.businessAddress));
    expect(text).toContain(withoutSpaces(draft.clientAddress));
    expect(text).toContain(withoutSpaces(draft.notes));
    // Continuation page headings can occur within a split table row; every
    // original line must remain complete and in order between those headings.
    let position = 0;
    for (const line of draft.items[0].description.split("\n")) {
      const next = text.indexOf(withoutSpaces(line), position);
      expect(next).toBeGreaterThanOrEqual(position);
      position = next + withoutSpaces(line).length;
    }
  }, 15000);

  it.each(["MAD", "USD", "EUR", "JPY", "KWD"] as CurrencyCode[])("uses the shared financial totals in %s", async (currency) => {
    const draft = makeDraft(11, "fr", "minimal");
    Object.assign(draft, { currency, discountType: "percent", discountValue: 7.5, shipping: 2.35, deposit: 10, amountPaid: 3 });
    const totals = calculateTotals(draft);
    const result = await extractPdf(draft);
    for (const value of [totals.subtotal, totals.discount, totals.shipping, totals.tax, totals.total, totals.balance]) {
      expect(withoutSpaces(result.text)).toContain(withoutSpaces(normalizePdfText(formatMoney(value, currency, "fr"))));
    }
  }, 15000);
});

describe("measured PDF geometry", () => {
  it.each(templateIds.flatMap((template) => (["a4", "letter"] as const).map((paperSize) => [template, paperSize] as const)))("keeps %s %s text inside the page without collisions", (template, paperSize) => {
    const draft = makeDraft(100, "fr", template, paperSize);
    draft.notes = "Échéance, réception et règlement. ".repeat(100);
    const layout = createInvoiceLayout(draft, measure);
    for (const page of layout.pages) {
      const texts = page.operations.filter((operation): operation is TextOperation => operation.kind === "text");
      for (const text of texts) {
        expect(text.x).toBeGreaterThanOrEqual(43);
        expect(text.x + text.width).toBeLessThanOrEqual(layout.width - 43);
        expect(text.top).toBeGreaterThanOrEqual(44);
        expect(text.top + text.size).toBeLessThanOrEqual(layout.height - 25);
      }
      for (let i = 0; i < texts.length; i += 1) {
        for (let j = i + 1; j < texts.length; j += 1) {
          const a = texts[i], b = texts[j];
          const horizontal = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
          const vertical = Math.min(a.top + a.size, b.top + b.size) - Math.max(a.top, b.top);
          if (horizontal > .5 && vertical > .5) throw new Error(`Overlapping text: ${a.text} / ${b.text}`);
        }
      }
    }
  }, 15000);
});
