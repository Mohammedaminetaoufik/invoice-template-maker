import type { Locale } from "./i18n";

export type PageKey = "home" | "templates" | "simple" | "freelance" | "logo" | "guide" | "reminder" | "blog" | "reminderArticle" | "privacy" | "terms" | "about" | "contact";

export const routeMap: Record<PageKey, Record<Locale, string>> = {
  home: { en: "/en/", fr: "/fr/" },
  templates: { en: "/en/invoice-templates/", fr: "/fr/modeles-factures/" },
  simple: { en: "/en/simple-invoice-template/", fr: "/fr/modele-facture-simple/" },
  freelance: { en: "/en/freelance-invoice/", fr: "/fr/facture-freelance/" },
  logo: { en: "/en/invoice-with-logo/", fr: "/fr/facture-avec-logo/" },
  guide: { en: "/en/how-to-make-an-invoice/", fr: "/fr/comment-faire-une-facture/" },
  reminder: { en: "/en/late-payment-reminder-generator/", fr: "/fr/generateur-relance-facture-impayee/" },
  blog: { en: "/en/blog/", fr: "/fr/blog/" },
  reminderArticle: { en: "/en/blog/how-to-write-a-late-payment-reminder/", fr: "/fr/blog/comment-relancer-une-facture-impayee/" },
  privacy: { en: "/en/privacy/", fr: "/fr/confidentialite/" },
  terms: { en: "/en/terms/", fr: "/fr/conditions/" },
  about: { en: "/en/about/", fr: "/fr/a-propos/" },
  contact: { en: "/en/contact/", fr: "/fr/contact/" },
};

export function pageKeyFromSlug(locale: Locale, slug?: string[]): PageKey | undefined {
  const path = `/${locale}/${slug?.length ? `${slug.join("/")}/` : ""}`;
  return (Object.keys(routeMap) as PageKey[]).find((key) => routeMap[key][locale] === path);
}

export function localizedPath(key: PageKey, locale: Locale) {
  return routeMap[key][locale];
}

export const allLocalizedRoutes = (Object.keys(routeMap) as PageKey[]).flatMap((key) =>
  (["en", "fr"] as Locale[]).map((locale) => ({ key, locale, path: routeMap[key][locale] })),
);
