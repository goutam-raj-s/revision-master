"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, MessageSquare, RotateCcw, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { removeTaskFromCollectionAction } from "@/actions/collections";
import {
  bulkDeleteTasksAction,
  completeTaskAction,
  deleteTaskAction,
  reopenTaskAction,
} from "@/actions/tasks";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { LightweightTask } from "@/types";

const pageSizeOptions = [5, 10, 20, 50];

export function CollectionTasksClient({
  collectionId,
  tasks,
}: {
  collectionId: string;
  tasks: LightweightTask[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [busy, setBusy] = React.useState(false);
  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageTasks = tasks.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const pageIds = pageTasks.map((task) => task.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function toggleComplete(task: LightweightTask) {
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

  async function removeFromCollection(taskId: string) {
    const res = await removeTaskFromCollectionAction(collectionId, taskId);
    if (res.success) {
      toast("Removed from collection");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      router.refresh();
    } else {
      toast(res.error ?? "Could not remove", { variant: "error" });
    }
  }

  async function deleteOne(task: LightweightTask) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    const res = await deleteTaskAction(task.id);
    if (res.success) {
      toast("Task deleted", { variant: "success" });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      router.refresh();
    } else {
      toast(res.error ?? "Could not delete task", { variant: "error" });
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected task${ids.length !== 1 ? "s" : ""}?`)) return;
    setBusy(true);
    const res = await bulkDeleteTasksAction(ids);
    if (res.success) {
      toast(`${res.data?.deletedCount ?? ids.length} task${ids.length !== 1 ? "s" : ""} deleted`, { variant: "success" });
      setSelectedIds(new Set());
      router.refresh();
    } else {
      toast(res.error ?? "Could not delete selected tasks", { variant: "error" });
    }
    setBusy(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-mossy-gray">Tasks</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-mossy-gray">{selectedIds.size} selected</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
              setSelectedIds(new Set());
            }}
            className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-forest-slate"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option} / page</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={deleteSelected} disabled={busy || selectedIds.size === 0}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete selected
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]">
                <button
                  onClick={togglePage}
                  className="flex h-5 w-5 items-center justify-center rounded border border-border text-state-today"
                  aria-label={allPageSelected ? "Deselect page" : "Select page"}
                >
                  {allPageSelected && <Check className="h-3.5 w-3.5" />}
                </button>
              </TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="hidden md:table-cell">Tags</TableHead>
              <TableHead className="hidden lg:table-cell">Due</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageTasks.map((task) => {
              const isSelected = selectedIds.has(task.id);
              return (
                <TableRow key={task.id} className={cn(isSelected && "bg-state-today/5")}>
                  <TableCell>
                    <button
                      onClick={() => toggleSelect(task.id)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-border text-state-today"
                      aria-label={isSelected ? "Deselect task" : "Select task"}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <Link
                        href={`/tasks/${task.id}`}
                        className={cn(
                          "font-medium text-forest-slate transition-colors hover:text-state-today",
                          task.status === "completed" && "line-through opacity-70"
                        )}
                      >
                        {task.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-1.5 sm:hidden">
                        <Badge variant={task.difficulty}>{task.difficulty}</Badge>
                        {task.dueAt && <Badge variant="upcoming">{formatRelativeDate(task.dueAt)}</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {task.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="tag">#{tag}</Badge>)}
                      {task.tags.length === 0 && <span className="text-xs text-mossy-gray">No tags</span>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {task.dueAt ? <span className="text-sm text-forest-slate">{formatRelativeDate(task.dueAt)}</span> : <span className="text-xs text-mossy-gray">Not scheduled</span>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={task.status === "completed" ? "completed" : "outline"}>{task.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-mossy-gray hover:bg-canvas hover:text-forest-slate"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {task.comments.length}
                      </Link>
                      <Button variant="ghost" size="icon-sm" onClick={() => toggleComplete(task)} disabled={busy}>
                        {task.status === "completed" ? <RotateCcw className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeFromCollection(task.id)} disabled={busy}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteOne(task)} disabled={busy} className="hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {tasks.length > pageSize && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          <span className="text-xs text-mossy-gray">Page {safeCurrentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages}>
            Next
          </Button>
        </div>
      )}
    </section>
  );
}
