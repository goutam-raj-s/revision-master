"use client";

import * as React from "react";
import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Link2,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Btn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-mossy-gray transition-colors hover:bg-canvas hover:text-forest-slate",
        active && "bg-state-today/10 text-state-today"
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-5 w-px bg-border" />;

/** Floating toolbar on text selection (inline formatting + contextual table controls). */
export function EditorBubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top" }}
      shouldShow={({ editor: ed, state }) => {
        // Hide for empty selections and inside code blocks.
        const { empty } = state.selection;
        if (empty || ed.isActive("codeBlock")) return false;
        return true;
      }}
      className="flex items-center gap-0.5 rounded-xl border border-border bg-surface px-1.5 py-1 shadow-glass"
    >
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <Underline className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code className="h-3.5 w-3.5" />
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
        <Highlighter className="h-3.5 w-3.5" />
      </Btn>
      <Btn
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Link URL", prev ?? "https://");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
        }}
        active={editor.isActive("link")}
        title="Link"
      >
        <Link2 className="h-3.5 w-3.5" />
      </Btn>

      {/* Contextual table controls */}
      {editor.isActive("table") && (
        <>
          <Divider />
          <Btn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row">
            <Rows3 className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column">
            <Columns3 className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
            <Rows3 className="h-3.5 w-3.5 text-destructive" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
            <Columns3 className="h-3.5 w-3.5 text-destructive" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Btn>
        </>
      )}
    </BubbleMenu>
  );
}
