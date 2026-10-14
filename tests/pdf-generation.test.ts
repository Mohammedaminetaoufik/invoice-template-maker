import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createDefaultDraft, type TemplateId } from "@/lib/invoice";
import { generateInvoicePdf } from "@/lib/pdf";
import type { Locale } from "@/lib/i18n";
import { templateIds } from "@/lib/templates";

describe("bilingual template PDF generation", () => {
  beforeAll(async () => {
    const [regular, semibold] = await Promise.all([
      readFile(resolve("public/fonts/NotoSans-Regular.woff")),
      readFile(resolve("public/fonts/NotoSans-Semibold.woff")),
    ]);
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request) =>
      new Response(String(url).includes("Semibold") ? semibold : regular),
    ));
  });

  for (const locale of ["en", "fr"] satisfies Locale[]) {
    for (const template of templateIds satisfies readonly TemplateId[]) {
      it(`generates the ${template} template in ${locale}`, async () => {
        const draft = createDefaultDraft(locale);
        Object.assign(draft, {
          template,
          documentLocale: locale,
          businessName: locale === "fr" ? "Société Élan" : "Northstar Studio",
          businessEmail: "hello@example.com",
          clientName: locale === "fr" ? "André & Fils" : "Acme & Co.",
          items: [{ id: "1", description: locale === "fr" ? "Création et stratégie" : "Design and strategy", quantity: 2, rate: 750 }],
          taxRate: 20,
          notes: locale === "fr" ? "Merci pour votre confiance. Échéance à réception." : "Thank you for your business.",
        });
        const bytes = await generateInvoicePdf(draft);
        expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
        expect(bytes.byteLength).toBeGreaterThan(5000);
      });
    }
  }
});
