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
import { RichTextEditorDynamic as RichTextEditor } from "@/components/features/editor/RichTextEditorDynamic";

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
              <div className="absolute inset-0 overflow-hidden flex flex-col">
                <RichTextEditor 
                  docId={doc.id} 
                  initialContent={doc.content || ""} 
                  readOnly={false} // Allow editing during study
                />
              </div>
            ) : doc.mediaType === "document" && !doc.fileUrl ? (
              <div className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center bg-canvas p-8 text-center">
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 shadow-sm border border-border">
                  <ExternalLink className="h-8 w-8 text-mossy-gray" />
                </div>
                <h3 className="text-xl font-medium text-forest-slate mb-2">Web Clip</h3>
                <p className="text-sm text-mossy-gray max-w-md mb-6">
                  This is a web clip. The original website cannot be embedded securely. You can study your notes and terminology in the sidebar, or open the actual webpage.
                </p>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-forest-slate text-white rounded-lg text-sm font-medium hover:bg-forest-slate/90 transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Original Website
                </a>
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
