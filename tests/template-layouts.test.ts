import { describe, expect, it } from "vitest";
import { createInvoiceLayout } from "@/lib/pdf-layout";
import { createDefaultDraft } from "@/lib/invoice";
import { templateIds } from "@/lib/templates";

describe("template layout variety", () => {
  it("offers eight distinct layout plans rather than eight accent colours", () => {
    const plans = templateIds.map((template) => {
      const draft = { ...createDefaultDraft("en"), template, businessName: "Example", clientName: "Client" };
      return JSON.stringify(createInvoiceLayout(draft, (text, size) => text.length * size * .5));
    });
    expect(templateIds).toHaveLength(8);
    expect(new Set(plans).size).toBe(8);
  });
});
