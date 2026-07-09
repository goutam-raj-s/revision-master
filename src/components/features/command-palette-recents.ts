"use client";

const RECENTS_KEY = "lostbae-recent-docs";

export function readRecentDocs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function pushRecentDoc(id: string) {
  if (typeof window === "undefined") return;
  const next = [id, ...readRecentDocs().filter((x) => x !== id)].slice(0, 6);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}
