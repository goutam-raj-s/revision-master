import type { MetadataRoute } from "next";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.lostbae.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private/authenticated and machine routes out of the index.
        disallow: [
          "/dashboard",
          "/documents",
          "/study",
          "/settings",
          "/terminology",
          "/video",
          "/admin",
          "/api/",
          "/shared/",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
