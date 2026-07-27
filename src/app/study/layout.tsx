import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/features/sidebar";
import { CommandPalette } from "@/components/features/command-palette";
import { GlobalClipperWidget } from "@/components/features/global-clipper-widget";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ShortcutsHelp } from "@/components/features/shortcuts-help";
import { HiddenDocsController } from "@/components/features/hidden-docs-controller";

export default async function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} />
        <main className="min-w-0 flex-1 overflow-hidden bg-canvas">
          {children}
        </main>
        <CommandPalette />
        <HiddenDocsController />
        <ShortcutsHelp />
        <GlobalClipperWidget />
      </div>
    </TooltipProvider>
  );
}
