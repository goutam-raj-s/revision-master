"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { CollapsibleImage } from "./extensions/CollapsibleImage";
import { uploadImageAction } from "@/actions/upload";
import { EditorToolbar } from "./EditorToolbar";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Download, FileText, Loader2, Save, UploadCloud } from "lucide-react";
import { updateDocumentContentAction } from "@/actions/documents";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface RichTextEditorProps {
  initialContent?: string;
  docId?: string;
  readOnly?: boolean;
  onSave?: (content: string) => void;
}

type SaveState = "saved" | "saving" | "unsaved" | "error";

export function RichTextEditor({
  initialContent = "",
  docId,
  readOnly = false,
  onSave,
}: RichTextEditorProps) {
  const [saveState, setSaveState] = React.useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [wordCount, setWordCount] = React.useState(0);
  const [characterCount, setCharacterCount] = React.useState(0);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));

  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = React.useRef<ReturnType<typeof useEditor>>(null);
  
  // Sticky Highlight State
  const [isStickyHighlight, setIsStickyHighlight] = React.useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = React.useState("#fef08a"); // Default yellow

  const updateContentStats = React.useCallback((text: string) => {
    const normalized = text.trim();
    setCharacterCount(normalized.length);
    setWordCount(normalized ? normalized.split(/\s+/).length : 0);
  }, []);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("lostbae_editor_focus_mode");
    if (stored === "1") setFocusMode(true);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("lostbae_editor_focus_mode", focusMode ? "1" : "0");
  }, [focusMode]);

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleSave = React.useCallback(async (
    contentToSave: string,
    options: { notify?: boolean } = {}
  ) => {
    if (!docId) return;
    setSaveState("saving");
    const result = await updateDocumentContentAction(docId, contentToSave);
    if (result.success) {
      setSaveState("saved");
      setLastSavedAt(new Date());
      onSave?.(contentToSave);
      if (options.notify) {
        toast("Changes saved", { variant: "success" });
      }
    } else {
      setSaveState("error");
      toast(result.error || "Failed to save changes", { variant: "error" });
    }
  }, [docId, onSave]);

  const setHighlightColor = React.useCallback((color: string, name?: string) => {
    setIsStickyHighlight(true);
    setActiveHighlightColor(color);
    editorRef.current?.chain().focus().setHighlight({ color }).run();
    if (name) toast(`Sticky Highlight On (${name})`, { variant: "default" });
  }, []);

  const toggleStickyHighlight = React.useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;

    if (isStickyHighlight) {
      setIsStickyHighlight(false);
      ed.chain().focus().unsetHighlight().run();
      toast("Sticky Highlight Off", { variant: "default" });
    } else {
      setHighlightColor(activeHighlightColor, "Ready");
    }
  }, [activeHighlightColor, isStickyHighlight, setHighlightColor]);

  const uploadImageFile = React.useCallback(async (
    file: File,
    insertImage: (src: string) => void
  ) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      toast("Uploading image...", { variant: "default" });
      const result = await uploadImageAction(base64);
      if (result.success && result.url) {
        insertImage(result.url);
        toast("Image inserted", { variant: "success" });
      } else {
        toast(result.error || "Upload failed", { variant: "error" });
      }
    };
    reader.readAsDataURL(file);
  }, []);

  React.useEffect(() => {
    if (readOnly) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘S / Ctrl+S → save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        const ed = editorRef.current;
        if (ed && docId) {
          handleSave(ed.getHTML(), { notify: true });
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocusMode((current) => !current);
      }

      // Highlight Shortcuts
      const isH = e.key.toLowerCase() === "h";
      const isP = e.key.toLowerCase() === "p";
      const isO = e.key.toLowerCase() === "o";
      const isI = e.key.toLowerCase() === "i";

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (isH || isP || isO || isI)) {
        e.preventDefault();
        const ed = editorRef.current;
        if (!ed) return;

        if (isH) {
          toggleStickyHighlight();
        } else if (isP) {
          setHighlightColor("#fbcfe8", "Pink");
        } else if (isO) {
          setHighlightColor("#fed7aa", "Orange");
        } else if (isI) {
          setHighlightColor("#fecaca", "Red");
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [readOnly, docId, handleSave, setHighlightColor, toggleStickyHighlight]);

  const editorConfig = {
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      CollapsibleImage,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-state-today underline underline-offset-4 cursor-pointer",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full border border-border",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "bg-surface font-semibold border border-border p-2",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-border p-2",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing your masterpiece…",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }: any) => {
      if (readOnly) return;
      updateContentStats(editor.getText());
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setSaveState("unsaved");
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(editor.getHTML());
      }, 2000); // Auto-save after 2 seconds of inactivity
    },
    onCreate: ({ editor }: any) => {
      updateContentStats(editor.getText());
    },
    editorProps: {
      handleDOMEvents: {
        dragenter: (_view: any, event: DragEvent) => {
          const hasImage = Array.from(event.dataTransfer?.items || []).some((item) => item.type.startsWith("image"));
          if (hasImage) setIsDragActive(true);
          return false;
        },
        dragover: (_view: any, event: DragEvent) => {
          const hasImage = Array.from(event.dataTransfer?.items || []).some((item) => item.type.startsWith("image"));
          if (hasImage) {
            setIsDragActive(true);
            event.preventDefault();
          }
          return false;
        },
        dragleave: () => {
          setIsDragActive(false);
          return false;
        },
      },
      handlePaste: (view: any, event: ClipboardEvent) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image"));

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            uploadImageFile(file, (src) => {
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.collapsibleImage.create({ src })
                  )
                );
            });
          }
          return true;
        }
        return false;
      },
      handleDrop: (view: any, event: DragEvent) => {
        const items = Array.from(event.dataTransfer?.files || []);
        const imageFile = items.find((file) => file.type.startsWith("image"));

        if (imageFile) {
          event.preventDefault();
          setIsDragActive(false);
          uploadImageFile(imageFile, (src) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                view.dispatch(
                  view.state.tr.insert(
                    coordinates.pos,
                    schema.nodes.collapsibleImage.create({ src })
                  )
                );
              }
          });
          return true;
        }
        setIsDragActive(false);
        return false;
      },
      handleClick: (view: any, pos: number, event: MouseEvent) => {
        if (isStickyHighlight) {
          const { state, dispatch } = view;
          const { tr } = state;
          
          // If there's a selection, use it. Otherwise, use a small range around the click.
          const { from, to } = state.selection.empty 
            ? { from: pos, to: pos + 1 } 
            : state.selection;

          dispatch(
            tr.addMark(from, to, state.schema.marks.highlight.create({ color: activeHighlightColor }))
          );
          return true;
        }
        return false;
      },
    },
  };

  const editor = useEditor(editorConfig);
  // Keep editorRef in sync so Ctrl+S handler always has the latest editor
  React.useEffect(() => { editorRef.current = editor; }, [editor]);

  const handleManualSave = React.useCallback(async () => {
    if (!editor || !docId) return;
    const content = editor.getHTML();
    await handleSave(content, { notify: true });
  }, [editor, docId, handleSave]);

  const handleExportPDF = async () => {
    if (!editor) return;
    const element = document.querySelector(".tiptap-content") as HTMLElement;
    if (!element) return;

    toast("Generating PDF…", { variant: "default" });

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("document.pdf");
      toast("PDF exported successfully", { variant: "success" });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast("Failed to export PDF", { variant: "error" });
    }
  };

  const saveLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "unsaved"
        ? "Unsaved changes"
        : saveState === "error"
          ? "Save failed"
          : lastSavedAt
            ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Saved";

  return (
    <div
      className={cn(
        "relative flex flex-col bg-surface border border-border overflow-hidden shadow-card transition-all duration-300",
        focusMode ? "min-h-[calc(100vh-7rem)] rounded-none md:rounded-2xl" : "h-full rounded-2xl"
      )}
    >
      {!readOnly && (
        <EditorToolbar
          editor={editor}
          isStickyHighlight={isStickyHighlight}
          activeHighlightColor={activeHighlightColor}
          focusMode={focusMode}
          onToggleStickyHighlight={toggleStickyHighlight}
          onSelectHighlightColor={setHighlightColor}
          onToggleFocusMode={() => setFocusMode((current) => !current)}
        />
      )}
      
      <div
        className={cn(
          "relative flex-1 overflow-y-auto tiptap-content transition-colors",
          focusMode ? "bg-[#fbfcfb] px-4 py-8 md:px-10" : "bg-surface p-5 md:p-8"
        )}
      >
        <div
          className={cn(
            "mx-auto transition-all duration-300",
            focusMode ? "max-w-3xl" : "max-w-5xl"
          )}
        >
          <EditorContent editor={editor} />
        </div>
        {isDragActive && (
          <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-state-today/60 bg-state-today/8 text-state-today shadow-inner">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium shadow-soft">
              <UploadCloud className="h-4 w-4" />
              Drop image to insert it here
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className={cn("flex items-center justify-between gap-2 border-t border-border bg-canvas/60 px-2 py-1.5 sm:gap-3 sm:p-3", focusMode && "bg-white/90")}>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-mossy-gray sm:gap-x-3 sm:text-xs">
            <span className={cn("inline-flex items-center gap-1.5 font-medium", saveState === "error" && "text-destructive", saveState === "unsaved" && "text-state-stale")}>
              {saveState === "saving" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saveState === "error" ? (
                <AlertCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              {saveLabel}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {wordCount} words
            </span>
            <span className="hidden sm:inline">{characterCount} characters</span>
            <span className="hidden sm:inline">{readingMinutes} min read</span>
            {isStickyHighlight && (
              <span className="hidden items-center gap-1.5 rounded-full bg-state-today/10 px-2 py-0.5 text-state-today sm:inline-flex">
                <span className="h-2 w-2 rounded-full border border-forest-slate/20" style={{ backgroundColor: activeHighlightColor }} />
                Sticky highlight
              </span>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="h-8 w-8 gap-0 rounded-full p-0 sm:w-auto sm:gap-2 sm:px-3"
              title="Export PDF"
              aria-label="Export PDF"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleManualSave}
              disabled={saveState === "saving"}
              className="h-8 w-8 gap-0 rounded-full p-0 sm:w-auto sm:gap-2 sm:px-3"
              title="Save (Cmd/Ctrl+S)"
              aria-label="Save"
            >
              {saveState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Save</span>
              <kbd className="ml-1 hidden rounded bg-white/20 px-1 py-0.5 font-mono text-[10px] text-white/60 sm:inline">⌘S</kbd>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
