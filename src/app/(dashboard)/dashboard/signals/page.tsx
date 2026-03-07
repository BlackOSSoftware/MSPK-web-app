"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSignalsQuery } from "@/services/signals/signal.hooks";
import { useMarketUserWatchlistQuery } from "@/services/market/market.hooks";
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
  Eye,
  Layers3,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
type SignalRuntimeShape = SignalItem & {
  entry_price?: unknown;
  stop_loss?: unknown;
  exit?: unknown;
  exit_price?: unknown;
  total_points?: unknown;
  trade_type?: string;
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
    [signal.symbol, signal.type, signal.signalTime || signal.timestamp || signal.createdAt]
      .filter(Boolean)
      .join("|")
  );
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

function getResolvedPoints(signal: SignalItem) {
  const runtimeSignal = signal as SignalRuntimeShape;
  const storedPoints = toFiniteNumber(signal.totalPoints ?? runtimeSignal.total_points);
  const entry = getEntry(signal);
  const exit = getExit(signal);

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

type StatHoverKey = "total" | "active" | "closed";

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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statHoverPulse, setStatHoverPulse] = useState<Record<StatHoverKey, number>>({
    total: 0,
    active: 0,
    closed: 0,
  });
  const activeTab = searchParams.get("tab") === "scripts" ? "scripts" : "feed";

  const { data, isLoading, isFetching, error, refetch } = useSignalsQuery({ page, limit: 12 });
  const watchlistQuery = useMarketUserWatchlistQuery(true, { staleTime: 15_000 });

  const signals = useMemo(() => data?.results ?? [], [data?.results]);
  const selectedScripts = useMemo(
    () =>
      (watchlistQuery.data ?? [])
        .map((item) => ({
          symbol: String(item.symbol || "").trim().toUpperCase(),
          segment: String(item.segment || "").trim().toUpperCase(),
        }))
        .filter((item) => item.symbol.length > 0),
    [watchlistQuery.data]
  );
  const visibleScripts = selectedScripts.slice(0, 8);
  const hiddenScriptCount = Math.max(0, selectedScripts.length - visibleScripts.length);
  const pagination = data?.pagination;
  const focusSignal = useMemo(() => {
    if (signals.length === 0) return undefined;
    if (!selectedKey) return signals[0];
    return signals.find((item) => getSignalKey(item) === selectedKey) ?? signals[0];
  }, [signals, selectedKey]);
  const activeSignalKey = focusSignal ? getSignalKey(focusSignal) : "";
  const latestSignalKey = signals.length > 0 ? getSignalKey(signals[0]) : "";
  const isFocusLatest = Boolean(activeSignalKey && activeSignalKey === latestSignalKey);
  const focusIsBuy = focusSignal ? isBuySignal(focusSignal) : true;
  const focusStatus = focusSignal ? getDisplayStatus(focusSignal) : "-";
  const detailSignal = useMemo(() => {
    if (!selectedKey) return null;
    return signals.find((item) => getSignalKey(item) === selectedKey) ?? null;
  }, [signals, selectedKey]);

  const stats = useMemo(() => {
    const total = data?.stats?.totalSignals ?? pagination?.totalResults ?? signals.length;
    const active =
      data?.stats?.activeSignals ??
      signals.filter((s) => s.status?.toLowerCase() === "active").length;
    const closed =
      data?.stats?.closedSignals ??
      signals.filter((s) => {
        const normalized = getDisplayStatus(s).toLowerCase();
        return normalized.includes("close") || normalized.includes("target") || normalized.includes("stop") || normalized.includes("partial");
      }).length;
    return { total, active, closed };
  }, [signals, pagination, data?.stats]);
  const emptyMessage = data?.access?.message || "No signals found.";

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentPage = pagination?.page ?? page;
  const bumpStatHover = (key: StatHoverKey) =>
    setStatHoverPulse((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  const animatedTotal = useAnimatedCount(stats.total, statHoverPulse.total);
  const animatedActive = useAnimatedCount(stats.active, statHoverPulse.active);
  const animatedClosed = useAnimatedCount(stats.closed, statHoverPulse.closed);
  const isDetailVisible = isDetailOpen && Boolean(detailSignal);

  const openSignalDetail = (signal: SignalItem) => {
    setSelectedKey(getSignalKey(signal));
    setIsDetailOpen(true);
  };

  const selectSignal = (signal: SignalItem) => {
    setSelectedKey(getSignalKey(signal));
    setIsDetailOpen(false);
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
                ? formatDate(focusSignal.signalTime || focusSignal.timestamp || focusSignal.createdAt)
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
      <section className="rounded-[1.6rem] border border-slate-300/70 dark:border-amber-300/18 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] dark:bg-[linear-gradient(165deg,rgba(5,12,24,0.84),rgba(14,23,38,0.78))] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/75 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-700 dark:border-amber-200/25 dark:bg-amber-200/10 dark:text-amber-100">
              <Eye className="h-3.5 w-3.5" />
              Selected Scripts
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Signals aapki selected scripts ke hisaab se dikh rahe hain, aur selected scripts par signals unlimited aa sakte hain.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200">
              {selectedScripts.length} script{selectedScripts.length === 1 ? "" : "s"} active
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTabChange("scripts")}
              className="h-8 rounded-full border-emerald-500/25 bg-emerald-500/10 px-3 text-[10px] uppercase tracking-[0.16em] text-emerald-700 hover:bg-emerald-500/16 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200"
            >
              Manage Scripts
            </Button>
          </div>
        </div>

        {selectedScripts.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleScripts.map((item) => (
              <span
                key={`${item.segment}-${item.symbol}`}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
              >
                <span>{item.symbol}</span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-900/55 dark:text-slate-300">
                  {item.segment || "SCRIPT"}
                </span>
              </span>
            ))}
            {hiddenScriptCount > 0 ? (
              <span className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:border-slate-600/70 dark:bg-slate-900/60 dark:text-slate-200">
                +{hiddenScriptCount} more
              </span>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold">Koi script selected nahi hai.</div>
              <div className="text-xs sm:text-sm text-amber-700/90 dark:text-amber-100/80">
                Manage Scripts tab se symbols add karo. Har segment me maximum 10 scripts add kar sakte ho, lekin selected scripts ke liye signals unlimited milenge.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange("scripts")}
              className="inline-flex h-10 items-center justify-center rounded-full border border-amber-700/25 bg-white/80 px-4 text-xs font-semibold text-amber-800 transition-colors hover:bg-white dark:border-amber-200/20 dark:bg-slate-950/55 dark:text-amber-100 dark:hover:bg-slate-900/75"
            >
              Open Manage Scripts
            </button>
          </div>
        )}
      </section>

      <section className="relative grid grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-3">
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
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300/70 dark:border-emerald-300/18 bg-[linear-gradient(145deg,rgba(240,253,250,0.95),rgba(209,250,229,0.92))] dark:bg-[linear-gradient(145deg,rgba(10,25,19,0.84),rgba(17,65,49,0.62))] p-2.5 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/45 dark:hover:border-emerald-300/40 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_20px_34px_-22px_rgba(96,165,250,0.5)]"
          onMouseEnter={() => bumpStatHover("active")}
          onTouchStart={() => bumpStatHover("active")}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-emerald-300/22 blur-2xl opacity-60 transition duration-500 group-hover:scale-125 group-hover:opacity-95" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(147,197,253,0.18),transparent_55%)] opacity-70 dark:opacity-100" />
          <div className="relative z-10">
            <div className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-emerald-600/35 bg-emerald-500/12 dark:border-emerald-200/30 dark:bg-emerald-200/12">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700 dark:text-emerald-100" />
            </div>
            <div className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-emerald-700/80 dark:text-emerald-100/70">
              Active
            </div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-200 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:animate-pulse">
              {animatedActive.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div
          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-300/70 dark:border-cyan-300/18 bg-[linear-gradient(145deg,rgba(240,249,255,0.95),rgba(224,242,254,0.92))] dark:bg-[linear-gradient(145deg,rgba(8,24,37,0.84),rgba(12,56,84,0.62))] p-2.5 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/45 dark:hover:border-cyan-300/40 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.12),0_20px_34px_-22px_rgba(96,165,250,0.5)]"
          onMouseEnter={() => bumpStatHover("closed")}
          onTouchStart={() => bumpStatHover("closed")}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl opacity-60 transition duration-500 group-hover:scale-125 group-hover:opacity-95" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(147,197,253,0.18),transparent_55%)] opacity-70 dark:opacity-100" />
          <div className="relative z-10">
            <div className="inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-cyan-600/35 bg-cyan-500/12 dark:border-cyan-200/30 dark:bg-cyan-200/12">
              <Clock3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-700 dark:text-cyan-100" />
            </div>
            <div className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] text-cyan-700/80 dark:text-cyan-100/70">Closed</div>
            <div className="mt-0.5 sm:mt-1 text-base sm:text-3xl font-semibold tabular-nums text-cyan-700 dark:text-cyan-200 transition-colors duration-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 group-hover:animate-pulse">
              {animatedClosed.toLocaleString("en-IN")}
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
        <div className="rounded-[1.8rem] border border-border/60 bg-background/60 p-6 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <>
          <section className="rounded-[1.8rem] border border-slate-300/70 dark:border-amber-300/18 bg-[linear-gradient(165deg,rgba(248,250,252,0.98),rgba(226,232,240,0.95))] dark:bg-[linear-gradient(165deg,rgba(5,12,24,0.9),rgba(14,23,38,0.84))] backdrop-blur-xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-300/60 dark:border-amber-200/15 px-4 py-3 sm:px-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-400/70 bg-white/75 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-700 dark:border-amber-200/30 dark:bg-amber-200/10 dark:text-amber-100">
                <Sparkles className="h-3.5 w-3.5" />
                Signal Ledger
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-primary dark:border-primary/30 dark:bg-primary/12 dark:text-primary">
                <Activity className="h-3.5 w-3.5" />
                {pagination?.totalResults ?? signals.length} entries
              </div>
            </div>

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

              {signals.map((signal) => {
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
                          {signal.timeframe || "-"}
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
                        {formatDate(signal.signalTime || signal.timestamp || signal.createdAt)}
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

            <div className="grid gap-3 p-4 sm:p-5 xl:hidden">
              {signals.map((signal) => {
                const cardKey = getSignalKey(signal);
                const isBuy = isBuySignal(signal);
                const targets = getTargets(signal);
                const points = getResolvedPoints(signal);
                const status = getDisplayStatus(signal);
                const isSelected = activeSignalKey === cardKey;
                const bookFlipLabel = isBuy ? "BUY" : "SELL";

                return (
                  <button
                    type="button"
                    key={cardKey}
                    onClick={() => selectSignal(signal)}
                    className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 [perspective:1200px] ${
                      isSelected
                        ? "border-primary/55 bg-primary/12 dark:border-primary/50 dark:bg-primary/14"
                        : "border-slate-300/70 bg-white/75 hover:-translate-y-1 hover:border-slate-400/75 hover:bg-slate-100/85 dark:border-primary/28 dark:bg-slate-950/55 dark:hover:border-primary/50 dark:hover:bg-primary/10"
                    }`}
                  >
                    <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-amber-200/25 blur-2xl opacity-0 transition-all duration-500 group-hover:opacity-90 group-hover:scale-125" />
                    <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl border border-slate-300/80 bg-[linear-gradient(165deg,rgba(255,255,255,0.98),rgba(226,232,240,0.95))] shadow-[0_16px_34px_-20px_rgba(15,23,42,0.6)] dark:border-primary/40 dark:bg-[linear-gradient(165deg,rgba(23,37,84,0.94),rgba(15,23,42,0.96))] [transform-origin:left_center] [transform:perspective(1200px)_rotateY(0deg)] group-hover:[transform:perspective(1200px)_rotateY(-82deg)] group-active:[transform:perspective(1200px)_rotateY(-82deg)] transition-transform duration-700 ease-signal-snap">
                      <div className="absolute left-0 top-0 h-full w-4 rounded-l-2xl bg-[linear-gradient(180deg,rgba(148,163,184,0.55),rgba(71,85,105,0.5))] dark:bg-[linear-gradient(180deg,rgba(96,165,250,0.4),rgba(30,58,138,0.45))]" />
                      <div className="relative h-full px-5 py-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-200">
                          Signal Cover
                        </div>
                        <div className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                          {signal.symbol || "Signal"}
                        </div>
                        <div className="absolute bottom-4 left-5 inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-3 py-1 text-[11px] font-extrabold tracking-[0.2em] text-emerald-700 dark:border-emerald-400/45 dark:bg-emerald-400/15 dark:text-emerald-200">
                          {bookFlipLabel}
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 space-y-3 transition-all duration-500 group-hover:translate-x-2 group-hover:opacity-100 group-active:translate-x-2 group-active:opacity-100 opacity-95">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getSegmentTone(signal.segment)}`}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <div>
                            <div
                              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] font-semibold ${getSegmentBadgeTone(signal.segment)}`}
                            >
                              {signal.segment || "SEG"}
                            </div>
                            <div className="text-base font-semibold text-slate-900 dark:text-foreground">
                              {signal.symbol || "Signal"}
                            </div>
                            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {signal.timeframe || "-"}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${isBuy ? "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-200" : "border border-rose-600/30 bg-rose-600/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-200"}`}
                        >
                          {isBuy ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {signal.type || "BUY"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl border border-slate-300/65 bg-white/80 p-2.5 dark:border-primary/30 dark:bg-slate-900/70">
                          <div className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                            Entry
                          </div>
                          <div className="mt-1 font-semibold text-slate-900 dark:text-foreground transition-colors duration-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 group-hover:animate-pulse">
                            {formatPrice(getEntry(signal))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-300/65 bg-white/80 p-2.5 dark:border-primary/30 dark:bg-slate-900/70">
                          <div className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
                            <Target className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200" />
                            Stop
                          </div>
                          <div className="mt-1 font-semibold text-slate-900 dark:text-foreground">
                            {formatPrice(getStopLoss(signal))}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-300/65 bg-white/80 p-2.5 col-span-2 dark:border-primary/30 dark:bg-slate-900/70">
                          <div className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200 inline-flex items-center gap-1">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-200" />
                            Targets
                          </div>
                          {targets.length ? (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {targets.map((item, index) => (
                                <span
                                  key={`${cardKey}-target-${index + 1}`}
                                  className="rounded-full border border-emerald-600/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
                                >
                                  TP{index + 1} {formatPrice(item)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 font-semibold text-slate-900 dark:text-foreground">-</div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
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

                      <div className="text-[10px] text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                        {formatDate(signal.signalTime || signal.timestamp || signal.createdAt)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
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

          <Dialog open={isDetailVisible} onOpenChange={setIsDetailOpen}>
            <DialogContent className="max-h-[92vh] overflow-y-auto border-slate-300/70 bg-[linear-gradient(160deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))] p-0 text-slate-900 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.7)] dark:border-primary/25 dark:bg-[linear-gradient(165deg,rgba(5,12,24,0.98),rgba(14,23,38,0.96))] dark:text-slate-100 sm:max-w-3xl">
              {detailSignal ? (
                <>
                  <div className="border-b border-slate-300/60 px-5 py-5 dark:border-primary/20 sm:px-6">
                    <DialogHeader className="gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
                            <Sparkles className="h-3.5 w-3.5" />
                            Signal Details
                          </div>
                          <DialogTitle className="text-2xl font-semibold tracking-tight">
                            {detailSignal.symbol || "Signal"}
                          </DialogTitle>
                          <DialogDescription className="max-w-2xl text-xs text-slate-600 dark:text-slate-300">
                            Entry, exit, stop loss, targets, and live outcome for this signal.
                          </DialogDescription>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold ${
                              isBuySignal(detailSignal)
                                ? "border border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/12 dark:text-emerald-200"
                                : "border border-rose-600/30 bg-rose-600/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/12 dark:text-rose-200"
                            }`}
                          >
                            {isBuySignal(detailSignal) ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {detailSignal.type || "BUY"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold ${getSegmentBadgeTone(detailSignal.segment)}`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {detailSignal.segment || "SEG"}
                            {detailSignal.timeframe ? ` - ${detailSignal.timeframe}` : ""}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusTone(getDisplayStatus(detailSignal))}`}
                          >
                            <Activity className="h-3.5 w-3.5" />
                            {getDisplayStatus(detailSignal)}
                          </span>
                        </div>
                      </div>
                    </DialogHeader>
                  </div>

                  <div className="space-y-5 px-5 py-5 sm:px-6">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-300/65 bg-white/85 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <TrendingUp className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                          Entry
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {formatPrice(getEntry(detailSignal))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-300/65 bg-white/85 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <ArrowDownRight className="h-3.5 w-3.5 text-primary" />
                          Exit
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {formatPrice(getExit(detailSignal))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-300/65 bg-white/85 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <Target className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200" />
                          Stop Loss
                        </div>
                        <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {formatPrice(getStopLoss(detailSignal))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-300/65 bg-white/85 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <Sparkles className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                          Points
                        </div>
                        <div className={`mt-2 text-lg font-semibold ${getPointsTone(getResolvedPoints(detailSignal))}`}>
                          {formatPoints(getResolvedPoints(detailSignal))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-300/65 bg-white/80 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                      <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-200" />
                        Targets
                      </div>
                      {getTargets(detailSignal).length ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {getTargets(detailSignal).map((target, index) => (
                            <div
                              key={`${getSignalKey(detailSignal)}-detail-target-${index + 1}`}
                              className="rounded-2xl border border-emerald-600/20 bg-emerald-500/10 px-4 py-3 dark:border-emerald-300/25 dark:bg-emerald-300/10"
                            >
                              <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-100">
                                Target {index + 1}
                              </div>
                              <div className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-100">
                                {formatPrice(target)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                          Targets not available.
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-slate-300/65 bg-white/80 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <Clock3 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                          Signal Time
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatDate(
                            detailSignal.signalTime || detailSignal.timestamp || detailSignal.createdAt,
                          )}
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-slate-300/65 bg-white/80 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <CalendarClock className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-200" />
                          Exit Time
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatDate(detailSignal.exitTime)}
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-slate-300/65 bg-white/80 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          Exit Summary
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {getDisplayStatus(detailSignal)}
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] border border-slate-300/65 bg-white/80 p-4 dark:border-primary/25 dark:bg-slate-950/55">
                        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                          Signal ID
                        </div>
                        <div className="mt-2 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {detailSignal.uniqueId || detailSignal.webhookId || getSignalId(detailSignal) || "-"}
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
