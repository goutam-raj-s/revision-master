import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Applies stored/system theme before first paint to avoid a light flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("lostbae-theme");var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-canvas font-sans antialiased">
        <NextTopLoader color="#059669" showSpinner={false} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
