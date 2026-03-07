"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  BadgeCheck,
  CalendarClock,
  Activity,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  X,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MessageCircle,
  Send,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/hooks/use-auth";
import { useSignalsQuery } from "@/services/signals/signal.hooks";
import { useSubscriptionStatusQuery } from "@/services/subscriptions/subscription.hooks";
import type { SignalItem } from "@/services/signals/signal.types";

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function getEntry(signal: SignalItem) {
  if (typeof signal.entry === "number") return signal.entry;
  if (typeof signal.entryPrice === "number") return signal.entryPrice;
  return undefined;
}

function getStopLoss(signal: SignalItem) {
  if (typeof signal.stoploss === "number") return signal.stoploss;
  if (typeof signal.stopLoss === "number") return signal.stopLoss;
  return undefined;
}

function getTargets(signal: SignalItem) {
  if (!signal.targets) return [];
  if (Array.isArray(signal.targets)) return signal.targets.filter((val) => typeof val === "number");
  const { target1, target2, target3, t1, t2, t3 } = signal.targets;
  return [target1 ?? t1, target2 ?? t2, target3 ?? t3].filter((val): val is number => typeof val === "number");
}

function formatPrice(value?: number) {
  if (typeof value !== "number") return "-";
  return numberFormatter.format(value);
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type HoverKey = "plan" | "days" | "today";

const SUPPORT_WHATSAPP = "917770039037";
const socialLinks = [
  {
    label: "WhatsApp",
    href: `https://wa.me/${SUPPORT_WHATSAPP}`,
    Icon: SiWhatsapp,
    iconClassName: "text-emerald-500",
  },
  { label: "Telegram", href: "#", Icon: Send },
  { label: "YouTube", href: "#", Icon: Youtube },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "X (Twitter)", href: "#", Icon: Twitter },
  { label: "Instagram", href: "#", Icon: Instagram },
];

function pad2(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function getExpiryCountdown(expiry: string, nowMs: number) {
  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return null;

  const diffMs = expiryDate.getTime() - nowMs;
  const clampedMs = Math.max(0, diffMs);
  const totalSeconds = Math.floor(clampedMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isExpired: diffMs <= 0,
    days,
    hours,
    minutes,
    seconds,
  };
}

function useExpiryCountdown(expiry: string | undefined, enabled: boolean) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled || !expiry) return;
    const expiryDate = new Date(expiry);
    if (Number.isNaN(expiryDate.getTime())) return;

    setNowMs(Date.now());
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [enabled, expiry]);

  return useMemo(() => {
    if (!expiry) return null;
    return getExpiryCountdown(expiry, nowMs);
  }, [expiry, nowMs]);
}

function useAnimatedCount(value: number, trigger: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(safeValue);

  useEffect(() => {
    if (trigger === 0) {
      setDisplay(safeValue);
      return;
    }

    const duration = 700;
    const startValue = 0;
    const endValue = Math.round(safeValue);
    const start = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setDisplay(current);
      if (t < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [safeValue, trigger]);

  return display;
}

const cardBase =
  "metallic-surface relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/60 p-4 sm:p-7 min-h-[116px] sm:min-h-[148px] flex flex-col items-center justify-center text-center gap-2 sm:gap-3 transition-all duration-300 hover:border-border/80";

export default function DashboardPage() {
  const [hoverPulse, setHoverPulse] = useState<Record<HoverKey, number>>({
    plan: 0,
    days: 0,
    today: 0,
  });
  const [isDaysHovered, setIsDaysHovered] = useState(false);
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const popupStorageKey = "mspk_mobile_dashboard_popup_v1";

  const meQuery = useMeQuery();
  const subscriptionStatusQuery = useSubscriptionStatusQuery();

  const todaySignalsQuery = useSignalsQuery({ page: 1, limit: 1, dateFilter: "Today" });
  const recentSignalsQuery = useSignalsQuery({ page: 1, limit: 6 });

  const planExpiry = meQuery.data?.planExpiry ?? undefined;
  const planNameLabel = meQuery.data?.planName ?? "No active plan";
  const planNameLower = planNameLabel.toLowerCase();
  const planId = meQuery.data?.planId ?? null;
  const subscriptionPlan = (meQuery.data?.subscription?.plan || "").toLowerCase();
  const expiryCountdown = useExpiryCountdown(planExpiry, isDaysHovered);
  const remainingDays = useMemo(() => {
    if (!planExpiry) return null;
    const expiryDate = new Date(planExpiry);
    if (Number.isNaN(expiryDate.getTime())) return null;
    const diff = expiryDate.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [planExpiry]);

  const subscriptionStatus = subscriptionStatusQuery.data?.subscription?.status;
  const normalizedSubscriptionStatus =
    typeof subscriptionStatus === "string" ? subscriptionStatus.toLowerCase() : "";
  const isActiveFromSubscription =
    subscriptionStatusQuery.data?.hasActiveSubscription === true ||
    normalizedSubscriptionStatus === "active";
  const planIsExpired = useMemo(() => {
    if (!planExpiry) return false;
    const expiryDate = new Date(planExpiry);
    if (Number.isNaN(expiryDate.getTime())) return false;
    return expiryDate.getTime() <= Date.now();
  }, [planExpiry]);
  const isActiveFromExpiry = typeof remainingDays === "number" && remainingDays > 0;
  const isActiveFromMeData =
    Boolean(meQuery.data?.planId) ||
    (Array.isArray(meQuery.data?.permissions) && meQuery.data.permissions.length > 0);
  const planIsActive = isActiveFromSubscription || isActiveFromExpiry || isActiveFromMeData;
  const isMarkedExpired = planNameLower.includes("expired");
  const isFreePlan = subscriptionPlan === "free";
  const isPlanMissing = !planId && !isActiveFromMeData;
  const isPlanBlocked =
    !isActiveFromSubscription && (planIsExpired || isMarkedExpired || isFreePlan || isPlanMissing);
  const planStatus = planIsActive ? "Active" : "Inactive";
  const planName = planNameLabel;

  const todayCount =
    todaySignalsQuery.data?.pagination?.totalResults ??
    todaySignalsQuery.data?.stats?.totalSignals ??
    todaySignalsQuery.data?.results?.length ??
    0;

  const recentSignals = recentSignalsQuery.data?.results ?? [];
  const animatedDays = useAnimatedCount(remainingDays ?? 0, hoverPulse.days);
  const animatedToday = useAnimatedCount(todayCount, hoverPulse.today);
  const bumpHover = (key: HoverKey) =>
    setHoverPulse((prev) => ({ ...prev, [key]: prev[key] + 1 }));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const seen = window.localStorage.getItem(popupStorageKey) === "1";
    if (isMobile && !seen) {
      setShowMobilePopup(true);
    }
  }, []);

  const dismissMobilePopup = () => {
    setShowMobilePopup(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(popupStorageKey, "1");
    }
  };

  const handlePlanWhatsApp = () => {
    const whatsappNumber = "917770039037";
    const userName = meQuery.data?.name?.trim() || "N/A";
    const userEmail = meQuery.data?.email?.trim() || "N/A";
    const userPhone = meQuery.data?.phone?.trim() || "N/A";
    const planExpiryLabel = planExpiry || "N/A";

    const message = [
      "Hello MSPK Team,",
      "",
      "My plan has expired and I want to renew it.",
      `- Current Plan: ${planNameLabel}`,
      `- Plan Expiry: ${planExpiryLabel}`,
      "",
      "User Details:",
      `- Name: ${userName}`,
      `- Email: ${userEmail}`,
      `- Phone: ${userPhone}`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex-1 space-y-4 py-2">
      <Dialog open={isPlanBlocked} onOpenChange={() => {}}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border border-primary/25 bg-white/95 p-6 text-slate-900 shadow-[0_26px_70px_-40px_rgba(15,23,42,0.6)] dark:border-primary/30 dark:bg-slate-950/95 dark:text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Your plan has expired</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Renew your plan to continue using the dashboard features.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-slate-700 dark:text-slate-200">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              MSPK Plan Renewal
            </div>
            <div className="mt-2 text-sm">
              Please renew your plan now to regain full access.
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={() => window.location.assign("/dashboard/plans")}
              className="h-10 w-full"
            >
              Renew Now
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePlanWhatsApp}
              className="h-10 w-full"
            >
              WhatsApp Support
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {showMobilePopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={dismissMobilePopup}
            aria-label="Close popup"
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border/60 bg-background/95 p-5 pb-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/15 bg-foreground/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <button
                onClick={dismissMobilePopup}
                className="rounded-full border border-foreground/10 bg-foreground/5 p-2 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                MSPK Trade Solutions
              </h3>
              <p className="text-sm text-muted-foreground">
                No.1 best signals in the market for professional traders.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/signals"
                className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                View Signals
              </Link>
              <Link
                href="/dashboard/plans"
                className="inline-flex items-center justify-center rounded-full border border-foreground/15 bg-foreground/5 px-3 py-2 text-xs font-semibold text-foreground"
              >
                Explore Plans
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Plan overview and signal activity snapshot.</p>
        </div>
        <Link
          href="/dashboard/signals"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          View all signals <ChevronRight size={14} />
        </Link>
      </div>

      <div className="metallic-surface relative overflow-hidden rounded-3xl border border-border/60 p-5 sm:p-7">
        <div className="absolute -top-24 -right-12 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative z-10 grid gap-5 sm:grid-cols-[1.2fr_0.8fr] sm:items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              MSPK Trade Solutions
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground leading-tight">
              No.1 best signals in the market, trusted by professional traders.
            </h2>
            <p className="text-sm text-muted-foreground">
              Precision entries, clear targets, and disciplined risk management — all in real time.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[11px] text-foreground/90">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Risk-managed entries
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1 text-[11px] text-foreground/90">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Pro-grade strategy
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Start now
            </div>
            <Link
              href="/dashboard/plans"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Explore Plans <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/signals"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-foreground/10"
            >
              See Live Signals <ChevronRight className="h-4 w-4" />
            </Link>
            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground text-left sm:text-right">
                Follow us
              </div>
              <div className="mt-2 flex items-center gap-2 justify-start sm:justify-end">
                {socialLinks.map(({ label, href, Icon, iconClassName }) => {
                  if (label === "WhatsApp") {
                    return (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="group relative h-9 w-9 rounded-full border border-foreground/10 bg-foreground/5 flex items-center justify-center text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                      >
                        <Icon className={`h-4 w-4 ${iconClassName ?? ""}`} />
                        <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-foreground/10 bg-foreground px-2.5 py-1 text-[10px] font-semibold text-background opacity-0 shadow-lg transition group-hover:opacity-100">
                          {label}
                        </span>
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={label}
                      href={href}
                      aria-label={label}
                      className="group relative h-9 w-9 rounded-full border border-foreground/10 bg-foreground/5 flex items-center justify-center text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Icon className={`h-4 w-4 ${iconClassName ?? ""}`} />
                      <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-foreground/10 bg-foreground px-2.5 py-1 text-[10px] font-semibold text-background opacity-0 shadow-lg transition group-hover:opacity-100">
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={cardBase} onMouseEnter={() => bumpHover("plan")}>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border border-foreground/15 bg-foreground/10 flex items-center justify-center">
            <BadgeCheck className={`h-4 w-4 sm:h-5 sm:w-5 ${planIsActive ? "text-emerald-500" : "text-amber-500"}`} />
          </div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-slate-900 dark:text-muted-foreground font-semibold">Plan Status</div>
          <div className="mt-2 sm:mt-3 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
            <div className="text-xl sm:text-3xl font-semibold text-slate-900 dark:text-foreground">{planStatus}</div>
            <span
              className={`rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-slate-900 dark:text-foreground ${
                planStatus.toLowerCase() === "active"
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              {planStatus.toLowerCase() === "active" ? "Running" : "Needs Action"}
            </span>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-900 dark:text-muted-foreground mt-1.5 sm:mt-2">{planName}</div>
        </div>

        <div
          className={cardBase}
          onMouseEnter={() => {
            bumpHover("days");
            setIsDaysHovered(true);
          }}
          onMouseLeave={() => setIsDaysHovered(false)}
        >
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border border-foreground/15 bg-foreground/10 flex items-center justify-center">
            <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-slate-900 dark:text-muted-foreground font-semibold">Remaining Days</div>
          <div className="mt-2 sm:mt-3 text-3xl sm:text-5xl font-semibold text-slate-900 dark:text-foreground tabular-nums leading-none">
            {remainingDays === null ? "-" : animatedDays.toLocaleString("en-IN")}
          </div>
          <div className="mt-1.5 sm:mt-2 space-y-0.5">
            <div className="text-[11px] sm:text-xs text-slate-900 dark:text-muted-foreground">
              {planExpiry ? `Expiry: ${formatDate(planExpiry)}` : "No expiry info"}
            </div>
            {planExpiry && expiryCountdown && isDaysHovered && (
              <div className="text-[10px] sm:text-[11px] font-mono tabular-nums text-slate-900 dark:text-foreground/80 transition-opacity duration-200">
                {expiryCountdown.isExpired
                  ? "Expired"
                  : `Countdown: ${expiryCountdown.days}d ${pad2(expiryCountdown.hours)}:${pad2(expiryCountdown.minutes)}:${pad2(expiryCountdown.seconds)}`}
              </div>
            )}
          </div>
        </div>

        <div className={cardBase} onMouseEnter={() => bumpHover("today")}>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border border-foreground/15 bg-foreground/10 flex items-center justify-center">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-slate-900 dark:text-muted-foreground font-semibold">Today Signal Count</div>
          <div className="mt-2 sm:mt-3 text-3xl sm:text-5xl font-semibold text-slate-900 dark:text-foreground tabular-nums leading-none">
            {animatedToday.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] sm:text-xs text-slate-900 dark:text-muted-foreground mt-1.5 sm:mt-2">Signals generated today</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Recent Signals</h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Latest {recentSignals.length}
          </span>
        </div>

        <div className={`rounded-2xl border border-black/5 dark:border-white/10 bg-white/90 dark:bg-white/5 overflow-hidden`}>
          <div className="hidden md:grid grid-cols-[1.1fr_0.6fr_0.6fr_0.7fr_0.7fr_1fr_0.8fr] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-black/5 dark:border-white/10">
            <div>Signal</div>
            <div>Type</div>
            <div>Status</div>
            <div>Entry</div>
            <div>SL</div>
            <div>Targets</div>
            <div>Time</div>
          </div>

          {recentSignals.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">No recent signals found.</div>
          ) : (
            recentSignals.map((signal) => {
              const isBuy = signal.type?.toUpperCase() !== "SELL";
              const targets = getTargets(signal);
              return (
                <div
                  key={signal.id || signal._id || signal.uniqueId}
                  className="grid md:grid-cols-[1.1fr_0.6fr_0.6fr_0.7fr_0.7fr_1fr_0.8fr] gap-3 px-4 py-3 text-xs border-b border-black/5 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition"
                >
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {signal.segment || "SEG"} • {signal.timeframe || "-"}
                    </div>
                    <div className="text-sm font-semibold text-foreground truncate">{signal.symbol || "Signal"}</div>
                  </div>
                  <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isBuy ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {isBuy ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {signal.type || "BUY"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{signal.status || "-"}</div>
                  <div className="font-semibold text-foreground">{formatPrice(getEntry(signal))}</div>
                  <div className="font-semibold text-foreground">{formatPrice(getStopLoss(signal))}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {targets.length ? targets.map((t) => formatPrice(t)).join(" / ") : "-"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDate(signal.signalTime || signal.timestamp || signal.createdAt)}
                  </div>

                  <div className="md:hidden col-span-2 text-[11px] text-muted-foreground">
                    Status: {signal.status || "-"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
