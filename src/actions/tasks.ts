"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import {
  getTasksCollection,
  getTopicCollectionsCollection,
  serializeTask,
} from "@/lib/db/collections";
import type { ActionResult, DbTask, Difficulty, LightweightTask } from "@/types";

function normalizeTags(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "").toLowerCase())
        .filter(Boolean)
    )
  );
}

function parseDueAt(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function getCollectionTaskIds(userId: ObjectId): Promise<ObjectId[]> {
  const collections = await getTopicCollectionsCollection();
  const rows = await collections
    .find({ userId, taskIds: { $exists: true, $ne: [] } })
    .project<{ taskIds?: ObjectId[] }>({ taskIds: 1 })
    .toArray();
  return rows.flatMap((row) => row.taskIds ?? []);
}

const TaskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(240),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  tags: z.string().optional(),
  dueAt: z.string().optional(),
  comment: z.string().trim().max(1000).optional(),
});

export async function getUserTasks(filter?: {
  search?: string;
  tag?: string;
  status?: string;
  includeCollectionItems?: boolean;
}): Promise<LightweightTask[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const tasks = await getTasksCollection();

  const query: Record<string, unknown> = { userId };
  const and: Record<string, unknown>[] = [];

  if (filter?.status === "completed" || filter?.status === "pending") {
    query.status = filter.status;
  }
  if (filter?.tag) query.tags = filter.tag;
  if (filter?.search) {
    and.push({
      $or: [
        { title: { $regex: filter.search, $options: "i" } },
        { tags: { $regex: filter.search, $options: "i" } },
        { "comments.content": { $regex: filter.search, $options: "i" } },
      ],
    });
  }
  if (!filter?.includeCollectionItems) {
    const collectionTaskIds = await getCollectionTaskIds(userId);
    if (collectionTaskIds.length > 0) and.push({ _id: { $nin: collectionTaskIds } });
  }
  if (and.length > 0) query.$and = and;

  const rows = await tasks.find(query).sort({ updatedAt: -1 }).toArray();
  return rows.map((task) => serializeTask(task as DbTask));
}

export async function getTaskByIdAction(taskId: string): Promise<LightweightTask | null> {
  const user = await requireAuth();
  if (!ObjectId.isValid(taskId)) return null;

  const tasks = await getTasksCollection();
  const row = await tasks.findOne({ _id: new ObjectId(taskId), userId: new ObjectId(user.id) });
  return row ? serializeTask(row as DbTask) : null;
}

export async function getAllTaskTags(includeCollectionItems = false): Promise<{ tag: string; count: number }[]> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const match: Record<string, unknown> = { userId };
  if (!includeCollectionItems) {
    const collectionTaskIds = await getCollectionTaskIds(userId);
    if (collectionTaskIds.length > 0) match._id = { $nin: collectionTaskIds };
  }

  const tasks = await getTasksCollection();
  return tasks
    .aggregate<{ tag: string; count: number }>([
      { $match: match },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ])
    .toArray();
}

export async function createTaskAction(data: {
  title: string;
  difficulty: Difficulty;
  tags?: string;
  dueAt?: string;
  comment?: string;
}): Promise<ActionResult<{ taskId: string }>> {
  const user = await requireAuth();
  const parsed = TaskInputSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const now = new Date();
  const initialComment = parsed.data.comment?.trim();
  const taskId = new ObjectId();
  const tasks = await getTasksCollection();

  await tasks.insertOne({
    _id: taskId,
    userId: new ObjectId(user.id),
    title: parsed.data.title,
    status: "pending",
    difficulty: parsed.data.difficulty,
    tags: normalizeTags(parsed.data.tags),
    comments: initialComment
      ? [{ _id: new ObjectId(), content: initialComment, createdAt: now }]
      : [],
    dueAt: parseDueAt(parsed.data.dueAt),
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true, data: { taskId: taskId.toString() } };
}

export async function updateTaskAction(
  taskId: string,
  data: {
    title?: string;
    difficulty?: Difficulty;
    tags?: string;
    dueAt?: string;
    status?: "pending" | "completed";
  }
): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(taskId)) return { success: false, error: "Invalid task." };

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) {
    const title = data.title.trim();
    if (!title) return { success: false, error: "Title is required." };
    update.title = title.slice(0, 240);
  }
  if (data.difficulty) update.difficulty = data.difficulty;
  if (data.tags !== undefined) update.tags = normalizeTags(data.tags);
  if (data.dueAt !== undefined) {
    const dueAt = parseDueAt(data.dueAt);
    if (dueAt) update.dueAt = dueAt;
    else update.dueAt = undefined;
  }
  if (data.status) {
    update.status = data.status;
    update.completedAt = data.status === "completed" ? new Date() : undefined;
  }

  const tasks = await getTasksCollection();
  const result = await tasks.updateOne(
    { _id: new ObjectId(taskId), userId: new ObjectId(user.id) },
    { $set: update }
  );
  if (result.matchedCount === 0) return { success: false, error: "Task not found." };

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/collections");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rescheduleTaskAction(taskId: string, daysFromNow: number): Promise<ActionResult> {
  const days = Math.max(0, Math.min(365, Math.round(daysFromNow)));
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + days);
  return updateTaskAction(taskId, { dueAt: dueAt.toISOString(), status: "pending" });
}

export async function completeTaskAction(taskId: string): Promise<ActionResult> {
  return updateTaskAction(taskId, { status: "completed" });
}

export async function reopenTaskAction(taskId: string): Promise<ActionResult> {
  return updateTaskAction(taskId, { status: "pending" });
}

export async function addTaskCommentAction(taskId: string, content: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(taskId)) return { success: false, error: "Invalid task." };
  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Comment is required." };

  const tasks = await getTasksCollection();
  const result = await tasks.updateOne(
    { _id: new ObjectId(taskId), userId: new ObjectId(user.id) },
    {
      $push: { comments: { _id: new ObjectId(), content: trimmed.slice(0, 1000), createdAt: new Date() } },
      $set: { updatedAt: new Date() },
    }
  );
  if (result.matchedCount === 0) return { success: false, error: "Task not found." };

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/collections");
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const user = await requireAuth();
  if (!ObjectId.isValid(taskId)) return { success: false, error: "Invalid task." };
  const userId = new ObjectId(user.id);
  const id = new ObjectId(taskId);
  const tasks = await getTasksCollection();
  const result = await tasks.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) return { success: false, error: "Task not found." };

  const collections = await getTopicCollectionsCollection();
  await collections.updateMany({ userId }, { $pull: { taskIds: id }, $set: { updatedAt: new Date() } });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/collections");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function bulkDeleteTasksAction(taskIds: string[]): Promise<ActionResult<{ deletedCount: number }>> {
  const user = await requireAuth();
  const uniqueIds = Array.from(new Set(taskIds)).filter(ObjectId.isValid).map((id) => new ObjectId(id));
  if (uniqueIds.length === 0) return { success: false, error: "Select at least one task." };

  const userId = new ObjectId(user.id);
  const tasks = await getTasksCollection();
  const result = await tasks.deleteMany({ _id: { $in: uniqueIds }, userId });

  const collections = await getTopicCollectionsCollection();
  await collections.updateMany(
    { userId },
    { $pull: { taskIds: { $in: uniqueIds } as never }, $set: { updatedAt: new Date() } }
  );

  revalidatePath("/tasks");
  revalidatePath("/collections");
  revalidatePath("/dashboard");
  return { success: true, data: { deletedCount: result.deletedCount } };
}
