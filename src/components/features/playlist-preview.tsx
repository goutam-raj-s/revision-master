import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaylistPreviewProps {
  playlist: {
    playlistId: string;
    title: string;
    videos: {
      videoId: string;
      title: string;
      thumbnailUrl: string;
    }[];
  };
}

export function PlaylistPreview({ playlist }: PlaylistPreviewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-canvas">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-forest-slate">
              {playlist.title}
            </h2>
            <p className="text-sm text-mossy-gray mt-1">
              {playlist.videos.length} videos available
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/study/youtube" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Different Link
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlist.videos.map((video) => (
            <Link
              key={video.videoId}
              href={`/study/youtube?list=${playlist.playlistId}&v=${video.videoId}`}
              className="group block space-y-3"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-md transition-all">
                {video.thumbnailUrl ? (
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <PlayCircle className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <PlayCircle className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-forest-slate line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {video.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
