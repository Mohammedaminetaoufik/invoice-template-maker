import type { Locale } from "./i18n";

export const LANGUAGE_PREFERENCE_KEY = "itm-preferred-language";

export type LanguageStorage = Pick<Storage, "getItem" | "setItem">;

export function localeFromLanguageTag(value: string | null | undefined): Locale | undefined {
  if (!value) return undefined;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return base === "en" || base === "fr" ? base : undefined;
}

export function resolvePreferredLocale(
  savedPreference: string | null | undefined,
  browserLanguages: readonly string[] = [],
  browserLanguage?: string,
): Locale {
  const saved = localeFromLanguageTag(savedPreference);
  if (saved) return saved;

  for (const language of browserLanguages) {
    const locale = localeFromLanguageTag(language);
    if (locale) return locale;
  }

  return localeFromLanguageTag(browserLanguage) ?? "en";
}

export function saveLocalePreference(storage: LanguageStorage, locale: Locale) {
  storage.setItem(LANGUAGE_PREFERENCE_KEY, locale);
}

export function shouldRedirectFromRoot(pathname: string) {
  return pathname === "/" || pathname === "";
}

// Static/offline fallback for the edge's permanent root redirect. Preserve model links.
export const ROOT_LOCALE_REDIRECT_SCRIPT = `
(function () {
  if (window.location.pathname !== "/") return;
  window.location.replace("/en/" + window.location.search + window.location.hash);
})();
`;
