import { existsSync, readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { maskApiKey } from "@/lib/crypto";
import type { ProviderId } from "@/lib/ai";

export const AI_CONFIG_ADMINS = new Set([
  "gautamkumarpandey@2526.com",
  "gautamguddu577@gmail.com",
]);

const CONFIG_PATH = path.join(process.cwd(), "config.json");

const DEFAULT_MODELS: Record<ProviderId, string> = {
  openrouter: "meta-llama/llama-3.3-70b-instruct:free",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
};

export interface AiProviderSettings {
  model?: string;
  apiKeys?: string[];
}

export interface AppConfig {
  ai?: Partial<Record<ProviderId, AiProviderSettings>>;
}

export interface MaskedAiProviderSettings {
  id: ProviderId;
  label: string;
  model: string;
  maskedKeys: string[];
  source: "config" | "env" | "empty";
}

function usableApiKey(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 10 && !value.trim().startsWith("your-"));
}

function normalizeKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  return Array.from(new Set(keys.map((key) => String(key).trim()).filter(usableApiKey)));
}

export function readAppConfig(): AppConfig {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as AppConfig;
  } catch {
    return {};
  }
}

export function envKeys(baseName: string): string[] {
  const values = [
    process.env[baseName],
    ...(process.env[`${baseName}S`]?.split(",") ?? []),
    ...Array.from({ length: 10 }, (_, index) => process.env[`${baseName}_${index + 1}`]),
  ];
  return Array.from(new Set(values.map((value) => value?.trim()).filter(usableApiKey)));
}

export function getAiProviderRuntime(providerId: ProviderId, envName: string, envModelName: string) {
  const configProvider = readAppConfig().ai?.[providerId];
  const configKeys = normalizeKeys(configProvider?.apiKeys);
  return {
    apiKeys: configKeys.length > 0 ? configKeys : envKeys(envName),
    model: configProvider?.model?.trim() || process.env[envModelName] || DEFAULT_MODELS[providerId],
  };
}

export function getMaskedAiProviderSettings(): MaskedAiProviderSettings[] {
  const config = readAppConfig();
  const providers: Array<{ id: ProviderId; label: string; envName: string; envModelName: string }> = [
    { id: "openrouter", label: "OpenRouter", envName: "OPENROUTER_API_KEY", envModelName: "OPENROUTER_MODEL" },
    { id: "groq", label: "Groq", envName: "GROQ_API_KEY", envModelName: "GROQ_MODEL" },
    { id: "gemini", label: "Gemini", envName: "GEMINI_API_KEY", envModelName: "GEMINI_MODEL" },
  ];

  return providers.map((provider) => {
    const configProvider = config.ai?.[provider.id];
    const configKeys = normalizeKeys(configProvider?.apiKeys);
    const fallbackEnvKeys = envKeys(provider.envName);
    const activeKeys = configKeys.length > 0 ? configKeys : fallbackEnvKeys;
    return {
      id: provider.id,
      label: provider.label,
      model: configProvider?.model?.trim() || process.env[provider.envModelName] || DEFAULT_MODELS[provider.id],
      maskedKeys: activeKeys.map(maskApiKey),
      source: configKeys.length > 0 ? "config" : fallbackEnvKeys.length > 0 ? "env" : "empty",
    };
  });
}

export async function writeAiProviderSettings(
  nextProviders: Partial<Record<ProviderId, AiProviderSettings>>
) {
  const current = readAppConfig();
  const next: AppConfig = { ...current, ai: { ...(current.ai ?? {}) } };

  for (const providerId of Object.keys(nextProviders) as ProviderId[]) {
    const provider = nextProviders[providerId];
    if (!provider) continue;
    next.ai![providerId] = {
      model: provider.model?.trim() || DEFAULT_MODELS[providerId],
      apiKeys: normalizeKeys(provider.apiKeys),
    };
  }

  await mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
}

export function canManageAiProviderConfig(email: string) {
  return AI_CONFIG_ADMINS.has(email.toLowerCase());
}
