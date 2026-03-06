"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useRegisterFcmTokenMutation } from "@/services/notifications/notification.hooks";
import { getAuthToken } from "@/lib/auth/session";

type PushToken = {
  value: string;
};

export function CapacitorPushInit() {
  const registerTokenMutation = useRegisterFcmTokenMutation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const TOKEN_KEY = "native_fcm_token";
    const REGISTERED_KEY = "native_fcm_registered_token";
    const LAST_NOTIFICATION_KEY = "native_last_notification";
    const LAST_ERROR_KEY = "native_push_error";

    const tryRegisterToken = async () => {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      const registered = window.localStorage.getItem(REGISTERED_KEY);
      if (registered === token) return;
      if (!getAuthToken()) return;

      try {
        await registerTokenMutation.mutateAsync({ token, platform: "android" });
        window.localStorage.setItem(REGISTERED_KEY, token);
      } catch {
        // ignore registration errors
      }
    };

    const init = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

      await LocalNotifications.createChannel({
        id: "mspk-alerts",
        name: "MSPK Alerts",
        description: "Trading alerts and system notifications",
        importance: 5,
        visibility: 1,
        sound: "default",
      });

      await PushNotifications.register();

      const registrationListener = await PushNotifications.addListener(
        "registration",
        async (token: PushToken) => {
          try {
            const storedToken =
              window.localStorage.getItem("fcm_token") || window.localStorage.getItem("fcmToken");
            if (token.value && token.value !== storedToken) {
              window.localStorage.setItem("fcm_token", token.value);
            }
            if (token.value) {
              window.localStorage.setItem(TOKEN_KEY, token.value);
              window.localStorage.removeItem(LAST_ERROR_KEY);
              await tryRegisterToken();
            }
          } catch {
            // ignore token registration errors
          }
        }
      );

      const registrationErrorListener = await PushNotifications.addListener("registrationError", (error) => {
        try {
          window.localStorage.setItem(LAST_ERROR_KEY, JSON.stringify(error ?? {}));
        } catch {
          // ignore storage errors
        }
      });

      const receivedListener = await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
        try {
          window.localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(notification ?? {}));
        } catch {
          // ignore storage errors
        }
        await LocalNotifications.requestPermissions();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: notification.title ?? "MSPK Trading Solutions",
              body: notification.body ?? "",
              channelId: "mspk-alerts",
              schedule: { at: new Date(Date.now() + 100) },
            },
          ],
        });
      });

      const actionListener = await PushNotifications.addListener("pushNotificationActionPerformed", () => {
        window.location.href = "/dashboard/notifications";
      });

      await tryRegisterToken();

      const retryId = window.setInterval(tryRegisterToken, 15000);

      return () => {
        registrationListener.remove();
        registrationErrorListener.remove();
        receivedListener.remove();
        actionListener.remove();
        window.clearInterval(retryId);
      };
    };

    let cleanup: (() => void) | undefined;
    void init().then((dispose) => {
      cleanup = dispose;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [registerTokenMutation]);

  return null;
}
