import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lostbae — Spaced Repetition",
    short_name: "lostbae",
    description:
      "Turn scattered notes, Google Docs and YouTube lessons into a knowledge base you actually remember.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f1f5f2",
    theme_color: "#059669",
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
