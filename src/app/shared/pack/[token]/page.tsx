import Link from "next/link";
import type { Metadata } from "next";
import { FileText, CirclePlay, Layers } from "lucide-react";
import { getPublicPackByToken } from "@/actions/collections";
import { PublicHeader, PublicFooter } from "@/components/features/public-chrome";

interface PackPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PackPageProps): Promise<Metadata> {
  const { token } = await params;
  const pack = await getPublicPackByToken(token);
  if (!pack) return { title: "Study pack not found", robots: { index: false, follow: false } };
  return {
    title: `${pack.name} — study pack`,
    description: `A ${pack.items.length}-item study pack shared on lostbae.`,
    robots: { index: true, follow: true },
    openGraph: { title: `${pack.name} — study pack on lostbae`, type: "website" },
    twitter: { card: "summary_large_image", title: `${pack.name} — study pack` },
  };
}

export default async function PublicPackPage({ params }: PackPageProps) {
  const { token } = await params;
  const pack = await getPublicPackByToken(token);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-forest-slate">
      <PublicHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {!pack ? (
          <div className="py-20 text-center">
            <h1 className="text-xl font-semibold">This study pack isn&apos;t available</h1>
            <p className="mt-2 text-sm text-mossy-gray">The share link may have been turned off.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-state-today/10">
                <Layers className="h-5 w-5 text-state-today" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-state-today">Study pack</p>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl">{pack.name}</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-mossy-gray">{pack.items.length} items</p>

            <ul className="mt-6 space-y-2">
              {pack.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
                  {item.mediaType === "video" || item.mediaType === "audio" ? (
                    <CirclePlay className="h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-mossy-gray" />
                  )}
                  <span className="truncate text-sm font-medium text-forest-slate">{item.title}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
              <h3 className="text-lg font-semibold">Study this pack with spaced repetition</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-mossy-gray">
                Save this pack to your own library and lostbae will schedule each item for review so you actually remember it.
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-state-today px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
              >
                Start free
              </Link>
            </div>
          </>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
