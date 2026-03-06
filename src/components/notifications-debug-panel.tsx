"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";

type DebugState = {
  isNative: boolean;
  token: string | null;
  registeredToken: string | null;
  lastNotification: string | null;
  lastError: string | null;
};

export function NotificationsDebugPanel() {
  const [state, setState] = useState<DebugState>({
    isNative: Capacitor.isNativePlatform(),
    token: null,
    registeredToken: null,
    lastNotification: null,
    lastError: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readState = () => {
      setState({
        isNative: Capacitor.isNativePlatform(),
        token: window.localStorage.getItem("native_fcm_token") || window.localStorage.getItem("web_fcm_token"),
        registeredToken:
          window.localStorage.getItem("native_fcm_registered_token") ||
          window.localStorage.getItem("web_fcm_registered_token"),
        lastNotification: window.localStorage.getItem("native_last_notification"),
        lastError: window.localStorage.getItem("native_push_error"),
      });
    };

    readState();
    const id = window.setInterval(readState, 3000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-4 text-xs text-slate-600 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700/60 dark:bg-slate-950/70 dark:text-slate-300">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Notification Debug
        </p>
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
      </div>
      <div className="mt-3 space-y-1">
        <p>Platform: {state.isNative ? "Android/iOS" : "Web"}</p>
        <p>Token: {state.token ? `${state.token.slice(0, 12)}...` : "none"}</p>
        <p>Registered: {state.registeredToken ? "yes" : "no"}</p>
        <p>Last Error: {state.lastError ? "captured" : "none"}</p>
        <p>Last Notification: {state.lastNotification ? "captured" : "none"}</p>
      </div>
    </div>
  );
}
