import { CheckSquare } from "lucide-react";
import { TasksClient } from "@/components/features/tasks-client";

interface TasksPageProps {
  searchParams: Promise<{ tag?: string; search?: string; status?: string; showCollections?: string }>;
}

export const metadata = { title: "Tasks — lostbae" };

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const showCollectionItems = params.showCollections !== "0";
  const status = params.status === "all" ? "all" : params.status ?? "pending";

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-state-today" />
            <h1 className="text-xl font-bold text-forest-slate sm:text-2xl">Tasks</h1>
          </div>
          <p className="mt-0.5 text-xs text-mossy-gray sm:text-sm">
            Lightweight pending work without creating a full document.
          </p>
        </div>
      </div>

      <TasksClient
        initialTasks={[]}
        allTags={[]}
        initialTagFilter={params.tag}
        initialSearch={params.search}
        initialStatus={status}
        showCollectionItems={showCollectionItems}
        preferOffline
      />
    </div>
  );
}
