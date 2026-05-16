/**
 * YouTube URL utility functions — safe to import from client and server.
 */

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("?")[0];
      if (id) return id;
    }
    // youtube.com variants
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      // youtube.com/embed/<id>
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
      // youtube.com/shorts/<id>
      const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function extractYoutubePlaylistId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const list = u.searchParams.get("list");
      if (list) return list;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function isYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null || extractYoutubePlaylistId(url) !== null;
}

export function getYoutubeThumbnail(idOrUrl: string): string | undefined {
  const id = idOrUrl.length === 11 ? idOrUrl : extractYoutubeVideoId(idOrUrl);
  if (!id) return undefined;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}
