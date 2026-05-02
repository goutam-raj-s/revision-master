"use client";
import dynamic from "next/dynamic";

export const PDFAnnotatorDynamic = dynamic(
  () => import("./PDFAnnotator").then((mod) => mod.PDFAnnotator),
  { ssr: false, loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded-md w-full" /> }
);
