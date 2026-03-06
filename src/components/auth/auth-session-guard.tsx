"use client";

import { clearAuthSession, decodeJwtExpMs, getAuthExpiresAt, getAuthToken, setAuthSession } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    let expiresAt = getAuthExpiresAt();

    if (!token) {
      clearAuthSession();
      router.replace("/login");
      return;
    }

    if (!expiresAt) {
      const jwtExp = decodeJwtExpMs(token);
      if (jwtExp && jwtExp > Date.now()) {
        setAuthSession(token, jwtExp);
        expiresAt = jwtExp;
      } else {
        // If expiry is missing, avoid forcing logout on webview.
        return;
      }
    }

    if (expiresAt <= Date.now()) {
      clearAuthSession();
      router.replace("/login");
      return;
    }

    const timeoutMs = Math.max(expiresAt - Date.now(), 0);
    const timeoutId = window.setTimeout(() => {
      clearAuthSession();
      router.replace("/login");
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  return null;
}
