import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/features/sidebar";
import { CommandPalette } from "@/components/features/command-palette";
import { DashboardHeader } from "@/components/features/dashboard-header";
import { GlobalClipperWidget } from "@/components/features/global-clipper-widget";
import { getUserDocuments, getAllUserTags } from "@/actions/documents";
import { getAllTerms } from "@/actions/notes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShortcutsHelp } from "@/components/features/shortcuts-help";
import { PomodoroTimer } from "@/components/features/pomodoro-timer";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const [docs, tagData, terms] = await Promise.all([
    getUserDocuments(),
    getAllUserTags(),
    getAllTerms(),
  ]);
  const tags = tagData.map((t) => t.tag);
  const termItems = terms.map((t) => ({ id: t.id, term: t.term, docId: t.docId }));

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-canvas pb-16 flex flex-col">
          <DashboardHeader showLogo={true} />
          <div className="max-w-screen-2xl mx-auto px-3 py-3 sm:px-4 sm:py-5 md:px-8 md:py-8 w-full flex-1">
            {children}
          </div>
        </main>
        <CommandPalette documents={docs} tags={tags} terms={termItems} />
        <ShortcutsHelp />
        <PomodoroTimer />
        <GlobalClipperWidget />
      </div>
    </TooltipProvider>
  );
}
