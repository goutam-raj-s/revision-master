"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { generateToken } from "@/lib/crypto";
import {
  getStatSharesCollection,
  getDocumentsCollection,
} from "@/lib/db/collections";
import { computeStreak, type StreakData } from "@/lib/streak";
import type { ActionResult } from "@/types";

/** Creates (or reuses) a public share token for the user's learning stats. */
export async function createStatShareAction(): Promise<ActionResult<{ token: string }>> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);
  const col = await getStatSharesCollection();

  const existing = await col.findOne({ userId });
  if (existing) return { success: true, data: { token: existing.token } };

  const token = generateToken();
  await col.insertOne({
    _id: new ObjectId(),
    token,
    userId,
    name: user.name,
    createdAt: new Date(),
  });
  return { success: true, data: { token } };
}

export interface PublicStats {
  name: string;
  streak: StreakData;
  totalDocs: number;
}

/** Public (no-auth) stats for a share token. */
export async function getPublicStatsByToken(token: string): Promise<PublicStats | null> {
  const col = await getStatSharesCollection();
  const share = await col.findOne({ token });
  if (!share) return null;

  const docs = await getDocumentsCollection();
  const [streak, totalDocs] = await Promise.all([
    computeStreak(share.userId),
    docs.countDocuments({ userId: share.userId, parentDocId: { $exists: false } }),
  ]);

  return { name: share.name, streak, totalDocs };
}
