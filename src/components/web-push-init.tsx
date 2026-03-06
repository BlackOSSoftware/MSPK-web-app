"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { getFcmToken } from "@/lib/fcm";
import { useRegisterFcmTokenMutation } from "@/services/notifications/notification.hooks";
import { getAuthToken } from "@/lib/auth/session";

const TOKEN_KEY = "web_fcm_token";
const REGISTERED_KEY = "web_fcm_registered_token_v2";
const LAST_ERROR_KEY = "web_push_error";
const LAST_SYNC_KEY = "web_fcm_last_sync_at_v1";
const FORCE_REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

export function WebPushInit() {
  const registerTokenMutation = useRegisterFcmTokenMutation();
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const tryRegister = async () => {
      const authToken = getAuthToken();
      if (!authToken) return;

      const stored = window.localStorage.getItem(REGISTERED_KEY);
      const existing = window.localStorage.getItem(TOKEN_KEY);
      const lastSyncRaw = window.localStorage.getItem(LAST_SYNC_KEY);
      const lastSync = lastSyncRaw ? Number(lastSyncRaw) : 0;
      const shouldForceRefresh = !lastSync || Date.now() - lastSync > FORCE_REFRESH_AFTER_MS;

      const fcmToken =
        (existing && !shouldForceRefresh ? existing : null) ||
        (await getFcmToken({ forceRefresh: shouldForceRefresh }));
      if (!fcmToken) return;

      window.localStorage.setItem(TOKEN_KEY, fcmToken);
      if (stored === fcmToken && !shouldForceRefresh) return;

      try {
        await registerTokenMutation.mutateAsync({ token: fcmToken, platform: "web" });
        window.localStorage.setItem(REGISTERED_KEY, fcmToken);
        window.localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
        window.localStorage.removeItem(LAST_ERROR_KEY);
      } catch {
        try {
          window.localStorage.setItem(LAST_ERROR_KEY, "register_failed");
        } catch {
          // ignore storage errors
        }
      }
    };

    void tryRegister();
    const id = window.setInterval(tryRegister, 15000);
    return () => window.clearInterval(id);
  }, [registerTokenMutation]);

  return null;
}
