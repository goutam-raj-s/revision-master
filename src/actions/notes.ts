"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getNotesCollection,
  getTermsCollection,
  getDocumentsCollection,
  serializeNote,
  serializeTerm,
} from "@/lib/db/collections";
import type { ActionResult, Note, Term } from "@/types";

// ─── Notes ─────────────────────────────────────────────────────────────────────

const NoteSchema = z.object({
  docId: z.string(),
  content: z.string().min(1).max(5000),
});

export async function createNoteAction(
  _prev: ActionResult<Note>,
  formData: FormData
): Promise<ActionResult<Note>> {
  const user = await requireAuth();
  const parsed = NoteSchema.safeParse({
    docId: formData.get("docId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { success: false, error: "Invalid note." };

  const { docId, content } = parsed.data;
  const notes = await getNotesCollection();
  const now = new Date();

  const result = await notes.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    docId: new ObjectId(docId),
    content,
    isDone: false,
    createdAt: now,
    updatedAt: now,
  });

  // Mark document as "updated"
  const docs = await getDocumentsCollection();
  await docs.updateOne(
    { _id: new ObjectId(docId), userId: new ObjectId(user.id) },
    { $set: { status: "updated", updatedAt: now } }
  );

  revalidatePath(`/documents/${docId}`);
  revalidatePath("/dashboard");

  const created = await notes.findOne({ _id: result.insertedId });
  return { success: true, data: serializeNote(created!) };
}

export async function updateNoteAction(
  noteId: string,
  content: string
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!content.trim()) return { success: false, error: "Note cannot be empty." };

  const notes = await getNotesCollection();
  await notes.updateOne(
    { _id: new ObjectId(noteId), userId: new ObjectId(user.id) },
    { $set: { content: content.trim(), updatedAt: new Date() } }
  );
  return { success: true };
}

export async function markNoteDoneAction(noteId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const notes = await getNotesCollection();
  await notes.updateOne(
    { _id: new ObjectId(noteId), userId: new ObjectId(user.id) },
    { $set: { isDone: true, updatedAt: new Date() } }
  );
  return { success: true };
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const notes = await getNotesCollection();
  await notes.deleteOne({ _id: new ObjectId(noteId), userId: new ObjectId(user.id) });
  return { success: true };
}

export async function getDocNotes(docId: string): Promise<Note[]> {
  const user = await requireAuth();
  const notes = await getNotesCollection();
  const results = await notes
    .find({ docId: new ObjectId(docId), userId: new ObjectId(user.id) })
    .sort({ createdAt: -1 })
    .toArray();
  return results.map(serializeNote);
}

// ─── Terms ─────────────────────────────────────────────────────────────────────

const TermSchema = z.object({
  docId: z.string(),
  term: z.string().min(1).max(200),
  definition: z.string().min(1).max(5000),
});

const StandaloneTermSchema = z.object({
  term: z.string().min(1).max(200),
  definition: z.string().min(1).max(5000),
});

export async function createTermAction(
  _prev: ActionResult<Term>,
  formData: FormData
): Promise<ActionResult<Term>> {
  const user = await requireAuth();
  const parsed = TermSchema.safeParse({
    docId: formData.get("docId"),
    term: formData.get("term"),
    definition: formData.get("definition"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { docId, term, definition } = parsed.data;
  const terms = await getTermsCollection();
  const now = new Date();

  const result = await terms.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    docId: new ObjectId(docId),
    term,
    definition,
    isDone: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/documents/${docId}`);
  revalidatePath("/terminology");

  const created = await terms.findOne({ _id: result.insertedId });
  return { success: true, data: serializeTerm(created!) };
}

export async function createStandaloneTermAction(
  _prev: ActionResult<Term>,
  formData: FormData
): Promise<ActionResult<Term>> {
  const user = await requireAuth();
  const parsed = StandaloneTermSchema.safeParse({
    term: formData.get("term"),
    definition: formData.get("definition"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { term, definition } = parsed.data;
  const terms = await getTermsCollection();
  const now = new Date();

  const result = await terms.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(user.id),
    term: term.trim(),
    definition: definition.trim(),
    isDone: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/terminology");

  const created = await terms.findOne({ _id: result.insertedId });
  return { success: true, data: serializeTerm(created!) };
}

export async function updateTermAction(
  termId: string,
  term: string,
  definition: string
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!term.trim() || !definition.trim()) {
    return { success: false, error: "Term and definition cannot be empty." };
  }

  const terms = await getTermsCollection();
  await terms.updateOne(
    { _id: new ObjectId(termId), userId: new ObjectId(user.id) },
    { $set: { term: term.trim(), definition: definition.trim(), updatedAt: new Date() } }
  );
  return { success: true };
}

export async function deleteTermAction(termId: string): Promise<ActionResult> {
  const user = await requireAuth();
  const terms = await getTermsCollection();
  await terms.deleteOne({ _id: new ObjectId(termId), userId: new ObjectId(user.id) });
  revalidatePath("/terminology");
  return { success: true };
}

export async function getDocTerms(docId: string): Promise<Term[]> {
  const user = await requireAuth();
  const terms = await getTermsCollection();
  const results = await terms
    .find({ docId: new ObjectId(docId), userId: new ObjectId(user.id) })
    .sort({ term: 1 })
    .toArray();
  return results.map(serializeTerm);
}

export async function getAllTerms(): Promise<Term[]> {
  const user = await requireAuth();
  const terms = await getTermsCollection();
  const results = await terms
    .find({ userId: new ObjectId(user.id) })
    .sort({ term: 1 })
    .toArray();
  return results.map(serializeTerm);
}
