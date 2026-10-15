import { describe, expect, it } from "vitest";
import { createDefaultDraft } from "@/lib/invoice";
import { createInvoiceLayout } from "@/lib/pdf-layout";
import { templateIds } from "@/lib/templates";
const measure = (text: string, size: number) => text.length * size * .58;
describe("document editing regions", () => {
  it.each(templateIds)("provides bounded semantic field targets for %s without writing placeholders to the draft", (template) => {
    const draft = { ...createDefaultDraft("en"), template };
    const layout = createInvoiceLayout(draft, measure, undefined, true);
    expect(layout.regions.map((region) => region.field)).toEqual(expect.arrayContaining(["logo", "businessName", "businessEmail", "businessAddress", "clientName", "invoiceNumber", "issueDate", "dueDate", "description", "quantity", "rate", "notes", "paymentTerms"]));
    for (const region of layout.regions) { expect(region.x).toBeGreaterThanOrEqual(0); expect(region.top).toBeGreaterThanOrEqual(0); expect(region.x + region.width).toBeLessThanOrEqual(layout.width + .001); expect(region.top + region.height).toBeLessThan(layout.height); }
    expect(draft.businessName).toBe("");
    expect(createInvoiceLayout(draft, measure).regions).toHaveLength(0);
  });
  it.each(["en", "fr"] as const)("uses identical editor and export drawing operations when %s fields are populated", (locale) => {
    const draft = { ...createDefaultDraft(locale), businessName: "Studio", businessEmail: "studio@example.test", businessAddress: "Address", clientName: "Client", clientEmail: "client@example.test", clientAddress: "Address", notes: "Notes", paymentTerms: "Terms", items: [{ id: "1", description: "Work", quantity: 2, rate: 10 }] };
    for (const template of templateIds) expect(createInvoiceLayout({ ...draft, template }, measure, undefined, true).pages).toEqual(createInvoiceLayout({ ...draft, template }, measure).pages);
  });
});
