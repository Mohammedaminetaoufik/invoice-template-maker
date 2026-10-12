import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n";

describe("PDF translations", () => {
  it("provides the required English labels", () => {
    expect(Object.values(dictionaries.en.pdf)).toEqual(expect.arrayContaining(["Invoice", "Invoice Number", "Bill To", "Invoice Date", "Due Date", "Description", "Quantity", "Unit Price", "Subtotal", "Tax", "Total", "Amount Due"]));
  });

  it("provides accented French labels", () => {
    expect(Object.values(dictionaries.fr.pdf)).toEqual(expect.arrayContaining(["Facture", "Numéro de facture", "Facturé à", "Date de facturation", "Date d’échéance", "Description", "Quantité", "Prix unitaire", "Sous-total", "TVA / Taxe applicable", "Total", "Montant à payer"]));
  });
});
