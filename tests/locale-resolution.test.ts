import { describe, expect, it } from "vitest";
import {
  LANGUAGE_PREFERENCE_KEY,
  localeFromLanguageTag,
  resolvePreferredLocale,
  saveLocalePreference,
  shouldRedirectFromRoot,
} from "@/lib/locale-resolution";

describe("automatic root language routing", () => {
  it("routes a French browser to French", () => {
    expect(resolvePreferredLocale(null, ["fr-FR", "en-US"], "fr-FR")).toBe("fr");
  });

  it("routes an English browser to English", () => {
    expect(resolvePreferredLocale(null, ["en-GB", "fr-FR"], "en-GB")).toBe("en");
  });

  it("defaults unsupported browser languages to English", () => {
    expect(resolvePreferredLocale(null, ["ar-MA", "es-ES"], "ar-MA")).toBe("en");
  });

  it("handles supported regional variants", () => {
    expect(localeFromLanguageTag("fr-MA")).toBe("fr");
    expect(localeFromLanguageTag("fr-CA")).toBe("fr");
    expect(localeFromLanguageTag("en-US")).toBe("en");
    expect(localeFromLanguageTag("en_GB")).toBe("en");
  });

  it("keeps an explicitly requested English route", () => {
    expect(shouldRedirectFromRoot("/en/")).toBe(false);
  });

  it("keeps an explicitly requested French route", () => {
    expect(shouldRedirectFromRoot("/fr/")).toBe(false);
  });

  it("lets a manual French preference override an English browser", () => {
    expect(resolvePreferredLocale("fr", ["en-US"], "en-US")).toBe("fr");
  });

  it("lets a manual English preference override a French browser", () => {
    expect(resolvePreferredLocale("en", ["fr-FR"], "fr-FR")).toBe("en");
  });

  it("only activates automatic routing at the root, preventing loops", () => {
    expect(shouldRedirectFromRoot("/")).toBe(true);
    expect(shouldRedirectFromRoot("")).toBe(true);
    expect(shouldRedirectFromRoot("/en/invoice-templates/")).toBe(false);
    expect(shouldRedirectFromRoot("/fr/modeles-factures/")).toBe(false);
  });

  it("stores a manual preference without changing the invoice draft", () => {
    const values = new Map([["itm-invoice-draft-v1", '{"clientName":"Acme"}']]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    const before = storage.getItem("itm-invoice-draft-v1");
    saveLocalePreference(storage, "fr");
    expect(storage.getItem(LANGUAGE_PREFERENCE_KEY)).toBe("fr");
    expect(storage.getItem("itm-invoice-draft-v1")).toBe(before);
  });
});
