"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { getDocumentsCollection, getTermsCollection } from "@/lib/db/collections";

export interface Mentionable {
  id: string;
  label: string;
  type: "document" | "term";
  href: string;
}

/**
 * Returns up to ~8 of the user's documents and terms matching the query,
 * for the editor's @-mention autocomplete. Links resolve to the doc (terms
 * link to their parent document when known, else the terminology page).
 */
export async function searchMentionablesAction(query: string): Promise<Mentionable[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const q = query.trim();
  const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;

  const docsCol = await getDocumentsCollection();
  const termsCol = await getTermsCollection();

  const [docs, terms] = await Promise.all([
    docsCol
      .find(rx ? { userId, title: rx } : { userId })
      .project({ title: 1 })
      .sort({ updatedAt: -1 })
      .limit(6)
      .toArray(),
    termsCol
      .find(rx ? { userId, term: rx } : { userId })
      .project({ term: 1, docId: 1 })
      .limit(6)
      .toArray(),
  ]);

  const docItems: Mentionable[] = docs.map((d) => ({
    id: d._id.toString(),
    label: (d.title as string) || "Untitled",
    type: "document",
    href: `/documents/${d._id.toString()}`,
  }));

  const termItems: Mentionable[] = terms.map((t) => ({
    id: t._id.toString(),
    label: t.term as string,
    type: "term",
    href: t.docId ? `/documents/${(t.docId as ObjectId).toString()}` : "/terminology",
  }));

  return [...docItems, ...termItems].slice(0, 8);
}
