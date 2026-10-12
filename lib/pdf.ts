import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getDictionary, type Locale } from "./i18n";
import { calculateTotals, formatDate, formatMoney, type InvoiceDraft } from "./invoice";

const hexToRgb = (hex: string) => {
  const safe = hex.replace("#", "");
  return rgb(
    parseInt(safe.slice(0, 2), 16) / 255,
    parseInt(safe.slice(2, 4), 16) / 255,
    parseInt(safe.slice(4, 6), 16) / 255,
  );
};

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size = 10, color = rgb(0.12, 0.16, 0.18), maxWidth = 500) {
  page.drawText(text || "—", { x, y, size, font, color, maxWidth });
}

function drawRight(page: PDFPage, font: PDFFont, text: string, right: number, y: number, size = 10, color = rgb(0.12, 0.16, 0.18)) {
  drawText(page, font, text, right - font.widthOfTextAtSize(text, size), y, size, color);
}

function truncate(text: string, max = 55) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function formatPdfMoney(value: number, draft: InvoiceDraft) {
  return formatMoney(value, draft.currency, draft.documentLocale).replace(/[\u00a0\u202f]/g, " ");
}

export async function generateInvoicePdf(draft: InvoiceDraft) {
  const labels = getDictionary(draft.documentLocale).pdf;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [fontBytes, semiboldBytes] = await Promise.all(["/fonts/NotoSans-Regular.woff", "/fonts/NotoSans-Semibold.woff"].map((url) => fetch(url).then((response) => {
    if (!response.ok) throw new Error("Unable to load the embedded PDF font");
    return response.arrayBuffer();
  })));
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const semibold = await pdf.embedFont(semiboldBytes, { subset: true });
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const accent = hexToRgb(draft.accent);
  const dark = rgb(0.08, 0.12, 0.14);
  const muted = rgb(0.38, 0.43, 0.45);
  const pale = rgb(0.955, 0.962, 0.958);
  const hairline = rgb(0.86, 0.88, 0.87);
  const margin = 48;
  const contentWidth = width - margin * 2;

  if (draft.template === "modern") {
    page.drawRectangle({ x: 0, y: height - 13, width, height: 13, color: accent });
  } else if (draft.template === "classic") {
    page.drawRectangle({ x: margin, y: height - 165, width: contentWidth, height: 1, color: dark });
  }

  const titleColor = draft.template === "minimal" || draft.template === "classic" ? dark : accent;
  drawText(page, semibold, labels.invoice.toUpperCase(), margin, height - 72, 27, titleColor);
  drawText(page, semibold, draft.businessName, margin, height - 108, 12, dark, 260);
  drawText(page, font, draft.businessEmail, margin, height - 125, 8.5, muted, 260);
  drawText(page, font, draft.businessAddress, margin, height - 141, 8.5, muted, 260);

  const metaX = 364;
  const metaValueX = width - margin;
  const metaRows = [
    [labels.invoiceNumber, draft.invoiceNumber],
    [labels.invoiceDate, formatDate(draft.issueDate, draft.documentLocale)],
    [labels.dueDate, formatDate(draft.dueDate, draft.documentLocale)],
  ];
  metaRows.forEach(([label, value], index) => {
    const y = height - 69 - index * 35;
    drawText(page, semibold, label.toUpperCase(), metaX, y, 6.5, muted, 180);
    drawRight(page, semibold, value, metaValueX, y - 14, 9.2, dark);
  });

  const recipientTop = height - 192;
  if (draft.template === "modern") page.drawRectangle({ x: margin, y: recipientTop - 72, width: contentWidth, height: 83, color: pale });
  drawText(page, semibold, labels.billTo.toUpperCase(), margin + (draft.template === "modern" ? 14 : 0), recipientTop - 5, 7, muted);
  drawText(page, semibold, draft.clientName, margin + (draft.template === "modern" ? 14 : 0), recipientTop - 27, 11.5, dark, 300);
  drawText(page, font, draft.clientEmail, margin + (draft.template === "modern" ? 14 : 0), recipientTop - 44, 8.5, muted, 300);
  drawText(page, font, draft.clientAddress, margin + (draft.template === "modern" ? 14 : 0), recipientTop - 60, 8.5, muted, 300);

  const tableTop = height - 306;
  page.drawRectangle({ x: margin, y: tableTop - 28, width: contentWidth, height: 28, color: draft.template === "minimal" ? pale : draft.template === "classic" ? dark : accent });
  const headerColor = draft.template === "minimal" ? dark : rgb(1, 1, 1);
  drawText(page, semibold, labels.description.toUpperCase(), margin + 10, tableTop - 18, 6.6, headerColor);
  drawRight(page, semibold, labels.quantity.toUpperCase(), 366, tableTop - 18, 6.6, headerColor);
  drawRight(page, semibold, labels.unitPrice.toUpperCase(), 458, tableTop - 18, 6.6, headerColor);
  drawRight(page, semibold, labels.total.toUpperCase(), width - margin - 9, tableTop - 18, 6.6, headerColor);

  let rowY = tableTop - 55;
  draft.items.slice(0, 10).forEach((item, index) => {
    if (index % 2) page.drawRectangle({ x: margin, y: rowY - 11, width: contentWidth, height: 31, color: rgb(0.985, 0.986, 0.982) });
    drawText(page, font, truncate(item.description, 48), margin + 10, rowY, 9, dark, 245);
    drawRight(page, font, String(item.quantity), 366, rowY, 9, dark);
    drawRight(page, font, formatPdfMoney(item.rate, draft), 458, rowY, 8.5, dark);
    drawRight(page, semibold, formatPdfMoney(item.quantity * item.rate, draft), width - margin - 9, rowY, 8.5, dark);
    page.drawRectangle({ x: margin, y: rowY - 12, width: contentWidth, height: 0.6, color: hairline });
    rowY -= 32;
  });

  const totals = calculateTotals(draft);
  const summaryX = 302;
  const summaryRight = width - margin;
  const totalsY = Math.max(rowY - 23, 260);
  drawText(page, font, labels.subtotal, summaryX, totalsY, 8.8, muted, 150);
  drawRight(page, semibold, formatPdfMoney(totals.subtotal, draft), summaryRight, totalsY, 8.8, dark);
  drawText(page, font, `${labels.tax} (${draft.taxRate}%)`, summaryX, totalsY - 25, 8.3, muted, 150);
  drawRight(page, semibold, formatPdfMoney(totals.tax, draft), summaryRight, totalsY - 25, 8.8, dark);
  page.drawRectangle({ x: summaryX, y: totalsY - 44, width: summaryRight - summaryX, height: 1, color: draft.template === "minimal" ? dark : accent });
  drawText(page, semibold, labels.amountDue, summaryX, totalsY - 67, 10, dark, 130);
  drawRight(page, semibold, formatPdfMoney(totals.total, draft), summaryRight, totalsY - 68, 11.5, titleColor);

  if (draft.notes) {
    const notesY = Math.max(totalsY - 116, 128);
    drawText(page, semibold, labels.notes.toUpperCase(), margin, notesY, 6.8, muted);
    drawText(page, font, truncate(draft.notes, 96), margin, notesY - 18, 8.5, dark, contentWidth);
  }
  page.drawRectangle({ x: margin, y: 57, width: contentWidth, height: .6, color: hairline });
  drawText(page, font, "InvoiceTemplateMaker.com", margin, 39, 7.5, muted);
  drawRight(page, font, draft.documentLocale === "fr" ? "Créé dans votre navigateur" : "Created in your browser", width - margin, 39, 7.5, muted);

  return pdf.save();
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
