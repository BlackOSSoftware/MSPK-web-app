"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Bell, CheckCircle2, Copy, ExternalLink, Loader2, Mail, MessageCircle, RefreshCw, Smartphone, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useMeQuery, useUpdateMeMutation } from "@/hooks/use-auth";
import {
  disconnectTelegram,
  getTelegramConnectLink,
  sendWhatsAppTestMessage,
} from "@/services/notifications/notification.service";

function formatConnectedAt(value?: string | null) {
  if (!value) {
    return "Not connected";
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

export default function AlertsPage() {
  const meQuery = useMeQuery();
  const updateMeMutation = useUpdateMeMutation();
  const [pendingConnect, setPendingConnect] = useState<{ connectUrl: string; startCommand: string } | null>(null);
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
  const botUsername = telegram?.botUsername || "Mspk_alert_bot";
  const telegramUrl = `https://t.me/${botUsername}`;
  const telegramWebUrl = `https://web.telegram.org/k/#@${botUsername}`;
  const whatsappTestMutation = useMutation({
    mutationFn: () => sendWhatsAppTestMessage(),
  });

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
      toast.info("Telegram app installed nahi hai to Open Telegram Web use karo aur copied command paste karo.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Telegram connect link generate nahi ho saka"));
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await meQuery.refetch();
      if (result.data?.telegram?.connected) {
        toast.success("Telegram successfully connected");
      } else {
        toast.info("Bot me Start dabane ke baad fir se Refresh Status karo");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Telegram status refresh nahi ho saka"));
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      await meQuery.refetch();
      toast.success("Telegram disconnected");
    } catch (error) {
      toast.error(getErrorMessage(error, "Telegram disconnect nahi ho saka"));
    }
  };

  const handleEmailToggle = async () => {
    try {
      await updateMeMutation.mutateAsync({
        isEmailAlertEnabled: !isEmailEnabled,
      });
      toast.success(`Signal email alerts ${!isEmailEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Email alert preference update nahi ho saka"));
    }
  };

  const handleWhatsAppTest = async () => {
    try {
      const response = await whatsappTestMutation.mutateAsync();
      const providerLabel = response.provider ? ` via ${response.provider}` : "";
      const phoneLabel = response.to || whatsappPhone || "your phone";
      toast.success(`WhatsApp test sent to ${phoneLabel}${providerLabel}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "WhatsApp test send nahi ho saka"));
    }
  };

  const handleWhatsAppToggle = async () => {
    try {
      await updateMeMutation.mutateAsync({
        isWhatsAppEnabled: !isWhatsAppEnabled,
      });
      toast.success(`Signal WhatsApp alerts ${!isWhatsAppEnabled ? "enabled" : "disabled"}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "WhatsApp alert preference update nahi ho saka"));
    }
  };

  const handleCopyCommand = async () => {
    if (!pendingConnect?.startCommand || typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Copy command available nahi hai");
      return;
    }

    try {
      await navigator.clipboard.writeText(pendingConnect.startCommand);
      toast.success("Start command copied");
    } catch {
      toast.error("Command copy nahi ho saka");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-3 pb-10 pt-4 sm:px-4">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Bell className="text-primary" /> Alert Channels
        </h1>
        <p className="text-sm text-muted-foreground">
          Paid aur demo users ke liye direct delivery setup. Telegram ab direct user bot connection se chalega, refresh timer se nahi.
        </p>
      </div>

      <section className="overflow-hidden rounded-3xl border border-black/5 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-transparent px-5 py-4 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <MessageCircle className="h-4 w-4 text-sky-500" />
              Telegram Direct Alerts
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Signal alerts connected Telegram chat par direct aayenge. Channel join karne ki zarurat nahi.
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              isConnected
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
            }`}
          >
            {isConnected ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {isConnected ? "Connected" : "Waiting for bot start"}
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Bot</div>
                <a href={telegramUrl} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-semibold text-foreground hover:text-primary">
                  @{botUsername}
                </a>
              </div>
              <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Connected User</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{telegram?.username ? `@${telegram.username}` : "Not linked yet"}</div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Last Update</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{formatConnectedAt(telegram?.connectedAt)}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.04] px-4 py-4">
              <div className="text-sm font-semibold text-foreground">Setup flow</div>
              <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                <li>1. `Connect Telegram` dabao.</li>
                <li>2. Bot khulega aur deep-link se tumhara account identify hoga.</li>
                <li>3. Telegram me `Start` dabao.</li>
                <li>4. Wapas aake `Refresh Status` karo.</li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                {isConnected ? "Reconnect Telegram" : "Connect Telegram"}
              </button>
              {pendingConnect ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.location.assign(pendingConnect.connectUrl);
                      }
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-sky-500/20 px-4 text-sm font-semibold text-sky-700 dark:text-sky-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Telegram App
                  </button>
                  <a
                    href={telegramWebUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-foreground dark:border-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Telegram Web
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyCommand}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-foreground dark:border-white/10"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Start Command
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={meQuery.isFetching}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-foreground disabled:opacity-60 dark:border-white/10"
              >
                {meQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh Status
              </button>
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-500/20 px-4 text-sm font-semibold text-rose-600 disabled:opacity-60 dark:text-rose-300"
                >
                  {disconnectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
                  Disconnect
                </button>
              ) : null}
            </div>

            {pendingConnect ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-4">
                <div className="text-sm font-semibold text-foreground">Desktop fallback</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Agar browser `tg://` error de raha hai to `Open Telegram Web` kholo, bot search karo, phir ye command bhejo.
                </p>
                <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.04] px-3 py-3 font-mono text-xs text-foreground dark:border-white/10 dark:bg-white/[0.03]">
                  {pendingConnect.startCommand}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-4">
              <div className="text-sm font-semibold text-foreground">Delivery rule</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Telegram alerts sirf connected paid ya demo users ko jayenge. Free user ya disconnected account ko signal bot message nahi milega.
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Smartphone className="h-4 w-4 text-emerald-500" />
                WhatsApp
              </div>
              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isWhatsAppEnabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {isWhatsAppEnabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {isWhatsAppEnabled ? "Signal WhatsApp on" : "Signal WhatsApp off"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Signal alerts aapke profile phone number par jayenge. Isko yahin se on ya off kar sakte ho. Default setting on rahegi.
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                Delivery number: <span className="font-semibold text-foreground">{whatsappPhone || "Profile phone missing"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppToggle}
                  disabled={updateMeMutation.isPending || !whatsappPhone}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-emerald-500/20 px-4 text-sm font-semibold text-emerald-700 disabled:opacity-60 dark:text-emerald-200"
                >
                  {updateMeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                  {whatsappPhone
                    ? isWhatsAppEnabled
                      ? "Turn Off WhatsApp Alerts"
                      : "Turn On WhatsApp Alerts"
                    : "Add Phone In Profile"}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppTest}
                  disabled={whatsappTestMutation.isPending || !whatsappPhone}
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-sky-500/20 px-4 text-sm font-semibold text-sky-700 disabled:opacity-60 dark:text-sky-200"
                >
                  {whatsappTestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                  Send Test WhatsApp
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="h-4 w-4 text-violet-500" />
                Email
              </div>
              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isEmailEnabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {isEmailEnabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {isEmailEnabled ? "Signal emails on" : "Signal emails off"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Is toggle se sirf signal alert emails control hongi. Account, billing, OTP, aur important service emails normal flow me aate rahenge.
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                Delivery email: <span className="font-semibold text-foreground">{meQuery.data?.email || "N/A"}</span>
              </div>
              <button
                type="button"
                onClick={handleEmailToggle}
                disabled={updateMeMutation.isPending || !meQuery.data?.email}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl border border-violet-500/20 px-4 text-sm font-semibold text-violet-700 disabled:opacity-60 dark:text-violet-200"
              >
                {updateMeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isEmailEnabled ? "Turn Off Email Alerts" : "Turn On Email Alerts"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
