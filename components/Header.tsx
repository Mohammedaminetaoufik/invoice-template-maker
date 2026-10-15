"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { routeMap } from "@/lib/routes";
import { BrandMark } from "./BrandMark";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const t = getDictionary(locale);
  const links = [
    ["templates", t.nav.templates],
    ["simple", t.nav.simple],
    ["freelance", t.nav.freelance],
    ["guide", t.nav.guide],
  ] as const;

  return (
    <header className="site-header">
      <div className="header-inner shell">
        <a className="brand" href={routeMap.home[locale]} aria-label={`${t.brand} — ${t.nav.generator}`}>
          <BrandMark />
          <span>{t.brand}</span>
        </a>
        <nav className={open ? "main-nav is-open" : "main-nav"} aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}>
          {links.map(([key, label]) => <a key={key} href={routeMap[key][locale]} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} label={t.header.language} />
          <a className="button button-small header-cta" href={`${routeMap.home[locale]}#generator`}>{t.header.create}</a>
          <button className="menu-button" aria-label={t.header.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
