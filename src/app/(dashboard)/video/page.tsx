import { VideoPlayerClient } from "@/components/features/video-player-client";

export default function VideoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Video Player</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Play local video files — nothing is uploaded or saved.
        </p>
      </div>
      <VideoPlayerClient />
    </div>
  );
}
