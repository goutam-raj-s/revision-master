import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getAllPosts, getPostBySlug, renderMarkdown, formatDate, readingTime } from "@/lib/blog";
import { PublicHeader, PublicFooter, TryCta } from "@/components/features/public-chrome";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.lostbae.com").replace(/\/$/, "");

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${APP_URL}/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.content);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "lostbae" },
    mainEntityOfPage: `${APP_URL}/blog/${post.slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-forest-slate">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-mossy-gray transition-colors hover:text-forest-slate">
          <ArrowLeft className="h-3.5 w-3.5" /> All posts
        </Link>

        <article className="mt-6">
          <div className="flex items-center gap-2 text-xs text-mossy-gray">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>·</span>
            <span>{readingTime(post.content)} min read</span>
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-lg text-mossy-gray">{post.description}</p>

          <div className="tiptap-content mt-8" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs text-mossy-gray">#{t}</span>
            ))}
          </div>
        </article>

        <TryCta />
      </main>
      <PublicFooter />
    </div>
  );
}
