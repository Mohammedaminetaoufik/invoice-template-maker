import type { Locale } from "./i18n";

export type { TemplateId } from "./templates";
import type { TemplateId } from "./templates";
export const currencyCodes = ["USD", "EUR", "MAD", "CAD", "GBP", "CHF", "JPY", "KWD"] as const;
export type CurrencyCode = (typeof currencyCodes)[number];
export type PaperSize = "a4" | "letter";

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
  paperSize?: PaperSize;
  discountType?: "fixed" | "percent";
  discountValue?: number;
  shipping?: number;
  deposit?: number;
  amountPaid?: number;
  logoId?: string;
  wizardStep?: 1 | 2 | 3;
  businessIdentifiers?: string;
  iban?: string;
  swift?: string;
  purchaseOrder?: string;
  paymentTerms?: string;
  registrationRegion?: "generic" | "france" | "morocco";
  siren?: string;
  siret?: string;
  vatNumber?: string;
  ice?: string;
  taxIdentifier?: string;
  commercialRegister?: string;
  registrationNumber?: string;
}

function isoDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
    paperSize: "a4",
    discountType: "fixed",
    discountValue: 0,
    shipping: 0,
    deposit: 0,
    amountPaid: 0,
    wizardStep: 1,
    businessIdentifiers: "",
    iban: "",
    swift: "",
    purchaseOrder: "",
    paymentTerms: "",
    registrationRegion: "generic",
    siren: "", siret: "", vatNumber: "", ice: "", taxIdentifier: "", commercialRegister: "", registrationNumber: "",
  };
}

export function cryptoSafeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export { calculateTotals, calculateLineAmount } from "./finance";

export function formatMoney(value: number, currency: CurrencyCode, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency,
  }).format(value);
}

// Unit prices may have more decimal places than a rounded payable amount.
// Keep those entered digits visible so quantity × price remains explainable.
export function formatUnitPrice(value: number, currency: CurrencyCode, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency", currency, maximumFractionDigits: 20,
  }).format(value);
}

export function formatDate(value: string, locale: Locale) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "—";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
