import { getCollectionsAction } from "@/actions/collections";
import { CollectionsClient } from "@/components/features/collections-client";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const collections = await getCollectionsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Collections</h1>
        <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">Group related documents into topics.</p>
      </div>
      <CollectionsClient initial={collections} />
    </div>
  );
}
