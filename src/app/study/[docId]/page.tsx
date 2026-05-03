import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getDocById, serializeDoc, getRepetitionByDocId, serializeRepetition } from "@/lib/db/collections";
import { getGoogleDocEmbedUrl } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { StudyPageWrapper } from "@/components/features/study-page-wrapper";
import { StudySplitPane } from "@/components/features/study-split-pane";
import { StudyDocSwitcher } from "@/components/features/study-doc-switcher";
import { MobileSidebarButton } from "@/components/features/study-mobile-sidebar";
import { AudioPlayer, VideoPlayer, DocumentDownload } from "@/components/features/media-player";
import { getDocNotes, getDocTerms } from "@/actions/notes";
import { DashboardHeader } from "@/components/features/dashboard-header";

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
        {/* Dashboard Header with breadcrumbs */}
        <DashboardHeader
          showLogo={true}
          customBreadcrumbs={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/documents", label: "Documents" },
            { href: `/documents/${doc.id}`, label: doc.title },
          ]}
          rightActions={
            <div className="flex items-center gap-3">
              <StudyDocSwitcher currentDocId={doc.id} />
              {!doc.url.startsWith("native://") && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open original in Google Docs"
                  className="flex items-center gap-1.5 text-xs text-mossy-gray hover:text-forest-slate transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Open in Google Docs</span>
                </a>
              )}
            </div>
          }
        />

        {/* Split-pane body — resizable */}
        <StudySplitPane
          doc={doc}
          rep={rep}
          initialNotes={initialNotes}
          initialTerms={initialTerms}
          leftContent={
            doc.mediaType === "audio" && doc.fileUrl ? (
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
            ) : doc.mediaType === "native-doc" ? (
              <div className="absolute inset-0 overflow-auto p-4 md:p-8 bg-canvas tiptap-content">
                <div 
                  className="max-w-3xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: doc.content || "" }}
                />
              </div>
            ) : (
              <iframe
                src={embedUrl}
                title={doc.title}
                className="w-full h-full border-0 absolute inset-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                loading="eager"
              />
            )
          }
        />

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
