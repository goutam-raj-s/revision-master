"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  FolderPlus,
  Loader2,
  MessageSquarePlus,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { cn, formatRelativeDate } from "@/lib/utils";
import {
  addTaskCommentAction,
  completeTaskAction,
  createTaskAction,
  deleteTaskAction,
  reopenTaskAction,
  rescheduleTaskAction,
  updateTaskAction,
} from "@/actions/tasks";
import {
  addTaskToCollectionAction,
  createCollectionAction,
  getCollectionsAction,
} from "@/actions/collections";
import type { Difficulty, LightweightTask, TopicCollection } from "@/types";

interface TasksClientProps {
  initialTasks: LightweightTask[];
  allTags: { tag: string; count: number }[];
  initialTagFilter?: string;
  initialSearch?: string;
  initialStatus?: string;
  showCollectionItems?: boolean;
}

const difficultyOptions: Difficulty[] = ["easy", "medium", "hard"];

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

export function TasksClient({
  initialTasks,
  allTags,
  initialTagFilter,
  initialSearch,
  initialStatus,
  showCollectionItems = false,
}: TasksClientProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("medium");
  const [creating, setCreating] = React.useState(false);
  const [search, setSearch] = React.useState(initialSearch ?? "");
  const [tagFilter, setTagFilter] = React.useState(initialTagFilter ?? "");
  const [statusFilter, setStatusFilter] = React.useState(initialStatus ?? "pending");

  async function createTask() {
    if (!title.trim()) return;
    setCreating(true);
    const res = await createTaskAction({ title, tags, comment, dueAt, difficulty });
    if (res.success) {
      toast("Task created", { variant: "success" });
      setTitle("");
      setTags("");
      setComment("");
      setDueAt("");
      setDifficulty("medium");
      router.refresh();
    } else {
      toast(res.error ?? "Could not create task", { variant: "error" });
    }
    setCreating(false);
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (tagFilter) params.set("tag", tagFilter);
    params.set("status", statusFilter);
    if (showCollectionItems) params.set("showCollections", "1");
    router.push(`/tasks${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card lg:grid-cols-[1fr_180px]">
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title..."
            className="h-10"
          />
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Small comment or context..."
            className="min-h-20 resize-none"
          />
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="hashtags, comma separated"
          />
        </div>
        <div className="space-y-3">
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-forest-slate"
          >
            {difficultyOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          <Button onClick={createTask} disabled={creating || !title.trim()} className="w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create task
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3 shadow-card sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mossy-gray" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." className="pl-9" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-mossy-gray hover:text-forest-slate">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-forest-slate">
          <option value="">All tags</option>
          {allTags.map((tag) => (
            <option key={tag.tag} value={tag.tag}>#{tag.tag} ({tag.count})</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-forest-slate">
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>
        <Link
          href={showCollectionItems ? "/tasks" : "/tasks?showCollections=1"}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm transition-colors",
            showCollectionItems
              ? "border-state-today bg-state-today/10 text-state-today"
              : "border-border bg-surface text-mossy-gray hover:text-forest-slate"
          )}
        >
          Collection items
        </Link>
        <Button variant="outline" onClick={applyFilters}>Apply</Button>
      </div>

      <p className="text-xs text-mossy-gray">
        Showing {initialTasks.length} task{initialTasks.length !== 1 ? "s" : ""}{!showCollectionItems && " outside collections"}
      </p>

      {initialTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <Circle className="mx-auto mb-3 h-9 w-9 text-mossy-gray/40" />
          <p className="text-sm text-mossy-gray">No lightweight tasks match this view.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {initialTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: LightweightTask }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [collections, setCollections] = React.useState<TopicCollection[]>([]);
  const [newCollectionName, setNewCollectionName] = React.useState("");

  async function complete() {
    setBusy(true);
    const res = task.status === "completed" ? await reopenTaskAction(task.id) : await completeTaskAction(task.id);
    if (res.success) {
      toast(task.status === "completed" ? "Task reopened" : "Task completed", { variant: "success" });
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
      router.refresh();
    } else {
      toast(res.error ?? "Could not reschedule", { variant: "error" });
    }
    setBusy(false);
  }

  async function saveDueAt(value: string) {
    const res = await updateTaskAction(task.id, { dueAt: value });
    if (res.success) router.refresh();
    else toast(res.error ?? "Could not update date", { variant: "error" });
  }

  async function addComment() {
    if (!newComment.trim()) return;
    const res = await addTaskCommentAction(task.id, newComment);
    if (res.success) {
      setNewComment("");
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
      router.refresh();
    } else {
      toast(res.error ?? "Could not delete task", { variant: "error" });
    }
  }

  async function loadCollections() {
    const rows = await getCollectionsAction();
    setCollections(rows);
  }

  async function addToCollection(collectionId: string, name: string) {
    const res = await addTaskToCollectionAction(collectionId, task.id);
    if (res.success) {
      toast(`Added to "${name}"`, { variant: "success" });
      router.refresh();
    } else {
      toast(res.error ?? "Could not add to collection", { variant: "error" });
    }
  }

  async function createAndAddCollection() {
    if (!newCollectionName.trim()) return;
    const res = await createCollectionAction(newCollectionName);
    if (res.success && res.data) {
      await addToCollection(res.data.id, newCollectionName);
      setNewCollectionName("");
      loadCollections();
    } else {
      toast(res.error ?? "Could not create collection", { variant: "error" });
    }
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        <button
          onClick={complete}
          disabled={busy}
          className="mt-0.5 self-start rounded-lg text-mossy-gray transition-colors hover:text-state-today"
          aria-label={task.status === "completed" ? "Reopen task" : "Complete task"}
        >
          {task.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-state-completed" /> : <Circle className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn("text-sm font-semibold text-forest-slate", task.status === "completed" && "line-through opacity-70")}>{task.title}</h2>
            <Badge variant={task.difficulty}>{task.difficulty}</Badge>
            {task.dueAt && (
              <Badge variant={new Date(task.dueAt) < new Date() && task.status !== "completed" ? "stale" : "upcoming"}>
                {formatRelativeDate(task.dueAt)}
              </Badge>
            )}
            {task.tags.map((tag) => (
              <Badge key={tag} variant="tag">#{tag}</Badge>
            ))}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-[180px_1fr]">
            <Input type="datetime-local" defaultValue={toInputDateTime(task.dueAt)} onBlur={(event) => saveDueAt(event.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 3, 7, 14].map((days) => (
                <Button key={days} variant="outline" size="sm" onClick={() => schedule(days)} disabled={busy}>
                  {days === 0 ? "Today" : `+${days}d`}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <details className="relative" onToggle={(event) => event.currentTarget.open && loadCollections()}>
            <summary className="inline-flex h-7 cursor-pointer list-none items-center gap-1.5 rounded-full border-2 border-border bg-surface px-3 text-xs font-medium text-forest-slate hover:bg-canvas">
              <FolderPlus className="h-3.5 w-3.5" /> Collection
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-border bg-surface p-2 shadow-hover">
              <div className="max-h-48 overflow-auto">
                {collections.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-mossy-gray">No collections yet</p>
                ) : (
                  collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => addToCollection(collection.id, collection.name)}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-forest-slate hover:bg-canvas"
                    >
                      {collection.name}
                    </button>
                  ))
                )}
              </div>
              <div className="mt-1 flex gap-1 border-t border-border pt-2">
                <Input value={newCollectionName} onChange={(event) => setNewCollectionName(event.target.value)} placeholder="New collection" className="h-7 text-xs" />
                <Button size="icon-sm" variant="ghost" onClick={createAndAddCollection}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </details>
          <Button variant="ghost" size="icon-sm" onClick={complete} disabled={busy}>
            {task.status === "completed" ? <RotateCcw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={remove} className="hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
        {task.comments.length > 0 && (
          <div className="space-y-1.5">
            {task.comments.map((item) => (
              <div key={item.id} className="rounded-xl bg-canvas px-3 py-2">
                <p className="text-sm text-forest-slate">{item.content}</p>
                <p className="mt-1 text-[11px] text-mossy-gray">{commentDate(item.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="Add comment with date/time..." />
          <Button variant="outline" onClick={addComment} disabled={!newComment.trim()}>
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
