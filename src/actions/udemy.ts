"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getUdemySessionsCollection,
  serializeUdemySession,
} from "@/lib/db/collections";
import { slugToTitle, buildUdemyCourseUrl } from "@/lib/udemy-utils";
import type { ActionResult, Difficulty, UdemySession } from "@/types";

// ── Server actions ────────────────────────────────────────────────────────────

/**
 * Create or retrieve an existing Udemy study session for a course.
 * One session per user per courseSlug (most recent).
 */
export async function createOrGetUdemySession(
  courseSlug: string,
  options: {
    lectureId?: string;
    courseTitle?: string;
    difficulty?: Difficulty;
  } = {}
): Promise<ActionResult<UdemySession>> {
  try {
    const user = await requireAuth();
    const userId = new ObjectId(user.id);
    const { lectureId, courseTitle, difficulty = "medium" } = options;

    const col = await getUdemySessionsCollection();

    const existing = await col.findOne(
      { userId, courseSlug },
      { sort: { createdAt: -1 } }
    );

    if (existing) {
      // Update lectureId if a newer one is provided
      if (lectureId && existing.lectureId !== lectureId) {
        await col.updateOne(
          { _id: existing._id },
          { $set: { lectureId, updatedAt: new Date() } }
        );
        const updated = await col.findOne({ _id: existing._id });
        if (updated) return { success: true, data: serializeUdemySession(updated) };
      }
      return { success: true, data: serializeUdemySession(existing) };
    }

    // Create new session
    const now = new Date();
    const sessionId = new ObjectId();
    const resolvedTitle = courseTitle || slugToTitle(courseSlug);
    const courseUrl = buildUdemyCourseUrl(courseSlug);

    await col.insertOne({
      _id: sessionId,
      userId,
      courseSlug,
      lectureId,
      courseTitle: resolvedTitle,
      courseUrl,
      notes: "",
      tags: [],
      difficulty,
      createdAt: now,
      updatedAt: now,
    });

    const created = await col.findOne({ _id: sessionId });
    if (!created) return { success: false, error: "Failed to retrieve created session" };

    return { success: true, data: serializeUdemySession(created) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateUdemySessionNotes(
  sessionId: string,
  notes: string
): Promise<ActionResult> {
  try {
    if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID" };
    const user = await requireAuth();
    const col = await getUdemySessionsCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(sessionId), userId: new ObjectId(user.id) },
      { $set: { notes, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return { success: false, error: "Session not found" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateUdemySessionTitle(
  sessionId: string,
  courseTitle: string
): Promise<ActionResult> {
  try {
    if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID" };
    const user = await requireAuth();
    const col = await getUdemySessionsCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(sessionId), userId: new ObjectId(user.id) },
      { $set: { courseTitle, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return { success: false, error: "Session not found" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function deleteUdemySession(sessionId: string): Promise<ActionResult> {
  try {
    if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID" };
    const user = await requireAuth();
    const col = await getUdemySessionsCollection();
    const result = await col.deleteOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(user.id),
    });
    if (result.deletedCount === 0) return { success: false, error: "Session not found" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function listUdemySessions(): Promise<UdemySession[]> {
  try {
    const user = await requireAuth();
    const col = await getUdemySessionsCollection();
    const sessions = await col
      .find({ userId: new ObjectId(user.id) })
      .sort({ updatedAt: -1 })
      .toArray();
    return sessions.map(serializeUdemySession);
  } catch {
    return [];
  }
}
