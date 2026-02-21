import React from "react";
import { Button } from "@/app/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/shared/ui/dialog";

type Props = {
  open: boolean;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "destructive" | "default";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog(props: Props) {
  const {
    open,
    title = "Confirm Delete",
    description,
    confirmText = "Delete",
    cancelText = "Cancel",
    confirmVariant = "destructive",
    onConfirm,
    onCancel,
  } = props;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : onCancel())}>
      <DialogContent
        className={`bg-[#1E1E1E] border-[#2A2A2A] text-white w-[95vw] max-w-[420px] [&>button]:hidden`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-2 text-sm text-[#A0A0A0]">{description}</div>

        <DialogFooter>
          <div className="w-full flex flex-col sm:flex-row items-center sm:justify-center gap-3">
            <Button variant="outline" className="w-full sm:w-40" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button
              variant={confirmVariant === "destructive" ? "destructive" : "default"}
              className="w-full sm:w-40"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
