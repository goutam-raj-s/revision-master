import { AddDocumentForm } from "@/components/features/add-document-form";

export const metadata = { title: "Import Document — lostbae" };

interface Props {
  searchParams: Promise<{ tab?: string; status?: string }>;
}

export default async function NewDocumentPage({ searchParams }: Props) {
  const { tab, status } = await searchParams;

  const initialTab = tab === "google" ? "google" : "file";
  const googleStatus =
    status === "connected" ? "connected" : status === "error" ? "error" : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-forest-slate">Import Document</h1>
        <p className="text-sm text-mossy-gray mt-1">
          Upload a file or import directly from Google Docs.
        </p>
      </div>
      <AddDocumentForm
        initialTab={initialTab as "file" | "google"}
        googleStatus={googleStatus}
      />
    </div>
  );
}
