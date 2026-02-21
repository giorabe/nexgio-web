import React from "react";
import { Button } from "@/app/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/app/shared/ui/dialog";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
};

export default function SuccessDialog({ open, message, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className={`bg-[#1E1E1E] border-[#2A2A2A] text-white w-[95vw] max-w-[420px] [&>button]:hidden`}>
        <DialogHeader>
          <DialogTitle>Success</DialogTitle>
        </DialogHeader>

        <div className="py-2 text-sm text-[#A0A0A0]">{message}</div>

        <DialogFooter>
          <div className="w-full">
            <Button className="w-full" onClick={onClose}>
              OK
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
