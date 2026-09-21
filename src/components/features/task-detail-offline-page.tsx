"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getTaskByIdAction } from "@/actions/tasks";
import { TaskDetailClient } from "@/components/features/task-detail-client";
import { getOfflineTaskById } from "@/lib/offline/read-models";
import type { LightweightTask } from "@/types";

export function TaskDetailOfflinePage({ taskId }: { taskId: string }) {
  const [task, setTask] = React.useState<LightweightTask | null>(null);
  const [source, setSource] = React.useState<"loading" | "indexeddb" | "server" | "missing">("loading");

  React.useEffect(() => {
    let cancelled = false;
    window.setTimeout(async () => {
      try {
        const local = await getOfflineTaskById(taskId);
        if (!cancelled && local.task) {
          setTask(local.task);
          setSource("indexeddb");
          return;
        }
        if (!cancelled && local.hasLocalData) {
          setSource("missing");
          return;
        }
      } catch {
        // Fall through to backend.
      }

      const serverTask = await getTaskByIdAction(taskId);
      if (!cancelled) {
        setTask(serverTask);
        setSource(serverTask ? "server" : "missing");
      }
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (source === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-mossy-gray">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="mt-3 text-sm">Checking local task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-mossy-gray transition-colors hover:text-forest-slate">
          <ArrowLeft className="h-3.5 w-3.5" /> Tasks
        </Link>
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm text-mossy-gray">Task not found in local data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {source === "indexeddb" && <p className="text-xs text-state-today">Loaded from IndexedDB</p>}
      <TaskDetailClient task={task} />
    </div>
  );
}
