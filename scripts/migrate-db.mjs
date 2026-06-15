// Copy ALL collections (documents + indexes) from one MongoDB database to
// another. Safe to re-run: inserts are unordered and duplicate-key errors are
// ignored, so existing docs in the target are kept.
//
// Usage:
//   TARGET_MONGODB_URI="mongodb+srv://user:pass@new-cluster.xxxx.mongodb.net" \
//   node scripts/migrate-db.mjs
//
// Optional env:
//   SOURCE_MONGODB_URI   defaults to MONGODB_URI from .env.local
//   SOURCE_DB            defaults to "revision-master"
//   TARGET_DB            defaults to SOURCE_DB
//   DROP_TARGET=1        wipe each target collection before copying
//   BATCH=1000           insert batch size

import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

// ── read MONGODB_URI from .env.local as the default source ──────────────────
function readEnvLocal(key) {
  try {
    const file = path.resolve(process.cwd(), ".env.local");
    const line = fs.readFileSync(file, "utf8").split("\n").find((l) => l.trim().startsWith(key + "="));
    if (!line) return undefined;
    return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

const SOURCE_URI = process.env.SOURCE_MONGODB_URI || readEnvLocal("MONGODB_URI");
const TARGET_URI = process.env.TARGET_MONGODB_URI;
const SOURCE_DB = process.env.SOURCE_DB || "revision-master";
const TARGET_DB = process.env.TARGET_DB || SOURCE_DB;
const DROP_TARGET = process.env.DROP_TARGET === "1";
const BATCH = Number(process.env.BATCH || 1000);

function mask(uri) {
  return uri ? uri.replace(/\/\/([^:]+):[^@]+@/, "//$1:****@") : "(none)";
}

if (!SOURCE_URI) {
  console.error("✖ No source URI. Set SOURCE_MONGODB_URI or MONGODB_URI in .env.local");
  process.exit(1);
}
if (!TARGET_URI) {
  console.error("✖ No target URI. Set TARGET_MONGODB_URI=...");
  process.exit(1);
}

const opts = { serverSelectionTimeoutMS: 20000 };

async function main() {
  console.log("Source:", mask(SOURCE_URI), "→ db:", SOURCE_DB);
  console.log("Target:", mask(TARGET_URI), "→ db:", TARGET_DB);
  console.log(DROP_TARGET ? "Mode: DROP target collections first" : "Mode: merge (keep existing)");
  console.log("");

  const src = new MongoClient(SOURCE_URI, opts);
  const dst = new MongoClient(TARGET_URI, opts);
  await src.connect();
  await dst.connect();
  console.log("✓ connected to both clusters\n");

  const srcDb = src.db(SOURCE_DB);
  const dstDb = dst.db(TARGET_DB);

  const collections = (await srcDb.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));

  let grandTotal = 0;
  for (const name of collections) {
    const srcCol = srcDb.collection(name);
    const dstCol = dstDb.collection(name);
    const total = await srcCol.estimatedDocumentCount();

    if (DROP_TARGET) {
      await dstCol.drop().catch(() => {});
    }

    let copied = 0;
    let batch = [];
    const cursor = srcCol.find({});
    for await (const doc of cursor) {
      batch.push(doc);
      if (batch.length >= BATCH) {
        copied += await flush(dstCol, batch);
        batch = [];
        process.stdout.write(`\r  ${name}: ${copied}/${total}`);
      }
    }
    if (batch.length) copied += await flush(dstCol, batch);

    // Copy indexes (skip the implicit _id index).
    try {
      const indexes = await srcCol.indexes();
      for (const idx of indexes) {
        if (idx.name === "_id_") continue;
        const { key, name: iname, v, ns, background, ...options } = idx;
        await dstCol.createIndex(key, { name: iname, ...options }).catch(() => {});
      }
    } catch {
      /* index copy is best-effort */
    }

    grandTotal += copied;
    console.log(`\r  ${name}: ${copied}/${total} ✓        `);
  }

  console.log(`\n✓ Done. Copied ${grandTotal} documents across ${collections.length} collections.`);
  await src.close();
  await dst.close();
}

async function flush(col, docs) {
  try {
    const res = await col.insertMany(docs, { ordered: false });
    return res.insertedCount;
  } catch (e) {
    // Unordered insert: duplicate-key errors are expected on re-runs.
    if (e?.result?.insertedCount != null) return e.result.insertedCount;
    if (e?.writeErrors) return docs.length - e.writeErrors.length;
    throw e;
  }
}

main().catch((e) => {
  console.error("\n✖ Migration failed:", e.message);
  process.exit(1);
});
