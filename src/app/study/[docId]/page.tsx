import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getDocById, serializeDoc, getRepetitionByDocId, serializeRepetition } from "@/lib/db/collections";
import { getGoogleDocEmbedUrl } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { StudyPageWrapper } from "@/components/features/study-page-wrapper";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { StudySidebarPanel } from "@/components/features/study-sidebar-panel";
import { MobileSidebarButton } from "@/components/features/study-mobile-sidebar";
import { AudioPlayer, VideoPlayer, DocumentDownload } from "@/components/features/media-player";
import { getDocNotes, getDocTerms } from "@/actions/notes";

interface StudyPageProps {
  params: Promise<{ docId: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { docId } = await params;
  const user = await requireAuth();

  const dbDoc = await getDocById(docId, user.id);
  if (!dbDoc) notFound();

  const doc = serializeDoc(dbDoc);
  const embedUrl = getGoogleDocEmbedUrl(doc.url);

  // Fetch all sidebar data in parallel
  const [dbRep, initialNotes, initialTerms] = await Promise.all([
    getRepetitionByDocId(docId),
    getDocNotes(docId),
    getDocTerms(docId),
  ]);

  const rep = dbRep ? serializeRepetition(dbRep) : null;

  return (
    <StudyPageWrapper>
      <div className="h-screen flex flex-col bg-canvas overflow-hidden">
        {/* Minimal header */}
        <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-white shadow-soft z-20">
          <div className="flex items-center gap-3">
            <SimpleTooltip content="Back to document" side="bottom">
              <Link
                href={`/documents/${doc.id}`}
                className="flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </SimpleTooltip>
            <span className="text-border/60">|</span>
            <SimpleTooltip content={doc.title} side="bottom">
              <h1 className="font-serif font-medium text-forest-slate text-sm line-clamp-1 max-w-xl cursor-default">
                {doc.title}
              </h1>
            </SimpleTooltip>
          </div>
          <SimpleTooltip content="Open original in Google Docs" side="left">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-mossy-gray hover:text-forest-slate transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in Google Docs</span>
            </a>
          </SimpleTooltip>
        </header>

        {/* Split-pane body */}
        <div className="flex-1 flex min-h-0">
          {/* Left pane — content varies by mediaType */}
          <div className="flex-1 relative min-w-0">
            {doc.mediaType === "audio" && doc.fileUrl ? (
              <div className="absolute inset-0 overflow-auto">
                <AudioPlayer src={doc.fileUrl} title={doc.title} />
              </div>
            ) : doc.mediaType === "video" ? (
              <div className="absolute inset-0 overflow-auto">
                <VideoPlayer src={doc.url} title={doc.title} />
              </div>
            ) : doc.mediaType === "pdf" && doc.fileUrl ? (
              <iframe
                src={doc.fileUrl}
                title={doc.title}
                className="w-full h-full border-0 absolute inset-0"
                loading="eager"
              />
            ) : doc.mediaType === "image" && doc.fileUrl ? (
              <div className="absolute inset-0 overflow-auto flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.fileUrl}
                  alt={doc.title}
                  className="max-w-full h-auto rounded-xl shadow-card"
                />
              </div>
            ) : doc.mediaType === "document" && doc.fileUrl ? (
              <div className="absolute inset-0 overflow-auto">
                <DocumentDownload src={doc.fileUrl} title={doc.title} />
              </div>
            ) : (
              <iframe
                src={embedUrl}
                title={doc.title}
                className="w-full h-full border-0 absolute inset-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                loading="eager"
              />
            )}
          </div>

          {/* Right pane — Metadata sidebar (visible on lg+) */}
          <div className="hidden lg:flex lg:w-[30%] lg:min-w-[260px] lg:max-w-[400px] shrink-0">
            <StudySidebarPanel
              doc={doc}
              rep={rep}
              initialNotes={initialNotes}
              initialTerms={initialTerms}
            />
          </div>
        </div>

        {/* Mobile FAB — opens sidebar as overlay (hidden on lg+) */}
        <MobileSidebarButton
          doc={doc}
          rep={rep}
          initialNotes={initialNotes}
          initialTerms={initialTerms}
        />
      </div>
    </StudyPageWrapper>
  );
}
