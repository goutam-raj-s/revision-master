import Link from "next/link";
import type { Metadata } from "next";
import { Flame, Trophy, CalendarCheck, TrendingUp } from "lucide-react";
import { getPublicStatsByToken } from "@/actions/stat-share";
import { StreakCard } from "@/components/features/streak-card";
import { PublicHeader, PublicFooter } from "@/components/features/public-chrome";
import { Card } from "@/components/ui/card";

interface SharedStatsProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharedStatsProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getPublicStatsByToken(token);
  if (!data) return { title: "Stats not found", robots: { index: false, follow: false } };
  const title = `${data.name}'s learning stats`;
  return {
    title,
    description: `${data.streak.current}-day streak · ${data.streak.totalReviews} reviews on lostbae.`,
    robots: { index: false, follow: true },
    openGraph: { title, type: "profile" },
    twitter: { card: "summary_large_image", title },
  };
}

export default async function SharedStatsPage({ params }: SharedStatsProps) {
  const { token } = await params;
  const data = await getPublicStatsByToken(token);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas text-forest-slate">
        <PublicHeader />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-semibold">These stats aren&apos;t available</h1>
          <p className="mt-2 text-sm text-mossy-gray">The share link may have been removed.</p>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const { streak } = data;
  const weekTotal = streak.heatmap.slice(-7).reduce((s, d) => s + d.count, 0);
  const summary = [
    { label: "Current streak", value: `${streak.current}d`, icon: Flame, color: "text-state-stale" },
    { label: "Best streak", value: `${streak.best}d`, icon: Trophy, color: "text-state-completed" },
    { label: "This week", value: weekTotal, icon: CalendarCheck, color: "text-state-today" },
    { label: "Total reviews", value: streak.totalReviews, icon: TrendingUp, color: "text-state-upcoming" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-forest-slate">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">
          {data.name}&apos;s learning journey
        </h1>
        <p className="mt-1 text-sm text-mossy-gray">{data.totalDocs} documents · powered by spaced repetition</p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label} className="flex items-center gap-3 p-4 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className="font-mono text-xl font-bold leading-none text-forest-slate tabular-nums">{s.value}</div>
                <div className="mt-1 text-[11px] text-mossy-gray">{s.label}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <StreakCard data={streak} />
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
          <h3 className="text-lg font-semibold">Build your own learning streak</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-mossy-gray">
            lostbae turns your notes, docs and videos into a spaced-repetition queue you actually remember.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-state-today px-6 py-2.5 text-sm font-medium text-white transition-transform hover:scale-105"
          >
            Start free
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
