import { NextResponse } from "next/server";
import { syncPrimaryAndBackupDatabases } from "@/lib/db/sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = url.searchParams.get("dryRun") === "1";
  const result = await syncPrimaryAndBackupDatabases({ dryRun });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET(request: Request) {
  return POST(request);
}
