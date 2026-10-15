import type { Locale } from "./i18n";
import type { InvoiceDraft } from "./invoice";
import { parseStoredDraft } from "./draft-storage";
import { loadLogo, prepareLogo, type InvoiceLogo } from "./logo";

export async function createInvoiceBackup(draft: InvoiceDraft) {
  const logo = draft.logoId ? await loadLogo(draft.logoId) : undefined;
  if (draft.logoId && !logo) throw new Error("Missing logo");
  let binary = "";
  if (logo) for (const byte of logo.bytes) binary += String.fromCharCode(byte);
  return JSON.stringify({ version: 2, draft, logo: logo ? { png: btoa(binary) } : undefined }, null, 2);
}

export async function readInvoiceBackup(json: string, locale: Locale): Promise<{ draft: InvoiceDraft; logo?: InvoiceLogo }> {
  if (json.length > 4 * 1024 * 1024) throw new Error("Backup too large");
  const draft = parseStoredDraft(json, locale);
  const input = JSON.parse(json);
  if (input.logo) {
    if (typeof input.logo.png !== "string") throw new Error("Invalid backup logo");
    const binary = atob(input.logo.png);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const logo = await prepareLogo(new File([bytes], "logo.png", { type: "image/png" }));
    return { draft: { ...draft, logoId: logo.id }, logo };
  }
  if (draft.logoId) throw new Error("Backup does not contain its logo");
  return { draft };
}

export function downloadBackup(contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url; link.download = "invoice-draft.json";
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
