import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteNotification,
  getNotificationById,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  registerFcmToken,
} from "./notification.service";
import type { RegisterFcmTokenPayload } from "./notification.types";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
    enabled,
  });
}

export function useNotificationQuery(notificationId: string, enabled = true) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, notificationId],
    queryFn: () => getNotificationById(notificationId),
    enabled: enabled && Boolean(notificationId),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useRegisterFcmTokenMutation() {
  return useMutation({
    mutationFn: (payload: RegisterFcmTokenPayload) => registerFcmToken(payload),
  });
}
