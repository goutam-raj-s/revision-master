import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/collections";
import { SettingsClient } from "@/components/features/settings-client";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";

export const metadata = { title: "Settings — lostbae" };

export default async function SettingsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const dbUser = await getUserById(user.id);
  const maskedKey = dbUser?.geminiApiKeyEncrypted
    ? "****" + (dbUser.geminiApiKeyEncrypted.length > 8 ? dbUser.geminiApiKeyEncrypted.slice(-4) : "****")
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-forest-slate">Settings</h1>
        <p className="text-sm text-mossy-gray mt-1">Manage your account and API integrations</p>
      </div>
      <SettingsClient user={user} maskedGeminiKey={maskedKey} />
    </div>
  );
}
