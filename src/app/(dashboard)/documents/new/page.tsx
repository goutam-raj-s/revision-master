import { AddDocumentForm } from "@/components/features/add-document-form";

export const metadata = { title: "Add Document — lostbae" };

interface Props {
  searchParams: Promise<{ tab?: string; status?: string }>;
}

export default async function NewDocumentPage({ searchParams }: Props) {
  const { tab, status } = await searchParams;

  const initialTab =
    tab === "google" ? "google" : tab === "file" ? "file" : "link";
  const googleStatus =
    status === "connected" ? "connected" : status === "error" ? "error" : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-forest-slate">Add Document</h1>
        <p className="text-sm text-mossy-gray mt-1">
          Paste a Google Doc URL, upload a file, or import from Google Docs directly.
        </p>
      </div>
      <AddDocumentForm
        initialTab={initialTab as "link" | "file" | "google"}
        googleStatus={googleStatus}
      />
    </div>
  );
}
