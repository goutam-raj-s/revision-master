import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { Sidebar } from "@/components/features/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-canvas">
        <div className="max-w-screen-xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
