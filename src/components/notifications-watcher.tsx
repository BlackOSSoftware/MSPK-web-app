'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getNotifications } from '@/services/notifications/notification.service';
import { NOTIFICATIONS_QUERY_KEY } from '@/services/notifications/notification.hooks';
import type { NotificationItem, NotificationListResponse } from '@/services/notifications/notification.types';
import { getAuthExpiresAt, getAuthToken } from '@/lib/auth/session';

const LAST_SEEN_AT_KEY = 'mspk_notifications_last_seen_at_v1';
const SEEN_IDS_KEY = 'mspk_notifications_seen_ids_v1';
const NOTIFICATION_PERMISSION_KEY = 'mspk_notifications_permission_v1';
const DASHBOARD_NOTIFICATIONS_PATH = '/dashboard/notifications';
const MAX_SEEN_IDS = 200;

function normalizeNotifications(data: NotificationListResponse | NotificationItem[] | undefined) {
  const items = Array.isArray(data) ? data : data?.results ?? [];
  return items.filter(Boolean);
}

function readLastSeenAt(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LAST_SEEN_AT_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function writeLastSeenAt(value: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_SEEN_AT_KEY, String(value));
}

function readSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function writeSeenIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  const list = Array.from(ids);
  const trimmed = list.slice(Math.max(list.length - MAX_SEEN_IDS, 0));
  window.localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(trimmed));
}

function getCreatedAtMs(item: NotificationItem): number | null {
  if (!item?.createdAt) return null;
  const parsed = Date.parse(item.createdAt);
  return Number.isFinite(parsed) ? parsed : null;
}

function getNotificationSocketUrl(token: string): string {
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) {
    throw new Error('Missing NEXT_PUBLIC_API_URL');
  }

  const base = apiBase.replace(/\/v1\/?$/, '');
  const wsProtocol = base.startsWith('https://') ? 'wss://' : 'ws://';
  const host = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `${wsProtocol}${host}/?token=${encodeURIComponent(token)}`;
}

export function NotificationsWatcher() {
  const token = getAuthToken();
  const expiresAt = getAuthExpiresAt();
  const hasValidSession = Boolean(token && expiresAt);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
    // Fallback for cases where push delivery fails (keeps UI near real-time).
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchOnReconnect: true,
    staleTime: 30_000,
    enabled: hasValidSession,
  });

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const notifyItem = useCallback((item: NotificationItem) => {
    const title = item.title || 'New Notification';
    const body = item.message || item.body || '';

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, { body, icon: '/logo.jpg' });
      notification.onclick = () => {
        window.focus();
        window.location.href = item.link || DASHBOARD_NOTIFICATIONS_PATH;
      };
      return;
    }

    toast(title, { description: body });
  }, []);

  const syncNotificationCaches = useCallback((item: NotificationItem) => {
    const apply = (previous: NotificationListResponse | NotificationItem[] | undefined) => {
      const base = Array.isArray(previous)
        ? { results: previous, unreadCount: previous.filter((entry) => !entry?.isRead).length }
        : previous || { results: [], unreadCount: 0 };

      const currentItems = Array.isArray(base.results) ? base.results : [];
      if (currentItems.some((entry) => entry?._id === item._id)) {
        return previous;
      }

      const nextResults = [item, ...currentItems];
      const currentUnread = typeof base.unreadCount === 'number'
        ? base.unreadCount
        : currentItems.filter((entry) => !entry?.isRead).length;

      return {
        ...base,
        results: nextResults,
        unreadCount: item.isRead ? currentUnread : currentUnread + 1,
      };
    };

    queryClient.setQueryData(['notifications'], apply);
    queryClient.setQueryData(['notifications', 'watcher'], apply);
  }, [queryClient]);

  const processIncomingNotification = useCallback((item: NotificationItem) => {
    if (!item?._id || seenIdsRef.current.has(item._id)) {
      return;
    }

    seenIdsRef.current.add(item._id);
    const createdAt = getCreatedAtMs(item);
    if (createdAt) {
      const lastSeenAt = readLastSeenAt();
      if (!lastSeenAt || createdAt > lastSeenAt) {
        writeLastSeenAt(createdAt);
      }
    }
    writeSeenIds(seenIdsRef.current);
    syncNotificationCaches(item);
    notifyItem(item);
  }, [notifyItem, syncNotificationCaches]);

  useEffect(() => {
    if (!hasValidSession) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    if (window.localStorage.getItem(NOTIFICATION_PERMISSION_KEY)) return;

    Notification.requestPermission().finally(() => {
      window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'requested');
    });
  }, [hasValidSession]);

  useEffect(() => {
    const items = normalizeNotifications(data);
    if (items.length === 0) return;

    if (!initializedRef.current) {
      seenIdsRef.current = readSeenIds();
      let maxCreatedAt: number | null = readLastSeenAt();

      items.forEach((item) => {
        if (item?._id) {
          seenIdsRef.current.add(item._id);
        }
        const createdAt = item ? getCreatedAtMs(item) : null;
        if (createdAt && (!maxCreatedAt || createdAt > maxCreatedAt)) {
          maxCreatedAt = createdAt;
        }
      });

      if (maxCreatedAt) {
        writeLastSeenAt(maxCreatedAt);
      }
      writeSeenIds(seenIdsRef.current);
      initializedRef.current = true;
      return;
    }

    const lastSeenAt = readLastSeenAt();
    const newItems = items.filter((item) => item?._id && !seenIdsRef.current.has(item._id));

    newItems.forEach((item) => {
      if (!item?._id) return;
      const createdAt = getCreatedAtMs(item);
      if (createdAt && lastSeenAt && createdAt <= lastSeenAt) {
        seenIdsRef.current.add(item._id);
        return;
      }

      seenIdsRef.current.add(item._id);

      const title = item.title || 'New Notification';
      const body = item.message || item.body || '';

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, { body, icon: '/logo.jpg' });
        notification.onclick = () => {
          window.focus();
          window.location.href = DASHBOARD_NOTIFICATIONS_PATH;
        };
      } else {
        toast(title, { description: body });
      }
    });

    let maxCreatedAt = lastSeenAt ?? null;
    items.forEach((item) => {
      const createdAt = item ? getCreatedAtMs(item) : null;
      if (createdAt && (!maxCreatedAt || createdAt > maxCreatedAt)) {
        maxCreatedAt = createdAt;
      }
    });
    if (maxCreatedAt) {
      writeLastSeenAt(maxCreatedAt);
    }
    writeSeenIds(seenIdsRef.current);
  }, [data]);

  useEffect(() => {
    if (!hasValidSession || !token || typeof window === 'undefined') {
      return;
    }

    let closedByEffect = false;

    const clearReconnect = () => {
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (closedByEffect) return;
      clearReconnect();
      const waitMs = Math.min(6000, 1200 + reconnectAttemptsRef.current * 500);
      reconnectAttemptsRef.current += 1;
      reconnectRef.current = window.setTimeout(() => {
        connect();
      }, waitMs);
    };

    const connect = () => {
      if (closedByEffect) return;

      let socketUrl = '';
      try {
        socketUrl = getNotificationSocketUrl(token);
      } catch {
        return;
      }

      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as { type?: string; payload?: unknown };
          if (message.type !== 'notification:new') return;
          if (!message.payload || typeof message.payload !== 'object') return;
          processIncomingNotification(message.payload as NotificationItem);
        } catch {
          // ignore malformed payloads
        }
      };

      socket.onerror = () => {
        socket.close();
      };

      socket.onclose = () => {
        if (closedByEffect) return;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      clearReconnect();
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.close();
      }
    };
  }, [hasValidSession, token, processIncomingNotification]);

  return null;
}
