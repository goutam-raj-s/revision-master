import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { USE_CASES } from "@/content/use-cases";
import { PublicHeader, PublicFooter, TryCta } from "@/components/features/public-chrome";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.lostbae.com").replace(/\/$/, "");

interface UseCasePageProps {
  params: Promise<{ useCase: string }>;
}

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ useCase: u.slug }));
}

export async function generateMetadata({ params }: UseCasePageProps): Promise<Metadata> {
  const { useCase } = await params;
  const data = USE_CASES.find((u) => u.slug === useCase);
  if (!data) return { title: "Not found" };
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: `/for/${data.slug}` },
    openGraph: {
      type: "website",
      title: data.metaTitle,
      description: data.metaDescription,
      url: `${APP_URL}/for/${data.slug}`,
    },
    twitter: { card: "summary_large_image", title: data.metaTitle, description: data.metaDescription },
  };
}

export default async function UseCasePage({ params }: UseCasePageProps) {
  const { useCase } = await params;
  const data = USE_CASES.find((u) => u.slug === useCase);
  if (!data) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-forest-slate">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-state-today">{data.audience}</p>
        <h1 className="mt-2 font-serif text-3xl font-bold leading-tight sm:text-5xl">{data.headline}</h1>
        <p className="mt-4 max-w-2xl text-lg text-mossy-gray">{data.intro}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-state-today px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/blog/what-is-spaced-repetition"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium text-forest-slate transition-colors hover:bg-muted"
          >
            How it works
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {data.benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-state-today/10">
                <Check className="h-4 w-4 text-state-today" />
              </div>
              <h3 className="text-sm font-semibold text-forest-slate">{b.title}</h3>
              <p className="mt-1 text-sm text-mossy-gray">{b.body}</p>
            </div>
          ))}
        </div>

        <TryCta context={data.headline} />

        {/* Internal links to sibling use-cases for crawlability */}
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-mossy-gray">Also great for</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {USE_CASES.filter((u) => u.slug !== data.slug).map((u) => (
              <Link
                key={u.slug}
                href={`/for/${u.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-mossy-gray transition-colors hover:text-forest-slate"
              >
                {u.audience}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
