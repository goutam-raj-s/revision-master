import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, BookOpen, FileText } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getDocById, getDocumentTree, getRepetitionByDocId, getRootDocForDoc } from "@/lib/db/collections";
import { getDocNotes, getDocTerms } from "@/actions/notes";
import { serializeDoc, serializeRepetition } from "@/lib/db/collections";
import { DocumentTabsSidebar } from "@/components/features/document-tabs-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentDetailClient } from "@/components/features/document-detail-client";
import { DocumentThumbnailButton } from "@/components/features/document-thumbnail-button";
import { InlineTitleEditor } from "@/components/features/inline-title-editor";
import { ShareButton } from "@/components/features/share-button";
import { RichTextEditorDynamic as RichTextEditor } from "@/components/features/editor/RichTextEditorDynamic";
import { PDFAnnotatorDynamic as PDFAnnotator } from "@/components/features/editor/PDFAnnotatorDynamic";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import type { DocumentTreeNode } from "@/types";

interface DocumentDetailPageProps {
  params: Promise<{ docId: string }>;
}

const STATUS_CONFIG = {
  first_visit: { label: "First Visit", variant: "upcoming" as const },
  revision:    { label: "Revision",    variant: "today" as const },
  updated:     { label: "Updated",     variant: "stale" as const },
  completed:   { label: "Completed",   variant: "completed" as const },
};

function flattenPages(pages: DocumentTreeNode[]): DocumentTreeNode[] {
  return pages.flatMap((page) => [page, ...flattenPages(page.children)]);
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { docId } = await params;
  const user = await requireAuth();

  const dbDoc = await getDocById(docId, user.id);
  if (!dbDoc) notFound();

  const dbRootDoc = await getRootDocForDoc(docId, user.id);
  if (!dbRootDoc) notFound();
  const parentId = dbRootDoc._id.toString();
  const dbRep = await getRepetitionByDocId(parentId);

  const doc = serializeDoc(dbDoc);
  const rep = dbRep ? serializeRepetition(dbRep) : null;

  const subPages = await getDocumentTree(parentId, user.id);
  const flatSubPages = flattenPages(subPages);

  const [notes, terms] = await Promise.all([
    getDocNotes(docId),
    getDocTerms(docId),
  ]);

  const status = STATUS_CONFIG[doc.status];
  const recentTags = doc.tags.slice(-3);
  const hiddenTagCount = Math.max(0, doc.tags.length - recentTags.length);

  return (
    <div className="flex -mt-6 md:-mt-8 -mx-4 md:-mx-8 h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar - only show if there are subpages or it's a native doc */}
      {(flatSubPages.length > 1 || doc.mediaType === "native-doc") && (
        <DocumentTabsSidebar 
          subPages={subPages} 
          currentDocId={doc.id} 
          parentId={parentId} 
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {(flatSubPages.length > 1 || doc.mediaType === "native-doc") && (
          <div className="-mx-1 lg:hidden">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-mossy-gray">Pages</p>
              <span className="text-[11px] text-mossy-gray">{flatSubPages.length} page{flatSubPages.length === 1 ? "" : "s"}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {flatSubPages.map((page) => {
                const isActive = page.id === doc.id;
                return (
                  <Link
                    key={page.id}
                    href={`/documents/${page.id}`}
                    title={page.title}
                    className={`inline-flex max-w-[220px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-state-today/30 bg-state-today/10 text-state-today"
                        : "border-border bg-surface text-mossy-gray hover:text-forest-slate"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{page.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex flex-1 min-w-0 gap-3">
            {doc.thumbnailUrl && (
              <img
                src={doc.thumbnailUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <InlineTitleEditor docId={doc.id} title={doc.title} />
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={doc.difficulty === "easy" ? "easy" : doc.difficulty === "medium" ? "medium" : "hard"}>
                {doc.difficulty}
              </Badge>
              {recentTags.map((tag) => (
                <Link key={tag} href={`/documents?tag=${tag}`}>
                  <Badge variant="tag" className="cursor-pointer">#{tag}</Badge>
                </Link>
              ))}
              {hiddenTagCount > 0 && (
                <Badge
                  variant="outline"
                  className="cursor-default"
                  title={doc.tags.slice(0, -3).map((tag) => `#${tag}`).join(", ")}
                >
                  +{hiddenTagCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-mossy-gray">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Added {formatDate(doc.createdAt)}
              </span>
              {rep && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Next review: {formatRelativeDate(rep.nextReviewDate)}
                </span>
              )}
              {rep && rep.reviewCount > 0 && (
                <span>{rep.reviewCount} review{rep.reviewCount !== 1 ? "s" : ""} completed</span>
              )}
            </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start">
            <ShareButton title={doc.title} url={`/documents/${doc.id}`} size="sm" />
            <DocumentThumbnailButton docId={doc.id} currentThumbnailUrl={doc.thumbnailUrl} />
            <Link href={`/study/${doc.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 bouncy-hover">
                <BookOpen className="h-3.5 w-3.5" />
                Study Document
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        {/* Interactive content: editor (for native docs), annotator (for PDFs) or notes, terms, etc. */}
        {doc.mediaType === "native-doc" ? (
          <div className="space-y-6">
            <RichTextEditor docId={doc.id} initialContent={doc.content || ""} />
            <DocumentDetailClient doc={doc} rep={rep} initialNotes={notes} initialTerms={terms} />
          </div>
        ) : doc.mediaType === "pdf" && doc.fileUrl ? (
          <div className="space-y-6">
            <PDFAnnotator url={doc.fileUrl} docId={doc.id} initialHighlights={doc.content} />
            <DocumentDetailClient doc={doc} rep={rep} initialNotes={notes} initialTerms={terms} />
          </div>
        ) : (
          <DocumentDetailClient doc={doc} rep={rep} initialNotes={notes} initialTerms={terms} />
        )}
      </div>
    </div>
  );
}
