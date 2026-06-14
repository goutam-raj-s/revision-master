import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/features/sidebar";
import { CommandPalette } from "@/components/features/command-palette";
import { GlobalClipperWidget } from "@/components/features/global-clipper-widget";
import { getAllUserTags, getUserDocuments } from "@/actions/documents";
import { getTermSummariesAction } from "@/actions/notes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShortcutsHelp } from "@/components/features/shortcuts-help";

export default async function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const [docs, tagData, termItems] = await Promise.all([
    getUserDocuments(),
    getAllUserTags(),
    getTermSummariesAction(),
  ]);
  const tags = tagData.map((t) => t.tag);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <main className="min-w-0 flex-1 overflow-hidden bg-canvas">
          {children}
        </main>
        <CommandPalette documents={docs} tags={tags} terms={termItems} />
        <ShortcutsHelp />
        <GlobalClipperWidget />
      </div>
    </TooltipProvider>
  );
}
