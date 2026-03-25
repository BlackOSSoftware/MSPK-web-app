export type LoginPayload = {
  email: string;
  password: string;
  ip?: string;
};

export type LoginApiResponse = Record<string, unknown>;

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  referralCode?: string;
  city?: string;
  tradingViewId?: string;
  segments?: string[];
  selectedPlanId?: string | null;
};

export type RegisterApiResponse = Record<string, unknown>;

export type OtpChannel = "email" | "phone" | "whatsapp";

export type SendOtpResponse = {
  message?: string;
  target?: string;
  channel?: OtpChannel;
  dailyRemaining?: number;
  dailyLimit?: boolean;
};

export type SendOtpPayload = {
  type: OtpChannel;
  identifier: string;
};

export type VerifyOtpPayload = {
  type: OtpChannel;
  identifier: string;
  otp: string;
};

export type VerifyOtpResponse = Record<string, unknown>;

export type UserProfile = {
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
};

export type TelegramConnection = {
  connected?: boolean;
  chatId?: string | null;
  username?: string | null;
  displayName?: string | null;
  connectedAt?: string | null;
  botUsername?: string | null;
};

export type MeResponse = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  tradingViewId?: string;
  profile?: UserProfile;
  referral?: {
    code?: string;
  };
  subscription?: {
    plan?: string;
  };
  status?: string;
  walletBalance?: number;
  equity?: number;
  marginUsed?: number;
  pnl?: number;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  isWhatsAppEnabled?: boolean;
  isNotificationEnabled?: boolean;
  isEmailAlertEnabled?: boolean;
  isBlocked?: boolean;
  tokenVersion?: number;
  lastLoginIp?: string;
  clientId?: string;
  signalEmailAlertsAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
  planId?: string | null;
  planName?: string | null;
  permissions?: string[];
  planExpiry?: string | null;
  telegram?: TelegramConnection;
};

export type UpdateMePayload = {
  name?: string;
  phone?: string;
  tradingViewId?: string;
  isWhatsAppEnabled?: boolean;
  isNotificationEnabled?: boolean;
  isEmailAlertEnabled?: boolean;
  profile?: {
    address?: string;
    city?: string;
    state?: string;
  };
  avatarFile?: File | null;
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};
