import { getDictionary } from "@/lib/i18n";
import { calculateTotals, formatDate, formatMoney, type InvoiceDraft } from "@/lib/invoice";

export function InvoicePreview({ draft }: { draft: InvoiceDraft }) {
  const t = getDictionary(draft.documentLocale);
  const totals = calculateTotals(draft);
  return (
    <article className={`invoice-paper template-${draft.template}`} style={{ "--invoice-accent": draft.accent } as React.CSSProperties}>
      <div className="invoice-accent" />
      <div className="invoice-top">
        <div>
          <span className="invoice-kicker">{t.pdf.invoice}</span>
          <h3>{draft.businessName || (draft.documentLocale === "fr" ? "Votre entreprise" : "Your business")}</h3>
          <p>{draft.businessEmail}</p><p>{draft.businessAddress}</p>
        </div>
        <dl className="invoice-meta">
          <div><dt>{t.pdf.invoiceNumber}</dt><dd>{draft.invoiceNumber}</dd></div>
          <div><dt>{t.pdf.invoiceDate}</dt><dd>{formatDate(draft.issueDate, draft.documentLocale)}</dd></div>
          <div><dt>{t.pdf.dueDate}</dt><dd>{formatDate(draft.dueDate, draft.documentLocale)}</dd></div>
        </dl>
      </div>
      <div className="bill-to">
        <span>{t.pdf.billTo}</span>
        <strong>{draft.clientName || (draft.documentLocale === "fr" ? "Nom du client" : "Client name")}</strong>
        <p>{draft.clientEmail}</p><p>{draft.clientAddress}</p>
      </div>
      <div className="invoice-table-wrap">
        <table className="invoice-table">
          <thead><tr><th>{t.pdf.description}</th><th>{t.pdf.quantity}</th><th>{t.pdf.unitPrice}</th><th>{t.pdf.total}</th></tr></thead>
          <tbody>
            {draft.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description || "—"}</td><td>{item.quantity}</td><td>{formatMoney(item.rate, draft.currency, draft.documentLocale)}</td><td>{formatMoney(item.quantity * item.rate, draft.currency, draft.documentLocale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="invoice-summary">
        <dl>
          <div><dt>{t.pdf.subtotal}</dt><dd>{formatMoney(totals.subtotal, draft.currency, draft.documentLocale)}</dd></div>
          <div><dt>{t.pdf.tax} ({draft.taxRate}%)</dt><dd>{formatMoney(totals.tax, draft.currency, draft.documentLocale)}</dd></div>
          <div className="amount-due"><dt>{t.pdf.amountDue}</dt><dd>{formatMoney(totals.total, draft.currency, draft.documentLocale)}</dd></div>
        </dl>
      </div>
      {draft.notes && <div className="invoice-notes"><span>{t.pdf.notes}</span><p>{draft.notes}</p></div>}
    </article>
  );
}
