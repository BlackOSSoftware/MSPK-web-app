"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Smartphone,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMeQuery, useUpdateMeMutation } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  disconnectTelegram,
  getTelegramConnectLink,
  sendWhatsAppTestMessage,
} from "@/services/notifications/notification.service";

type StatusTone = "success" | "warning" | "neutral";

function formatConnectedAt(value?: string | null) {
  if (!value) {
    return "No connection recorded";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Connected";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      response?: {
        data?: {
          message?: unknown;
        };
      };
    };

    const apiMessage = maybeError.response?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim()) {
      return apiMessage;
    }

    if (typeof maybeError.message === "string" && maybeError.message.trim()) {
      return maybeError.message;
    }
  }

  return fallback;
}

function getTelegramConnectedUserLabel(telegram?: {
  connected?: boolean;
  chatId?: string | null;
  username?: string | null;
  displayName?: string | null;
}) {
  if (telegram?.username) {
    return `@${telegram.username}`;
  }

  if (telegram?.displayName) {
    return telegram.displayName;
  }

  if (telegram?.connected) {
    return telegram?.chatId ? `Telegram chat ending ${telegram.chatId.slice(-6)}` : "Connected";
  }

  return "No Telegram account linked";
}

function getStatusToneClasses(tone: StatusTone) {
  if (tone === "success") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  }

  if (tone === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  }

  return "border-slate-300/70 bg-slate-500/10 text-slate-700 dark:border-white/10 dark:text-slate-200";
}

function StatusBadge({
  tone,
  icon: Icon,
  children,
}: {
  tone: StatusTone;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        getStatusToneClasses(tone)
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </div>
  );
}

export default function AlertsPage() {
  const meQuery = useMeQuery();
  const updateMeMutation = useUpdateMeMutation();
  const [pendingConnect, setPendingConnect] = useState<{
    connectUrl: string;
    startCommand: string;
  } | null>(null);

  const connectMutation = useMutation({
    mutationFn: getTelegramConnectLink,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectTelegram,
  });

  const telegram = meQuery.data?.telegram;
  const isConnected = Boolean(telegram?.connected);
  const isWhatsAppEnabled = meQuery.data?.isWhatsAppEnabled !== false;
  const isEmailEnabled = meQuery.data?.isEmailAlertEnabled !== false;
  const whatsappPhone = meQuery.data?.phone?.trim() || "";
  const emailAddress = meQuery.data?.email?.trim() || "";
  const botUsername = telegram?.botUsername || "Mspk_alert_bot";
  const telegramConnectedUserLabel = getTelegramConnectedUserLabel(telegram);
  const telegramWebUrl = `https://web.telegram.org/k/#@${botUsername}`;

  const whatsappTestMutation = useMutation({
    mutationFn: () => sendWhatsAppTestMessage(),
  });

  const telegramTone: StatusTone = isConnected
    ? "success"
    : pendingConnect
      ? "warning"
      : "neutral";
  const whatsappTone: StatusTone = !whatsappPhone
    ? "warning"
    : isWhatsAppEnabled
      ? "success"
      : "neutral";
  const emailTone: StatusTone = !emailAddress
    ? "warning"
    : isEmailEnabled
      ? "success"
      : "neutral";

  const telegramSummary = isConnected
    ? "Connected"
    : pendingConnect
      ? "Awaiting Start"
      : "Not Connected";
  const whatsappSummary = !whatsappPhone
    ? "Phone Required"
    : isWhatsAppEnabled
      ? "Enabled"
      : "Disabled";
  const emailSummary = !emailAddress
    ? "Email Required"
    : isEmailEnabled
      ? "Enabled"
      : "Disabled";

  const handleConnect = async () => {
    try {
      const data = await connectMutation.mutateAsync();
      const url = new URL(data.connectUrl);
      const startParam = url.searchParams.get("start") || "";
      const startCommand = startParam ? `/start ${startParam}` : "/start";

      setPendingConnect({
        connectUrl: data.connectUrl,
        startCommand,
      });

      toast.info(
        "If the Telegram app does not open automatically, use Telegram Web and paste the copied start command."
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not generate the Telegram connect link."));
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await meQuery.refetch();
      if (result.data?.telegram?.connected) {
        setPendingConnect(null);
        toast.success("Telegram is connected and ready for signal delivery.");
      } else {
        toast.info("Press Start inside Telegram first, then refresh this page.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not refresh the Telegram status."));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      setPendingConnect(null);
      await meQuery.refetch();
      toast.success("Telegram has been disconnected.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not disconnect Telegram."));
    }
  };

  const handleEmailToggle = async () => {
    try {
      await updateMeMutation.mutateAsync({
        isEmailAlertEnabled: !isEmailEnabled,
      });
      toast.success(`Signal email alerts ${!isEmailEnabled ? "enabled" : "disabled"}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update the email alert preference."));
    }
  };

  const handleWhatsAppTest = async () => {
    try {
      const response = await whatsappTestMutation.mutateAsync();
      const phoneLabel = response.to || whatsappPhone || "your phone";
      const actionLabel = response.queued ? "queued for" : "sent to";
      toast.success(`WhatsApp test ${actionLabel} ${phoneLabel}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not send the WhatsApp test message."));
    }
  };

  const handleWhatsAppToggle = async () => {
    try {
      await updateMeMutation.mutateAsync({
        isWhatsAppEnabled: !isWhatsAppEnabled,
      });
      toast.success(`Signal WhatsApp alerts ${!isWhatsAppEnabled ? "enabled" : "disabled"}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update the WhatsApp alert preference."));
    }
  };

  const handleCopyCommand = async () => {
    if (!pendingConnect?.startCommand || typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Copy is not available in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(pendingConnect.startCommand);
      toast.success("Telegram start command copied.");
    } catch {
      toast.error("Could not copy the Telegram start command.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-3 pb-8 pt-3 sm:px-4">
      <section className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Bell className="h-3.5 w-3.5" />
              Connect Alerts
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Channel Control
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Keep only connect/disconnect and channel on/off settings.
            </p>
          </div>
          <Button asChild variant="outline" className="h-9 rounded-lg px-3 text-xs">
            <Link href="/dashboard/profile">
              Update Profile
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-black/5 bg-black/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Telegram
            </div>
            <StatusBadge tone={telegramTone} icon={isConnected ? CheckCircle2 : AlertCircle}>
              {telegramSummary}
            </StatusBadge>
          </div>
          <div className="rounded-lg border border-black/5 bg-black/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              WhatsApp
            </div>
            <StatusBadge tone={whatsappTone} icon={isWhatsAppEnabled && whatsappPhone ? CheckCircle2 : AlertCircle}>
              {whatsappSummary}
            </StatusBadge>
          </div>
          <div className="rounded-lg border border-black/5 bg-black/[0.03] p-3 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </div>
            <StatusBadge tone={emailTone} icon={isEmailEnabled && emailAddress ? CheckCircle2 : AlertCircle}>
              {emailSummary}
            </StatusBadge>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bot className="h-4 w-4 text-sky-500" />
              Telegram
            </div>
            <StatusBadge tone={telegramTone} icon={isConnected ? CheckCircle2 : AlertCircle}>
              {telegramSummary}
            </StatusBadge>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-black/5 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bot</div>
              <div className="mt-1 text-sm font-semibold text-foreground">@{botUsername}</div>
            </div>
            <div className="rounded-lg border border-black/5 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Account</div>
              <div className="mt-1 truncate text-sm font-semibold text-foreground">{telegramConnectedUserLabel}</div>
            </div>
            <div className="rounded-lg border border-black/5 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Last Check</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{formatConnectedAt(telegram?.connectedAt)}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleConnect}
              disabled={connectMutation.isPending}
              className="h-9 rounded-lg px-3 text-xs"
            >
              {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {isConnected ? "Reconnect" : "Connect"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={meQuery.isFetching}
              className="h-9 rounded-lg px-3 text-xs"
            >
              {meQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            {isConnected ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="h-9 rounded-lg px-3 text-xs"
              >
                {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                Disconnect
              </Button>
            ) : null}
          </div>

          {pendingConnect ? (
            <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.08] p-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">
                Pending Start Command
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.assign(pendingConnect.connectUrl);
                    }
                  }}
                  className="h-8 rounded-lg px-3 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open App
                </Button>
                <Button asChild variant="outline" className="h-8 rounded-lg px-3 text-xs">
                  <a href={telegramWebUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Web
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyCommand}
                  className="h-8 rounded-lg px-3 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Command
                </Button>
              </div>
              <div className="mt-2 rounded-md border border-black/10 bg-black/[0.04] px-3 py-2 font-mono text-xs text-foreground dark:border-white/10 dark:bg-white/[0.03]">
                {pendingConnect.startCommand}
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-emerald-500" />
            WhatsApp
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="rounded-lg border border-black/5 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Number</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{whatsappPhone || "Not set"}</div>
            </div>
            <StatusBadge tone={whatsappTone} icon={isWhatsAppEnabled && whatsappPhone ? CheckCircle2 : AlertCircle}>
              {whatsappSummary}
            </StatusBadge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={isWhatsAppEnabled ? "outline" : "default"}
              onClick={handleWhatsAppToggle}
              disabled={updateMeMutation.isPending || !whatsappPhone}
              className="h-9 rounded-lg px-3 text-xs"
            >
              {updateMeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              {whatsappPhone ? (isWhatsAppEnabled ? "Turn Off" : "Turn On") : "Set Number"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsAppTest}
              disabled={whatsappTestMutation.isPending || !whatsappPhone}
              className="h-9 rounded-lg px-3 text-xs"
            >
              {whatsappTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              Test
            </Button>
          </div>
        </article>

        <article className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="h-4 w-4 text-amber-500" />
            Email
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="rounded-lg border border-black/5 bg-black/[0.03] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Address</div>
              <div className="mt-1 truncate text-sm font-semibold text-foreground">{emailAddress || "Not set"}</div>
            </div>
            <StatusBadge tone={emailTone} icon={isEmailEnabled && emailAddress ? CheckCircle2 : AlertCircle}>
              {emailSummary}
            </StatusBadge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={isEmailEnabled ? "outline" : "default"}
              onClick={handleEmailToggle}
              disabled={updateMeMutation.isPending || !emailAddress}
              className="h-9 rounded-lg px-3 text-xs"
            >
              {updateMeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {isEmailEnabled ? "Turn Off" : "Turn On"}
            </Button>
          </div>
        </article>
      </section>
    </div>
  );
}
