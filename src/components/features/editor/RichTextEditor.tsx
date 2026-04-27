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

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg border border-border max-w-full h-auto",
        },
      }),
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
  });

  const handleSave = async () => {
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
  };

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
        <style jsx global>{`
          .ProseMirror {
            outline: none;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
          .tiptap-content table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            margin: 0;
            overflow: hidden;
          }
          .tiptap-content table td,
          .tiptap-content table th {
            min-width: 1em;
            border: 2px solid #ced4da;
            padding: 3px 5px;
            vertical-align: top;
            box-sizing: border-box;
            position: relative;
          }
          .tiptap-content table th {
            font-weight: bold;
            text-align: left;
            background-color: #f8f9fa;
          }
          .tiptap-content h1 { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
          .tiptap-content h2 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.75rem; }
          .tiptap-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
          .tiptap-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        `}</style>
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
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
