import Link from "next/link";
import { Plus } from "lucide-react";
import { getUserDocuments, getAllUserTags } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import { DocumentListClient } from "@/components/features/document-list-client";

interface DocumentsPageProps {
  searchParams: Promise<{ tag?: string; search?: string; status?: string }>;
}

export const metadata = { title: "Documents — lostbae" };

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = await searchParams;
  const [docs, allTags] = await Promise.all([
    getUserDocuments({
      tags: params.tag ? [params.tag] : undefined,
      search: params.search,
      status: params.status,
    }),
    getAllUserTags(),
  ]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Documents</h1>
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">{docs.length} document{docs.length !== 1 ? "s" : ""} in your library</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/documents/create">
            <Button
              variant="outline"
              className="h-8 gap-1.5 px-2.5 text-xs bouncy-hover border-state-today/20 text-state-today hover:bg-state-today/5 sm:h-9 sm:px-4 sm:text-sm"
              aria-label="Create document"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Document</span>
            </Button>
          </Link>
          <Link href="/documents/new">
            <Button
              className="h-8 gap-1.5 px-2.5 text-xs bouncy-hover sm:h-9 sm:px-4 sm:text-sm"
              aria-label="Add document"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Document</span>
            </Button>
          </Link>
        </div>
      </div>

      <DocumentListClient
        initialDocs={docs}
        allTags={allTags}
        initialTagFilter={params.tag}
        initialSearch={params.search}
      />
    </div>
  );
}
