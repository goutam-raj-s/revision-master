import { marked } from "marked";
import { BLOG_POSTS, type BlogPost } from "@/content/blog-posts";

marked.setOptions({ gfm: true, breaks: false });

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function renderMarkdown(md: string): string {
  return marked.parse(md.trim()) as string;
}

/** Rough reading time in minutes from a markdown string. */
export function readingTime(md: string): number {
  const words = md.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
