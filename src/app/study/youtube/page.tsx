import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { requireAuth } from "@/lib/auth/session";
import { fetchYoutubeMetadata, createOrGetYoutubeSession, fetchYoutubePlaylist, createOrGetExternalVideoSession } from "@/actions/youtube";
import { YoutubeStudyClient } from "@/components/features/youtube-study-client";
import { YoutubeUrlForm } from "@/components/features/youtube-url-form";
import { PlaylistPreview } from "@/components/features/playlist-preview";
import { getYoutubeBookmarks, checkYoutubeBookmark } from "@/actions/youtube-bookmarks";
import { YoutubeBookmarkToggle } from "@/components/features/youtube-bookmark-toggle";
import { YoutubeBookmarksList } from "@/components/features/youtube-bookmarks-list";
import { YoutubePlaylistControls } from "@/components/features/youtube-playlist-controls";
import { YoutubePlaylistsList } from "@/components/features/youtube-playlists-list";
import { YoutubeSavedPlaylistPreview } from "@/components/features/youtube-saved-playlist-preview";
import { DashboardHeader } from "@/components/features/dashboard-header";
import { getYoutubePlaylists } from "@/actions/youtube-playlists";
import type { YoutubeSession } from "@/types";

interface YoutubeStudyPageProps {
  searchParams: Promise<{ v?: string; list?: string; u?: string; yp?: string }>;
}

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".ogv", ".mov", ".m4v"];

function parseExternalUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function inferExternalPlayerType(url: URL): "direct" | "iframe" {
  const pathname = url.pathname.toLowerCase();
  return DIRECT_VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext)) ? "direct" : "iframe";
}

function getExternalTitle(url: URL): string {
  const lastPathPart = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1) ?? "");
  return lastPathPart || url.hostname.replace(/^www\./, "");
}

function createExternalPreviewSession(url: URL): YoutubeSession {
  const videoUrl = url.toString();
  const id = createHash("sha256").update(videoUrl).digest("hex").slice(0, 24);
  const now = new Date().toISOString();

  return {
    id: `external-preview-${id}`,
    videoId: `external-${id}`,
    videoTitle: getExternalTitle(url),
    thumbnailUrl: "",
    videoUrl,
    sourceType: "external",
    playerType: inferExternalPlayerType(url),
    notes: "",
    tags: ["external-video", "local-preview"],
    difficulty: "medium",
    createdAt: now,
    updatedAt: now,
  };
}

export default async function YoutubeStudyPage({ searchParams }: YoutubeStudyPageProps) {
  const { v: videoId, list: playlistId, u: externalUrl, yp: youtubePlaylistId } = await searchParams;

  if (!videoId && externalUrl) {
    const parsedExternalUrl = parseExternalUrl(externalUrl);
    if (!parsedExternalUrl) redirect("/study/youtube");

    const result = await createOrGetExternalVideoSession(parsedExternalUrl.toString());
    const session = result.success && result.data
      ? result.data
      : createExternalPreviewSession(parsedExternalUrl);
    const canUsePlaylists = !session.id.startsWith("external-preview-");
    const youtubePlaylists = canUsePlaylists ? await getYoutubePlaylists() : [];

    return (
      <div className="h-screen flex flex-col bg-canvas overflow-hidden">
        <DashboardHeader
          showLogo={true}
          customBreadcrumbs={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/study/youtube", label: "YouTube Study" },
            { href: `/study/youtube?u=${encodeURIComponent(session.videoUrl)}`, label: session.videoTitle },
          ]}
          rightActions={
            <div className="flex items-center gap-3">
              {canUsePlaylists && (
                <YoutubePlaylistControls
                  sessionId={session.id}
                  initialPlaylists={youtubePlaylists}
                />
              )}
              <a
                href={session.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-mossy-gray hover:text-forest-slate transition-colors"
              >
                Open original ↗
              </a>
            </div>
          }
        />

        <div className="flex-1 min-h-0">
          <YoutubeStudyClient session={session} />
        </div>
      </div>
    );
  }

  await requireAuth();

  // No video ID and no playlist ID — render URL input form
  if (!videoId && !playlistId && !externalUrl && !youtubePlaylistId) {
    const [bookmarks, youtubePlaylists] = await Promise.all([
      getYoutubeBookmarks(),
      getYoutubePlaylists(),
    ]);

    return (
      <div className="h-screen flex flex-col bg-canvas overflow-y-auto">
        <DashboardHeader 
          showLogo={true}
          customBreadcrumbs={[{ href: "/dashboard", label: "Dashboard" }, { href: "/study/youtube", label: "YouTube Study" }]}
        />
        <div className="flex-1 flex flex-col items-center p-8 w-full max-w-5xl mx-auto">
          <div className="mt-[10vh] w-full flex justify-center">
            <YoutubeUrlForm />
          </div>
          <YoutubePlaylistsList initialPlaylists={youtubePlaylists} />
          <YoutubeBookmarksList bookmarks={bookmarks} />
        </div>
      </div>
    );
  }

  if (!videoId && !playlistId && youtubePlaylistId) {
    const youtubePlaylists = await getYoutubePlaylists();
    const playlist = youtubePlaylists.find((item) => item.id === youtubePlaylistId);
    if (!playlist) redirect("/study/youtube");

    return (
      <div className="h-screen flex flex-col bg-canvas overflow-hidden">
        <DashboardHeader
          showLogo={true}
          customBreadcrumbs={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/study/youtube", label: "YouTube Study" },
            { href: `/study/youtube?yp=${playlist.id}`, label: playlist.name },
          ]}
        />
        <YoutubeSavedPlaylistPreview playlist={playlist} />
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
          <DashboardHeader 
            showLogo={true}
            customBreadcrumbs={[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/study/youtube", label: "YouTube Study" },
              { href: `/study/youtube?list=${playlistId}`, label: playlistData.title },
            ]}
            rightActions={
              <YoutubeBookmarkToggle 
                youtubeId={playlistId} 
                type="playlist" 
                title={playlistData.title} 
                thumbnailUrl={playlistData.videos[0]?.thumbnailUrl || ""} 
                initialIsBookmarked={isBookmarked} 
              />
            }
          />
          <PlaylistPreview playlist={playlistData} />
        </div>
      );
    } catch {
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
  const [isBookmarked, youtubePlaylists] = await Promise.all([
    checkYoutubeBookmark(videoId as string),
    getYoutubePlaylists(),
  ]);

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Minimal header */}
      <DashboardHeader 
        showLogo={true}
        customBreadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/study/youtube", label: "YouTube Study" },
          { href: `/study/youtube?v=${videoId}`, label: session.videoTitle },
        ]}
        rightActions={
          <div className="flex items-center gap-3">
            <YoutubePlaylistControls
              sessionId={session.id}
              initialPlaylists={youtubePlaylists}
            />
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
        }
      />

      {/* Main split-pane body */}
      <div className="flex-1 min-h-0">
        <YoutubeStudyClient session={session} />
      </div>
    </div>
  );
}
