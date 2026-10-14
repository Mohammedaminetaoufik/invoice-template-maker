import { describe, expect, it } from "vitest";
import { applyRequestedTemplate, parseStoredDraft, serializeDraft } from "@/lib/draft-storage";
import { createDefaultDraft } from "@/lib/invoice";

describe("safe draft restoration for the PDF and financial additions", () => {
  it("round-trips version 2 including wizard progress and new business fields", () => {
    const draft = { ...createDefaultDraft("fr"), wizardStep: 3 as const, logoId: "test-logo", businessIdentifiers: "ICE 123", iban: "EXAMPLE", purchaseOrder: "PO-123", discountValue: 5, template: "corporate" as const, registrationRegion: "france" as const, siren: "001234567", siret: "00123456700012" };
    expect(parseStoredDraft(serializeDraft(draft), "en")).toEqual(draft);
  });
  it("rejects unsupported future versions and malformed wizard progress", () => {
    expect(() => parseStoredDraft(JSON.stringify({ version: 3, draft: createDefaultDraft("en") }), "en")).toThrow();
    expect(() => parseStoredDraft(JSON.stringify({ ...createDefaultDraft("en"), wizardStep: "3" }), "en")).toThrow();
  });
  it("migrates legacy drafts without changing the chosen PDF language", () => {
    const legacy = createDefaultDraft("fr");
    delete legacy.paperSize;
    delete legacy.discountType;
    delete legacy.discountValue;
    legacy.clientName = "André";
    const restored = parseStoredDraft(JSON.stringify(legacy), "en");
    expect(restored).toMatchObject({ clientName: "André", documentLocale: "fr", currency: "EUR", paperSize: "a4", discountType: "fixed", discountValue: 0 });
  });
  it("lets an intentional gallery selection override the saved template only", () => {
    const original = { ...createDefaultDraft("fr"), clientName: "Société Élan", template: "classic" as const, shipping: 20 };
    expect(applyRequestedTemplate(original, "minimal")).toEqual({ ...original, template: "minimal" });
  });
  it("ignores unsupported gallery template values", () => {
    const original = createDefaultDraft("en");
    expect(applyRequestedTemplate(original, "invalid")).toBe(original);
  });
  it.each(["null", "[]", "{}", "not-json", '{"items":[null]}'])("rejects malformed draft %s", (json) => {
    expect(() => parseStoredDraft(json, "en")).toThrow();
  });
  it("rejects tampered colours, amounts and item structures", () => {
    const draft = createDefaultDraft("en");
    expect(() => parseStoredDraft(JSON.stringify({ ...draft, accent: "bad" }), "en")).toThrow();
    expect(() => parseStoredDraft(JSON.stringify({ ...draft, taxRate: -5 }), "en")).toThrow();
    expect(() => parseStoredDraft(JSON.stringify({ ...draft, items: [draft.items[0], draft.items[0]] }), "en")).toThrow();
  });
});
