import { cookies } from "next/headers";
import { cache } from "react";
import { ObjectId } from "mongodb";
import { generateToken } from "@/lib/crypto";
import { getSessionsCollection, getUserById, serializeUser } from "@/lib/db/collections";
import type { User } from "@/types";

const SESSION_COOKIE = "rm_session";
const SESSION_DURATION_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const sessions = await getSessionsCollection();
  await sessions.insertOne({
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    token,
    expiresAt,
    createdAt: new Date(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export const getSession = cache(async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessions = await getSessionsCollection();
  const session = await sessions.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  const user = await getUserById(session.userId.toString());
  if (!user) return null;

  return serializeUser(user);
});

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const sessions = await getSessionsCollection();
    await sessions.deleteOne({ token });
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  });
}

export async function requireAuth(): Promise<User> {
  const user = await getSession();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
