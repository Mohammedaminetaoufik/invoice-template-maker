"use client";

import { useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getEditorCopy } from "@/lib/editor-copy";
import { createDefaultDraft, type TemplateId } from "@/lib/invoice";
import { templateIds } from "@/lib/templates";
import { InvoicePreview } from "./InvoicePreview";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";

const suggestions: TemplateId[][] = [["freelance"], ["corporate", "classic"], ["creative"], ["classic"], ["modern"], ["retail"], []];
export function TemplatePicker({ locale, selected, onChoose, onClose }: { locale: Locale; selected?: TemplateId; onChoose: (id: TemplateId) => void; onClose?: () => void }) {
  const t = getDictionary(locale), copy = getEditorCopy(locale);
  const [activity, setActivity] = useState(-1);
  const [preview, setPreview] = useState<TemplateId>();
  const sample = (template: TemplateId) => ({ ...createDefaultDraft(locale), template, businessName: locale === "fr" ? "Studio Exemple" : "Example Studio", clientName: locale === "fr" ? "Client Exemple" : "Example Client", issueDate: "2026-10-13", dueDate: "2026-10-27", invoiceNumber: "INV-001", items: [{ id: "sample", description: t.builder.demoService, quantity: 2, rate: 100 }] });
  return <section className="template-picker" id="invoice-templates" aria-labelledby="template-picker-title">
    <div className="form-title-row"><div><h2 id="template-picker-title">{copy.choose}</h2><p>{copy.chooseHelp}</p></div>{onClose && <button className="text-button" type="button" onClick={onClose}>{copy.close}</button>}</div>
    <p className="demo-disclaimer">{copy.demoHelp}</p>
    <label className="activity-filter"><span>{copy.activity}</span><select value={activity} onChange={(event) => setActivity(Number(event.target.value))}><option value={-1}>{copy.all}</option>{copy.activities.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></label>
    <div className="visual-template-grid">{templateIds.map((id, index) => <article className={`visual-template-card ${selected === id ? "selected" : ""}`} key={id}>
      <button className="template-thumbnail" type="button" aria-label={`${copy.preview}: ${t.builder.templates[id]}`} onClick={() => setPreview(id)}><InvoicePreview draft={sample(id)} /><span className="template-preview-label">{copy.preview}</span></button>
      <h3>{t.builder.templates[id]}</h3><p>{t.templatesSection.descriptions[index]}</p>
      {suggestions[activity]?.includes(id) && <small className="recommendation">{copy.recommended}</small>}
      {selected === id && <small className="template-selection-label">✓ {copy.selected}</small>}
      <button className="button button-ghost" type="button" aria-pressed={selected === id} onClick={() => onChoose(id)}>{copy.use}: {t.builder.templates[id]}</button>
    </article>)}</div>
    {preview && <TemplatePreviewDialog label={`${copy.preview}: ${t.builder.templates[preview]}`} onClose={() => setPreview(undefined)}><div className="template-preview-content">
      <div className="template-comparison-bar"><button autoFocus className="button button-ghost" type="button" onClick={() => setPreview(undefined)}>{copy.close}</button><strong>{t.builder.templates[preview]}</strong></div>
      <div className="template-comparison-controls"><button className="button button-ghost" type="button" onClick={() => setPreview(templateIds[(templateIds.indexOf(preview) + templateIds.length - 1) % templateIds.length])}>{copy.previous}</button><span>{templateIds.indexOf(preview) + 1} / {templateIds.length}</span><button className="button button-ghost" type="button" onClick={() => setPreview(templateIds[(templateIds.indexOf(preview) + 1) % templateIds.length])}>{copy.nextTemplate}</button></div>
      <p className="demo-disclaimer">{copy.demo}</p><InvoicePreview draft={sample(preview)} />
      <button className="button" type="button" onClick={() => { onChoose(preview); setPreview(undefined); }}>{copy.use}: {t.builder.templates[preview]}</button>
    </div></TemplatePreviewDialog>}
  </section>;
}
