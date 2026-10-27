import { MetadataRoute } from "next";
import { budgetArticles } from "@/lib/wedding/budget-articles";
import { KEFOO_SITE_URL } from "@/lib/wedding/seo";

const publicPages: Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
  lastModified?: Date;
}> = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  {
    path: "/wedding-budget-planner",
    changeFrequency: "monthly" as const,
    priority: 0.9,
  },
  {
    path: "/privacy",
    changeFrequency: "yearly" as const,
    priority: 0.3,
    lastModified: new Date("2026-10-27T00:00:00Z"),
  },
  {
    path: "/terms",
    changeFrequency: "yearly" as const,
    priority: 0.3,
    lastModified: new Date("2026-10-27T00:00:00Z"),
  },
  {
    path: "/refund",
    changeFrequency: "yearly" as const,
    priority: 0.3,
    lastModified: new Date("2026-10-27T00:00:00Z"),
  },
  ...budgetArticles.map((article) => ({
    path: `/wedding-budget-planner/${article.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: new Date(`${article.updatedAt}T00:00:00`),
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({
    url: `${KEFOO_SITE_URL}${page.path}`,
    lastModified: page.lastModified ?? new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
