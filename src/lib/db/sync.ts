import { MongoClient, type Db, type Document as MongoDocument } from "mongodb";

const PRIMARY_URI = process.env.MONGODB_URI;
const BACKUP_URI = process.env.backup_db || process.env.BACKUP_DB;
const DB_NAME = "revision-master";

const SYNC_COLLECTIONS = [
  "users",
  "password_reset_tokens",
  "sessions",
  "documents",
  "playlists",
  "repetitions",
  "notes",
  "terms",
  "youtube_sessions",
  "youtube_bookmarks",
  "youtube_repetitions",
  "udemy_sessions",
  "login-records",
];

export interface CollectionSyncStats {
  collection: string;
  copiedToBackup: number;
  copiedToPrimary: number;
  conflictsResolved: number;
}

export interface DatabaseSyncResult {
  ok: boolean;
  dryRun: boolean;
  collections: CollectionSyncStats[];
  warning?: string;
}

function comparableTime(doc: MongoDocument): number {
  const updatedAt = doc.updatedAt;
  if (updatedAt instanceof Date) return updatedAt.getTime();
  if (typeof updatedAt === "string") return new Date(updatedAt).getTime();

  const createdAt = doc.createdAt;
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt === "string") return new Date(createdAt).getTime();

  const objectId = doc._id;
  if (objectId && typeof objectId === "object" && "getTimestamp" in objectId) {
    return objectId.getTimestamp().getTime();
  }

  return 0;
}

async function upsertDocument(
  db: Db,
  collectionName: string,
  doc: MongoDocument,
  dryRun: boolean
) {
  if (dryRun) return;
  await db.collection(collectionName).replaceOne(
    { _id: doc._id },
    doc,
    { upsert: true }
  );
}

async function syncCollection(
  collectionName: string,
  primaryDb: Db,
  backupDb: Db,
  dryRun: boolean
): Promise<CollectionSyncStats> {
  const primaryDocs = await primaryDb.collection(collectionName).find({}).toArray();
  const backupDocs = await backupDb.collection(collectionName).find({}).toArray();

  const primaryById = new Map(primaryDocs.map((doc) => [String(doc._id), doc]));
  const backupById = new Map(backupDocs.map((doc) => [String(doc._id), doc]));
  const allIds = new Set([...primaryById.keys(), ...backupById.keys()]);

  const stats: CollectionSyncStats = {
    collection: collectionName,
    copiedToBackup: 0,
    copiedToPrimary: 0,
    conflictsResolved: 0,
  };

  for (const id of allIds) {
    const primaryDoc = primaryById.get(id);
    const backupDoc = backupById.get(id);

    if (primaryDoc && !backupDoc) {
      await upsertDocument(backupDb, collectionName, primaryDoc, dryRun);
      stats.copiedToBackup += 1;
      continue;
    }

    if (!primaryDoc && backupDoc) {
      await upsertDocument(primaryDb, collectionName, backupDoc, dryRun);
      stats.copiedToPrimary += 1;
      continue;
    }

    if (!primaryDoc || !backupDoc) continue;

    const primaryTime = comparableTime(primaryDoc);
    const backupTime = comparableTime(backupDoc);

    if (primaryTime > backupTime) {
      await upsertDocument(backupDb, collectionName, primaryDoc, dryRun);
      stats.copiedToBackup += 1;
      stats.conflictsResolved += 1;
    } else if (backupTime > primaryTime) {
      await upsertDocument(primaryDb, collectionName, backupDoc, dryRun);
      stats.copiedToPrimary += 1;
      stats.conflictsResolved += 1;
    }
  }

  return stats;
}

export async function syncPrimaryAndBackupDatabases({
  dryRun = false,
}: {
  dryRun?: boolean;
} = {}): Promise<DatabaseSyncResult> {
  if (!PRIMARY_URI) {
    throw new Error("MONGODB_URI is missing.");
  }

  if (!BACKUP_URI) {
    return {
      ok: false,
      dryRun,
      collections: [],
      warning: "backup_db or BACKUP_DB is not configured.",
    };
  }

  if (PRIMARY_URI === BACKUP_URI) {
    return {
      ok: false,
      dryRun,
      collections: [],
      warning: "Primary and backup MongoDB URIs are identical.",
    };
  }

  const primaryClient = new MongoClient(PRIMARY_URI);
  const backupClient = new MongoClient(BACKUP_URI);

  try {
    await Promise.all([primaryClient.connect(), backupClient.connect()]);
    const primaryDb = primaryClient.db(DB_NAME);
    const backupDb = backupClient.db(DB_NAME);

    const collections: CollectionSyncStats[] = [];
    for (const collectionName of SYNC_COLLECTIONS) {
      collections.push(await syncCollection(collectionName, primaryDb, backupDb, dryRun));
    }

    return {
      ok: true,
      dryRun,
      collections,
      warning: "Deletes are not mirrored. Add tombstones before enabling delete sync.",
    };
  } finally {
    await Promise.allSettled([primaryClient.close(), backupClient.close()]);
  }
}
