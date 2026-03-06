"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { getFcmToken } from "@/lib/fcm";
import { useRegisterFcmTokenMutation } from "@/services/notifications/notification.hooks";
import { getAuthToken } from "@/lib/auth/session";

const TOKEN_KEY = "web_fcm_token";
const REGISTERED_KEY = "web_fcm_registered_token";

export function WebPushInit() {
  const registerTokenMutation = useRegisterFcmTokenMutation();
  const token = getAuthToken();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!token) return;

    const register = async () => {
      const stored = window.localStorage.getItem(REGISTERED_KEY);
      const existing = window.localStorage.getItem(TOKEN_KEY);
      if (stored && stored === existing) return;

      const fcmToken = await getFcmToken();
      if (!fcmToken) return;

      window.localStorage.setItem(TOKEN_KEY, fcmToken);
      if (stored === fcmToken) return;

      try {
        await registerTokenMutation.mutateAsync({ token: fcmToken, platform: "web" });
        window.localStorage.setItem(REGISTERED_KEY, fcmToken);
      } catch {
        // ignore token registration errors
      }
    };

    void register();
  }, [token, registerTokenMutation]);

  return null;
}
