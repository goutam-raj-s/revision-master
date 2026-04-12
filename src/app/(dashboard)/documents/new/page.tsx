import { Brain } from "lucide-react";
import { AddDocumentForm } from "@/components/features/add-document-form";

export const metadata = { title: "Add Document — Revision Master" };

export default function NewDocumentPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-forest-slate">Add Document</h1>
        <p className="text-sm text-mossy-gray mt-1">
          Paste a public Google Doc URL to add it to your spaced repetition queue.
        </p>
      </div>
      <AddDocumentForm />
    </div>
  );
}
