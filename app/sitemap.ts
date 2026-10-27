import { MetadataRoute } from "next";
import { KEFOO_SITE_URL } from "@/lib/wedding/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: KEFOO_SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
