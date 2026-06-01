import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Lock, Pencil } from "lucide-react";
import {
  getShareByToken,
  getDocumentsCollection,
  getDocumentTree,
  serializeDoc,
} from "@/lib/db/collections";
import { SharedDocumentEditor } from "@/components/features/shared-document-editor";
import { Button } from "@/components/ui/button";
import { ObjectId } from "mongodb";
import type { DocumentTreeNode } from "@/types";

interface SharedPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ page?: string }>;
}

function flattenTree(nodes: DocumentTreeNode[]): DocumentTreeNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}

function isDescendantOf(docId: string, tree: DocumentTreeNode[]): boolean {
  return flattenTree(tree).some((n) => n.id === docId);
}

function ExpiredView({ token }: { token: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-mossy-gray" />
        </div>
        <h1 className="text-xl font-semibold text-forest-slate mb-2">Link expired or not found</h1>
        <p className="text-sm text-mossy-gray mb-6">
          This share link is no longer active. Ask the owner to share it again.
        </p>
        <Link href={`/register?from=/shared/${token}`}>
          <Button variant="default" size="sm">Create a free account</Button>
        </Link>
      </div>
    </div>
  );
}

export default async function SharedDocumentPage({ params, searchParams }: SharedPageProps) {
  const { token } = await params;
  const { page: pageDocId } = await searchParams;

  const share = await getShareByToken(token);
  if (!share) return <ExpiredView token={token} />;

  const accessLevel = share.accessLevel ?? "read";
  const ownerId = share.ownerId.toString();
  const rootDocId = share.docId.toString();

  const docs = await getDocumentsCollection();
  const rootDoc = await docs.findOne({ _id: new ObjectId(rootDocId) });
  if (!rootDoc) return <ExpiredView token={token} />;

  const tree = await getDocumentTree(rootDocId, ownerId);
  const allPages = flattenTree(tree);

  // Determine which page to show
  let activeDoc = rootDoc;
  if (pageDocId && pageDocId !== rootDocId) {
    if (!ObjectId.isValid(pageDocId)) {
      redirect(`/register?from=/shared/${token}`);
    }
    if (isDescendantOf(pageDocId, tree)) {
      const found = await docs.findOne({ _id: new ObjectId(pageDocId) });
      if (found) activeDoc = found;
    } else {
      redirect(`/register?from=/shared/${token}`);
    }
  }

  const activeDocSerialized = serializeDoc(activeDoc);
  const hasSubPages = allPages.length > 1;
  const isWrite = accessLevel === "write";

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar — only when there are sub-pages */}
      {hasSubPages && (
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-white/60 px-3 py-6 gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-mossy-gray mb-2 px-2">Pages</p>
          {allPages.map((page) => {
            const isActive = page.id === activeDocSerialized.id;
            return (
              <Link
                key={page.id}
                href={`/shared/${token}${page.id !== rootDocId ? `?page=${page.id}` : ""}`}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-state-today/10 text-state-today font-medium"
                    : "text-mossy-gray hover:bg-muted hover:text-forest-slate"
                }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{page.title}</span>
              </Link>
            );
          })}
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header bar */}
        <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-canvas/80 px-4 backdrop-blur-md">
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-forest-slate">
            {activeDocSerialized.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            {isWrite && (
              <span className="inline-flex items-center gap-1 rounded-full bg-state-today/10 px-2 py-0.5 text-[11px] font-medium text-state-today">
                <Pencil className="h-2.5 w-2.5" />
                Can edit
              </span>
            )}
            <Link href="/register" className="text-xs text-mossy-gray hover:text-forest-slate transition-colors">
              Powered by lostbae ↗
            </Link>
          </div>
        </div>

        {/* Mobile sub-page strip */}
        {hasSubPages && (
          <div className="md:hidden border-b border-border px-3 py-2 flex gap-2 overflow-x-auto">
            {allPages.map((page) => {
              const isActive = page.id === activeDocSerialized.id;
              return (
                <Link
                  key={page.id}
                  href={`/shared/${token}${page.id !== rootDocId ? `?page=${page.id}` : ""}`}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-state-today/30 bg-state-today/10 text-state-today"
                      : "border-border bg-surface text-mossy-gray hover:text-forest-slate"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[180px]">{page.title}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Document content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8">
          {activeDocSerialized.mediaType === "native-doc" ? (
            <SharedDocumentEditor
              token={token}
              docId={activeDocSerialized.id}
              initialContent={activeDocSerialized.content || ""}
              readOnly={!isWrite}
            />
          ) : activeDocSerialized.mediaType === "google-doc" ? (
            <iframe
              src={activeDocSerialized.url.replace("/edit", "/preview")}
              className="w-full rounded-xl border border-border"
              style={{ height: "80vh" }}
              allowFullScreen
            />
          ) : activeDocSerialized.mediaType === "pdf" && activeDocSerialized.fileUrl ? (
            <iframe
              src={activeDocSerialized.fileUrl}
              className="w-full rounded-xl border border-border"
              style={{ height: "80vh" }}
            />
          ) : (
            <p className="text-mossy-gray text-sm">This document type cannot be previewed.</p>
          )}
        </div>
      </div>
    </div>
  );
}
