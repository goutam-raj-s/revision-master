import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOAuthAppUrl } from "@/lib/auth/oauth-url";
import { getSession } from "@/lib/auth/session";
import { exchangeCodeForTokens, storeGoogleIntegration } from "@/lib/google/drive";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = request.cookies.get("gdocs_oauth_state")?.value;

  // Clear state cookie
  const cleanupResponse = NextResponse.redirect(new URL("/documents/new?tab=google&status=error", request.url));
  cleanupResponse.cookies.set("gdocs_oauth_state", "", { maxAge: 0, path: "/" });

  if (error || !code || !state || state !== storedState) {
    return cleanupResponse;
  }

  try {
    const appUrl = getOAuthAppUrl(request);
    const redirectUri = `${appUrl}/api/google-docs/callback`;

    const tokens = await exchangeCodeForTokens(code, redirectUri);
    await storeGoogleIntegration(user.id, tokens, [DRIVE_FILE_SCOPE]);

    const successResponse = NextResponse.redirect(
      new URL("/documents/new?tab=google&status=connected", request.url)
    );
    successResponse.cookies.set("gdocs_oauth_state", "", { maxAge: 0, path: "/" });
    return successResponse;
  } catch {
    return cleanupResponse;
  }
}
