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

    const root = document.documentElement;
    root.classList.add("native-platform");
    document.body?.classList.add("native-platform");

    const updateNativeSafeArea = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const safeTop = Math.max(0, viewport.offsetTop);
      const safeBottom = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
      root.style.setProperty("--native-safe-top", `${safeTop}px`);
      root.style.setProperty("--native-safe-bottom", `${safeBottom}px`);
      document.body?.style.setProperty("--native-safe-top", `${safeTop}px`);
      document.body?.style.setProperty("--native-safe-bottom", `${safeBottom}px`);
    };

    updateNativeSafeArea();
    window.addEventListener("resize", updateNativeSafeArea);
    window.visualViewport?.addEventListener("resize", updateNativeSafeArea);
    window.visualViewport?.addEventListener("scroll", updateNativeSafeArea);

    const TOKEN_KEY = "native_fcm_token";
    const REGISTERED_KEY = "native_fcm_registered_token_v2";
    const LAST_NOTIFICATION_KEY = "native_last_notification";
    const LAST_ERROR_KEY = "native_push_error";
    const LAST_PERMISSION_KEY = "native_push_permission";
    const LAST_REGISTER_AT_KEY = "native_push_registered_at";
    const platform = Capacitor.getPlatform();
    const isAndroid = platform === "android";

    const resolvePlatform = () => (platform === "ios" ? "ios" : "android");

    const tryRegisterToken = async () => {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      const registered = window.localStorage.getItem(REGISTERED_KEY);
      if (registered === token) return;
      if (!getAuthToken()) return;

      try {
        await registerTokenMutation.mutateAsync({ token, platform: resolvePlatform() });
        window.localStorage.setItem(REGISTERED_KEY, token);
        window.localStorage.setItem(LAST_REGISTER_AT_KEY, String(Date.now()));
      } catch {
        try {
          window.localStorage.setItem(LAST_ERROR_KEY, "register_failed");
        } catch {
          // ignore storage errors
        }
      }
    };

    const init = async () => {
      let permission = await PushNotifications.checkPermissions();
      if (permission.receive === "prompt") {
        permission = await PushNotifications.requestPermissions();
      }

      try {
        window.localStorage.setItem(LAST_PERMISSION_KEY, permission.receive || "unknown");
      } catch {
        // ignore storage errors
      }

      if (permission.receive !== "granted" && !isAndroid) {
        try {
          window.localStorage.setItem(LAST_ERROR_KEY, "permission_denied");
        } catch {
          // ignore storage errors
        }
        console.warn("[native-push] Permission denied:", permission.receive);
        return;
      }
      if (permission.receive !== "granted" && isAndroid) {
        console.warn("[native-push] Android permission not granted yet:", permission.receive);
      }

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
              console.log("[native-push] Token registered with backend");
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
        console.warn("[native-push] Registration error", error);
      });

      const receivedListener = await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
        try {
          window.localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(notification ?? {}));
        } catch {
          // ignore storage errors
        }
        console.log("[native-push] Foreground push received", notification);

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

      await LocalNotifications.requestPermissions();

      await LocalNotifications.createChannel({
        id: "mspk-alerts",
        name: "MSPK Alerts",
        description: "Trading alerts and system notifications",
        importance: 5,
        visibility: 1,
        sound: "default",
      });

      await PushNotifications.register();
      console.log("[native-push] Registering for push notifications");

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
      window.removeEventListener("resize", updateNativeSafeArea);
      window.visualViewport?.removeEventListener("resize", updateNativeSafeArea);
      window.visualViewport?.removeEventListener("scroll", updateNativeSafeArea);
      root.classList.remove("native-platform");
      document.body?.classList.remove("native-platform");
    };
  }, [registerTokenMutation]);

  return null;
}
