import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInvoiceBackup, readInvoiceBackup } from "@/lib/backup";
import { createDefaultDraft } from "@/lib/invoice";
import * as assets from "@/lib/logo";

afterEach(() => vi.restoreAllMocks());

describe("invoice backups", () => {
  it("round-trips all invoice details without a logo", async () => {
    const draft = { ...createDefaultDraft("fr"), businessName: "Élan", clientName: "André", wizardStep: 2 as const, iban: "EXAMPLE", notes: "Merci", amountPaid: 50 };
    expect((await readInvoiceBackup(await createInvoiceBackup(draft), "en")).draft).toEqual(draft);
  });
  it("backs up the complete logo bytes and attaches a new validated local reference on restore", async () => {
    const logo: assets.InvoiceLogo = { id: "backup-logo", bytes: new Uint8Array([1, 2, 3, 4]), width: 4, height: 1 };
    await assets.saveLogo(logo);
    const draft = { ...createDefaultDraft("en"), logoId: logo.id };
    const contents = await createInvoiceBackup(draft);
    expect(JSON.parse(contents).logo.png).toBe(btoa(String.fromCharCode(1, 2, 3, 4)));
    const prepared = { ...logo, id: "restored-logo" };
    const decode = vi.spyOn(assets, "prepareLogo").mockResolvedValue(prepared);
    const restored = await readInvoiceBackup(contents, "fr");
    expect(decode).toHaveBeenCalledOnce();
    expect(restored.logo).toEqual(prepared);
    expect(restored.draft.logoId).toBe(prepared.id);
    await assets.deleteLogo(logo.id);
  });
  it("rejects missing binary data instead of losing a logo", async () => {
    await expect(readInvoiceBackup(JSON.stringify({ ...createDefaultDraft("en"), logoId: "missing" }), "en")).rejects.toThrow();
    await expect(createInvoiceBackup({ ...createDefaultDraft("en"), logoId: "missing" })).rejects.toThrow();
  });
  it("rejects invalid JSON and unsupported backup versions", async () => {
    await expect(readInvoiceBackup("invalid", "en")).rejects.toThrow();
    await expect(readInvoiceBackup('{"version":100}', "en")).rejects.toThrow();
  });
});
