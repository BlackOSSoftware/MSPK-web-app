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
  link?: string | null;
  data?: Record<string, unknown>;
};

export type RegisterFcmTokenPayload = {
  token: string;
  platform?: "web" | "android" | "ios";
};

export type RegisterFcmTokenRequest = RegisterFcmTokenPayload & {
  authToken?: string;
};

export type NotificationListResponse = {
  results?: NotificationItem[];
  unreadCount?: number;
};

export type TelegramConnectionStatus = {
  connected?: boolean;
  chatId?: string | null;
  username?: string | null;
  connectedAt?: string | null;
  botUsername?: string | null;
};

export type TelegramConnectLinkResponse = {
  connectUrl: string;
  expiresAt?: string;
  telegram?: TelegramConnectionStatus;
};

export type TelegramDisconnectResponse = {
  message?: string;
  telegram?: TelegramConnectionStatus;
};
