"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getYoutubeSessionsCollection,
  getAiChatsCollection,
  getRootDocForDoc,
} from "@/lib/db/collections";
import { generateSummary, aiConfigured, htmlToText } from "@/lib/ai";
import { fetchYoutubeTranscript } from "@/lib/ai/youtube-transcript";
import type { ActionResult, AiContextKind, AiChatMessage } from "@/types";

export async function aiAvailableAction(): Promise<boolean> {
  return aiConfigured();
}

// ── Document summary ──────────────────────────────────────────────────────────

/**
 * Returns the doc's AI summary, generating + persisting it on first request
 * (covers both newly-created docs and older ones opened for the first time).
 */
export async function getOrCreateDocSummaryAction(
  docId: string,
  force = false
): Promise<ActionResult<{ summary: string; generatedAt: string }>> {
  const user = await requireAuth();
  if (!ObjectId.isValid(docId)) return { success: false, error: "Invalid document." };
  if (!aiConfigured()) return { success: false, error: "AI is not configured." };

  // The SUMMARY is scoped to the page/subpage actually open (the chat is what
  // gets whole-document context, not the summary).
  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({ _id: new ObjectId(docId), userId: new ObjectId(user.id) });
  if (!doc) return { success: false, error: "Document not found." };

  if (doc.aiSummary && !force) {
    return {
      success: true,
      data: {
        summary: doc.aiSummary,
        generatedAt: (doc.aiSummaryGeneratedAt ?? doc.updatedAt).toISOString(),
      },
    };
  }

  const raw = htmlToText(doc.content ?? "");
  if (raw.length < 40) {
    return { success: false, error: "This page has no readable text to summarise." };
  }

  try {
    const summary = await generateSummary(user.id, doc.title, raw);
    const now = new Date();
    await docs.updateOne(
      { _id: doc._id },
      { $set: { aiSummary: summary, aiSummaryGeneratedAt: now } }
    );
    return { success: true, data: { summary, generatedAt: now.toISOString() } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Summary failed." };
  }
}

// ── YouTube summary ───────────────────────────────────────────────────────────

export async function getOrCreateVideoSummaryAction(
  sessionId: string,
  force = false
): Promise<ActionResult<{ summary: string; generatedAt: string }>> {
  const user = await requireAuth();
  if (!ObjectId.isValid(sessionId)) return { success: false, error: "Invalid video." };
  if (!aiConfigured()) return { success: false, error: "AI is not configured." };

  const col = await getYoutubeSessionsCollection();
  const session = await col.findOne({ _id: new ObjectId(sessionId), userId: new ObjectId(user.id) });
  if (!session) return { success: false, error: "Video not found." };

  if (session.aiSummary && !force) {
    return {
      success: true,
      data: {
        summary: session.aiSummary,
        generatedAt: (session.aiSummaryGeneratedAt ?? session.updatedAt).toISOString(),
      },
    };
  }

  // Ensure we have a transcript to summarise (cache it on the session).
  let transcript = session.transcript ?? "";
  if (!transcript) {
    transcript = await fetchYoutubeTranscript(session.videoId);
    if (transcript) {
      await col.updateOne({ _id: session._id }, { $set: { transcript } });
    }
  }
  const source = transcript || session.notes || "";
  if (source.length < 40) {
    return { success: false, error: "No transcript/captions available for this video." };
  }

  try {
    const summary = await generateSummary(user.id, session.videoTitle, source);
    const now = new Date();
    await col.updateOne(
      { _id: session._id },
      { $set: { aiSummary: summary, aiSummaryGeneratedAt: now } }
    );
    return { success: true, data: { summary, generatedAt: now.toISOString() } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Summary failed." };
  }
}

// ── Chat history ──────────────────────────────────────────────────────────────

/** Documents share one conversation across all their subpages (keyed by root). */
async function resolveChatKey(kind: AiContextKind, contextId: string, userId: string): Promise<string> {
  if (kind === "document" && ObjectId.isValid(contextId)) {
    const root = await getRootDocForDoc(contextId, userId);
    if (root) return root._id.toString();
  }
  return contextId;
}

export async function getAiChatAction(
  kind: AiContextKind,
  contextId: string
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const user = await requireAuth();
  const key = await resolveChatKey(kind, contextId, user.id);
  const col = await getAiChatsCollection();
  const chat = await col.findOne({
    userId: new ObjectId(user.id),
    contextKind: kind,
    contextId: key,
  });
  return (chat?.messages ?? []).map((m: AiChatMessage) => ({ role: m.role, content: m.content }));
}

export async function clearAiChatAction(
  kind: AiContextKind,
  contextId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const key = await resolveChatKey(kind, contextId, user.id);
  const col = await getAiChatsCollection();
  await col.deleteOne({ userId: new ObjectId(user.id), contextKind: kind, contextId: key });
  return { success: true };
}
