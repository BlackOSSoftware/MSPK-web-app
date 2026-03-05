"use client";

import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UpdateMePayload } from "@/services/auth/auth.types";
import { useMeQuery, useUpdateMeMutation } from "@/hooks/use-auth";

export default function EditProfilePage() {
  const router = useRouter();
  const meQuery = useMeQuery();
  const updateMeMutation = useUpdateMeMutation();
  const [draft, setDraft] = useState<UpdateMePayload | null>(null);

  const profile = useMemo(() => {
    const me = meQuery.data;
    const name = draft?.name ?? me?.name ?? "";
    const email = me?.email ?? "";
    const tradingViewId = draft?.tradingViewId ?? me?.tradingViewId ?? "";

    return {
      name,
      username: `@${email.split("@")[0] || "user"}`,
      email,
      phone: draft?.phone ?? me?.phone ?? "",
      tradingViewId,
      address: draft?.profile?.address ?? me?.profile?.address ?? "",
      city: draft?.profile?.city ?? me?.profile?.city ?? "",
      state: draft?.profile?.state ?? me?.profile?.state ?? "",
    };
  }, [draft, meQuery.data]);

  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "T";

  const setField = (key: keyof UpdateMePayload, value: string | boolean) => {
    setDraft((prev) => ({ ...(prev ?? {}), [key]: value }));
  };

  const setProfileField = (key: "address" | "city" | "state", value: string) => {
    setDraft((prev) => ({
      ...(prev ?? {}),
      profile: {
        address: prev?.profile?.address ?? profile.address,
        city: prev?.profile?.city ?? profile.city,
        state: prev?.profile?.state ?? profile.state,
        [key]: value,
      },
    }));
  };

  const saveProfile = async () => {
    const payload: UpdateMePayload = {};

    if (draft?.name !== undefined) payload.name = draft.name;
    if (draft?.phone !== undefined) payload.phone = draft.phone;
    if (draft?.tradingViewId !== undefined) payload.tradingViewId = draft.tradingViewId;
    if (draft?.profile) payload.profile = draft.profile;

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to update");
      return;
    }

    try {
      await updateMeMutation.mutateAsync(payload);
      toast.success("Profile updated");
      router.replace("/dashboard/profile");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 pb-10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Edit Profile</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Update your account details and contact info.</p>
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
        <aside className="space-y-4">
          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary/30 to-amber-200/40 border border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center text-sm font-semibold text-foreground">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-foreground truncate">{profile.name || "User"}</div>
                <div className="text-[11px] text-muted-foreground truncate">{profile.username}</div>
                <div className="text-[11px] text-muted-foreground truncate">{profile.email}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</div>
                <div className="text-sm font-semibold text-foreground mt-1">{profile.phone || "N/A"}</div>
              </div>
              <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">City</div>
                <div className="text-sm font-semibold text-foreground mt-1">{profile.city || "N/A"}</div>
              </div>
              <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">State</div>
                <div className="text-sm font-semibold text-foreground mt-1">{profile.state || "N/A"}</div>
              </div>
              <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Address</div>
                <div className="text-sm font-semibold text-foreground mt-1 truncate">{profile.address || "N/A"}</div>
              </div>
              <div className="rounded-xl bg-black/5 dark:bg-white/5 px-3 py-2 col-span-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">TradingView ID</div>
                <div className="text-sm font-semibold text-foreground mt-1 truncate">{profile.tradingViewId || "N/A"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3 text-xs text-muted-foreground">
            Keep your profile updated for smoother support and billing.
          </div>
        </aside>

        <section className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] text-muted-foreground">Full Name</label>
              <input
                value={profile.name}
                onChange={(e) => setField("name", e.target.value)}
                className="mt-1.5 w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">City</label>
              <input
                value={profile.city}
                onChange={(e) => setProfileField("city", e.target.value)}
                className="mt-1.5 w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">State</label>
              <input
                value={profile.state}
                onChange={(e) => setProfileField("state", e.target.value)}
                className="mt-1.5 w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] text-muted-foreground">Address</label>
              <input
                value={profile.address}
                onChange={(e) => setProfileField("address", e.target.value)}
                className="mt-1.5 w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Phone</label>
              <input
                value={profile.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className="mt-1.5 w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">TradingView ID</label>
              <input
                value={profile.tradingViewId}
                onChange={(e) => setField("tradingViewId", e.target.value)}
                placeholder="e.g. trader_123"
                className="mt-1.5 w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Email</label>
              <input
                value={profile.email}
                disabled
                className="mt-1.5 w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 text-sm text-muted-foreground"
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/profile")}
              className="h-11 px-4 rounded-xl border border-black/10 dark:border-white/10 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={updateMeMutation.isPending}
              className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={14} /> {updateMeMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
