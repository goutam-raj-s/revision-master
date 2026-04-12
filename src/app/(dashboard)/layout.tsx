import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/features/sidebar";
import { CommandPalette } from "@/components/features/command-palette";
import { getUserDocuments, getAllUserTags } from "@/actions/documents";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const [docs, tagData] = await Promise.all([
    getUserDocuments(),
    getAllUserTags(),
  ]);
  const tags = tagData.map((t) => t.tag);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-canvas">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
      <CommandPalette documents={docs} tags={tags} />
    </div>
  );
}
