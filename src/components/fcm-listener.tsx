'use client';

import { useEffect } from 'react';
import { listenForForegroundMessages } from '@/lib/fcm';

export function FcmListener() {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      unsubscribe = await listenForForegroundMessages((payload) => {
        const notification = payload?.notification as { title?: string; body?: string; icon?: string } | undefined;
        const title = notification?.title || 'New Notification';
        const options = {
          body: notification?.body,
          icon: notification?.icon || '/logo.jpg',
        };

        if (Notification.permission === 'granted') {
          const popup = new Notification(title, options);
          popup.onclick = () => {
            window.focus();
            window.location.href = '/dashboard/notifications';
          };
        } else {
          console.log('FCM message (foreground):', payload);
        }
      });
    })();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return null;
}
