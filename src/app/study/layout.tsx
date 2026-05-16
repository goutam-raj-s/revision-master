import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/features/sidebar";
import { CommandPalette } from "@/components/features/command-palette";
import { AudioEngine } from "@/components/features/audio-engine";
import { MiniPlayer } from "@/components/features/mini-player";
import { ExpandedPlayer } from "@/components/features/expanded-player";
import { GlobalFAB } from "@/components/features/global-fab";
import { GlobalClipperWidget } from "@/components/features/global-clipper-widget";
import { getAllUserTags, getUserDocuments } from "@/actions/documents";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function StudyLayout({
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
        <main className="min-w-0 flex-1 overflow-hidden bg-canvas">
          {children}
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
