"use client";

import * as React from "react";
import { createPortal } from "react-dom";

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 8;
const TOP_LAYER_Z_INDEX = 2147483647;

interface FloatingFeaturePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function FloatingFeaturePanel({
  open,
  onOpenChange,
  triggerRef,
  children,
}: FloatingFeaturePanelProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ left: 0, top: 0, ready: false });

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxLeft = Math.max(VIEWPORT_MARGIN, viewportWidth - panelRect.width - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, viewportHeight - panelRect.height - VIEWPORT_MARGIN);

    let left = triggerRect.right + TRIGGER_GAP;
    if (left + panelRect.width > viewportWidth - VIEWPORT_MARGIN) {
      left = triggerRect.left - panelRect.width - TRIGGER_GAP;
    }

    setPosition({
      left: clamp(left, VIEWPORT_MARGIN, maxLeft),
      top: clamp(triggerRect.bottom - panelRect.height, VIEWPORT_MARGIN, maxTop),
      ready: true,
    });
  }, [triggerRef]);

  React.useLayoutEffect(() => {
    if (!open) return;

    updatePosition();
    const animationFrame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open, triggerRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed print:hidden"
      style={{
        left: position.left,
        top: position.top,
        zIndex: TOP_LAYER_Z_INDEX,
        visibility: position.ready ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
