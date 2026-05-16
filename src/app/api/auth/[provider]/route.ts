import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "crypto";

const VALID_PROVIDERS = ["google", "github", "discord"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!VALID_PROVIDERS.includes(provider as Provider)) {
    return new NextResponse("Invalid provider", { status: 400 });
  }

  const p = provider as Provider;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (!appUrl) {
    return new NextResponse("App URL could not be determined", { status: 500 });
  }
  const state = randomBytes(16).toString("hex");
  const redirectUri = `${appUrl}/api/auth/${p}/callback`;

  let authUrl: string;

  if (p === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    authUrl = url.toString();
  } else if (p === "github") {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    authUrl = url.toString();
  } else {
    // discord
    const url = new URL("https://discord.com/api/oauth2/authorize");
    url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify email");
    url.searchParams.set("state", state);
    authUrl = url.toString();
  }

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
