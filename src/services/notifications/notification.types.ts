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
};

export type NotificationListResponse = {
  results?: NotificationItem[];
  unreadCount?: number;
};
