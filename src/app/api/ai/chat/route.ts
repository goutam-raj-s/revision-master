import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/auth/session";
import {
  getDocumentsCollection,
  getYoutubeSessionsCollection,
  getTermsCollection,
  getAiChatsCollection,
  getAggregatedDocumentText,
} from "@/lib/db/collections";
import { aiStream, buildChatSystemPrompt, MAX_CONTEXT_CHARS, type ChatMessage } from "@/lib/ai";
import { fetchYoutubeTranscript } from "@/lib/ai/youtube-transcript";
import type { AiContextKind } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HISTORY_LIMIT = 12; // recent turns kept in the prompt

async function loadContext(
  kind: AiContextKind,
  contextId: string,
  userId: ObjectId
): Promise<{ title: string; context: string; storageKey: string } | null> {
  if (kind === "document") {
    if (!ObjectId.isValid(contextId)) return null;
    // Chat context = the whole document (root + all subpages). But if the whole
    // document is too long to fit the budget, fall back to just the page that's
    // open so the current page stays fully represented rather than truncated.
    const agg = await getAggregatedDocumentText(contextId, userId.toString());
    if (!agg) return null;

    if (agg.text.length <= MAX_CONTEXT_CHARS) {
      return { title: agg.title, context: agg.text, storageKey: agg.rootId };
    }

    const docs = await getDocumentsCollection();
    const cur = await docs.findOne({ _id: new ObjectId(contextId), userId });
    return {
      title: cur?.title ?? agg.title,
      context: cur?.content ?? agg.text,
      storageKey: agg.rootId,
    };
  }
  if (kind === "video") {
    if (!ObjectId.isValid(contextId)) return null;
    const col = await getYoutubeSessionsCollection();
    const s = await col.findOne({ _id: new ObjectId(contextId), userId });
    if (!s) return null;
    let transcript = s.transcript ?? "";
    if (!transcript) {
      transcript = await fetchYoutubeTranscript(s.videoId);
      if (transcript) await col.updateOne({ _id: s._id }, { $set: { transcript } });
    }
    const ctx = [s.aiSummary, transcript, s.notes].filter(Boolean).join("\n\n");
    return { title: s.videoTitle, context: ctx || s.videoTitle, storageKey: contextId };
  }
  // glossary — chat across the user's whole term bank
  const terms = await getTermsCollection();
  const rows = await terms.find({ userId }).sort({ term: 1 }).limit(400).toArray();
  const ctx = rows.map((t) => `- ${t.term}: ${t.definition ?? ""}`).join("\n");
  return { title: "Your glossary", context: ctx, storageKey: contextId };
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    kind?: AiContextKind;
    contextId?: string;
    message?: string;
  } | null;

  const kind = body?.kind;
  const contextId = body?.contextId ?? "";
  const message = body?.message?.trim();
  if (!kind || !message) return new NextResponse("Bad request", { status: 400 });

  const userId = new ObjectId(user.id);
  const loaded = await loadContext(kind, contextId, userId);
  if (!loaded) return new NextResponse("Context not found", { status: 404 });
  const storageKey = loaded.storageKey;

  // Load prior turns for continuity.
  const chats = await getAiChatsCollection();
  const existing = await chats.findOne({ userId, contextKind: kind, contextId: storageKey });
  const history = (existing?.messages ?? []).slice(-HISTORY_LIMIT);

  // Stable system message first → enables provider-side prompt caching across
  // the user's successive turns on the same document/video.
  const messages: ChatMessage[] = [
    { role: "system", content: buildChatSystemPrompt(kind, loaded.title, loaded.context) },
    ...history.map((m) => ({ role: m.role, content: m.content } as ChatMessage)),
    { role: "user", content: message },
  ];

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await aiStream({ userId: user.id, messages });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "AI error", { status: 502 });
  }

  // Pass the stream through while accumulating the full reply to persist on end.
  let full = "";
  const decoder = new TextDecoder();
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      full += decoder.decode(chunk, { stream: true });
      controller.enqueue(chunk);
    },
    async flush() {
      const now = new Date();
      await chats.updateOne(
        { userId, contextKind: kind, contextId: storageKey },
        {
          $push: {
            messages: {
              $each: [
                { role: "user", content: message, at: now },
                { role: "assistant", content: full, at: new Date() },
              ],
            },
          },
          $set: { updatedAt: now },
          $setOnInsert: { _id: new ObjectId(), userId, contextKind: kind, contextId: storageKey, createdAt: now },
        },
        { upsert: true }
      );
    },
  });

  return new NextResponse(stream.pipeThrough(transform), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
