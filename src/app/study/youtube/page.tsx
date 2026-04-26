import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { fetchYoutubeMetadata, createOrGetYoutubeSession, fetchYoutubePlaylist } from "@/actions/youtube";
import { YoutubeStudyClient } from "@/components/features/youtube-study-client";
import { YoutubeUrlForm } from "@/components/features/youtube-url-form";
import { PlaylistPreview } from "@/components/features/playlist-preview";
import { getYoutubeBookmarks, checkYoutubeBookmark } from "@/actions/youtube-bookmarks";
import { YoutubeBookmarkToggle } from "@/components/features/youtube-bookmark-toggle";
import { YoutubeBookmarksList } from "@/components/features/youtube-bookmarks-list";

interface YoutubeStudyPageProps {
  searchParams: Promise<{ v?: string; list?: string }>;
}

export default async function YoutubeStudyPage({ searchParams }: YoutubeStudyPageProps) {
  await requireAuth();

  const { v: videoId, list: playlistId } = await searchParams;

  // No video ID and no playlist ID — render URL input form
  if (!videoId && !playlistId) {
    const bookmarks = await getYoutubeBookmarks();

    return (
      <div className="h-screen flex flex-col bg-canvas overflow-y-auto">
        <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-white shadow-soft z-20 sticky top-0">
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
        <div className="flex-1 flex flex-col items-center p-8 w-full max-w-5xl mx-auto">
          <div className="mt-[10vh] w-full flex justify-center">
            <YoutubeUrlForm />
          </div>
          <YoutubeBookmarksList bookmarks={bookmarks} />
        </div>
      </div>
    );
  }

  // Playlist ID only — render PlaylistPreview
  if (!videoId && playlistId) {
    try {
      const playlistData = await fetchYoutubePlaylist(playlistId);
      const isBookmarked = await checkYoutubeBookmark(playlistId);

      return (
        <div className="h-screen flex flex-col bg-canvas overflow-hidden">
          <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-white shadow-soft z-20">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <span className="text-border/60">|</span>
              <h1 className="font-serif font-medium text-forest-slate text-sm line-clamp-1 max-w-xl">
                {playlistData.title}
              </h1>
            </div>
            <YoutubeBookmarkToggle 
              youtubeId={playlistId} 
              type="playlist" 
              title={playlistData.title} 
              thumbnailUrl={playlistData.videos[0]?.thumbnailUrl || ""} 
              initialIsBookmarked={isBookmarked} 
            />
          </header>
          <PlaylistPreview playlist={playlistData} />
        </div>
      );
    } catch (err) {
      redirect("/study/youtube");
    }
  }

  // Fetch metadata and create/get session
  const metadata = await fetchYoutubeMetadata(`https://www.youtube.com/watch?v=${videoId}`);
  const result = await createOrGetYoutubeSession(videoId as string, {
    title: metadata.title,
    thumbnailUrl: metadata.thumbnailUrl,
  });

  if (!result.success || !result.data) {
    redirect("/study/youtube");
  }

  const session = result.data;
  const isBookmarked = await checkYoutubeBookmark(videoId as string);

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Minimal header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-white shadow-soft z-20">
        <div className="flex items-center gap-3">
          {playlistId ? (
            <Link
              href={`/study/youtube?list=${playlistId}`}
              className="flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Playlist
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          )}
          <span className="text-border/60">|</span>
          <h1 className="font-serif font-medium text-forest-slate text-sm line-clamp-1 max-w-xl">
            {session.videoTitle}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <YoutubeBookmarkToggle 
            youtubeId={videoId as string} 
            type="video" 
            title={session.videoTitle} 
            thumbnailUrl={session.thumbnailUrl} 
            initialIsBookmarked={isBookmarked} 
          />
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-mossy-gray hover:text-forest-slate transition-colors"
          >
            Open on YouTube ↗
          </a>
        </div>
      </header>

      {/* Main split-pane body */}
      <div className="flex-1 min-h-0">
        <YoutubeStudyClient session={session} />
      </div>
    </div>
  );
}
