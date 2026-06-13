/**
 * YouTube URL utility functions — safe to import from client and server.
 */

const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const HOST_LIKE_INPUT_PATTERN = /^(?:localhost(?::\d+)?(?:[/?#]|$)|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#]|$)|[^\s/]+\.[^\s/]+.*$)/i;

function isYoutubeHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return (
    host === "youtube.com" ||
    host.endsWith(".youtube.com") ||
    host === "youtube-nocookie.com" ||
    host.endsWith(".youtube-nocookie.com") ||
    host === "youtu.be"
  );
}

function cleanYoutubeId(value: string | null): string | null {
  if (!value) return null;
  const id = value.trim().split(/[?&#/]/)[0];
  return YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
}

export function parseUrlInput(input: string): URL | null {
  const trimmed = input.trim().replace(/^<(.+)>$/, "$1");
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    try {
      if (!HOST_LIKE_INPUT_PATTERN.test(trimmed)) return null;
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function extractNestedYoutubeUrl(u: URL): string | null {
  for (const key of ["u", "url", "q"]) {
    const nested = u.searchParams.get(key);
    if (!nested) continue;
    let nestedUrl = parseUrlInput(nested);
    if (!nestedUrl) {
      try {
        nestedUrl = new URL(nested, "https://www.youtube.com");
      } catch {
        nestedUrl = null;
      }
    }
    if (nestedUrl && isYoutubeHost(nestedUrl.hostname)) return nestedUrl.toString();
  }
  return null;
}

// Last-resort scan of the raw string — catches messy pastes where the host or
// scheme is missing/garbled but a recognizable YouTube id is still present.
function scanRawForVideoId(raw: string): string | null {
  const s = raw.trim();
  if (YOUTUBE_VIDEO_ID_PATTERN.test(s)) return s; // whole input is an 11-char id
  const m = s.match(
    /(?:youtu\.be\/|\/embed\/|\/shorts\/|\/live\/|\/v\/|[?&]v=|^v=)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function scanRawForPlaylistId(raw: string): string | null {
  const m = raw.trim().match(/(?:^|[?&])list=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export function extractYoutubeVideoId(url: string): string | null {
  const u = parseUrlInput(url);
  if (u && isYoutubeHost(u.hostname)) {
    const nested = extractNestedYoutubeUrl(u);
    if (nested) return extractYoutubeVideoId(nested);

    // youtu.be/<id>
    if (u.hostname.toLowerCase().replace(/^www\./, "") === "youtu.be") {
      const id = cleanYoutubeId(u.pathname.split("/").filter(Boolean)[0] ?? null);
      if (id) return id;
    }

    const v = cleanYoutubeId(u.searchParams.get("v"));
    if (v) return v;

    // youtube.com/embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const pathIdMatch = u.pathname.match(/^\/(?:embed|shorts|live|v|e)\/([^/?#]+)/);
    if (pathIdMatch) {
      const id = cleanYoutubeId(pathIdMatch[1]);
      if (id) return id;
    }
  }

  // Tolerant fallback for partial/garbled input.
  return scanRawForVideoId(url);
}

export function extractYoutubePlaylistId(url: string): string | null {
  const u = parseUrlInput(url);
  if (u && isYoutubeHost(u.hostname)) {
    const nested = extractNestedYoutubeUrl(u);
    if (nested) return extractYoutubePlaylistId(nested);

    const list = u.searchParams.get("list")?.trim();
    if (list) return list;
  }

  // Tolerant fallback (e.g. "list=PL..." pasted without the domain).
  return scanRawForPlaylistId(url);
}

export function isYoutubeUrl(url: string): boolean {
  return extractYoutubeVideoId(url) !== null || extractYoutubePlaylistId(url) !== null;
}

export function getYoutubeThumbnail(idOrUrl: string): string | undefined {
  const id = idOrUrl.length === 11 ? idOrUrl : extractYoutubeVideoId(idOrUrl);
  if (!id) return undefined;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}
