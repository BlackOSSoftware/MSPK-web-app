"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useRegisterFcmTokenMutation } from "@/services/notifications/notification.hooks";

type PushToken = {
  value: string;
};

export function CapacitorPushInit() {
  const registerTokenMutation = useRegisterFcmTokenMutation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== "granted") return;

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
              await registerTokenMutation.mutateAsync({ token: token.value });
            }
          } catch {
            // ignore token registration errors
          }
        }
      );

      const registrationErrorListener = await PushNotifications.addListener("registrationError", () => {
        // ignore registration errors
      });

      const receivedListener = await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
        await LocalNotifications.requestPermissions();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: notification.title ?? "MSPK Trading Solutions",
              body: notification.body ?? "",
              schedule: { at: new Date(Date.now() + 100) },
            },
          ],
        });
      });

      const actionListener = await PushNotifications.addListener("pushNotificationActionPerformed", () => {
        window.location.href = "/dashboard/notifications";
      });

      return () => {
        registrationListener.remove();
        registrationErrorListener.remove();
        receivedListener.remove();
        actionListener.remove();
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
