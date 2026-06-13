"use client";

import * as React from "react";
import { Editor } from "@tiptap/react";
import { List, X } from "lucide-react";

interface Heading {
  level: number;
  text: string;
  pos: number;
}

/** Floating document outline (table of contents) derived from headings. */
export function EditorOutline({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = React.useState(false);
  const [headings, setHeadings] = React.useState<Heading[]>([]);

  React.useEffect(() => {
    if (!editor) return;
    const compute = () => {
      const hs: Heading[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          hs.push({ level: node.attrs.level as number, text: node.textContent || "Untitled", pos });
        }
      });
      setHeadings(hs);
    };
    compute();
    editor.on("update", compute);
    return () => {
      editor.off("update", compute);
    };
  }, [editor]);

  if (!editor) return null;

  function jumpTo(pos: number) {
    editor!.chain().focus().setTextSelection(pos + 1).run();
    const dom = editor!.view.domAtPos(pos + 1).node as HTMLElement;
    const el = dom.nodeType === 1 ? dom : dom.parentElement;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Document outline"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mossy-gray transition-colors hover:bg-canvas hover:text-forest-slate"
      >
        <List className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-3 top-14 z-30 max-h-[60vh] w-64 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-glass">
          <div className="mb-1 flex items-center justify-between px-1.5 py-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-mossy-gray">Outline</span>
            <button onClick={() => setOpen(false)} className="text-mossy-gray hover:text-forest-slate">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {headings.length === 0 ? (
            <p className="px-1.5 py-3 text-center text-xs text-mossy-gray">
              No headings yet. Use H1–H3 to build an outline.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {headings.map((h, i) => (
                <li key={i}>
                  <button
                    onClick={() => jumpTo(h.pos)}
                    className="block w-full truncate rounded-md px-2 py-1 text-left text-sm text-forest-slate transition-colors hover:bg-canvas"
                    style={{ paddingLeft: `${(h.level - 1) * 0.75 + 0.5}rem` }}
                    title={h.text}
                  >
                    {h.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
