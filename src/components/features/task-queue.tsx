"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TaskRow } from "./task-row";
import { GlassModal } from "./glass-modal";
import { InboxZero } from "./inbox-zero";
import { completeReviewAction, rescheduleDocAction, markDocCompletedAction } from "@/actions/documents";
import { toast } from "@/components/ui/toast";
import { formatRelativeDate } from "@/lib/utils";
import type { TaskItem, TaskFilter } from "@/types";

interface TaskQueueProps {
  initialTasks: TaskItem[];
  filter: TaskFilter;
}

export function TaskQueue({ initialTasks, filter }: TaskQueueProps) {
  const router = useRouter();
  const [tasks, setTasks] = React.useState(initialTasks);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeTask, setActiveTask] = React.useState<TaskItem | null>(null);

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Keyboard shortcut: press E to complete focused task
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "e" && expandedId && !activeTask) {
        const task = tasks.find((t) => t.doc.id === expandedId);
        if (task) handleComplete(task.doc.id);
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
    setTasks((prev) => prev.filter((t) => t.doc.id !== docId));
    toast("Review complete!", { variant: "success" });
    router.refresh();
  }

  function handleToggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const upcoming = tasks.find((t) => t.urgency === "upcoming");

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
          tasks.map((task) => (
            <TaskRow
              key={task.doc.id}
              task={task}
              isExpanded={expandedId === task.doc.id}
              onToggleExpand={() => handleToggleExpand(task.doc.id)}
              onReview={setActiveTask}
              onReschedule={handleReschedule}
              onComplete={handleComplete}
            />
          ))
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
