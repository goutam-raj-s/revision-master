/**
 * Best-effort YouTube transcript fetch (no API key needed). Scrapes the watch
 * page for a caption track, then fetches and flattens it to plain text. Used as
 * AI context for video summaries/chat. Returns "" when no captions exist.
 */
export async function fetchYoutubeTranscript(videoId: string): Promise<string> {
  try {
    const watch = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await watch.text();

    const match = html.match(/"captionTracks":(\[.*?\])/);
    if (!match) return "";
    const tracks = JSON.parse(match[1]) as { baseUrl: string; languageCode: string }[];
    if (!tracks.length) return "";

    // Prefer English, else first available.
    const track = tracks.find((t) => t.languageCode?.startsWith("en")) ?? tracks[0];
    const xmlRes = await fetch(track.baseUrl.replace(/\\u0026/g, "&"));
    const xml = await xmlRes.text();

    const texts = [...xml.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map((m) =>
      m[1]
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/<[^>]+>/g, " ")
    );
    return texts.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}
