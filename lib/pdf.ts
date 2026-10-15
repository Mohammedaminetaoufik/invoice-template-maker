import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import type { InvoiceDraft } from "./invoice";
import { createInvoiceLayout, type Ink } from "./pdf-layout";
import type { InvoiceLogo } from "./logo";
import { templateAccent } from "./templates";

function accentColor(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Invalid invoice accent colour");
  return rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
}

export async function generateInvoicePdf(draft: InvoiceDraft, logo?: InvoiceLogo) {
  if (draft.logoId && (!logo || logo.id !== draft.logoId)) throw new Error("Saved invoice logo is unavailable");
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regularBytes, semiboldBytes] = await Promise.all([
    "/fonts/NotoSans-Regular.woff", "/fonts/NotoSans-Semibold.woff",
  ].map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Unable to load the embedded PDF font");
    return response.arrayBuffer();
  }));
  const fonts = {
    regular: await pdf.embedFont(regularBytes, { subset: true }),
    semibold: await pdf.embedFont(semiboldBytes, { subset: true }),
  };
  const colors: Record<Ink, ReturnType<typeof rgb>> = {
    accent: accentColor(templateAccent(draft.template, draft.accent)),
    dark: rgb(.08, .12, .14),
    muted: rgb(.38, .43, .45),
    pale: rgb(.955, .962, .958),
    white: rgb(1, 1, 1),
    line: rgb(.86, .88, .87),
  };
  const embeddedLogo = logo ? await pdf.embedPng(logo.bytes) : undefined;
  const layout = createInvoiceLayout(draft, (text, size, role) => fonts[role].widthOfTextAtSize(text, size), embeddedLogo ? { width: embeddedLogo.width, height: embeddedLogo.height } : undefined);
  const supported = {
    regular: new Set(fonts.regular.getCharacterSet()),
    semibold: new Set(fonts.semibold.getCharacterSet()),
  };
  for (const page of layout.pages) {
    for (const operation of page.operations) {
      if (operation.kind === "text" && Array.from(operation.text).some((character) => !supported[operation.font].has(character.codePointAt(0)!))) {
        const error = new Error("Invoice font does not support one or more characters");
        error.name = "UnsupportedInvoiceCharacterError";
        throw error;
      }
    }
  }
  for (const plannedPage of layout.pages) {
    const page = pdf.addPage([layout.width, layout.height]);
    for (const operation of plannedPage.operations) {
      if (operation.kind === "rect") {
        page.drawRectangle({ x: operation.x, y: layout.height - operation.top - operation.height, width: operation.width, height: operation.height, color: colors[operation.ink] });
      } else if (operation.kind === "image") {
        if (!embeddedLogo) throw new Error("Missing invoice logo");
        page.drawImage(embeddedLogo, { x: operation.x, y: layout.height - operation.top - operation.height, width: operation.width, height: operation.height });
      } else {
        page.drawText(operation.text, { x: operation.x, y: layout.height - operation.top - operation.size, size: operation.size, font: fonts[operation.font], color: colors[operation.ink] });
      }
    }
  }
  return pdf.save();
}

export function downloadPdf(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser time to initiate the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
