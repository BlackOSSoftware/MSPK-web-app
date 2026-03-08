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
  ShieldCheck,
  Smartphone,
  Unplug,
  UserRound,
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
  return error instanceof Error ? error.message : fallback;
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

function OverviewTile({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone: StatusTone;
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>
          <div className="text-lg font-semibold text-foreground">{value}</div>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl border",
            getStatusToneClasses(tone)
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}

function InfoTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">{value}</div>
      {helper ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </div>
          <div className="text-sm font-semibold text-foreground">{value}</div>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}

function SectionNote({
  tone,
  title,
  description,
}: {
  tone: StatusTone;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-4",
        tone === "success" && "border-emerald-500/20 bg-emerald-500/[0.06]",
        tone === "warning" && "border-amber-500/25 bg-amber-500/[0.08]",
        tone === "neutral" && "border-slate-300/70 bg-slate-500/[0.06] dark:border-white/10"
      )}
    >
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function StepTile({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {step}
        </div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function RuleTile({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
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
  const telegramUrl = `https://t.me/${botUsername}`;
  const telegramWebUrl = `https://web.telegram.org/k/#@${botUsername}`;
  const profileName = meQuery.data?.name?.trim() || "Your account";

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
  const readyChannelsCount = [
    isConnected,
    Boolean(whatsappPhone) && isWhatsAppEnabled,
    Boolean(emailAddress) && isEmailEnabled,
  ].filter(Boolean).length;
  const attentionCount = [
    !isConnected,
    !whatsappPhone || !isWhatsAppEnabled,
    !emailAddress || !isEmailEnabled,
  ].filter(Boolean).length;
  const savedDestinationsCount = [isConnected, Boolean(whatsappPhone), Boolean(emailAddress)].filter(Boolean).length;
  const telegramStatusTitle = isConnected
    ? "Telegram is ready"
    : pendingConnect
      ? "Finish the Telegram setup"
      : "Telegram is not linked";
  const telegramStatusDescription = isConnected
    ? "Signals can be delivered to your linked Telegram chat as soon as your plan and selected scripts are eligible."
    : pendingConnect
      ? "A secure connection link has been created. Open the bot, press Start, then refresh this page to confirm the link."
      : "Create a secure Telegram link, open the bot, and press Start once to activate private bot delivery.";
  const whatsappStatusTitle = !whatsappPhone
    ? "Phone number required"
    : isWhatsAppEnabled
      ? "WhatsApp delivery is enabled"
      : "WhatsApp delivery is paused";
  const whatsappStatusDescription = !whatsappPhone
    ? "Add a valid phone number in your profile before testing or enabling WhatsApp alerts."
    : isWhatsAppEnabled
      ? "Live signal alerts and test messages use the phone number saved in your profile."
      : "You can enable WhatsApp again at any time without affecting signals inside the dashboard.";
  const emailStatusTitle = !emailAddress
    ? "Email address required"
    : isEmailEnabled
      ? "Signal emails are enabled"
      : "Signal emails are paused";
  const emailStatusDescription = !emailAddress
    ? "Add a valid email address in your profile to receive signal alert emails."
    : isEmailEnabled
      ? "Signal alerts will continue to arrive in your inbox while account and billing emails remain unchanged."
      : "Only signal alert emails are paused. Security, billing, and account emails still continue normally.";

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
      const providerLabel = response.provider ? ` via ${response.provider}` : "";
      const phoneLabel = response.to || whatsappPhone || "your phone";
      const actionLabel = response.queued ? "queued for" : "sent to";
      toast.success(`WhatsApp test ${actionLabel} ${phoneLabel}${providerLabel}.`);
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
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 pb-10 pt-4 sm:px-4">
      <section className="relative overflow-hidden rounded-[32px] border border-black/5 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(16,185,129,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.24),transparent)]" />
        <div className="relative grid gap-6 px-5 py-6 sm:px-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <Bell className="h-3.5 w-3.5" />
                  Alert Delivery Center
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    Manage every signal delivery channel from one place
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                    Configure Telegram, WhatsApp, and email with clear status tracking, direct
                    action controls, and profile-linked delivery details. This page controls only how
                    eligible signals are delivered, not whether signals remain visible inside the app.
                  </p>
                </div>
              </div>

              <Button asChild variant="outline" className="h-11 rounded-2xl px-4">
                <Link href="/dashboard/profile">
                  Review Profile Details
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <OverviewTile
                icon={MessageCircle}
                label="Telegram"
                value={telegramSummary}
                helper={
                  isConnected
                    ? `Linked to ${telegramConnectedUserLabel}.`
                    : "Connect the MSPK bot and press Start once to activate private Telegram delivery."
                }
                tone={telegramTone}
              />
              <OverviewTile
                icon={Smartphone}
                label="WhatsApp"
                value={whatsappSummary}
                helper={
                  whatsappPhone
                    ? `Current delivery number: ${whatsappPhone}.`
                    : "Add a valid phone number in your profile before using WhatsApp delivery."
                }
                tone={whatsappTone}
              />
              <OverviewTile
                icon={Mail}
                label="Email"
                value={emailSummary}
                helper={
                  emailAddress
                    ? `Signal alerts are linked to ${emailAddress}.`
                    : "Add a valid email address in your profile to receive signal emails."
                }
                tone={emailTone}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white/70 px-4 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>
                Signal delivery follows your plan eligibility and selected scripts. Turning off a
                channel never removes the signal feed from your dashboard.
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Delivery Snapshot
              </div>
              <div className="text-xl font-semibold text-foreground">Current account readiness</div>
              <p className="text-sm leading-6 text-muted-foreground">
                Review which delivery channels are active, which contact points are saved, and what
                should be updated next.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <SummaryRow
                label="Ready channels"
                value={`${readyChannelsCount} of 3`}
                helper="Channels count as ready only when a destination exists and the channel is enabled."
              />
              <SummaryRow
                label="Saved destinations"
                value={`${savedDestinationsCount} of 3`}
                helper="Telegram, phone number, and email are all tracked independently."
              />
              <SummaryRow
                label="Needs attention"
                value={attentionCount === 0 ? "All clear" : `${attentionCount} items`}
                helper="Use the sections below to connect, enable, or update delivery details."
              />
            </div>

            <div className="mt-4 rounded-3xl border border-primary/15 bg-primary/10 p-4">
              <div className="text-sm font-semibold text-foreground">Recommended next step</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {!isConnected
                  ? "Connect Telegram first if you want direct bot delivery for private alerts."
                  : !whatsappPhone
                    ? "Add a phone number in your profile before using WhatsApp delivery."
                    : !emailAddress
                      ? "Add a valid email address to keep a written alert history in your inbox."
                      : "Your profile already has the required destinations. Use the channel cards below to fine-tune delivery."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="overflow-hidden rounded-[30px] border border-black/5 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-black/5 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-5 dark:border-white/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Bot className="h-5 w-5 text-sky-500" />
                  Telegram Bot Delivery
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Deliver eligible signals to your private Telegram chat through the MSPK alert bot.
                  No public group or broadcast channel is required.
                </p>
              </div>
              <StatusBadge
                tone={telegramTone}
                icon={isConnected ? CheckCircle2 : AlertCircle}
              >
                {isConnected ? "Connected and ready" : pendingConnect ? "Waiting for confirmation" : "Connection required"}
              </StatusBadge>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <SectionNote
              tone={telegramTone}
              title={telegramStatusTitle}
              description={telegramStatusDescription}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoTile
                label="Bot account"
                value={`@${botUsername}`}
                helper="This is the official bot used for Telegram signal delivery."
              />
              <InfoTile
                label="Linked Telegram account"
                value={telegramConnectedUserLabel}
                helper="This Telegram account will receive direct alert messages."
              />
              <InfoTile
                label="Last connection check"
                value={formatConnectedAt(telegram?.connectedAt)}
                helper="Refresh after pressing Start in Telegram to confirm the latest status."
              />
            </div>

            <div className="space-y-3 rounded-3xl border border-sky-500/15 bg-sky-500/[0.04] p-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Setup guide</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Complete this flow once for each Telegram account you want to use. If you switch
                  accounts later, reconnect and repeat the same steps.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <StepTile
                  step="1"
                  title="Generate a secure link"
                  description="Select Connect Telegram to create a private link tied to your MSPK account."
                />
                <StepTile
                  step="2"
                  title="Open Telegram"
                  description="Open the Telegram app or Telegram Web with the generated MSPK bot link."
                />
                <StepTile
                  step="3"
                  title="Press Start"
                  description="Press Start so the bot can securely attach your Telegram chat to this account."
                />
                <StepTile
                  step="4"
                  title="Confirm on this page"
                  description="Return here and use Refresh Status to confirm that the connection is active."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="h-11 rounded-2xl px-4"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                {isConnected ? "Reconnect Telegram" : "Connect Telegram"}
              </Button>

              {pendingConnect ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.assign(pendingConnect.connectUrl);
                      }
                    }}
                    className="h-11 rounded-2xl px-4"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Telegram App
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-2xl px-4">
                    <a href={telegramWebUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open Telegram Web
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyCommand}
                    className="h-11 rounded-2xl px-4"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Start Command
                  </Button>
                </>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={meQuery.isFetching}
                className="h-11 rounded-2xl px-4"
              >
                {meQuery.isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Status
              </Button>

              {isConnected ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="h-11 rounded-2xl px-4"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              ) : null}
            </div>

            {pendingConnect ? (
              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">Manual desktop fallback</div>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      If the deep link does not open automatically, use Telegram Web, find the MSPK
                      bot, and send the command below manually.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCopyCommand}
                    className="h-10 rounded-2xl px-4"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Command
                  </Button>
                </div>
                <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.04] px-4 py-4 font-mono text-sm text-foreground dark:border-white/10 dark:bg-white/[0.03]">
                  {pendingConnect.startCommand}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-[30px] border border-black/5 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="border-b border-black/5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent px-5 py-5 dark:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Smartphone className="h-5 w-5 text-emerald-500" />
                    WhatsApp Delivery
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Send eligible signal alerts to the phone number stored in your profile.
                  </p>
                </div>
                <StatusBadge
                  tone={whatsappTone}
                  icon={isWhatsAppEnabled && whatsappPhone ? CheckCircle2 : AlertCircle}
                >
                  {whatsappSummary}
                </StatusBadge>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <SectionNote
                tone={whatsappTone}
                title={whatsappStatusTitle}
                description={whatsappStatusDescription}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile
                  label="Delivery number"
                  value={whatsappPhone || "No phone number saved"}
                  helper={
                    whatsappPhone
                      ? "Test messages and live signal alerts use this saved number."
                      : "Add a phone number in Profile before enabling WhatsApp delivery."
                  }
                />
                <InfoTile
                  label="Channel state"
                  value={whatsappSummary}
                  helper="Disable this channel if you want signals in the app only without WhatsApp delivery."
                />
              </div>

              <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-sm font-semibold text-foreground">What the test confirms</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A successful test confirms that the request was accepted for the saved phone
                  number. Live signal delivery still depends on plan eligibility and selected
                  scripts.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant={isWhatsAppEnabled ? "outline" : "default"}
                  onClick={handleWhatsAppToggle}
                  disabled={updateMeMutation.isPending || !whatsappPhone}
                  className="h-11 rounded-2xl px-4"
                >
                  {updateMeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                  {whatsappPhone ? (isWhatsAppEnabled ? "Pause WhatsApp Delivery" : "Enable WhatsApp Delivery") : "Add Phone in Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleWhatsAppTest}
                  disabled={whatsappTestMutation.isPending || !whatsappPhone}
                  className="h-11 rounded-2xl px-4"
                >
                  {whatsappTestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                  Send Test Message
                </Button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[30px] border border-black/5 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="border-b border-black/5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent px-5 py-5 dark:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Mail className="h-5 w-5 text-amber-500" />
                    Email Delivery
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Send signal alerts to the email address connected to your account.
                  </p>
                </div>
                <StatusBadge
                  tone={emailTone}
                  icon={isEmailEnabled && emailAddress ? CheckCircle2 : AlertCircle}
                >
                  {emailSummary}
                </StatusBadge>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <SectionNote
                tone={emailTone}
                title={emailStatusTitle}
                description={emailStatusDescription}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile
                  label="Delivery email"
                  value={emailAddress || "No email address saved"}
                  helper="Signal alert emails can be controlled here without affecting account, billing, or security emails."
                />
                <InfoTile
                  label="Channel state"
                  value={emailSummary}
                  helper="Keep this enabled if you want a written history of signals in your inbox."
                />
              </div>

              <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-sm font-semibold text-foreground">What stays unaffected</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This control only affects signal alert emails. OTPs, account notices, billing
                  updates, and other service emails continue normally.
                </p>
              </div>

              <Button
                type="button"
                variant={isEmailEnabled ? "outline" : "default"}
                onClick={handleEmailToggle}
                disabled={updateMeMutation.isPending || !emailAddress}
                className="h-11 rounded-2xl px-4"
              >
                {updateMeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {isEmailEnabled ? "Pause Signal Emails" : "Enable Signal Emails"}
              </Button>
            </div>
          </section>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">How delivery is decided</div>
            <p className="text-sm leading-6 text-muted-foreground">
              These rules explain why a signal may appear in the app but not be delivered to every
              external channel.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            <RuleTile
              icon={ShieldCheck}
              title="Plan-based access"
              description="Premium signal alerts are sent only to users whose paid or demo access allows that signal stream."
            />
            <RuleTile
              icon={UserRound}
              title="Selected script matching"
              description="External delivery follows the scripts selected in your watchlist so that connected channels receive only relevant alerts."
            />
            <RuleTile
              icon={Bell}
              title="Channel-specific control"
              description="Pausing WhatsApp or email affects only that channel. The in-app signal feed remains available."
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-black/5 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">Before you test a channel</div>
            <p className="text-sm leading-6 text-muted-foreground">
              Use this quick checklist to avoid failed tests and incomplete connections.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <RuleTile
              icon={CheckCircle2}
              title="Telegram"
              description="Generate the link, open the bot, press Start, then refresh this page to confirm the connection."
            />
            <RuleTile
              icon={Smartphone}
              title="WhatsApp"
              description="Confirm that your profile phone number is correct before sending a test message."
            />
            <RuleTile
              icon={Mail}
              title="Email"
              description="Leave signal emails enabled if you want a written record of alerts in your inbox."
            />
          </div>
          <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/10 px-4 py-4 text-sm leading-6 text-primary">
            {profileName}, if any delivery target on this page looks outdated, update it from the
            Profile page before testing again.
          </div>
        </div>
      </section>
    </div>
  );
}
