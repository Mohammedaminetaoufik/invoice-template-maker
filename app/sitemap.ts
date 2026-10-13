import type { MetadataRoute } from "next";
import { allLocalizedRoutes } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 0.7, alternates: { languages: { en: `${SITE_URL}/en/`, fr: `${SITE_URL}/fr/`, "x-default": `${SITE_URL}/` } } },
    ...allLocalizedRoutes.map(({ key, path }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: key === "home" ? "weekly" as const : "monthly" as const,
      priority: key === "home" ? 1 : key === "privacy" || key === "terms" ? 0.3 : 0.8,
      alternates: { languages: { en: `${SITE_URL}${allLocalizedRoutes.find((route) => route.key === key && route.locale === "en")!.path}`, fr: `${SITE_URL}${allLocalizedRoutes.find((route) => route.key === key && route.locale === "fr")!.path}` } },
    })),
  ];
}
