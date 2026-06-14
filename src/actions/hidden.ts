"use server";

import { cookies } from "next/headers";
import { REVEAL_COOKIE } from "@/lib/hidden";

/**
 * Toggle the session "reveal hidden documents" flag. Stored as a session
 * cookie (no max-age) so it resets when the browser/app fully closes — hidden
 * docs are never revealed by default.
 */
export async function toggleHiddenRevealAction(): Promise<{ revealed: boolean }> {
  const store = await cookies();
  const next = store.get(REVEAL_COOKIE)?.value !== "1";
  if (next) {
    store.set(REVEAL_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  } else {
    store.set(REVEAL_COOKIE, "", { maxAge: 0, path: "/" });
  }
  return { revealed: next };
}

export async function getHiddenRevealAction(): Promise<boolean> {
  const store = await cookies();
  return store.get(REVEAL_COOKIE)?.value === "1";
}
