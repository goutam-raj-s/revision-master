import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-canvas font-sans antialiased">
        <NextTopLoader color="#059669" showSpinner={false} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
