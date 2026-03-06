import { apiClient } from "@/services/http/client";
import type { NotificationItem, NotificationListResponse, RegisterFcmTokenRequest } from "./notification.types";

export async function getNotifications(): Promise<NotificationListResponse | NotificationItem[]> {
  const response = await apiClient.get<NotificationListResponse | NotificationItem[]>("/notifications");
  return response.data;
}

export async function getNotificationById(notificationId: string): Promise<NotificationItem> {
  const response = await apiClient.get<NotificationItem>(`/notifications/${notificationId}`);
  return response.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`/notifications/${notificationId}`);
}

export async function registerFcmToken(payload: RegisterFcmTokenRequest): Promise<void> {
  const { authToken, ...body } = payload;
  await apiClient.post("/notifications/fcm-token", body, authToken
    ? { headers: { Authorization: `Bearer ${authToken}` } }
    : undefined);
}
