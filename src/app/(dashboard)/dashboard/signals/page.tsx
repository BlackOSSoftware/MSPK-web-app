"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSignalsQuery } from "@/services/signals/signal.hooks";
import type { SignalItem } from "@/services/signals/signal.types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageScriptsPanel } from "@/components/signals/manage-scripts-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Layers3,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAuthToken } from "@/lib/auth/session";

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
type SignalRuntimeShape = SignalItem & {
  entry_price?: unknown;
  stop_loss?: unknown;
  exit?: unknown;
  exit_price?: unknown;
  total_points?: unknown;
  trade_type?: string;
};

type LiveSignalTick = {
  symbol: string;
  price?: number;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  close?: number;
  change?: number;
  changePercent?: number;
  timestamp?: string;
};

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replaceAll(",", "").trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function getSignalId(signal: SignalItem) {
  return signal.id || signal._id || "";
}

function getSignalKey(signal: SignalItem) {
  return (
    getSignalId(signal) ||
    [signal.symbol, signal.type, getDisplaySignalTime(signal)]
      .filter(Boolean)
      .join("|")
  );
}

function getDisplaySignalTime(signal: SignalItem) {
  return signal.displaySignalTime || signal.signalTime || signal.timestamp || signal.createdAt;
}

function isSignalClosed(signal: SignalItem) {
  const normalizedStatus = String(signal.status || "").trim().toLowerCase();
  return (
    normalizedStatus.includes("target") ||
    normalizedStatus.includes("partial") ||
    normalizedStatus.includes("stop") ||
    normalizedStatus.includes("close")
  );
}

function getDisplayExitTime(signal: SignalItem) {
  if (!isSignalClosed(signal)) return undefined;
  return signal.displayExitTime || signal.exitTime || signal.updatedAt || signal.createdAt;
}

function getEntry(signal: SignalItem) {
  const runtimeSignal = signal as SignalRuntimeShape;
  const directEntry = toFiniteNumber(signal.entry);
  if (typeof directEntry === "number") return directEntry;
  const snakeEntry = toFiniteNumber(runtimeSignal.entry_price);
  if (typeof snakeEntry === "number") return snakeEntry;
  const entryPrice = toFiniteNumber(signal.entryPrice);
  if (typeof entryPrice === "number") return entryPrice;
  return undefined;
}

function getStopLoss(signal: SignalItem) {
  const runtimeSignal = signal as SignalRuntimeShape;
  const stoploss = toFiniteNumber(signal.stoploss);
  if (typeof stoploss === "number") return stoploss;
  const snakeStopLoss = toFiniteNumber(runtimeSignal.stop_loss);
  if (typeof snakeStopLoss === "number") return snakeStopLoss;
  const stopLoss = toFiniteNumber(signal.stopLoss);
  if (typeof stopLoss === "number") return stopLoss;
  return undefined;
}

function getExit(signal: SignalItem) {
  const runtimeSignal = signal as SignalRuntimeShape;
  const directExit = toFiniteNumber(runtimeSignal.exit);
  if (typeof directExit === "number") return directExit;
  const snakeExit = toFiniteNumber(runtimeSignal.exit_price);
  if (typeof snakeExit === "number") return snakeExit;
  const exitPrice = toFiniteNumber(signal.exitPrice);
  if (typeof exitPrice === "number") return exitPrice;
  return undefined;
}

function getTargets(signal: SignalItem) {
  if (!signal.targets) return [];
  if (Array.isArray(signal.targets)) {
    return signal.targets
      .map((value) => toFiniteNumber(value))
      .filter((value): value is number => typeof value === "number");
  }
  const { target1, target2, target3, t1, t2, t3 } = signal.targets;
  return [target1 ?? t1, target2 ?? t2, target3 ?? t3]
    .map((value) => toFiniteNumber(value))
    .filter((value): value is number => typeof value === "number");
}

function isBuySignal(signal: SignalItem) {
  const runtimeSignal = signal as SignalRuntimeShape;
  return (signal.type || runtimeSignal.trade_type || "BUY").toUpperCase() !== "SELL";
}

function roundSignalValue(value: number) {
  return Math.round(value * 100) / 100;
}

function getResolvedPoints(signal: SignalItem, livePrice?: number) {
  const runtimeSignal = signal as SignalRuntimeShape;
  const storedPoints = toFiniteNumber(signal.totalPoints ?? runtimeSignal.total_points);
  const entry = getEntry(signal);
  const exit = getExit(signal);
  const currentLivePrice = typeof livePrice === "number" && Number.isFinite(livePrice) ? livePrice : undefined;

  if (
    typeof storedPoints === "number" &&
    (Math.abs(storedPoints) > 0 || typeof entry !== "number" || typeof exit !== "number")
  ) {
    return roundSignalValue(storedPoints);
  }

  if (typeof entry === "number" && typeof exit === "number") {
    const points = isBuySignal(signal) ? exit - entry : entry - exit;
    return roundSignalValue(points);
  }

  if (typeof entry === "number" && typeof currentLivePrice === "number") {
    const points = isBuySignal(signal) ? currentLivePrice - entry : entry - currentLivePrice;
    return roundSignalValue(points);
  }

  if (typeof storedPoints === "number") return roundSignalValue(storedPoints);
  return undefined;
}

function getDisplayStatus(signal: SignalItem) {
  const rawStatus = String(signal.status || "").trim();
  const normalized = rawStatus.toLowerCase();
  const points = getResolvedPoints(signal);
  const entry = getEntry(signal);
  const exit = getExit(signal);
  const favorableExit =
    typeof entry === "number" &&
    typeof exit === "number" &&
    (isBuySignal(signal) ? exit > entry : exit < entry);

  if (normalized.includes("partial")) return "Partial Profit Book";
  if (
    normalized.includes("stop") &&
    ((typeof points === "number" && points > 0) || favorableExit)
  ) {
    return "Partial Profit Book";
  }

  return rawStatus || "-";
}

function formatPrice(value?: number) {
  if (typeof value !== "number") return "-";
  return numberFormatter.format(value);
}

function formatPoints(value?: number) {
  if (typeof value !== "number") return "-";
  if (value === 0) return "0";
  const prefix = value > 0 ? "+" : "-";
  return `${prefix}${numberFormatter.format(Math.abs(value))}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeframe(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "-";

  const normalized = raw.toUpperCase();
  if (normalized === "S") return "Scalp";
  if (/^\d+S$/.test(normalized)) return `${normalized.slice(0, -1)}s`;
  if (/^\d+M$/.test(normalized)) return `${normalized.slice(0, -1)}m`;
  if (/^\d+H$/.test(normalized)) return `${normalized.slice(0, -1)}h`;
  if (["D", "1D", "DAY"].includes(normalized)) return "1D";
  if (["W", "1W", "WEEK"].includes(normalized)) return "1W";
  if (["MO", "MON", "MONTH", "1MO", "1MON", "1MONTH"].includes(normalized)) return "1M";

  if (/^\d+$/.test(normalized)) {
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount <= 0) return raw;
    if (amount < 60) return `${amount}m`;
    if (amount < 1440 && amount % 60 === 0) return `${amount / 60}h`;
    if (amount === 1440) return "1D";
    if (amount === 10080) return "1W";
    if (amount === 43200) return "1M";
    return `${amount}m`;
  }

  return raw;
}

function getMarketSocketUrl(token: string): string {
  const override = process.env.NEXT_PUBLIC_MARKET_WS_URL;
  if (override) {
    const url = new URL(override);
    url.searchParams.set("token", token);
    url.searchParams.set("autoSubscribe", "false");
    return url.toString();
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  const url = new URL(apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  url.searchParams.set("token", token);
  url.searchParams.set("autoSubscribe", "false");
  return url.toString();
}

function normalizeSignalSymbol(symbol?: string | null) {
  return String(symbol || "").trim().toUpperCase();
}

function getUsdUsdtAlias(symbol?: string | null) {
  const normalized = normalizeSignalSymbol(symbol);
  if (!normalized) return "";

  const withSuffix = normalized.match(/^([A-Z0-9]+?)(USDT|USD)([.:/_-][A-Z0-9._:-]*)?$/);
  if (withSuffix) {
    const [, base, quote, suffix = ""] = withSuffix;
    return `${base}${quote === "USDT" ? "USD" : "USDT"}${suffix}`;
  }

  if (normalized.endsWith("USDT")) {
    return normalized.slice(0, -1);
  }

  if (normalized.endsWith("USD")) {
    return `${normalized}T`;
  }

  return "";
}

function areEquivalentSignalSymbols(left?: string | null, right?: string | null) {
  const normalizedLeft = normalizeSignalSymbol(left);
  const normalizedRight = normalizeSignalSymbol(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  return getUsdUsdtAlias(normalizedLeft) === normalizedRight || getUsdUsdtAlias(normalizedRight) === normalizedLeft;
}

function getBestLiveSignalPrice(tick?: LiveSignalTick | null) {
  if (!tick) return undefined;

  const candidates = [
    tick.price,
    tick.close,
    typeof tick.bid === "number" && typeof tick.ask === "number" && tick.bid > 0 && tick.ask > 0
      ? (tick.bid + tick.ask) / 2
      : undefined,
    tick.bid,
    tick.ask,
    tick.high,
    tick.low,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }

  return undefined;
}

function mapSignalSocketTick(payload: Record<string, unknown>): LiveSignalTick | null {
  const symbolRaw = payload.symbol;
  if (typeof symbolRaw !== "string" || !symbolRaw.trim()) return null;

  const ohlc =
    payload.ohlc && typeof payload.ohlc === "object"
      ? (payload.ohlc as Record<string, unknown>)
      : undefined;
  const depth =
    payload.depth && typeof payload.depth === "object"
      ? (payload.depth as Record<string, unknown>)
      : undefined;
  const bidFromDepth = Array.isArray((depth as { buy?: unknown[] } | undefined)?.buy)
    ? ((depth as { buy?: Array<Record<string, unknown>> }).buy?.[0]?.price as unknown)
    : undefined;
  const askFromDepth = Array.isArray((depth as { sell?: unknown[] } | undefined)?.sell)
    ? ((depth as { sell?: Array<Record<string, unknown>> }).sell?.[0]?.price as unknown)
    : undefined;

  return {
    symbol: normalizeSignalSymbol(symbolRaw),
    price: toFiniteNumber(
      payload.price ??
        payload.last_price ??
        payload.lastPrice ??
        payload.last ??
        payload.ltp ??
        payload.currentPrice ??
        payload.close ??
        ohlc?.close
    ),
    bid: toFiniteNumber(payload.bid ?? payload.bestBid ?? bidFromDepth),
    ask: toFiniteNumber(payload.ask ?? payload.bestAsk ?? askFromDepth),
    high: toFiniteNumber(payload.high ?? ohlc?.high),
    low: toFiniteNumber(payload.low ?? ohlc?.low),
    close: toFiniteNumber(payload.close ?? payload.prevClose ?? ohlc?.close),
    change: toFiniteNumber(payload.change),
    changePercent: toFiniteNumber(payload.changePercent ?? payload.change_percent),
    timestamp:
      typeof payload.timestamp === "string"
        ? payload.timestamp
        : payload.timestamp instanceof Date
          ? payload.timestamp.toISOString()
          : undefined,
  };
}

function getChartIntervalFromTimeframe(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "15";

  const normalized = raw.toUpperCase();
  if (normalized === "1" || normalized === "2" || normalized === "5" || normalized === "10" || normalized === "15") {
    return normalized;
  }
  if (normalized === "60" || normalized === "1H" || normalized === "H") return "60";
  if (["D", "1D", "DAY"].includes(normalized)) return "D";
  if (["W", "1W", "WEEK"].includes(normalized)) return "W";
  if (["MO", "MON", "MONTH", "1MO", "1MON", "1MONTH", "M"].includes(normalized)) return "M";
  if (/^\d+M$/.test(normalized)) {
    const minutes = normalized.slice(0, -1);
    if (["1", "2", "5", "10", "15"].includes(minutes)) return minutes;
    if (minutes === "60") return "60";
  }
  if (/^\d+H$/.test(normalized)) {
    const hours = Number(normalized.slice(0, -1));
    if (hours === 1) return "60";
  }

  if (/^\d+$/.test(normalized)) {
    if (["1", "2", "5", "10", "15", "60"].includes(normalized)) return normalized;
    if (normalized === "1440") return "D";
    if (normalized === "10080") return "W";
    if (normalized === "43200") return "M";
  }

  return "15";
}

function getStatusTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("active") || normalized.includes("open")) {
    return "border border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-300";
  }
  if (normalized.includes("partial") || normalized.includes("profit") || normalized.includes("target")) {
    return "border border-amber-600/25 bg-amber-500/12 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/12 dark:text-amber-100";
  }
  if (normalized.includes("close") || normalized.includes("history")) {
    return "border border-slate-500/25 bg-slate-500/10 text-slate-700 dark:border-slate-300/20 dark:bg-slate-300/10 dark:text-slate-300";
  }
  if (normalized.includes("stop")) {
    return "border border-rose-600/25 bg-rose-600/10 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-300";
  }
  return "border border-primary/30 bg-primary/10 text-primary dark:border-primary/25 dark:bg-primary/12 dark:text-primary";
}

function getSegmentTone(segment?: string) {
  const normalized = String(segment || "").toUpperCase();
  if (normalized.includes("NFO")) {
    return "border border-amber-600/30 bg-amber-500/12 text-amber-700 dark:border-amber-300/30 dark:bg-amber-300/12 dark:text-amber-200";
  }
  if (normalized.includes("MCX")) {
    return "border border-cyan-600/30 bg-cyan-500/12 text-cyan-700 dark:border-cyan-300/30 dark:bg-cyan-300/12 dark:text-cyan-200";
  }
  if (normalized.includes("NSE")) {
    return "border border-emerald-600/30 bg-emerald-500/12 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-300/12 dark:text-emerald-200";
  }
  return "border border-primary/30 bg-primary/12 text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary";
}

function getSegmentBadgeTone(segment?: string) {
  const normalized = String(segment || "").toUpperCase();
  if (normalized.includes("NFO")) {
    return "border border-amber-500/35 bg-amber-500/12 text-amber-700 dark:border-amber-300/45 dark:bg-amber-300/18 dark:text-amber-100";
  }
  if (normalized.includes("MCX")) {
    return "border border-cyan-500/35 bg-cyan-500/12 text-cyan-700 dark:border-cyan-300/45 dark:bg-cyan-300/18 dark:text-cyan-100";
  }
  if (normalized.includes("NSE")) {
    return "border border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:border-emerald-300/45 dark:bg-emerald-300/18 dark:text-emerald-100";
  }
  return "border border-slate-400/55 bg-slate-200/70 text-slate-700 dark:border-slate-300/35 dark:bg-slate-700/35 dark:text-slate-100";
}

function HeaderCell({ icon: Icon, label }: { icon: typeof Activity; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200/80" />
      <span>{label}</span>
    </div>
  );
}

type StatHoverKey = "total" | "today" | "month" | "plan";
type SignalStatusFilter = "all" | "active" | "partial" | "target" | "stop" | "closed";

const SIGNAL_STATUS_FILTERS: Array<{ value: SignalStatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "partial", label: "Partial" },
  { value: "target", label: "Target/Profit" },
  { value: "stop", label: "Stop" },
  { value: "closed", label: "Closed" },
];

const SIGNAL_STATUS_QUERY_MAP: Record<SignalStatusFilter, string | undefined> = {
  all: undefined,
  active: "Active",
  partial: "Partial Profit Book",
  target: "Target Hit",
  stop: "Stoploss Hit",
  closed: "Closed",
};

function getPointsTone(points?: number) {
  if (typeof points !== "number") return "text-slate-500 dark:text-slate-400";
  if (points > 0) return "text-emerald-700 dark:text-emerald-200";
  if (points < 0) return "text-rose-700 dark:text-rose-200";
  return "text-slate-600 dark:text-slate-300";
}

function useAnimatedCount(value: number, trigger: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const [display, setDisplay] = useState(safeValue);

  useEffect(() => {
    if (trigger === 0) return;
    let rafId = 0;
    const startValue = 0;
    const endValue = safeValue;
    const duration = 700;
    const start = performance.now();

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

  if (trigger === 0) return safeValue;
  return display;
}

function SignalsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState("");
  const [statusFilter, setStatusFilter] = useState<SignalStatusFilter>("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [openedMobileBookKey, setOpenedMobileBookKey] = useState("");
  const [liveTick, setLiveTick] = useState<LiveSignalTick | null>(null);
  const [statHoverPulse, setStatHoverPulse] = useState<Record<StatHoverKey, number>>({
    total: 0,
    today: 0,
    month: 0,
    plan: 0,
  });
  const liveSocketRef = useRef<WebSocket | null>(null);
  const activeTab = searchParams.get("tab") === "scripts" ? "scripts" : "feed";
  const backendStatusFilter = SIGNAL_STATUS_QUERY_MAP[statusFilter];

  const { data, isLoading, isFetching, error, refetch } = useSignalsQuery({
    page,
    limit: 12,
    status: backendStatusFilter,
  });

  const signals = useMemo(() => data?.results ?? [], [data?.results]);
  const pagination = data?.pagination;
  const filteredSignals = signals;
  const hasFilteredSignals = filteredSignals.length > 0;
  const filterHasNoResults = !isLoading && !hasFilteredSignals;
  const entriesLabel = `${pagination?.totalResults ?? filteredSignals.length} entries`;
  const focusSignal = useMemo(() => {
    if (filteredSignals.length === 0) return undefined;
    if (!selectedKey) return filteredSignals[0];
    return filteredSignals.find((item) => getSignalKey(item) === selectedKey) ?? filteredSignals[0];
  }, [filteredSignals, selectedKey]);
  const activeSignalKey = focusSignal ? getSignalKey(focusSignal) : "";
  const latestSignalKey = filteredSignals.length > 0 ? getSignalKey(filteredSignals[0]) : "";
  const isFocusLatest = Boolean(activeSignalKey && activeSignalKey === latestSignalKey);
  const focusIsBuy = focusSignal ? isBuySignal(focusSignal) : true;
  const focusStatus = focusSignal ? getDisplayStatus(focusSignal) : "-";
  const detailSignal = useMemo(() => {
    if (!selectedKey) return null;
    return filteredSignals.find((item) => getSignalKey(item) === selectedKey) ?? null;
  }, [filteredSignals, selectedKey]);
  const isDetailVisible = isDetailOpen && Boolean(detailSignal);
  const detailExitPrice = detailSignal ? getExit(detailSignal) : undefined;
  const detailLivePrice = getBestLiveSignalPrice(liveTick) ?? detailExitPrice;
  const detailBid = typeof liveTick?.bid === "number" ? liveTick.bid : undefined;
  const detailAsk = typeof liveTick?.ask === "number" ? liveTick.ask : undefined;

  useEffect(() => {
    const symbol = normalizeSignalSymbol(detailSignal?.symbol);
    const token = getAuthToken();

    if (!isDetailVisible || !symbol || !token) {
      const existing = liveSocketRef.current;
      liveSocketRef.current = null;
      if (existing) {
        try {
          if (existing.readyState === WebSocket.OPEN) {
            existing.send(JSON.stringify({ type: "unsubscribe", payload: symbol }));
          }
        } catch {}
        existing.close();
      }
      return;
    }

    let closedByEffect = false;
    let socketUrl = "";

    try {
      socketUrl = getMarketSocketUrl(token);
    } catch {
      return;
    }

    const socket = new WebSocket(socketUrl);
    liveSocketRef.current = socket;

    socket.onopen = () => {
      if (closedByEffect || liveSocketRef.current !== socket) return;
      socket.send(JSON.stringify({ type: "subscribe", payload: symbol }));
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      if (closedByEffect || liveSocketRef.current !== socket) return;
      try {
        const message = JSON.parse(event.data) as { type?: string; payload?: unknown };
        if (message.type !== "tick" || !message.payload || typeof message.payload !== "object") return;
        const tick = mapSignalSocketTick(message.payload as Record<string, unknown>);
        if (!tick || !areEquivalentSignalSymbols(tick.symbol, symbol)) return;
        setLiveTick(tick);
      } catch {}
    };

    return () => {
      closedByEffect = true;
      if (liveSocketRef.current === socket) {
        liveSocketRef.current = null;
      }
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "unsubscribe", payload: symbol }));
        }
      } catch {}
      socket.close();
    };
  }, [detailSignal?.symbol, isDetailVisible]);

  const stats = useMemo(() => {
    const total = pagination?.totalResults ?? signals.length;
    return { total };
  }, [signals.length, pagination?.totalResults]);
  const periodStats = useMemo(
    () => ({
      today: data?.periodStats?.todaySignals ?? 0,
      month: data?.periodStats?.monthlySignals ?? 0,
      plan: data?.periodStats?.planSignals ?? data?.stats?.totalSignals ?? 0,
    }),
    [data?.periodStats, data?.stats?.totalSignals]
  );
  const planSinceLabel = useMemo(() => {
    const raw = data?.access?.signalVisibleFrom;
    if (!raw) return "Plan Signals";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "Plan Signals";
    return `Plan Since ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`;
  }, [data?.access?.signalVisibleFrom]);

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = pagination?.page ?? page;
  const bumpStatHover = (key: StatHoverKey) =>
    setStatHoverPulse((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  const animatedTotal = useAnimatedCount(stats.total, statHoverPulse.total);
  const animatedToday = useAnimatedCount(periodStats.today, statHoverPulse.today);
  const animatedMonth = useAnimatedCount(periodStats.month, statHoverPulse.month);
  const animatedPlan = useAnimatedCount(periodStats.plan, statHoverPulse.plan);

  const openSignalDetail = (signal: SignalItem) => {
    setLiveTick(null);
    setSelectedKey(getSignalKey(signal));
    setIsDetailOpen(true);
  };

  const openSignalChart = (signal: SignalItem) => {
    const symbol = String(signal.symbol || "").trim();
    if (!symbol) return;
    const params = new URLSearchParams({
      chart: "1",
      symbol,
      interval: getChartIntervalFromTimeframe(signal.timeframe),
    });
    setIsDetailOpen(false);
    router.push(`/dashboard/watchlist?${params.toString()}`);
  };

  const selectSignal = (signal: SignalItem) => {
    setLiveTick(null);
    setSelectedKey(getSignalKey(signal));
    setIsDetailOpen(false);
  };

  const toggleMobileBook = (signal: SignalItem) => {
    const nextKey = getSignalKey(signal);
    selectSignal(signal);
    setOpenedMobileBookKey((prev) => (prev === nextKey ? "" : nextKey));
  };

  const handleTabChange = (value: string) => {
    const nextTab = value === "scripts" ? "scripts" : "feed";
    router.replace(nextTab === "scripts" ? `${pathname}?tab=scripts` : pathname, { scroll: false });
  };

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 py-2">
      <section className="relative overflow-hidden rounded-[1.8rem] border border-slate-300/65 dark:border-amber-300/20 bg-[radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.16),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(56,189,248,0.12),transparent_40%),linear-gradient(160deg,rgba(248,250,252,0.96),rgba(226,232,240,0.92))] dark:bg-[radial-gradient(circle_at_100%_0%,rgba(251,191,36,0.20),transparent_35%),radial-gradient(circle_at_0%_100%,rgba(56,189,248,0.16),transparent_35%),linear-gradient(160deg,rgba(8,14,28,0.9),rgba(8,14,28,0.7))] p-5 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)] dark:bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.08)_50%,transparent_65%)] opacity-45 dark:opacity-30" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/35 bg-amber-500/12 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-800 dark:border-amber-200/30 dark:bg-amber-200/10 dark:text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Signal Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-foreground tracking-tight">
              MSPK Best Signals
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Real-time premium calls with sharp entries, clear targets, and disciplined execution.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/35 bg-emerald-500/12 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-300/12 dark:text-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Feed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-600/35 bg-cyan-500/12 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-800 dark:border-cyan-300/30 dark:bg-cyan-300/12 dark:text-cyan-100">
                <TrendingUp className="h-3.5 w-3.5" />
                Precision Entries
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetch();
                }}
                disabled={isFetching}
                className="h-8 rounded-full border-slate-400/70 bg-white/75 px-3 text-[10px] uppercase tracking-[0.16em] text-slate-700 hover:border-primary/40 hover:text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary/90"
              >
                <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                {isFetching ? "Refreshing" : "Refresh Feed"}
              </Button>
            </div>
          </div>
          <div
            className={`min-w-[240px] rounded-2xl border border-slate-300/70 dark:border-amber-200/25 bg-white/70 dark:bg-slate-950/45 px-4 py-3 transition-all duration-300 ${
              isFocusLatest
                ? "ring-1 ring-sky-500/55 dark:ring-primary/70 shadow-[0_0_0_1px_rgba(59,130,246,0.22),0_20px_40px_-24px_rgba(59,130,246,0.45)]"
                : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-amber-800/90 dark:text-amber-100/80">
                Focused Signal
              </div>
              {isFocusLatest ? (
                <span className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/12 px-2 py-0.5 text-[9px] font-bold tracking-[0.15em] text-sky-700 dark:border-primary/45 dark:bg-primary/15 dark:text-primary animate-pulse">
                  NEW
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900 dark:text-foreground">
              <ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-200" />
              {focusSignal?.symbol || "No signal selected"}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${focusIsBuy ? "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-200" : "border border-rose-600/30 bg-rose-600/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-200"}`}
              >
                {focusIsBuy ? (
                  <ArrowUpRight className="h-3.5 w-3.5 animate-bounce" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 animate-bounce" />
                )}
                {focusSignal?.type || "BUY"}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusTone(focusStatus)}`}
              >
                <Activity className="h-3.5 w-3.5" />
                {focusStatus}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  focusIsBuy
                    ? "border border-emerald-600/30 bg-emerald-600/8 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                    : "border border-rose-600/30 bg-rose-600/8 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200"
                }`}
              >
                {focusIsBuy ? (
                  <ArrowUpRight className="h-3.5 w-3.5 animate-pulse" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 animate-pulse" />
                )}
                {focusIsBuy ? "Up Move" : "Down Move"}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-amber-700/80 dark:text-amber-100/70" />
              {focusSignal
                ? formatDate(getDisplaySignalTime(focusSignal))
                : "Waiting for feed"}
            </div>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <div className="rounded-[1.4rem] border border-slate-300/70 bg-white/80 p-2 dark:border-slate-700/60 dark:bg-slate-950/45">
          <TabsList className="h-auto w-full justify-start rounded-[1rem] bg-transparent p-0">
            <TabsTrigger
              value="feed"
              className="h-11 flex-1 rounded-[0.9rem] border border-transparent bg-transparent text-xs sm:text-sm data-[state=active]:border-sky-500/25 data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700 dark:data-[state=active]:border-sky-400/25 dark:data-[state=active]:bg-sky-400/12 dark:data-[state=active]:text-sky-200"
            >
              <Radio className="h-4 w-4" />
              Signal Feed
            </TabsTrigger>
            <TabsTrigger
              value="scripts"
              className="h-11 flex-1 rounded-[0.9rem] border border-transparent bg-transparent text-xs sm:text-sm data-[state=active]:border-emerald-500/25 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:border-emerald-400/25 dark:data-[state=active]:bg-emerald-400/12 dark:data-[state=active]:text-emerald-200"
            >
              <Layers3 className="h-4 w-4" />
              Manage Scripts
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="feed" className="space-y-4 sm:space-y-6">
      <section className="relative grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <div
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300/70 dark:border-amber-300/18 bg-[linear-gradient(145deg,rgba(248,250,252,0.95),rgba(226,232,240,0.92))] dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.84),rgba(30,41,59,0.66))] p-2.5 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/45 dark:hover:border-amber-300/40 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_20px_34px_-22px_rgba(96,165,250,0.5)]"
          onMouseEnter={() => bumpStatHover("total")}
          onTouchStart={() => bumpStatHover("total")}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-amber-200/25 blur-2xl opacity-60 transition duration-500 group-hover:scale-125 group-hover:opacity-95" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(147,197,253,0.18),transparent_55%)] opacity-70 dark:opacity-100" />
          <div className="relative z-10">
            <div className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-amber-600/35 bg-amber-500/12 dark:border-amber-200/30 dark:bg-amber-200/12">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700 dark:text-amber-100" />
            </div>
            <div className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-slate-600 dark:text-slate-300">
              Total Signals
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-semibold tabular-nums text-slate-900 dark:text-foreground transition-colors duration-300 group-hover:text-amber-600 dark:group-hover:text-amber-300 group-hover:animate-pulse">
              {animatedTotal.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300/70 dark:border-sky-300/18 bg-[linear-gradient(145deg,rgba(240,249,255,0.95),rgba(224,242,254,0.92))] dark:bg-[linear-gradient(145deg,rgba(8,24,37,0.84),rgba(12,56,84,0.62))] p-2.5 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/45 dark:hover:border-sky-300/40 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_20px_34px_-22px_rgba(96,165,250,0.5)]"
          onMouseEnter={() => bumpStatHover("today")}
          onTouchStart={() => bumpStatHover("today")}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-sky-300/22 blur-2xl opacity-60 transition duration-500 group-hover:scale-125 group-hover:opacity-95" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(147,197,253,0.18),transparent_55%)] opacity-70 dark:opacity-100" />
          <div className="relative z-10">
            <div className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-sky-600/35 bg-sky-500/12 dark:border-sky-200/30 dark:bg-sky-200/12">
              <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-700 dark:text-sky-100" />
            </div>
            <div className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-sky-700/80 dark:text-sky-100/70">
              Today
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-semibold tabular-nums text-sky-700 dark:text-sky-200 transition-colors duration-300 group-hover:text-sky-600 dark:group-hover:text-sky-300 group-hover:animate-pulse">
              {animatedToday.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300/70 dark:border-violet-300/18 bg-[linear-gradient(145deg,rgba(250,245,255,0.95),rgba(243,232,255,0.92))] dark:bg-[linear-gradient(145deg,rgba(28,16,45,0.84),rgba(58,28,92,0.62))] p-2.5 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/45 dark:hover:border-violet-300/40 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_20px_34px_-22px_rgba(96,165,250,0.5)]"
          onMouseEnter={() => bumpStatHover("month")}
          onTouchStart={() => bumpStatHover("month")}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-violet-300/20 blur-2xl opacity-60 transition duration-500 group-hover:scale-125 group-hover:opacity-95" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(147,197,253,0.18),transparent_55%)] opacity-70 dark:opacity-100" />
          <div className="relative z-10">
            <div className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-violet-600/35 bg-violet-500/12 dark:border-violet-200/30 dark:bg-violet-200/12">
              <Layers3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-700 dark:text-violet-100" />
            </div>
            <div className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-violet-700/80 dark:text-violet-100/70">
              Monthly
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-semibold tabular-nums text-violet-700 dark:text-violet-200 transition-colors duration-300 group-hover:text-violet-600 dark:group-hover:text-violet-300 group-hover:animate-pulse">
              {animatedMonth.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300/70 dark:border-emerald-300/18 bg-[linear-gradient(145deg,rgba(240,253,250,0.95),rgba(209,250,229,0.92))] dark:bg-[linear-gradient(145deg,rgba(10,25,19,0.84),rgba(17,65,49,0.62))] p-2.5 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/45 dark:hover:border-emerald-300/40 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_20px_34px_-22px_rgba(96,165,250,0.5)] col-span-2 sm:col-span-1"
          onMouseEnter={() => bumpStatHover("plan")}
          onTouchStart={() => bumpStatHover("plan")}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-emerald-300/22 blur-2xl opacity-60 transition duration-500 group-hover:scale-125 group-hover:opacity-95" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(147,197,253,0.18),transparent_55%)] opacity-70 dark:opacity-100" />
          <div className="relative z-10">
            <div className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-emerald-600/35 bg-emerald-500/12 dark:border-emerald-200/30 dark:bg-emerald-200/12">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700 dark:text-emerald-100" />
            </div>
            <div className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-emerald-700/80 dark:text-emerald-100/70">
              Current Plan
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-200 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:animate-pulse">
              {animatedPlan.toLocaleString("en-IN")}
            </div>
            <div className="mt-1 text-[10px] font-medium text-emerald-700/80 dark:text-emerald-100/70">
              {planSinceLabel}
            </div>
          </div>
        </div>

      </section>

      {isLoading ? (
        <div className="rounded-[1.8rem] border border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
          Loading signals...
        </div>
      ) : error ? (
        <div className="rounded-[1.8rem] border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-400">
          Unable to load signals.
        </div>
      ) : signals.length === 0 ? (
        <div className="rounded-[1.8rem] border border-slate-300/70 bg-white/80 p-6 text-sm dark:border-slate-700/60 dark:bg-slate-950/45">
          <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <div className="font-semibold text-base text-slate-700 dark:text-slate-200">
            Add scripts to get signals.
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Use Manage Scripts to select symbols for your signal feed.
          </div>
          <Button
            type="button"
            onClick={() => handleTabChange("scripts")}
            className="mt-5 h-10 rounded-full border border-emerald-500/45 bg-emerald-600 px-6 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_14px_26px_-18px_rgba(5,150,105,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_18px_30px_-18px_rgba(5,150,105,0.95)] dark:border-emerald-400/45 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
          >
            Click Here to Manage Scripts
          </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-[1.8rem] border border-slate-300/70 dark:border-amber-300/18 bg-[linear-gradient(165deg,rgba(248,250,252,0.98),rgba(226,232,240,0.95))] dark:bg-[linear-gradient(165deg,rgba(5,12,24,0.9),rgba(14,23,38,0.84))] backdrop-blur-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300/60 dark:border-amber-200/15 px-4 py-3 sm:px-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/70 bg-white/75 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 dark:border-amber-200/30 dark:bg-amber-200/10 dark:text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                Signal Ledger
              </div>
              <div className="flex flex-wrap items-center gap-2">
                
                <select
                  id="signal-status-filter"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as SignalStatusFilter);
                    setPage(1);
                    setSelectedKey("");
                  }}
                  className="h-8 rounded-full border border-slate-300/80 bg-white/80 px-3 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-400/80 focus:border-primary/50 dark:border-slate-500/45 dark:bg-slate-900/55 dark:text-slate-100"
                >
                  {SIGNAL_STATUS_FILTERS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-primary dark:border-primary/30 dark:bg-primary/12 dark:text-primary">
                  <Activity className="h-3.5 w-3.5" />
                  {entriesLabel}
                </div>
              </div>
            </div>

            {filterHasNoResults ? (
              <div className="px-5 py-10 text-sm text-slate-600 dark:text-slate-300">
                No records found for selected filter.
              </div>
            ) : (
              <>
            <div className="hidden xl:block">
              <div className="grid grid-cols-[1.5fr_0.85fr_0.9fr_0.9fr_1.15fr_1.2fr_0.85fr_0.9fr] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-amber-100/70 border-b border-slate-300/60 dark:border-amber-200/15">
                <HeaderCell icon={ShieldCheck} label="Signal" />
                <HeaderCell icon={TrendingUp} label="Type" />
                <HeaderCell icon={ArrowUpRight} label="Entry" />
                <HeaderCell icon={Target} label="Stop" />
                <HeaderCell icon={BadgeCheck} label="Targets" />
                <HeaderCell icon={Clock3} label="Time" />
                <HeaderCell icon={Activity} label="Status" />
                <HeaderCell icon={Sparkles} label="Points" />
              </div>

              {filteredSignals.map((signal) => {
                const rowKey = getSignalKey(signal);
                const isBuy = isBuySignal(signal);
                const targets = getTargets(signal);
                const points = getResolvedPoints(signal);
                const status = getDisplayStatus(signal);
                const isSelected = activeSignalKey === rowKey;
                const rowSlideLabel = isBuy ? "BUY" : "SELL";

                return (
                  <button
                    type="button"
                    key={rowKey}
                    onClick={() => openSignalDetail(signal)}
                    className={`group/row relative overflow-hidden [perspective:1400px] grid w-full grid-cols-[1.5fr_0.85fr_0.9fr_0.9fr_1.15fr_1.2fr_0.85fr_0.9fr] gap-4 px-5 py-3.5 text-left text-xs border-b border-slate-300/55 dark:border-primary/20 transition-all duration-500 hover:-translate-y-[2px] hover:bg-primary/10 hover:shadow-[0_20px_32px_-20px_rgba(59,130,246,0.6)] before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-primary before:opacity-0 hover:before:opacity-100 after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(110deg,transparent_35%,rgba(59,130,246,0.12)_52%,transparent_65%)] after:opacity-0 hover:after:opacity-100 after:transition-opacity ${
                      isSelected ? "bg-primary/14 before:opacity-100" : ""
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 z-20 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-y-0 left-0 right-0 border-y border-slate-300/60 dark:border-primary/30 bg-[linear-gradient(90deg,rgba(255,255,255,0.96),rgba(226,232,240,0.94))] dark:bg-[linear-gradient(90deg,rgba(30,41,59,0.95),rgba(15,23,42,0.96))] [transform-origin:left_center] [transform:perspective(1400px)_translateX(0)_rotateY(0deg)] group-hover/row:[transform:perspective(1400px)_translateX(-86%)_rotateY(-52deg)] transition-transform duration-700 ease-signal-snap shadow-[0_20px_35px_-25px_rgba(15,23,42,0.75)]" />
                      <span className={`absolute inset-0 grid place-items-center text-xl font-extrabold tracking-[0.28em] ${isBuy ? "text-emerald-700 dark:text-emerald-200" : "text-rose-700 dark:text-rose-200"}`}>
                        {rowSlideLabel}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getSegmentTone(signal.segment)}`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div>
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${getSegmentBadgeTone(signal.segment)}`}
                        >
                          {signal.segment || "SEG"}
                        </div>
                        <div className="mt-1 font-semibold text-slate-900 dark:text-foreground">
                          {signal.symbol || "Signal"}
                        </div>
                        <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatTimeframe(signal.timeframe)}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`inline-flex h-fit w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${isBuy ? "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-200" : "border border-rose-600/30 bg-rose-600/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-200"}`}
                    >
                      {isBuy ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {signal.type || "BUY"}
                    </div>

                    <div className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-foreground transition-colors duration-300 group-hover/row:text-cyan-600 dark:group-hover/row:text-cyan-300 group-hover/row:animate-pulse">
                      <TrendingUp className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                      {formatPrice(getEntry(signal))}
                    </div>

                    <div className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-foreground">
                      <Target className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200" />
                      {formatPrice(getStopLoss(signal))}
                    </div>

                    <div className="inline-flex items-start gap-1.5 text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      <BadgeCheck className="h-3.5 w-3.5 mt-[1px] text-emerald-700 dark:text-emerald-200" />
                      {targets.length ? (
                        <div className="flex flex-wrap gap-1">
                          {targets.map((item, index) => (
                            <span
                              key={`${rowKey}-target-${index + 1}`}
                              className="rounded-full border border-emerald-600/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
                            >
                              T{index + 1}: {formatPrice(item)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </div>

                    <div className="inline-flex items-start gap-1.5 text-[10px] text-slate-700 dark:text-slate-300">
                      <Clock3 className="h-3.5 w-3.5 mt-[1px] text-amber-700 dark:text-amber-100" />
                      <span>
                        {formatDate(getDisplaySignalTime(signal))}
                      </span>
                    </div>

                    <div
                      className={`inline-flex h-fit w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusTone(status)}`}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      {status}
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 font-semibold ${getPointsTone(points)}`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                      {formatPoints(points)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 p-3 sm:p-5 xl:hidden">
              {filteredSignals.map((signal) => {
                const cardKey = getSignalKey(signal);
                const isBuy = isBuySignal(signal);
                const targets = getTargets(signal);
                const points = getResolvedPoints(signal);
                const status = getDisplayStatus(signal);
                const isSelected = activeSignalKey === cardKey;
                const isBookOpen = openedMobileBookKey === cardKey;
                const coverTone = isBuy
                  ? "from-emerald-200 via-teal-100 to-cyan-100 text-slate-900"
                  : "from-rose-200 via-orange-100 to-amber-100 text-slate-900";

                return (
                  <div
                    key={cardKey}
                    className={`group relative rounded-[1.35rem] border shadow-[0_16px_34px_-28px_rgba(15,23,42,0.3)] transition-all duration-500 [perspective:1400px] ${
                      isSelected
                        ? "border-primary/45 bg-primary/[0.07] dark:border-primary/35 dark:bg-primary/[0.08]"
                        : "border-slate-300/75 bg-white/85 dark:border-primary/28 dark:bg-slate-950/55"
                    }`}
                  >
                    <div className="relative min-h-[248px]">
                      <div
                        className={`rounded-[1.35rem] px-3 py-3 transition-all duration-500 ${isBookOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div
                              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${getSegmentBadgeTone(signal.segment)}`}
                            >
                              {signal.segment || "SEG"}
                            </div>
                            <div className="mt-1 truncate text-[15px] font-semibold text-slate-900 dark:text-foreground">
                              {signal.symbol || "Signal"}
                            </div>
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {formatTimeframe(signal.timeframe)}
                            </div>
                          </div>
                          <div
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              isBuy
                                ? "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-200"
                                : "border border-rose-600/30 bg-rose-600/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-200"
                            }`}
                          >
                            {isBuy ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {signal.type || "BUY"}
                          </div>
                        </div>

                        <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg border border-slate-300/70 bg-white/90 p-2 dark:border-primary/30 dark:bg-slate-900/70">
                            <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
                              <TrendingUp className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                              Entry
                            </div>
                            <div className="mt-1 text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                              {formatPrice(getEntry(signal))}
                            </div>
                          </div>
                          <div className="rounded-lg border border-slate-300/70 bg-white/90 p-2 dark:border-primary/30 dark:bg-slate-900/70">
                            <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
                              <Target className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200" />
                              Stop Loss
                            </div>
                            <div className="mt-1 text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                              {formatPrice(getStopLoss(signal))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 rounded-lg border border-slate-300/70 bg-white/90 p-2 dark:border-primary/30 dark:bg-slate-900/70">
                          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-200" />
                            Targets
                          </div>
                          {targets.length ? (
                            <div className="mt-1 grid grid-cols-3 gap-1.5">
                              {targets.map((item, index) => (
                                <span
                                  key={`${cardKey}-target-${index + 1}`}
                                  className="rounded-full border border-emerald-600/20 bg-emerald-500/10 px-2 py-1 text-center text-[9px] font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
                                >
                                  TP{index + 1}: {formatPrice(item)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">-</div>
                          )}
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                          <div
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${getStatusTone(status)}`}
                          >
                            <Activity className="h-3.5 w-3.5" />
                            {status}
                          </div>
                          <div
                            className={`inline-flex items-center gap-1 font-semibold ${getPointsTone(points)}`}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                            {formatPoints(points)}
                          </div>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] leading-4 text-slate-700 dark:text-slate-300">
                          <Clock3 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                          {formatDate(getDisplaySignalTime(signal))}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            onClick={() => openSignalDetail(signal)}
                            className="h-9 flex-1 rounded-lg px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                          >
                            View Full Details
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenedMobileBookKey("")}
                            className="h-9 rounded-lg px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                          >
                            Close
                          </Button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleMobileBook(signal)}
                        className={`absolute inset-0 w-full rounded-[1.35rem] bg-gradient-to-br ${coverTone} p-3.5 text-left transition-all duration-700 [backface-visibility:hidden] [transform-origin:left_center] ${
                          isBookOpen
                            ? "pointer-events-none [transform:rotateY(-104deg)] shadow-[14px_0_28px_-20px_rgba(15,23,42,0.42)]"
                            : "pointer-events-auto [transform:rotateY(0deg)]"
                        }`}
                      >
                        <div className="absolute inset-y-3.5 left-3 w-px bg-slate-700/12" />
                        <div className="absolute inset-y-4 left-4.5 w-1 rounded-full bg-slate-900/6 blur-[1px]" />
                        <div className="flex h-full flex-col justify-between">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800/10 bg-white/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-800/85 backdrop-blur-sm">
                                <Layers3 className="h-3.5 w-3.5" />
                                Signal Book
                              </div>
                              <div className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-800/55">
                                Tap To Open
                              </div>
                            </div>
                            <div className="rounded-full border border-slate-800/10 bg-white/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-800/80 backdrop-blur-sm">
                              {signal.segment || "SEG"}
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-800/55">
                              {isBuy ? "BUY SIGNAL" : "SELL SIGNAL"}
                            </div>
                            <div className="mt-2 text-[1.65rem] font-black tracking-[0.12em] text-slate-900">
                              {signal.type || (isBuy ? "BUY" : "SELL")}
                            </div>
                            <div className="mt-1.5 max-w-[11rem] text-base font-semibold leading-tight text-slate-900/90">
                              {signal.symbol || "Signal"}
                            </div>
                            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-slate-800/10 bg-white/45 px-2.5 py-1 text-[10px] font-medium text-slate-800/75 backdrop-blur-sm">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {formatTimeframe(signal.timeframe)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-800/65">
                            <span className="truncate pr-2">{formatDate(getDisplaySignalTime(signal))}</span>
                            <span className="inline-flex shrink-0 items-center gap-1">
                              {isBuy ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                              Open
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-slate-300/70 dark:border-amber-200/20 bg-[linear-gradient(160deg,rgba(248,250,252,0.96),rgba(226,232,240,0.92))] dark:bg-[linear-gradient(160deg,rgba(8,14,28,0.88),rgba(12,20,36,0.74))] p-3 sm:p-4 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              className="h-9 sm:h-10 rounded-xl border-slate-300/80 bg-white/70 text-slate-700 hover:bg-slate-100 dark:border-amber-200/25 dark:bg-amber-200/8 dark:text-amber-100 dark:hover:bg-amber-200/15"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 text-center inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
              Page <span className="font-semibold text-slate-900 dark:text-foreground">{currentPage}</span> of{" "}
              <span className="font-semibold text-slate-900 dark:text-foreground">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              className="h-9 sm:h-10 rounded-xl border-slate-300/80 bg-white/70 text-slate-700 hover:bg-slate-100 dark:border-amber-200/25 dark:bg-amber-200/8 dark:text-amber-100 dark:hover:bg-amber-200/15"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </section>

          <Dialog
            open={isDetailVisible}
            onOpenChange={(open) => {
              setIsDetailOpen(open);
              if (!open) {
                setLiveTick(null);
              }
            }}
          >
            <DialogContent className="max-h-[94vh] w-[calc(100vw-0.75rem)] max-w-[calc(100vw-0.75rem)] overflow-y-auto border-slate-300/70 bg-[linear-gradient(160deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))] p-0 text-slate-900 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.7)] dark:border-primary/25 dark:bg-[linear-gradient(165deg,rgba(5,12,24,0.98),rgba(14,23,38,0.96))] dark:text-slate-100 sm:max-h-[92vh] sm:max-w-3xl">
              {detailSignal ? (
                <>
                  <div className="border-b border-slate-300/60 px-3 py-3 dark:border-primary/20 sm:px-6 sm:py-5">
                    <DialogHeader className="gap-2 sm:gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]">
                            <Sparkles className="h-3.5 w-3.5" />
                            Signal Details
                          </div>
                          <DialogTitle className="text-lg font-semibold tracking-tight sm:text-2xl">
                            {detailSignal.symbol || "Signal"}
                          </DialogTitle>
                          <DialogDescription className="max-w-2xl text-[11px] leading-5 text-slate-600 dark:text-slate-300 sm:text-xs">
                            Entry, exit, stop loss, targets, and live outcome for this signal.
                          </DialogDescription>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openSignalChart(detailSignal)}
                            className="h-8 rounded-full border-slate-300/80 bg-white/80 px-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-100 dark:border-primary/25 dark:bg-slate-900/55 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-9 sm:px-4 sm:text-[10px] sm:tracking-[0.16em]"
                          >
                            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                            Open Chart
                          </Button>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                              isBuySignal(detailSignal)
                                ? "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-200"
                                : "border border-rose-600/30 bg-rose-600/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-200"
                            } sm:px-3 sm:text-[10px]`}
                          >
                            {isBuySignal(detailSignal) ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {detailSignal.type || "BUY"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold ${getSegmentBadgeTone(detailSignal.segment)} sm:px-3 sm:text-[10px]`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {detailSignal.segment || "SEG"}
                            {detailSignal.timeframe ? ` - ${formatTimeframe(detailSignal.timeframe)}` : ""}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold ${getStatusTone(getDisplayStatus(detailSignal))} sm:px-3 sm:text-[10px]`}
                          >
                            <Activity className="h-3.5 w-3.5" />
                            {getDisplayStatus(detailSignal)}
                          </span>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>

                  <div className="space-y-3 px-3 py-3 sm:space-y-5 sm:px-6 sm:py-5">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
                      <div className="rounded-xl border border-slate-300/65 bg-white/85 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-2xl sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <TrendingUp className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                          Entry
                        </div>
                        <div className="mt-1.5 text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-lg">
                          {formatPrice(getEntry(detailSignal))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-300/65 bg-white/85 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-2xl sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <ArrowDownRight className="h-3.5 w-3.5 text-primary" />
                          Live Price
                        </div>
                        <div className="mt-1.5 text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-lg">
                          {formatPrice(detailLivePrice)}
                        </div>
                        <div className="mt-1.5 text-[9px] leading-4 text-slate-600 dark:text-slate-300 sm:mt-2 sm:text-[11px] sm:leading-5">
                          Bid <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPrice(detailBid)}</span>
                          {" • "}
                          Ask <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPrice(detailAsk)}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-300/65 bg-white/85 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-2xl sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <Target className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200" />
                          Stop Loss
                        </div>
                        <div className="mt-1.5 text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-lg">
                          {formatPrice(getStopLoss(detailSignal))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-300/65 bg-white/85 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-2xl sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                          Points
                        </div>
                        <div className={`mt-1.5 text-sm font-semibold leading-tight ${getPointsTone(getResolvedPoints(detailSignal, detailLivePrice))} sm:mt-2 sm:text-lg`}>
                          {formatPoints(getResolvedPoints(detailSignal, detailLivePrice))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-300/65 bg-white/80 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-[1.4rem] sm:p-4">
                      <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-200" />
                        Targets
                      </div>
                      {getTargets(detailSignal).length ? (
                        <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3">
                          {getTargets(detailSignal).map((target, index) => (
                            <div
                              key={`${getSignalKey(detailSignal)}-detail-target-${index + 1}`}
                              className="rounded-xl border border-emerald-600/20 bg-emerald-500/10 px-3 py-2.5 dark:border-emerald-300/25 dark:bg-emerald-300/10 sm:rounded-2xl sm:px-4 sm:py-3"
                            >
                              <div className="text-center text-[8px] uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-100 sm:text-[10px] sm:tracking-[0.18em]">
                                TP {index + 1}
                              </div>
                              <div className="mt-1 text-center text-[11px] font-semibold leading-tight text-emerald-800 dark:text-emerald-100 sm:text-base">
                                {formatPrice(target)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 sm:mt-3">
                          Targets not available.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="rounded-xl border border-slate-300/65 bg-white/80 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-[1.4rem] sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <Clock3 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                          Signal Time
                        </div>
                        <div className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-sm sm:leading-5">
                          {formatDate(getDisplaySignalTime(detailSignal))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-300/65 bg-white/80 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-[1.4rem] sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <CalendarClock className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                          Exit Time
                        </div>
                        <div className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-sm sm:leading-5">
                          {formatDate(getDisplayExitTime(detailSignal))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-300/65 bg-white/80 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-[1.4rem] sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <ShieldCheck className="h-3.5 w-3.5 text-violet-700 dark:text-violet-200" />
                          Timeframe
                        </div>
                        <div className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-sm sm:leading-5">
                          {formatTimeframe(detailSignal.timeframe)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-300/65 bg-white/80 p-3 dark:border-primary/25 dark:bg-slate-950/55 sm:rounded-[1.4rem] sm:p-4">
                        <div className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300 sm:text-[10px] sm:tracking-[0.18em]">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          Exit Summary
                        </div>
                        <div className="mt-1.5 text-[11px] font-semibold leading-4 text-slate-900 dark:text-slate-100 sm:mt-2 sm:text-sm sm:leading-5">
                          {getDisplayStatus(detailSignal)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-6 py-8 text-sm text-slate-600 dark:text-slate-300">
                  Signal details are not available on this page.
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
        </TabsContent>

        <TabsContent value="scripts">
          <ManageScriptsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SignalsPageFallback() {
  return (
    <div className="flex-1 space-y-4 sm:space-y-6 py-2">
      <div className="rounded-[1.8rem] border border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
        Loading signals...
      </div>
    </div>
  );
}

export default function SignalsPage() {
  return (
    <Suspense fallback={<SignalsPageFallback />}>
      <SignalsPageContent />
    </Suspense>
  );
}
