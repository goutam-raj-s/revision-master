"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { cn, formatRelativeDate } from "@/lib/utils";
import { queueOfflineResync } from "@/lib/offline/indexed-db";
import {
  addTaskCommentAction,
  completeTaskAction,
  deleteTaskAction,
  reopenTaskAction,
  rescheduleTaskAction,
  updateTaskAction,
} from "@/actions/tasks";
import type { LightweightTask } from "@/types";

function toInputDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function commentDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TaskDetailClient({ task }: { task: LightweightTask }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");

  async function complete() {
    setBusy(true);
    const res = task.status === "completed" ? await reopenTaskAction(task.id) : await completeTaskAction(task.id);
    if (res.success) {
      toast(task.status === "completed" ? "Task reopened" : "Task completed", { variant: "success" });
      queueOfflineResync("task:status");
      router.refresh();
    } else {
      toast(res.error ?? "Could not update task", { variant: "error" });
    }
    setBusy(false);
  }

  async function schedule(days: number) {
    setBusy(true);
    const res = await rescheduleTaskAction(task.id, days);
    if (res.success) {
      toast(`Scheduled +${days} day${days !== 1 ? "s" : ""}`, { variant: "success" });
      queueOfflineResync("task:schedule");
      router.refresh();
    } else {
      toast(res.error ?? "Could not reschedule", { variant: "error" });
    }
    setBusy(false);
  }

  async function saveDueAt(value: string) {
    const res = await updateTaskAction(task.id, { dueAt: value });
    if (res.success) {
      queueOfflineResync("task:update");
      router.refresh();
    }
    else toast(res.error ?? "Could not update date", { variant: "error" });
  }

  async function addComment() {
    if (!newComment.trim()) return;
    const res = await addTaskCommentAction(task.id, newComment);
    if (res.success) {
      setNewComment("");
      queueOfflineResync("task:comment");
      router.refresh();
    } else {
      toast(res.error ?? "Could not add comment", { variant: "error" });
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    const res = await deleteTaskAction(task.id);
    if (res.success) {
      toast("Task deleted", { variant: "success" });
      queueOfflineResync("task:delete");
      router.push("/tasks");
      router.refresh();
    } else {
      toast(res.error ?? "Could not delete task", { variant: "error" });
    }
  }

  return (
    <div className="space-y-5">
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-mossy-gray transition-colors hover:text-forest-slate">
        <ArrowLeft className="h-3.5 w-3.5" /> Tasks
      </Link>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={complete}
                disabled={busy}
                className="rounded-lg text-mossy-gray transition-colors hover:text-state-today"
                aria-label={task.status === "completed" ? "Reopen task" : "Complete task"}
              >
                {task.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-state-completed" /> : <Circle className="h-5 w-5" />}
              </button>
              <h1 className={cn("text-xl font-bold text-forest-slate sm:text-2xl", task.status === "completed" && "line-through opacity-70")}>
                {task.title}
              </h1>
              <Badge variant={task.difficulty}>{task.difficulty}</Badge>
              {task.dueAt && (
                <Badge variant={new Date(task.dueAt) < new Date() && task.status !== "completed" ? "stale" : "upcoming"}>
                  {formatRelativeDate(task.dueAt)}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.length === 0 ? (
                <span className="text-xs text-mossy-gray">No tags</span>
              ) : (
                task.tags.map((tag) => <Badge key={tag} variant="tag">#{tag}</Badge>)
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" onClick={complete} disabled={busy}>
              {task.status === "completed" ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {task.status === "completed" ? "Reopen" : "Complete"}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={remove} className="hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-[220px_1fr]">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mossy-gray" />
            <Input
              type="datetime-local"
              defaultValue={toInputDateTime(task.dueAt)}
              onBlur={(event) => saveDueAt(event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 3, 7, 14].map((days) => (
              <Button key={days} variant="outline" size="sm" onClick={() => schedule(days)} disabled={busy}>
                {days === 0 ? "Today" : `+${days}d`}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-forest-slate">Messages</h2>
          <span className="text-xs text-mossy-gray">{task.comments.length} total</span>
        </div>

        <div className="mt-4 space-y-2">
          {task.comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-canvas px-4 py-8 text-center text-sm text-mossy-gray">
              No messages yet.
            </div>
          ) : (
            task.comments.map((item) => (
              <div key={item.id} className="rounded-xl bg-canvas px-3 py-2">
                <p className="whitespace-pre-wrap text-sm text-forest-slate">{item.content}</p>
                <p className="mt-1 text-[11px] text-mossy-gray">{commentDate(item.createdAt)}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Add message with date/time..."
            className="min-h-20 resize-none"
          />
          <Button onClick={addComment} disabled={busy || !newComment.trim()} className="sm:self-end">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </section>
    </div>
  );
}
