"use client";

import * as React from "react";
import Mention, { type MentionNodeAttrs } from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { FileText, BookText } from "lucide-react";
import { searchMentionablesAction, type Mentionable } from "@/actions/mentions";

const MentionList = React.forwardRef<
  { onKeyDown: (p: { event: KeyboardEvent }) => boolean },
  { items: Mentionable[]; command: (item: Mentionable) => void }
>(({ items, command }, ref) => {
  const [selected, setSelected] = React.useState(0);
  React.useEffect(() => setSelected(0), [items]);

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelected((s) => (s + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items[selected]) command(items[selected]);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-mossy-gray shadow-glass">
        No matches
      </div>
    );
  }

  return (
    <div className="max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-glass">
      {items.map((item, i) => {
        const Icon = item.type === "term" ? BookText : FileText;
        return (
          <button
            key={`${item.type}-${item.id}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => command(item)}
            onMouseEnter={() => setSelected(i)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
              i === selected ? "bg-canvas" : "hover:bg-canvas/60"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 text-mossy-gray" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-forest-slate">{item.label}</span>
              <span className="block text-[11px] capitalize text-mossy-gray">{item.type}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
MentionList.displayName = "MentionList";

export const MentionExtension = Mention.extend({
  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
      href: { default: null },
      mentionType: { default: null },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(
        {
          href: node.attrs.href || "#",
          class: "mention-link",
          "data-type": "mention",
          "data-id": node.attrs.id,
        },
        HTMLAttributes
      ),
      `@${node.attrs.label}`,
    ];
  },
  renderText({ node }) {
    return `@${node.attrs.label}`;
  },
}).configure({
  suggestion: {
    char: "@",
    items: async ({ query }: { query: string }) => {
      try {
        return await searchMentionablesAction(query);
      } catch {
        return [];
      }
    },
    command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: MentionNodeAttrs }) => {
      const item = props as unknown as Mentionable;
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: "mention",
            attrs: {
              id: item.id,
              label: item.label,
              href: item.href,
              mentionType: item.type,
            },
          },
          { type: "text", text: " " },
        ])
        .run();
    },
    render: () => {
      let component: ReactRenderer | null = null;
      let popup: HTMLDivElement | null = null;

      const position = (clientRect: (() => DOMRect | null) | null | undefined) => {
        if (!popup || !clientRect) return;
        const rect = clientRect();
        if (!rect) return;
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.bottom + 6}px`;
      };

      return {
        onStart: (props: SuggestionProps) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          popup = document.createElement("div");
          popup.style.position = "fixed";
          popup.style.zIndex = "120";
          popup.appendChild(component.element);
          document.body.appendChild(popup);
          position(props.clientRect);
        },
        onUpdate: (props: SuggestionProps) => {
          component?.updateProps(props);
          position(props.clientRect);
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === "Escape") {
            popup?.remove();
            component?.destroy();
            return true;
          }
          return (
            (component?.ref as { onKeyDown?: (p: { event: KeyboardEvent }) => boolean } | null)?.onKeyDown?.(props) ?? false
          );
        },
        onExit: () => {
          popup?.remove();
          component?.destroy();
        },
      };
    },
  },
});
