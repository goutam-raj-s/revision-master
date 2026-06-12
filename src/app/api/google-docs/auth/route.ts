import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getOAuthAppUrl } from "@/lib/auth/oauth-url";
import { getSession } from "@/lib/auth/session";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const appUrl = getOAuthAppUrl(request);
  const redirectUri = `${appUrl}/api/google-docs/callback`;
  const state = randomBytes(16).toString("hex");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DRIVE_FILE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set("gdocs_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
