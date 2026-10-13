"use client";

import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { saveLocalePreference } from "@/lib/locale-resolution";
import { pageKeyFromSlug, routeMap } from "@/lib/routes";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const key = pageKeyFromSlug(locale, segments.slice(1)) ?? "home";

  function rememberLanguage(nextLocale: Locale) {
    saveLocalePreference(localStorage, nextLocale);
  }

  return (
    <div className="language-switcher" aria-label={label}>
      <Languages size={15} aria-hidden="true" />
      {(["en", "fr"] as Locale[]).map((nextLocale) => (
        <a
          key={nextLocale}
          href={routeMap[key][nextLocale]}
          hrefLang={nextLocale}
          lang={nextLocale}
          aria-current={nextLocale === locale ? "page" : undefined}
          onClick={() => rememberLanguage(nextLocale)}
        >
          {nextLocale.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
