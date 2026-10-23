import type { MetadataRoute } from "next";
import { allLocalizedRoutes } from "@/lib/routes";
import { languageAlternates, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 0.7, alternates: { languages: languageAlternates("home") } },
    ...allLocalizedRoutes.map(({ key, path }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: key === "home" ? "weekly" as const : "monthly" as const,
      priority: key === "home" ? 1 : key === "reminder" ? 0.9 : key === "reminderArticle" ? 0.8 : key === "blog" ? 0.7 : key === "privacy" || key === "terms" ? 0.3 : 0.8,
      alternates: { languages: languageAlternates(key) },
    })),
  ];
}
