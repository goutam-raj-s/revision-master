"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import {
  canManageAiProviderConfig,
  getMaskedAiProviderSettings,
  writeAiProviderSettings,
  type MaskedAiProviderSettings,
} from "@/lib/config/ai-provider-config";
import type { ActionResult } from "@/types";

const ProviderSchema = z.enum(["openrouter", "groq", "gemini"]);

const AiProviderConfigSchema = z.object({
  providerId: ProviderSchema,
  model: z.string().trim().min(1).max(180),
  apiKeys: z.string().max(8000),
});

function parseKeys(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

async function requireAiConfigAdmin() {
  const user = await requireAuth();
  if (!canManageAiProviderConfig(user.email)) {
    throw new Error("You are not allowed to manage AI provider keys.");
  }
  return user;
}

export async function getAiProviderConfigAction(): Promise<ActionResult<{
  providers: MaskedAiProviderSettings[];
}>> {
  try {
    await requireAiConfigAdmin();
    return { success: true, data: { providers: getMaskedAiProviderSettings() } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Not allowed." };
  }
}

export async function updateAiProviderConfigAction(
  _prev: ActionResult<{ providers: MaskedAiProviderSettings[] }>,
  formData: FormData
): Promise<ActionResult<{ providers: MaskedAiProviderSettings[] }>> {
  try {
    await requireAiConfigAdmin();
    const parsed = AiProviderConfigSchema.safeParse({
      providerId: formData.get("providerId"),
      model: formData.get("model"),
      apiKeys: formData.get("apiKeys"),
    });
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    const apiKeys = parseKeys(parsed.data.apiKeys);
    if (apiKeys.length === 0) return { success: false, error: "Add at least one API key." };

    await writeAiProviderSettings({
      [parsed.data.providerId]: {
        model: parsed.data.model,
        apiKeys,
      },
    });
    revalidatePath("/settings");
    return { success: true, data: { providers: getMaskedAiProviderSettings() } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update AI provider keys.",
    };
  }
}
