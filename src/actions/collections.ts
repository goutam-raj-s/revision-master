"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  getTopicCollectionsCollection,
  getDocumentsCollection,
  serializeDoc,
} from "@/lib/db/collections";
import type { ActionResult, TopicCollection, Document } from "@/types";

export async function getCollectionsAction(): Promise<TopicCollection[]> {
  const user = await requireAuth();
  const col = await getTopicCollectionsCollection();
  const rows = await col.find({ userId: new ObjectId(user.id) }).sort({ updatedAt: -1 }).toArray();
  return rows.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    docCount: c.docIds?.length ?? 0,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function getCollectionWithDocsAction(
  collectionId: string
): Promise<{ id: string; name: string; docs: Document[] } | null> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId)) return null;
  const col = await getTopicCollectionsCollection();
  const c = await col.findOne({ _id: new ObjectId(collectionId), userId: new ObjectId(user.id) });
  if (!c) return null;

  const docs = await getDocumentsCollection();
  const rows = c.docIds?.length
    ? await docs.find({ _id: { $in: c.docIds }, userId: new ObjectId(user.id) }).toArray()
    : [];
  // Preserve the collection's order.
  const byId = new Map(rows.map((d) => [d._id.toString(), d]));
  const ordered = (c.docIds ?? [])
    .map((id) => byId.get(id.toString()))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map(serializeDoc);

  return { id: c._id.toString(), name: c.name, docs: ordered };
}

export async function createCollectionAction(name: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Name is required." };
  const col = await getTopicCollectionsCollection();
  const now = new Date();
  const id = new ObjectId();
  await col.insertOne({ _id: id, userId: new ObjectId(user.id), name: trimmed, docIds: [], createdAt: now, updatedAt: now });
  revalidatePath("/collections");
  return { success: true, data: { id: id.toString() } };
}

export async function renameCollectionAction(collectionId: string, name: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId) || !name.trim()) return { success: false, error: "Invalid input." };
  const col = await getTopicCollectionsCollection();
  await col.updateOne(
    { _id: new ObjectId(collectionId), userId: new ObjectId(user.id) },
    { $set: { name: name.trim(), updatedAt: new Date() } }
  );
  revalidatePath("/collections");
  return { success: true };
}

export async function deleteCollectionAction(collectionId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId)) return { success: false, error: "Invalid." };
  const col = await getTopicCollectionsCollection();
  await col.deleteOne({ _id: new ObjectId(collectionId), userId: new ObjectId(user.id) });
  revalidatePath("/collections");
  return { success: true };
}

export async function addDocToCollectionAction(collectionId: string, docId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId) || !ObjectId.isValid(docId)) return { success: false, error: "Invalid." };
  const col = await getTopicCollectionsCollection();
  await col.updateOne(
    { _id: new ObjectId(collectionId), userId: new ObjectId(user.id) },
    { $addToSet: { docIds: new ObjectId(docId) }, $set: { updatedAt: new Date() } }
  );
  revalidatePath("/collections");
  return { success: true };
}

export async function removeDocFromCollectionAction(collectionId: string, docId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId) || !ObjectId.isValid(docId)) return { success: false, error: "Invalid." };
  const col = await getTopicCollectionsCollection();
  await col.updateOne(
    { _id: new ObjectId(collectionId), userId: new ObjectId(user.id) },
    { $pull: { docIds: new ObjectId(docId) }, $set: { updatedAt: new Date() } }
  );
  revalidatePath("/collections");
  return { success: true };
}
