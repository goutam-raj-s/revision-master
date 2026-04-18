import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  try {
    // using child_process to execute yt-dlp. yt-dlp must be installed on the environment.
    const { stdout, stderr } = await execAsync(`yt-dlp -f bestaudio --get-url "${url}"`);
    
    if (stderr && stderr.toLowerCase().includes("error")) {
      return NextResponse.json({ error: "Failed to extract audio stream" }, { status: 500 });
    }

    const streamUrl = stdout.trim();
    if (!streamUrl) {
      return NextResponse.json({ error: "No stream URL returned" }, { status: 500 });
    }

    return NextResponse.json({ streamUrl });
  } catch (error: any) {
    console.error("yt-dlp error:", error);
    return NextResponse.json({ error: "Failed to extract audio stream from YouTube URL" }, { status: 500 });
  }
}
