import type { Metadata } from "next";
import { pageContent } from "./content";
import type { Locale } from "./i18n";
import type { PageKey } from "./routes";
import { routeMap } from "./routes";

export const SITE_URL = "https://invoicetemplatemaker.com";

export function pageMetadata(locale: Locale, key: PageKey): Metadata {
  const content = pageContent[locale][key];
  const canonical = `${SITE_URL}${routeMap[key][locale]}`;
  return {
    title: content.title,
    description: content.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}${routeMap[key].en}`,
        fr: `${SITE_URL}${routeMap[key].fr}`,
        "x-default": `${SITE_URL}/`,
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: canonical,
      siteName: "InvoiceTemplateMaker",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
    },
  };
}
