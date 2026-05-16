"use client";

import * as React from "react";
import { Link2, Loader2, Music, Upload, CheckCircle2, FileAudio, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { addFileDocumentAction } from "@/actions/documents";
import { fetchYoutubeMetadata } from "@/actions/youtube";
import { extractYoutubeVideoId } from "@/lib/youtube-utils";
import { YoutubeSearch } from "./youtube-search";

type AddAudioFormProps = {
  onSuccess: () => void;
};

export function AddAudioForm({ onSuccess }: AddAudioFormProps) {
  const [mode, setMode] = React.useState<"youtube" | "search" | "upload">("youtube");
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleYoutubeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const videoId = extractYoutubeVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }
      
      const metadata = await fetchYoutubeMetadata(url);
      
      const result = await addFileDocumentAction({
        title: metadata.title || "YouTube Audio",
        fileUrl: `https://www.youtube.com/watch?v=${videoId}`,
        mediaType: "audio",
        tags: ["youtube"],
        difficulty: "medium",
        delayDays: 2,
      });

      if (result.success) {
        toast("YouTube track added", { variant: "success" });
        onSuccess();
      } else {
        throw new Error(result.error || "Failed to add track");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process YouTube URL");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedFile || !title) return;
    setSubmitting(true);
    setError("");

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      
      if (!cloudName || !uploadPreset) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        const res = await fetch("/api/upload/audio", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        
        const result = await addFileDocumentAction({
          title: title.trim(),
          fileUrl: data.secure_url,
          mediaType: "audio",
          tags: [],
          difficulty: "medium",
          delayDays: 2,
          cloudinaryPublicId: data.public_id,
          fileSize: data.bytes,
          mimeType: uploadedFile.type,
        });

        if (result.success) {
          toast("Audio track uploaded", { variant: "success" });
          onSuccess();
        } else {
          throw new Error(result.error || "Failed to save track");
        }
      } else {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "revision-master");

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
        const data = await uploadRes.json();

        const result = await addFileDocumentAction({
          title: title.trim(),
          fileUrl: data.secure_url,
          mediaType: "audio",
          tags: [],
          difficulty: "medium",
          delayDays: 2,
          cloudinaryPublicId: data.public_id,
          fileSize: data.bytes,
          mimeType: uploadedFile.type,
        });

        if (result.success) {
          toast("Audio track uploaded", { variant: "success" });
          onSuccess();
        } else {
          throw new Error(result.error || "Failed to save track");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Audio files must be under 5 MB");
        return;
      }
      setUploadedFile(file);
      const nameParts = file.name.split(".");
      nameParts.pop();
      setTitle(nameParts.join(".") || file.name);
      setError("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border mb-4">
        <button
          onClick={() => setMode("youtube")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mode === "youtube" ? "border-state-today text-state-today" : "border-transparent text-mossy-gray"
          }`}
        >
          YouTube Link
        </button>
        <button
          onClick={() => setMode("search")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mode === "search" ? "border-state-today text-state-today" : "border-transparent text-mossy-gray"
          }`}
        >
          Search YouTube
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mode === "upload" ? "border-state-today text-state-today" : "border-transparent text-mossy-gray"
          }`}
        >
          Upload File
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {mode === "youtube" && (
        <form onSubmit={handleYoutubeSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="yt-url">YouTube URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mossy-gray" />
              <Input
                id="yt-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-mossy-gray mt-2 pt-1 block">
              Audio will be streamed directly from YouTube. Nothing is downloaded or saved.
            </p>
          </div>
          <Button type="submit" disabled={submitting || !url} className="w-full">
            {submitting ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Processing...</span>
            ) : (
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Add Track</span>
            )}
          </Button>
        </form>
      )}

      {mode === "search" && (
        <YoutubeSearch onSuccess={onSuccess} />
      )}

      {mode === "upload" && (
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {!uploadedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-surface cursor-pointer transition-colors"
            >
              <FileAudio className="h-10 w-10 text-mossy-gray/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-forest-slate">Click to browse</p>
              <p className="text-xs text-mossy-gray mt-1">MP3, WAV, OGG (Max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 bg-state-today/10 rounded flex flex-shrink-0 items-center justify-center text-state-today">
                    <Music className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-forest-slate truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-mossy-gray">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                  disabled={submitting}
                >
                  Change
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="track-title">Title</Label>
                <Input
                  id="track-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting || !title} className="w-full">
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Uploading...</span>
                ) : (
                  <span className="flex items-center gap-2"><Upload className="h-4 w-4" />Upload Track</span>
                )}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
