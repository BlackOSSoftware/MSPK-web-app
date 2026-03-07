import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: new URL("/trial", siteUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
