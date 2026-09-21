"use client";

import {
  getOfflineSyncSnapshotAction,
} from "@/actions/offline-sync";
import {
  OFFLINE_SYNC_COLLECTIONS,
  type OfflineSyncCollection,
  type OfflineSyncRow,
  type OfflineSyncSnapshot,
} from "@/lib/offline/schema";

const DB_NAME = "lostbae-offline";
const DB_VERSION = 1;
const META_STORE = "meta";
const ENDPOINT_STORE = "endpointResponses";
const LAST_SYNC_KEY = "lastSync";
const DEFAULT_SYNC_INTERVAL_MS = 30 * 60 * 1000;

type MetaRow = { key: string; value: unknown; updatedAt: string };
type EndpointRow = { key: string; value: unknown; updatedAt: string };
export interface OfflineSyncStatus {
  syncedAt: string | null;
  user?: { id: string; name: string; email: string };
  totalRows: number;
  collections: Array<{ name: OfflineSyncCollection; count: number }>;
  endpointResponses: number;
}

let openPromise: Promise<IDBDatabase> | null = null;
let syncPromise: Promise<OfflineSyncSnapshot | null> | null = null;
const pendingMutationSyncReasons = new Set<string>();

function hasIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openOfflineDb(): Promise<IDBDatabase> {
  if (!hasIndexedDb()) return Promise.reject(new Error("IndexedDB is not available."));
  if (openPromise) return openPromise;

  openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open offline database."));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: "key" });
      if (!db.objectStoreNames.contains(ENDPOINT_STORE)) db.createObjectStore(ENDPOINT_STORE, { keyPath: "key" });
      for (const store of OFFLINE_SYNC_COLLECTIONS) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "id" });
      }
    };
  });

  return openPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("Offline transaction aborted."));
    tx.onerror = () => reject(tx.error ?? new Error("Offline transaction failed."));
  });
}

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Offline request failed."));
  });
}

async function putMeta(key: string, value: unknown) {
  const db = await openOfflineDb();
  const tx = db.transaction(META_STORE, "readwrite");
  tx.objectStore(META_STORE).put({ key, value, updatedAt: new Date().toISOString() } satisfies MetaRow);
  await txDone(tx);
}

async function putEndpoint(key: string, value: unknown, updatedAt: string) {
  const db = await openOfflineDb();
  const tx = db.transaction(ENDPOINT_STORE, "readwrite");
  tx.objectStore(ENDPOINT_STORE).put({ key, value, updatedAt } satisfies EndpointRow);
  await txDone(tx);
}

async function replaceStore(storeName: OfflineSyncCollection, rows: OfflineSyncRow[]) {
  const db = await openOfflineDb();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  store.clear();
  for (const row of rows) store.put(row);
  await txDone(tx);
}

export async function writeOfflineSnapshot(snapshot: OfflineSyncSnapshot) {
  await Promise.all(
    OFFLINE_SYNC_COLLECTIONS.map((store) => replaceStore(store, snapshot.collections[store]))
  );
  const endpointValue = {
    schemaVersion: snapshot.schemaVersion,
    syncedAt: snapshot.syncedAt,
    collections: snapshot.collections,
  };
  await Promise.all([
    putMeta(LAST_SYNC_KEY, { syncedAt: snapshot.syncedAt, user: snapshot.user }),
    putEndpoint("snapshot:all", endpointValue, snapshot.syncedAt),
    ...OFFLINE_SYNC_COLLECTIONS.map((store) =>
      putEndpoint(`${store}:all`, snapshot.collections[store], snapshot.syncedAt)
    ),
  ]);
}

export async function getLastOfflineSync(): Promise<string | null> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(META_STORE, "readonly");
    const row = await req<MetaRow | undefined>(tx.objectStore(META_STORE).get(LAST_SYNC_KEY));
    await txDone(tx);
    const value = row?.value as { syncedAt?: string } | undefined;
    return value?.syncedAt ?? null;
  } catch {
    return null;
  }
}

export async function getOfflineSyncStatus(): Promise<OfflineSyncStatus> {
  const db = await openOfflineDb();
  const tx = db.transaction([...OFFLINE_SYNC_COLLECTIONS, META_STORE, ENDPOINT_STORE], "readonly");
  const metaRow = await req<MetaRow | undefined>(tx.objectStore(META_STORE).get(LAST_SYNC_KEY));
  const collections = await Promise.all(
    OFFLINE_SYNC_COLLECTIONS.map(async (name) => ({
      name,
      count: await req<number>(tx.objectStore(name).count()),
    }))
  );
  const endpointResponses = await req<number>(tx.objectStore(ENDPOINT_STORE).count());
  await txDone(tx);
  const meta = metaRow?.value as { syncedAt?: string; user?: { id: string; name: string; email: string } } | undefined;
  return {
    syncedAt: meta?.syncedAt ?? null,
    user: meta?.user,
    totalRows: collections.reduce((sum, collection) => sum + collection.count, 0),
    collections,
    endpointResponses,
  };
}

export async function getOfflineRows<T = OfflineSyncRow>(storeName: OfflineSyncCollection): Promise<T[]> {
  const db = await openOfflineDb();
  const tx = db.transaction(storeName, "readonly");
  const rows = await req<T[]>(tx.objectStore(storeName).getAll());
  await txDone(tx);
  return rows;
}

export async function getOfflineEndpoint<T = unknown>(key: string): Promise<T | null> {
  const db = await openOfflineDb();
  const tx = db.transaction(ENDPOINT_STORE, "readonly");
  const row = await req<EndpointRow | undefined>(tx.objectStore(ENDPOINT_STORE).get(key));
  await txDone(tx);
  return (row?.value as T | undefined) ?? null;
}

export async function syncOfflineSnapshot(options?: {
  force?: boolean;
  minIntervalMs?: number;
}): Promise<OfflineSyncSnapshot | null> {
  if (!hasIndexedDb()) return null;
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const lastSync = await getLastOfflineSync();
    const interval = options?.minIntervalMs ?? DEFAULT_SYNC_INTERVAL_MS;
    if (!options?.force && lastSync && Date.now() - new Date(lastSync).getTime() < interval) {
      return null;
    }

    const result = await getOfflineSyncSnapshotAction();
    if (!result.success || !result.data) throw new Error(result.error ?? "Offline sync failed.");
    await writeOfflineSnapshot(result.data);
    pendingMutationSyncReasons.clear();
    return result.data;
  })();

  try {
    return await syncPromise;
  } finally {
    syncPromise = null;
  }
}

export function scheduleOfflineSync(options?: { force?: boolean; reason?: string; quiet?: boolean }) {
  if (!hasIndexedDb()) return;
  const run = () => {
    syncOfflineSnapshot({ force: options?.force })
      .then((snapshot) => {
        if (!options?.quiet && snapshot) window.dispatchEvent(new CustomEvent("lostbae:offline-sync-complete", { detail: snapshot }));
      })
      .catch((error) => {
        window.dispatchEvent(new CustomEvent("lostbae:offline-sync-error", { detail: error }));
      });
  };

  const schedule = window.requestIdleCallback
    ? () => window.requestIdleCallback(run, { timeout: 8000 })
    : () => window.setTimeout(run, 2000);
  schedule();
}

export function queueOfflineResync(reason: string) {
  pendingMutationSyncReasons.add(reason);
  window.setTimeout(() => scheduleOfflineSync({ force: true, reason, quiet: true }), 700);
}
