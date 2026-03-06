"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { getFcmToken } from "@/lib/fcm";
import { registerFcmToken } from "@/services/notifications/notification.service";

type DebugState = {
  isNative: boolean;
  token: string | null;
  registeredToken: string | null;
  lastNotification: string | null;
  lastError: string | null;
  permission: NotificationPermission | "unsupported";
  swStatus: string;
};

export function NotificationsDebugPanel() {
  const [state, setState] = useState<DebugState>({
    isNative: Capacitor.isNativePlatform(),
    token: null,
    registeredToken: null,
    lastNotification: null,
    lastError: null,
    permission: "unsupported",
    swStatus: "unknown",
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readState = () => {
      const permission = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
      const swStatus =
        typeof navigator !== "undefined" && "serviceWorker" in navigator ? "available" : "unavailable";
      setState({
        isNative: Capacitor.isNativePlatform(),
        token: window.localStorage.getItem("native_fcm_token") || window.localStorage.getItem("web_fcm_token"),
        registeredToken:
          window.localStorage.getItem("native_fcm_registered_token") ||
          window.localStorage.getItem("native_fcm_registered_token_v2") ||
          window.localStorage.getItem("web_fcm_registered_token") ||
          window.localStorage.getItem("web_fcm_registered_token_v2"),
        lastNotification: window.localStorage.getItem("native_last_notification"),
        lastError: window.localStorage.getItem("native_push_error") || window.localStorage.getItem("web_push_error"),
        permission,
        swStatus,
      });
    };

    readState();
    const id = window.setInterval(readState, 3000);
    return () => window.clearInterval(id);
  }, []);

  const refreshWebToken = async () => {
    if (typeof window === "undefined") return;
    if (state.isNative) return;
    setIsRefreshing(true);
    try {
      const keys = [
        "web_fcm_token",
        "web_fcm_registered_token",
        "web_fcm_registered_token_v2",
        "web_push_error",
      ];
      keys.forEach((key) => window.localStorage.removeItem(key));

      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));

      const token = await getFcmToken();
      if (!token) {
        window.localStorage.setItem("web_push_error", "token_missing");
        return;
      }

      window.localStorage.setItem("web_fcm_token", token);
      await registerFcmToken({ token, platform: "web" });
      window.localStorage.setItem("web_fcm_registered_token_v2", token);
    } catch (err) {
      try {
        window.localStorage.setItem("web_push_error", String(err ?? "unknown_error"));
      } catch {
        // ignore storage errors
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 text-xs text-slate-600 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700/60 dark:bg-slate-950/70 dark:text-slate-300">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Notification Debug
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-7 px-2 text-[10px]"
            onClick={() => {
              if (!state.token) return;
              navigator.clipboard?.writeText(state.token);
            }}
          >
            Copy Token
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-7 px-2 text-[10px]"
            onClick={refreshWebToken}
            disabled={state.isNative || isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Token"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-7 px-2 text-[10px]"
            onClick={() => {
              if (typeof Notification === "undefined") return;
              Notification.requestPermission();
            }}
            disabled={state.isNative || state.permission === "granted"}
          >
            Request Permission
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <p>Platform: {state.isNative ? "Android/iOS" : "Web"}</p>
        <p>Token: {state.token ? `${state.token.slice(0, 12)}...` : "none"}</p>
        <p>Registered: {state.registeredToken ? "yes" : "no"}</p>
        <p>Last Error: {state.lastError ? "captured" : "none"}</p>
        <p>Last Notification: {state.lastNotification ? "captured" : "none"}</p>
        <p>Permission: {state.permission}</p>
        <p>Service Worker: {state.swStatus}</p>
      </div>
    </div>
  );
}
