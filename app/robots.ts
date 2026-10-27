import { MetadataRoute } from "next";
import { KEFOO_SITE_URL } from "@/lib/wedding/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${KEFOO_SITE_URL}/sitemap.xml`,
  };
}
