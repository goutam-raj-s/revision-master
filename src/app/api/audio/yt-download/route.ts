import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { requireAuth } from "@/lib/auth/session";

// @ts-ignore
import youtubedlPkg from "youtube-dl-exec";
// ffmpeg-static also resolves via __dirname which Next.js replaces with /ROOT.
// Resolve the real path using process.cwd() at runtime instead.
const ffmpegStatic = path.resolve(process.cwd(), "node_modules/ffmpeg-static/ffmpeg");

export const maxDuration = 300;

// Next.js bundles server code and replaces __dirname with /ROOT, breaking the
// binary path resolution inside youtube-dl-exec. Fix: resolve the real binary
// path using process.cwd() (which IS correct at runtime) and use create().
const YTDLP_BIN = path.resolve(process.cwd(), "node_modules/youtube-dl-exec/bin/yt-dlp");
// @ts-ignore
const youtubedl = youtubedlPkg.create ? youtubedlPkg.create(YTDLP_BIN) : youtubedlPkg;

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let { url } = await request.json();
    if (!url) return NextResponse.json({ error: "Missing YouTube URL" }, { status: 400 });

    let cleanUrl = url;
    try {
      const u = new URL(url);
      const v = u.searchParams.get("v");
      if (v) {
        cleanUrl = `https://www.youtube.com/watch?v=${v}`;
      } else if (u.hostname === "youtu.be") {
        const id = u.pathname.slice(1).split("?")[0];
        if (id) cleanUrl = `https://www.youtube.com/watch?v=${id}`;
      }
    } catch {
      return NextResponse.json({ error: "Invalid YouTube URL format" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. Get info
          const info = await youtubedl(cleanUrl, {
            dumpJson: true,
            noWarnings: true,
            jsRuntimes: "node",
            addHeader: ["User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"]
          }) as any;
          const title = info.title || "YouTube Audio";

          controller.enqueue(encoder.encode(JSON.stringify({ type: "progress", value: 1, text: "Starting download..." }) + "\n"));

          // 2. Download into temporary path
          const tmpId = Date.now().toString() + "_" + Math.random().toString(36).substring(7);
          const tmpFile = path.join("/tmp", `${tmpId}.mp3`);

          const dl = youtubedl.exec(cleanUrl, {
            extractAudio: true,
            audioFormat: "mp3",
            ffmpegLocation: ffmpegStatic as string,
            output: tmpFile,
            noWarnings: true,
            jsRuntimes: "node",
            addHeader: ["User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"]
          } as any);

          const subprocess = dl as any;

          // 3. Track progress
          if (subprocess.stdout) {
            subprocess.stdout.on("data", (data: any) => {
              const str = data.toString();
              const match = str.match(/\[download\]\s+([0-9.]+)%/);
              if (match) {
                const percent = parseFloat(match[1]);
                controller.enqueue(encoder.encode(JSON.stringify({ type: "progress", value: percent, text: `Downloading (${percent}%)` }) + "\n"));
              }
            });
          }

          await dl;

          controller.enqueue(encoder.encode(JSON.stringify({ type: "progress", value: 100, text: "Storing audio..." }) + "\n"));

          // 4. Read and return the audio file
          if (!fs.existsSync(tmpFile)) {
            throw new Error("Output conversion failed silently.");
          }
          const buffer = fs.readFileSync(tmpFile);
          fs.unlinkSync(tmpFile);

          const base64 = buffer.toString("base64");
          const mimeType = "audio/mpeg";
          const dataUrl = `data:${mimeType};base64,${base64}`;

          const finalPayload = {
            title,
            secure_url: dataUrl,
            public_id: "youtube:" + info.id,
            bytes: buffer.length,
            format: mimeType,
          };

          controller.enqueue(encoder.encode(JSON.stringify({ type: "complete", result: finalPayload }) + "\n"));
          controller.close();
        } catch (e: any) {
          console.error("[yt-download] error:", e?.code, e?.message, e?.path);
          controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: e.message || "Failed to download and process YouTube audio" }) + "\n"));
          controller.close();
        }
      }
    });

    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Request failed" }, { status: 500 });
  }
}
