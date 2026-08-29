"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export type BrowserAudioTrack = {
  id: string;
  streamIndex: number;
  label: string;
  default: boolean;
};

const INPUT_NAME = "input-video";
let ffmpegPromise: Promise<FFmpeg> | null = null;
let currentInputName = "";

type FfprobeStream = {
  index: number;
  codec_type?: string;
  codec_name?: string;
  channels?: number;
  tags?: Record<string, string | undefined>;
  disposition?: Record<string, number | undefined>;
};

function outputName(streamIndex: number) {
  return `audio-${streamIndex}-${Date.now()}.mp4`;
}

async function loadFfmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: "/ffmpeg/ffmpeg-core.js",
        wasmURL: "/ffmpeg/ffmpeg-core.wasm",
      });
      return ffmpeg;
    })();
  }

  return ffmpegPromise;
}

function safeInputName(file: File) {
  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "bin";
  return `${INPUT_NAME}.${ext}`;
}

async function writeInputFile(ffmpeg: FFmpeg, file: File) {
  const inputName = safeInputName(file);
  if (currentInputName) {
    await ffmpeg.deleteFile(currentInputName).catch(() => undefined);
  }
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  currentInputName = inputName;
  return inputName;
}

function parseAudioTracks(json: string): BrowserAudioTrack[] {
  const parsed = JSON.parse(json) as { streams?: FfprobeStream[] };
  const streams = parsed.streams?.filter((stream) => stream.codec_type === "audio") ?? [];

  return streams.map((stream, ordinal) => {
    const title = stream.tags?.title;
    const language = stream.tags?.language;
    const codec = stream.codec_name?.toUpperCase();
    const defaultTrack = stream.disposition?.default === 1;
    const label = [
      title || `Audio ${ordinal + 1}`,
      language?.toUpperCase(),
      codec,
      stream.channels ? `${stream.channels}ch` : undefined,
      defaultTrack ? "Default" : undefined,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      id: `web-audio-${stream.index}`,
      streamIndex: stream.index,
      label,
      default: defaultTrack,
    };
  });
}

export async function probeBrowserAudioTracks(file: File) {
  const ffmpeg = await loadFfmpeg();
  const inputName = await writeInputFile(ffmpeg, file);
  const output = "streams.json";
  await ffmpeg.deleteFile(output).catch(() => undefined);

  const code = await ffmpeg.ffprobe(
    [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_streams",
      inputName,
      "-o",
      output,
    ],
    120_000
  );
  if (code !== 0) throw new Error("Could not inspect audio tracks for this video.");

  const data = await ffmpeg.readFile(output, "utf8");
  return {
    inputName,
    audioTracks: parseAudioTracks(String(data)),
  };
}

export async function prepareBrowserAudioTrack(inputName: string, streamIndex: number) {
  const ffmpeg = await loadFfmpeg();
  const output = outputName(streamIndex);
  const baseArgs = [
    "-i",
    inputName,
    "-map",
    "0:v:0?",
    "-map",
    `0:${streamIndex}`,
    "-sn",
    "-c:v",
    "copy",
    "-movflags",
    "faststart",
  ];

  let code = await ffmpeg.exec([...baseArgs, "-c:a", "copy", output], 10 * 60_000);
  if (code !== 0) {
    code = await ffmpeg.exec(
      [...baseArgs, "-c:a", "aac", "-b:a", "192k", output],
      10 * 60_000
    );
  }
  if (code !== 0) {
    code = await ffmpeg.exec(
      [
        "-i",
        inputName,
        "-map",
        "0:v:0?",
        "-map",
        `0:${streamIndex}`,
        "-sn",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "faststart",
        output,
      ],
      20 * 60_000
    );
  }
  if (code !== 0) throw new Error("Could not prepare that audio track.");

  const data = await ffmpeg.readFile(output);
  await ffmpeg.deleteFile(output).catch(() => undefined);
  if (typeof data === "string") {
    return URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
  }

  const bytes = new Uint8Array(data);
  return URL.createObjectURL(new Blob([bytes.buffer], { type: "video/mp4" }));
}
