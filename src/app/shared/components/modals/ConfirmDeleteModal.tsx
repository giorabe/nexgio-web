import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/shared/ui/dialog";
import { Button } from "@/app/shared/ui/button";

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  open,
  title = "Confirm Delete",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-2 text-[#A0A0A0]">{message}</div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="border-[#2A2A2A] text-white"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              variant="destructive"
              disabled={loading}
              className="bg-[#EA5455] text-white"
            >
              {loading ? "Deleting..." : confirmText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
