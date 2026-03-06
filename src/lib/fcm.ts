import { getApps, initializeApp } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => Boolean(value));
}

export async function getFcmToken(options?: { forceRefresh?: boolean }) {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!('Notification' in window)) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if (!hasFirebaseConfig()) {
    console.warn('Missing Firebase config. Set NEXT_PUBLIC_FIREBASE_* env vars.');
    return null;
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('Missing VAPID key. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY.');
    return null;
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging();
  if (options?.forceRefresh) {
    try {
      await deleteToken(messaging);
    } catch {
      // ignore delete token errors and try to re-issue a token
    }
  }
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  return token || null;
}

export async function listenForForegroundMessages(
  onPayload: (payload: MessagePayload) => void
) {
  if (typeof window === 'undefined') return () => {};
  if (!('Notification' in window)) return () => {};

  const supported = await isSupported().catch(() => false);
  if (!supported) return () => {};
  if (!hasFirebaseConfig()) return () => {};

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  const messaging = getMessaging();
  const unsubscribe = onMessage(messaging, (payload) => {
    onPayload(payload);
  });

  return unsubscribe;
}
