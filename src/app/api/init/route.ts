import { NextResponse } from "next/server";
import { ensureIndexes } from "@/lib/db/collections";

// Called once during deployment to set up indexes
// Protected by a secret token
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureIndexes();
  return NextResponse.json({ ok: true, message: "Indexes created" });
}
