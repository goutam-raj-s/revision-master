import { cookies } from "next/headers";

/** Session cookie that, when present, reveals hidden ("private") documents. */
export const REVEAL_COOKIE = "rm_reveal";

/** True when the current request should include hidden documents. */
export async function hiddenRevealed(): Promise<boolean> {
  const store = await cookies();
  return store.get(REVEAL_COOKIE)?.value === "1";
}
