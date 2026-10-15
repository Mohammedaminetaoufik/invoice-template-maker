"use client";
import { useRef } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getEditorCopy } from "@/lib/editor-copy";
import type { InvoiceDraft } from "@/lib/invoice";

export function QuickEditNavigator({ locale, draft, disabled, onSelect }: { locale: Locale; draft: InvoiceDraft; disabled: boolean; onSelect: (field: { field: string; itemId?: string }) => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const t = getDictionary(locale).builder, copy = getEditorCopy(locale);
  const fields = [
    ...(["businessName", "businessEmail", "businessAddress", "clientName", "clientEmail", "clientAddress", "invoiceNumber", "issueDate", "dueDate", "notes", "paymentTerms"] as const).map((field) => ({ field, itemId: undefined as string | undefined, label: field === "invoiceNumber" ? t.number : t[field] })),
    ...draft.items.flatMap((row, index) => (["description", "quantity", "rate"] as const).map((field) => ({ field, itemId: row.id, label: `${t[field]} (${index + 1})` }))),
  ];
  return <details ref={ref} className="mobile-field-navigation">
    <summary>{copy.navigate}</summary>
    <label><span>{copy.quickField}</span><select aria-label={copy.quickField} value="" disabled={disabled} onChange={(event) => {
      const selected = fields[Number(event.target.value)];
      if (selected) { if (ref.current) ref.current.open = false; onSelect({ field: selected.field, itemId: selected.itemId }); }
    }}><option value="" disabled>{copy.chooseField}</option>{fields.map((field, index) => <option key={`${field.field}:${field.itemId ?? ""}`} value={index}>{field.label}</option>)}</select></label>
  </details>;
}
