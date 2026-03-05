"use client";

import { clearAuthSession, getAuthExpiresAt, getAuthToken } from "@/lib/auth/session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    const expiresAt = getAuthExpiresAt();

    if (!token || !expiresAt || expiresAt <= Date.now()) {
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
