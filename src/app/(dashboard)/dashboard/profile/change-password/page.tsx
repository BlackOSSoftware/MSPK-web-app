"use client";

import { Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useChangePasswordMutation } from "@/hooks/use-auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const changePasswordMutation = useChangePasswordMutation();

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [show, setShow] = useState({ old: false, next: false, confirm: false });

  const updatePassword = async () => {
    if (!form.oldPassword || !form.newPassword || !form.confirmNewPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (form.newPassword !== form.confirmNewPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync(form);
      toast.success("Password changed");
      router.replace("/dashboard/profile");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to change password";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 pb-10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Change Password</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Keep your account secure with a strong password.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/profile")}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to Profile
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <aside className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4 space-y-3">
          <div className="inline-flex h-10 w-10 rounded-xl bg-primary/15 text-primary items-center justify-center">
            <ShieldAlert size={18} />
          </div>
          <h3 className="text-base font-semibold text-foreground">Security Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>Use at least 8 characters.</li>
            <li>Mix uppercase, lowercase, numbers, symbols.</li>
            <li>Do not reuse old passwords.</li>
          </ul>
        </aside>

        <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4 sm:p-5 space-y-3">
          {[
            { key: "oldPassword", ui: "old", placeholder: "Current Password" },
            { key: "newPassword", ui: "next", placeholder: "New Password" },
            { key: "confirmNewPassword", ui: "confirm", placeholder: "Confirm New Password" },
          ].map((field) => (
            <div className="relative" key={field.key}>
              <input
                type={show[field.ui as "old" | "next" | "confirm"] ? "text" : "password"}
                placeholder={field.placeholder}
                value={form[field.key as "oldPassword" | "newPassword" | "confirmNewPassword"]}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 pr-10 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={() => setShow((prev) => ({ ...prev, [field.ui]: !prev[field.ui as "old" | "next" | "confirm"] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {show[field.ui as "old" | "next" | "confirm"] ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          ))}

          <div className="pt-2 border-t border-black/5 dark:border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/profile")}
              className="h-11 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={updatePassword}
              disabled={changePasswordMutation.isPending}
              className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Lock size={14} /> {changePasswordMutation.isPending ? "Changing..." : "Update Password"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
