import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { createSession } from "@/lib/auth/session";
import { getUsersCollection } from "@/lib/db/collections";

const VALID_PROVIDERS = ["google", "github", "discord"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

interface OAuthProfile {
  id: string;
  email: string;
  name: string;
}

async function exchangeCodeForToken(
  provider: Provider,
  code: string,
  redirectUri: string
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  void appUrl;

  if (provider === "google") {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await res.json();
    return data.access_token;
  } else if (provider === "github") {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    });
    const data = await res.json();
    return data.access_token;
  } else {
    // discord
    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await res.json();
    return data.access_token;
  }
}

async function fetchUserProfile(provider: Provider, accessToken: string): Promise<OAuthProfile> {
  if (provider === "google") {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return { id: data.id, email: data.email, name: data.name };
  } else if (provider === "github") {
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "lostbae" },
    });
    const user = await userRes.json();

    let email: string = user.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "lostbae" },
      });
      const emails: { email: string; primary: boolean; verified: boolean }[] = await emailsRes.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? emails[0]?.email ?? "";
    }

    return { id: String(user.id), email, name: user.name ?? user.login };
  } else {
    // discord
    const res = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return { id: data.id, email: data.email, name: data.username };
  }
}

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
  const { searchParams } = request.nextUrl;

  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_denied", appUrl));
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    const resp = NextResponse.redirect(new URL("/login?error=oauth_state_mismatch", appUrl));
    resp.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return resp;
  }

  const redirectUri = `${appUrl}/api/auth/${p}/callback`;

  let accessToken: string;
  let profile: OAuthProfile;

  try {
    accessToken = await exchangeCodeForToken(p, code, redirectUri);
    profile = await fetchUserProfile(p, accessToken);
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", appUrl));
  }

  if (!profile.email) {
    return NextResponse.redirect(new URL("/login?error=oauth_no_email", appUrl));
  }

  const users = await getUsersCollection();

  // Email collision check: existing email/password account
  const existingByEmail = await users.findOne({
    email: profile.email.toLowerCase(),
  });

  if (existingByEmail && (!existingByEmail.provider || existingByEmail.provider === "email")) {
    const response = NextResponse.redirect(new URL("/login?error=email_exists", appUrl));
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return response;
  }

  // Find or create OAuth user
  let user = await users.findOne({
    provider: p,
    providerAccountId: profile.id,
  });

  if (!user) {
    const now = new Date();
    const result = await users.insertOne({
      _id: new ObjectId(),
      email: profile.email.toLowerCase(),
      passwordHash: "",
      name: profile.name,
      role: "user",
      provider: p,
      providerAccountId: profile.id,
      createdAt: now,
      updatedAt: now,
    });
    user = await users.findOne({ _id: result.insertedId });
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", appUrl));
  }

  await createSession(user._id.toString());

  const response = NextResponse.redirect(new URL("/dashboard", appUrl));
  response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return response;
}
