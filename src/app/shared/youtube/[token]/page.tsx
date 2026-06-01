import Link from "next/link";
import { Lock, PlayCircle, ListVideo } from "lucide-react";
import { getYoutubeSharedResource } from "@/actions/youtube-shares";
import { YoutubeStudyClient } from "@/components/features/youtube-study-client";
import { Button } from "@/components/ui/button";

interface SharedYoutubePageProps {
  params: Promise<{ token: string }>;
}

function ExpiredView({ token }: { token: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-mossy-gray" />
        </div>
        <h1 className="text-xl font-semibold text-forest-slate mb-2">Link expired or not found</h1>
        <p className="text-sm text-mossy-gray mb-6">This share link is no longer active.</p>
        <Link href={`/register?from=/shared/youtube/${token}`}>
          <Button variant="default" size="sm">Create a free account</Button>
        </Link>
      </div>
    </div>
  );
}

export default async function SharedYoutubePage({ params }: SharedYoutubePageProps) {
  const { token } = await params;
  const result = await getYoutubeSharedResource(token);

  if (!result.success || !result.data) {
    return <ExpiredView token={token} />;
  }

  const { share, session, playlist } = result.data;
  const isWrite = share.accessLevel === "write";

  // ── Session (single video) ──────────────────────────────────────────────────
  if (share.resourceType === "session" && session) {
    return (
      <div className="h-screen flex flex-col bg-canvas overflow-hidden">
        <div className="shrink-0 flex h-12 items-center justify-between gap-2 border-b border-border bg-canvas/80 px-4 backdrop-blur-md">
          <span className="text-sm font-semibold text-forest-slate truncate">{session.videoTitle}</span>
          <div className="flex items-center gap-2 shrink-0">
            {isWrite && (
              <span className="inline-flex items-center gap-1 rounded-full bg-state-today/10 px-2 py-0.5 text-[11px] font-medium text-state-today">
                Can edit notes
              </span>
            )}
            <Link href="/register" className="text-xs text-mossy-gray hover:text-forest-slate transition-colors">
              Powered by lostbae ↗
            </Link>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {/* Read-only notes when not write access — pass a localStorage key so notes are local */}
          <YoutubeStudyClient
            session={{
              ...session,
              // For read-only shares, localStorageKey will be set by client; for write, use real sessionId
              id: isWrite ? session.id : `shared-preview-${session.id}`,
            }}
          />
        </div>
      </div>
    );
  }

  // ── Playlist ─────────────────────────────────────────────────────────────────
  if (share.resourceType === "playlist" && playlist) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="sticky top-0 z-10 flex h-12 items-center justify-between gap-2 border-b border-border bg-canvas/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <ListVideo className="h-4 w-4 text-state-today shrink-0" />
            <span className="text-sm font-semibold text-forest-slate truncate">{playlist.name}</span>
          </div>
          <Link href="/register" className="text-xs text-mossy-gray hover:text-forest-slate transition-colors shrink-0">
            Powered by lostbae ↗
          </Link>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <p className="text-sm text-mossy-gray">{playlist.items.length} video{playlist.items.length !== 1 ? "s" : ""}</p>
          {playlist.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white/70 px-4 py-14 text-center">
              <ListVideo className="mx-auto mb-2 h-8 w-8 text-mossy-gray/40" />
              <p className="text-sm text-mossy-gray">No videos in this playlist yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {playlist.items.map((item) => {
                const href = item.sourceType === "external"
                  ? `/study/youtube?u=${encodeURIComponent(item.videoUrl)}`
                  : `/study/youtube?v=${item.videoId}`;
                return (
                  <Link key={item.sessionId} href={href} className="group block space-y-3">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border border-border shadow-sm group-hover:shadow-md transition-all">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <PlayCircle className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <PlayCircle className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-forest-slate line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <ExpiredView token={token} />;
}
