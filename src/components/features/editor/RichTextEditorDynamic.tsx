"use client";
import dynamic from "next/dynamic";

export const RichTextEditorDynamic = dynamic(
  () => import("./RichTextEditor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-md w-full" /> }
);
