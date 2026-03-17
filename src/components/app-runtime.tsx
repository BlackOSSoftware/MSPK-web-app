"use client";

import dynamic from "next/dynamic";

const FcmListener = dynamic(
  () => import("@/components/fcm-listener").then((mod) => mod.FcmListener),
  { ssr: false }
);

const CapacitorPushInit = dynamic(
  () => import("@/components/capacitor-push-init").then((mod) => mod.CapacitorPushInit),
  { ssr: false }
);

const NotificationsWatcher = dynamic(
  () => import("@/components/notifications-watcher").then((mod) => mod.NotificationsWatcher),
  { ssr: false }
);

const WebPushInit = dynamic(
  () => import("@/components/web-push-init").then((mod) => mod.WebPushInit),
  { ssr: false }
);

export function AppRuntime() {
  return (
    <>
      <FcmListener />
      <CapacitorPushInit />
      <WebPushInit />
      <NotificationsWatcher />
    </>
  );
}
