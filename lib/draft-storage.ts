import type { Locale } from "./i18n";
import { calculateTotals, createDefaultDraft, currencyCodes, type InvoiceDraft, type LineItem } from "./invoice";
import { isTemplate } from "./templates";

export const DRAFT_STORAGE_KEY = "itm-invoice-draft-v1";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Preserve existing v1 drafts while filling newly introduced optional fields.
// Malformed structures are rejected, not assigned directly to React state.
export function parseStoredDraft(json: string, locale: Locale): InvoiceDraft {
  const input: unknown = JSON.parse(json);
  if (!record(input)) throw new Error("Invalid invoice draft");
  const source = input.version === 2 ? input.draft : input;
  if (input.version !== undefined && input.version !== 2) throw new Error("Unsupported draft version");
  if (!record(source)) throw new Error("Invalid invoice draft");
  return validateDraft(source, locale);
}

function validateDraft(input: Record<string, unknown>, locale: Locale): InvoiceDraft {
  const defaults = createDefaultDraft(locale);
  const draft = { ...defaults };
  const stringKeys = ["businessName", "businessEmail", "businessAddress", "clientName", "clientEmail", "clientAddress", "invoiceNumber", "issueDate", "dueDate", "notes"] as const;
  for (const key of stringKeys) {
    if (typeof input[key] !== "string") throw new Error(`Invalid draft field: ${key}`);
    draft[key] = input[key];
  }
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("Invalid draft items");
  const ids = new Set<string>();
  draft.items = input.items.map((item: unknown): LineItem => {
    if (!record(item) || typeof item.id !== "string" || !item.id || ids.has(item.id) || typeof item.description !== "string") throw new Error("Invalid line item");
    ids.add(item.id);
    if (typeof item.quantity !== "number" || typeof item.rate !== "number" || !Number.isFinite(item.quantity) || !Number.isFinite(item.rate) || item.quantity < 0 || item.rate < 0 || item.quantity > 1e12 || item.rate > 1e12) throw new Error("Invalid line item amount");
    return { id: item.id, description: item.description, quantity: item.quantity, rate: item.rate };
  });
  if (!currencyCodes.includes(input.currency as InvoiceDraft["currency"])) throw new Error("Invalid currency");
  draft.currency = input.currency as InvoiceDraft["currency"];
  if (input.documentLocale !== "en" && input.documentLocale !== "fr") throw new Error("Invalid document language");
  draft.documentLocale = input.documentLocale;
  if (!isTemplate(input.template)) throw new Error("Invalid template");
  draft.template = input.template as InvoiceDraft["template"];
  if (typeof input.accent !== "string" || !/^#[0-9a-f]{6}$/i.test(input.accent)) throw new Error("Invalid accent");
  draft.accent = input.accent;
  for (const key of ["taxRate", "discountValue", "shipping", "deposit", "amountPaid"] as const) {
    const value = input[key] ?? defaults[key] ?? 0;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e12) throw new Error(`Invalid ${key}`);
    draft[key] = value;
  }
  if (draft.taxRate > 100) throw new Error("Invalid tax rate");
  if (input.discountType !== undefined && input.discountType !== "fixed" && input.discountType !== "percent") throw new Error("Invalid discount type");
  draft.discountType = input.discountType as InvoiceDraft["discountType"] ?? "fixed";
  if (draft.discountType === "percent" && (draft.discountValue ?? 0) > 100) throw new Error("Invalid discount percentage");
  if (input.paperSize !== undefined && input.paperSize !== "a4" && input.paperSize !== "letter") throw new Error("Invalid paper size");
  draft.paperSize = input.paperSize as InvoiceDraft["paperSize"] ?? "a4";
  if (input.logoId !== undefined) {
    if (typeof input.logoId !== "string" || !/^[a-z0-9-]{1,100}$/i.test(input.logoId)) throw new Error("Invalid logo reference");
    draft.logoId = input.logoId;
  }
  if (input.wizardStep !== undefined && (typeof input.wizardStep !== "number" || ![1, 2, 3].includes(input.wizardStep))) throw new Error("Invalid wizard step");
  draft.wizardStep = input.wizardStep as 1 | 2 | 3 | undefined ?? 1;
  for (const key of ["businessIdentifiers", "iban", "swift", "purchaseOrder", "paymentTerms", "siren", "siret", "vatNumber", "ice", "taxIdentifier", "commercialRegister", "registrationNumber"] as const) {
    if (input[key] !== undefined && typeof input[key] !== "string") throw new Error(`Invalid ${key}`);
    draft[key] = input[key] as string | undefined ?? "";
  }
  if (input.registrationRegion !== undefined && !["generic", "france", "morocco"].includes(String(input.registrationRegion))) throw new Error("Invalid registration region");
  draft.registrationRegion = input.registrationRegion as InvoiceDraft["registrationRegion"] ?? "generic";
  calculateTotals(draft);
  return draft;
}

export function serializeDraft(draft: InvoiceDraft) {
  return JSON.stringify({ version: 2, draft });
}

export function applyRequestedTemplate(draft: InvoiceDraft, requested: string | null): InvoiceDraft {
  return isTemplate(requested)
    ? { ...draft, template: requested }
    : draft;
}
