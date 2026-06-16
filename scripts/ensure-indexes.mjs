// Create the indexes the app's queries rely on. Without these, every query is
// a full collection scan + in-memory sort, which is what made the dashboard
// take ~78s for accounts with more data. Indexes live on the cluster, so this
// fixes production immediately — no redeploy required.
//
// Run:  node scripts/ensure-indexes.mjs
// Reads MONGODB_URI from .env.local (or process.env). Safe to re-run.

import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

function readEnvLocal(key) {
  try {
    const file = path.resolve(process.cwd(), ".env.local");
    const line = fs.readFileSync(file, "utf8").split("\n").find((l) => l.trim().startsWith(key + "="));
    return line ? line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") : undefined;
  } catch {
    return undefined;
  }
}

const URI = process.env.MONGODB_URI || readEnvLocal("MONGODB_URI");
const DB = process.env.SOURCE_DB || "revision-master";
if (!URI) { console.error("✖ No MONGODB_URI"); process.exit(1); }

// collection -> [ [keys, options?], ... ]
const INDEXES = {
  users: [[{ email: 1 }, { unique: true }]],
  sessions: [[{ token: 1 }], [{ expiresAt: 1 }], [{ userId: 1 }]],
  documents: [
    [{ userId: 1, createdAt: -1 }],
    [{ userId: 1, parentDocId: 1 }],
    [{ userId: 1, status: 1 }],
    [{ parentDocId: 1 }],
  ],
  repetitions: [[{ userId: 1, nextReviewDate: 1 }], [{ docId: 1 }]],
  youtube_repetitions: [[{ userId: 1, nextReviewDate: 1 }], [{ docId: 1 }]],
  notes: [[{ docId: 1, createdAt: -1 }], [{ userId: 1 }]],
  terms: [[{ userId: 1, term: 1 }], [{ docId: 1 }]],
  review_events: [[{ userId: 1, reviewedAt: -1 }]],
  youtube_sessions: [[{ userId: 1, videoId: 1 }], [{ userId: 1 }]],
  youtube_bookmarks: [[{ userId: 1 }]],
  youtube_playlists: [[{ userId: 1 }]],
  topic_collections: [[{ userId: 1, updatedAt: -1 }], [{ publicToken: 1 }]],
  post_drafts: [[{ userId: 1, updatedAt: -1 }]],
  social_connections: [[{ userId: 1, provider: 1 }]],
  ai_chats: [[{ userId: 1, contextKind: 1, contextId: 1 }]],
  document_shares: [[{ token: 1 }], [{ docId: 1 }]],
  stat_shares: [[{ token: 1 }], [{ userId: 1 }]],
  google_integrations: [[{ userId: 1, provider: 1 }]],
  password_reset_tokens: [[{ token: 1 }], [{ expiresAt: 1 }]],
  "login-records": [[{ userId: 1, createdAt: -1 }]],
};

const c = new MongoClient(URI, { serverSelectionTimeoutMS: 20000 });
(async () => {
  await c.connect();
  console.log("Connected to", URI.replace(/\/\/[^@]*@/, "//****@").split("?")[0], "\n");
  const db = c.db(DB);
  let created = 0;
  for (const [col, specs] of Object.entries(INDEXES)) {
    for (const [keys, options = {}] of specs) {
      try {
        const name = await db.collection(col).createIndex(keys, options);
        console.log(`  ✓ ${col}: ${name}`);
        created++;
      } catch (e) {
        console.log(`  ✖ ${col}: ${JSON.stringify(keys)} -> ${e.message.split("\n")[0]}`);
      }
    }
  }
  console.log(`\n✓ Done. ${created} indexes ensured.`);
  await c.close();
})().catch((e) => { console.error("✖", e.message); process.exit(1); });
