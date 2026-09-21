import { getAllTerms } from "@/actions/notes";
import { TerminologyClient } from "@/components/features/terminology-client";
import { AiAssistant } from "@/components/features/ai-assistant";

export const metadata = { title: "Terminology — lostbae" };

export default async function TerminologyPage() {
  const terms = await getAllTerms();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-slate">Terminology</h1>
        <p className="text-sm text-mossy-gray mt-1">
          {terms.length} term{terms.length !== 1 ? "s" : ""} in your personal glossary
        </p>
      </div>
      <TerminologyClient terms={terms} />
      {terms.length > 0 && (
        <AiAssistant kind="glossary" contextId="all" title="Your glossary" enableSummary={false} />
      )}
    </div>
  );
}
