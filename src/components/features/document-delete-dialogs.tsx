"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentDeleteDialogsProps {
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  deleting: boolean;
  onDelete: () => void;
  bulkOpen: boolean;
  onBulkOpenChange: (open: boolean) => void;
  bulkDeleting: boolean;
  selectedCount: number;
  onBulkDelete: () => void;
}

export function DocumentDeleteDialogs({
  deleteOpen,
  onDeleteOpenChange,
  deleting,
  onDelete,
  bulkOpen,
  onBulkOpenChange,
  bulkDeleting,
  selectedCount,
  onBulkDelete,
}: DocumentDeleteDialogsProps) {
  return (
    <>
      <Dialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This will permanently delete the document and all associated notes, tags, and revision history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-full"
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={onBulkOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 flex items-center gap-3">
              <div className="rounded-xl bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete {selectedCount} document{selectedCount !== 1 ? "s" : ""}?</DialogTitle>
            </div>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-forest-slate">{selectedCount} document{selectedCount !== 1 ? "s" : ""}</span>{" "}
              along with all associated notes, terms, and revision history.
              <br />
              <strong className="text-destructive">This cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={bulkDeleting}>Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={onBulkDelete}
              disabled={bulkDeleting}
              className="gap-2 rounded-full"
            >
              {bulkDeleting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="h-3.5 w-3.5" /> Delete {selectedCount}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
