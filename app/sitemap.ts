import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const siteUrl = "https://college-docs.vercel.app";

const publicRoutes = ["", "/login"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of publicRoutes) {
      const url = route ? `${siteUrl}/${locale}${route}` : `${siteUrl}/${locale}`;
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: route === "" ? 1.0 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${siteUrl}/${l}${route}`]),
          ),
        },
      });
    }
  }

  return entries;
}
