import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "lostbae — Spaced Repetition for Your Google Docs",
  description:
    "Transform scattered Google Docs into a structured, revisable knowledge graph with spaced repetition.",
};

import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-canvas font-sans antialiased">
        <NextTopLoader color="#059669" showSpinner={false} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
