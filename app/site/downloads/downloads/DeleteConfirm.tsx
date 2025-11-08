"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  title?: string;
  description?: string;
  loading?: boolean;
  onCancelAction: () => void;
  onConfirmAction: () => void;
};

export default function DeleteConfirm({ open, title = "Confirm delete", description = "Are you sure you want to delete this item?", loading = false, onCancelAction, onConfirmAction, }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancelAction()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">{description}</div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancelAction} disabled={loading}>Cancel</Button>
          <Button onClick={onConfirmAction} disabled={loading} className="bg-destructive text-white">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
