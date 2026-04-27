import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Calendar, BookOpen } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getDocById, getRepetitionByDocId } from "@/lib/db/collections";
import { getDocNotes, getDocTerms } from "@/actions/notes";
import { serializeDoc, serializeRepetition } from "@/lib/db/collections";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentDetailClient } from "@/components/features/document-detail-client";
import { RichTextEditor } from "@/components/features/editor/RichTextEditor";
import { PDFAnnotator } from "@/components/features/editor/PDFAnnotator";
import { formatDate, formatRelativeDate } from "@/lib/utils";

interface DocumentDetailPageProps {
  params: Promise<{ docId: string }>;
}

const STATUS_CONFIG = {
  first_visit: { label: "First Visit", variant: "upcoming" as const },
  revision:    { label: "Revision",    variant: "today" as const },
  updated:     { label: "Updated",     variant: "stale" as const },
  completed:   { label: "Completed",   variant: "completed" as const },
};

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { docId } = await params;
  const user = await requireAuth();

  const dbDoc = await getDocById(docId, user.id);
  if (!dbDoc) notFound();

  const dbRep = await getRepetitionByDocId(docId);

  const doc = serializeDoc(dbDoc);
  const rep = dbRep ? serializeRepetition(dbRep) : null;

  const [notes, terms] = await Promise.all([
    getDocNotes(docId),
    getDocTerms(docId),
  ]);

  const status = STATUS_CONFIG[doc.status];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back nav */}
      <div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif font-semibold text-forest-slate leading-snug">
            {doc.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={doc.difficulty === "easy" ? "easy" : doc.difficulty === "medium" ? "medium" : "hard"}>
              {doc.difficulty}
            </Badge>
            {doc.tags.map((tag) => (
              <Link key={tag} href={`/documents?tag=${tag}`}>
                <Badge variant="tag" className="cursor-pointer">#{tag}</Badge>
              </Link>
            ))}
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
        <Link
          href={`/study/${doc.id}`}
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="gap-1.5 bouncy-hover">
            <BookOpen className="h-3.5 w-3.5" />
            Study Document
          </Button>
        </Link>
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
  );
}
