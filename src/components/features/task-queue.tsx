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

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
    <>
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <InboxZero
            nextDate={
              filter === "today"
                ? "No upcoming reviews found"
                : undefined
            }
          />
        ) : (
          tasks.map((task) => {
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

      {/* Glass Modal */}
      <GlassModal
        task={activeTask}
        onClose={() => setActiveTask(null)}
        onComplete={handleComplete}
      />
    </>
  );
}
