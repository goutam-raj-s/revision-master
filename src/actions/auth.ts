"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword, encrypt, decrypt, maskApiKey } from "@/lib/crypto";
import { createSession, destroySession, requireAuth } from "@/lib/auth/session";
import {
  getUsersCollection,
  getUserByEmail,
  serializeUser,
} from "@/lib/db/collections";
import type { ActionResult, User } from "@/types";

const RegisterSchema = z.object({
  name: z.string().min(2).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerAction(
  _prev: ActionResult<{ redirectTo: string }>,
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;
  const existing = await getUserByEmail(email);
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const users = await getUsersCollection();
  const result = await users.insertOne({
    _id: new ObjectId(),
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await createSession(result.insertedId.toString());
  return { success: true, data: { redirectTo: "/dashboard" } };
}

export async function loginAction(
  _prev: ActionResult<{ redirectTo: string }>,
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid email or password format." };
  }

  const { email, password } = parsed.data;
  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password." };
  }

  await createSession(user._id.toString());
  return { success: true, data: { redirectTo: "/dashboard" } };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 2) {
    return { success: false, error: "Name must be at least 2 characters." };
  }

  const users = await getUsersCollection();
  await users.updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { name, updatedAt: new Date() } }
  );
  revalidatePath("/settings");
  return { success: true };
}

const GeminiKeySchema = z.object({
  apiKey: z.string().min(10).max(200),
});

export async function saveGeminiKeyAction(
  _prev: ActionResult<{ maskedKey: string }>,
  formData: FormData
): Promise<ActionResult<{ maskedKey: string }>> {
  const user = await requireAuth();
  const raw = { apiKey: formData.get("apiKey") };
  const parsed = GeminiKeySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid API key format." };
  }

  const encrypted = encrypt(parsed.data.apiKey);
  const users = await getUsersCollection();
  await users.updateOne(
    { _id: new ObjectId(user.id) },
    { $set: { geminiApiKeyEncrypted: encrypted, updatedAt: new Date() } }
  );
  revalidatePath("/settings");
  return { success: true, data: { maskedKey: maskApiKey(parsed.data.apiKey) } };
}

export async function deleteGeminiKeyAction(): Promise<ActionResult> {
  const user = await requireAuth();
  const users = await getUsersCollection();
  await users.updateOne(
    { _id: new ObjectId(user.id) },
    { $unset: { geminiApiKeyEncrypted: "" }, $set: { updatedAt: new Date() } }
  );
  revalidatePath("/settings");
  return { success: true };
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const user = await requireAuth();
    return user;
  } catch {
    return null;
  }
}
