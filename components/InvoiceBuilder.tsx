"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { createDefaultDraft, cryptoSafeId, type CurrencyCode, type InvoiceDraft, type TemplateId } from "@/lib/invoice";
import { downloadPdf, generateInvoicePdf } from "@/lib/pdf";
import { InvoicePreview } from "./InvoicePreview";

const STORAGE_KEY = "itm-invoice-draft-v1";

export function InvoiceBuilder({ locale, initialTemplate }: { locale: Locale; initialTemplate?: TemplateId }) {
  const t = getDictionary(locale);
  const [draft, setDraft] = useState<InvoiceDraft>(() => ({ ...createDefaultDraft(locale), template: initialTemplate ?? "modern" }));
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error" | "validation">("idle");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft(JSON.parse(saved));
      else {
        const requestedTemplate = new URLSearchParams(window.location.search).get("template");
        if (requestedTemplate === "modern" || requestedTemplate === "minimal" || requestedTemplate === "classic") {
          setDraft((current) => ({ ...current, template: requestedTemplate }));
        }
      }
    } catch { /* A malformed local draft falls back safely. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, ready]);

  const update = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateItem = (id: string, key: "description" | "quantity" | "rate", value: string | number) => update("items", draft.items.map((item) => item.id === id ? { ...item, [key]: value } : item));
  const addItem = () => update("items", [...draft.items, { id: cryptoSafeId(), description: "", quantity: 1, rate: 0 }]);
  const removeItem = (id: string) => draft.items.length > 1 && update("items", draft.items.filter((item) => item.id !== id));

  async function handleDownload() {
    if (!draft.businessName.trim() || !draft.clientName.trim() || !draft.items.some((item) => item.description.trim())) {
      setStatus("validation"); return;
    }
    setStatus("working");
    try {
      const bytes = await generateInvoicePdf(draft);
      downloadPdf(bytes, `${draft.invoiceNumber || "invoice"}.pdf`);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3500);
    } catch (error) {
      console.error(error); setStatus("error");
    }
  }

  function resetDraft() {
    if (window.confirm(t.builder.resetConfirm)) {
      const next = createDefaultDraft(locale);
      setDraft(next); localStorage.removeItem(STORAGE_KEY); setStatus("idle");
    }
  }

  const templates = useMemo(() => ["modern", "minimal", "classic"] as TemplateId[], []);
  return (
    <section className="builder-section" id="generator">
      <div className="shell builder-heading">
        <div><span className="eyebrow">{t.builder.eyebrow}</span><h2>{t.builder.title}</h2></div>
        <span className="saved-indicator"><Check size={14} /> {t.builder.saved}</span>
      </div>
      <div className="builder-shell shell">
        <div className="invoice-form">
          <div className="form-title-row"><h3>{t.builder.details}</h3><button type="button" className="text-button" onClick={resetDraft}><RotateCcw size={14} />{t.builder.reset}</button></div>
          <fieldset><legend><span>{t.builder.from}</span><small>{t.builder.fromHelp}</small></legend>
            <div className="form-grid">
              <label className="wide"><span>{t.builder.businessName}</span><input value={draft.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Northstar Studio" /></label>
              <label><span>{t.builder.businessEmail}</span><input type="email" value={draft.businessEmail} onChange={(e) => update("businessEmail", e.target.value)} placeholder="hello@example.com" /></label>
              <label><span>{t.builder.businessAddress}</span><input value={draft.businessAddress} onChange={(e) => update("businessAddress", e.target.value)} placeholder={locale === "fr" ? "Ville, pays" : "City, country"} /></label>
            </div>
          </fieldset>
          <fieldset><legend><span>{t.builder.to}</span><small>{t.builder.toHelp}</small></legend>
            <div className="form-grid">
              <label className="wide"><span>{t.builder.clientName}</span><input value={draft.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="Acme & Co." /></label>
              <label><span>{t.builder.clientEmail}</span><input type="email" value={draft.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} placeholder="client@example.com" /></label>
              <label><span>{t.builder.clientAddress}</span><input value={draft.clientAddress} onChange={(e) => update("clientAddress", e.target.value)} placeholder={locale === "fr" ? "Ville, pays" : "City, country"} /></label>
            </div>
          </fieldset>
          <fieldset><legend><span>{t.builder.details}</span></legend>
            <div className="form-grid three">
              <label><span>{t.builder.number}</span><input value={draft.invoiceNumber} onChange={(e) => update("invoiceNumber", e.target.value)} /></label>
              <label><span>{t.builder.issueDate}</span><input type="date" value={draft.issueDate} onChange={(e) => update("issueDate", e.target.value)} /></label>
              <label><span>{t.builder.dueDate}</span><input type="date" value={draft.dueDate} onChange={(e) => update("dueDate", e.target.value)} /></label>
            </div>
          </fieldset>
          <fieldset><legend className="legend-row"><span>{t.builder.items}</span><button type="button" className="text-button" onClick={addItem}><Plus size={15} />{t.builder.addItem}</button></legend>
            <div className="line-items">
              {draft.items.map((item, index) => (
                <div className="line-item" key={item.id}>
                  <label className="item-description"><span>{t.builder.description}</span><input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder={index === 0 ? t.builder.demoService : ""} /></label>
                  <label><span>{t.builder.quantity}</span><input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} /></label>
                  <label><span>{t.builder.rate}</span><input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))} /></label>
                  <button type="button" className="icon-button" onClick={() => removeItem(item.id)} disabled={draft.items.length === 1} aria-label={t.builder.remove}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </fieldset>
          <details className="settings" open><summary><span>{t.builder.settings}</span><ChevronDown size={18} /></summary>
            <div className="settings-content">
              <div className="form-grid three">
                <label><span>{t.builder.currency}</span><select value={draft.currency} onChange={(e) => update("currency", e.target.value as CurrencyCode)}>{["USD", "EUR", "MAD", "CAD", "GBP", "CHF"].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
                <label><span>{t.builder.tax} (%)</span><input type="number" min="0" max="100" step="0.1" value={draft.taxRate} onChange={(e) => update("taxRate", Number(e.target.value))} /></label>
                <label><span>{t.builder.documentLanguage}</span><select value={draft.documentLocale} onChange={(e) => update("documentLocale", e.target.value as Locale)}><option value="en">English</option><option value="fr">Français</option></select><small>{t.builder.documentLanguageHelp}</small></label>
              </div>
              <div className="option-group"><span>{t.builder.template}</span><div className="template-options">{templates.map((template) => <button key={template} type="button" className={draft.template === template ? "selected" : ""} onClick={() => update("template", template)}><span className={`mini-template mini-${template}`} />{t.builder.templates[template]}</button>)}</div></div>
              <div className="form-grid colour-notes">
                <label><span>{t.builder.accent}</span><div className="color-field"><input type="color" value={draft.accent} onChange={(e) => update("accent", e.target.value)} /><code>{draft.accent.toUpperCase()}</code></div></label>
                <label><span>{t.builder.notes}</span><textarea rows={3} value={draft.notes} onChange={(e) => update("notes", e.target.value)} placeholder={t.builder.notesPlaceholder} /></label>
              </div>
            </div>
          </details>
          {(status === "validation" || status === "error" || status === "done") && <p className={`form-status status-${status}`} role="status">{status === "validation" ? t.builder.validation : status === "error" ? t.builder.error : t.builder.downloaded}</p>}
        </div>
        <aside className="preview-column">
          <div className="preview-bar"><span>{t.builder.preview}</span><span>{draft.documentLocale.toUpperCase()} · {draft.currency}</span></div>
          <InvoicePreview draft={draft} />
          <button type="button" className="button download-button" onClick={handleDownload} disabled={status === "working"}><Download size={18} />{status === "working" ? t.builder.downloading : t.builder.download}</button>
          <p className="privacy-note"><Check size={13} />{locale === "fr" ? "Le PDF est généré localement dans votre navigateur." : "The PDF is generated locally in your browser."}</p>
        </aside>
      </div>
    </section>
  );
}
