import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Folder } from "lucide-react";
import { getCollectionWithDocsAction } from "@/actions/collections";
import { CollectionDocRow } from "@/components/features/collection-doc-row";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const data = await getCollectionWithDocsAction(id);
  if (!data) notFound();

  return (
    <div className="space-y-5">
      <Link href="/collections" className="inline-flex items-center gap-1.5 text-sm text-mossy-gray transition-colors hover:text-forest-slate">
        <ArrowLeft className="h-3.5 w-3.5" /> Collections
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-state-upcoming/10">
          <Folder className="h-5 w-5 text-state-upcoming" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">{data.name}</h1>
          <p className="text-xs text-mossy-gray">{data.docs.length} document{data.docs.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {data.docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-mossy-gray">
            No documents yet. Open a document and use <span className="font-medium text-forest-slate">Add to collection</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.docs.map((doc) => (
            <CollectionDocRow key={doc.id} collectionId={data.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
