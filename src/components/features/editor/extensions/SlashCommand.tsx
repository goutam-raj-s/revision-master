"use client";

import * as React from "react";
import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import type { Editor, Range } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Table as TableIcon,
  Quote,
  Code2,
  Minus,
  Text,
  type LucideIcon,
} from "lucide-react";

interface SlashItem {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  keywords: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

const ITEMS: SlashItem[] = [
  {
    title: "Text",
    subtitle: "Plain paragraph",
    icon: Text,
    keywords: "paragraph body text",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    subtitle: "Large section heading",
    icon: Heading1,
    keywords: "h1 title big",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(),
  },
  {
    title: "Heading 2",
    subtitle: "Medium heading",
    icon: Heading2,
    keywords: "h2 subtitle",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(),
  },
  {
    title: "Heading 3",
    subtitle: "Small heading",
    icon: Heading3,
    keywords: "h3",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(),
  },
  {
    title: "Bullet List",
    subtitle: "Unordered list",
    icon: List,
    keywords: "bullet unordered ul list",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    subtitle: "Ordered list",
    icon: ListOrdered,
    keywords: "ordered numbered ol list",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task List",
    subtitle: "Checklist with checkboxes",
    icon: ListChecks,
    keywords: "todo task checkbox checklist",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Table",
    subtitle: "Insert a 3×3 table",
    icon: TableIcon,
    keywords: "table grid",
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: "Quote",
    subtitle: "Blockquote",
    icon: Quote,
    keywords: "quote blockquote citation",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    subtitle: "Syntax-highlighted code",
    icon: Code2,
    keywords: "code snippet pre",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    subtitle: "Horizontal rule",
    icon: Minus,
    keywords: "divider rule separator hr line",
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
];

const SlashList = React.forwardRef<
  { onKeyDown: (p: { event: KeyboardEvent }) => boolean },
  { items: SlashItem[]; command: (item: SlashItem) => void }
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
        No blocks
      </div>
    );
  }

  return (
    <div className="max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-glass">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => command(item)}
            onMouseEnter={() => setSelected(i)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
              i === selected ? "bg-canvas" : "hover:bg-canvas/60"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-canvas text-mossy-gray">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-forest-slate">{item.title}</span>
              <span className="block truncate text-[11px] text-mossy-gray">{item.subtitle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
SlashList.displayName = "SlashList";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashItem }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase();
          return ITEMS.filter(
            (i) => i.title.toLowerCase().includes(q) || i.keywords.includes(q)
          );
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
            onStart: (props: Record<string, unknown>) => {
              component = new ReactRenderer(SlashList, {
                props,
                editor: props.editor as Editor,
              });
              popup = document.createElement("div");
              popup.style.position = "fixed";
              popup.style.zIndex = "120";
              popup.appendChild(component.element);
              document.body.appendChild(popup);
              position(props.clientRect as (() => DOMRect | null) | undefined);
            },
            onUpdate: (props: Record<string, unknown>) => {
              component?.updateProps(props);
              position(props.clientRect as (() => DOMRect | null) | undefined);
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === "Escape") {
                popup?.remove();
                component?.destroy();
                return true;
              }
              return (component?.ref as { onKeyDown?: (p: { event: KeyboardEvent }) => boolean } | null)?.onKeyDown?.(props) ?? false;
            },
            onExit: () => {
              popup?.remove();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});
