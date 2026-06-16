"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { generateToken } from "@/lib/crypto";
import {
  getTopicCollectionsCollection,
  getDocumentsCollection,
  serializeDoc,
  LIST_DOC_PROJECTION,
} from "@/lib/db/collections";
import type { ActionResult, TopicCollection, Document, DbDocument } from "@/types";

export async function getCollectionsAction(): Promise<TopicCollection[]> {
  const user = await requireAuth();
  const col = await getTopicCollectionsCollection();
  const rows = await col.find({ userId: new ObjectId(user.id) }).sort({ updatedAt: -1 }).toArray();
  return rows.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    docCount: c.docIds?.length ?? 0,
    publicToken: c.publicToken,
    createdAt: c.createdAt.toISOString(),
  }));
}

/** Makes a collection publicly viewable as a study pack; returns its token. */
export async function shareCollectionAction(collectionId: string): Promise<ActionResult<{ token: string }>> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId)) return { success: false, error: "Invalid." };
  const col = await getTopicCollectionsCollection();
  const existing = await col.findOne({ _id: new ObjectId(collectionId), userId: new ObjectId(user.id) });
  if (!existing) return { success: false, error: "Collection not found." };
  if (existing.publicToken) return { success: true, data: { token: existing.publicToken } };
  const token = generateToken();
  await col.updateOne({ _id: existing._id }, { $set: { publicToken: token, updatedAt: new Date() } });
  revalidatePath("/collections");
  return { success: true, data: { token } };
}

export async function unshareCollectionAction(collectionId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId)) return { success: false, error: "Invalid." };
  const col = await getTopicCollectionsCollection();
  await col.updateOne(
    { _id: new ObjectId(collectionId), userId: new ObjectId(user.id) },
    { $unset: { publicToken: "" }, $set: { updatedAt: new Date() } }
  );
  revalidatePath("/collections");
  return { success: true };
}

export interface PublicPack {
  name: string;
  items: { title: string; mediaType?: string }[];
}

/** Public (no-auth) study-pack view for a share token. */
export async function getPublicPackByToken(token: string): Promise<PublicPack | null> {
  const col = await getTopicCollectionsCollection();
  const c = await col.findOne({ publicToken: token });
  if (!c) return null;
  const docs = await getDocumentsCollection();
  const rows = c.docIds?.length
    ? await docs.find({ _id: { $in: c.docIds } }).project({ title: 1, mediaType: 1 }).toArray()
    : [];
  const byId = new Map(rows.map((d) => [d._id.toString(), d]));
  const items = (c.docIds ?? [])
    .map((id) => byId.get(id.toString()))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({ title: (d.title as string) ?? "Untitled", mediaType: d.mediaType as string | undefined }));
  return { name: c.name, items };
}

export async function getCollectionWithDocsAction(
  collectionId: string
): Promise<{ id: string; name: string; docs: Document[]; publicToken?: string } | null> {
  const user = await requireAuth();
  if (!ObjectId.isValid(collectionId)) return null;
  const col = await getTopicCollectionsCollection();
  const c = await col.findOne({ _id: new ObjectId(collectionId), userId: new ObjectId(user.id) });
  if (!c) return null;

  const docs = await getDocumentsCollection();
  const rows = (c.docIds?.length
    ? await docs.find({ _id: { $in: c.docIds }, userId: new ObjectId(user.id) }).project(LIST_DOC_PROJECTION).toArray()
    : []) as unknown as DbDocument[];
  // Preserve the collection's order.
  const byId = new Map(rows.map((d) => [d._id.toString(), d]));
  const ordered = (c.docIds ?? [])
    .map((id) => byId.get(id.toString()))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map(serializeDoc);

  return { id: c._id.toString(), name: c.name, docs: ordered, publicToken: c.publicToken };
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
