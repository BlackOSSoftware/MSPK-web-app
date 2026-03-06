/* Firebase Messaging service worker */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

let messagingInitialized = false;

async function initMessaging() {
  if (messagingInitialized) return;

  const response = await fetch("/firebase-config.json", { cache: "no-store" });
  const firebaseConfig = await response.json();

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || payload?.data?.title || "New Notification";
    const options = {
      body: payload?.notification?.body || payload?.data?.body,
      icon: payload?.notification?.icon || "/logo.jpg",
      badge: "/logo.jpg",
      data: payload?.data || {},
    };
    self.registration.showNotification(title, options);
  });

  messagingInitialized = true;
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await initMessaging();
    })()
  );
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      await initMessaging();

      // Fallback for data-only payloads (avoid missing notifications on first push)
      let payload = null;
      try {
        payload = event.data ? event.data.json() : null;
      } catch {
        payload = null;
      }

      const notificationPayload = payload?.notification;
      const dataPayload = payload?.data || payload;

      // Show only if it's data-only (no notification block)
      if (!notificationPayload && dataPayload) {
        const title = dataPayload.title || "New Notification";
        const options = {
          body: dataPayload.body,
          icon: dataPayload.icon || "/logo.jpg",
          badge: "/logo.jpg",
          data: dataPayload || {},
        };
        self.registration.showNotification(title, options);
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target =
    event.notification?.data?.url ||
    event.notification?.data?.click_action ||
    "/dashboard/notifications";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = allClients.find((client) => client.url.includes(target));
      if (existing) {
        await existing.focus();
        return;
      }
      await self.clients.openWindow(target);
    })()
  );
});
