"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
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
import { Download, Save, Loader2 } from "lucide-react";
import { updateDocumentContentAction } from "@/actions/documents";
import { toast } from "@/components/ui/toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface RichTextEditorProps {
  initialContent?: string;
  docId?: string;
  readOnly?: boolean;
  onSave?: (content: string) => void;
}

export function RichTextEditor({
  initialContent = "",
  docId,
  readOnly = false,
  onSave,
}: RichTextEditorProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = React.useRef<ReturnType<typeof useEditor>>(null);
  
  // Sticky Highlight State
  const [isStickyHighlight, setIsStickyHighlight] = React.useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = React.useState("#fef08a"); // Default yellow

  const handleSave = React.useCallback(async (contentToSave: string) => {
    if (!docId) return;
    setIsSaving(true);
    const result = await updateDocumentContentAction(docId, contentToSave);
    if (result.success) {
      toast("Changes saved automatically", { variant: "default" });
      onSave?.(contentToSave);
    } else {
      toast(result.error || "Failed to save changes", { variant: "error" });
    }
    setIsSaving(false);
  }, [docId, onSave]);

  // ⌘S / Ctrl+S → save
  React.useEffect(() => {
    if (readOnly) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘S / Ctrl+S → save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        const ed = editorRef.current;
        if (ed && docId) {
          handleSave(ed.getHTML());
        }
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
          // Master Toggle
          if (isStickyHighlight) {
            setIsStickyHighlight(false);
            ed.chain().focus().unsetHighlight().run();
            toast("Sticky Highlight Off", { variant: "default" });
          } else {
            setIsStickyHighlight(true);
            setActiveHighlightColor("#fef08a");
            ed.chain().focus().setHighlight({ color: "#fef08a" }).run();
            toast("Sticky Highlight On (Yellow)", { variant: "default" });
          }
        } else if (isP) {
          setIsStickyHighlight(true);
          setActiveHighlightColor("#fbcfe8"); // Pink
          ed.chain().focus().setHighlight({ color: "#fbcfe8" }).run();
          toast("Sticky Highlight On (Pink)", { variant: "default" });
        } else if (isO) {
          setIsStickyHighlight(true);
          setActiveHighlightColor("#fed7aa"); // Orange
          ed.chain().focus().setHighlight({ color: "#fed7aa" }).run();
          toast("Sticky Highlight On (Orange)", { variant: "default" });
        } else if (isI) {
          setIsStickyHighlight(true);
          setActiveHighlightColor("#fecaca"); // Red
          ed.chain().focus().setHighlight({ color: "#fecaca" }).run();
          toast("Sticky Highlight On (Red)", { variant: "default" });
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [readOnly, docId, handleSave]);



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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(editor.getHTML());
      }, 2000); // Auto-save after 2 seconds of inactivity
    },
    editorProps: {
      handlePaste: (view: any, event: ClipboardEvent) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith("image"));

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const base64 = e.target?.result as string;
              toast("Uploading image...", { variant: "default" });
              const result = await uploadImageAction(base64);
              if (result.success) {
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.collapsibleImage.create({ src: result.url })
                  )
                );
                toast("Image uploaded", { variant: "default" });
              } else {
                toast(result.error || "Upload failed", { variant: "error" });
              }
            };
            reader.readAsDataURL(file);
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
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            toast("Uploading image...", { variant: "default" });
            const result = await uploadImageAction(base64);
            if (result.success) {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                view.dispatch(
                  view.state.tr.insert(
                    coordinates.pos,
                    schema.nodes.collapsibleImage.create({ src: result.url })
                  )
                );
              }
              toast("Image uploaded", { variant: "default" });
            } else {
              toast(result.error || "Upload failed", { variant: "error" });
            }
          };
          reader.readAsDataURL(imageFile);
          return true;
        }
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
    setIsSaving(true);
    const content = editor.getHTML();
    const result = await updateDocumentContentAction(docId, content);
    if (result.success) {
      toast("Changes saved successfully", { variant: "success" });
      onSave?.(content);
    } else {
      toast(result.error || "Failed to save changes", { variant: "error" });
    }
    setIsSaving(false);
  }, [editor, docId, onSave]);

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

  return (
    <div className="flex flex-col h-full bg-surface rounded-2xl border border-border overflow-hidden shadow-card">
      {!readOnly && <EditorToolbar editor={editor} />}
      
      <div className="flex-1 overflow-y-auto p-8 tiptap-content min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {!readOnly && (
        <div className="flex items-center justify-between p-4 border-t border-border bg-canvas/50">
          <p className="text-xs text-mossy-gray italic">
            {isSaving ? "Saving changes…" : "Last saved just now"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button size="sm" onClick={handleManualSave} disabled={isSaving} className="gap-2" title="Save (⌘S / Ctrl+S)">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
              <kbd className="ml-1 px-1 py-0.5 rounded text-[10px] font-mono bg-white/20 text-white/60">⌘S</kbd>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
