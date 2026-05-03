"use server";

import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword, encrypt, decrypt, maskApiKey } from "@/lib/crypto";
import { createSession, destroySession, requireAuth } from "@/lib/auth/session";
import {
  getUsersCollection,
  getUserByEmail,
  getPasswordResetTokensCollection,
  serializeUser,
} from "@/lib/db/collections";
import { sendPasswordResetEmail } from "@/lib/email";
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

export async function forgotPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  console.log("=== FORGOT PASSWORD ACTION TRIGGERED ===", email);

  if (!email) {
    return { success: true }; // always generic
  }

  try {
    const user = await getUserByEmail(email);
    console.log("USER FOUND IN DB:", user ? "Yes" : "No");
    if (user) {
      console.log("USER PROVIDER:", user.provider);
      console.log("HAS PASSWORD HASH:", !!user.passwordHash);
    }

    // Only send email for email/password accounts (not OAuth-only)
    if (user && (!user.provider || user.provider === "email") && user.passwordHash) {
      console.log("CONDITIONS MET! GENERATING TOKEN...");
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const tokens = await getPasswordResetTokensCollection();
      await tokens.insertOne({
        _id: new ObjectId(),
        userId: user._id,
        token,
        expiresAt,
        createdAt: new Date(),
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      console.log("reached just before sending email")
      await sendPasswordResetEmail(user.email, resetUrl);
      console.log("sent email successfully")
    }
  } catch (error) {
    console.error("Forgot password email error:", error);
    // Swallow errors — never reveal anything
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const token = (formData.get("token") as string)?.trim();
  const newPassword = (formData.get("newPassword") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  if (!token) {
    return { success: false, error: "Invalid reset link." };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const tokens = await getPasswordResetTokensCollection();
  const record = await tokens.findOne({ token, expiresAt: { $gt: new Date() } });

  if (!record) {
    return { success: false, error: "expired" };
  }

  // Delete token immediately to prevent reuse, even if password update fails
  await tokens.deleteOne({ _id: record._id });

  const passwordHash = await hashPassword(newPassword);
  const users = await getUsersCollection();
  await users.updateOne(
    { _id: record.userId },
    { $set: { passwordHash, updatedAt: new Date() } }
  );

  return { success: true };
}
