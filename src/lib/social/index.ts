import { ObjectId } from "mongodb";
import { encrypt, decrypt } from "@/lib/crypto";
import { getSocialConnectionsCollection } from "@/lib/db/collections";
import type { DbSocialConnection, SocialProvider } from "@/types";

// ─── Provider config ────────────────────────────────────────────────────────

export interface ProviderConfig {
  clientId?: string;
  clientSecret?: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
  /** PKCE required (Twitter) */
  pkce: boolean;
  label: string;
}

export const PROVIDERS: Record<SocialProvider, ProviderConfig> = {
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scope: "openid profile w_member_social",
    pkce: false,
    label: "LinkedIn",
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scope: "tweet.read tweet.write users.read offline.access",
    pkce: true,
    label: "X (Twitter)",
  },
};

export function isProviderConfigured(provider: SocialProvider): boolean {
  const c = PROVIDERS[provider];
  return Boolean(c.clientId && c.clientSecret);
}

export function isSocialProvider(value: string): value is SocialProvider {
  return value === "linkedin" || value === "twitter";
}

// ─── Token exchange ─────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export async function exchangeCode(
  provider: SocialProvider,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TokenResponse> {
  const cfg = PROVIDERS[provider];
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: cfg.clientId!,
  };
  if (codeVerifier) body.code_verifier = codeVerifier;

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // Twitter (confidential client) authenticates with HTTP Basic.
  if (provider === "twitter") {
    const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  } else {
    body.client_secret = cfg.clientSecret!;
  }

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers,
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    throw new Error(`[${provider}] token exchange failed: ${await res.text()}`);
  }
  return res.json() as Promise<TokenResponse>;
}

async function refreshTwitterToken(refreshToken: string): Promise<TokenResponse> {
  const cfg = PROVIDERS.twitter;
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: cfg.clientId!,
    }),
  });
  if (!res.ok) {
    throw new Error(`[twitter] token refresh failed: ${await res.text()}`);
  }
  return res.json() as Promise<TokenResponse>;
}

// ─── Identity lookup (called right after token exchange) ────────────────────

async function fetchLinkedInIdentity(accessToken: string) {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`[linkedin] userinfo failed: ${await res.text()}`);
  const j = (await res.json()) as { sub: string; name?: string };
  return { providerUserId: j.sub, displayName: j.name };
}

async function fetchTwitterIdentity(accessToken: string) {
  const res = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`[twitter] users/me failed: ${await res.text()}`);
  const j = (await res.json()) as { data: { id: string; name?: string; username?: string } };
  return { providerUserId: j.data.id, displayName: j.data.username ?? j.data.name };
}

// ─── Persistence ────────────────────────────────────────────────────────────

export async function storeConnection(
  userId: string,
  provider: SocialProvider,
  tokens: TokenResponse
): Promise<void> {
  const identity =
    provider === "linkedin"
      ? await fetchLinkedInIdentity(tokens.access_token)
      : await fetchTwitterIdentity(tokens.access_token);

  const col = await getSocialConnectionsCollection();
  const now = new Date();
  const expiresAt = tokens.expires_in
    ? new Date(now.getTime() + tokens.expires_in * 1000)
    : undefined;

  const set: Record<string, unknown> = {
    provider,
    providerUserId: identity.providerUserId,
    displayName: identity.displayName,
    accessToken: tokens.access_token,
    accessTokenExpiresAt: expiresAt,
    scopes: PROVIDERS[provider].scope.split(" "),
    updatedAt: now,
  };
  if (tokens.refresh_token) {
    set.refreshTokenEncrypted = encrypt(tokens.refresh_token);
  }

  await col.updateOne(
    { userId: new ObjectId(userId), provider },
    {
      $set: set,
      $setOnInsert: { _id: new ObjectId(), userId: new ObjectId(userId), connectedAt: now },
    },
    { upsert: true }
  );
}

export async function getConnection(
  userId: string,
  provider: SocialProvider
): Promise<DbSocialConnection | null> {
  const col = await getSocialConnectionsCollection();
  return col.findOne({ userId: new ObjectId(userId), provider });
}

/** Returns a usable access token, transparently refreshing Twitter tokens. */
async function getValidAccessToken(conn: DbSocialConnection): Promise<string> {
  const stillValid =
    !conn.accessTokenExpiresAt ||
    conn.accessTokenExpiresAt.getTime() - Date.now() > 60_000;

  if (stillValid) return conn.accessToken;

  // Only Twitter issues refresh tokens (offline.access). LinkedIn member
  // tokens last ~60 days and must be re-consented when expired.
  if (conn.provider === "twitter" && conn.refreshTokenEncrypted) {
    const refreshed = await refreshTwitterToken(decrypt(conn.refreshTokenEncrypted));
    const col = await getSocialConnectionsCollection();
    const expiresAt = refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : undefined;
    const set: Record<string, unknown> = {
      accessToken: refreshed.access_token,
      accessTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    };
    if (refreshed.refresh_token) set.refreshTokenEncrypted = encrypt(refreshed.refresh_token);
    await col.updateOne({ _id: conn._id }, { $set: set });
    return refreshed.access_token;
  }

  throw new Error(
    `${PROVIDERS[conn.provider].label} session expired — reconnect the account in Settings.`
  );
}

// ─── Publishing ─────────────────────────────────────────────────────────────

export interface PublishResult {
  providerPostId: string;
  url: string;
}

async function publishToLinkedIn(
  conn: DbSocialConnection,
  text: string
): Promise<PublishResult> {
  const accessToken = await getValidAccessToken(conn);
  const author = `urn:li:person:${conn.providerUserId}`;
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn publish failed: ${await res.text()}`);
  }
  const id = res.headers.get("x-restli-id") ?? ((await res.json()) as { id?: string }).id ?? "";
  const url = id
    ? `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}`
    : "https://www.linkedin.com/feed/";
  return { providerPostId: id, url };
}

async function publishToTwitter(
  conn: DbSocialConnection,
  text: string
): Promise<PublishResult> {
  const accessToken = await getValidAccessToken(conn);
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`X publish failed: ${await res.text()}`);
  }
  const j = (await res.json()) as { data: { id: string } };
  const id = j.data.id;
  const handle = conn.displayName ?? "i";
  return { providerPostId: id, url: `https://twitter.com/${handle}/status/${id}` };
}

export async function publish(
  conn: DbSocialConnection,
  text: string
): Promise<PublishResult> {
  if (conn.provider === "twitter" && text.length > 280) {
    throw new Error(`X posts are limited to 280 characters (yours is ${text.length}).`);
  }
  return conn.provider === "linkedin"
    ? publishToLinkedIn(conn, text)
    : publishToTwitter(conn, text);
}
