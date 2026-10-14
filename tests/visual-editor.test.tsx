// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvoiceBuilder } from "@/components/InvoiceBuilder";
import { DRAFT_STORAGE_KEY, parseStoredDraft, serializeDraft } from "@/lib/draft-storage";
import { createDefaultDraft } from "@/lib/invoice";
import { templateIds } from "@/lib/templates";
import { getDictionary } from "@/lib/i18n";

vi.mock("@/lib/pdf", () => ({ generateInvoicePdf: vi.fn(async () => new Uint8Array([1])), downloadPdf: vi.fn() }));
beforeEach(() => {
  localStorage.clear(); history.replaceState({}, "", "/en/");
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const stored = () => parseStoredDraft(localStorage.getItem(DRAFT_STORAGE_KEY)!, "en");
async function start() {
  render(<InvoiceBuilder locale="en" />);
  await waitFor(() => expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Use this template: Modern Professional" }));
}
function edit(button: string, label: string, value: string) {
  fireEvent.click(screen.getAllByRole("button", { name: button })[0]);
  fireEvent.change(screen.getByLabelText(label, { selector: "input,textarea" }), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
}
describe("visual invoice workflow", () => {
  it.each(templateIds)("selects %s before asking for personal details", async (id) => {
    render(<InvoiceBuilder locale="en" />);
    await waitFor(() => expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Business or full name" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: `Use this template: ${getDictionary("en").builder.templates[id]}` }));
    expect(screen.getAllByRole("button", { name: "Business or full name" }).length).toBeGreaterThan(0);
    expect(stored()).toMatchObject({ template: id, wizardStep: 2, businessName: "", clientName: "", taxRate: 0 });
  });
  it("edits names and line-item cells on the document and autosaves", async () => {
    await start();
    edit("Business or full name", "Business or full name", "Élan Studio");
    edit("Client or company name", "Client or company name", "André");
    edit("Description (1)", "Description", "Design services");
    edit("Rate (1)", "Rate", "125.5");
    expect(stored()).toMatchObject({ businessName: "Élan Studio", clientName: "André" });
    expect(stored().items[0]).toMatchObject({ description: "Design services", rate: 125.5 });
    fireEvent.click(screen.getByRole("button", { name: "Review invoice" }));
    expect(screen.getByRole("heading", { name: "Your Invoice Is Ready" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Business or full name" })).toBeNull();
  });
  it("focuses the missing document field when reviewing an incomplete invoice", async () => {
    await start(); fireEvent.click(screen.getByRole("button", { name: "Review invoice" }));
    expect(screen.getByRole("alert").textContent).toContain("Complete the highlighted invoice field");
    expect(document.activeElement).toBe(screen.getByLabelText("Business or full name", { selector: "input" }));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("adds and removes rows through contextual document editing", async () => {
    await start(); fireEvent.click(screen.getByRole("button", { name: "Add line item" }));
    expect(stored().items).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Description", { selector: "textarea" }), { target: { value: "Second row" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));
    expect(stored().items).toHaveLength(1);
  });
  it.each(["invoiceNumber", "issueDate"] as const)("blocks export when %s is missing", async (field) => {
    const draft = { ...createDefaultDraft("en"), wizardStep: 2 as const, businessName: "Example Studio", clientName: "Example Client", items: [{ id: "1", description: "Example service", quantity: 1, rate: 100 }], [field]: "" };
    localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft));
    render(<InvoiceBuilder locale="en" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Download Invoice PDF" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Download Invoice PDF" }));
    expect(screen.getByRole("alert").textContent).toContain("Complete the highlighted invoice field");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByText(/PDF download initiated/)).toBeNull();
  });
  it("rejects invalid numeric edits without removing the document or saving invalid amounts", async () => {
    await start();
    fireEvent.click(screen.getAllByRole("button", { name: "Rate (1)" })[0]);
    fireEvent.change(screen.getByLabelText("Rate", { selector: "input" }), { target: { value: "-10" } });
    expect(stored().items[0].rate).toBe(0);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Check your amounts");
    fireEvent.change(screen.getByLabelText("Rate", { selector: "input" }), { target: { value: "10" } });
    expect(stored().items[0].rate).toBe(10);
  });
  it("preserves every draft field during template changes", async () => {
    const draft = { ...createDefaultDraft("en"), wizardStep: 2 as const, businessName: "Studio", clientName: "Client", documentLocale: "fr" as const, amountPaid: 20, shipping: 5, iban: "TEST-IBAN", notes: "Keep this", items: [{ id: "1", description: "Work", quantity: 2, rate: 100 }] };
    localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft));
    render(<InvoiceBuilder locale="en" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Change template" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Change template" }));
    fireEvent.click(screen.getByRole("button", { name: "Use this template: Elegant Premium" }));
    expect(stored()).toEqual({ ...draft, template: "elegant" });
  });
  it("restores all data and independent PDF language on the French interface", async () => {
    const draft = { ...createDefaultDraft("en"), businessName: "Studio", clientName: "Client", wizardStep: 3 as const, documentLocale: "en" as const, template: "elegant" as const, amountPaid: 20, shipping: 5, items: [{ id: "1", description: "Work", quantity: 1, rate: 100 }] };
    localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft)); render(<InvoiceBuilder locale="fr" />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Votre facture est prête" })).toBeTruthy());
    expect(stored()).toEqual(draft);
  });
  it("opens an intentionally selected gallery template without losing an existing customer", async () => {
    const draft = createDefaultDraft("en"); draft.clientName = "Keep this customer";
    localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft)); history.replaceState({}, "", "/en/?template=retail");
    render(<InvoiceBuilder locale="en" />);
    await waitFor(() => expect(stored().template).toBe("retail"));
    expect(stored()).toMatchObject({ clientName: "Keep this customer", wizardStep: 2 });
  });
  it("keeps the result visible and supports correction after download initiation", async () => {
    const draft = { ...createDefaultDraft("en"), businessName: "Studio", clientName: "Client", wizardStep: 3 as const, items: [{ id: "1", description: "Work", quantity: 1, rate: 100 }] };
    localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft)); render(<InvoiceBuilder locale="en" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Download Invoice PDF" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Download Invoice PDF" }));
    await waitFor(() => expect(screen.getByText(/PDF download initiated/)).toBeTruthy());
    expect(screen.getByRole("heading", { name: "Your Invoice Is Ready" })).toBeTruthy();
    const completed = stored();
    fireEvent.click(screen.getByRole("button", { name: "Change template" }));
    fireEvent.click(screen.getByRole("button", { name: "Use this template: Elegant Premium" }));
    expect(stored()).toEqual({ ...completed, template: "elegant" });
    expect(screen.getByRole("button", { name: "Download again" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit Invoice" }));
    edit("Client or company name", "Client or company name", "Corrected client");
    expect(stored().clientName).toBe("Corrected client");
    fireEvent.click(screen.getByRole("button", { name: "Download Invoice PDF" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Download again" })).toBeTruthy());
  });
  it("keeps a malformed draft recovery copy", async () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, "broken-json"); render(<InvoiceBuilder locale="en" />);
    await waitFor(() => expect(localStorage.getItem("itm-invoice-draft-recovery")).toBe("broken-json"));
    expect(() => stored()).not.toThrow();
  });
});
