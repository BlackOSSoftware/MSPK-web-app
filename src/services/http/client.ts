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

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const authHeader =
        (error.config?.headers as Record<string, unknown> | undefined)?.Authorization ??
        (error.config?.headers as Record<string, unknown> | undefined)?.authorization;
      const hasAuthHeader = typeof authHeader === "string" && authHeader.trim().length > 0;
      const hasSession = Boolean(getAuthToken());
      const expiresAt = getAuthExpiresAt();
      const isExpired = Boolean(expiresAt && expiresAt <= Date.now());

      if (!hasAuthHeader && !hasSession) {
        return Promise.reject(error);
      }

      if (isExpired) {
        clearAuthSession();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient };
