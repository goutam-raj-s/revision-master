import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 60,
    },
    serverActions: {
      bodySizeLimit: "10mb",
    },
    ppr: "incremental",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "docs.google.com" },
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },
};

export default nextConfig;
