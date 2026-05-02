import Link from "next/link";
import { BookText, Search, ExternalLink } from "lucide-react";
import { getAllTerms } from "@/actions/notes";
import { getUserDocuments } from "@/actions/documents";
import { Card, CardContent } from "@/components/ui/card";
import { TerminologyClient } from "@/components/features/terminology-client";

export const metadata = { title: "Terminology — lostbae" };

export default async function TerminologyPage() {
  const [terms, docs] = await Promise.all([getAllTerms(), getUserDocuments()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-slate">Terminology</h1>
        <p className="text-sm text-mossy-gray mt-1">
          {terms.length} term{terms.length !== 1 ? "s" : ""} in your personal glossary
        </p>
      </div>
      <TerminologyClient terms={terms} docs={docs} />
    </div>
  );
}
