import type { NextRequest } from "next/server";

export function getOAuthAppUrl(request: NextRequest): string {
  const requestOrigin = request.nextUrl.origin;
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const appUrl = process.env.NODE_ENV === "production"
    ? requestOrigin
    : configuredUrl || requestOrigin;

  return appUrl.replace(/\/$/, "");
}
