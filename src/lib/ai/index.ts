import crypto from "crypto";

/**
 * Unified AI layer over three OpenAI-compatible providers (OpenRouter, Groq,
 * Gemini). Each user is pinned to one provider via a stable hash so free-tier
 * limits are spread across the keys; on failure we fall back to the others.
 *
 * System-prompt caching: the document/video context is always placed first in
 * a single stable system message. Providers that support implicit prompt
 * caching (Gemini, and Anthropic/Gemini models via OpenRouter) will reuse it
 * across a user's successive chat turns on the same document automatically.
 */

export type ProviderId = "openrouter" | "groq" | "gemini";

interface ProviderConfig {
  id: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Extra headers (OpenRouter wants attribution headers). */
  headers?: Record<string, string>;
}

function usableApiKey(value: string | undefined): value is string {
  return Boolean(value && value.length > 10 && !value.startsWith("your-"));
}

function envKeys(baseName: string): string[] {
  const values = [
    process.env[baseName],
    ...(process.env[`${baseName}S`]?.split(",") ?? []),
    ...Array.from({ length: 10 }, (_, index) => process.env[`${baseName}_${index + 1}`]),
  ];
  return Array.from(new Set(values.map((value) => value?.trim()).filter(usableApiKey)));
}

function providerConfigs(): ProviderConfig[] {
  const templates: Array<Omit<ProviderConfig, "apiKey"> & { apiKeys: string[] }> = [
    {
      id: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKeys: envKeys("OPENROUTER_API_KEY"),
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://www.lostbae.com",
        "X-Title": "lostbae",
      },
    },
    {
      id: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKeys: envKeys("GROQ_API_KEY"),
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    },
    {
      id: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKeys: envKeys("GEMINI_API_KEY"),
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    },
  ];
  return templates.flatMap(({ apiKeys, ...provider }) =>
    apiKeys.map((apiKey) => ({ ...provider, apiKey }))
  );
}

export function aiConfigured(): boolean {
  return providerConfigs().length > 0;
}

/** Stable per-user ordering: pinned provider first, then the rest as fallback. */
function providersForUser(userId: string): ProviderConfig[] {
  const configs = providerConfigs();
  if (configs.length <= 1) return configs;
  const h = crypto.createHash("md5").update(userId).digest();
  const start = h[0] % configs.length;
  return [...configs.slice(start), ...configs.slice(0, start)];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CallOpts {
  userId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

// ── HTML → text (strip TipTap/Doc markup before sending to the model) ─────────
export function htmlToText(input: string): string {
  if (!input) return "";
  let s = input;
  // If it's TipTap JSON, pull out text nodes; otherwise treat as HTML.
  if (s.trimStart().startsWith("{")) {
    try {
      const json = JSON.parse(s);
      const parts: string[] = [];
      const walk = (n: unknown) => {
        if (!n || typeof n !== "object") return;
        const node = n as { text?: string; content?: unknown[] };
        if (typeof node.text === "string") parts.push(node.text);
        if (Array.isArray(node.content)) node.content.forEach(walk);
      };
      walk(json);
      s = parts.join(" ");
    } catch {
      /* fall through to HTML handling */
    }
  }
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Hard cap on context characters to stay within free-tier token budgets. */
export const MAX_CONTEXT_CHARS = 24000;

export function clampContext(text: string, max = MAX_CONTEXT_CHARS): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n…[content truncated]";
}

async function callProvider(
  cfg: ProviderConfig,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  stream: boolean
): Promise<Response> {
  return fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...cfg.headers,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    }),
  });
}

/** Non-streaming completion with provider fallback. Returns assistant text. */
export async function aiComplete(opts: CallOpts): Promise<string> {
  const providers = providersForUser(opts.userId);
  if (providers.length === 0) throw new Error("AI is not configured on the server.");

  let lastErr = "";
  for (const cfg of providers) {
    try {
      const res = await callProvider(
        cfg,
        opts.messages,
        opts.temperature ?? 0.3,
        opts.maxTokens ?? 1500,
        false
      );
      if (!res.ok) {
        lastErr = `${cfg.id}: ${res.status} ${await res.text()}`;
        continue;
      }
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (text) return text;
      lastErr = `${cfg.id}: empty response`;
    } catch (e) {
      lastErr = `${cfg.id}: ${e instanceof Error ? e.message : "error"}`;
    }
  }
  throw new Error(`All AI providers failed. ${lastErr}`);
}

/**
 * Streaming completion. Returns a ReadableStream of raw assistant text chunks
 * (already extracted from the provider's SSE), with provider fallback on the
 * initial connection.
 */
export async function aiStream(opts: CallOpts): Promise<ReadableStream<Uint8Array>> {
  const providers = providersForUser(opts.userId);
  if (providers.length === 0) throw new Error("AI is not configured on the server.");

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastErr = "";

      for (const cfg of providers) {
        let emitted = false;
        try {
          const res = await callProvider(
            cfg,
            opts.messages,
            opts.temperature ?? 0.4,
            opts.maxTokens ?? 1500,
            true
          );
          if (!res.ok || !res.body) {
            lastErr = `${cfg.id}: ${res.status} ${await res.text()}`;
            continue;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let doneByProvider = false;

          while (!doneByProvider) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") {
                doneByProvider = true;
                break;
              }
              try {
                const json = JSON.parse(data) as {
                  choices?: { delta?: { content?: string } }[];
                  error?: { message?: string };
                };
                if (json.error?.message) {
                  lastErr = `${cfg.id}: ${json.error.message}`;
                  doneByProvider = true;
                  break;
                }
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  emitted = true;
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                /* ignore keep-alive / partial frames */
              }
            }
          }

          await reader.cancel().catch(() => {});
          if (emitted) {
            controller.close();
            return;
          }
          lastErr = lastErr || `${cfg.id}: empty response`;
        } catch (e) {
          if (emitted) {
            controller.error(e);
            return;
          }
          lastErr = `${cfg.id}: ${e instanceof Error ? e.message : "error"}`;
        }
      }

      controller.error(new Error(`All AI providers failed. ${lastErr}`));
    },
  });
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const SUMMARY_SYSTEM =
  "You are a meticulous study-notes editor. You are given the raw text of a " +
  "learning resource (a document or video transcript). Rewrite it into a clean, " +
  "comprehensive study summary in Markdown.\n\n" +
  "STRICT RULES:\n" +
  "- PRESERVE every topic-specific fact, definition, term, example, number, " +
  "formula, and step. Do NOT omit substantive information.\n" +
  "- REMOVE only conversational filler: greetings, 'um/uh', self-promotion, " +
  "'like and subscribe', sponsor reads, repetition, and meta-talk.\n" +
  "- Organise with clear headings (##), sub-points and bullet lists.\n" +
  "- Keep the original meaning; never invent facts.\n" +
  "- Output ONLY the Markdown summary, no preamble.";

export function buildSummaryMessages(title: string, rawText: string): ChatMessage[] {
  return [
    { role: "system", content: SUMMARY_SYSTEM },
    {
      role: "user",
      content: `Title: ${title}\n\n---\n${clampContext(htmlToText(rawText))}`,
    },
  ];
}

export function buildChatSystemPrompt(
  kind: "document" | "video" | "glossary",
  title: string,
  context: string
): string {
  const label = kind === "video" ? "video" : kind === "glossary" ? "glossary" : "document";
  return (
    `You are a focused study assistant for the user's ${label} titled "${title}". ` +
    `Answer the user's questions using the ${label} context below as your primary source. ` +
    `Be concise and accurate. If a question is outside the ${label}'s scope, answer briefly ` +
    `from general knowledge but say it's not covered in the ${label}.\n\n` +
    `--- ${label.toUpperCase()} CONTEXT ---\n${clampContext(htmlToText(context))}`
  );
}

export async function generateSummary(
  userId: string,
  title: string,
  rawText: string
): Promise<string> {
  return aiComplete({
    userId,
    messages: buildSummaryMessages(title, rawText),
    temperature: 0.2,
    maxTokens: 2000,
  });
}
