import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { requireAuth } from "@/lib/auth/session";
import { createOrGetYoutubeSession, fetchYoutubePlaylist, createOrGetExternalVideoSession } from "@/actions/youtube";
import { YoutubeStudyClient } from "@/components/features/youtube-study-client";
import { YoutubeUrlForm } from "@/components/features/youtube-url-form";
import { PlaylistPreview } from "@/components/features/playlist-preview";
import { getYoutubeBookmarks, checkYoutubeBookmark, getBookmarkedPlaylistVideos, persistPlaylistVideos } from "@/actions/youtube-bookmarks";
import { YoutubeBookmarkToggle } from "@/components/features/youtube-bookmark-toggle";
import { YoutubeBookmarksList } from "@/components/features/youtube-bookmarks-list";
import { YoutubePlaylistControls } from "@/components/features/youtube-playlist-controls";
import { YoutubePlaylistsList } from "@/components/features/youtube-playlists-list";
import { YoutubeSavedPlaylistPreview } from "@/components/features/youtube-saved-playlist-preview";
import { DashboardHeader } from "@/components/features/dashboard-header";
import { AiAssistant } from "@/components/features/ai-assistant";
import { getYoutubePlaylists } from "@/actions/youtube-playlists";
import { QuickGuideButton } from "@/components/ui/quick-guide-button";
import { YoutubeSessionActions } from "@/components/features/youtube-session-actions";
import { YoutubeShareButton } from "@/components/features/youtube-share-button";
import { YoutubePlaylistNav } from "@/components/features/youtube-playlist-nav";
import type { YoutubeSession } from "@/types";

const YT_SHORTCUTS = [
  { keys: "T", label: "Insert timestamp at cursor" },
  { keys: "−10s / +10s buttons", label: "Skip back / forward in video" },
  { keys: "⛶ Fullscreen + Notes", label: "Fullscreen with floating notes FAB" },
  { keys: "Cmd+B", label: "Bold in notes" },
  { keys: "Cmd+I", label: "Italic in notes" },
  { keys: "Cmd+U", label: "Underline in notes" },
  { keys: "Cmd+Shift+H", label: "Sticky yellow highlight" },
  { keys: "Cmd+Shift+P", label: "Sticky pink highlight" },
  { keys: "Cmd+Shift+O", label: "Sticky orange highlight" },
  { keys: "Cmd+Shift+I", label: "Sticky red highlight" },
  { keys: "Cmd+S", label: "Save notes" },
  { keys: "Chevron ›", label: "Collapse / expand notes panel" },
  { keys: "Cmd+K", label: "Command palette" },
  { keys: "Cmd+Shift+K", label: "Quick clipper widget" },
  { keys: "Cmd+Shift+V", label: "Clipboard history (last 10 copies)" },
];

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
              {canUsePlaylists && (
                <YoutubeSessionActions sessionId={session.id} currentTitle={session.videoTitle} />
              )}
              <QuickGuideButton shortcuts={YT_SHORTCUTS} title="YouTube Study" />
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
      let playlistData = await fetchYoutubePlaylist(playlistId);
      const isBookmarked = await checkYoutubeBookmark(playlistId);

      // Persistence: keep saved playlists resilient to YouTube fetch glitches.
      if (playlistData.videos.length === 0) {
        const stored = await getBookmarkedPlaylistVideos(playlistId);
        if (stored.length > 0) playlistData = { ...playlistData, videos: stored };
      } else if (isBookmarked) {
        await persistPlaylistVideos(playlistId, playlistData.videos);
      }

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
                videos={playlistData.videos}
              />
            }
          />
          <PlaylistPreview playlist={playlistData} bookmarked={isBookmarked} />
        </div>
      );
    } catch {
      redirect("/study/youtube");
    }
  }

  // Get-or-create the session. Metadata is fetched lazily inside only when a
  // new session must be created, so revisiting a known video skips the slow
  // external YouTube metadata call entirely.
  const result = await createOrGetYoutubeSession(videoId as string);

  if (!result.success || !result.data) {
    redirect("/study/youtube");
  }

  const session = result.data;
  const [isBookmarked, youtubePlaylists] = await Promise.all([
    checkYoutubeBookmark(videoId as string),
    getYoutubePlaylists(),
  ]);

  // Playlist navigation context
  let playlistNavData: {
    playlistId: string;
    playlistName: string;
    prevItem: import("@/types").YoutubePlaylistItem | null;
    nextItem: import("@/types").YoutubePlaylistItem | null;
    currentIndex: number;
    total: number;
  } | null = null;

  if (youtubePlaylistId) {
    const playlist = youtubePlaylists.find((p) => p.id === youtubePlaylistId);
    if (playlist && playlist.items.length > 0) {
      const idx = playlist.items.findIndex((item) => item.videoId === videoId || item.sessionId === session.id);
      if (idx !== -1) {
        playlistNavData = {
          playlistId: playlist.id,
          playlistName: playlist.name,
          prevItem: idx > 0 ? playlist.items[idx - 1] : null,
          nextItem: idx < playlist.items.length - 1 ? playlist.items[idx + 1] : null,
          currentIndex: idx + 1,
          total: playlist.items.length,
        };
      }
    }
  }

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
          <div className="flex items-center gap-2 sm:gap-3">
            {playlistNavData && (
              <YoutubePlaylistNav {...playlistNavData} />
            )}
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
              className="hidden sm:inline text-xs text-mossy-gray hover:text-forest-slate transition-colors"
            >
              YouTube ↗
            </a>
            <YoutubeShareButton resourceType="session" resourceId={session.id} title={session.videoTitle} />
            <YoutubeSessionActions sessionId={session.id} currentTitle={session.videoTitle} />
            <QuickGuideButton shortcuts={YT_SHORTCUTS} title="YouTube Study" />
          </div>
        }
      />

      {/* Main split-pane body */}
      <div className="flex-1 min-h-0">
        <YoutubeStudyClient session={session} />
      </div>

      <AiAssistant kind="video" contextId={session.id} title={session.videoTitle} />
    </div>
  );
}
