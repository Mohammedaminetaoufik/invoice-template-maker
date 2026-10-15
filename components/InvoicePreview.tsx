"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getDictionary } from "@/lib/i18n";
import type { InvoiceDraft } from "@/lib/invoice";
import { createInvoiceLayout, type EditableRegion, type FontRole, type Ink } from "@/lib/pdf-layout";
import { templateAccent } from "@/lib/templates";
import { EditableFieldPopover } from "./EditableFieldPopover";

export function InvoicePreview({ draft, logoUrl, editing }: { draft: InvoiceDraft; logoUrl?: string; editing?: {
  locale: "en" | "fr";
  active?: { field: string; itemId?: string };
  onSelect: (region: EditableRegion) => void;
  onChange: (field: string, value: string, itemId?: string) => void;
  onClose: () => void;
  onRemove: (itemId: string) => void;
} }) {
  const previewId = useId();
  const fieldButtons = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeField = (field: string, itemId?: string) => {
    editing?.onClose();
    setTimeout(() => fieldButtons.current[`${field}:${itemId ?? ""}`]?.focus({ preventScroll: true }), 0);
  };
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => { if (active) setCanvas(document.createElement("canvas")); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setDimensions(undefined);
    if (logoUrl) {
      const image = new Image();
      image.onload = () => { if (active) setDimensions({ width: image.naturalWidth, height: image.naturalHeight }); };
      image.src = logoUrl;
    }
    return () => { active = false; };
  }, [logoUrl]);

  const layout = useMemo(() => {
    const context = canvas?.getContext("2d");
    const measure = (text: string, size: number, font: FontRole) => {
      if (!context) return Array.from(text).length * size * .58;
      context.font = `${font === "semibold" ? 600 : 400} ${size}px "Noto Sans"`;
      return context.measureText(text).width;
    };
    try { return createInvoiceLayout(draft, measure, dimensions, !!editing); }
    catch { return undefined; }
  }, [canvas, draft, dimensions, !!editing]);
  const t = getDictionary(draft.documentLocale);
  if (!layout) return <p className="form-status status-error" role="alert">{t.builder.calculationError}</p>;
  const colors: Record<Ink, string> = { accent: templateAccent(draft.template, draft.accent), dark: "#141f24", muted: "#616e73", pale: "#f4f5f4", white: "#ffffff", line: "#dbe0de" };

  return <div className={`invoice-preview-pages template-${draft.template}`}>
    {layout.pages.map((page, pageIndex) => <div className="invoice-document-page" key={pageIndex}><svg className="invoice-svg" viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-labelledby={`${previewId}-title-${pageIndex} ${previewId}-content-${pageIndex}`}>
      <title id={`${previewId}-title-${pageIndex}`}>{`${t.pdf.invoice} — ${t.pdf.page} ${pageIndex + 1} / ${layout.pages.length}`}</title>
      <desc id={`${previewId}-content-${pageIndex}`}>{page.operations.flatMap((operation) => operation.kind === "text" ? [operation.text] : []).join(". ")}</desc>
      <rect width={layout.width} height={layout.height} fill="white" />
      {page.operations.map((operation, index) => operation.kind === "rect"
        ? <rect key={index} x={operation.x} y={operation.top} width={operation.width} height={operation.height} fill={colors[operation.ink]} />
        : operation.kind === "image"
          ? logoUrl && <image key={index} href={logoUrl} x={operation.x} y={operation.top} width={operation.width} height={operation.height} preserveAspectRatio="xMidYMid meet" />
          : <text key={index} x={operation.x} y={operation.top + operation.size} fill={colors[operation.ink]} fontFamily="Noto Sans, sans-serif" fontSize={operation.size} fontWeight={operation.font === "semibold" ? 600 : 400}>{operation.text}</text>)}
    </svg>{editing && layout.regions.filter((region) => region.page === pageIndex).map((region, index, regions) => {
      // Wrapped fields have multiple hit areas, but only their first area opens an editor.
      const first = layout.regions.find((candidate) => candidate.field === region.field && candidate.itemId === region.itemId) === region;
      const active = editing.active?.field === region.field && editing.active?.itemId === region.itemId;
      const labels = getDictionary(editing.locale).builder;
      const names: Record<string, string> = { businessName: labels.businessName, businessEmail: labels.businessEmail, businessAddress: labels.businessAddress, clientName: labels.clientName, clientEmail: labels.clientEmail, clientAddress: labels.clientAddress, invoiceNumber: labels.number, issueDate: labels.issueDate, dueDate: labels.dueDate, description: labels.description, quantity: labels.quantity, rate: labels.rate, notes: labels.notes, paymentTerms: labels.paymentTerms, logo: editing.locale === "fr" ? "Ajouter ou modifier le logo" : "Add or edit logo" };
      const label = names[region.field] ?? region.field;
      const item = draft.items.find((row) => row.id === region.itemId);
      const value = region.itemId ? item?.[region.field as "description" | "quantity" | "rate"] : draft[region.field as keyof InvoiceDraft];
      const numeric = region.field === "quantity" || region.field === "rate";
      return <div key={index} className="editable-region" style={{ left: `${region.x / layout.width * 100}%`, top: `${region.top / layout.height * 100}%`, width: `${region.width / layout.width * 100}%`, height: `${region.height / layout.height * 100}%` }}>
        <button type="button" ref={(node) => { if (first) fieldButtons.current[`${region.field}:${region.itemId ?? ""}`] = node; }} className={`document-field ${active ? "active" : ""}`} aria-haspopup="dialog" aria-expanded={active} aria-label={`${label}${region.itemId ? ` (${draft.items.findIndex((row) => row.id === region.itemId) + 1})` : ""}`} onClick={() => editing.onSelect(region)}>{region.field === "logo" && !logoUrl ? (editing.locale === "fr" ? "+ Ajouter votre logo" : "+ Add your logo") : <span className="sr-only">{label}</span>}</button>
        {active && first && region.field !== "logo" && <EditableFieldPopover key={`${region.field}:${region.itemId ?? ""}`} label={label} locale={editing.locale} alignRight={region.x > layout.width / 2} anchor={() => fieldButtons.current[`${region.field}:${region.itemId ?? ""}`]} onClose={() => closeField(region.field, region.itemId)}>
          <label><span className="sr-only">{label}</span>{["description", "businessAddress", "clientAddress", "notes", "paymentTerms"].includes(region.field)
            ? <textarea autoFocus rows={2} value={String(value ?? "")} onChange={(event) => editing.onChange(region.field, event.target.value, region.itemId)} />
            : <input autoFocus type={numeric ? "number" : region.field.endsWith("Date") ? "date" : region.field.endsWith("Email") ? "email" : "text"} min={numeric ? 0 : undefined} step={numeric ? "any" : undefined} value={String(value ?? "")} onChange={(event) => editing.onChange(region.field, event.target.value, region.itemId)} />}</label>
          <div className="field-popover-actions"><button className="button" type="button" onClick={() => closeField(region.field, region.itemId)}>{editing.locale === "fr" ? "Terminé" : "Done"}</button>{region.itemId && <button className="text-button" type="button" disabled={draft.items.length === 1} onClick={() => editing.onRemove(region.itemId!)}>{labels.remove}</button>}</div>
        </EditableFieldPopover>}
      </div>;
    })}</div>)}
  </div>;
}
