"use client";

import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import {
  BadgeCheck,
  BadgePercent,
  ChevronRight,
  Copy,
  Crown,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMeQuery } from "@/hooks/use-auth";

export default function ProfilePage() {
  const router = useRouter();
  const meQuery = useMeQuery();

  const profile = useMemo(() => {
    const me = meQuery.data;
    const name = me?.name ?? "Test User";
    const email = me?.email ?? "test@example.com";
    const walletCandidate =
      typeof me?.walletBalance === "number"
        ? me.walletBalance
        : typeof me?.equity === "number"
          ? me.equity
          : undefined;
    const wallet = typeof walletCandidate === "number" && walletCandidate > 0 ? walletCandidate : undefined;
    const planLabel = me?.planName ? `${me.planName} Plan` : "Balance";
    const phone = me?.phone ?? "N/A";
    const city = me?.profile?.city ?? "N/A";
    const state = me?.profile?.state ?? "N/A";
    const tradingViewId = me?.tradingViewId ?? "N/A";
    const status = me?.status ?? "N/A";
    const referralCode = me?.referral?.code ?? "N/A";

    const username = `@${email.split("@")[0] || "user"}`;
    const userId = referralCode !== "N/A" ? referralCode : username;

    return {
      userId,
      name,
      username,
      email,
      wallet,
      planLabel,
      avatar: me?.profile?.avatar,
      phone,
      city,
      state,
      tradingViewId,
      status,
      referralCode,
    };
  }, [meQuery.data]);

  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "T";

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, "");
  const avatarUrl = profile.avatar
    ? profile.avatar.startsWith("http://") || profile.avatar.startsWith("https://")
      ? profile.avatar
      : apiBase
        ? `${apiBase}/${profile.avatar.replace(/^\/+/, "")}`
        : null
    : null;
  const referralCodeLabel =
    profile.referralCode && profile.referralCode !== "N/A" ? `(${profile.referralCode}) ` : "";

  const handleCopyUserId = async () => {
    const valueToCopy = profile.userId || "-";
    try {
      await navigator.clipboard.writeText(valueToCopy);
      toast.success("Referral Code copied");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const handleShareApp = async () => {
    const trialBaseUrl = "https://user.mspktradesolutions.com/trial";
    const referralCode = profile.referralCode && profile.referralCode !== "N/A" ? profile.referralCode : "";
    const trialUrl = referralCode ? `${trialBaseUrl}?ref=${encodeURIComponent(referralCode)}` : trialBaseUrl;
    const referralLine = referralCode
      ? `Use my referral code: ${referralCode}.`
      : "Join MSPK Trade Solutions today.";
    const text = [
      "MSPK Trade Solutions is a premium, trusted signals app.",
      "Get real-time market updates and pro-level trade insights.",
      referralLine,
      `Start your free trial here: ${trialUrl}`,
    ].join(" ");
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: "MSPK Trade Solutions",
          text,
          url: trialUrl,
          dialogTitle: "Share MSPK Trade Solutions",
        });
        return;
      }

      if (navigator.share) {
        let files: File[] | undefined;
        try {
          if (typeof window !== "undefined") {
            const logoResponse = await fetch("/logo.jpg");
            if (logoResponse.ok) {
              const blob = await logoResponse.blob();
              const logoFile = new File([blob], "mspk-logo.jpg", { type: blob.type || "image/jpeg" });
              if (navigator.canShare?.({ files: [logoFile] })) {
                files = [logoFile];
              }
            }
          }
        } catch {
          files = undefined;
        }
        await navigator.share(
          files
            ? { title: "MSPK Trade Solutions", text, files }
            : { title: "MSPK Trade Solutions", text }
        );
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("App message copied");
    } catch {
      toast.error("Unable to share");
    }
  };

  const actionRows = [
    {
      label: "Edit Profile",
      icon: UserRound,
      onClick: () => router.push("/dashboard/profile/edit"),
    },
    {
      label: "Change Password",
      icon: ShieldCheck,
      onClick: () => router.push("/dashboard/profile/change-password"),
    },
    {
      label: "Share App",
      icon: Share2,
      onClick: handleShareApp,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 pb-10 pt-4">
      <div className="space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Profile</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Manage your account details and preferences.</p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary/30 to-amber-200/40 border border-black/10 dark:border-white/10 overflow-hidden flex items-center justify-center text-sm font-semibold text-foreground">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-foreground truncate">{profile.name}</div>
                  
                  <div className="text-[11px] text-muted-foreground truncate inline-flex items-center gap-1.5">
                    <Mail size={12} className="text-muted-foreground/80" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center justify-end gap-1.5">
                  <Crown size={12} className="text-amber-500/80" />
                  <span>{profile.planLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-foreground/10 bg-foreground/5 flex items-center justify-center">
                  <BadgeCheck size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                  <div className="text-sm font-semibold text-foreground mt-1">{profile.status}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-foreground/10 bg-foreground/5 flex items-center justify-center">
                  <BadgePercent size={16} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Referral</div>
                  <div className="text-sm font-semibold text-foreground mt-1 truncate">{profile.referralCode}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-foreground/10 bg-foreground/5 flex items-center justify-center">
                  <Phone size={16} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</div>
                  <div className="text-sm font-semibold text-foreground mt-1">{profile.phone}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-foreground/10 bg-foreground/5 flex items-center justify-center">
                  <MapPin size={16} className="text-sky-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Location</div>
                  <div className="text-sm font-semibold text-foreground mt-1 truncate">
                    {profile.city}, {profile.state}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-foreground/10 bg-foreground/5 flex items-center justify-center">
                  <IdCard size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">TradingView ID</div>
                  <div className="text-sm font-semibold text-foreground mt-1 truncate">{profile.tradingViewId}</div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/plans")}
            className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 dark:from-white/5 dark:via-white/5 dark:to-white/10 px-4 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-left">
              <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Upgrade to VIP</div>
                <div className="text-[11px] text-muted-foreground">Enjoy all benefits without restrictions</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3 py-2 flex items-center gap-2">
            <div className="h-9 w-9 rounded-full border border-foreground/10 bg-foreground/5 flex items-center justify-center">
              <IdCard size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Referral Code</div>
              <div className="text-xs font-medium text-foreground truncate">
                {profile.referralCode || "-"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyUserId}
              className="h-9 w-9 rounded-full bg-amber-400/80 text-white flex items-center justify-center"
              title="Copy Referral Code"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="px-1 text-[10px] uppercase tracking-wider text-muted-foreground">Account Actions</div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/5 divide-y divide-black/10 dark:divide-white/10">
            {actionRows.map((row) => (
              <button
                key={row.label}
                type="button"
                onClick={row.onClick}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground"
              >
                <span className="inline-flex items-center gap-2">
                  <row.icon size={16} className="text-muted-foreground" />
                  {row.label}
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-white/80 to-amber-50/60 dark:from-primary/15 dark:via-white/5 dark:to-white/10 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_20px_60px_-45px_rgba(59,130,246,0.6)]">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Tips</div>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="mt-0.5 text-primary" />
                  <span>Keep your profile details updated for faster support and accurate alerts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <BadgePercent size={14} className="mt-0.5 text-amber-500" />
                  <span>
                    Share your referral code {referralCodeLabel}to earn rewards when friends join MSPK.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Share2 size={14} className="mt-0.5 text-emerald-500" />
                  <span>Share the trial link so signups are tracked automatically: user.mspktradesolutions.com/trial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
