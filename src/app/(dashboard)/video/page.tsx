import { VideoPlayerClient } from "@/components/features/video-player-client";
import { QuickGuideButton } from "@/components/ui/quick-guide-button";

const VIDEO_SHORTCUTS = [
  { keys: "Space / K", label: "Play / pause" },
  { keys: "→", label: "Skip forward 10 s" },
  { keys: "←", label: "Skip back 10 s" },
  { keys: "↑", label: "Volume up 10%" },
  { keys: "↓", label: "Volume down 10%" },
  { keys: "M", label: "Mute / unmute" },
  { keys: "F", label: "Toggle fullscreen" },
];

export default function VideoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Video Player</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Play local video files — nothing is uploaded or saved.
          </p>
        </div>
        <QuickGuideButton shortcuts={VIDEO_SHORTCUTS} title="Video Player" />
      </div>
      <VideoPlayerClient />
    </div>
  );
}
