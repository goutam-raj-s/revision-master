"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { getPostDraftsCollection } from "@/lib/db/collections";
import type {
  ActionResult,
  PostDraft,
  PostImageAttachment,
  PostPlatform,
  PostStatus,
} from "@/types";

function serialize(d: {
  _id: ObjectId; platform: PostPlatform; status: PostStatus; body: string;
  images?: PostImageAttachment[];
  imageDataUrl?: string; imageName?: string; imageMimeType?: string;
  scheduledFor?: Date; publishedUrl?: string; createdAt: Date; updatedAt: Date;
}): PostDraft {
  const legacyImage = d.imageDataUrl
    ? [{ imageDataUrl: d.imageDataUrl, imageName: d.imageName, imageMimeType: d.imageMimeType }]
    : undefined;
  const images = d.images?.length ? d.images : legacyImage;
  return {
    id: d._id.toString(),
    platform: d.platform,
    status: d.status,
    body: d.body,
    images,
    imageDataUrl: d.imageDataUrl,
    imageName: d.imageName,
    imageMimeType: d.imageMimeType,
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
  platform: PostPlatform,
  attachment?: {
    imageDataUrl?: string;
    imageName?: string;
    imageMimeType?: string;
    images?: PostImageAttachment[];
  }
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();
  const images = attachment?.images?.length
    ? attachment.images
    : attachment?.imageDataUrl
      ? [{ imageDataUrl: attachment.imageDataUrl, imageName: attachment.imageName, imageMimeType: attachment.imageMimeType }]
      : [];
  const hasImage = images.length > 0;
  if (hasImage && platform !== "linkedin" && platform !== "twitter") {
    return { success: false, error: "Image attachments are available for LinkedIn and X posts right now." };
  }
  if (platform === "linkedin" && images.length > 1) {
    return { success: false, error: "LinkedIn drafts support one image attachment right now." };
  }
  if (platform === "twitter" && images.length > 4) {
    return { success: false, error: "X posts support up to 4 image attachments." };
  }
  if (!body.trim() && !hasImage) return { success: false, error: "Write something or attach an image first." };
  const col = await getPostDraftsCollection();
  const now = new Date();
  const id = new ObjectId();
  const imageFields = hasImage ? {
    images,
    imageDataUrl: images[0].imageDataUrl,
    imageName: images[0].imageName,
    imageMimeType: images[0].imageMimeType,
  } : {};
  await col.insertOne({
    _id: id, userId: new ObjectId(user.id), platform, status: "draft",
    body: body.trim(), ...imageFields, createdAt: now, updatedAt: now,
  });
  revalidatePath("/posts");
  return { success: true, data: { id: id.toString() } };
}

export async function updatePostDraftAction(
  id: string,
  patch: {
    body?: string;
    platform?: PostPlatform;
    status?: PostStatus;
    scheduledFor?: string | null;
    publishedUrl?: string | null;
    images?: PostImageAttachment[] | null;
    imageDataUrl?: string | null;
    imageName?: string | null;
    imageMimeType?: string | null;
  }
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(id)) return { success: false, error: "Invalid." };
  const set: Record<string, unknown> = { updatedAt: new Date() };
  const unset: Record<string, ""> = {};
  if (patch.body !== undefined) set.body = patch.body.trim();
  if (patch.platform) set.platform = patch.platform;
  if (patch.status) set.status = patch.status;
  if (patch.scheduledFor !== undefined) set.scheduledFor = patch.scheduledFor ? new Date(patch.scheduledFor) : undefined;
  if (patch.publishedUrl !== undefined) set.publishedUrl = patch.publishedUrl || undefined;
  if (patch.images !== undefined) {
    if (patch.images?.length) set.images = patch.images;
    else unset.images = "";
  }
  if (patch.imageDataUrl !== undefined) {
    if (patch.imageDataUrl) set.imageDataUrl = patch.imageDataUrl;
    else unset.imageDataUrl = "";
  }
  if (patch.imageName !== undefined) {
    if (patch.imageName) set.imageName = patch.imageName;
    else unset.imageName = "";
  }
  if (patch.imageMimeType !== undefined) {
    if (patch.imageMimeType) set.imageMimeType = patch.imageMimeType;
    else unset.imageMimeType = "";
  }
  const col = await getPostDraftsCollection();
  await col.updateOne(
    { _id: new ObjectId(id), userId: new ObjectId(user.id) },
    Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set }
  );
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
