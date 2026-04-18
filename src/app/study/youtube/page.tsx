import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { fetchYoutubeMetadata, createOrGetYoutubeSession } from "@/actions/youtube";
import { YoutubeStudyClient } from "@/components/features/youtube-study-client";
import { YoutubeUrlForm } from "@/components/features/youtube-url-form";

interface YoutubeStudyPageProps {
  searchParams: Promise<{ v?: string }>;
}

export default async function YoutubeStudyPage({ searchParams }: YoutubeStudyPageProps) {
  await requireAuth();

  const { v: videoId } = await searchParams;

  // No video ID — render URL input form
  if (!videoId) {
    return (
      <div className="h-screen flex flex-col bg-canvas overflow-hidden">
        <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-white shadow-soft z-20">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-border/60">|</span>
          <h1 className="font-serif font-medium text-forest-slate text-sm">YouTube Study</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <YoutubeUrlForm />
        </div>
      </div>
    );
  }

  // Fetch metadata and create/get session
  const metadata = await fetchYoutubeMetadata(`https://www.youtube.com/watch?v=${videoId}`);
  const result = await createOrGetYoutubeSession(videoId, {
    title: metadata.title,
    thumbnailUrl: metadata.thumbnailUrl,
  });

  if (!result.success || !result.data) {
    redirect("/study/youtube");
  }

  const session = result.data;

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Minimal header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-white shadow-soft z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-border/60">|</span>
          <h1 className="font-serif font-medium text-forest-slate text-sm line-clamp-1 max-w-xl">
            {session.videoTitle}
          </h1>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-mossy-gray hover:text-forest-slate transition-colors"
        >
          Open on YouTube ↗
        </a>
      </header>

      {/* Main split-pane body */}
      <div className="flex-1 min-h-0">
        <YoutubeStudyClient session={session} />
      </div>
    </div>
  );
}
