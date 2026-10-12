import type { Locale } from "./i18n";

export type TemplateId = "modern" | "minimal" | "classic";
export type CurrencyCode = "USD" | "EUR" | "MAD" | "CAD" | "GBP" | "CHF";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceDraft {
  businessName: string;
  businessEmail: string;
  businessAddress: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  currency: CurrencyCode;
  taxRate: number;
  documentLocale: Locale;
  template: TemplateId;
  accent: string;
  notes: string;
}

function isoDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function createDefaultDraft(locale: Locale): InvoiceDraft {
  return {
    businessName: "",
    businessEmail: "",
    businessAddress: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    invoiceNumber: `INV-${new Date().getFullYear()}-001`,
    issueDate: isoDate(),
    dueDate: isoDate(14),
    items: [{ id: cryptoSafeId(), description: "", quantity: 1, rate: 0 }],
    currency: locale === "fr" ? "EUR" : "USD",
    taxRate: 0,
    documentLocale: locale,
    template: "modern",
    accent: "#ec6d3f",
    notes: "",
  };
}

export function cryptoSafeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function calculateTotals(draft: InvoiceDraft) {
  const subtotal = draft.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = subtotal * (draft.taxRate / 100);
  return { subtotal, tax, total: subtotal + tax };
}

export function formatMoney(value: number, currency: CurrencyCode, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string, locale: Locale) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
