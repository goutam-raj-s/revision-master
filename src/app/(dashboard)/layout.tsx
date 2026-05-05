import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/features/sidebar";
import { CommandPalette } from "@/components/features/command-palette";
import { AudioEngine } from "@/components/features/audio-engine";
import { MiniPlayer } from "@/components/features/mini-player";
import { ExpandedPlayer } from "@/components/features/expanded-player";
import { DashboardHeader } from "@/components/features/dashboard-header";
import { GlobalFAB } from "@/components/features/global-fab";
import { GlobalClipperWidget } from "@/components/features/global-clipper-widget";
import { getUserDocuments, getAllUserTags } from "@/actions/documents";
import { TooltipProvider } from "@/components/ui/tooltip";


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
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-canvas pb-16 flex flex-col">
          <DashboardHeader showLogo={true} />
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 md:py-8 w-full flex-1">
            {children}
          </div>
        </main>
        <CommandPalette documents={docs} tags={tags} />
        <GlobalFAB />
        <GlobalClipperWidget />
        <AudioEngine />
        <MiniPlayer />
        <ExpandedPlayer />
      </div>
    </TooltipProvider>
  );
}
