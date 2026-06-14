"use client";

import * as React from "react";
import { marked } from "marked";
import { Sparkles, X, Send, Loader2, FileText, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import {
  getOrCreateDocSummaryAction,
  getOrCreateVideoSummaryAction,
  getAiChatAction,
  clearAiChatAction,
} from "@/actions/ai";
import { toast } from "@/components/ui/toast";
import type { AiContextKind } from "@/types";

interface AiAssistantProps {
  kind: AiContextKind;
  contextId: string;
  title: string;
  /** Hide the Summary tab for contexts that have none (e.g. glossary). */
  enableSummary?: boolean;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

function md(text: string): string {
  return marked.parse(text, { async: false }) as string;
}

export function AiAssistant({ kind, contextId, title, enableSummary = true }: AiAssistantProps) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"summary" | "chat">(enableSummary ? "summary" : "chat");

  // Summary state
  const [summary, setSummary] = React.useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [chatLoaded, setChatLoaded] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const loadSummary = React.useCallback(
    async (force = false) => {
      if (!enableSummary) return;
      setSummaryLoading(true);
      setSummaryError(null);
      const res =
        kind === "video"
          ? await getOrCreateVideoSummaryAction(contextId, force)
          : await getOrCreateDocSummaryAction(contextId, force);
      setSummaryLoading(false);
      if (res.success && res.data) setSummary(res.data.summary);
      else setSummaryError(res.error ?? "Could not generate summary.");
    },
    [kind, contextId, enableSummary]
  );

  // Lazily generate/fetch the summary the first time the panel opens.
  React.useEffect(() => {
    if (open && enableSummary && tab === "summary" && summary === null && !summaryLoading && !summaryError) {
      void loadSummary(false);
    }
  }, [open, tab, enableSummary, summary, summaryLoading, summaryError, loadSummary]);

  // Load prior chat history once.
  React.useEffect(() => {
    if (open && !chatLoaded) {
      setChatLoaded(true);
      getAiChatAction(kind, contextId).then((m) => setMessages(m));
    }
  }, [open, chatLoaded, kind, contextId]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, streaming]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, contextId, message: text }),
      });
      if (!res.ok || !res.body) {
        const err = await res.text();
        throw new Error(err || "AI request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "⚠️ " + (e instanceof Error ? e.message : "Something went wrong."),
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  async function clearChat() {
    await clearAiChatAction(kind, contextId);
    setMessages([]);
    toast("Chat cleared");
  }

  return (
    <>
      {/* Launcher (bottom-right — industry-standard placement for AI assistants) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border border-border bg-state-today px-4 py-2.5 text-sm font-medium text-white shadow-hover transition-transform hover:scale-105 print:hidden"
          aria-label="AI study assistant"
        >
          <Sparkles className="h-4 w-4" /> Ask AI
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-[60] flex h-[min(70vh,560px)] w-[min(92vw,400px)] flex-col rounded-2xl border border-border bg-surface shadow-hover print:hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-forest-slate">
              <Sparkles className="h-4 w-4 text-state-today" /> Study AI
            </span>
            <button onClick={() => setOpen(false)} className="p-1 text-mossy-gray hover:text-forest-slate" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 pt-2">
            {enableSummary && (
              <button
                onClick={() => setTab("summary")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === "summary" ? "bg-state-today/10 text-state-today" : "text-mossy-gray hover:bg-canvas"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Summary
              </button>
            )}
            <button
              onClick={() => setTab("chat")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === "chat" ? "bg-state-today/10 text-state-today" : "text-mossy-gray hover:bg-canvas"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </button>
          </div>

          {/* Summary tab */}
          {tab === "summary" && enableSummary && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
                {summaryLoading && (
                  <div className="flex items-center gap-2 text-sm text-mossy-gray">
                    <Loader2 className="h-4 w-4 animate-spin" /> Summarising “{title}”…
                  </div>
                )}
                {summaryError && <p className="text-sm text-destructive">{summaryError}</p>}
                {summary && (
                  <div
                    className="prose prose-sm max-w-none text-sm text-forest-slate [&_h2]:text-base [&_h2]:font-semibold [&_li]:my-0.5 [&_ul]:my-1"
                    dangerouslySetInnerHTML={{ __html: md(summary) }}
                  />
                )}
              </div>
              {summary && !summaryLoading && (
                <div className="border-t border-border px-3 py-2">
                  <button
                    onClick={() => loadSummary(true)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-mossy-gray hover:text-forest-slate"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chat tab */}
          {tab === "chat" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 && (
                  <p className="text-sm text-mossy-gray">
                    Ask anything about <strong>{title}</strong> — definitions, examples, “explain this part”, “quiz me”.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-state-today text-white"
                          : "bg-canvas text-forest-slate"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        m.content ? (
                          <div
                            className="prose prose-sm max-w-none [&_p]:my-1 [&_li]:my-0.5"
                            dangerouslySetInnerHTML={{ __html: md(m.content) }}
                          />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-mossy-gray" />
                        )
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="mb-1.5 ml-1 flex items-center gap-1 text-[11px] text-mossy-gray hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Clear
                  </button>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Ask about this…"
                    className="max-h-24 flex-1 resize-none rounded-xl border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-state-today/40"
                  />
                  <button
                    type="submit"
                    disabled={streaming || !input.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-state-today text-white disabled:opacity-50"
                    aria-label="Send"
                  >
                    {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
