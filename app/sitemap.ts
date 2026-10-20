import type { MetadataRoute } from "next";
import { allLocalizedRoutes } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 0.7, alternates: { languages: { en: `${SITE_URL}/en/`, fr: `${SITE_URL}/fr/`, "x-default": `${SITE_URL}/` } } },
    ...allLocalizedRoutes.map(({ key, path }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: key === "home" ? "weekly" as const : "monthly" as const,
      priority: key === "home" ? 1 : key === "reminder" ? 0.9 : key === "reminderArticle" ? 0.8 : key === "blog" ? 0.7 : key === "privacy" || key === "terms" ? 0.3 : 0.8,
      alternates: { languages: { en: `${SITE_URL}${allLocalizedRoutes.find((route) => route.key === key && route.locale === "en")!.path}`, fr: `${SITE_URL}${allLocalizedRoutes.find((route) => route.key === key && route.locale === "fr")!.path}`, "x-default": `${SITE_URL}/` } },
    })),
  ];
}
