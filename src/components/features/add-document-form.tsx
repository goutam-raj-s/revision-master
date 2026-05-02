"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  Link2,
  Loader2,
  AlertTriangle,
  X,
  Plus,
  CheckCircle2,
  GitMerge,
  ArrowRight,
  Upload,
  FileAudio,
  FileVideo,
  FileText,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  addDocumentAction,
  fetchDocTitleAction,
  mergeDocumentsAction,
  addFileDocumentAction,
} from "@/actions/documents";
import { fetchYoutubeMetadata, createOrGetYoutubeSession } from "@/actions/youtube";
import { extractYoutubeVideoId } from "@/lib/youtube-utils";
import { isValidGoogleDocUrl } from "@/lib/utils";
import type { ActionResult, SimilarityMatch, MediaType, Difficulty } from "@/types";

const initialState: ActionResult<{ docId: string; similarMatches: SimilarityMatch[] }> = {
  success: false,
};

// ── Accepted MIME types for file upload (no video) ────────────────────────────
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
].join(",");

const ACCEPTED_EXTENSIONS =
  ".pdf,.docx,.txt,.md,.pptx,.png,.jpg,.jpeg,.gif,.webp";

const AUDIO_MIME_PREFIXES = ["audio/"];
const AUDIO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const FILE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// Video URL patterns (non-YouTube)
const VIDEO_URL_PATTERNS = [
  /\.mp4(\?|$)/i,
  /\.mov(\?|$)/i,
  /\.webm(\?|$)/i,
  /vimeo\.com/i,
];

function isVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some((p) => p.test(url));
}

function isYoutubeUrlLocal(url: string): boolean {
  return extractYoutubeVideoId(url) !== null;
}


function getMediaTypeForFile(file: File): MediaType {
  if (AUDIO_MIME_PREFIXES.some((p) => file.type.startsWith(p))) return "audio";
  if (file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("image/")) return "image";
  return "document";
}

function FileTypeIcon({ mediaType }: { mediaType: MediaType }) {
  switch (mediaType) {
    case "audio":
      return <FileAudio className="h-8 w-8 text-mossy-gray" />;
    case "video":
      return <FileVideo className="h-8 w-8 text-mossy-gray" />;
    case "image":
      return <ImageIcon className="h-8 w-8 text-mossy-gray" />;
    default:
      return <FileText className="h-8 w-8 text-mossy-gray" />;
  }
}

// ── Shared metadata fields (tags / difficulty / delay) ────────────────────────
interface MetaFieldsProps {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  difficulty: string;
  setDifficulty: React.Dispatch<React.SetStateAction<string>>;
  delay: string;
  setDelay: React.Dispatch<React.SetStateAction<string>>;
  idPrefix: string;
}

function MetaFields({
  tags,
  setTags,
  tagInput,
  setTagInput,
  difficulty,
  setDifficulty,
  delay,
  setDelay,
  idPrefix,
}: MetaFieldsProps) {
  function handleAddTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  }

  return (
    <>
      {/* Difficulty + Initial delay row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-difficulty`}>Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id={`${idPrefix}-difficulty`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-delay`}>First Review</Label>
          <Select value={delay} onValueChange={setDelay}>
            <SelectTrigger id={`${idPrefix}-delay`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 7, 14, 21, 30].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  +{d} days{d === 2 ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-tag-input`}>Tags</Label>
        <div className="flex gap-2">
          <Input
            id={`${idPrefix}-tag-input`}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add tag and press Enter"
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAddTag} aria-label="Add tag">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="tag" className="gap-1.5 cursor-default">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="hover:text-destructive transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Link Tab ──────────────────────────────────────────────────────────────────
function LinkTab({
  onSuccess,
}: {
  onSuccess: (docId: string, similarMatches?: SimilarityMatch[]) => void;
}) {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [fetchingTitle, setFetchingTitle] = React.useState(false);
  const [urlError, setUrlError] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [delay, setDelay] = React.useState("2");
  const [difficulty, setDifficulty] = React.useState("medium");
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState("");

  // Google Doc form action state (for native formAction path)
  const [state, action, pending] = useActionState(addDocumentAction, initialState);

  React.useEffect(() => {
    if (state.success && state.data) {
      onSuccess(state.data.docId, state.data.similarMatches);
    } else if (state.error) {
      setServerError(state.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleUrlBlur() {
    if (!url) return;
    if (isYoutubeUrlLocal(url)) {
      setUrlError("");
      return;
    }
    if (isVideoUrl(url)) {
      // Video URL — no title fetch needed from server
      setUrlError("");
      return;
    }
    if (!isValidGoogleDocUrl(url)) {
      setUrlError("Please enter a valid Google Docs URL, YouTube URL, or video URL (.mp4, .mov, .webm, Vimeo)");
      return;
    }
    setUrlError("");
    if (title) return;

    setFetchingTitle(true);
    const result = await fetchDocTitleAction(url);
    if (result.success && result.data) {
      setTitle(result.data.title);
    } else {
      setTitle("");
      setUrlError(result.error || "Could not fetch document title.");
    }
    setFetchingTitle(false);
  }

  async function handleYoutubeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");
    try {
      const videoId = extractYoutubeVideoId(url);
      if (!videoId) {
        setServerError("Invalid YouTube URL");
        setSubmitting(false);
        return;
      }
      const metadata = await fetchYoutubeMetadata(url);
      const result = await createOrGetYoutubeSession(videoId, { title: metadata.title, thumbnailUrl: metadata.thumbnailUrl }, {
        tags,
        difficulty: difficulty as Difficulty,
        delayDays: parseInt(delay),
      });
      setSubmitting(false);
      if (result.success && result.data) {
        // Redirect to YouTube study page
        router.push(`/study/youtube?v=${result.data.videoId}`);
      } else {
        setServerError(result.error || "Failed to create YouTube session.");
      }
    } catch {
      setServerError("Failed to create YouTube session.");
      setSubmitting(false);
    }
  }

  async function handleVideoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !title) return;
    setSubmitting(true);
    setServerError("");
    const result = await addFileDocumentAction({
      title,
      fileUrl: url,
      mediaType: "video",
      tags,
      difficulty: difficulty as Difficulty,
      delayDays: parseInt(delay),
    });
    setSubmitting(false);
    if (result.success && result.data) {
      onSuccess(result.data.docId);
    } else {
      setServerError(result.error || "Failed to add video.");
    }
  }

  const isYoutube = isYoutubeUrlLocal(url);
  const isVideo = !isYoutube && isVideoUrl(url);
  const isGoogleDoc = isValidGoogleDocUrl(url);

  // YouTube URL: custom session creation + redirect
  if (isYoutube) {
    return (
      <form onSubmit={handleYoutubeSubmit} className="space-y-5">
        {serverError && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-slide-down">
            {serverError}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="yt-url-field">YouTube URL <span className="text-destructive">*</span></Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Link2 className="h-4 w-4 text-mossy-gray" />
            </div>
            <Input
              id="yt-url-field"
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
              onBlur={handleUrlBlur}
              placeholder="https://youtu.be/..."
              className="pl-9"
              autoFocus
              required
            />
          </div>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>
        <MetaFields
          tags={tags} setTags={setTags}
          tagInput={tagInput} setTagInput={setTagInput}
          difficulty={difficulty} setDifficulty={setDifficulty}
          delay={delay} setDelay={setDelay}
          idPrefix="yt"
        />
        <Button type="submit" disabled={submitting || !url} className="w-full mt-2">
          {submitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating session…</span>
          ) : (
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Start YouTube Session</span>
          )}
        </Button>
      </form>
    );
  }

  // For video URLs use our custom submit; for google doc use the native form action
  if (isVideo) {
    return (
      <form onSubmit={handleVideoSubmit} className="space-y-5">
        {serverError && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-slide-down">
            {serverError}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="video-url">Video URL <span className="text-destructive">*</span></Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Link2 className="h-4 w-4 text-mossy-gray" />
            </div>
            <Input
              id="video-url"
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
              onBlur={handleUrlBlur}
              placeholder="https://... or Vimeo URL"
              className="pl-9"
              autoFocus
              required
            />
          </div>
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="video-title">Title <span className="text-destructive">*</span></Label>
          <Input
            id="video-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for this video"
            required
          />
        </div>
        <MetaFields
          tags={tags} setTags={setTags}
          tagInput={tagInput} setTagInput={setTagInput}
          difficulty={difficulty} setDifficulty={setDifficulty}
          delay={delay} setDelay={setDelay}
          idPrefix="video"
        />
        <Button type="submit" disabled={submitting || !url || !title} className="w-full mt-2">
          {submitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Adding…</span>
          ) : (
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Add Video to Library</span>
          )}
        </Button>
      </form>
    );
  }

  // Default: Google Doc URL form (native action)
  return (
    <form action={action} className="space-y-5">
      {(state.error || serverError) && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-slide-down">
          {state.error || serverError}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="url">
          Google Doc URL or Video URL <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Link2 className="h-4 w-4 text-mossy-gray" />
          </div>
          <Input
            id="url"
            name="url"
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
            onBlur={handleUrlBlur}
            placeholder="https://docs.google.com/... or video URL"
            className="pl-9"
            autoFocus
            required
          />
          {fetchingTitle && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-state-today" />
          )}
        </div>
        {urlError && <p className="text-xs text-destructive">{urlError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">
          Document Title
          {fetchingTitle && <span className="ml-2 text-mossy-gray font-normal">(fetching…)</span>}
        </Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Auto-extracted from the document"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id="difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="initialDelayDays">First Review</Label>
          <Select name="initialDelayDays" value={delay} onValueChange={setDelay}>
            <SelectTrigger id="initialDelayDays">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 7, 14, 21, 30].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  +{d} days{d === 2 ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tag-input">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                const t = tagInput.trim().toLowerCase();
                if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
                setTagInput("");
              }
            }}
            placeholder="Add tag and press Enter"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              const t = tagInput.trim().toLowerCase();
              if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
              setTagInput("");
            }}
            aria-label="Add tag"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <input type="hidden" name="tags" value={tags.join(",")} />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="tag" className="gap-1.5 cursor-default">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="hover:text-destructive transition-colors"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={pending || !url || !title} className="w-full mt-2">
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Adding to library…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Add to Library
          </span>
        )}
      </Button>
    </form>
  );
}

// ── File Upload Tab ───────────────────────────────────────────────────────────
type UploadPhase = "idle" | "uploading" | "metadata" | "saving";

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  resource_type: string;
}

function FileUploadTab({ onSuccess }: { onSuccess: (docId: string) => void }) {
  const [uploadPhase, setUploadPhase] = React.useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [fileError, setFileError] = React.useState("");
  const [uploadError, setUploadError] = React.useState("");
  const [dragging, setDragging] = React.useState(false);

  // After upload — metadata state
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [cloudinaryResult, setCloudinaryResult] = React.useState<CloudinaryUploadResponse | null>(null);
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("medium");
  const [delay, setDelay] = React.useState("2");
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const xhrRef = React.useRef<XMLHttpRequest | null>(null);

  function validateFile(file: File): string | null {
    const isAudio = AUDIO_MIME_PREFIXES.some((p) => file.type.startsWith(p));
    if (isAudio) {
      return "To add audio tracks, please use the Add Track feature in the Music page.";
    }
    if (file.size > FILE_MAX_BYTES) {
      return "File exceeds 50 MB limit";
    }
    // Validate type by extension fallback
    const accepted = ACCEPTED_EXTENSIONS.split(",");
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const mimeOk = ACCEPTED_MIME_TYPES.split(",").includes(file.type);
    const extOk = accepted.includes(ext);
    if (!mimeOk && !extOk) {
      return "Unsupported file type";
    }
    return null;
  }

  async function startUpload(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }
    setFileError("");
    setUploadError("");
    setUploadedFile(file);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const useMongoStorage =
      process.env.NEXT_PUBLIC_AUDIO_STORAGE_BACKEND === "mongodb" ||
      !cloudName ||
      !uploadPreset;

    const formData = new FormData();
    formData.append("file", file);

    // ── MongoDB storage path (no Cloudinary configured) ───────────────────────
    if (useMongoStorage) {
      const mediaType = getMediaTypeForFile(file);
      if (mediaType !== "audio") {
        setUploadError("Only audio files are supported without Cloudinary configured.");
        return;
      }

      setUploadPhase("uploading");
      setUploadProgress(0);

      try {
        // Simulate progress since fetch doesn't expose upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((p) => Math.min(p + 10, 90));
        }, 150);

        const res = await fetch("/api/upload/audio", { method: "POST", body: formData });
        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setUploadError((err as { error?: string }).error || "Upload failed. Try again.");
          setUploadPhase("idle");
          return;
        }

        const data: CloudinaryUploadResponse = await res.json();
        setCloudinaryResult(data);
        const nameParts = file.name.split(".");
        nameParts.pop();
        setTitle(nameParts.join(".") || file.name);
        setUploadPhase("metadata");
      } catch {
        setUploadError("Upload failed. Try again.");
        setUploadPhase("idle");
      }
      return;
    }

    // ── Cloudinary storage path ───────────────────────────────────────────────
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "revision-master");

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          setCloudinaryResult(data);
          // Pre-fill title with filename (without extension)
          const nameParts = file.name.split(".");
          nameParts.pop();
          setTitle(nameParts.join(".") || file.name);
          setUploadPhase("metadata");
        } catch {
          setUploadError("Upload failed. Try again.");
          setUploadPhase("idle");
        }
      } else {
        setUploadError("Upload failed. Try again.");
        setUploadPhase("idle");
      }
    });

    xhr.addEventListener("error", () => {
      setUploadError("Upload failed. Try again.");
      setUploadPhase("idle");
    });

    xhr.addEventListener("abort", () => {
      setUploadError("");
      setUploadPhase("idle");
    });

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
    xhr.send(formData);
    setUploadPhase("uploading");
    setUploadProgress(0);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
    // Reset input so the same file can be re-selected after cancellation
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) startUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function cancelUpload() {
    xhrRef.current?.abort();
    setUploadProgress(0);
    setUploadPhase("idle");
    setUploadedFile(null);
  }

  function resetToIdle() {
    setUploadPhase("idle");
    setUploadedFile(null);
    setCloudinaryResult(null);
    setTitle("");
    setTags([]);
    setTagInput("");
    setDifficulty("medium");
    setDelay("2");
    setSaveError("");
  }

  async function handleSaveMetadata(e: React.FormEvent) {
    e.preventDefault();
    if (!cloudinaryResult || !uploadedFile) return;
    setSaving(true);
    setSaveError("");

    const mediaType = getMediaTypeForFile(uploadedFile);

    const result = await addFileDocumentAction({
      title: title.trim(),
      cloudinaryPublicId: cloudinaryResult.public_id,
      fileUrl: cloudinaryResult.secure_url,
      fileSize: cloudinaryResult.bytes,
      mimeType: uploadedFile.type,
      mediaType,
      tags,
      difficulty: difficulty as Difficulty,
      delayDays: parseInt(delay),
    });

    setSaving(false);

    if (result.success && result.data) {
      onSuccess(result.data.docId);
    } else {
      setSaveError(result.error || "Failed to save document.");
    }
  }

  // ── Metadata phase (after upload) ────────────────────────────────────────
  if (uploadPhase === "metadata" && cloudinaryResult && uploadedFile) {
    const mediaType = getMediaTypeForFile(uploadedFile);
    return (
      <form onSubmit={handleSaveMetadata} className="space-y-5">
        {/* File preview badge */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-canvas px-4 py-3">
          <FileTypeIcon mediaType={mediaType} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-forest-slate truncate">{uploadedFile.name}</div>
            <div className="text-xs text-mossy-gray">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB · uploaded
            </div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-state-today shrink-0 ml-auto" />
        </div>

        {saveError && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="file-title">Title <span className="text-destructive">*</span></Label>
          <Input
            id="file-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title for this document"
            required
          />
        </div>

        <MetaFields
          tags={tags} setTags={setTags}
          tagInput={tagInput} setTagInput={setTagInput}
          difficulty={difficulty} setDifficulty={setDifficulty}
          delay={delay} setDelay={setDelay}
          idPrefix="file"
        />

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={resetToIdle} className="flex-1">
            Upload Different File
          </Button>
          <Button type="submit" disabled={saving || !title} className="flex-1">
            {saving ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving…</span>
            ) : (
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Add to Library</span>
            )}
          </Button>
        </div>
      </form>
    );
  }

  // ── Upload phase ─────────────────────────────────────────────────────────
  if (uploadPhase === "uploading") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-canvas p-6 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-state-today animate-spin" />
          <div className="text-sm text-forest-slate font-medium">
            Uploading {uploadedFile?.name}…
          </div>
          <div className="w-full bg-border/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-state-today rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="text-xs text-mossy-gray">{uploadProgress}%</div>
          <Button variant="outline" size="sm" onClick={cancelUpload}>
            Cancel
          </Button>
        </div>
        {uploadError && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {uploadError}
            <Button variant="ghost" size="sm" className="ml-3" onClick={resetToIdle}>
              Retry
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Idle phase: drop zone ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {(fileError || uploadError) && (
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-slide-down">
          {fileError || uploadError}
        </div>
      )}

      <div
        className={`rounded-2xl border-2 border-dashed transition-colors cursor-pointer p-10 flex flex-col items-center gap-4 ${
          dragging
            ? "border-state-today bg-state-today/5"
            : "border-border bg-canvas hover:border-state-today/40 hover:bg-state-today/5"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        aria-label="Upload file"
      >
        <Upload className="h-10 w-10 text-mossy-gray" />
        <div className="text-center">
          <p className="text-sm font-medium text-forest-slate">
            Drag &amp; drop a file, or click to browse
          </p>
          <p className="text-xs text-mossy-gray mt-1">
            PDF, DOCX, TXT, MD, PPTX, MP3, M4A, WAV, OGG, PNG, JPG, GIF, WEBP
          </p>
          <p className="text-xs text-mossy-gray mt-0.5">
            Audio: max 5 MB · All others: max 50 MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="sr-only"
        onChange={handleFileSelected}
        aria-label="File input"
      />
    </div>
  );
}

// ── Main AddDocumentForm ──────────────────────────────────────────────────────
export function AddDocumentForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"link" | "file">("link");
  const [similarMatches, setSimilarMatches] = React.useState<SimilarityMatch[]>([]);
  const [showSimilarity, setShowSimilarity] = React.useState(false);
  const [newDocId, setNewDocId] = React.useState<string | null>(null);

  function handleSuccess(docId: string, matches?: SimilarityMatch[]) {
    setNewDocId(docId);
    if (matches && matches.length > 0) {
      setSimilarMatches(matches);
      setShowSimilarity(true);
    } else {
      toast("Document added!", { variant: "success", description: "Scheduled for review" });
      router.push("/dashboard");
    }
  }

  async function handleMerge(parentDocId: string) {
    if (!newDocId) return;
    await mergeDocumentsAction(newDocId, parentDocId);
    toast("Documents merged!", { variant: "success" });
    setShowSimilarity(false);
    router.push("/documents");
  }

  function handleIgnoreSimilarity() {
    setShowSimilarity(false);
    toast("Document added as new entry", { variant: "success" });
    router.push("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Similarity Warning Banner */}
      {showSimilarity && (
        <div className="mb-6 rounded-2xl border border-state-upcoming/30 bg-state-upcoming/5 p-5 animate-slide-down">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-state-upcoming mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-forest-slate mb-1">
                Insight match detected
              </h3>
              <p className="text-sm text-mossy-gray mb-3">
                This document appears to overlap with existing knowledge in your library.
              </p>
              <div className="space-y-2">
                {similarMatches.map((match) => (
                  <div
                    key={match.doc.id}
                    className="flex items-center justify-between gap-3 bg-surface rounded-xl border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-forest-slate truncate">{match.doc.title}</div>
                      <div className="text-xs text-mossy-gray mt-0.5">{match.reason}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMerge(match.doc.id)}
                        className="text-xs gap-1.5"
                      >
                        <GitMerge className="h-3.5 w-3.5" />
                        Merge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <Button variant="ghost" size="sm" onClick={handleIgnoreSimilarity}>
                  Ignore — keep as new document
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border bg-canvas p-1 mb-6 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("link")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "link"
              ? "bg-surface shadow-card text-forest-slate"
              : "text-mossy-gray hover:text-forest-slate"
          }`}
          aria-pressed={activeTab === "link"}
        >
          <Link2 className="h-4 w-4" />
          Link
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("file")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "file"
              ? "bg-surface shadow-card text-forest-slate"
              : "text-mossy-gray hover:text-forest-slate"
          }`}
          aria-pressed={activeTab === "file"}
        >
          <Upload className="h-4 w-4" />
          File Upload
        </button>
      </div>

      {activeTab === "link" ? (
        <LinkTab onSuccess={handleSuccess} />
      ) : (
        <FileUploadTab onSuccess={(docId) => handleSuccess(docId)} />
      )}
    </div>
  );
}
