import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function test() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const docs = await db.collection('documents').find().toArray();
  const reps = await db.collection('repetitions').find().toArray();
  console.log('Docs:', JSON.stringify(docs, null, 2));
  console.log('Reps:', JSON.stringify(reps, null, 2));
  process.exit(0);
}
test();
