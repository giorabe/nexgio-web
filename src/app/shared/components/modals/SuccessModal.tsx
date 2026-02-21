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
  okText?: string;
  onOk: () => void;
}

export default function SuccessModal({
  open,
  title = "Success",
  message,
  okText = "OK",
  onOk,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOk()}>
      <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-2 text-[#A0A0A0]">{message}</div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button onClick={onOk} className="bg-[#10B981] text-white">
              {okText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
