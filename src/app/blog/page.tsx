import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getAllPosts, formatDate, readingTime } from "@/lib/blog";
import { PublicHeader, PublicFooter, TryCta } from "@/components/features/public-chrome";

export const metadata: Metadata = {
  title: "Blog — Study Smarter with Spaced Repetition",
  description:
    "Practical guides on spaced repetition, active recall and remembering what you read, watch and note.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-forest-slate">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">The lostbae Blog</h1>
        <p className="mt-2 text-mossy-gray">
          Learn how to remember more of what you study — with less time.
        </p>

        <div className="mt-10 space-y-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-hover sm:p-6"
            >
              <div className="flex items-center gap-2 text-xs text-mossy-gray">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span>·</span>
                <span>{readingTime(post.content)} min read</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold transition-colors group-hover:text-state-today">
                {post.title}
              </h2>
              <p className="mt-1.5 text-sm text-mossy-gray">{post.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-state-today">
                Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <TryCta />
      </main>
      <PublicFooter />
    </div>
  );
}
