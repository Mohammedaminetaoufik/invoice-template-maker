import type { Locale } from "./i18n";
import { currencyCodes, formatDate, formatMoney, type CurrencyCode } from "./invoice";

export const REMINDER_PREFILL_KEY = "itm-payment-reminder-prefill-v1";
export const reminderTones = ["friendly", "professional", "firm"] as const;
export type ReminderTone = (typeof reminderTones)[number];
export type DueStatus = "overdue" | "today" | "future" | "unknown" | "paid";

export interface ReminderDetails {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  outstandingBalance: number;
  currency: CurrencyCode;
  dueDate: string;
  senderSignature: string;
  paymentInstructions: string;
  tone: ReminderTone;
}

export interface ReminderMessage {
  subject: string;
  body: string;
  full: string;
  dueStatus: DueStatus;
  canSend: boolean;
  notice?: string;
}

export type ReminderPrefill = Pick<ReminderDetails, "clientName" | "businessName" | "invoiceNumber" | "outstandingBalance" | "currency" | "dueDate" | "senderSignature"> & Partial<Pick<ReminderDetails, "paymentInstructions" | "tone">>;

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function inline(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

export function localIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function reminderDueStatus(balance: number, dueDate: string, today = localIsoDate()): DueStatus {
  if (balance === 0) return "paid";
  if (!validDate(dueDate) || !validDate(today)) return "unknown";
  if (dueDate === today) return "today";
  return dueDate < today ? "overdue" : "future";
}

export function parseReminderAmount(value: string) {
  if (!value.trim()) return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 1e12 ? amount : undefined;
}

function invoiceLabel(locale: Locale, invoiceNumber: string) {
  const number = inline(invoiceNumber);
  return number
    ? locale === "fr" ? `la facture ${number}` : `invoice ${number}`
    : locale === "fr" ? "la facture concernée" : "the invoice";
}

function subject(locale: Locale, tone: ReminderTone, invoiceNumber: string, status: DueStatus) {
  const number = inline(invoiceNumber);
  const suffix = number ? (locale === "fr" ? ` — Facture ${number}` : ` — Invoice ${number}`) : "";
  if (locale === "fr") {
    if (status === "future" || status === "today") return `Rappel de paiement${suffix}`;
    return `${tone === "friendly" ? "Rappel cordial" : tone === "professional" ? "Relance de paiement" : "Dernière relance de paiement"}${suffix}`;
  }
  if (status === "future" || status === "today") return `Payment reminder${suffix}`;
  return `${tone === "friendly" ? "Friendly reminder" : tone === "professional" ? "Payment follow-up" : "Final payment reminder"}${suffix}`;
}

function englishBody(details: ReminderDetails, status: DueStatus) {
  const invoice = invoiceLabel("en", details.invoiceNumber);
  const amount = formatMoney(details.outstandingBalance, details.currency, "en");
  const date = validDate(details.dueDate) ? formatDate(details.dueDate, "en") : "";
  const clientName = inline(details.clientName);
  const greeting = clientName ? `Hi ${clientName},` : "Hello,";
  const opening = status === "future"
    ? `I'm writing with a reminder about ${invoice} for ${amount}, which is due on ${date}.`
    : status === "today"
      ? `I'm writing about ${invoice} for ${amount}, which is due today.`
      : status === "overdue"
        ? `I'm following up regarding ${invoice} for ${amount}, which was due on ${date}.`
        : `I'm following up regarding ${invoice} for ${amount}.`;
  const request = status === "future"
    ? (details.tone === "firm" ? "Please make sure payment is arranged by the due date." : "Please let me know if you need anything from me before the due date.")
    : status === "today"
      ? (details.tone === "firm" ? "Please arrange payment today or let me know immediately if there is an issue." : "Could you please confirm that payment is scheduled for today?")
      : details.tone === "friendly"
        ? "Could you please confirm when payment can be expected?"
        : details.tone === "professional"
          ? "Please confirm the payment status and the date payment will be completed."
          : "Please arrange payment promptly and confirm the expected payment date.";
  const followUp = details.tone === "firm"
    ? "If payment has already been sent, please share the payment confirmation so I can update my records."
    : "If you've already arranged payment, please disregard this reminder.";
  const instructions = details.paymentInstructions.trim() ? `Payment instructions: ${details.paymentInstructions.trim()}` : "";
  const thanks = details.tone === "firm" ? "Thank you for your prompt attention to this matter." : "Thank you!";
  const signOff = inline(details.senderSignature) || inline(details.businessName);
  return [greeting, "", opening, "", request, instructions ? `\n${instructions}` : "", "", followUp, "", thanks, signOff ? `\nBest regards,\n${signOff}` : ""].filter((line, index, values) => line !== "" || (index > 0 && values[index - 1] !== "")).join("\n").trim();
}

function frenchBody(details: ReminderDetails, status: DueStatus) {
  const invoice = invoiceLabel("fr", details.invoiceNumber);
  const amount = formatMoney(details.outstandingBalance, details.currency, "fr");
  const date = validDate(details.dueDate) ? formatDate(details.dueDate, "fr") : "";
  const clientName = inline(details.clientName);
  const greeting = clientName ? `Bonjour ${clientName},` : "Bonjour,";
  const opening = status === "future"
    ? `Je vous écris au sujet de ${invoice}, d'un montant de ${amount}, dont l'échéance est fixée au ${date}.`
    : status === "today"
      ? `Je vous écris au sujet de ${invoice}, d'un montant de ${amount}, qui arrive à échéance aujourd'hui.`
      : status === "overdue"
        ? `Je me permets de vous relancer au sujet de ${invoice}, d'un montant de ${amount}, arrivée à échéance le ${date}.`
        : `Je me permets de vous contacter au sujet de ${invoice}, d'un montant de ${amount}.`;
  const request = status === "future"
    ? (details.tone === "firm" ? "Merci de veiller à ce que le règlement soit effectué avant la date d'échéance." : "N'hésitez pas à me signaler si vous avez besoin d'un document avant l'échéance.")
    : status === "today"
      ? (details.tone === "firm" ? "Merci d'effectuer le règlement aujourd'hui ou de me signaler rapidement toute difficulté." : "Pouvez-vous me confirmer que le règlement est bien prévu aujourd'hui ?")
      : details.tone === "friendly"
        ? "Pourriez-vous me confirmer la date prévue du règlement ?"
        : details.tone === "professional"
          ? "Merci de me confirmer le statut du règlement ainsi que la date à laquelle il sera effectué."
          : "Merci de procéder au règlement rapidement et de me confirmer la date de paiement prévue.";
  const followUp = details.tone === "firm"
    ? "Si le paiement a déjà été envoyé, merci de me transmettre le justificatif afin que je mette mes dossiers à jour."
    : "Si le règlement a déjà été effectué, vous pouvez ne pas tenir compte de ce message.";
  const instructions = details.paymentInstructions.trim() ? `Modalités de paiement : ${details.paymentInstructions.trim()}` : "";
  const thanks = details.tone === "firm" ? "Je vous remercie de votre attention rapide à ce sujet." : "Merci par avance.";
  const signOff = inline(details.senderSignature) || inline(details.businessName);
  return [greeting, "", opening, "", request, instructions ? `\n${instructions}` : "", "", followUp, "", thanks, signOff ? `\nCordialement,\n${signOff}` : ""].filter((line, index, values) => line !== "" || (index > 0 && values[index - 1] !== "")).join("\n").trim();
}

export function generateReminder(details: ReminderDetails, locale: Locale, today = localIsoDate()): ReminderMessage {
  const dueStatus = reminderDueStatus(details.outstandingBalance, details.dueDate, today);
  if (dueStatus === "paid") {
    const notice = locale === "fr"
      ? "Cette facture ne présente aucun solde restant. Aucune relance de paiement n'est nécessaire."
      : "This invoice has no outstanding balance. A payment reminder is not needed.";
    return { subject: "", body: notice, full: notice, dueStatus, canSend: false, notice };
  }
  const messageSubject = subject(locale, details.tone, details.invoiceNumber, dueStatus);
  const body = locale === "fr" ? frenchBody(details, dueStatus) : englishBody(details, dueStatus);
  return { subject: messageSubject, body, full: `${locale === "fr" ? "Objet :" : "Subject:"} ${messageSubject}\n\n${body}`, dueStatus, canSend: true };
}

function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && currencyCodes.includes(value as CurrencyCode);
}

export function saveReminderPrefill(storage: Pick<Storage, "setItem">, prefill: ReminderPrefill) {
  try { storage.setItem(REMINDER_PREFILL_KEY, JSON.stringify(prefill)); return true; }
  catch { return false; }
}

export function takeReminderPrefill(storage: Pick<Storage, "getItem" | "removeItem">): ReminderPrefill | undefined {
  try {
    const json = storage.getItem(REMINDER_PREFILL_KEY);
    storage.removeItem(REMINDER_PREFILL_KEY);
    if (!json || json.length > 20_000) return undefined;
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== "object") return undefined;
    const candidate = value as Partial<ReminderPrefill>;
    if ([candidate.clientName, candidate.businessName, candidate.invoiceNumber, candidate.dueDate, candidate.senderSignature].some((item) => typeof item !== "string") || typeof candidate.outstandingBalance !== "number" || !Number.isFinite(candidate.outstandingBalance) || candidate.outstandingBalance < 0 || candidate.outstandingBalance > 1e12 || !isCurrency(candidate.currency) || (candidate.paymentInstructions !== undefined && typeof candidate.paymentInstructions !== "string") || (candidate.tone !== undefined && !reminderTones.includes(candidate.tone))) return undefined;
    return candidate as ReminderPrefill;
  } catch { return undefined; }
}
