"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { requireAuth, destroySession } from "@/lib/auth/session";
import {
  getUsersCollection,
  getSessionsCollection,
  getDocumentsCollection,
  getRepetitionsCollection,
  getNotesCollection,
  getTermsCollection,
  getPasswordResetTokensCollection,
  getLoginRecordsCollection,
  getReviewEventsCollection,
  getYoutubeSessionsCollection,
  getYoutubeBookmarksCollection,
  getYoutubePlaylistsCollection,
  getYoutubeRepetitionsCollection,
  getDocumentSharesCollection,
  getYoutubeSharesCollection,
  getGoogleIntegrationsCollection,
} from "@/lib/db/collections";
import type { ActionResult } from "@/types";

/**
 * GDPR right-to-erasure: permanently deletes the user and every record
 * they own across all collections, then destroys the session.
 */
export async function deleteAccountAction(confirmEmail: string): Promise<ActionResult> {
  const user = await requireAuth();

  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, error: "Email confirmation does not match your account." };
  }

  const userId = new ObjectId(user.id);

  await Promise.all([
    (await getDocumentsCollection()).deleteMany({ userId }),
    (await getRepetitionsCollection()).deleteMany({ userId }),
    (await getNotesCollection()).deleteMany({ userId }),
    (await getTermsCollection()).deleteMany({ userId }),
    (await getYoutubeSessionsCollection()).deleteMany({ userId }),
    (await getYoutubeBookmarksCollection()).deleteMany({ userId }),
    (await getYoutubePlaylistsCollection()).deleteMany({ userId }),
    (await getYoutubeRepetitionsCollection()).deleteMany({ userId }),
    (await getDocumentSharesCollection()).deleteMany({ userId }),
    (await getYoutubeSharesCollection()).deleteMany({ userId }),
    (await getGoogleIntegrationsCollection()).deleteMany({ userId }),
    (await getPasswordResetTokensCollection()).deleteMany({ userId }),
    (await getLoginRecordsCollection()).deleteMany({ userId }),
    (await getReviewEventsCollection()).deleteMany({ userId }),
    (await getSessionsCollection()).deleteMany({ userId }),
  ]);

  await (await getUsersCollection()).deleteOne({ _id: userId });
  await destroySession();
  redirect("/");
}

export async function setEmailRemindersAction(enabled: boolean): Promise<ActionResult> {
  const user = await requireAuth();
  await (await getUsersCollection()).updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { emailReminders: enabled, updatedAt: new Date() } }
  );
  return { success: true };
}

export interface AccountExport {
  exportedAt: string;
  user: { name: string; email: string };
  documents: unknown[];
  notes: unknown[];
  terms: unknown[];
  repetitions: unknown[];
  youtubeSessions: unknown[];
  youtubeBookmarks: unknown[];
  youtubePlaylists: unknown[];
}

/**
 * Returns all user-owned data as a JSON-serializable object for download.
 * ObjectIds/Dates are stringified; encrypted secrets are excluded.
 */
export async function exportAccountDataAction(): Promise<ActionResult<AccountExport>> {
  const user = await requireAuth();
  const userId = new ObjectId(user.id);

  function clean(rows: Record<string, unknown>[]): unknown[] {
    return rows.map((r) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        if (k === "userId") continue;
        if (v instanceof ObjectId) out[k] = v.toString();
        else if (v instanceof Date) out[k] = v.toISOString();
        else out[k] = v;
      }
      return out;
    });
  }

  const [docs, notes, terms, reps, ytSessions, ytBookmarks, ytPlaylists] = await Promise.all([
    (await getDocumentsCollection()).find({ userId }).toArray(),
    (await getNotesCollection()).find({ userId }).toArray(),
    (await getTermsCollection()).find({ userId }).toArray(),
    (await getRepetitionsCollection()).find({ userId }).toArray(),
    (await getYoutubeSessionsCollection()).find({ userId }).toArray(),
    (await getYoutubeBookmarksCollection()).find({ userId }).toArray(),
    (await getYoutubePlaylistsCollection()).find({ userId }).toArray(),
  ]);

  return {
    success: true,
    data: {
      exportedAt: new Date().toISOString(),
      user: { name: user.name, email: user.email },
      documents: clean(docs as unknown as Record<string, unknown>[]),
      notes: clean(notes as unknown as Record<string, unknown>[]),
      terms: clean(terms as unknown as Record<string, unknown>[]),
      repetitions: clean(reps as unknown as Record<string, unknown>[]),
      youtubeSessions: clean(ytSessions as unknown as Record<string, unknown>[]),
      youtubeBookmarks: clean(ytBookmarks as unknown as Record<string, unknown>[]),
      youtubePlaylists: clean(ytPlaylists as unknown as Record<string, unknown>[]),
    },
  };
}
