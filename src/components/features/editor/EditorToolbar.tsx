"use client";

import * as React from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo,
  Redo,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Table as TableIcon,
  ChevronDown,
  Check,
  Focus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorToolbarProps {
  editor: Editor | null;
  isStickyHighlight?: boolean;
  activeHighlightColor?: string;
  focusMode?: boolean;
  onToggleStickyHighlight?: () => void;
  onSelectHighlightColor?: (color: string, name: string) => void;
  onToggleFocusMode?: () => void;
}

const HIGHLIGHT_PRESETS = [
  { name: "Yellow", color: "#fef08a", shortcut: "H" },
  { name: "Pink", color: "#fbcfe8", shortcut: "P" },
  { name: "Orange", color: "#fed7aa", shortcut: "O" },
  { name: "Red", color: "#fecaca", shortcut: "I" },
  { name: "Blue", color: "#bfdbfe" },
  { name: "Green", color: "#bbf7d0" },
];

export function EditorToolbar({
  editor,
  isStickyHighlight = false,
  activeHighlightColor = "#fef08a",
  focusMode = false,
  onToggleStickyHighlight,
  onSelectHighlightColor,
  onToggleFocusMode,
}: EditorToolbarProps) {
  if (!editor) return null;
  const currentEditor = editor;

  function applyHighlight(color: string, name: string) {
    currentEditor.chain().focus().setHighlight({ color }).run();
    onSelectHighlightColor?.(color, name);
  }

  function insertImageFromUrl() {
    const url = window.prompt("Paste image URL");
    if (!url) return;

    currentEditor
      .chain()
      .focus()
      .insertContent({ type: "collapsibleImage", attrs: { src: url } })
      .run();
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    tooltip,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 w-8 shrink-0",
              isActive && "bg-state-today/10 text-state-today"
            )}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 custom-scrollbar">
          <div className="flex items-center gap-1 rounded-lg bg-canvas/70 p-0.5">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} tooltip="Bold">
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} tooltip="Italic">
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} tooltip="Underline">
              <Underline className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} tooltip="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="mx-1 h-7" />

          <div className="flex items-center gap-1 rounded-lg bg-canvas/70 p-0.5">
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} tooltip="Heading 1">
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} tooltip="Heading 2">
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} tooltip="Bullet List">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} tooltip="Ordered List">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="mx-1 h-7" />

          <div className="flex items-center gap-1 rounded-lg bg-canvas/70 p-0.5">
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} tooltip="Align Left">
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} tooltip="Align Center">
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} tooltip="Align Right">
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="mx-1 h-7" />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={editor.isActive("highlight") || isStickyHighlight ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 shrink-0 gap-1.5 px-2",
                  (editor.isActive("highlight") || isStickyHighlight) && "bg-state-today/10 text-state-today"
                )}
              >
                <span className="h-3.5 w-3.5 rounded-full border border-forest-slate/20" style={{ backgroundColor: activeHighlightColor }} />
                <Highlighter className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-forest-slate">Highlighter</p>
                  <p className="text-[11px] text-mossy-gray">Choose color or keep it sticky</p>
                </div>
                <Button
                  variant={isStickyHighlight ? "secondary" : "outline"}
                  size="sm"
                  className={cn("h-7 px-2 text-xs", isStickyHighlight && "bg-state-today/10 text-state-today")}
                  onClick={onToggleStickyHighlight}
                >
                  Sticky
                </Button>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {HIGHLIGHT_PRESETS.map((preset) => {
                  const isCurrent = activeHighlightColor === preset.color;
                  return (
                    <button
                      key={preset.color}
                      onClick={() => applyHighlight(preset.color, preset.name)}
                      className={cn(
                        "relative aspect-square rounded-md border border-border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/40",
                        isCurrent && "ring-2 ring-state-today ring-offset-2 ring-offset-surface"
                      )}
                      style={{ backgroundColor: preset.color }}
                      title={preset.shortcut ? `${preset.name} (Cmd+Shift+${preset.shortcut})` : preset.name}
                    >
                      {isCurrent && <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-forest-slate/70" />}
                    </button>
                  );
                })}
              </div>
              <Separator className="my-3" />
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => editor.chain().focus().unsetHighlight().run()}>
                Clear Highlight
              </Button>
            </PopoverContent>
          </Popover>

          <ToolbarButton onClick={insertImageFromUrl} tooltip="Insert Image URL">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} tooltip="Insert Table">
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="min-w-2 flex-1" />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Undo">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Redo">
            <Redo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={onToggleFocusMode ?? (() => undefined)} isActive={focusMode} tooltip={focusMode ? "Exit Focus Mode (Cmd+Shift+F)" : "Focus Mode (Cmd+Shift+F)"}>
            <Focus className="h-4 w-4" />
          </ToolbarButton>
        </div>
        {(isStickyHighlight || focusMode) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-canvas/50 px-3 py-1.5 text-[11px] text-mossy-gray">
            {isStickyHighlight && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-state-today/10 px-2 py-0.5 font-medium text-state-today">
                <span className="h-2 w-2 rounded-full border border-forest-slate/20" style={{ backgroundColor: activeHighlightColor }} />
                Sticky highlight active
              </span>
            )}
            {focusMode && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-slate/5 px-2 py-0.5 font-medium text-forest-slate">
                <Focus className="h-3 w-3" />
                Focus mode
              </span>
            )}
            <span className="font-mono text-[10px] text-mossy-gray/80">Cmd+Shift+H/P/O/I</span>
            <span className="font-mono text-[10px] text-mossy-gray/80">Cmd+Shift+F</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
