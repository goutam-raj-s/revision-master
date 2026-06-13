"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { getPostDraftsCollection } from "@/lib/db/collections";
import type { ActionResult, PostDraft, PostPlatform, PostStatus } from "@/types";

function serialize(d: {
  _id: ObjectId; platform: PostPlatform; status: PostStatus; body: string;
  scheduledFor?: Date; publishedUrl?: string; createdAt: Date; updatedAt: Date;
}): PostDraft {
  return {
    id: d._id.toString(),
    platform: d.platform,
    status: d.status,
    body: d.body,
    scheduledFor: d.scheduledFor?.toISOString(),
    publishedUrl: d.publishedUrl,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export async function getPostDraftsAction(): Promise<PostDraft[]> {
  const user = await requireAuth();
  const col = await getPostDraftsCollection();
  const rows = await col.find({ userId: new ObjectId(user.id) }).sort({ updatedAt: -1 }).toArray();
  return rows.map(serialize);
}

export async function createPostDraftAction(
  body: string,
  platform: PostPlatform
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();
  if (!body.trim()) return { success: false, error: "Write something first." };
  const col = await getPostDraftsCollection();
  const now = new Date();
  const id = new ObjectId();
  await col.insertOne({
    _id: id, userId: new ObjectId(user.id), platform, status: "draft",
    body: body.trim(), createdAt: now, updatedAt: now,
  });
  revalidatePath("/posts");
  return { success: true, data: { id: id.toString() } };
}

export async function updatePostDraftAction(
  id: string,
  patch: { body?: string; platform?: PostPlatform; status?: PostStatus; scheduledFor?: string | null; publishedUrl?: string | null }
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(id)) return { success: false, error: "Invalid." };
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.body !== undefined) set.body = patch.body.trim();
  if (patch.platform) set.platform = patch.platform;
  if (patch.status) set.status = patch.status;
  if (patch.scheduledFor !== undefined) set.scheduledFor = patch.scheduledFor ? new Date(patch.scheduledFor) : undefined;
  if (patch.publishedUrl !== undefined) set.publishedUrl = patch.publishedUrl || undefined;
  const col = await getPostDraftsCollection();
  await col.updateOne({ _id: new ObjectId(id), userId: new ObjectId(user.id) }, { $set: set });
  revalidatePath("/posts");
  return { success: true };
}

export async function deletePostDraftAction(id: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(id)) return { success: false, error: "Invalid." };
  const col = await getPostDraftsCollection();
  await col.deleteOne({ _id: new ObjectId(id), userId: new ObjectId(user.id) });
  revalidatePath("/posts");
  return { success: true };
}
