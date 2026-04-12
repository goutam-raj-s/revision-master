import Link from "next/link";
import { Plus, Search, BookOpen, Calendar, Tag, GitMerge } from "lucide-react";
import { getUserDocuments, getAllUserTags } from "@/actions/documents";
import { getRepetitionByDocId } from "@/lib/db/collections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentListClient } from "@/components/features/document-list-client";
import type { Document } from "@/types";

interface DocumentsPageProps {
  searchParams: Promise<{ tag?: string; search?: string; status?: string }>;
}

export const metadata = { title: "Documents — Revision Master" };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest-slate">Documents</h1>
          <p className="text-sm text-mossy-gray mt-0.5">{docs.length} document{docs.length !== 1 ? "s" : ""} in your library</p>
        </div>
        <Link href="/documents/new">
          <Button className="gap-2 bouncy-hover">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </Link>
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
