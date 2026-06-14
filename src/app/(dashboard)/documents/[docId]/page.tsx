import { redirect } from "next/navigation";

interface DocumentDetailPageProps {
  params: Promise<{ docId: string }>;
}

// The document detail view and the study view were near-identical, so opening a
// document now goes straight to the richer study page. This redirect covers
// every entry point (document list, search, sub-page tabs, backlinks, etc.).
export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { docId } = await params;
  redirect(`/study/${docId}`);
}
