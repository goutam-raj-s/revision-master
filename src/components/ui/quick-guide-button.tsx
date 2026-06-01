"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ShortcutEntry {
  keys: string;
  label: string;
}

interface QuickGuideButtonProps {
  shortcuts: ShortcutEntry[];
  title?: string;
  className?: string;
}

export function QuickGuideButton({
  shortcuts,
  title = "Shortcuts & Tips",
  className,
}: QuickGuideButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded-full text-mossy-gray hover:text-forest-slate hover:bg-canvas border border-transparent hover:border-border transition-all",
            className
          )}
          aria-label="Keyboard shortcuts & tips"
          title="Keyboard shortcuts & tips"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-76 p-0 overflow-hidden shadow-hover"
      >
        <div className="border-b border-border bg-canvas/60 px-3 py-2">
          <p className="text-xs font-semibold text-forest-slate uppercase tracking-wide">
            {title}
          </p>
        </div>
        <div className="max-h-[min(420px,70vh)] overflow-y-auto p-2">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-canvas transition-colors"
            >
              <span className="text-xs text-mossy-gray">{s.label}</span>
              <kbd className="shrink-0 rounded-md border border-border bg-canvas px-2 py-0.5 font-mono text-[10px] text-forest-slate shadow-sm whitespace-nowrap">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
