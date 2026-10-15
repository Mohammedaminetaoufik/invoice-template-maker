import type { InvoiceDraft } from "./invoice";
import { calculateTotals, formatDate, formatMoney, formatUnitPrice } from "./invoice";
import { getDictionary } from "./i18n";
import { templateStyles } from "./templates";

export type FontRole = "regular" | "semibold";
export type Ink = "dark" | "muted" | "accent" | "white" | "pale" | "line";
export type TextOperation = { kind: "text"; text: string; x: number; top: number; size: number; font: FontRole; ink: Ink; width: number };
export type RectOperation = { kind: "rect"; x: number; top: number; width: number; height: number; ink: Ink };
export type ImageOperation = { kind: "image"; x: number; top: number; width: number; height: number };
export type LayoutOperation = TextOperation | RectOperation | ImageOperation;
export type LayoutPage = { operations: LayoutOperation[] };
export type EditableRegion = { page: number; x: number; top: number; width: number; height: number; field: string; itemId?: string };
export type PdfLayout = { width: number; height: number; pages: LayoutPage[]; regions: EditableRegion[] };
export type TextMeasure = (text: string, size: number, font: FontRole) => number;

export function normalizePdfText(text: string) {
  return text.replace(/[\u00a0\u202f\t]/g, " ").replace(/\r\n?/g, "\n");
}

// Words remain intact where possible; oversized words are split by Unicode
// code point. No ellipsis or substring limit is applied to invoice content.
export function wrapPdfText(text: string, width: number, size: number, font: FontRole, measure: TextMeasure): string[] {
  const lines: string[] = [];
  for (const paragraph of normalizePdfText(text).split("\n")) {
    let line = "";
    const tokens = paragraph.match(/\S+| +/g) ?? [];
    for (const token of tokens) {
      if (measure(line + token, size, font) <= width) {
        line += token;
        continue;
      }
      if (line.trim()) { lines.push(line.trimEnd()); line = ""; }
      if (!token.trim()) continue;
      for (const character of Array.from(token)) {
        if (measure(line + character, size, font) > width && line) {
          lines.push(line); line = "";
        }
        line += character;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

class FlowLayout {
  readonly regions: EditableRegion[] = [];
  readonly pages: LayoutPage[] = [];
  readonly margin = 44;
  readonly bottom: number;
  page!: LayoutPage;
  top = 0;
  constructor(readonly width: number, readonly height: number, readonly draft: InvoiceDraft, readonly measure: TextMeasure) {
    this.bottom = height - 66;
    this.newPage();
  }
  get contentWidth() { return this.width - this.margin * 2; }
  get available() { return this.bottom - this.top; }
  region(field: string, x: number, top: number, width: number, height: number, itemId?: string) {
    this.regions.push({ page: this.pages.length - 1, field, x, top, width, height, itemId });
  }
  newPage() {
    this.page = { operations: [] }; this.pages.push(this.page);
    this.top = this.margin;
    if (templateStyles[this.draft.template].header === "strip") this.rect(0, 0, this.width, 9, "accent");
    if (this.pages.length > 1) {
      this.text(getDictionary(this.draft.documentLocale).pdf.invoice, this.margin, this.top, 15, "semibold", "dark");
      this.top += 32;
      this.rect(this.margin, this.top - 8, this.contentWidth, 0.7, "line");
    }
  }
  ensure(height: number) { if (this.available < height) this.newPage(); }
  rect(x: number, top: number, width: number, height: number, ink: Ink) {
    this.page.operations.push({ kind: "rect", x, top, width, height, ink });
  }
  text(text: string, x: number, top: number, size = 9.5, font: FontRole = "regular", ink: Ink = "dark") {
    const normalized = normalizePdfText(text);
    if (!normalized) return;
    this.page.operations.push({ kind: "text", text: normalized, x, top, size, font, ink, width: this.measure(normalized, size, font) });
  }
  lines(text: string, width = this.contentWidth, size = 9.5, font: FontRole = "regular") {
    return wrapPdfText(text, width, size, font, this.measure);
  }
  paragraph(text: string, size = 9.5, font: FontRole = "regular", ink: Ink = "dark", field?: string) {
    const lineHeight = size * 1.55;
    for (const line of this.lines(text, this.contentWidth, size, font)) {
      this.ensure(lineHeight);
      if (field) this.region(field, this.margin, this.top, this.contentWidth, lineHeight);
      this.text(line, this.margin, this.top, size, font, ink);
      this.top += lineHeight;
    }
  }
  section(label: string, values: Array<{ text: string; size?: number; font?: FontRole; ink?: Ink; field?: string }>) {
    this.ensure(45);
    this.paragraph(label.toUpperCase(), 7.5, "semibold", "muted");
    this.top += 5;
    for (const value of values) {
      if (value.text) this.paragraph(value.text, value.size ?? 9.5, value.font ?? "regular", value.ink ?? "dark", value.field);
    }
    this.top += templateStyles[this.draft.template].compact ? 12 : 18;
  }
}

export function createInvoiceLayout(draft: InvoiceDraft, measure: TextMeasure, logo?: { width: number; height: number }, editable = false): PdfLayout {
  const labels = getDictionary(draft.documentLocale).pdf;
  const [width, height] = draft.paperSize === "letter" ? [612, 792] : [595.28, 841.89];
  const flow = new FlowLayout(width, height, draft, measure);
  const style = templateStyles[draft.template];
  const titleInk = style.header === "strip" || draft.template === "corporate" ? "accent" : "dark";
  const money = (value: number) => normalizePdfText(formatMoney(value, draft.currency, draft.documentLocale));
  const totals = calculateTotals(draft);
  const ui = getDictionary(draft.documentLocale).builder;
  const display = (value: string | undefined, placeholder: string) => value || (editable ? placeholder : "");

  // The title and metadata have separate measured columns. Very long invoice
  // references continue as normal flow text rather than clipping the header.
  let titleHeight = style.compact ? 40 : 52;
  let logoOperation: ImageOperation | undefined;
  if (logo) {
    const scale = Math.min(120 / logo.width, 60 / logo.height);
    const logoWidth = logo.width * scale, logoHeight = logo.height * scale;
    const logoX = style.titlePosition === "center" ? (width - logoWidth) / 2 : style.titlePosition === "right" ? flow.margin : width - flow.margin - logoWidth;
    logoOperation = { kind: "image", x: logoX, top: flow.top, width: logoWidth, height: logoHeight };
    if (style.titlePosition === "center") flow.top += logoHeight + 18;
    else titleHeight = Math.max(titleHeight, logoHeight + 16);
  }
  if (style.header === "panel") flow.rect(flow.margin - 10, flow.top - 10, flow.contentWidth + 20, style.titleSize + 26, "pale");
  if (logoOperation) flow.page.operations.push(logoOperation);
  if (editable) {
    const x = logoOperation?.x ?? (style.titlePosition === "right" ? flow.margin : width - flow.margin - 120);
    flow.region("logo", x, logoOperation?.top ?? flow.top, 120, logoOperation?.height ?? 28);
  }
  const titleWidth = measure(labels.invoice.toUpperCase(), style.titleSize, "semibold");
  const titleX = style.titlePosition === "center" ? (width - titleWidth) / 2 : style.titlePosition === "right" ? width - flow.margin - titleWidth : flow.margin;
  flow.text(labels.invoice.toUpperCase(), titleX, flow.top, style.titleSize, "semibold", titleInk);
  if (style.header === "frame") {
    flow.rect(flow.margin, flow.top - 8, flow.contentWidth, .7, "dark");
    flow.rect(flow.margin, flow.top + style.titleSize + 10, flow.contentWidth, .7, "dark");
  }
  flow.top += titleHeight;
  const metaWidth = (flow.contentWidth - 24) / 3;
  const metadata = [
    [labels.invoiceNumber, draft.invoiceNumber],
    [labels.invoiceDate, formatDate(draft.issueDate, draft.documentLocale)],
    [labels.dueDate, formatDate(draft.dueDate, draft.documentLocale)],
  ];
  const metaLines = metadata.map(([label, value]) => ({ label: flow.lines(label, metaWidth, 7, "semibold"), value: flow.lines(value, metaWidth, 9, "semibold") }));
  const metaHeight = Math.max(...metaLines.map((part) => part.label.length * 11 + part.value.length * 14 + 6));
  if (metaHeight <= flow.available - 24) {
    metaLines.forEach((part, index) => {
      let top = flow.top;
      const x = flow.margin + index * (metaWidth + 12);
      for (const line of part.label) { flow.text(line, x, top, 7, "semibold", "muted"); top += 11; }
      top += 6;
      if (editable) flow.region(["invoiceNumber", "issueDate", "dueDate"][index], x, top, metaWidth, part.value.length * 14);
      for (const line of part.value) { flow.text(line, x, top, 9, "semibold"); top += 14; }
    });
    flow.top += metaHeight + 24;
  } else {
    for (const [index, [label, value]] of metadata.entries()) flow.section(label, [{ text: value, font: "semibold", field: editable ? ["invoiceNumber", "issueDate", "dueDate"][index] : undefined }]);
  }
  if (style.header === "rule") { flow.rect(flow.margin, flow.top - 10, flow.contentWidth, 1, "dark"); }

  flow.section(labels.from, [
    { text: display(draft.businessName, ui.businessName), font: "semibold", size: 12, field: editable ? "businessName" : undefined },
    { text: display(draft.businessEmail, ui.businessEmail), ink: "muted", field: editable ? "businessEmail" : undefined },
    { text: display(draft.businessAddress, ui.businessAddress), ink: "muted", field: editable ? "businessAddress" : undefined },
    { text: draft.businessIdentifiers ?? "", ink: "muted" },
    ...(["siren", "siret", "vatNumber", "ice", "taxIdentifier", "commercialRegister", "registrationNumber"] as const).flatMap((key) => draft[key] ? [{ text: `${labels[key]}: ${draft[key]}`, ink: "muted" as const }] : []),
  ]);

  if (draft.purchaseOrder) flow.section(labels.purchaseOrder, [{ text: draft.purchaseOrder }]);
  flow.section(labels.billTo, [
    { text: display(draft.clientName, ui.clientName), font: "semibold", size: 12, field: editable ? "clientName" : undefined },
    { text: display(draft.clientEmail, ui.clientEmail), ink: "muted", field: editable ? "clientEmail" : undefined },
    { text: display(draft.clientAddress, ui.clientAddress), ink: "muted", field: editable ? "clientAddress" : undefined },
  ]);

  const padding = style.padding;
  const columnWidths = [0.46, 0.14, 0.20, 0.20].map((share) => flow.contentWidth * share);
  const columnX = columnWidths.map((_, index) => flow.margin + columnWidths.slice(0, index).reduce((sum, current) => sum + current, 0));
  const headerLines = [labels.description, labels.quantity, labels.unitPrice, labels.total].map((label, index) => flow.lines(label, columnWidths[index] - 2 * padding, 7.2, "semibold"));
  const headerHeight = Math.max(...headerLines.map((lines) => lines.length)) * 11 + 16;
  const headerInk: Ink = style.table === "pale" || style.table === "outline" ? "dark" : "white";
  function tableHeader() {
    flow.ensure(headerHeight + 28);
    flow.rect(flow.margin, flow.top, flow.contentWidth, headerHeight, style.table === "outline" ? "white" : style.table === "pale" ? "pale" : style.table === "dark" ? "dark" : "accent");
    if (style.table === "outline") {
      flow.rect(flow.margin, flow.top, flow.contentWidth, .7, "dark");
      flow.rect(flow.margin, flow.top + headerHeight, flow.contentWidth, .7, "dark");
    }
    headerLines.forEach((lines, column) => lines.forEach((line, index) => {
      const x = column === 0 ? columnX[column] + padding : columnX[column] + columnWidths[column] - padding - measure(line, 7.2, "semibold");
      flow.text(line, x, flow.top + 8 + index * 11, 7.2, "semibold", headerInk);
    }));
    flow.top += headerHeight;
  }
  const rowLineHeight = style.compact ? 12 : 14;
  const fullPageRowCapacity = Math.floor((flow.bottom - flow.margin - 32 - headerHeight - 16) / rowLineHeight);
  if (draft.items.length) {
    const first = draft.items[0];
    const firstCells = [first.description || "—", String(first.quantity), normalizePdfText(formatUnitPrice(first.rate, draft.currency, draft.documentLocale)), money(totals.lineAmounts[0])];
    const firstLineCount = Math.max(...firstCells.map((cell, index) => flow.lines(cell, columnWidths[index] - padding * 2, 9, index === 3 ? "semibold" : "regular").length));
    // Do not leave a table header on a page without the first ordinary row.
    flow.ensure(headerHeight + (firstLineCount <= fullPageRowCapacity ? firstLineCount * rowLineHeight + 16 : 28));
  }
  tableHeader();
  draft.items.forEach((item, itemIndex) => {
    const cells = [item.description || (editable ? ui.description : "—"), String(item.quantity).replace(".", draft.documentLocale === "fr" ? "," : "."), normalizePdfText(formatUnitPrice(item.rate, draft.currency, draft.documentLocale)), money(totals.lineAmounts[itemIndex])];
    const lines = cells.map((cell, index) => flow.lines(cell, columnWidths[index] - padding * 2, 9, index === 3 ? "semibold" : "regular"));
    const lineCount = Math.max(...lines.map((cell) => cell.length));
    const rowHeight = lineCount * rowLineHeight + 16;
    // Keep ordinary rows together; split only rows longer than a whole page.
    if (rowHeight > flow.available && lineCount <= fullPageRowCapacity) { flow.newPage(); tableHeader(); }
    let offset = 0;
    while (offset < lineCount) {
      const capacity = Math.floor((flow.available - 16) / rowLineHeight);
      if (capacity < 1) { flow.newPage(); tableHeader(); continue; }
      const count = Math.min(capacity, lineCount - offset);
      const chunkHeight = count * rowLineHeight + 16;
      if (editable) for (let column = 0; column < 3; column++) flow.region(["description", "quantity", "rate"][column], columnX[column], flow.top, columnWidths[column], chunkHeight, item.id);
      if (style.striped && itemIndex % 2 === 1) flow.rect(flow.margin, flow.top, flow.contentWidth, chunkHeight, "pale");
      for (let column = 0; column < lines.length; column += 1) {
        const font: FontRole = column === 3 ? "semibold" : "regular";
        for (let index = 0; index < count; index += 1) {
          const line = lines[column][offset + index];
          if (!line) continue;
          const x = column === 0 ? columnX[column] + padding : columnX[column] + columnWidths[column] - padding - measure(line, 9, font);
          flow.text(line, x, flow.top + 8 + index * rowLineHeight, 9, font);
        }
      }
      flow.top += chunkHeight;
      flow.rect(flow.margin, flow.top, flow.contentWidth, 0.6, "line");
      offset += count;
      if (offset < lineCount) { flow.newPage(); tableHeader(); }
    }
  });

  const summaryRows: Array<[string, number, boolean?]> = [[labels.subtotal, totals.subtotal]];
  if (totals.discount) summaryRows.push([labels.discount, -totals.discount]);
  if (totals.shipping) summaryRows.push([labels.shipping, totals.shipping]);
  summaryRows.push([`${labels.tax} (${draft.taxRate}%)`, totals.tax], [labels.total, totals.total, true]);
  if (totals.deposit) summaryRows.push([labels.deposit, -totals.deposit]);
  if (totals.amountPaid) summaryRows.push([labels.amountPaid, -totals.amountPaid]);
  summaryRows.push([labels.amountDue, totals.balance, true]);
  if (totals.credit) summaryRows.push([labels.credit, totals.credit]);
  const summaryWidth = Math.min(310, flow.contentWidth);
  const labelWidth = summaryWidth * 0.52;
  const valueWidth = summaryWidth - labelWidth - 14;
  const summary = summaryRows.map(([label, amount, emphasized]) => ({
    label: flow.lines(label, labelWidth, emphasized ? 10 : 9),
    value: flow.lines(money(amount), valueWidth, emphasized ? 11 : 9, "semibold"),
    emphasized,
  }));
  const summaryHeight = summary.reduce((sum, row) => sum + Math.max(row.label.length, row.value.length) * 16 + 13, 0);
  flow.top += 20;
  flow.ensure(summaryHeight);
  for (const row of summary) {
    const x = style.summaryPosition === "left" ? flow.margin : width - flow.margin - summaryWidth;
    const rowHeight = Math.max(row.label.length, row.value.length) * 16 + 13;
    if (row.emphasized) flow.rect(x, flow.top - 4, summaryWidth, .7, "line");
    row.label.forEach((line, index) => flow.text(line, x, flow.top + index * 16, row.emphasized ? 10 : 9, row.emphasized ? "semibold" : "regular", row.emphasized ? "dark" : "muted"));
    row.value.forEach((line, index) => flow.text(line, x + summaryWidth - measure(line, row.emphasized ? 11 : 9, "semibold"), flow.top + index * 16, row.emphasized ? 11 : 9, "semibold", row.emphasized ? titleInk : "dark"));
    flow.top += rowHeight;
  }
  if (draft.notes || editable) {
    flow.top += 24;
    flow.section(labels.notes, [{ text: display(draft.notes, ui.notesPlaceholder), field: editable ? "notes" : undefined }]);
  }
  for (const [label, value] of [[labels.paymentTerms, draft.paymentTerms], [labels.iban, draft.iban], [labels.swift, draft.swift]]) {
    if (value || (editable && label === labels.paymentTerms)) flow.section(label!, [{ text: display(value, ui.paymentTerms), field: editable && label === labels.paymentTerms ? "paymentTerms" : undefined }]);
  }

  flow.pages.forEach((page, index) => {
    const pageText = `${labels.page} ${index + 1} / ${flow.pages.length}`;
    page.operations.push({ kind: "rect", x: flow.margin, top: height - 48, width: flow.contentWidth, height: .5, ink: "line" });
    page.operations.push({ kind: "text", text: pageText, x: width - flow.margin - measure(pageText, 8, "regular"), top: height - 36, size: 8, font: "regular", ink: "muted", width: measure(pageText, 8, "regular") });
  });
  return { width, height, pages: flow.pages, regions: flow.regions };
}
