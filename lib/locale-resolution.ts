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

// Executes only in the root document head, before fallback content paints.
export const ROOT_LOCALE_REDIRECT_SCRIPT = `
(function () {
  if (window.location.pathname !== "/") return;
  var key = "${LANGUAGE_PREFERENCE_KEY}";
  var supported = { en: true, fr: true };
  function localeOf(value) {
    if (!value) return null;
    var base = String(value).trim().toLowerCase().split(/[-_]/)[0];
    return supported[base] ? base : null;
  }
  var saved = null;
  try { saved = localeOf(window.localStorage.getItem(key)); } catch (_) {}
  var locale = saved;
  if (!locale) {
    var languages = Array.isArray(window.navigator.languages) ? window.navigator.languages : [];
    for (var index = 0; index < languages.length && !locale; index += 1) {
      locale = localeOf(languages[index]);
    }
  }
  locale = locale || localeOf(window.navigator.language) || "en";
  window.location.replace("/" + locale + "/");
})();
`;
