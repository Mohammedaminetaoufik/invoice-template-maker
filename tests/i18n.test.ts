import { describe, expect, it } from "vitest";
import { dictionaries, type TranslationShape } from "@/lib/i18n";
import { allLocalizedRoutes, pageKeyFromSlug, routeMap } from "@/lib/routes";
import { formatDate, formatMoney } from "@/lib/invoice";

function paths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => paths(item, `${prefix}[${index}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => paths(child, prefix ? `${prefix}.${key}` : key));
  return [prefix];
}

describe("internationalization", () => {
  it("keeps English and French dictionaries structurally complete", () => {
    expect(paths(dictionaries.fr).sort()).toEqual(paths(dictionaries.en).sort());
  });

  it("contains no empty translated strings", () => {
    const assertNonEmpty = (value: unknown) => {
      if (typeof value === "string") expect(value.trim()).not.toBe("");
      else if (Array.isArray(value)) value.forEach(assertNonEmpty);
      else if (value && typeof value === "object") Object.values(value).forEach(assertNonEmpty);
    };
    assertNonEmpty(dictionaries satisfies Record<string, TranslationShape>);
  });

  it("maps every localized route back to its page", () => {
    for (const route of allLocalizedRoutes) {
      const slug = route.path.replace(/^\/(en|fr)\/?|\/$/g, "");
      expect(pageKeyFromSlug(route.locale, slug ? slug.split("/") : [])).toBe(route.key);
    }
  });

  it("uses locale-aware money and date formatting", () => {
    expect(formatMoney(1234.5, "EUR", "fr")).toMatch(/1[\s\u00a0\u202f]234,50/);
    expect(formatMoney(1234.5, "USD", "en")).toContain("1,234.50");
    expect(formatDate("2026-10-12", "fr")).toMatch(/12 oct\. 2026/i);
    expect(formatDate("2026-10-12", "en")).toMatch(/Oct 12, 2026/i);
  });

  it("has reciprocal EN and FR paths for every page", () => {
    Object.values(routeMap).forEach((pair) => {
      expect(pair.en).toMatch(/^\/en\//);
      expect(pair.fr).toMatch(/^\/fr\//);
    });
  });
});
