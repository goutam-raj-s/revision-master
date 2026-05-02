"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getUdemySessionsCollection,
  serializeUdemySession,
} from "@/lib/db/collections";
import { slugToTitle, buildUdemyCourseUrl } from "@/lib/udemy-utils";
import type {
  ActionResult,
  Difficulty,
  UdemySession,
  UdemyCurriculumSection,
} from "@/types";

// ── Session actions ───────────────────────────────────────────────────────────

/**
 * Create or retrieve a Udemy study session.
 *
 * Uniqueness:
 *  - If lectureId is provided → one session per (userId, courseSlug, lectureId)
 *  - If no lectureId            → one session per (userId, courseSlug) — course-level
 */
export async function createOrGetUdemySession(
  courseSlug: string,
  options: {
    lectureId?: string;
    lectureTitle?: string;
    courseTitle?: string;
    difficulty?: Difficulty;
  } = {}
): Promise<ActionResult<UdemySession>> {
  try {
    const user = await requireAuth();
    const userId = new ObjectId(user.id);
    const { lectureId, lectureTitle, courseTitle, difficulty = "medium" } = options;

    const col = await getUdemySessionsCollection();

    // Build the exact filter for this session
    const filter = lectureId
      ? { userId, courseSlug, lectureId }
      : { userId, courseSlug, lectureId: { $exists: false } };

    const existing = await col.findOne(filter, { sort: { createdAt: -1 } });

    if (existing) {
      // Update lectureTitle if a better one is provided now
      if (lectureTitle && existing.lectureTitle !== lectureTitle) {
        await col.updateOne(
          { _id: existing._id },
          { $set: { lectureTitle, updatedAt: new Date() } }
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
      ...(lectureId ? { lectureId } : {}),
      ...(lectureTitle ? { lectureTitle } : {}),
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
  title: string
): Promise<ActionResult> {
  try {
    if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid session ID" };
    const user = await requireAuth();
    const col = await getUdemySessionsCollection();
    const result = await col.updateOne(
      { _id: new ObjectId(sessionId), userId: new ObjectId(user.id) },
      { $set: { lectureTitle: title, updatedAt: new Date() } }
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

/** List all lecture-level sessions for a specific course */
export async function listUdemyLectureSessions(
  courseSlug: string
): Promise<UdemySession[]> {
  try {
    const user = await requireAuth();
    const col = await getUdemySessionsCollection();
    const sessions = await col
      .find({ userId: new ObjectId(user.id), courseSlug, lectureId: { $exists: true } })
      .sort({ updatedAt: -1 })
      .toArray();
    return sessions.map(serializeUdemySession);
  } catch {
    return [];
  }
}

// ── Curriculum fetching ───────────────────────────────────────────────────────

/**
 * Fetch the course curriculum from Udemy's landing API.
 * This endpoint is semi-public and doesn't require bearer auth — it works
 * for courses the user is enrolled in when called from a browser context.
 * We call it server-side as a best-effort; failures return an empty list.
 */
export async function fetchUdemyCurriculum(
  courseSlug: string
): Promise<UdemyCurriculumSection[]> {
  try {
    // Step 1: get the course ID from the course page HTML
    const coursePageUrl = `https://www.udemy.com/course/${courseSlug}/`;
    const pageRes = await fetch(coursePageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!pageRes.ok) return [];

    const html = await pageRes.text();

    // Extract courseId from the HTML (Udemy embeds it in JSON-LD or meta tags)
    const courseIdMatch =
      html.match(/"courseId"\s*:\s*(\d+)/) ||
      html.match(/data-course-id="(\d+)"/) ||
      html.match(/"course_id"\s*:\s*(\d+)/) ||
      html.match(/\/api-2\.0\/courses\/(\d+)\//);

    if (!courseIdMatch) return [];

    const courseId = courseIdMatch[1];

    // Step 2: fetch curriculum items
    const curriculumUrl =
      `https://www.udemy.com/api-2.0/courses/${courseId}/subscriber-curriculum-items/` +
      `?page_size=1400&fields[lecture]=id,title,object_index,sort_order,is_published` +
      `&fields[chapter]=id,title,object_index,sort_order,is_published` +
      `&fields[quiz]=id,title` +
      `&locale=en_US`;

    const apiRes = await fetch(curriculumUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: coursePageUrl,
      },
    });

    if (!apiRes.ok) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await apiRes.json();
    const results: { _class: string; id: number; title: string }[] =
      data?.results ?? [];

    // Group into sections
    const sections: UdemyCurriculumSection[] = [];
    let currentSection: UdemyCurriculumSection | null = null;

    for (const item of results) {
      if (item._class === "chapter") {
        currentSection = { id: item.id, title: item.title, lectures: [] };
        sections.push(currentSection);
      } else if (item._class === "lecture") {
        if (!currentSection) {
          currentSection = { id: 0, title: "Lectures", lectures: [] };
          sections.push(currentSection);
        }
        currentSection.lectures.push({ id: item.id, title: item.title });
      }
    }

    return sections;
  } catch {
    return [];
  }
}
