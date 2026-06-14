import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getOAuthAppUrl } from "@/lib/auth/oauth-url";
import { getSession } from "@/lib/auth/session";
import { PROVIDERS, isProviderConfigured, isSocialProvider } from "@/lib/social";

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (!isSocialProvider(provider)) {
    return new NextResponse("Unknown provider", { status: 404 });
  }

  const user = await getSession();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(
      new URL(`/posts?social=${provider}&status=not_configured`, request.url)
    );
  }

  const cfg = PROVIDERS[provider];
  const appUrl = getOAuthAppUrl(request);
  const redirectUri = `${appUrl}/api/social/${provider}/callback`;
  const state = randomBytes(16).toString("hex");

  const url = new URL(cfg.authUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", cfg.scope);
  url.searchParams.set("state", state);

  let codeVerifier: string | undefined;
  if (cfg.pkce) {
    codeVerifier = base64url(randomBytes(32));
    const challenge = base64url(createHash("sha256").update(codeVerifier).digest());
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  const response = NextResponse.redirect(url.toString());
  const cookieOpts = { httpOnly: true, maxAge: 600, sameSite: "lax" as const, path: "/" };
  response.cookies.set(`social_state_${provider}`, state, cookieOpts);
  if (codeVerifier) {
    response.cookies.set(`social_verifier_${provider}`, codeVerifier, cookieOpts);
  }
  return response;
}
