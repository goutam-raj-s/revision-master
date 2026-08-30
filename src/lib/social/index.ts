import { ObjectId } from "mongodb";
import { encrypt, decrypt } from "@/lib/crypto";
import { getSocialConnectionsCollection } from "@/lib/db/collections";
import type { DbSocialConnection, PostImageAttachment, SocialProvider } from "@/types";

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
    scope:
      "tweet.read tweet.write tweet.moderate.write users.read follows.read follows.write offline.access space.read mute.read mute.write like.read like.write list.read list.write block.read block.write bookmark.read bookmark.write dm.read dm.write media.write",
    pkce: true,
    label: "X (Twitter)",
  },
  tumblr: {
    clientId: process.env.TUMBLR_CLIENT_ID,
    clientSecret: process.env.TUMBLR_CLIENT_SECRET,
    authUrl: "https://www.tumblr.com/oauth2/authorize",
    tokenUrl: "https://api.tumblr.com/v2/oauth2/token",
    scope: "basic write offline_access",
    pkce: false,
    label: "Tumblr",
  },
};

export function isProviderConfigured(provider: SocialProvider): boolean {
  const c = PROVIDERS[provider];
  return Boolean(c.clientId && c.clientSecret);
}

export function isSocialProvider(value: string): value is SocialProvider {
  return value === "linkedin" || value === "twitter" || value === "tumblr";
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

async function refreshTumblrToken(refreshToken: string): Promise<TokenResponse> {
  const cfg = PROVIDERS.tumblr;
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: cfg.clientId!,
      client_secret: cfg.clientSecret!,
    }),
  });
  if (!res.ok) {
    throw new Error(`[tumblr] token refresh failed: ${await res.text()}`);
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

async function fetchTumblrIdentity(accessToken: string) {
  const res = await fetch("https://api.tumblr.com/v2/user/info", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "lostbae",
    },
  });
  if (!res.ok) throw new Error(`[tumblr] user/info failed: ${await res.text()}`);
  const j = (await res.json()) as {
    response?: {
      user?: {
        name?: string;
        blogs?: { name?: string; url?: string; primary?: boolean }[];
      };
    };
  };
  const blogs = j.response?.user?.blogs ?? [];
  const primaryBlog = blogs.find((blog) => blog.primary) ?? blogs[0];
  const blogIdentifier = primaryBlog?.url ?? primaryBlog?.name;
  if (!blogIdentifier) throw new Error("Tumblr account does not have a blog available for posting.");
  return {
    providerUserId: blogIdentifier.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    displayName: primaryBlog?.name ?? j.response?.user?.name,
  };
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
      : provider === "twitter"
        ? await fetchTwitterIdentity(tokens.access_token)
        : await fetchTumblrIdentity(tokens.access_token);

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

/** Returns a usable access token, transparently refreshing providers with refresh tokens. */
async function getValidAccessToken(conn: DbSocialConnection): Promise<string> {
  const stillValid =
    !conn.accessTokenExpiresAt ||
    conn.accessTokenExpiresAt.getTime() - Date.now() > 60_000;

  if (stillValid) return conn.accessToken;

  if ((conn.provider === "twitter" || conn.provider === "tumblr") && conn.refreshTokenEncrypted) {
    const refreshed =
      conn.provider === "twitter"
        ? await refreshTwitterToken(decrypt(conn.refreshTokenEncrypted))
        : await refreshTumblrToken(decrypt(conn.refreshTokenEncrypted));
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

const LINKEDIN_REST_VERSION = process.env.LINKEDIN_API_VERSION ?? "202606";

export interface PublishResult {
  providerPostId: string;
  url: string;
}

export interface PublishOptions {
  images?: PostImageAttachment[];
  imageDataUrl?: string;
  imageName?: string;
  imageMimeType?: string;
}

export type LinkedInReactionType =
  | "LIKE"
  | "PRAISE"
  | "EMPATHY"
  | "INTEREST"
  | "APPRECIATION"
  | "ENTERTAINMENT";

export interface LinkedInCommentResult {
  id: string;
  commentUrn?: string;
}

export interface LinkedInPostSummary {
  id: string;
  url: string;
  commentary?: string;
  publishedAt?: number;
  lastModifiedAt?: number;
  source?: "linkedin" | "lostbae";
}

export interface TwitterPostSummary {
  id: string;
  url: string;
  text: string;
  createdAt?: string;
  source?: "twitter" | "lostbae";
}

export interface TwitterDmEventSummary {
  id: string;
  eventType: string;
  text?: string;
  senderId?: string;
  conversationId?: string;
  createdAt?: string;
}

export interface TwitterDmSendResult {
  conversationId: string;
  eventId: string;
}

function linkedInRestHeaders(accessToken: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Linkedin-Version": LINKEDIN_REST_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function linkedInActor(conn: DbSocialConnection): string {
  return `urn:li:person:${conn.providerUserId}`;
}

async function readError(res: Response): Promise<string> {
  const text = await res.text();
  return text || `${res.status} ${res.statusText}`;
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Image attachment is not a valid data URL.");
  const mimeType = match[1];
  if (!mimeType.startsWith("image/")) throw new Error("Attachment must be an image.");
  const buffer = Buffer.from(match[2], "base64");
  return { buffer, mimeType, base64: match[2] };
}

async function uploadLinkedInImage(
  conn: DbSocialConnection,
  accessToken: string,
  imageDataUrl: string
): Promise<string> {
  const owner = linkedInActor(conn);
  const init = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: linkedInRestHeaders(accessToken, true),
    body: JSON.stringify({ initializeUploadRequest: { owner } }),
  });
  if (!init.ok) throw new Error(`LinkedIn image upload init failed: ${await readError(init)}`);

  const payload = (await init.json()) as {
    value?: { uploadUrl?: string; image?: string };
  };
  const uploadUrl = payload.value?.uploadUrl;
  const image = payload.value?.image;
  if (!uploadUrl || !image) throw new Error("LinkedIn did not return an image upload URL.");

  const { buffer, mimeType } = dataUrlToBuffer(imageDataUrl);
  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
    body: new Blob([new Uint8Array(buffer)], { type: mimeType }),
  });
  if (!upload.ok) throw new Error(`LinkedIn image upload failed: ${await readError(upload)}`);

  return image;
}

async function publishToLinkedIn(
  conn: DbSocialConnection,
  text: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  const accessToken = await getValidAccessToken(conn);
  const author = linkedInActor(conn);
  const image = options.imageDataUrl
    ? await uploadLinkedInImage(conn, accessToken, options.imageDataUrl)
    : undefined;
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: linkedInRestHeaders(accessToken, true),
    body: JSON.stringify({
      author,
      commentary: text,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      ...(image
        ? {
            content: {
              media: {
                id: image,
                title: options.imageName ?? "Image",
              },
            },
          }
        : {}),
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn publish failed: ${await readError(res)}`);
  }
  const id = res.headers.get("x-restli-id") ?? ((await res.json().catch(() => ({}))) as { id?: string }).id ?? "";
  const url = id
    ? `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}`
    : "https://www.linkedin.com/feed/";
  return { providerPostId: id, url };
}

async function publishToTwitter(
  conn: DbSocialConnection,
  text: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  const accessToken = await getValidAccessToken(conn);
  const images = options.images?.length
    ? options.images
    : options.imageDataUrl
      ? [{ imageDataUrl: options.imageDataUrl, imageName: options.imageName, imageMimeType: options.imageMimeType }]
      : [];
  if (images.length > 4) throw new Error("X posts support up to 4 image attachments.");
  const mediaIds = images.length
    ? await Promise.all(images.map((image) => uploadTwitterImage(accessToken, image)))
    : [];
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      ...(mediaIds.length ? { media: { media_ids: mediaIds } } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`X publish failed: ${await readError(res)}`);
  }
  const j = (await res.json()) as { data: { id: string } };
  const id = j.data.id;
  const handle = conn.displayName ?? "i";
  return { providerPostId: id, url: twitterPostUrl(handle, id) };
}

async function publishToTumblr(
  conn: DbSocialConnection,
  text: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  if (options.images?.length || options.imageDataUrl) {
    throw new Error("Tumblr image publishing is not wired yet; publish text posts from lostbae for now.");
  }
  const accessToken = await getValidAccessToken(conn);
  const blogIdentifier = conn.providerUserId;
  const res = await fetch(`https://api.tumblr.com/v2/blog/${encodeURIComponent(blogIdentifier)}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": "lostbae",
    },
    body: JSON.stringify({
      content: [{ type: "text", text }],
      state: "published",
    }),
  });
  if (!res.ok) {
    throw new Error(`Tumblr publish failed: ${await readError(res)}`);
  }
  const payload = (await res.json()) as {
    response?: { id_string?: string; id?: number; post_url?: string };
  };
  const id = payload.response?.id_string ?? String(payload.response?.id ?? "");
  return {
    providerPostId: id,
    url: payload.response?.post_url ?? `https://${blogIdentifier}/post/${id}`,
  };
}

export async function publish(
  conn: DbSocialConnection,
  text: string,
  options: PublishOptions = {}
): Promise<PublishResult> {
  if (conn.provider === "twitter" && text.length > 280) {
    throw new Error(`X posts are limited to 280 characters (yours is ${text.length}).`);
  }
  if (conn.provider === "linkedin") return publishToLinkedIn(conn, text, options);
  if (conn.provider === "twitter") return publishToTwitter(conn, text, options);
  return publishToTumblr(conn, text, options);
}

function twitterPostUrl(handle: string | undefined, id: string): string {
  return `https://twitter.com/${handle ?? "i"}/status/${id}`;
}

async function uploadTwitterImage(
  accessToken: string,
  image: PostImageAttachment
): Promise<string> {
  const { buffer, mimeType, base64 } = dataUrlToBuffer(image.imageDataUrl);
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error(`${image.imageName ?? "Image"} is over X's 5 MB image limit.`);
  }
  const res = await fetch("https://api.x.com/2/media/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      media: base64,
      media_category: "tweet_image",
      media_type: image.imageMimeType ?? mimeType,
    }),
  });
  if (!res.ok) throw new Error(`X media upload failed: ${await readError(res)}`);
  const payload = (await res.json()) as { data?: { id?: string } };
  if (!payload.data?.id) throw new Error("X did not return a media ID.");
  return payload.data.id;
}

export async function createTwitterReply(
  conn: DbSocialConnection,
  tweetId: string,
  text: string
): Promise<PublishResult> {
  const accessToken = await getValidAccessToken(conn);
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, reply: { in_reply_to_tweet_id: tweetId } }),
  });
  if (!res.ok) throw new Error(`X reply failed: ${await readError(res)}`);
  const j = (await res.json()) as { data: { id: string } };
  return { providerPostId: j.data.id, url: twitterPostUrl(conn.displayName, j.data.id) };
}

export async function deleteTwitterTweet(
  conn: DbSocialConnection,
  tweetId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(conn);
  const res = await fetch(`https://api.x.com/2/tweets/${encodeURIComponent(tweetId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`X delete failed: ${await readError(res)}`);
}

export async function listTwitterTweets(
  conn: DbSocialConnection,
  count = 20
): Promise<TwitterPostSummary[]> {
  const accessToken = await getValidAccessToken(conn);
  const params = new URLSearchParams({
    max_results: String(Math.min(Math.max(count, 5), 100)),
    "tweet.fields": "created_at",
  });
  const res = await fetch(
    `https://api.x.com/2/users/${encodeURIComponent(conn.providerUserId)}/tweets?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`X tweets lookup failed: ${await readError(res)}`);
  const payload = (await res.json()) as {
    data?: { id: string; text?: string; created_at?: string }[];
  };
  return (payload.data ?? []).map((tweet) => ({
    id: tweet.id,
    url: twitterPostUrl(conn.displayName, tweet.id),
    text: tweet.text ?? "",
    createdAt: tweet.created_at,
    source: "twitter",
  }));
}

export async function listTwitterDmEvents(
  conn: DbSocialConnection,
  count = 50
): Promise<TwitterDmEventSummary[]> {
  const accessToken = await getValidAccessToken(conn);
  const params = new URLSearchParams({
    max_results: String(Math.min(Math.max(count, 1), 100)),
    event_types: "MessageCreate",
    "dm_event.fields": "created_at,sender_id,text,dm_conversation_id",
  });
  const res = await fetch(`https://api.x.com/2/dm_events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`X DM lookup failed: ${await readError(res)}`);
  const payload = (await res.json()) as {
    data?: {
      id: string;
      event_type: string;
      text?: string;
      sender_id?: string;
      dm_conversation_id?: string;
      created_at?: string;
    }[];
  };
  return (payload.data ?? []).map((event) => ({
    id: event.id,
    eventType: event.event_type,
    text: event.text,
    senderId: event.sender_id,
    conversationId: event.dm_conversation_id,
    createdAt: event.created_at,
  }));
}

export async function sendTwitterDirectMessage(
  conn: DbSocialConnection,
  target: string,
  text: string,
  mode: "participant" | "conversation"
): Promise<TwitterDmSendResult> {
  const accessToken = await getValidAccessToken(conn);
  const path =
    mode === "participant"
      ? `/2/dm_conversations/with/${encodeURIComponent(target)}/messages`
      : `/2/dm_conversations/${encodeURIComponent(target)}/messages`;
  const res = await fetch(`https://api.x.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`X DM send failed: ${await readError(res)}`);
  const payload = (await res.json()) as {
    data?: { dm_conversation_id?: string; dm_event_id?: string };
  };
  if (!payload.data?.dm_conversation_id || !payload.data.dm_event_id) {
    throw new Error("X did not return DM confirmation IDs.");
  }
  return {
    conversationId: payload.data.dm_conversation_id,
    eventId: payload.data.dm_event_id,
  };
}

export async function deleteTwitterDirectMessage(
  conn: DbSocialConnection,
  eventId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(conn);
  const res = await fetch(`https://api.x.com/2/dm_events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`X DM delete failed: ${await readError(res)}`);
}

export async function listLinkedInPosts(
  conn: DbSocialConnection,
  count = 20
): Promise<LinkedInPostSummary[]> {
  const accessToken = await getValidAccessToken(conn);
  const author = linkedInActor(conn);
  const params = new URLSearchParams({
    author,
    q: "author",
    count: String(Math.min(Math.max(count, 1), 100)),
    sortBy: "LAST_MODIFIED",
    viewContext: "AUTHOR",
  });
  const res = await fetch(`https://api.linkedin.com/rest/posts?${params.toString()}`, {
    headers: {
      ...linkedInRestHeaders(accessToken),
      "X-RestLi-Method": "FINDER",
    },
  });
  if (!res.ok) throw new Error(`LinkedIn posts lookup failed: ${await readError(res)}`);

  const payload = (await res.json()) as {
    elements?: {
      id?: string;
      commentary?: string;
      publishedAt?: number;
      lastModifiedAt?: number;
    }[];
  };
  return (payload.elements ?? [])
    .filter((post) => Boolean(post.id))
    .map((post) => ({
      id: post.id!,
      url: `https://www.linkedin.com/feed/update/${encodeURIComponent(post.id!)}`,
      commentary: post.commentary,
      publishedAt: post.publishedAt,
      lastModifiedAt: post.lastModifiedAt,
      source: "linkedin",
    }));
}

export async function createLinkedInComment(
  conn: DbSocialConnection,
  targetUrn: string,
  text: string
): Promise<LinkedInCommentResult> {
  const accessToken = await getValidAccessToken(conn);
  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(targetUrn)}/comments`,
    {
      method: "POST",
      headers: linkedInRestHeaders(accessToken, true),
      body: JSON.stringify({
        actor: linkedInActor(conn),
        object: targetUrn,
        message: { text },
      }),
    }
  );
  if (!res.ok) throw new Error(`LinkedIn comment failed: ${await readError(res)}`);
  const body = (await res.json().catch(() => ({}))) as { id?: string; commentUrn?: string };
  return {
    id: res.headers.get("x-restli-id") ?? body.id ?? "",
    commentUrn: body.commentUrn,
  };
}

export async function editLinkedInComment(
  conn: DbSocialConnection,
  targetUrn: string,
  commentId: string,
  text: string
): Promise<void> {
  const accessToken = await getValidAccessToken(conn);
  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(targetUrn)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "POST",
      headers: {
        ...linkedInRestHeaders(accessToken, true),
        "X-RestLi-Method": "PARTIAL_UPDATE",
      },
      body: JSON.stringify({
        patch: { message: { $set: { text } } },
      }),
    }
  );
  if (!res.ok) throw new Error(`LinkedIn comment edit failed: ${await readError(res)}`);
}

export async function deleteLinkedInComment(
  conn: DbSocialConnection,
  targetUrn: string,
  commentId: string
): Promise<void> {
  const accessToken = await getValidAccessToken(conn);
  const res = await fetch(
    `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(targetUrn)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "DELETE",
      headers: linkedInRestHeaders(accessToken),
    }
  );
  if (!res.ok) throw new Error(`LinkedIn comment delete failed: ${await readError(res)}`);
}

export async function createLinkedInReaction(
  conn: DbSocialConnection,
  targetUrn: string,
  reactionType: LinkedInReactionType
): Promise<void> {
  const accessToken = await getValidAccessToken(conn);
  const actor = linkedInActor(conn);
  const res = await fetch(
    `https://api.linkedin.com/rest/reactions?actor=${encodeURIComponent(actor)}`,
    {
      method: "POST",
      headers: linkedInRestHeaders(accessToken, true),
      body: JSON.stringify({ root: targetUrn, reactionType }),
    }
  );
  if (!res.ok) throw new Error(`LinkedIn reaction failed: ${await readError(res)}`);
}

export async function deleteLinkedInReaction(
  conn: DbSocialConnection,
  targetUrn: string
): Promise<void> {
  const accessToken = await getValidAccessToken(conn);
  const actor = linkedInActor(conn);
  const id = `(actor:${encodeURIComponent(actor)},entity:${encodeURIComponent(targetUrn)})`;
  const res = await fetch(`https://api.linkedin.com/rest/reactions/${id}`, {
    method: "DELETE",
    headers: linkedInRestHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`LinkedIn reaction delete failed: ${await readError(res)}`);
}
