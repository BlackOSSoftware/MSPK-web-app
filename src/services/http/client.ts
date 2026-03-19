import axios, { AxiosError } from "axios";
import { clearAuthSession, getAuthExpiresAt, getAuthToken } from "@/lib/auth/session";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL. Set it in .env.local.");
}

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

function getErrorMessage(data: unknown): string {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;
  const directMessage = record.message;
  if (typeof directMessage === "string") return directMessage;

  const nestedError = record.error;
  if (typeof nestedError === "string") return nestedError;
  if (nestedError && typeof nestedError === "object") {
    const nestedRecord = nestedError as Record<string, unknown>;
    if (typeof nestedRecord.message === "string") return nestedRecord.message;
  }

  return "";
}

function isExternalMarketAuthError(error: AxiosError): boolean {
  const path = String(error.config?.url || "").toLowerCase();
  if (!path.startsWith("/market/")) return false;

  const message = getErrorMessage(error.response?.data).toLowerCase();
  if (!message) return false;

  const mentionsProvider = message.includes("kite") || message.includes("zerodha");
  const mentionsReconnect = message.includes("reconnect");
  const mentionsProviderSession =
    message.includes("session expired") ||
    message.includes("invalid") ||
    message.includes("access token") ||
    message.includes("api_key");

  return mentionsProvider && (mentionsReconnect || mentionsProviderSession);
}

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  const expiresAt = getAuthExpiresAt();

  if (expiresAt && expiresAt <= Date.now()) {
    clearAuthSession();
    return config;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      if (isExternalMarketAuthError(error)) {
        return Promise.reject(error);
      }

      const authHeader =
        (error.config?.headers as Record<string, unknown> | undefined)?.Authorization ??
        (error.config?.headers as Record<string, unknown> | undefined)?.authorization;
      const hasAuthHeader = typeof authHeader === "string" && authHeader.trim().length > 0;
      const hasSession = Boolean(getAuthToken());

      if (!hasAuthHeader && !hasSession) {
        return Promise.reject(error);
      }

      clearAuthSession();
      const path = window.location.pathname || "/";
      const skipRedirect = path === "/login" || path.startsWith("/trial");
      if (!skipRedirect) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
