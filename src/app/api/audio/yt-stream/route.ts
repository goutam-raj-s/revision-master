import { NextResponse } from "next/server";
import play from "play-dl";
import { create } from "youtube-dl-exec";
import path from "path";

// Explicitly construct the path to yt-dlp binary to avoid Turbopack/Next.js bundling issues
const ytDlpPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", "yt-dlp");
const youtubedl = create(ytDlpPath);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  try {
    // play-dl is generally more reliable and faster for streaming metadata/urls
    const stream = await play.stream(url);
    
    if (!stream || !stream.url) {
      throw new Error("No stream URL returned from play-dl");
    }

    return NextResponse.json({ streamUrl: stream.url });
  } catch (error: any) {
    console.warn("play-dl error, falling back to youtube-dl-exec:", error.message || error);
    
    try {
      // Fallback to youtube-dl-exec which is slower but often more robust against YT changes
      const output = await youtubedl(url, {
        getUrl: true,
        format: "bestaudio",
        noWarnings: true,
        callHome: false,
        noCheckCertificate: true,
      });
      
      // youtubedl output might be a single string URL or multiple separated by newlines
      const streamUrl = typeof output === 'string' ? output.split('\n')[0].trim() : String(output).trim();
      
      if (!streamUrl) {
        return NextResponse.json({ error: "No stream URL returned from fallback" }, { status: 500 });
      }
      
      return NextResponse.json({ streamUrl });
    } catch (fallbackError: any) {
      console.error("youtube-dl-exec fallback error:", fallbackError.message || fallbackError);
      return NextResponse.json({ error: "Failed to extract audio stream from YouTube URL" }, { status: 500 });
    }
  }
}
