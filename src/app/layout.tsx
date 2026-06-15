import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { FocusMusicPlayer } from "@/components/features/focus-music-player";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.lostbae.com").replace(/\/$/, "");
const TITLE = "lostbae — Spaced Repetition for Your Notes, Docs & Videos";
const DESCRIPTION =
  "Turn scattered Google Docs, notes and YouTube lessons into a structured knowledge base you actually remember — with spaced repetition, active recall, and AI-assisted review.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: "%s — lostbae",
  },
  description: DESCRIPTION,
  applicationName: "lostbae",
  keywords: [
    "spaced repetition",
    "active recall",
    "study app",
    "flashcards",
    "Google Docs notes",
    "YouTube notes",
    "knowledge management",
    "revision",
    "learning",
  ],
  authors: [{ name: "lostbae" }],
  creator: "lostbae",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "lostbae",
    title: TITLE,
    description: DESCRIPTION,
    url: APP_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1713" },
  ],
};

import NextTopLoader from 'nextjs-toploader';
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-canvas font-sans antialiased">
        {/* Applies stored/system theme before first paint to avoid a light flash.
            Uses next/script (beforeInteractive) so React 19 doesn't try to
            hydrate a raw inline <script> in the tree. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("lostbae-theme");var d;if(t==="light")d=false;else if(t==="system")d=matchMedia("(prefers-color-scheme: dark)").matches;else d=true;if(d)document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}})();`}
        </Script>
        <NextTopLoader color="#059669" showSpinner={false} />
        {children}
        <FocusMusicPlayer />
        <Toaster />
      </body>
    </html>
  );
}
