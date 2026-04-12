import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getDocById, serializeDoc } from "@/lib/db/collections";
import { getGoogleDocEmbedUrl } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

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

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Minimal header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-white shadow-soft z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/documents/${doc.id}`}
            className="flex items-center gap-1.5 text-sm text-mossy-gray hover:text-forest-slate transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-border/60">|</span>
          <h1 className="font-serif font-medium text-forest-slate text-sm line-clamp-1 max-w-xl">
            {doc.title}
          </h1>
        </div>
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-mossy-gray hover:text-forest-slate transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Open in Google Docs</span>
        </a>
      </header>

      {/* Google Doc iframe — fills remaining height */}
      <div className="flex-1 relative">
        <iframe
          src={embedUrl}
          title={doc.title}
          className="w-full h-full border-0 absolute inset-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          loading="eager"
        />
      </div>
    </div>
  );
}
