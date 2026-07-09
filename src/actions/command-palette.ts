"use server";

import { getAllUserTags, getUserDocuments } from "@/actions/documents";
import { getTermSummariesAction } from "@/actions/notes";
import type { Document } from "@/types";

interface TermItem {
  id: string;
  term: string;
  docId?: string;
}

export async function getCommandPaletteDataAction(): Promise<{
  documents: Document[];
  tags: string[];
  terms: TermItem[];
}> {
  const [documents, tagData, terms] = await Promise.all([
    getUserDocuments(),
    getAllUserTags(),
    getTermSummariesAction(),
  ]);

  return {
    documents,
    tags: tagData.map((item) => item.tag),
    terms,
  };
}
