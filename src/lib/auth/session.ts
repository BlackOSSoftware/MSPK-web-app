export const AUTH_TOKEN_COOKIE = "auth_token";
export const AUTH_EXPIRES_COOKIE = "auth_expires_at";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}

export function setCookie(name: string, value: string, expiresAtMs: number): void {
  if (typeof document === "undefined") return;

  const expires = new Date(expiresAtMs).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=Lax`;
}

export function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setAuthSession(token: string, expiresAtMs: number): void {
  setCookie(AUTH_TOKEN_COOKIE, token, expiresAtMs);
  setCookie(AUTH_EXPIRES_COOKIE, String(expiresAtMs), expiresAtMs);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_COOKIE, token);
    window.localStorage.setItem(AUTH_EXPIRES_COOKIE, String(expiresAtMs));
  }
}

export function clearAuthSession(): void {
  clearCookie(AUTH_TOKEN_COOKIE);
  clearCookie(AUTH_EXPIRES_COOKIE);

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_COOKIE);
    window.localStorage.removeItem(AUTH_EXPIRES_COOKIE);
  }
}

export function getAuthToken(): string | null {
  const cookie = getCookie(AUTH_TOKEN_COOKIE);
  if (cookie) return cookie;

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(AUTH_TOKEN_COOKIE);
    if (stored) return stored;
  }

  return null;
}

export function getAuthExpiresAt(): number | null {
  const value = getCookie(AUTH_EXPIRES_COOKIE);
  if (!value) {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(AUTH_EXPIRES_COOKIE);
      const storedParsed = stored ? Number(stored) : NaN;
      return Number.isFinite(storedParsed) ? storedParsed : null;
    }
    return null;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(AUTH_EXPIRES_COOKIE);
    const storedParsed = stored ? Number(stored) : NaN;
    return Number.isFinite(storedParsed) ? storedParsed : null;
  }

  return null;
}

export function decodeJwtExpMs(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    const data = JSON.parse(json) as { exp?: number };

    return data.exp ? data.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function resolveTokenAndExpiry(payload: unknown): { token: string; expiresAt: number } {
  const data = (payload ?? {}) as Record<string, unknown>;

  const token = [
    data.token,
    data.accessToken,
    data.access_token,
    (data.data as Record<string, unknown> | undefined)?.token,
    (data.data as Record<string, unknown> | undefined)?.accessToken,
    (data.data as Record<string, unknown> | undefined)?.access_token,
  ].find((value): value is string => typeof value === "string" && value.length > 0);

  if (!token) {
    throw new Error("Token missing in login response");
  }

  const expiresInSeconds = [
    data.expiresIn,
    data.expires_in,
    (data.data as Record<string, unknown> | undefined)?.expiresIn,
    (data.data as Record<string, unknown> | undefined)?.expires_in,
  ].find((value): value is number => typeof value === "number" && value > 0);

  const jwtExp = decodeJwtExpMs(token);
  const fallbackMs = 10 * 24 * 60 * 60 * 1000;
  const expiresAt = expiresInSeconds
    ? Date.now() + expiresInSeconds * 1000
    : jwtExp ?? Date.now() + fallbackMs;

  return { token, expiresAt };
}
