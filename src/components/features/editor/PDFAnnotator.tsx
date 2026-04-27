"use client";

import * as React from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "react-pdf-highlighter";
import type { IHighlight, NewHighlight } from "react-pdf-highlighter";
import { Loader2, Save, Highlighter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { updateDocumentContentAction } from "@/actions/documents";

interface PDFAnnotatorProps {
  url: string;
  docId: string;
  initialHighlights?: string; // JSON string
}

export function PDFAnnotator({ url, docId, initialHighlights }: PDFAnnotatorProps) {
  const [highlights, setHighlights] = React.useState<IHighlight[]>(
    initialHighlights ? JSON.parse(initialHighlights) : []
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const resetHighlights = () => {
    setHighlights([]);
  };

  const getNextId = () => String(Math.random()).slice(2);

  const addHighlight = (highlight: NewHighlight) => {
    console.log("Saving highlight", highlight);
    setHighlights([{ ...highlight, id: getNextId() }, ...highlights]);
  };

  const updateHighlight = (highlightId: string, position: object, content: object) => {
    console.log("Updating highlight", highlightId, position, content);
    setHighlights(
      highlights.map((h) => {
        const { id, position: prevPosition, content: prevContent, ...rest } = h;
        return id === highlightId
          ? { id, position: { ...prevPosition, ...position }, content: { ...prevContent, ...content }, ...rest }
          : h;
      })
    );
  };

  const deleteHighlight = (id: string) => {
    setHighlights(highlights.filter((h) => h.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateDocumentContentAction(docId, JSON.stringify(highlights));
    if (result.success) {
      toast("Highlights saved", { variant: "success" });
    } else {
      toast(result.error || "Failed to save highlights", { variant: "error" });
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-[800px] bg-surface rounded-3xl border border-border overflow-hidden shadow-card">
      <div className="flex items-center justify-between p-4 border-b border-border bg-canvas/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-state-today/10 rounded-xl">
            <Highlighter className="h-5 w-5 text-state-today" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-forest-slate">PDF Annotator</h3>
            <p className="text-[10px] text-mossy-gray uppercase tracking-wider">Highlight & Save</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetHighlights} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Highlights
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-canvas">
        <PdfLoader url={url} beforeLoad={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-state-today" /></div>}>
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={() => {}}
              scrollRef={() => {}}
              onSelectionFinished={(position, content, hideTipAndSelection, transformSelection) => (
                <Tip
                  onOpen={transformSelection}
                  onConfirm={(comment) => {
                    addHighlight({ content, position, comment });
                    hideTipAndSelection();
                  }}
                />
              )}
              highlightTransform={(
                highlight,
                index,
                setTip,
                hideTip,
                viewportToScaled,
                screenshot,
                isScrolledTo
              ) => {
                const isTextHighlight = !Boolean(highlight.content && highlight.content.image);

                const component = isTextHighlight ? (
                  <Highlight
                    isScrolledTo={isScrolledTo}
                    position={highlight.position}
                    comment={highlight.comment}
                  />
                ) : (
                  <AreaHighlight
                    isScrolledTo={isScrolledTo}
                    highlight={highlight}
                    onChange={(boundingRect) => {
                      updateHighlight(
                        highlight.id,
                        { boundingRect: viewportToScaled(boundingRect) },
                        { image: screenshot(boundingRect) }
                      );
                    }}
                  />
                );

                return (
                  <Popup
                    popupContent={<div className="p-2 text-xs bg-surface border border-border rounded shadow-lg flex flex-col gap-2 min-w-[150px]">
                      <div className="font-medium text-forest-slate">{highlight.comment.text || "No comment"}</div>
                      <Button variant="ghost" size="xs" onClick={() => deleteHighlight(highlight.id)} className="text-destructive h-6 text-[10px]">Remove</Button>
                    </div>}
                    onMouseOver={(popupContent) =>
                      setTip(highlight, (highlight) => popupContent)
                    }
                    onMouseOut={hideTip}
                    key={index}
                  >
                    {component}
                  </Popup>
                );
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
      </div>
    </div>
  );
}
