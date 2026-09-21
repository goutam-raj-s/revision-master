import { CollectionDetailOfflinePage } from "@/components/features/collection-detail-offline-page";

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { id } = await params;
  return <CollectionDetailOfflinePage collectionId={id} />;
}
