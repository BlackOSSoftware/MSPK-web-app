"use client";

import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 space-y-6 py-2">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Privacy Policy</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Learn how MSPK Trading Solutions handles platform access, account data, and educational-use disclosures.
        </p>
      </div>
      <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.35)] dark:border-slate-700/60 dark:bg-slate-950/60 sm:p-6">
        <PrivacyPolicyContent />
      </div>
    </div>
  );
}
