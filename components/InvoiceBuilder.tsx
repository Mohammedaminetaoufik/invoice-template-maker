"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Check, ChevronDown, Download, Plus, RotateCcw } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { calculateTotals, createDefaultDraft, cryptoSafeId, currencyCodes, formatDate, formatMoney, type CurrencyCode, type InvoiceDraft, type TemplateId } from "@/lib/invoice";
import { applyRequestedTemplate, DRAFT_STORAGE_KEY, parseStoredDraft, serializeDraft } from "@/lib/draft-storage";
import { InvoicePreview } from "./InvoicePreview";
import { LogoUpload } from "./LogoUpload";
import { TemplatePicker } from "./TemplatePicker";
import { getEditorCopy } from "@/lib/editor-copy";
import { isTemplate } from "@/lib/templates";
import { QuickEditNavigator } from "./QuickEditNavigator";
import { routeMap } from "@/lib/routes";
import { saveReminderPrefill } from "@/lib/reminder";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "working" | "done" | "error" | "validation" | "calculation" | "unsupported" | "saved" | "importError";

export function InvoiceBuilder({ locale, initialTemplate, prioritizeLogo = false, onResultChange }: { locale: Locale; initialTemplate?: TemplateId; prioritizeLogo?: boolean; onResultChange?: (completed: boolean) => void }) {
  const t = getDictionary(locale);
  const [draft, setDraft] = useState<InvoiceDraft>(() => ({ ...createDefaultDraft(locale), template: initialTemplate ?? "modern" }));
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>();
  const [logoBusy, setLogoBusy] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const heading = useRef<HTMLHeadingElement>(null);
  const copy = getEditorCopy(locale);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(prioritizeLogo);
  const [guidance, setGuidance] = useState(true);
  const [activeField, setActiveField] = useState<{ field: string; itemId?: string }>();
  const [downloadInitiated, setDownloadInitiated] = useState(false);
  const customizationTracked = useRef(false);
  const step = draft.wizardStep ?? 1;
  useEffect(() => { onResultChange?.(step === 3 && downloadInitiated); }, [step, downloadInitiated, onResultChange]);
  let total: number | undefined;
  try { total = calculateTotals(draft).balance; } catch { /* Display the localized calculation error below. */ }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      let restored = { ...createDefaultDraft(locale), template: initialTemplate ?? "modern" };
      if (saved) {
        try { restored = parseStoredDraft(saved, locale); }
        catch { localStorage.setItem("itm-invoice-draft-recovery", saved); }
      }
      const requested = new URLSearchParams(window.location.search).get("template");
      const next = applyRequestedTemplate(restored, requested);
      setDraft(isTemplate(requested) || (!saved && initialTemplate) ? { ...next, wizardStep: 2 } : next);
      if (isTemplate(requested)) trackEvent("invoice_template_selected", { template_id: requested, locale, source: "page_cta" });
    } catch { setStorageError(true); }
    setReady(true);
  }, [locale, initialTemplate]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [draft, ready]);

  const update = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => {
    // Keep the document editable when a numeric input exceeds the financial
    // engine's limits; reject the invalid change instead of losing its layout.
    try { calculateTotals({ ...draft, [key]: value }); }
    catch { setStatus("calculation"); return; }
    setDraft((current) => ({ ...current, [key]: value }));
    if (key !== "wizardStep" && key !== "template" && !customizationTracked.current) {
      customizationTracked.current = true;
      trackEvent("invoice_customization_started", { locale });
    }
    setStatus("idle");
  };
  const updateItem = (id: string, key: "description" | "quantity" | "rate", value: string | number) => update("items", draft.items.map((item) => item.id === id ? { ...item, [key]: value } : item));

  function validate() {
    const row = draft.items.find((item) => !item.description.trim());
    const missing = !draft.businessName.trim() ? { field: "businessName" } : !draft.clientName.trim() ? { field: "clientName" } : !draft.invoiceNumber.trim() ? { field: "invoiceNumber" } : formatDate(draft.issueDate, draft.documentLocale) === "—" ? { field: "issueDate" } : draft.dueDate && formatDate(draft.dueDate, draft.documentLocale) === "—" ? { field: "dueDate" } : row ? { field: "description", itemId: row.id } : undefined;
    if (missing) { update("wizardStep", 2); setActiveField(missing); setStatus("validation"); return false; }
    if (total === undefined) { setShowSettings(true); setStatus("calculation"); return false; }
    return true;
  }
  function goToStep(next: 1 | 2 | 3) {
    if (logoBusy || (next === 3 && !validate())) return;
    update("wizardStep", next); setActiveField(undefined);
    setTimeout(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); }, 0);
  }
  function editField(field: string, value: string, itemId?: string) {
    if (itemId) updateItem(itemId, field as "description" | "quantity" | "rate", field === "description" ? value : Number(value));
    else update(field as keyof InvoiceDraft, value);
  }
  function chooseTemplate(template: TemplateId) {
    if (logoBusy || status === "working") return;
    update("template", template);
    trackEvent("invoice_template_selected", { template_id: template, locale });
    if (step === 1) update("wizardStep", 2);
    setShowTemplates(false);
    setTimeout(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); }, 0);
  }

  async function handleDownload(print = false) {
    if (logoBusy) return;
    if (!validate()) return;
    // Open synchronously with the user's gesture to avoid a blocked popup.
    const printWindow = print ? window.open("", "_blank") : null;
    if (print && !printWindow) { setStatus("error"); return; }
    setStatus("working");
    try {
      const { downloadPdf, generateInvoicePdf } = await import("@/lib/pdf");
      const logo = draft.logoId ? await (await import("@/lib/logo")).loadLogo(draft.logoId) : undefined;
      const bytes = await generateInvoicePdf(draft, logo);
      if (printWindow) {
        const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
        printWindow.location.replace(url);
        printWindow.onload = () => { try { printWindow.print(); } catch { /* The PDF viewer's print control remains available. */ } };
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        downloadPdf(bytes, `${draft.invoiceNumber || "invoice"}.pdf`);
        trackEvent("invoice_pdf_download", { template_id: draft.template, locale });
      }
      update("wizardStep", 3); setStatus(print ? "idle" : "done");
      if (!print) setDownloadInitiated(true);
      setActiveField(undefined); setShowSettings(false); setShowTemplates(false);
    } catch (error) {
      printWindow?.close();
      setStatus(error instanceof Error && error.name === "UnsupportedInvoiceCharacterError" ? "unsupported" : "error");
    }
  }

  function saveDraft() {
    try { localStorage.setItem(DRAFT_STORAGE_KEY, serializeDraft(draft)); setStorageError(false); setStatus("saved"); }
    catch { setStorageError(true); }
  }

  async function backup() {
    try {
      const { createInvoiceBackup, downloadBackup } = await import("@/lib/backup");
      downloadBackup(await createInvoiceBackup(draft));
    } catch { setStatus("importError"); }
  }

  async function restore(file?: File) {
    if (!file) return;
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error("Backup too large");
      const { readInvoiceBackup } = await import("@/lib/backup");
      const recovered = await readInvoiceBackup(await file.text(), locale);
      if (!window.confirm(t.builder.importConfirm)) return;
      if (recovered.logo) await (await import("@/lib/logo")).saveLogo(recovered.logo);
      setDraft(recovered.draft); setStatus("saved"); setDownloadInitiated(false);
    } catch { setStatus("importError"); }
  }

  function resetDraft() {
    if (logoBusy) return;
    if (window.confirm(t.builder.resetConfirm)) {
      if (draft.logoId) import("@/lib/logo").then(({ deleteLogo }) => deleteLogo(draft.logoId!)).catch(() => {});
      setDraft(createDefaultDraft(locale)); setStatus("idle"); setDownloadInitiated(false);
    }
  }

  function openReminder() {
    if (total === undefined || total <= 0) return;
    saveReminderPrefill(sessionStorage, {
      clientName: draft.clientName,
      businessName: draft.businessName,
      invoiceNumber: draft.invoiceNumber,
      outstandingBalance: total,
      currency: draft.currency,
      dueDate: draft.dueDate,
      senderSignature: draft.businessName,
    });
    trackEvent("invoice_to_reminder", { locale });
    window.location.assign(routeMap.reminder[locale]);
  }

  function textField(key: "businessName" | "clientName" | "businessEmail" | "clientEmail" | "invoiceNumber" | "issueDate" | "dueDate" | "iban" | "swift" | "purchaseOrder" | "paymentTerms" | "siren" | "siret" | "vatNumber" | "ice" | "taxIdentifier" | "commercialRegister" | "registrationNumber", label: string, type = "text") {
    return <label key={key}><span>{label}</span><input type={type} value={draft[key] ?? ""} onChange={(event) => update(key, event.target.value)} /></label>;
  }
  function numericField(key: "taxRate" | "discountValue" | "shipping" | "deposit" | "amountPaid", label: string, max?: number) {
    return <label key={key}><span>{label}</span><input type="number" min="0" max={max} step="any" value={draft[key] ?? 0} onChange={(event) => update(key, Number(event.target.value))} /></label>;
  }
  const message = status === "validation" ? copy.validation : status === "calculation" ? t.builder.calculationError : status === "unsupported" ? t.builder.unsupportedCharacters : status === "importError" ? t.builder.importError : status === "error" ? t.builder.error : status === "saved" ? t.builder.draftSaved : status === "done" ? copy.initiated : "";

  return <section className="builder-section visual-workspace" id="generator">
    <div className="shell builder-heading"><div><span className="eyebrow">{t.builder.eyebrow}</span><h2 ref={heading} tabIndex={-1}>{step === 1 ? copy.chooseFirst : step === 3 ? copy.ready : t.builder.title}</h2></div><span className="saved-indicator" role="status"><Check size={14} />{storageError ? t.builder.storageError : ready ? t.builder.saved : ""}</span></div>
    <div className="shell">
      {(step === 1 || showTemplates) && <TemplatePicker locale={locale} selected={step === 1 ? undefined : draft.template} onChoose={chooseTemplate} onClose={step === 1 ? undefined : () => setShowTemplates(false)} />}
      {step !== 1 && <>
        <div className="editor-toolbar">
          <button type="button" className="button button-ghost" disabled={logoBusy || status === "working"} onClick={() => setShowTemplates(!showTemplates)}>{copy.change}</button>
          {prioritizeLogo && step === 2 && <button type="button" className="button button-ghost logo-shortcut" disabled={logoBusy || status === "working"} onClick={() => { setShowSettings(true); setActiveField({ field: "logo" }); }}>{locale === "fr" ? "Importer mon logo" : "Upload my logo"}</button>}
          {step === 2 && <button type="button" className="button button-ghost" onClick={() => setShowSettings(!showSettings)} aria-expanded={showSettings}>{copy.advanced}</button>}
          {step === 3 && <button type="button" className="button button-ghost" disabled={logoBusy || status === "working"} onClick={() => goToStep(2)}>{copy.edit}</button>}
          {step === 2 && <button type="button" className="button button-ghost" disabled={logoBusy || status === "working"} onClick={() => goToStep(3)}>{copy.review}</button>}
          <button type="button" className="button" disabled={status === "working" || logoBusy} onClick={() => handleDownload()}><Download size={18} />{status === "working" ? t.builder.downloading : step === 3 && downloadInitiated ? copy.again : copy.download}</button>
        </div>
        {guidance && step === 2 && <div className="editor-guidance"><p>{copy.hint}</p><button type="button" className="text-button" onClick={() => setGuidance(false)} aria-label={copy.dismiss}>×</button></div>}
        {message && <p className={`form-status status-${status}`} role={["validation", "error", "calculation", "unsupported"].includes(status) ? "alert" : "status"}>{message}</p>}
        {total === undefined && status !== "calculation" && <p className="form-status status-error" role="alert">{t.builder.calculationError}</p>}
      </>}
      <div className={`visual-editor-layout ${showSettings && step === 2 ? "with-settings" : ""}`}>
        {step !== 1 && <div className="document-canvas">
          {step === 2 && <QuickEditNavigator locale={locale} draft={draft} disabled={status === "working"} onSelect={setActiveField} />}
          <InvoicePreview draft={draft} logoUrl={logoUrl} editing={step === 2 && status !== "working" ? { locale, active: activeField,
            onSelect: (region) => { setActiveField({ field: region.field, itemId: region.itemId }); if (region.field === "logo") setShowSettings(true); },
            onChange: editField, onClose: () => setActiveField(undefined),
            onRemove: (id) => { update("items", draft.items.filter((item) => item.id !== id)); setActiveField(undefined); },
          } : undefined} />
          {step === 2 && <div className="document-actions"><button type="button" className="button button-ghost" disabled={status === "working"} onClick={() => { const id = cryptoSafeId(); update("items", [...draft.items, { id, description: "", quantity: 1, rate: 0 }]); setActiveField({ field: "description", itemId: id }); }}><Plus size={16} />{t.builder.addItem}</button><p>{t.builder.currentTotal}: <strong>{total === undefined ? "—" : formatMoney(total, draft.currency, locale)}</strong></p></div>}
        </div>}
        <aside className="invoice-form advanced-panel" hidden={!showSettings || step !== 2} aria-label={copy.advanced}>
          <fieldset disabled={status === "working"}>
          <div className="form-title-row"><h3>{copy.advanced}</h3><button type="button" className="text-button" onClick={() => { setShowSettings(false); setActiveField(undefined); }}>{copy.close}</button></div>
          <LogoUpload locale={locale} logoId={draft.logoId} onChange={(id) => update("logoId", id)} onPreview={setLogoUrl} onBusyChange={setLogoBusy} focusRequested={activeField?.field === "logo" && showSettings} />
          <label><span>{t.builder.currency}</span><select value={draft.currency} onChange={(event) => update("currency", event.target.value as CurrencyCode)}>{currencyCodes.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <div className="form-grid">
            <label><span>{t.builder.documentLanguage}</span><select aria-label={t.builder.documentLanguage} value={draft.documentLocale} onChange={(event) => update("documentLocale", event.target.value as Locale)}><option value="en">English</option><option value="fr">Français</option></select><small>{t.builder.documentLanguageHelp}</small></label>
            <label><span>{t.builder.paperSize}</span><select value={draft.paperSize ?? "a4"} onChange={(event) => update("paperSize", event.target.value as "a4" | "letter")}><option value="a4">A4</option><option value="letter">{t.builder.letter}</option></select></label>
          </div>
          <details className="settings"><summary>{t.builder.advanced}<ChevronDown size={18} /></summary><div className="settings-content">
            <div className="form-grid">{numericField("taxRate", `${t.builder.tax} (%)`, 100)}
              <label><span>{t.builder.discountType}</span><select value={draft.discountType ?? "fixed"} onChange={(event) => update("discountType", event.target.value as "fixed" | "percent")}><option value="fixed">{t.builder.fixedDiscount}</option><option value="percent">{t.builder.percentDiscount}</option></select></label>
              {numericField("discountValue", t.builder.discountValue + (draft.discountType === "percent" ? " (%)" : ""), draft.discountType === "percent" ? 100 : undefined)}
              {numericField("shipping", t.builder.shipping)}{numericField("deposit", t.builder.deposit)}{numericField("amountPaid", t.builder.amountPaid)}
              {textField("iban", t.builder.iban)}{textField("swift", t.builder.swift)}{textField("purchaseOrder", t.builder.purchaseOrder)}{textField("paymentTerms", t.builder.paymentTerms)}
              <label><span>{t.builder.registrationRegion}</span><select value={draft.registrationRegion ?? "generic"} onChange={(event) => update("registrationRegion", event.target.value as "generic" | "france" | "morocco")}><option value="generic">{t.builder.genericRegion}</option><option value="france">{t.builder.france}</option><option value="morocco">{t.builder.morocco}</option></select></label>
              {draft.registrationRegion === "france" ? <>{textField("siren", t.builder.siren)}{textField("siret", t.builder.siret)}{textField("vatNumber", t.builder.vatNumber)}</> : draft.registrationRegion === "morocco" ? <>{textField("ice", t.builder.ice)}{textField("taxIdentifier", t.builder.taxIdentifier)}{textField("commercialRegister", t.builder.commercialRegister)}</> : <>{textField("registrationNumber", t.builder.registrationNumber)}{textField("taxIdentifier", t.builder.taxIdentifier)}{textField("vatNumber", t.builder.vatNumber)}</>}
              <label className="wide"><span>{t.builder.businessIdentifiers}</span><textarea rows={3} value={draft.businessIdentifiers ?? ""} onChange={(event) => update("businessIdentifiers", event.target.value)} placeholder="SIRET : … / ICE : …" /><small>{t.builder.identifiersHelp}</small></label>
              <label><span>{t.builder.accent}</span><input type="color" value={draft.accent} onChange={(event) => update("accent", event.target.value)} /></label>
              <label className="wide"><span>{t.builder.notes}</span><textarea rows={4} value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder={t.builder.notesPlaceholder} /></label>
            </div>
          </div></details>

          <div className="draft-actions"><button type="button" className="text-button" disabled={logoBusy || status === "working"} onClick={resetDraft}><RotateCcw size={14} />{t.builder.reset}</button><button type="button" className="text-button" onClick={saveDraft}>{t.builder.saveDraft}</button><button type="button" className="text-button" disabled={status === "working" || logoBusy} onClick={() => handleDownload(true)}>{t.builder.print}</button></div>
          <details className="backup-controls"><summary>{t.builder.saveDraft}</summary><button type="button" className="text-button" onClick={backup}>{t.builder.exportDraft}</button><label><span>{t.builder.importDraft}</span><input type="file" accept="application/json,.json" disabled={logoBusy} onChange={(event) => { restore(event.target.files?.[0]); event.target.value = ""; }} /></label></details>
          </fieldset>
        </aside>
      </div>
      {step === 3 && <aside className="reminder-handoff" aria-labelledby="reminder-handoff-title"><BellRing aria-hidden="true" /><div><h3 id="reminder-handoff-title">{locale === "fr" ? "Un paiement tarde ?" : "Payment running late?"}</h3><p>{total === 0 ? (locale === "fr" ? "Cette facture est entièrement réglée : aucune relance n’est nécessaire." : "This invoice is paid in full, so no reminder is needed.") : (locale === "fr" ? "Réutilisez localement le client, le numéro, l’échéance, la devise et le solde restant. Vous pourrez tout modifier avant l’envoi." : "Reuse the client, number, due date, currency, and remaining balance locally. You can edit everything before sending.")}</p></div><button type="button" className="button" disabled={total === undefined || total <= 0} onClick={openReminder}>{locale === "fr" ? "Créer une relance de paiement" : "Create a payment reminder"}</button></aside>}
    </div>
  </section>;
}
