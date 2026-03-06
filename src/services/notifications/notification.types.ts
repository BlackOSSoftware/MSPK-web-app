export type NotificationItem = {
  _id: string;
  title?: string;
  message?: string;
  body?: string;
  isRead?: boolean;
  readAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  type?: string;
};

export type RegisterFcmTokenPayload = {
  token: string;
  platform?: "web" | "android" | "ios";
};

export type NotificationListResponse = {
  results?: NotificationItem[];
  unreadCount?: number;
};
