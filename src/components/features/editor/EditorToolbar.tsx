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
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Code2,
  Minus,
  Palette,
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
  Type,
  BookOpen,
  Scissors,
  Link2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditorOutline } from "./EditorOutline";

interface EditorToolbarProps {
  editor: Editor | null;
  isStickyHighlight?: boolean;
  activeHighlightColor?: string;
  focusMode?: boolean;
  pageView?: boolean;
  onToggleStickyHighlight?: () => void;
  onSelectHighlightColor?: (color: string, name: string) => void;
  onToggleFocusMode?: () => void;
  onTogglePageView?: () => void;
  onInsertPageBreak?: () => void;
  /** Hides focus-mode toggle when true */
  compact?: boolean;
}

const HIGHLIGHT_PRESETS = [
  { name: "Yellow", color: "#fef08a", shortcut: "H" },
  { name: "Pink", color: "#fbcfe8", shortcut: "P" },
  { name: "Orange", color: "#fed7aa", shortcut: "O" },
  { name: "Red", color: "#fecaca", shortcut: "I" },
  { name: "Blue", color: "#bfdbfe" },
  { name: "Green", color: "#bbf7d0" },
];

const FONT_SIZE_PRESETS = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "20px" },
  { label: "Title", value: "28px" },
];

const TEXT_COLOR_PRESETS = [
  { name: "Slate", color: "#1e2d24" },
  { name: "Gray", color: "#6b7f73" },
  { name: "Red", color: "#dc2626" },
  { name: "Orange", color: "#d97706" },
  { name: "Green", color: "#059669" },
  { name: "Blue", color: "#2563eb" },
  { name: "Indigo", color: "#4f46e5" },
  { name: "Purple", color: "#9333ea" },
  { name: "Pink", color: "#db2777" },
  { name: "Teal", color: "#0d9488" },
  { name: "Amber", color: "#b45309" },
  { name: "Black", color: "#000000" },
];

export function EditorToolbar({
  editor,
  isStickyHighlight = false,
  activeHighlightColor = "#fef08a",
  focusMode = false,
  pageView = false,
  onToggleStickyHighlight,
  onSelectHighlightColor,
  onToggleFocusMode,
  onTogglePageView,
  onInsertPageBreak,
  compact = false,
}: EditorToolbarProps) {
  if (!editor) return null;
  const currentEditor = editor;

  function applyHighlight(color: string, name: string) {
    currentEditor.chain().focus().setHighlight({ color }).run();
    onSelectHighlightColor?.(color, name);
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imageUrlMode, setImageUrlMode] = React.useState(false);
  const [imageUrlDraft, setImageUrlDraft] = React.useState("");

  function insertImageUrl(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;
    currentEditor
      .chain()
      .focus()
      .insertContent({ type: "collapsibleImage", attrs: { src: trimmed } })
      .run();
    setImageUrlMode(false);
    setImageUrlDraft("");
  }

  function handleImageButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be selected again
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const { uploadImageAction } = await import("@/actions/upload");
      const result = await uploadImageAction(base64);
      if (result.success && result.url) {
        currentEditor
          .chain()
          .focus()
          .insertContent({ type: "collapsibleImage", attrs: { src: result.url } })
          .run();
      }
    };
    reader.readAsDataURL(file);
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
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} tooltip="Heading 3">
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} tooltip="Bullet List">
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} tooltip="Ordered List">
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive("taskList")} tooltip="Task List">
              <ListChecks className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Separator orientation="vertical" className="mx-1 h-7" />

          <div className="flex items-center gap-1 rounded-lg bg-canvas/70 p-0.5">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} tooltip="Quote">
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} tooltip="Inline Code">
              <Code className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} tooltip="Code Block">
              <Code2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Divider">
              <Minus className="h-4 w-4" />
            </ToolbarButton>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={editor.isActive("fontSize") ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-8 shrink-0 gap-1.5 px-2", editor.isActive("fontSize") && "bg-state-today/10 text-state-today")}
              >
                <Type className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-2" align="start">
              <div className="space-y-1">
                {FONT_SIZE_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => editor.chain().focus().setFontSize(preset.value).run()}
                  >
                    <span style={{ fontSize: preset.value }}>{preset.label}</span>
                  </Button>
                ))}
                <Separator className="my-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => editor.chain().focus().unsetFontSize().run()}
                >
                  Reset size
                </Button>
              </div>
            </PopoverContent>
          </Popover>

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
              <div className="flex flex-col gap-1">
                {HIGHLIGHT_PRESETS.map((preset) => {
                  const isCurrent = activeHighlightColor === preset.color;
                  return (
                    <button
                      key={preset.color}
                      onClick={() => applyHighlight(preset.color, preset.name)}
                      className={cn(
                        "flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 border border-transparent transition-all hover:border-border hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/40",
                        isCurrent && "border-state-today/40 bg-canvas ring-1 ring-state-today/30"
                      )}
                      title={preset.shortcut ? `${preset.name} (Cmd+Shift+${preset.shortcut})` : preset.name}
                    >
                      {/* Swatch */}
                      <span
                        className="relative h-5 w-5 shrink-0 rounded border border-border/60"
                        style={{ backgroundColor: preset.color }}
                      >
                        {isCurrent && <Check className="absolute inset-0 m-auto h-3 w-3 text-forest-slate/70" />}
                      </span>
                      {/* Name */}
                      <span className="flex-1 text-left text-xs text-forest-slate">{preset.name}</span>
                      {/* Shortcut kbd */}
                      {preset.shortcut && (
                        <kbd className="shrink-0 rounded border border-border bg-canvas px-1.5 py-0.5 font-mono text-[9px] text-mossy-gray shadow-sm">
                          ⌘⇧{preset.shortcut}
                        </kbd>
                      )}
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

          {/* Text color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1.5 px-2"
                title="Text color"
              >
                <Palette
                  className="h-4 w-4"
                  style={{ color: editor.getAttributes("textStyle").color || undefined }}
                />
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <p className="mb-2 text-xs font-semibold text-forest-slate">Text color</p>
              <div className="grid grid-cols-6 gap-1.5">
                {TEXT_COLOR_PRESETS.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => editor.chain().focus().setColor(c.color).run()}
                    title={c.name}
                    className="h-7 w-7 rounded-md border border-border/60 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-today/40"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
              <Separator className="my-3" />
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => editor.chain().focus().unsetColor().run()}>
                Default color
              </Button>
            </PopoverContent>
          </Popover>

          {imageUrlMode ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={imageUrlDraft}
                onChange={(e) => setImageUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); insertImageUrl(imageUrlDraft); }
                  if (e.key === "Escape") { setImageUrlMode(false); setImageUrlDraft(""); }
                }}
                placeholder="https://…"
                className="h-7 w-40 text-xs"
              />
              <button
                type="button"
                onClick={() => insertImageUrl(imageUrlDraft)}
                className="rounded px-2 py-1 text-xs bg-state-today text-white hover:bg-state-today/90"
                disabled={!imageUrlDraft.trim()}
              >OK</button>
              <button
                type="button"
                onClick={() => { setImageUrlMode(false); setImageUrlDraft(""); }}
                className="rounded p-1 text-mossy-gray hover:bg-canvas"
              ><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center">
              <ToolbarButton onClick={handleImageButtonClick} tooltip="Upload image from device">
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => setImageUrlMode(true)} tooltip="Insert image from URL">
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={handleImageFileChange}
          />

          <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} tooltip="Insert Table">
            <TableIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="min-w-2 flex-1" />

          <EditorOutline editor={editor} />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Undo">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Redo">
            <Redo className="h-4 w-4" />
          </ToolbarButton>
          {!compact && (
            <>
              <ToolbarButton
                onClick={onTogglePageView ?? (() => undefined)}
                isActive={pageView}
                tooltip={pageView ? "Exit Page View" : "Page View (Google Docs style)"}
              >
                <BookOpen className="h-4 w-4" />
              </ToolbarButton>
              {pageView && (
                <ToolbarButton
                  onClick={onInsertPageBreak ?? (() => undefined)}
                  tooltip="Insert Page Break (Cmd+Enter)"
                >
                  <Scissors className="h-4 w-4" />
                </ToolbarButton>
              )}
              <ToolbarButton onClick={onToggleFocusMode ?? (() => undefined)} isActive={focusMode} tooltip={focusMode ? "Exit Focus Mode (Cmd+Shift+F)" : "Focus Mode (Cmd+Shift+F)"}>
                <Focus className="h-4 w-4" />
              </ToolbarButton>
            </>
          )}
        </div>
        {(isStickyHighlight || focusMode || pageView) && (
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
            {pageView && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-state-today/10 px-2 py-0.5 font-medium text-state-today">
                <BookOpen className="h-3 w-3" />
                Page view · Cmd+Enter for page break
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
