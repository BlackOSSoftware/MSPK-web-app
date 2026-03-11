import axios from "axios";
import { apiClient } from "@/services/http/client";
import type {
  ChangePasswordPayload,
  LoginApiResponse,
  LoginPayload,
  MeResponse,
  RegisterApiResponse,
  RegisterPayload,
  SendOtpPayload,
  UpdateMePayload,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "./auth.types";

export async function login(payload: LoginPayload): Promise<LoginApiResponse> {
  const response = await apiClient.post<LoginApiResponse>("/auth/login", payload);
  return response.data;
}

export async function register(payload: RegisterPayload): Promise<RegisterApiResponse> {
  const normalizeSegment = (value: string) => {
    const key = value.trim().toLowerCase();
    if (!key) return null;
    if (key === "option" || key === "options") return "options";
    if (key === "nse") return "nse";
    if (key === "all") return "all";
    if (key === "mcx") return "mcx";
    if (key === "forex") return "forex";
    if (key === "crypto") return "crypto";
    return null;
  };

  const preferredSegments = Array.isArray(payload.segments)
    ? Array.from(
        new Set(
          payload.segments
            .map((segment) => (typeof segment === "string" ? normalizeSegment(segment) : null))
            .filter(
              (segment): segment is Exclude<ReturnType<typeof normalizeSegment>, null> =>
                segment !== null
            )
        )
      )
    : [];

  const requestBody: Record<string, unknown> = {
    name: payload.name?.trim(),
    email: payload.email?.trim(),
    password: payload.password,
  };

  if (typeof payload.phone === "string" && payload.phone.trim()) {
    requestBody.phone = payload.phone.trim();
  }
  if (typeof payload.tradingViewId === "string" && payload.tradingViewId.trim()) {
    requestBody.tradingViewId = payload.tradingViewId.trim();
  }
  if (typeof payload.referralCode === "string" && payload.referralCode.trim()) {
    requestBody.referralCode = payload.referralCode.trim();
  }
  if (typeof payload.city === "string" && payload.city.trim()) {
    requestBody.city = payload.city.trim();
  }
  if (preferredSegments.length > 0) {
    requestBody.segments = preferredSegments;
  }
  if (typeof payload.selectedPlanId === "string" && payload.selectedPlanId.trim()) {
    requestBody.selectedPlanId = payload.selectedPlanId.trim();
  }

  const response = await apiClient.post<RegisterApiResponse>("/auth/register", requestBody);
  return response.data;
}

export async function sendOtp(payload: SendOtpPayload): Promise<void> {
  await apiClient.post("/auth/send-otp", payload);
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  const response = await apiClient.post<VerifyOtpResponse>("/auth/verify-otp", payload);
  return response.data;
}

export async function getMe(): Promise<MeResponse> {
  const response = await apiClient.get<MeResponse>("/auth/me");
  return response.data;
}

export async function updateMe(payload: UpdateMePayload): Promise<MeResponse> {
  if (payload.avatarFile instanceof File) {
    const formData = new FormData();

    if (typeof payload.name === "string") formData.append("name", payload.name.trim());
    if (typeof payload.phone === "string") formData.append("phone", payload.phone.trim());
    if (typeof payload.tradingViewId === "string") formData.append("tradingViewId", payload.tradingViewId.trim());
    if (typeof payload.isWhatsAppEnabled === "boolean") formData.append("isWhatsAppEnabled", String(payload.isWhatsAppEnabled));
    if (typeof payload.isNotificationEnabled === "boolean") formData.append("isNotificationEnabled", String(payload.isNotificationEnabled));
    if (typeof payload.isEmailAlertEnabled === "boolean") formData.append("isEmailAlertEnabled", String(payload.isEmailAlertEnabled));
    if (typeof payload.profile?.address === "string") formData.append("profile[address]", payload.profile.address.trim());
    if (typeof payload.profile?.city === "string") formData.append("profile[city]", payload.profile.city.trim());
    if (typeof payload.profile?.state === "string") formData.append("profile[state]", payload.profile.state.trim());
    formData.append("avatar", payload.avatarFile);

    const response = await apiClient.patch<MeResponse>("/auth/me", formData);
    return response.data;
  }

  const jsonPayload: Record<string, unknown> = {};
  if (typeof payload.name === "string") jsonPayload.name = payload.name.trim();
  if (typeof payload.phone === "string") jsonPayload.phone = payload.phone.trim();
  if (typeof payload.tradingViewId === "string") jsonPayload.tradingViewId = payload.tradingViewId.trim();
  if (typeof payload.isWhatsAppEnabled === "boolean") jsonPayload.isWhatsAppEnabled = payload.isWhatsAppEnabled;
  if (typeof payload.isNotificationEnabled === "boolean") jsonPayload.isNotificationEnabled = payload.isNotificationEnabled;
  if (typeof payload.isEmailAlertEnabled === "boolean") jsonPayload.isEmailAlertEnabled = payload.isEmailAlertEnabled;

  if (
    typeof payload.profile?.address === "string" ||
    typeof payload.profile?.city === "string" ||
    typeof payload.profile?.state === "string"
  ) {
    jsonPayload.profile = {
      ...(typeof payload.profile?.address === "string" ? { address: payload.profile.address.trim() } : {}),
      ...(typeof payload.profile?.city === "string" ? { city: payload.profile.city.trim() } : {}),
      ...(typeof payload.profile?.state === "string" ? { state: payload.profile.state.trim() } : {}),
    };
  }

  const response = await apiClient.patch<MeResponse>("/auth/me", jsonPayload);
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      return;
    }
    throw error;
  }
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post("/auth/change-password", payload);
}
