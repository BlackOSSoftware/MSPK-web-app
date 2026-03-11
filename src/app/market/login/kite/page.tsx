"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { postMarketLoginKite } from "@/services/market/market.service";
import { Button } from "@/components/ui/button";

type StatusState = "idle" | "loading" | "success" | "error";

export default function KiteLoginCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const processedRef = useRef(false);
  const [status, setStatus] = useState<StatusState>("idle");
  const [message, setMessage] = useState("Waiting for Kite login...");

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const requestToken = searchParams.get("request_token");
    const providerStatus = searchParams.get("status");
    const providerAction = searchParams.get("action");

    if (!requestToken) {
      setStatus("error");
      setMessage("Login failed: request_token missing.");
      return;
    }

    if (providerStatus === "error" || providerAction === "error") {
      setStatus("error");
      setMessage("Login failed: provider returned an error.");
      return;
    }

    setStatus("loading");
    setMessage("Verifying Kite login...");

    postMarketLoginKite({ request_token: requestToken })
      .then(() => {
        setStatus("success");
        setMessage("Login successful! You can close this page.");
        setTimeout(() => {
          router.replace("/dashboard/watchlist");
        }, 1500);
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : "Login failed. Please retry the login flow.";
        setStatus("error");
        setMessage(errorMessage);
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.85)]">
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Kite Connect</p>
        <h1 className="mt-2 text-xl font-semibold">Kite Login Callback</h1>
        <p className="mt-3 text-sm text-slate-300">{message}</p>

        {status === "error" ? (
          <div className="mt-4">
            <Button type="button" onClick={() => router.replace("/dashboard/watchlist")} className="h-9">
              Back to Watchlist
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
