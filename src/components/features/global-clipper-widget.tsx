"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const GlobalClipperPanel = dynamic(
  () => import("@/components/features/global-clipper-panel").then((mod) => mod.GlobalClipperPanel),
  { ssr: false }
);

export function GlobalClipperWidget() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return isOpen ? <GlobalClipperPanel onClose={() => setIsOpen(false)} /> : null;
}
