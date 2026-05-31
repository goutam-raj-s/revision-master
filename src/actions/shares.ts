"use server";

import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/session";
import { generateToken } from "@/lib/crypto";
import {
  getDocumentsCollection,
  getDocumentSharesCollection,
  getShareByToken,
} from "@/lib/db/collections";
import { sendDocumentShareEmail } from "@/lib/email";
import type { ActionResult, DocumentShare } from "@/types";

function serializeShare(share: import("@/types").DbDocumentShare): DocumentShare {
  return {
    id: share._id.toString(),
    token: share.token,
    docId: share.docId.toString(),
    ownerId: share.ownerId.toString(),
    shareType: share.shareType,
    emails: share.emails,
    createdAt: share.createdAt.toISOString(),
  };
}

async function getRootDocId(docId: string, userId: string): Promise<ObjectId | null> {
  const docs = await getDocumentsCollection();
  const userObjectId = new ObjectId(userId);
  let currentId = new ObjectId(docId);
  let parentDocId: ObjectId | undefined;

  do {
    const found = await docs.findOne({ _id: currentId, userId: userObjectId });
    if (!found) return null;
    parentDocId = found.parentDocId;
    if (parentDocId) currentId = parentDocId;
  } while (parentDocId);

  return currentId;
}

export async function createShareAction(
  docId: string,
  shareType: "public" | "email",
  emails?: string[]
): Promise<ActionResult<{ token: string }>> {
  const user = await requireAuth();
  const rootDocId = await getRootDocId(docId, user.id);
  if (!rootDocId) return { success: false, error: "Document not found." };

  const shares = await getDocumentSharesCollection();

  // Reuse existing share token; still send emails if requested
  const existing = await shares.findOne({ docId: rootDocId, ownerId: new ObjectId(user.id) });
  if (existing) {
    if (shareType === "email" && emails && emails.length > 0) {
      const docs = await getDocumentsCollection();
      const rootDoc = await docs.findOne({ _id: rootDocId });
      const docTitle = rootDoc?.title ?? "a document";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
      const shareUrl = `${appUrl}/shared/${existing.token}`;
      await Promise.allSettled(
        emails.map((email) =>
          sendDocumentShareEmail(email, shareUrl, docTitle).catch((err) =>
            console.error("[createShareAction] email send failed:", err)
          )
        )
      );
    }
    return { success: true, data: { token: existing.token } };
  }

  const token = generateToken();
  await shares.insertOne({
    _id: new ObjectId(),
    token,
    docId: rootDocId,
    ownerId: new ObjectId(user.id),
    shareType,
    emails: emails && emails.length > 0 ? emails : undefined,
    createdAt: new Date(),
  });

  if (shareType === "email" && emails && emails.length > 0) {
    const docs = await getDocumentsCollection();
    const rootDoc = await docs.findOne({ _id: rootDocId });
    const docTitle = rootDoc?.title ?? "a document";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const shareUrl = `${appUrl}/shared/${token}`;

    await Promise.allSettled(
      emails.map((email) =>
        sendDocumentShareEmail(email, shareUrl, docTitle).catch((err) =>
          console.error("[createShareAction] email send failed:", err)
        )
      )
    );
  }

  return { success: true, data: { token } };
}

export async function revokeShareAction(token: string): Promise<ActionResult> {
  const user = await requireAuth();
  const shares = await getDocumentSharesCollection();
  const share = await getShareByToken(token);
  if (!share) return { success: false, error: "Share not found." };
  if (share.ownerId.toString() !== user.id) return { success: false, error: "Not authorized." };

  await shares.deleteOne({ token, ownerId: new ObjectId(user.id) });
  return { success: true };
}

export async function getDocShareAction(
  docId: string
): Promise<ActionResult<DocumentShare | null>> {
  const user = await requireAuth();
  const rootDocId = await getRootDocId(docId, user.id);
  if (!rootDocId) return { success: true, data: null };

  const shares = await getDocumentSharesCollection();
  const share = await shares.findOne({ docId: rootDocId, ownerId: new ObjectId(user.id) });
  return { success: true, data: share ? serializeShare(share) : null };
}
