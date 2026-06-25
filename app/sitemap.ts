import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://kefoo.tech",
      lastModified: new Date(),
    },
  ];
}