"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LightweightTaskRow, TaskRow, YoutubeTaskRow } from "./task-row";
import { GlassModal } from "./glass-modal";
import { InboxZero } from "./inbox-zero";
import { completeReviewAction, deleteDocumentAction, rescheduleDocAction } from "@/actions/documents";
import { rescheduleYoutubeAction, markYoutubeCompletedAction } from "@/actions/youtube";
import { completeTaskAction, rescheduleTaskAction } from "@/actions/tasks";
import { toast } from "@/components/ui/toast";
import type { TaskItem, TaskFilter } from "@/types";
import type { AnyTaskItem } from "@/actions/queue";

interface TaskQueueProps {
  initialTasks: AnyTaskItem[];
  filter: TaskFilter;
  streak?: number;
}

function getTaskId(task: AnyTaskItem): string {
  if ("source" in task && task.source === "youtube") {
    return `yt-${task.session.id}`;
  }
  if ("source" in task && task.source === "task") {
    return `task-${task.task.id}`;
  }
  return (task as TaskItem).doc.id;
}

export function TaskQueue({ initialTasks, filter, streak }: TaskQueueProps) {
  const router = useRouter();
  const payloadSignature = initialTasks
    .map((task) => {
      if ("source" in task && task.source === "task") return `${getTaskId(task)}:${task.dueAt ?? ""}:${task.task.updatedAt}`;
      return `${getTaskId(task)}:${task.repetition.nextReviewDate}`;
    })
    .join("|");
  const [optimisticCompletion, setOptimisticCompletion] = React.useState<{ signature: string; ids: Set<string> }>(() => ({
    signature: payloadSignature,
    ids: new Set(),
  }));
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<TaskItem | null>(null);

  const VALID_SORTS = ["newest", "oldest", "a-z", "z-a", "last-modified"] as const;
  type SortOrder = typeof VALID_SORTS[number];
  const [sortOrder, setSortOrder] = React.useState<SortOrder>(() => {
    if (typeof window === "undefined") return "last-modified";
    const storedSort = window.localStorage.getItem("lostbae_dashboard_sort");
    return storedSort && (VALID_SORTS as readonly string[]).includes(storedSort)
      ? (storedSort as SortOrder)
      : "last-modified";
  });

  React.useEffect(() => { localStorage.setItem("lostbae_dashboard_sort", sortOrder); }, [sortOrder]);
  const completedIds = React.useMemo(
    () => (optimisticCompletion.signature === payloadSignature ? optimisticCompletion.ids : new Set<string>()),
    [optimisticCompletion, payloadSignature]
  );

  const sortedTasks = React.useMemo(() => {
    const result = initialTasks.filter((task) => !completedIds.has(getTaskId(task)));

    result.sort((a, b) => {
      const aTitle = "source" in a ? (a.source === "youtube" ? a.session.videoTitle : a.task.title) : a.doc.title;
      const bTitle = "source" in b ? (b.source === "youtube" ? b.session.videoTitle : b.task.title) : b.doc.title;
      const aCreated = "source" in a ? (a.source === "youtube" ? a.session.createdAt : a.task.createdAt) : a.doc.createdAt;
      const bCreated = "source" in b ? (b.source === "youtube" ? b.session.createdAt : b.task.createdAt) : b.doc.createdAt;
      const aUpdated = "source" in a ? (a.source === "youtube" ? a.session.updatedAt : a.task.updatedAt) : a.doc.updatedAt;
      const bUpdated = "source" in b ? (b.source === "youtube" ? b.session.updatedAt : b.task.updatedAt) : b.doc.updatedAt;

      if (sortOrder === "newest") return new Date(bCreated).getTime() - new Date(aCreated).getTime();
      if (sortOrder === "oldest") return new Date(aCreated).getTime() - new Date(bCreated).getTime();
      if (sortOrder === "a-z") return aTitle.localeCompare(bTitle);
      if (sortOrder === "z-a") return bTitle.localeCompare(aTitle);
      if (sortOrder === "last-modified") return new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
      return 0;
    });

    return result;
  }, [completedIds, initialTasks, sortOrder]);

  const hideOptimistically = React.useCallback((id: string) => {
    setOptimisticCompletion((current) => {
      const ids = current.signature === payloadSignature ? new Set(current.ids) : new Set<string>();
      ids.add(id);
      return { signature: payloadSignature, ids };
    });
  }, [payloadSignature]);

  async function handleReschedule(docId: string, days: number) {
    await rescheduleDocAction(docId, days);
    toast(`Rescheduled +${days} days`, { variant: "success" });
    router.refresh();
  }

  const handleComplete = React.useCallback(async (docId: string) => {
    await completeReviewAction(docId);
    hideOptimistically(docId);
    toast("Review complete!", { variant: "success" });
    router.refresh();
  }, [hideOptimistically, router]);

  // Keyboard shortcut: press E to complete focused task (doc tasks only)
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "e" && expandedId && !activeTask) {
        const task = sortedTasks.find((item) => !("source" in item) && (item as TaskItem).doc.id === expandedId);
        if (task && !("source" in task)) void handleComplete((task as TaskItem).doc.id);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [expandedId, activeTask, handleComplete, sortedTasks]);

  async function handleYoutubeReschedule(sessionId: string, days: number) {
    await rescheduleYoutubeAction(sessionId, days);
    toast(`Rescheduled +${days} days`, { variant: "success" });
    router.refresh();
  }

  async function handleYoutubeComplete(sessionId: string) {
    await markYoutubeCompletedAction(sessionId);
    hideOptimistically(`yt-${sessionId}`);
    toast("Video marked complete!", { variant: "success" });
    router.refresh();
  }

  async function handleLightweightTaskReschedule(taskId: string, days: number) {
    const result = await rescheduleTaskAction(taskId, days);
    if (result.success) {
      toast(`Task rescheduled +${days} day${days !== 1 ? "s" : ""}`, { variant: "success" });
      router.refresh();
    } else {
      toast(result.error || "Could not reschedule task", { variant: "error" });
    }
  }

  async function handleLightweightTaskComplete(taskId: string) {
    const result = await completeTaskAction(taskId);
    if (result.success) {
      hideOptimistically(`task-${taskId}`);
      toast("Task complete!", { variant: "success" });
      router.refresh();
    } else {
      toast(result.error || "Could not complete task", { variant: "error" });
    }
  }

  async function handleDelete(docId: string) {
    const result = await deleteDocumentAction(docId);
    if (result.success) {
      hideOptimistically(docId);
      toast("Document deleted", { variant: "success" });
      router.refresh();
    } else {
      toast(result.error || "Could not delete document", { variant: "error" });
    }
  }

  function handleToggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end gap-3">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="min-w-[128px] rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-forest-slate focus:outline-none focus:ring-2 focus:ring-state-today/40 sm:min-w-[140px] sm:py-2 sm:text-sm"
          aria-label="Sort Order"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="a-z">A-Z</option>
          <option value="z-a">Z-A</option>
          <option value="last-modified">Last Modified</option>
        </select>
      </div>

      <div className="space-y-2.5">
        {sortedTasks.length === 0 ? (
          <InboxZero
            streak={streak}
            nextDate={
              filter === "today"
                ? "No upcoming reviews found"
                : undefined
            }
          />
        ) : (
          sortedTasks.map((task) => {
            const id = getTaskId(task);
            if ("source" in task && task.source === "youtube") {
              return (
                <YoutubeTaskRow
                  key={id}
                  task={task}
                  isExpanded={expandedId === id}
                  onToggleExpand={() => handleToggleExpand(id)}
                  onReschedule={handleYoutubeReschedule}
                  onComplete={handleYoutubeComplete}
                />
              );
            }
            if ("source" in task && task.source === "task") {
              return (
                <LightweightTaskRow
                  key={id}
                  task={task}
                  isExpanded={expandedId === id}
                  onToggleExpand={() => handleToggleExpand(id)}
                  onReschedule={handleLightweightTaskReschedule}
                  onComplete={handleLightweightTaskComplete}
                />
              );
            }
            const docTask = task as TaskItem;
            return (
              <TaskRow
                key={id}
                task={docTask}
                isExpanded={expandedId === id}
                onToggleExpand={() => handleToggleExpand(id)}
                onReview={setActiveTask}
                onReschedule={handleReschedule}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </div>

      <GlassModal
        task={activeTask}
        onClose={() => setActiveTask(null)}
        onComplete={handleComplete}
      />
    </div>
  );
}
