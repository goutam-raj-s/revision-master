import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "revision-master";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Cache the connection promise on globalThis in EVERY environment.
//
// On Vercel a "warm" serverless function reuses this module scope across many
// invocations. Caching the single connect() promise here means those reuse one
// pooled connection instead of opening a fresh pool on each request — which is
// what exhausts the Atlas connection limit and causes the intermittent
// "An error occurred in the Server Components render" failures.
if (!global._mongoClientPromise) {
  global._mongoClientPromise = new MongoClient(MONGODB_URI, options).connect();
}
const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db(DB_NAME);
}

export default clientPromise;
