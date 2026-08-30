import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "revision-master";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}
const mongoUri = MONGODB_URI;

const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const promise = new MongoClient(mongoUri, options).connect();
  promise.catch(() => {
    if (global._mongoClientPromise === promise) {
      global._mongoClientPromise = undefined;
    }
  });
  return promise;
}

async function getClient(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connect();
  }

  try {
    return await global._mongoClientPromise;
  } catch {
    global._mongoClientPromise = connect();
    return global._mongoClientPromise;
  }
}

const clientPromise: Promise<MongoClient> = getClient();

export async function getDb(): Promise<Db> {
  const c = await getClient();
  return c.db(DB_NAME);
}

export default clientPromise;
