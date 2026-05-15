"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import * as React from "react";
import { Image as ImageIcon, X, Minimize2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CollapsibleImageComponent = ({ node, updateAttributes, deleteNode }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const { src, width = "100%" } = node.attrs;
  const imageRef = React.useRef<HTMLImageElement>(null);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = imageRef.current?.offsetWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentWidth = startWidth + (moveEvent.clientX - startX);
      updateAttributes({ width: `${currentWidth}px` });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [updateAttributes]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      toast("Image copied to clipboard", { variant: "default" });
    } catch (err) {
      console.error("Copy failed", err);
      toast("Failed to copy image", { variant: "error" });
    }
  };

  return (
    <NodeViewWrapper className={cn("inline-block align-middle mx-1 my-1", isOpen && "block w-full my-4")}>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "relative group transition-all duration-300",
                isOpen ? "block w-full" : "inline-flex items-center"
              )}
              onDoubleClick={() => setIsOpen(true)}
            >
              {!isOpen ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-forest-slate/5 hover:bg-forest-slate/10 text-forest-slate/70 hover:text-forest-slate rounded-md border border-forest-slate/10 transition-all cursor-pointer shadow-sm select-none">
                  <ImageIcon className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Image</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode();
                    }}
                    className="ml-1 p-0.5 hover:bg-red-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Image"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <div 
                  className="relative group/image inline-block max-w-full"
                  style={{ width }}
                >
                  <div className="relative rounded-2xl overflow-hidden border border-border shadow-hover bg-surface animate-in fade-in zoom-in-95 duration-300">
                    <img 
                      ref={imageRef}
                      src={src} 
                      className="block w-full h-auto" 
                      alt="Uploaded content" 
                    />
                    
                    {/* Controls Overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="p-2 bg-white/90 hover:bg-white text-forest-slate rounded-xl shadow-lg backdrop-blur-md border border-border transition-all hover:scale-105 active:scale-95"
                        title="Copy Image"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                        }}
                        className="p-2 bg-white/90 hover:bg-white text-forest-slate rounded-xl shadow-lg backdrop-blur-md border border-border transition-all hover:scale-105 active:scale-95"
                        title="Collapse"
                      >
                        <Minimize2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode();
                        }}
                        className="p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-xl shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Resize Handle */}
                    <div
                      onMouseDown={startResizing}
                      className={cn(
                        "absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 transition-opacity",
                        isResizing ? "opacity-100" : "opacity-0 group-hover/image:opacity-100"
                      )}
                    >
                      <div className="w-2 h-2 border-r-2 border-b-2 border-forest-slate/40 rounded-br-[2px]" />
                    </div>
                  </div>
                  
                  {isResizing && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-forest-slate text-white text-[10px] px-2 py-0.5 rounded-full">
                      {Math.round(imageRef.current?.offsetWidth || 0)}px
                    </div>
                  )}
                </div>
              )}
            </div>
          </TooltipTrigger>
          {!isOpen && (
            <TooltipContent 
              side="top" 
              className="p-1 border border-border bg-white shadow-2xl overflow-hidden min-w-[320px] max-w-[480px] animate-in fade-in slide-in-from-bottom-2 duration-200 z-[110]"
              sideOffset={12}
            >
              <div className="rounded-lg overflow-hidden">
                <img src={src} className="w-full h-auto object-contain max-h-[400px]" alt="Image Preview" />
                <div className="p-1.5 bg-canvas/50 border-t border-border flex items-center justify-between">
                  <span className="text-[9px] text-mossy-gray font-semibold uppercase tracking-widest">Hover Preview</span>
                  <span className="text-[8px] text-mossy-gray/40">Double-click badge to expand</span>
                </div>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </NodeViewWrapper>
  );
};

export const CollapsibleImage = Node.create({
  name: "collapsibleImage",
  group: "inline",
  inline: true,
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: "100%" },
    };
  },

  parseHTML() {
    return [
      { tag: "span[data-type='collapsible-image']" },
      { 
        tag: "img", 
        getAttrs: (node: any) => ({ 
          src: typeof node === "string" ? node : node.getAttribute("src") 
        }) 
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "collapsible-image" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CollapsibleImageComponent);
  },
});
