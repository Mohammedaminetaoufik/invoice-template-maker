"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Mail, RotateCcw } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { currencyCodes, type CurrencyCode } from "@/lib/invoice";
import { generateReminder, parseReminderAmount, saveReminderPrefill, takeReminderPrefill, type ReminderDetails, type ReminderTone } from "@/lib/reminder";
import { routeMap } from "@/lib/routes";

type CopyTarget = "full" | "subject" | "body";

const copy = {
  en: {
    invoice: "Invoice information", client: "Client or company name", business: "Your business name (optional)", number: "Invoice number",
    balance: "Outstanding balance", currency: "Currency", due: "Due date", signature: "Sender signature (optional)", instructions: "Payment instructions (optional)",
    instructionsHint: "For example: bank transfer reference or a secure payment link.", style: "Reminder style", friendly: "Friendly reminder", professional: "Professional reminder", firm: "Firm reminder",
    friendlyHelp: "A warm first follow-up.", professionalHelp: "Neutral and direct.", firmHelp: "A clear final follow-up, without threats.", preview: "Live email preview",
    subject: "Subject", body: "Message", copyFull: "Copy full message", copySubject: "Copy subject", copyBody: "Copy body", email: "Open in email app", reset: "Reset form",
    copied: "Copied to clipboard.", copyError: "Copying was blocked. Select the text and copy it manually.", invalid: "Enter a valid outstanding balance of zero or more.",
    private: "Your entries stay in this browser. Nothing is sent automatically.", switch: "Français", paid: "Paid in full", statusFuture: "Upcoming payment", statusToday: "Due today", statusOverdue: "Overdue", statusUnknown: "Due date not supplied",
  },
  fr: {
    invoice: "Informations de la facture", client: "Client ou entreprise", business: "Votre entreprise (facultatif)", number: "Numéro de facture",
    balance: "Solde restant", currency: "Devise", due: "Date d’échéance", signature: "Signature (facultatif)", instructions: "Modalités de paiement (facultatif)",
    instructionsHint: "Par exemple : référence du virement ou lien de paiement sécurisé.", style: "Ton de la relance", friendly: "Relance cordiale", professional: "Relance professionnelle", firm: "Relance ferme",
    friendlyHelp: "Un premier rappel chaleureux.", professionalHelp: "Un suivi neutre et direct.", firmHelp: "Une dernière relance claire, sans menace.", preview: "Aperçu du mail",
    subject: "Objet", body: "Message", copyFull: "Copier le message complet", copySubject: "Copier l’objet", copyBody: "Copier le corps", email: "Ouvrir dans la messagerie", reset: "Réinitialiser",
    copied: "Copié dans le presse-papiers.", copyError: "La copie a été bloquée. Sélectionnez le texte et copiez-le manuellement.", invalid: "Saisissez un solde valide, supérieur ou égal à zéro.",
    private: "Vos données restent dans ce navigateur. Aucun message n’est envoyé automatiquement.", switch: "English", paid: "Facture réglée", statusFuture: "Échéance à venir", statusToday: "Échéance aujourd’hui", statusOverdue: "Facture échue", statusUnknown: "Échéance non renseignée",
  },
} as const;

function emptyDetails(locale: Locale): ReminderDetails {
  return { clientName: "", businessName: "", invoiceNumber: "", outstandingBalance: 0, currency: locale === "fr" ? "EUR" : "USD", dueDate: "", senderSignature: "", paymentInstructions: "", tone: "friendly" };
}

async function writeClipboard(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement("textarea");
  textarea.value = value; textarea.setAttribute("readonly", ""); textarea.style.position = "fixed"; textarea.style.opacity = "0";
  document.body.appendChild(textarea); textarea.select();
  const copied = document.execCommand("copy"); textarea.remove();
  if (!copied) throw new Error("Copy failed");
}

export function PaymentReminderGenerator({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [details, setDetails] = useState<ReminderDetails>(() => emptyDetails(locale));
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<"copied" | "error" | "">("");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const parsedAmount = parseReminderAmount(amount);

  useEffect(() => {
    const prefill = takeReminderPrefill(sessionStorage);
    if (!prefill) return;
    setDetails((current) => ({ ...current, ...prefill }));
    setAmount(String(prefill.outstandingBalance));
  }, []);

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  const message = useMemo(() => parsedAmount === undefined ? undefined : generateReminder({ ...details, outstandingBalance: parsedAmount }, locale), [details, locale, parsedAmount]);
  const statusLabel = message?.dueStatus === "paid" ? c.paid : message?.dueStatus === "future" ? c.statusFuture : message?.dueStatus === "today" ? c.statusToday : message?.dueStatus === "overdue" ? c.statusOverdue : c.statusUnknown;

  function update<K extends keyof ReminderDetails>(key: K, value: ReminderDetails[K]) { setDetails((current) => ({ ...current, [key]: value })); setFeedback(""); }
  async function handleCopy(target: CopyTarget) {
    if (!message?.canSend) return;
    try {
      await writeClipboard(target === "full" ? message.full : target === "subject" ? message.subject : message.body);
      setFeedback("copied");
    } catch { setFeedback("error"); }
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(""), 4000);
  }
  function reset() { setDetails(emptyDetails(locale)); setAmount(""); setFeedback(""); }
  function preserveForLanguageSwitch() {
    if (parsedAmount === undefined) return;
    saveReminderPrefill(sessionStorage, { ...details, outstandingBalance: parsedAmount });
  }

  const tones: Array<[ReminderTone, string, string]> = [["friendly", c.friendly, c.friendlyHelp], ["professional", c.professional, c.professionalHelp], ["firm", c.firm, c.firmHelp]];
  const mailto = message?.canSend ? `mailto:?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}` : undefined;

  return <section className="reminder-workspace" aria-label={locale === "fr" ? "Générateur de relance" : "Payment reminder generator"}>
    <div className="shell reminder-grid">
      <div className="reminder-panel reminder-form">
        <div className="reminder-panel-heading"><div><span className="eyebrow">01</span><h2>{c.invoice}</h2></div><a className="text-button" href={routeMap.reminder[locale === "en" ? "fr" : "en"]} onClick={preserveForLanguageSwitch}>{c.switch}</a></div>
        <div className="form-grid">
          <label><span>{c.client}</span><input value={details.clientName} maxLength={160} autoComplete="organization" onChange={(event) => update("clientName", event.target.value)} /></label>
          <label><span>{c.business}</span><input value={details.businessName} maxLength={160} onChange={(event) => update("businessName", event.target.value)} /></label>
          <label><span>{c.number}</span><input value={details.invoiceNumber} maxLength={100} onChange={(event) => update("invoiceNumber", event.target.value)} /></label>
          <label><span>{c.balance}</span><input type="number" min="0" step="any" inputMode="decimal" value={amount} aria-invalid={amount !== "" && parsedAmount === undefined} onChange={(event) => setAmount(event.target.value)} /></label>
          <label><span>{c.currency}</span><select value={details.currency} onChange={(event) => update("currency", event.target.value as CurrencyCode)}>{currencyCodes.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <label><span>{c.due}</span><input type="date" value={details.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></label>
          <label className="wide"><span>{c.signature}</span><input value={details.senderSignature} maxLength={160} onChange={(event) => update("senderSignature", event.target.value)} /></label>
          <label className="wide"><span>{c.instructions}</span><textarea rows={3} value={details.paymentInstructions} maxLength={1000} onChange={(event) => update("paymentInstructions", event.target.value)} /><small>{c.instructionsHint}</small></label>
        </div>
        <fieldset className="tone-fieldset"><legend>{c.style}</legend><div className="tone-grid">{tones.map(([tone, label, help]) => <label className={details.tone === tone ? "tone-card selected" : "tone-card"} key={tone}><input type="radio" name="tone" value={tone} checked={details.tone === tone} onChange={() => update("tone", tone)} /><span><strong>{label}</strong><small>{help}</small></span></label>)}</div></fieldset>
        <p className="privacy-inline">{c.private}</p>
      </div>

      <div className="reminder-panel reminder-preview" aria-live="polite">
        <div className="reminder-panel-heading"><div><span className="eyebrow">02</span><h2>{c.preview}</h2></div>{message && <span className={`due-badge due-${message.dueStatus}`}>{statusLabel}</span>}</div>
        {parsedAmount === undefined ? <div className="reminder-empty"><p>{c.invalid}</p></div> : message?.canSend ? <>
          <div className="email-preview"><div><span>{c.subject}</span><strong>{message.subject}</strong></div><div><span>{c.body}</span><pre>{message.body}</pre></div></div>
          <div className="reminder-actions"><button className="button" type="button" onClick={() => handleCopy("full")}><Copy size={17} />{c.copyFull}</button><button className="button button-ghost" type="button" onClick={() => handleCopy("subject")}>{c.copySubject}</button><button className="button button-ghost" type="button" onClick={() => handleCopy("body")}>{c.copyBody}</button><a className="button button-ghost" href={mailto}><Mail size={17} />{c.email}</a></div>
        </> : <div className="reminder-empty paid"><Check size={28} /><p>{message?.notice}</p></div>}
        <div className="reminder-footer"><button type="button" className="text-button" onClick={reset}><RotateCcw size={14} />{c.reset}</button><span role={feedback === "error" ? "alert" : "status"}>{feedback === "copied" ? c.copied : feedback === "error" ? c.copyError : ""}</span></div>
      </div>
    </div>
  </section>;
}
