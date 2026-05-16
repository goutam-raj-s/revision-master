"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TaskRow, YoutubeTaskRow } from "./task-row";
import { GlassModal } from "./glass-modal";
import { InboxZero } from "./inbox-zero";
import { completeReviewAction, rescheduleDocAction } from "@/actions/documents";
import { toast } from "@/components/ui/toast";
import type { TaskItem, TaskFilter } from "@/types";
import type { AnyTaskItem } from "@/actions/queue";

interface TaskQueueProps {
  initialTasks: AnyTaskItem[];
  filter: TaskFilter;
}

function getTaskId(task: AnyTaskItem): string {
  if ("source" in task && task.source === "youtube") {
    return `yt-${task.session.id}`;
  }
  return (task as TaskItem).doc.id;
}

export function TaskQueue({ initialTasks, filter }: TaskQueueProps) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState(initialTasks);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<TaskItem | null>(null);

  const VALID_SORTS = ["newest", "oldest", "a-z", "z-a", "last-modified"] as const;
  type SortOrder = typeof VALID_SORTS[number];
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("last-modified");

  React.useEffect(() => {
    const storedSort = localStorage.getItem("lostbae_dashboard_sort") as SortOrder | null;
    if (storedSort && (VALID_SORTS as readonly string[]).includes(storedSort)) setSortOrder(storedSort);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => { localStorage.setItem("lostbae_dashboard_sort", sortOrder); }, [sortOrder]);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sortedTasks = React.useMemo(() => {
    const result = [...tasks];

    result.sort((a, b) => {
      const aTitle = "source" in a ? a.session.videoTitle : a.doc.title;
      const bTitle = "source" in b ? b.session.videoTitle : b.doc.title;
      const aCreated = "source" in a ? a.session.createdAt : a.doc.createdAt;
      const bCreated = "source" in b ? b.session.createdAt : b.doc.createdAt;
      const aUpdated = "source" in a ? a.session.updatedAt : a.doc.updatedAt;
      const bUpdated = "source" in b ? b.session.updatedAt : b.doc.updatedAt;

      if (sortOrder === "newest") return new Date(bCreated).getTime() - new Date(aCreated).getTime();
      if (sortOrder === "oldest") return new Date(aCreated).getTime() - new Date(bCreated).getTime();
      if (sortOrder === "a-z") return aTitle.localeCompare(bTitle);
      if (sortOrder === "z-a") return bTitle.localeCompare(aTitle);
      if (sortOrder === "last-modified") return new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
      return 0;
    });

    return result;
  }, [tasks, sortOrder]);

  // Keyboard shortcut: press E to complete focused task (doc tasks only)
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "e" && expandedId && !activeTask) {
        const task = tasks.find((t) => !("source" in t) && (t as TaskItem).doc.id === expandedId);
        if (task && !("source" in task)) handleComplete((task as TaskItem).doc.id);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [expandedId, activeTask, tasks]);

  async function handleReschedule(docId: string, days: number) {
    await rescheduleDocAction(docId, days);
    toast(`Rescheduled +${days} days`, { variant: "success" });
    router.refresh();
  }

  async function handleComplete(docId: string) {
    await completeReviewAction(docId);
    setTasks((prev) => prev.filter((t) => !("source" in t) && (t as TaskItem).doc.id !== docId));
    toast("Review complete!", { variant: "success" });
    router.refresh();
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
