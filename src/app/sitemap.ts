import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { USE_CASES } from "@/content/use-cases";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.lostbae.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  type Entry = { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; lastModified?: Date };

  const staticRoutes: Entry[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/register", priority: 0.7, changeFrequency: "monthly" },
    { path: "/login", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ];

  const blogRoutes: Entry[] = getAllPosts().map((p) => ({
    path: `/blog/${p.slug}`,
    priority: 0.7,
    changeFrequency: "monthly",
    lastModified: new Date(p.date),
  }));

  const useCaseRoutes: Entry[] = USE_CASES.map((u) => ({
    path: `/for/${u.slug}`,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  return [...staticRoutes, ...blogRoutes, ...useCaseRoutes].map((r) => ({
    url: `${APP_URL}${r.path}`,
    lastModified: r.lastModified ?? now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
