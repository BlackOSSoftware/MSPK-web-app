"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";

export function PrivacyPolicyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-5 text-slate-900 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] dark:border-slate-700/70 dark:bg-slate-950/95 dark:text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Privacy Policy</DialogTitle>
        </DialogHeader>
        <PrivacyPolicyContent />
      </DialogContent>
    </Dialog>
  );
}
