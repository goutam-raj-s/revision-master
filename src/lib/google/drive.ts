import { ObjectId } from "mongodb";
import { encrypt, decrypt } from "@/lib/crypto";
import { getGoogleIntegrationsCollection } from "@/lib/db/collections";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DOCS_MIME = "application/vnd.google-apps.document";

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  version: string;
  webViewLink: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
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
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token exchange failed: ${body}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed: ${body}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function getFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFileMetadata> {
  const url = `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,modifiedTime,version,webViewLink`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive metadata fetch failed for ${fileId}: ${body}`);
  }
  return res.json() as Promise<DriveFileMetadata>;
}

export async function exportFileContent(
  accessToken: string,
  fileId: string,
  mimeType = "text/plain"
): Promise<string> {
  const url = `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Drive export failed for ${fileId}`);
  }
  return res.text();
}

export function normalizeGoogleDocsUrl(fileId: string): string {
  return `https://docs.google.com/document/d/${fileId}/edit`;
}

export function isGoogleDocMimeType(mimeType: string): boolean {
  return mimeType === GOOGLE_DOCS_MIME;
}

/** Get a valid access token for a user, refreshing if expired. Returns null if not connected. */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const col = await getGoogleIntegrationsCollection();
  const integration = await col.findOne({
    userId: new ObjectId(userId),
    provider: "google",
  });

  if (!integration) return null;

  const now = new Date();
  const bufferMs = 60_000; // 1 min buffer before expiry

  // Access token still valid
  if (
    integration.accessToken &&
    integration.accessTokenExpiresAt &&
    integration.accessTokenExpiresAt.getTime() - bufferMs > now.getTime()
  ) {
    return integration.accessToken;
  }

  // No refresh token — needs reconnect
  if (!integration.refreshTokenEncrypted) return null;

  try {
    const refreshToken = decrypt(integration.refreshTokenEncrypted);
    const tokens = await refreshAccessToken(refreshToken);

    const expiresAt = new Date(now.getTime() + tokens.expires_in * 1000);
    await col.updateOne(
      { _id: integration._id },
      {
        $set: {
          accessToken: tokens.access_token,
          accessTokenExpiresAt: expiresAt,
          updatedAt: now,
        },
      }
    );

    return tokens.access_token;
  } catch {
    // Mark as needs reconnect
    await col.updateOne(
      { _id: integration._id },
      { $set: { updatedAt: now } }
    );
    return null;
  }
}

export async function storeGoogleIntegration(
  userId: string,
  tokens: TokenResponse,
  scopes: string[]
): Promise<void> {
  const col = await getGoogleIntegrationsCollection();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + tokens.expires_in * 1000);

  const update: Record<string, unknown> = {
    provider: "google",
    scopes,
    accessToken: tokens.access_token,
    accessTokenExpiresAt: expiresAt,
    updatedAt: now,
  };

  if (tokens.refresh_token) {
    update.refreshTokenEncrypted = encrypt(tokens.refresh_token);
  }

  await col.updateOne(
    { userId: new ObjectId(userId), provider: "google" },
    {
      $set: update,
      $setOnInsert: { _id: new ObjectId(), userId: new ObjectId(userId), connectedAt: now },
    },
    { upsert: true }
  );
}
