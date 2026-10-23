import type { Metadata } from "next";
import { pageContent } from "./content";
import type { Locale } from "./i18n";
import type { PageKey } from "./routes";
import { routeMap } from "./routes";

export const SITE_URL = "https://invoicetemplatemaker.com";

export function languageAlternates(key: PageKey): Record<string, string> {
  const languages: Record<string, string> = {
    en: `${SITE_URL}${routeMap[key].en}`,
    fr: `${SITE_URL}${routeMap[key].fr}`,
  };
  if (key === "home") languages["x-default"] = `${SITE_URL}/`;
  return languages;
}

export function socialImagePath(locale: Locale, key: PageKey) {
  return `/og/invoice-maker-${key}-${locale}-v3.jpg`;
}

const socialImage = (locale: Locale, key: PageKey, alt: string) => ({
  url: `${SITE_URL}${socialImagePath(locale, key)}`,
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt,
});

export function pageMetadata(locale: Locale, key: PageKey): Metadata {
  const content = pageContent[locale][key];
  const canonical = `${SITE_URL}${routeMap[key][locale]}`;
  return {
    title: content.title,
    description: content.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: languageAlternates(key),
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: canonical,
      siteName: "InvoiceTemplateMaker",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? "en_US" : "fr_FR",
      images: [socialImage(locale, key, content.title)],
      type: key === "reminderArticle" ? "article" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
      images: [socialImage(locale, key, content.title)],
    },
    robots: { index: true, follow: true },
  };
}
