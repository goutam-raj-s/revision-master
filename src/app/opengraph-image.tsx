import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "lostbae — Lightweight Tasks and Spaced Repetition";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded default social-share image (used for the home page and as fallback).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a7d59 0%, #059669 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            l
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>lostbae</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 900 }}>
          Keep your learning queue lightweight.
        </div>
        <div style={{ fontSize: 30, marginTop: 28, opacity: 0.9, maxWidth: 880 }}>
          Focused tasks, spaced repetition, and active recall without heavy document workflows.
        </div>
      </div>
    ),
    { ...size }
  );
}
