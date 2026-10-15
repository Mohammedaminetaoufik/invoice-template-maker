import "fake-indexeddb/auto";
import { readFile } from "node:fs/promises";
import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { deleteLogo, inspectRasterDimensions, loadLogo, MAX_LOGO_BYTES, saveLogo, validateLogoFile, type InvoiceLogo } from "@/lib/logo";
import { generateInvoicePdf } from "@/lib/pdf";
import { createDefaultDraft } from "@/lib/invoice";
import { templateIds } from "@/lib/templates";

const bytes = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
const logo: InvoiceLogo = { id: "test-logo", bytes, width: 1, height: 1 };

beforeAll(async () => {
  const [regular, semibold] = await Promise.all([readFile("public/fonts/NotoSans-Regular.woff"), readFile("public/fonts/NotoSans-Semibold.woff")]);
  vi.stubGlobal("fetch", vi.fn(async (url) => new Response(String(url).includes("Semibold") ? semibold : regular)));
});

describe("local logo storage and validation", () => {
  it("checks actual raster headers and dimensions before decoding", () => {
    expect(inspectRasterDimensions(bytes, "image/png")).toEqual({ width: 1, height: 1 });
    expect(() => inspectRasterDimensions(bytes, "image/jpeg")).toThrow();
    expect(() => inspectRasterDimensions(new Uint8Array([1, 2, 3]), "image/webp")).toThrow();
    const oversized = new Uint8Array(bytes);
    new DataView(oversized.buffer).setUint32(16, 10000);
    new DataView(oversized.buffer).setUint32(20, 10000);
    expect(() => inspectRasterDimensions(oversized, "image/png")).toThrow();
  });
  it.each(["image/png", "image/jpeg", "image/webp"])("accepts supported file type %s", (type) => {
    expect(() => validateLogoFile({ type, size: 100 })).not.toThrow();
  });
  it.each([{ type: "image/svg+xml", size: 100 }, { type: "image/png", size: 0 }, { type: "image/png", size: MAX_LOGO_BYTES + 1 }, { type: "text/plain", size: 100 }])("rejects unsupported, empty and oversized uploads", (file) => {
    expect(() => validateLogoFile(file)).toThrow();
  });
  it("persists binary data through IndexedDB and removes it", async () => {
    await saveLogo(logo);
    expect(await loadLogo(logo.id)).toEqual(logo);
    await deleteLogo(logo.id);
    expect(await loadLogo(logo.id)).toBeUndefined();
  });
  it("rejects malformed stored binary assets", async () => {
    await saveLogo({ ...logo, width: 0 });
    await expect(loadLogo(logo.id)).rejects.toThrow();
    await deleteLogo(logo.id);
  });
});

describe("logos in every exported template", () => {
  for (const template of templateIds) {
    for (const locale of ["en", "fr"] as const) {
      it(`embeds a PNG in ${template} ${locale}`, async () => {
        const draft = { ...createDefaultDraft(locale), template, logoId: logo.id, businessName: "Élan", clientName: "André" };
        const document = await PDFDocument.load(await generateInvoicePdf(draft, logo));
        const images = document.getPage(0).node.Resources()?.lookup(PDFName.of("XObject"), PDFDict);
        expect(images?.keys().length).toBeGreaterThan(0);
      }, 15000);
    }
  }
  it("refuses to silently omit a referenced but missing logo", async () => {
    await expect(generateInvoicePdf({ ...createDefaultDraft("en"), logoId: "missing" })).rejects.toThrow("unavailable");
  });
});
