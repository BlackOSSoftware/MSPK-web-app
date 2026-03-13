"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type LineWidth,
  type MouseEventParams,
  LineStyle,
  TrackingModeExitMode,
  type UTCTimestamp,
} from "lightweight-charts";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  CandlestickChart,
  Check,
  ChevronDown,
  Crosshair,
  Eye,
  EyeOff,
  GripVertical,
  LineChart,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  ScanSearch,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CandleLoader } from "@/components/ui/candle-loader";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AUTH_TOKEN_COOKIE, getCookie } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import {
  MARKET_QUERY_KEY,
  USER_MARKET_WATCHLISTS_QUERY_KEY,
  useMarketHistoryQuery,
  useMarketSearchQuery,
  useMarketUserWatchlistsQuery,
  useMarketUserWatchlistAddMutation,
  useMarketUserWatchlistCreateMutation,
  useMarketUserWatchlistDeleteMutation,
  useMarketUserWatchlistQuery,
  useMarketUserWatchlistReorderMutation,
  useMarketUserWatchlistRemoveMutation,
  useMarketUserWatchlistUpdateMutation,
} from "@/services/market/market.hooks";
import type { MarketSearchItem, MarketTicker } from "@/services/market/market.types";
import { useSignalsQuery } from "@/services/signals/signal.hooks";
import type { SignalItem } from "@/services/signals/signal.types";
type ConnectionState = "connecting" | "connected" | "disconnected" | "error";
type ViewMode = "table" | "cards";
type CardPulse = "up" | "down";

const VIEW_MODE_STORAGE_KEY = "watchlist_view_mode";
const TABLE_COLUMN_STORAGE_KEY = "watchlist_table_columns_v1";
const TABLE_COLUMN_WIDTHS_KEY = "watchlist_table_column_widths_v1";
const CHART_TYPE_STORAGE_KEY = "watchlist_chart_type";
const CHART_VISIBILITY_STORAGE_KEY = "watchlist_chart_visibility_v1";
const WATCHLIST_ROW_ORDER_STORAGE_KEY = "watchlist_row_order_v1";
const SUPPORT_WHATSAPP = "917770039037";
const USER_WATCHLIST_QUERY_KEY = [...MARKET_QUERY_KEY, "user-watchlist", "active"] as const;
const CHART_BAR_SPACING_DEFAULT = 6;
const CHART_BAR_SPACING_MIN = 2;
const CHART_BAR_SPACING_MAX = 24;
const CHART_BAR_SPACING_STEP = 2;
const PRICE_LINE_CLICK_TOLERANCE_PX = 10;

type SocketTick = {
  symbol: string;
  price?: number;
  high?: number;
  low?: number;
  close?: number;
  bid?: number;
  ask?: number;
  change?: number;
  changePercent?: number;
  timestamp?: string;
};

type WatchlistRow = {
  symbol: string;
  name: string;
  segment: string;
  exchange: string;
  open?: number;
  currentPrice?: number;
  high?: number;
  low?: number;
  close?: number;
  bid?: number;
  ask?: number;
  changePercent?: number;
  points?: number;
  updatedAt?: string;
};

type ChartInterval = "1" | "2" | "5" | "10" | "15" | "60" | "D" | "W" | "M";
type ChartType = "candle" | "heikin";
type HistoryCandle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};
type TickPoint = {
  time: number;
  price: number;
};
type SignalRuntimeShape = SignalItem & {
  trade_type?: string;
  entry_price?: unknown;
  stop_loss?: unknown;
};
type ChartVisibilitySettings = {
  showOhlc: boolean;
  showSignalSummary: boolean;
  showEntryLine: boolean;
  showStopLossLine: boolean;
  showTargetLines: boolean;
};

const DEFAULT_CHART_VISIBILITY_SETTINGS: ChartVisibilitySettings = {
  showOhlc: true,
  showSignalSummary: true,
  showEntryLine: true,
  showStopLossLine: true,
  showTargetLines: true,
};

const CHART_VISIBILITY_OPTIONS: Array<{
  key: keyof ChartVisibilitySettings;
  label: string;
  description: string;
}> = [
  {
    key: "showOhlc",
    label: "OHLC values",
    description: "Open, high, low, close values shown on top of the chart.",
  },
  {
    key: "showSignalSummary",
    label: "Signal summary",
    description: "Current signal with entry, SL, and targets in the top info box.",
  },
  {
    key: "showEntryLine",
    label: "Entry line",
    description: "Horizontal line for the signal entry price.",
  },
  {
    key: "showStopLossLine",
    label: "Stop loss line",
    description: "Horizontal line for the stop loss price.",
  },
  {
    key: "showTargetLines",
    label: "Target lines",
    description: "Horizontal lines for TP1, TP2, and TP3.",
  },
];
const toUTCTimestamp = (value: number): UTCTimestamp => value as UTCTimestamp;

const DEFAULT_TABLE_COLUMNS = [
  "symbol",
  "name",
  "segment",
  "exchange",
  "open",
  "current",
  "high",
  "low",
  "close",
  "changePercent",
  "points",
  "bid",
  "ask",
  "action",
] as const;

const CHART_INTERVALS: { label: string; value: ChartInterval }[] = [
  { label: "1m", value: "1" },
  { label: "2m", value: "2" },
  { label: "5m", value: "5" },
  { label: "10m", value: "10" },
  { label: "15m", value: "15" },
  { label: "1h", value: "60" },
  { label: "1D", value: "D" },
  { label: "1W", value: "W" },
  { label: "1M", value: "M" },
];
const CHART_TYPES: { label: string; value: ChartType }[] = [
  { label: "Candles", value: "candle" },
  { label: "Heikin Ashi", value: "heikin" },
];

const MIN_HISTORY_CANDLES = 5;
const HISTORY_CANDLE_COUNT = 500;
const MAX_TICK_HISTORY_LENGTH = 5000;
const TICK_HISTORY_WINDOW_SEC = 12 * 60 * 60;
const CHART_UPDATE_THROTTLE_MS = 250;
const INDIA_TIME_ZONE = "Asia/Kolkata";
const INDIA_TIME_ZONE_OFFSET_SEC = 5.5 * 60 * 60;
const INDIA_MARKET_OPEN_LOCAL_SEC = 9 * 60 * 60 + 15 * 60;
const INDIA_MARKET_OPEN_UTC_SEC = INDIA_MARKET_OPEN_LOCAL_SEC - INDIA_TIME_ZONE_OFFSET_SEC;
const INDIA_EXCHANGES = new Set(["NSE", "BSE", "NFO", "MCX", "CDS", "BCD"]);

type TableColumnId = (typeof DEFAULT_TABLE_COLUMNS)[number];

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPositiveNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getSignalDirection(signal: SignalItem | null): "BUY" | "SELL" | null {
  if (!signal) return null;
  const runtimeSignal = signal as SignalRuntimeShape;
  const rawType = String(signal.type || runtimeSignal.trade_type || "").trim().toUpperCase();
  if (rawType === "SELL" || rawType === "EXIT_SELL") return "SELL";
  if (rawType === "BUY" || rawType === "EXIT_BUY") return "BUY";
  return null;
}

function getCurrentSignalLabel(signal: SignalItem | null): string | null {
  if (!signal) return null;
  const normalizedStatus = String(signal.status || "").trim().toLowerCase();

  if (normalizedStatus.includes("target")) return "TARGET HIT";
  if (normalizedStatus.includes("partial")) return "PARTIAL";
  if (normalizedStatus.includes("stop")) return "STOPLOSS";
  if (normalizedStatus.includes("close")) return "CLOSED";

  return getSignalDirection(signal);
}

function getCurrentSignalEntry(signal: SignalItem | null): number | undefined {
  if (!signal) return undefined;
  const runtimeSignal = signal as SignalRuntimeShape;
  return toNumber(signal.entry ?? runtimeSignal.entry_price ?? signal.entryPrice);
}

function getCurrentSignalStopLoss(signal: SignalItem | null): number | undefined {
  if (!signal) return undefined;
  const runtimeSignal = signal as SignalRuntimeShape;
  return toNumber(signal.stoploss ?? runtimeSignal.stop_loss ?? signal.stopLoss);
}

function getCurrentSignalTargets(signal: SignalItem | null): number[] {
  if (!signal?.targets) return [];
  if (Array.isArray(signal.targets)) {
    return signal.targets
      .map((value) => toNumber(value))
      .filter((value): value is number => typeof value === "number");
  }

  const { target1, target2, target3, t1, t2, t3 } = signal.targets;
  return [target1 ?? t1, target2 ?? t2, target3 ?? t3]
    .map((value) => toNumber(value))
    .filter((value): value is number => typeof value === "number");
}

function getCurrentSignalAchievedTargetLevels(signal: SignalItem | null): number[] {
  if (!signal) return [];

  const achievedLevels = new Set<number>();
  const markAchievedThrough = (level: number) => {
    for (let index = 1; index <= level; index += 1) {
      achievedLevels.add(index);
    }
  };

  const normalizedNotes = String(signal.notes || "").trim().toUpperCase();
  if (normalizedNotes) {
    if (normalizedNotes.includes("TP3") || normalizedNotes.includes("T3")) {
      markAchievedThrough(3);
    } else if (normalizedNotes.includes("TP2") || normalizedNotes.includes("T2")) {
      markAchievedThrough(2);
    } else if (normalizedNotes.includes("TP1") || normalizedNotes.includes("T1")) {
      markAchievedThrough(1);
    }
  }

  const normalizedStatus = String(signal.status || "").trim().toUpperCase();
  const signalTargets = getCurrentSignalTargets(signal);
  const exitPrice = toNumber(signal.exitPrice);
  const matchedTargetLevel =
    typeof exitPrice === "number"
      ? signalTargets.findIndex((target) => Math.abs(target - exitPrice) < 0.01) + 1
      : 0;

  if (matchedTargetLevel > 0) {
    markAchievedThrough(matchedTargetLevel);
  } else if (normalizedStatus.includes("TARGET")) {
    markAchievedThrough(1);
  } else if (normalizedStatus.includes("PARTIAL")) {
    markAchievedThrough(1);
  }

  return Array.from(achievedLevels).sort((a, b) => a - b);
}

function getCurrentSignalAchievedSummary(signal: SignalItem | null): string | null {
  if (!signal) return null;
  const achievedLevels = getCurrentSignalAchievedTargetLevels(signal);
  if (achievedLevels.length > 0) {
    return `${achievedLevels.map((level) => `TP${level}`).join(" • ")} Achieved`;
  }

  const notes = String(signal.notes || "").trim();
  return /achieved/i.test(notes) ? notes : null;
}

function getLiveAchievedTargetLevels(signal: SignalItem | null, latestPrice: number | undefined): number[] {
  if (!signal || typeof latestPrice !== "number" || !Number.isFinite(latestPrice)) return [];

  const direction = getSignalDirection(signal);
  if (!direction) return [];

  return getCurrentSignalTargets(signal)
    .map((target, index) => {
      const isHit =
        direction === "BUY" ? latestPrice >= target : latestPrice <= target;
      return isHit ? index + 1 : null;
    })
    .filter((value): value is number => typeof value === "number");
}

function isTouchInteractionDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const coarsePointer =
    typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)").matches : false;
  return coarsePointer || navigator.maxTouchPoints > 0;
}

function getChartTypeIcon(type: ChartType) {
  return type === "heikin" ? LineChart : CandlestickChart;
}

function isIndianMarketSymbol(row?: Pick<WatchlistRow, "exchange"> | null, symbol?: string | null): boolean {
  const exchange = String(row?.exchange ?? "").trim().toUpperCase();
  if (INDIA_EXCHANGES.has(exchange)) return true;
  const normalizedSymbol = String(symbol ?? "").trim().toUpperCase();
  return (
    normalizedSymbol.startsWith("NSE:") ||
    normalizedSymbol.startsWith("BSE:") ||
    normalizedSymbol.startsWith("NFO:") ||
    normalizedSymbol.startsWith("MCX:") ||
    normalizedSymbol.startsWith("CDS:") ||
    normalizedSymbol.startsWith("BCD:")
  );
}

function normalizeBucketOffset(timeSec: number, intervalSec: number): number {
  if (!Number.isFinite(timeSec) || !Number.isFinite(intervalSec) || intervalSec <= 0) return 0;
  const offset = Math.floor(timeSec) % intervalSec;
  return offset >= 0 ? offset : offset + intervalSec;
}

function toDateFromChartTime(time: unknown): Date | null {
  if (typeof time === "number" && Number.isFinite(time)) {
    return new Date(time * 1000);
  }
  if (time && typeof time === "object") {
    const value = time as { year?: number; month?: number; day?: number };
    if (
      typeof value.year === "number" &&
      typeof value.month === "number" &&
      typeof value.day === "number"
    ) {
      return new Date(Date.UTC(value.year, value.month - 1, value.day));
    }
  }
  return null;
}

function formatChartTimeLabel(
  time: unknown,
  interval: ChartInterval,
  timeZone?: string,
  includeDate = false
): string {
  const date = toDateFromChartTime(time);
  if (!date) return "";
  const intraday = interval !== "D" && interval !== "W" && interval !== "M";
  const options: Intl.DateTimeFormatOptions = intraday
    ? {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        ...(includeDate ? { day: "2-digit", month: "short" } : {}),
      }
    : {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      };
  if (timeZone) {
    options.timeZone = timeZone;
  }
  return new Intl.DateTimeFormat("en-IN", options).format(date);
}

function getFirstPositive(...values: Array<unknown>): number | undefined {
  for (const value of values) {
    const parsed = toPositiveNumber(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function intervalToSeconds(interval: ChartInterval): number {
  switch (interval) {
    case "1":
      return 1 * 60;
    case "2":
      return 2 * 60;
    case "5":
      return 5 * 60;
    case "10":
      return 10 * 60;
    case "15":
      return 15 * 60;
    case "60":
      return 60 * 60;
    case "D":
      return 24 * 60 * 60;
    case "W":
      return 7 * 24 * 60 * 60;
    case "M":
      return 30 * 24 * 60 * 60;
    default:
      return 15 * 60;
  }
}

function getTickPrice(tick: SocketTick): number | undefined {
  return (
    toPositiveNumber(tick.price) ??
    toPositiveNumber(tick.close) ??
    toPositiveNumber(tick.bid) ??
    toPositiveNumber(tick.ask)
  );
}

function getTickTimestamp(tick: SocketTick): number {
  if (tick.timestamp) {
    const parsed = Date.parse(tick.timestamp);
    if (!Number.isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
  }
  return Math.floor(Date.now() / 1000);
}

function getBucketStart(
  timeSec: number,
  interval: ChartInterval,
  intervalSec: number,
  bucketOffsetSec = 0,
  timezoneOffsetSec = 0
): UTCTimestamp {
  if (interval === "D" || interval === "W" || interval === "M") {
    const safeZoneOffset = Number.isFinite(timezoneOffsetSec) ? timezoneOffsetSec : 0;
    const date = new Date((timeSec + safeZoneOffset) * 1000);
    if (interval === "D") {
      date.setUTCHours(0, 0, 0, 0);
    } else if (interval === "W") {
      const day = date.getUTCDay();
      const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
      date.setUTCDate(diff);
      date.setUTCHours(0, 0, 0, 0);
    } else {
      date.setUTCDate(1);
      date.setUTCHours(0, 0, 0, 0);
    }
    return toUTCTimestamp(Math.floor(date.getTime() / 1000) - safeZoneOffset);
  }

  const safeBucketOffset = normalizeBucketOffset(bucketOffsetSec, intervalSec);
  const bucket = Math.floor((timeSec - safeBucketOffset) / intervalSec) * intervalSec + safeBucketOffset;
  return toUTCTimestamp(bucket);
}

function getChartBucketOffset(interval: ChartInterval, intervalSec: number, isIndianMarket = false): number {
  if (!Number.isFinite(intervalSec) || intervalSec <= 0) return 0;
  if (interval === "D" || interval === "W" || interval === "M") return 0;
  if (!isIndianMarket) return 0;
  return normalizeBucketOffset(INDIA_MARKET_OPEN_UTC_SEC, intervalSec);
}

function normalizeCandleTime(
  timeSec: number,
  interval: ChartInterval,
  intervalSec: number,
  isIndianMarket = false
): UTCTimestamp {
  return getBucketStart(
    timeSec,
    interval,
    intervalSec,
    getChartBucketOffset(interval, intervalSec, isIndianMarket),
    isIndianMarket ? INDIA_TIME_ZONE_OFFSET_SEC : 0
  );
}

function buildCandlesFromTicks(
  points: TickPoint[],
  interval: ChartInterval,
  intervalSec: number,
  isIndianMarket = false
): HistoryCandle[] {
  if (intervalSec <= 0 || points.length === 0) return [];
  const bucketOffsetSec = getChartBucketOffset(interval, intervalSec, isIndianMarket);
  const candles: HistoryCandle[] = [];
  let current: HistoryCandle | null = null;
  let previousClose: number | null = null;

  for (const point of points) {
    if (!Number.isFinite(point.time) || !Number.isFinite(point.price)) continue;
    const bucketTime = getBucketStart(
      point.time,
      interval,
      intervalSec,
      bucketOffsetSec,
      isIndianMarket ? INDIA_TIME_ZONE_OFFSET_SEC : 0
    );
    if (!current || bucketTime !== current.time) {
      const seededOpen: number = previousClose ?? point.price;
      current = {
        time: bucketTime,
        open: seededOpen,
        high: Math.max(seededOpen, point.price),
        low: Math.min(seededOpen, point.price),
        close: point.price,
      };
      candles.push(current);
    } else {
      current.high = Math.max(current.high, point.price);
      current.low = Math.min(current.low, point.price);
      current.close = point.price;
    }
    previousClose = current.close;
  }

  return candles;
}

function calculateHeikinAshi(candles: HistoryCandle[]): HistoryCandle[] {
  if (candles.length === 0) return [];
  const haCandles: HistoryCandle[] = [];
  const first = candles[0];
  haCandles.push({ ...first });
  for (let i = 1; i < candles.length; i += 1) {
    const curr = candles[i];
    const prev = haCandles[i - 1];
    const haClose = (curr.open + curr.high + curr.low + curr.close) / 4;
    const haOpen = (prev.open + prev.close) / 2;
    const haHigh = Math.max(curr.high, haOpen, haClose);
    const haLow = Math.min(curr.low, haOpen, haClose);
    haCandles.push({
      time: curr.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: curr.volume,
    });
  }
  return haCandles;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function reorderSymbolOrder(symbols: string[], draggedSymbol: string, targetSymbol: string) {
  const draggedIndex = symbols.indexOf(draggedSymbol);
  const targetIndex = symbols.indexOf(targetSymbol);
  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return symbols;
  }

  const next = [...symbols];
  const [movedSymbol] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, movedSymbol);
  return next;
}

function reorderWatchlistItems(items: MarketTicker[], orderedSymbols: string[]) {
  const itemMap = new Map(items.map((item) => [normalizeSymbol(item.symbol ?? ""), item]));
  const orderedItems = orderedSymbols
    .map((symbol) => itemMap.get(symbol))
    .filter((item): item is MarketTicker => Boolean(item));
  const remainingItems = items.filter(
    (item) => !orderedSymbols.includes(normalizeSymbol(item.symbol ?? ""))
  );
  return [...orderedItems, ...remainingItems];
}

function areSameSymbolOrder(left: string[], right: string[]) {
  return left.length === right.length && left.every((symbol, index) => symbol === right[index]);
}

function getStoredWatchlistRowOrders(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WATCHLIST_ROW_ORDER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map((item) => normalizeSymbol(String(item))) : [],
      ])
    );
  } catch {
    return {};
  }
}

function setStoredWatchlistRowOrders(next: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WATCHLIST_ROW_ORDER_STORAGE_KEY, JSON.stringify(next));
}

function getReferencePrice(
  row: Pick<WatchlistRow, "open" | "currentPrice" | "high" | "low" | "close" | "bid" | "ask">
): number | undefined {
  const candidates = [row.currentPrice, row.open, row.high, row.low, row.close, row.bid, row.ask];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  }
  return undefined;
}

function getPriceDigits(
  row: Pick<WatchlistRow, "segment" | "exchange">,
  referenceValue?: number
): number {
  if (row.segment === "CURRENCY" || row.exchange === "FOREX") return 5;
  if (
    (row.segment === "CRYPTO" || row.exchange === "CRYPTO") &&
    typeof referenceValue === "number" &&
    Number.isFinite(referenceValue)
  ) {
    const abs = Math.abs(referenceValue);
    if (abs > 0 && abs < 1) return 5;
    if (abs >= 1 && abs < 100) return 3;
  }
  return 2;
}

function formatWithDigits(value: number, digits: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatNumber(value?: number, digits = 2): string {
  return typeof value === "number" ? formatWithDigits(value, digits) : "--";
}

function formatPercent(value?: number): string {
  if (typeof value !== "number") return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatPoints(value?: number, digits = 2): string {
  if (typeof value !== "number") return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatWithDigits(value, digits)}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message ===
    "string"
  ) {
    return String((error as { response?: { data?: { message?: string } } }).response?.data?.message);
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
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

function getSuggestionLabel(item: MarketSearchItem): string {
  const symbol = item.symbol ?? "";
  const name = item.name ? ` - ${item.name}` : "";
  return `${symbol}${name}`;
}

function mapSocketTick(payload: Record<string, unknown>): SocketTick | null {
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
    symbol: normalizeSymbol(symbolRaw),
    price: toPositiveNumber(payload.price ?? payload.last_price ?? payload.lastPrice ?? payload.last),
    high: toPositiveNumber(payload.high ?? ohlc?.high),
    low: toPositiveNumber(payload.low ?? ohlc?.low),
    close: toPositiveNumber(payload.close ?? payload.prevClose ?? ohlc?.close),
    bid: toPositiveNumber(payload.bid ?? payload.bestBid ?? bidFromDepth),
    ask: toPositiveNumber(payload.ask ?? payload.bestAsk ?? askFromDepth),
    change: toNumber(payload.change),
    changePercent: toNumber(payload.changePercent ?? payload.change_percent),
    timestamp:
      typeof payload.timestamp === "string"
        ? payload.timestamp
        : payload.timestamp instanceof Date
          ? payload.timestamp.toISOString()
          : undefined,
  };
}

function areTicksEqual(left?: SocketTick, right?: SocketTick): boolean {
  if (!left || !right) return false;
  return (
    left.symbol === right.symbol &&
    left.price === right.price &&
    left.high === right.high &&
    left.low === right.low &&
    left.close === right.close &&
    left.bid === right.bid &&
    left.ask === right.ask &&
    left.change === right.change &&
    left.changePercent === right.changePercent &&
    left.timestamp === right.timestamp
  );
}

function mapWatchlistRow(base: MarketTicker, live?: SocketTick): WatchlistRow | null {
  if (!base.symbol) return null;
  const symbol = normalizeSymbol(base.symbol);
  const currentPrice = getFirstPositive(
    live?.price,
    base.price,
    live?.close,
    base.close,
    base.prevClose,
    live?.bid,
    live?.ask,
    base.bid,
    base.ask
  );
  const close = getFirstPositive(live?.close, base.close, base.prevClose, currentPrice);
  const highCandidates = [live?.high, base.high, currentPrice].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0
  );
  const lowCandidates = [live?.low, base.low, currentPrice].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0
  );
  let high = highCandidates.length > 0 ? Math.max(...highCandidates) : undefined;
  let low = lowCandidates.length > 0 ? Math.min(...lowCandidates) : undefined;
  if (
    typeof high === "number" &&
    typeof low === "number" &&
    Number.isFinite(high) &&
    Number.isFinite(low) &&
    high < low
  ) {
    [high, low] = [low, high];
  }
  const points =
    live?.change ??
    base.points ??
    (typeof currentPrice === "number" && typeof close === "number" ? currentPrice - close : undefined);

  return {
    symbol,
    name: base.name ?? "--",
    segment: base.segment ?? "--",
    exchange: base.exchange ?? "--",
    open: getFirstPositive(base.open),
    currentPrice,
    high,
    low,
    close,
    bid: getFirstPositive(live?.bid, base.bid),
    ask: getFirstPositive(live?.ask, base.ask),
    changePercent: live?.changePercent ?? base.change,
    points,
    updatedAt: live?.timestamp,
  };
}

function WatchlistPageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const chartMode = searchParams.get("chart") === "1";
  const urlSymbol = useMemo(() => {
    const raw = searchParams.get("symbol");
    return raw ? normalizeSymbol(raw) : "";
  }, [searchParams]);
  const urlInterval = searchParams.get("interval") ?? "";
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const watchlistSymbolsRef = useRef<string[]>([]);
  const connectRef = useRef<() => void>(() => {});
  const closeSocketRef = useRef<(reason?: string) => void>(() => {});
  const mountedRef = useRef(true);

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [ticks, setTicks] = useState<Record<string, SocketTick>>({});
  const [symbolInput, setSymbolInput] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [exchangeFilter, setExchangeFilter] = useState("ALL");
  const [tableSearch, setTableSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateWatchlistOpen, setIsCreateWatchlistOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isWatchlistEditMode, setIsWatchlistEditMode] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [chartInterval, setChartInterval] = useState<ChartInterval>("15");
  const [chartType, setChartType] = useState<ChartType>("candle");
  const [isChartVisibilityDialogOpen, setIsChartVisibilityDialogOpen] = useState(false);
  const [chartVisibility, setChartVisibility] = useState<ChartVisibilitySettings>(
    DEFAULT_CHART_VISIBILITY_SETTINGS
  );
  const [hasChartData, setHasChartData] = useState(false);
  const [crosshairEnabled, setCrosshairEnabled] = useState(true);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [showChartToolbar, setShowChartToolbar] = useState(false);
  const chartBarSpacingRef = useRef(CHART_BAR_SPACING_DEFAULT);
  const chartManualZoomRef = useRef(false);
  const crosshairEnabledRef = useRef(true);
  const chartFitProgrammaticRef = useRef(false);
  const chartHoverRef = useRef(false);
  const hideToolbarTimerRef = useRef<number | null>(null);
  const [chartLegend, setChartLegend] = useState<HistoryCandle | null>(null);
  const chartLegendRef = useRef<HistoryCandle | null>(null);
  const [cardPulseMap, setCardPulseMap] = useState<Record<string, CardPulse>>({});
  const [highPulseMap, setHighPulseMap] = useState<Record<string, CardPulse>>({});
  const [lowPulseMap, setLowPulseMap] = useState<Record<string, CardPulse>>({});
  const [draggedCardSymbol, setDraggedCardSymbol] = useState<string | null>(null);
  const [dragOverCardSymbol, setDragOverCardSymbol] = useState<string | null>(null);
  const [savedRowOrders, setSavedRowOrders] = useState<Record<string, string[]>>({});
  const [draggedRowSymbol, setDraggedRowSymbol] = useState<string | null>(null);
  const [dragOverRowSymbol, setDragOverRowSymbol] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<TableColumnId[]>([...DEFAULT_TABLE_COLUMNS]);
  const [hiddenColumns, setHiddenColumns] = useState<TableColumnId[]>([]);
  const [draggedColumn, setDraggedColumn] = useState<TableColumnId | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TableColumnId | null>(null);
  const [resizingColumn, setResizingColumn] = useState<TableColumnId | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<TableColumnId, number>>({
    symbol: 160,
    name: 220,
    segment: 130,
    exchange: 120,
    open: 120,
    current: 150,
    high: 120,
    low: 120,
    close: 120,
    changePercent: 150,
    points: 130,
    bid: 120,
    ask: 120,
    action: 130,
  });

  const previousPriceRef = useRef<Record<string, number>>({});
  const previousHighRef = useRef<Record<string, number>>({});
  const previousLowRef = useRef<Record<string, number>>({});
  const pulseTimeoutRef = useRef<Record<string, number>>({});
  const pendingTicksRef = useRef<Record<string, SocketTick>>({});
  const tickHistoryRef = useRef<Record<string, TickPoint[]>>({});
  const tickFlushRafRef = useRef<number | null>(null);
  const cardDragStartOrderRef = useRef<string[]>([]);
  const cardPointerIdRef = useRef<number | null>(null);
  const rowDragStartOrderRef = useRef<string[]>([]);
  const rowPointerIdRef = useRef<number | null>(null);
  const [chartContainerReady, setChartContainerReady] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const signalPriceLinesRef = useRef<IPriceLine[]>([]);
  const touchCrosshairPointerIdRef = useRef<number | null>(null);
  const chartRawCandlesRef = useRef<HistoryCandle[]>([]);
  const chartCandlesRef = useRef<HistoryCandle[]>([]);
  const lastChartUpdateRef = useRef(0);
  const historyCacheRef = useRef<Record<string, HistoryCandle[]>>({});
  const chartKeyRef = useRef<string>("");
  const selectedRowRef = useRef<WatchlistRow | null>(null);
  const resizeRef = useRef<{
    col: TableColumnId | null;
    startX: number;
    startWidth: number;
  }>({ col: null, startX: 0, startWidth: 0 });
  const setChartContainer = useCallback((node: HTMLDivElement | null) => {
    chartContainerRef.current = node;
    setChartContainerReady(Boolean(node));
  }, []);

  const watchlistsQuery = useMarketUserWatchlistsQuery(!chartMode);
  const watchlistQuery = useMarketUserWatchlistQuery(!chartMode, {
    staleTime: 8_000,
    refetchInterval: 25_000,
  });
  const addMutation = useMarketUserWatchlistAddMutation();
  const removeMutation = useMarketUserWatchlistRemoveMutation();
  const reorderMutation = useMarketUserWatchlistReorderMutation();
  const createWatchlistMutation = useMarketUserWatchlistCreateMutation();
  const updateWatchlistMutation = useMarketUserWatchlistUpdateMutation();
  const deleteWatchlistMutation = useMarketUserWatchlistDeleteMutation();

  const searchMarketQuery = useMarketSearchQuery(
    { q: searchQuery, limit: 12 },
    searchQuery.trim().length >= 2
  );

  const watchlistSymbols = useMemo(() => {
    if (chartMode) {
      return selectedSymbol ? [selectedSymbol] : [];
    }
    return (watchlistQuery.data ?? [])
      .map((item) => (item.symbol ? normalizeSymbol(item.symbol) : ""))
      .filter(Boolean);
  }, [chartMode, selectedSymbol, watchlistQuery.data]);
  const userWatchlists = useMemo(
    () => watchlistsQuery.data?.watchlists ?? [],
    [watchlistsQuery.data]
  );
  const activeWatchlistId = useMemo(() => {
    const fromApi = String(watchlistsQuery.data?.activeWatchlistId || "").trim();
    if (fromApi) return fromApi;
    const explicitActive = userWatchlists.find((item) => item.isActive)?.id;
    if (explicitActive) return explicitActive;
    return userWatchlists[0]?.id || "";
  }, [watchlistsQuery.data, userWatchlists]);
  const activeWatchlist = useMemo(
    () => userWatchlists.find((item) => item.id === activeWatchlistId) ?? null,
    [userWatchlists, activeWatchlistId]
  );
  const watchlistBusy =
    createWatchlistMutation.isPending ||
    updateWatchlistMutation.isPending ||
    deleteWatchlistMutation.isPending;

  useEffect(() => {
    watchlistSymbolsRef.current = watchlistSymbols;
  }, [watchlistSymbols]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!urlSymbol) return;
    setSelectedSymbol(urlSymbol);
  }, [urlSymbol]);

  useEffect(() => {
    if (!urlInterval) return;
    const normalized = urlInterval.toUpperCase();
    if (
      normalized === "1" ||
      normalized === "2" ||
      normalized === "5" ||
      normalized === "10" ||
      normalized === "15" ||
      normalized === "60" ||
      normalized === "D" ||
      normalized === "W" ||
      normalized === "M"
    ) {
      setChartInterval(normalized as ChartInterval);
    }
  }, [urlInterval]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CHART_TYPE_STORAGE_KEY);
    if (stored === "candle" || stored === "heikin") {
      setChartType(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(CHART_VISIBILITY_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<ChartVisibilitySettings>;
      if (!parsed || typeof parsed !== "object") return;
      setChartVisibility((prev) => ({
        ...prev,
        showOhlc: typeof parsed.showOhlc === "boolean" ? parsed.showOhlc : prev.showOhlc,
        showSignalSummary:
          typeof parsed.showSignalSummary === "boolean"
            ? parsed.showSignalSummary
            : prev.showSignalSummary,
        showEntryLine:
          typeof parsed.showEntryLine === "boolean" ? parsed.showEntryLine : prev.showEntryLine,
        showStopLossLine:
          typeof parsed.showStopLossLine === "boolean"
            ? parsed.showStopLossLine
            : prev.showStopLossLine,
        showTargetLines:
          typeof parsed.showTargetLines === "boolean"
            ? parsed.showTargetLines
            : prev.showTargetLines,
      }));
    } catch {
      // ignore invalid storage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedView = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (savedView === "table" || savedView === "cards") {
      setViewMode(savedView);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSavedRowOrders(getStoredWatchlistRowOrders());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(TABLE_COLUMN_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { order?: string[]; hidden?: string[] };
      const order = Array.isArray(parsed.order)
        ? parsed.order.filter((col): col is TableColumnId =>
            DEFAULT_TABLE_COLUMNS.includes(col as TableColumnId)
          )
        : [];
      const hidden = Array.isArray(parsed.hidden)
        ? parsed.hidden.filter((col): col is TableColumnId =>
            DEFAULT_TABLE_COLUMNS.includes(col as TableColumnId)
          )
        : [];
      const normalizedOrder = [
        ...new Set([
          ...order,
          ...DEFAULT_TABLE_COLUMNS.filter((col) => !order.includes(col)),
        ]),
      ];
      setColumnOrder(normalizedOrder);
      setHiddenColumns(hidden);
    } catch {
      // ignore invalid storage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHART_TYPE_STORAGE_KEY, chartType);
  }, [chartType]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHART_VISIBILITY_STORAGE_KEY, JSON.stringify(chartVisibility));
  }, [chartVisibility]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      TABLE_COLUMN_STORAGE_KEY,
      JSON.stringify({ order: columnOrder, hidden: hiddenColumns })
    );
  }, [columnOrder, hiddenColumns]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(TABLE_COLUMN_WIDTHS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (!parsed || typeof parsed !== "object") return;
      setColumnWidths((prev) => {
        const next = { ...prev };
        Object.keys(parsed).forEach((key) => {
          const value = Number(parsed[key]);
          if (Number.isFinite(value) && value >= 80 && value <= 480) {
            next[key as TableColumnId] = value;
          }
        });
        return next;
      });
    } catch {
      // ignore invalid storage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TABLE_COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    if (hiddenColumns.length >= columnOrder.length) {
      setHiddenColumns([]);
    }
  }, [hiddenColumns.length, columnOrder.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(symbolInput.trim());
    }, 260);

    return () => window.clearTimeout(timer);
  }, [symbolInput]);

  const getColumnWidthStyle = (col: TableColumnId) => {
    const width = columnWidths[col];
    if (!width) return undefined;
    return { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` };
  };

  const startResize = (col: TableColumnId, event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = columnWidths[col] ?? 140;
    resizeRef.current = { col, startX, startWidth };
    setResizingColumn(col);

    const previousBodyCursor = document.body.style.cursor;
    const previousBodyUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent: PointerEvent) => {
      const { col: activeCol, startX: start, startWidth: base } = resizeRef.current;
      if (!activeCol) return;
      const delta = moveEvent.clientX - start;
      const nextWidth = Math.min(480, Math.max(80, Math.round(base + delta)));
      setColumnWidths((prev) => ({
        ...prev,
        [activeCol]: nextWidth,
      }));
    };

    const handleUp = () => {
      resizeRef.current = { col: null, startX: 0, startWidth: 0 };
      setResizingColumn(null);
      document.body.style.cursor = previousBodyCursor;
      document.body.style.userSelect = previousBodyUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  const searchSuggestions = useMemo(() => {
    const list = searchMarketQuery.data ?? [];
    const selected = new Set(watchlistSymbols);
    const used = new Set<string>();
    const suggestions: MarketSearchItem[] = [];

    for (const item of list) {
      if (!item.symbol) continue;
      const symbol = normalizeSymbol(item.symbol);
      if (selected.has(symbol) || used.has(symbol)) continue;
      used.add(symbol);
      suggestions.push({ ...item, symbol });
      if (suggestions.length >= 8) break;
    }

    return suggestions;
  }, [searchMarketQuery.data, watchlistSymbols]);
  const pendingSymbol = useMemo(() => normalizeSymbol(symbolInput), [symbolInput]);
  const hasExactSuggestion = useMemo(
    () => searchSuggestions.some((item) => item.symbol === pendingSymbol),
    [searchSuggestions, pendingSymbol]
  );
  const showQuickAdd =
    pendingSymbol.length > 0 && !watchlistSymbols.includes(pendingSymbol) && !hasExactSuggestion;

  useEffect(() => {
    const activeSymbols = new Set(watchlistSymbols.map((sym) => sym.toUpperCase()));
    if (activeSymbols.size === 0) {
      pendingTicksRef.current = {};
      tickHistoryRef.current = {};
      if (tickFlushRafRef.current !== null) {
        window.cancelAnimationFrame(tickFlushRafRef.current);
        tickFlushRafRef.current = null;
      }
      setTicks({});
      return;
    }

    const nextPendingTicks: Record<string, SocketTick> = {};
    for (const [symbol, tick] of Object.entries(pendingTicksRef.current)) {
      if (activeSymbols.has(symbol)) nextPendingTicks[symbol] = tick;
    }
    pendingTicksRef.current = nextPendingTicks;
    const nextHistory: Record<string, TickPoint[]> = {};
    for (const symbol of activeSymbols) {
      const history = tickHistoryRef.current[symbol];
      if (history && history.length > 0) {
        nextHistory[symbol] = history;
      }
    }
    tickHistoryRef.current = nextHistory;

    setTicks((prev) => {
      const next: Record<string, SocketTick> = {};
      for (const sym of Object.keys(prev)) {
        if (activeSymbols.has(sym)) next[sym] = prev[sym];
      }
      return next;
    });
  }, [watchlistSymbols]);

  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_COOKIE);
    if (!token) {
      setConnectionState("disconnected");
      return;
    }

    let closedByEffect = false;
    const flushPendingTicks = () => {
      const pendingEntries = Object.entries(pendingTicksRef.current);
      if (pendingEntries.length === 0) return;
      pendingTicksRef.current = {};

      const historyMap = tickHistoryRef.current;
      setTicks((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [symbol, tick] of pendingEntries) {
          const price = getTickPrice(tick);
          if (price !== undefined) {
            const time = getTickTimestamp(tick);
            const existing = historyMap[symbol] ?? [];
            const last = existing[existing.length - 1];
            if (!last || time >= last.time) {
              if (last && time === last.time) {
                last.price = price;
              } else {
                existing.push({ time, price });
              }
              const cutoff = time - TICK_HISTORY_WINDOW_SEC;
              while (existing.length > 0 && existing[0].time < cutoff) {
                existing.shift();
              }
              if (existing.length > MAX_TICK_HISTORY_LENGTH) {
                existing.splice(0, existing.length - MAX_TICK_HISTORY_LENGTH);
              }
              historyMap[symbol] = existing;
            }
          }
          if (areTicksEqual(prev[symbol], tick)) continue;
          next[symbol] = tick;
          changed = true;
        }
        return changed ? next : prev;
      });
    };

    const scheduleTickFlush = () => {
      if (tickFlushRafRef.current !== null) return;
      tickFlushRafRef.current = window.requestAnimationFrame(() => {
        tickFlushRafRef.current = null;
        flushPendingTicks();
      });
    };

    const scheduleReconnect = () => {
      if (!mountedRef.current || closedByEffect) return;
      if (document.hidden) return;
      if (watchlistSymbolsRef.current.length === 0) return;
      const existing = wsRef.current;
      if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
        return;
      }
      const waitMs = Math.min(6_000, 1_200 + reconnectAttempts.current * 500);
      reconnectAttempts.current += 1;
      reconnectRef.current = window.setTimeout(() => {
        connect();
      }, waitMs);
    };

    const connect = () => {
      if (closedByEffect || !mountedRef.current) return;
      if (document.hidden) return;
      if (watchlistSymbolsRef.current.length === 0) return;
      const existing = wsRef.current;
      if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
        return;
      }
      if (existing && (existing.readyState === WebSocket.CLOSING || existing.readyState === WebSocket.CLOSED)) {
        wsRef.current = null;
      }
      setConnectionState("connecting");

      let socketUrl = "";
      try {
        socketUrl = getMarketSocketUrl(token);
      } catch {
        setConnectionState("error");
        return;
      }

      const socket = new WebSocket(socketUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (wsRef.current !== socket) return;
        if (closedByEffect || !mountedRef.current) return;
        setConnectionState("connected");
        reconnectAttempts.current = 0;
        const symbols = watchlistSymbolsRef.current;
        if (symbols.length > 0) {
          for (const symbol of symbols) {
            socket.send(JSON.stringify({ type: "subscribe", payload: symbol }));
          }
          subscribedSymbolsRef.current = new Set(symbols);
        } else {
          subscribedSymbolsRef.current.clear();
        }
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        if (wsRef.current !== socket) return;
        try {
          const message = JSON.parse(event.data) as {
            type?: string;
            payload?: unknown;
          };
          if (message.type !== "tick") return;
          if (!message.payload || typeof message.payload !== "object") return;

          const tick = mapSocketTick(message.payload as Record<string, unknown>);
          if (!tick) return;

          pendingTicksRef.current[tick.symbol] = tick;
          scheduleTickFlush();
        } catch {
          // ignore malformed socket payloads
        }
      };

      socket.onerror = () => {
        if (wsRef.current !== socket) return;
        if (closedByEffect || !mountedRef.current) return;
        setConnectionState("error");
      };

      socket.onclose = () => {
        if (wsRef.current !== socket) return;
        if (closedByEffect || !mountedRef.current) return;
        setConnectionState("disconnected");
        subscribedSymbolsRef.current.clear();
        scheduleReconnect();
      };
    };

    const closeSocket = () => {
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      const socket = wsRef.current;
      wsRef.current = null;
      if (socket) {
        try {
          if (socket.readyState === WebSocket.OPEN) {
            for (const symbol of subscribedSymbolsRef.current) {
              socket.send(JSON.stringify({ type: "unsubscribe", payload: symbol }));
            }
          }
        } catch {
          // ignore socket errors during cleanup
        }
        subscribedSymbolsRef.current.clear();
        socket.close();
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        closeSocket();
        setConnectionState("disconnected");
        return;
      }
      connect();
    };

    connectRef.current = connect;
    closeSocketRef.current = closeSocket;

    connect();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    window.addEventListener("online", connect);
    window.addEventListener("offline", closeSocket);

    return () => {
      closedByEffect = true;
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      window.removeEventListener("online", connect);
      window.removeEventListener("offline", closeSocket);
      closeSocket();
      pendingTicksRef.current = {};
      if (tickFlushRafRef.current !== null) {
        window.cancelAnimationFrame(tickFlushRafRef.current);
        tickFlushRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    const nextSet = new Set(watchlistSymbols);
    const currentSet = subscribedSymbolsRef.current;

    if (nextSet.size === 0) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        for (const symbol of currentSet) {
          ws.send(JSON.stringify({ type: "unsubscribe", payload: symbol }));
        }
      }
      subscribedSymbolsRef.current.clear();
      closeSocketRef.current("empty");
      return;
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connectRef.current();
      return;
    }

    for (const symbol of currentSet) {
      if (!nextSet.has(symbol)) {
        ws.send(JSON.stringify({ type: "unsubscribe", payload: symbol }));
      }
    }

    for (const symbol of nextSet) {
      if (!currentSet.has(symbol)) {
        ws.send(JSON.stringify({ type: "subscribe", payload: symbol }));
      }
    }

    subscribedSymbolsRef.current = nextSet;
  }, [watchlistSymbols, connectionState]);

  const allRows = useMemo(() => {
    const list = watchlistQuery.data ?? [];
    return list
      .map((item) => mapWatchlistRow(item, ticks[normalizeSymbol(item.symbol ?? "")]))
      .filter((item): item is WatchlistRow => item !== null);
  }, [watchlistQuery.data, ticks]);

  const orderedRows = useMemo(() => {
    if (!activeWatchlistId) return allRows;
    const storedOrder = savedRowOrders[activeWatchlistId] ?? [];
    if (!storedOrder.length) return allRows;

    const rowMap = new Map(allRows.map((row) => [normalizeSymbol(row.symbol), row]));
    const ordered = storedOrder
      .map((symbol) => rowMap.get(symbol))
      .filter((row): row is WatchlistRow => Boolean(row));
    const remaining = allRows.filter((row) => !storedOrder.includes(normalizeSymbol(row.symbol)));
    return [...ordered, ...remaining];
  }, [activeWatchlistId, allRows, savedRowOrders]);

  useEffect(() => {
    const nextPrices: Record<string, number> = {};
    const nextHighs: Record<string, number> = {};
    const nextLows: Record<string, number> = {};
    const cardPulseUpdates: Record<string, CardPulse> = {};
    const highPulseUpdates: Record<string, CardPulse> = {};
    const lowPulseUpdates: Record<string, CardPulse> = {};
    const prevPrices = previousPriceRef.current;
    const prevHighs = previousHighRef.current;
    const prevLows = previousLowRef.current;

    for (const row of allRows) {
      if (typeof row.currentPrice === "number" && Number.isFinite(row.currentPrice)) {
        nextPrices[row.symbol] = row.currentPrice;
        const previous = prevPrices[row.symbol];
        if (typeof previous === "number" && Number.isFinite(previous) && previous !== row.currentPrice) {
          const pulse: CardPulse = row.currentPrice > previous ? "up" : "down";
          cardPulseUpdates[row.symbol] = pulse;

          const currentKey = `${row.symbol}:current`;
          const activeTimeout = pulseTimeoutRef.current[currentKey];
          if (activeTimeout) {
            window.clearTimeout(activeTimeout);
          }

          pulseTimeoutRef.current[currentKey] = window.setTimeout(() => {
            setCardPulseMap((prev) => {
              const next = { ...prev };
              delete next[row.symbol];
              return next;
            });
            delete pulseTimeoutRef.current[currentKey];
          }, 1200);
        }
      }

      if (typeof row.high === "number" && Number.isFinite(row.high)) {
        nextHighs[row.symbol] = row.high;
        const previousHigh = prevHighs[row.symbol];
        if (typeof previousHigh === "number" && Number.isFinite(previousHigh) && previousHigh !== row.high) {
          const pulse: CardPulse = row.high > previousHigh ? "up" : "down";
          highPulseUpdates[row.symbol] = pulse;

          const highKey = `${row.symbol}:high`;
          const activeTimeout = pulseTimeoutRef.current[highKey];
          if (activeTimeout) {
            window.clearTimeout(activeTimeout);
          }

          pulseTimeoutRef.current[highKey] = window.setTimeout(() => {
            setHighPulseMap((prev) => {
              const next = { ...prev };
              delete next[row.symbol];
              return next;
            });
            delete pulseTimeoutRef.current[highKey];
          }, 1200);
        }
      }

      if (typeof row.low === "number" && Number.isFinite(row.low)) {
        nextLows[row.symbol] = row.low;
        const previousLow = prevLows[row.symbol];
        if (typeof previousLow === "number" && Number.isFinite(previousLow) && previousLow !== row.low) {
          const pulse: CardPulse = row.low > previousLow ? "up" : "down";
          lowPulseUpdates[row.symbol] = pulse;

          const lowKey = `${row.symbol}:low`;
          const activeTimeout = pulseTimeoutRef.current[lowKey];
          if (activeTimeout) {
            window.clearTimeout(activeTimeout);
          }

          pulseTimeoutRef.current[lowKey] = window.setTimeout(() => {
            setLowPulseMap((prev) => {
              const next = { ...prev };
              delete next[row.symbol];
              return next;
            });
            delete pulseTimeoutRef.current[lowKey];
          }, 1200);
        }
      }
    }

    if (Object.keys(cardPulseUpdates).length > 0) {
      setCardPulseMap((prev) => ({ ...prev, ...cardPulseUpdates }));
    }
    if (Object.keys(highPulseUpdates).length > 0) {
      setHighPulseMap((prev) => ({ ...prev, ...highPulseUpdates }));
    }
    if (Object.keys(lowPulseUpdates).length > 0) {
      setLowPulseMap((prev) => ({ ...prev, ...lowPulseUpdates }));
    }

    previousPriceRef.current = nextPrices;
    previousHighRef.current = nextHighs;
    previousLowRef.current = nextLows;
  }, [allRows]);

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(pulseTimeoutRef.current)) {
        window.clearTimeout(timeoutId);
      }
      pulseTimeoutRef.current = {};
    };
  }, []);

  const setWatchlistOrderInCache = (orderedSymbols: string[]) => {
    const currentItems = queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
    queryClient.setQueryData<MarketTicker[]>(
      USER_WATCHLIST_QUERY_KEY,
      reorderWatchlistItems(currentItems, orderedSymbols)
    );
  };

  const clearCardDragState = () => {
    setDraggedCardSymbol(null);
    setDragOverCardSymbol(null);
    cardPointerIdRef.current = null;
  };

  const saveRowOrderToLocal = (watchlistId: string, orderedSymbols: string[]) => {
    if (!watchlistId) return;
    setSavedRowOrders((prev) => {
      if (areSameSymbolOrder(prev[watchlistId] ?? [], orderedSymbols)) {
        return prev;
      }
      const next = {
        ...prev,
        [watchlistId]: orderedSymbols,
      };
      setStoredWatchlistRowOrders(next);
      return next;
    });
  };

  const persistWatchlistOrder = async (orderedSymbols: string[], previousSymbols: string[]) => {
    if (areSameSymbolOrder(orderedSymbols, previousSymbols)) {
      return;
    }
    if (!activeWatchlistId) {
      return;
    }

    const currentItems = queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
    const previousItems = reorderWatchlistItems(currentItems, previousSymbols);

    try {
      saveRowOrderToLocal(activeWatchlistId, orderedSymbols);
      await reorderMutation.mutateAsync({
        symbols: orderedSymbols,
        watchlistId: activeWatchlistId,
      });
      void queryClient.invalidateQueries({ queryKey: USER_WATCHLIST_QUERY_KEY });
    } catch (error: unknown) {
      saveRowOrderToLocal(activeWatchlistId, previousSymbols);
      queryClient.setQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY, previousItems);
      toast.error(getErrorMessage(error, "Unable to save watchlist order"));
    }
  };

  const handleCardDragStart = (event: React.PointerEvent<HTMLButtonElement>, symbol: string) => {
    if (reorderMutation.isPending || watchlistSymbols.length < 2) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentItems = queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
    cardDragStartOrderRef.current = currentItems.map((item) => normalizeSymbol(item.symbol ?? ""));
    cardPointerIdRef.current = event.pointerId;
    setDraggedCardSymbol(symbol);
    setDragOverCardSymbol(symbol);
  };

  useEffect(() => {
    if (!activeWatchlistId) return;
    const currentSymbols = allRows.map((row) => normalizeSymbol(row.symbol));
    if (!currentSymbols.length) return;
    const storedSymbols = savedRowOrders[activeWatchlistId] ?? [];
    const nextSymbols = [...storedSymbols.filter((symbol) => currentSymbols.includes(symbol))];
    for (const symbol of currentSymbols) {
      if (!nextSymbols.includes(symbol)) nextSymbols.push(symbol);
    }
    if (areSameSymbolOrder(storedSymbols, nextSymbols)) return;
    saveRowOrderToLocal(activeWatchlistId, nextSymbols);
  }, [activeWatchlistId, allRows, savedRowOrders]);

  useEffect(() => {
    if (!draggedCardSymbol) {
      return;
    }

    const finishCardDrag = (shouldPersist: boolean) => {
      const currentItems = queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
      const nextSymbols = currentItems.map((item) => normalizeSymbol(item.symbol ?? ""));
      const previousSymbols = cardDragStartOrderRef.current;

      clearCardDragState();

      if (previousSymbols.length === 0) {
        return;
      }

      if (!shouldPersist || areSameSymbolOrder(nextSymbols, previousSymbols)) {
        setWatchlistOrderInCache(previousSymbols);
        return;
      }

      void persistWatchlistOrder(nextSymbols, previousSymbols);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (cardPointerIdRef.current !== null && event.pointerId !== cardPointerIdRef.current) {
        return;
      }

      const targetElement = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-watchlist-card-symbol]");
      const targetSymbol = targetElement?.dataset.watchlistCardSymbol;

      if (!targetSymbol || targetSymbol === draggedCardSymbol || targetSymbol === dragOverCardSymbol) {
        return;
      }

      const currentItems = queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
      const currentSymbols = currentItems.map((item) => normalizeSymbol(item.symbol ?? ""));
      const nextSymbols = reorderSymbolOrder(currentSymbols, draggedCardSymbol, targetSymbol);

      setDragOverCardSymbol(targetSymbol);
      setWatchlistOrderInCache(nextSymbols);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (cardPointerIdRef.current !== null && event.pointerId !== cardPointerIdRef.current) {
        return;
      }
      finishCardDrag(true);
    };

    const handlePointerCancel = () => {
      finishCardDrag(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [draggedCardSymbol, dragOverCardSymbol, queryClient, reorderMutation, watchlistQuery.data]);

  useEffect(() => {
    if (!draggedRowSymbol) {
      return;
    }

    const finishRowDrag = (shouldPersist: boolean) => {
      const currentItems =
        queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
      const nextSymbols = currentItems.map((item) => normalizeSymbol(item.symbol ?? ""));
      const previousSymbols = rowDragStartOrderRef.current;

      clearRowDragState();

      if (previousSymbols.length === 0) {
        return;
      }

      if (!shouldPersist || areSameSymbolOrder(nextSymbols, previousSymbols)) {
        setWatchlistOrderInCache(previousSymbols);
        return;
      }

      void persistWatchlistOrder(nextSymbols, previousSymbols);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (rowPointerIdRef.current !== null && event.pointerId !== rowPointerIdRef.current) {
        return;
      }

      const targetElement = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-watchlist-table-row-symbol]");
      const targetSymbol = targetElement?.dataset.watchlistTableRowSymbol;

      if (!targetSymbol || targetSymbol === draggedRowSymbol || targetSymbol === dragOverRowSymbol) {
        return;
      }

      const currentItems =
        queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
      const currentSymbols = currentItems.map((item) => normalizeSymbol(item.symbol ?? ""));
      const nextSymbols = reorderSymbolOrder(currentSymbols, draggedRowSymbol, targetSymbol);

      setDragOverRowSymbol(targetSymbol);
      setWatchlistOrderInCache(nextSymbols);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (rowPointerIdRef.current !== null && event.pointerId !== rowPointerIdRef.current) {
        return;
      }
      finishRowDrag(true);
    };

    const handlePointerCancel = () => {
      finishRowDrag(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [draggedRowSymbol, dragOverRowSymbol, queryClient, reorderMutation, watchlistQuery.data]);

  const hiddenColumnSet = useMemo(() => new Set(hiddenColumns), [hiddenColumns]);
  const visibleColumns = useMemo(
    () => columnOrder.filter((col) => !hiddenColumnSet.has(col)),
    [columnOrder, hiddenColumnSet]
  );
  const getColumnDividerClass = (col: TableColumnId) =>
    visibleColumns[visibleColumns.length - 1] === col
      ? ""
      : "border-r border-slate-200/60 dark:border-slate-700/65";

  const toggleColumn = (colId: TableColumnId) => {
    setHiddenColumns((prev) => {
      const isHidden = prev.includes(colId);
      if (!isHidden) {
        const nextHidden = [...prev, colId];
        const nextVisibleCount = columnOrder.filter((col) => !nextHidden.includes(col)).length;
        if (nextVisibleCount === 0) {
          toast.error("At least one column must remain visible.");
          return prev;
        }
        return nextHidden;
      }
      return prev.filter((col) => col !== colId);
    });
  };

  const moveColumnToTarget = (draggedColId: TableColumnId, targetColId: TableColumnId) => {
    setColumnOrder((prev) => {
      const draggedIndex = prev.indexOf(draggedColId);
      const targetIndex = prev.indexOf(targetColId);
      if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return prev;
      const next = [...prev];
      const [movedColumn] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, movedColumn);
      return next;
    });
  };

  const clearColumnDragState = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnDragStart = (colId: TableColumnId) => {
    setDraggedColumn(colId);
    setDragOverColumn(colId);
  };

  const handleColumnDragOver = (event: React.DragEvent<HTMLElement>, targetColId: TableColumnId) => {
    event.preventDefault();
    if (!draggedColumn || draggedColumn === targetColId || dragOverColumn === targetColId) return;
    setDragOverColumn(targetColId);
    moveColumnToTarget(draggedColumn, targetColId);
  };

  const handleColumnDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    clearColumnDragState();
  };

  const clearRowDragState = () => {
    setDraggedRowSymbol(null);
    setDragOverRowSymbol(null);
    rowPointerIdRef.current = null;
  };

  const handleRowPointerStart = (event: React.PointerEvent<HTMLButtonElement>, symbol: string) => {
    if (reorderMutation.isPending || watchlistSymbols.length < 2) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const currentItems =
      queryClient.getQueryData<MarketTicker[]>(USER_WATCHLIST_QUERY_KEY) ?? watchlistQuery.data ?? [];
    rowDragStartOrderRef.current = currentItems.map((item) => normalizeSymbol(item.symbol ?? ""));
    rowPointerIdRef.current = event.pointerId;
    setDraggedRowSymbol(symbol);
    setDragOverRowSymbol(symbol);
  };

  const resetColumns = () => {
    setColumnOrder([...DEFAULT_TABLE_COLUMNS]);
    setHiddenColumns([]);
    clearColumnDragState();
  };

  const segmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of allRows) {
      if (row.segment !== "--") set.add(row.segment);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allRows]);

  const exchangeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of allRows) {
      if (row.exchange !== "--") set.add(row.exchange);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allRows]);

  const tableHeaderMap: Record<TableColumnId, string> = {
    symbol: "Symbol",
    name: "Name",
    segment: "Segment",
    exchange: "Exchange",
    open: "Open",
    current: "Current",
    high: "High",
    low: "Low",
    close: "Close",
    changePercent: "Change %",
    points: "Points",
    bid: "Bid",
    ask: "Ask",
    action: "Action",
  };

  const tableColumnLabels: Record<TableColumnId, string> = {
    symbol: "Symbol",
    name: "Name",
    segment: "Segment",
    exchange: "Exchange",
    open: "Open",
    current: "Current",
    high: "High",
    low: "Low",
    close: "Close",
    changePercent: "Change %",
    points: "Points",
    bid: "Bid",
    ask: "Ask",
    action: "Action",
  };


  const filteredRows = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    return orderedRows.filter((row) => {
      if (segmentFilter !== "ALL" && row.segment !== segmentFilter) return false;
      if (exchangeFilter !== "ALL" && row.exchange !== exchangeFilter) return false;
      if (!query) return true;

      return (
        row.symbol.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.segment.toLowerCase().includes(query) ||
        row.exchange.toLowerCase().includes(query)
      );
    });
  }, [orderedRows, tableSearch, segmentFilter, exchangeFilter]);

  const selectedRow = useMemo(() => {
    if (!selectedSymbol) return null;
    const match = orderedRows.find((row) => row.symbol === selectedSymbol) ?? null;
    if (match) return match;
    const cached = selectedRowRef.current;
    if (cached && cached.symbol === selectedSymbol) return cached;
    return null;
  }, [orderedRows, selectedSymbol]);
  useEffect(() => {
    if (selectedRow) {
      selectedRowRef.current = selectedRow;
    }
  }, [selectedRow]);
  const selectedTick = selectedSymbol ? ticks[selectedSymbol] : undefined;
  const intervalSeconds = useMemo(() => intervalToSeconds(chartInterval), [chartInterval]);
  const isIndianChartMarket = useMemo(
    () => isIndianMarketSymbol(selectedRow, selectedSymbol ?? urlSymbol),
    [selectedRow, selectedSymbol, urlSymbol]
  );
  const activeChartSymbol = chartMode ? selectedSymbol || urlSymbol : null;
  const shouldFetchCurrentSignal =
    Boolean(activeChartSymbol) &&
    (chartVisibility.showSignalSummary ||
      chartVisibility.showEntryLine ||
      chartVisibility.showStopLossLine ||
      chartVisibility.showTargetLines);
  const currentSignalQuery = useSignalsQuery(
    shouldFetchCurrentSignal && activeChartSymbol
      ? {
          symbol: activeChartSymbol,
          status: "Active",
          page: 1,
          limit: 1,
        }
      : undefined,
    shouldFetchCurrentSignal
  );
  const currentSignal = useMemo<SignalItem | null>(
    () => (shouldFetchCurrentSignal ? currentSignalQuery.data?.results?.[0] ?? null : null),
    [currentSignalQuery.data?.results, shouldFetchCurrentSignal]
  );
  const currentSignalLabel = useMemo(() => getCurrentSignalLabel(currentSignal), [currentSignal]);
  const currentSignalEntry = useMemo(() => getCurrentSignalEntry(currentSignal), [currentSignal]);
  const currentSignalStopLoss = useMemo(() => getCurrentSignalStopLoss(currentSignal), [currentSignal]);
  const currentSignalTargets = useMemo(() => getCurrentSignalTargets(currentSignal).slice(0, 3), [currentSignal]);
  const latestChartPrice = useMemo(() => {
    if (selectedTick) {
      const livePrice = getTickPrice(selectedTick);
      if (typeof livePrice === "number" && Number.isFinite(livePrice)) {
        return livePrice;
      }
    }

    return selectedRow?.currentPrice ?? selectedRow?.close;
  }, [selectedRow?.close, selectedRow?.currentPrice, selectedTick]);
  const currentSignalAchievedTargetLevels = useMemo(
    () =>
      Array.from(
        new Set([
          ...getCurrentSignalAchievedTargetLevels(currentSignal),
          ...getLiveAchievedTargetLevels(currentSignal, latestChartPrice),
        ])
      ).sort((a, b) => a - b),
    [currentSignal, latestChartPrice]
  );
  const currentSignalAchievedSummary = useMemo(
    () =>
      currentSignalAchievedTargetLevels.length > 0
        ? `${currentSignalAchievedTargetLevels.map((level) => `TP${level}`).join(" • ")} Achieved`
        : getCurrentSignalAchievedSummary(currentSignal),
    [currentSignal, currentSignalAchievedTargetLevels]
  );
  const shouldRenderSignalSummary = chartVisibility.showSignalSummary && Boolean(currentSignalLabel);
  const shouldRenderChartLegend = Boolean(chartLegend) && (chartVisibility.showOhlc || shouldRenderSignalSummary);
  const toggleChartVisibility = useCallback((key: keyof ChartVisibilitySettings) => {
    setChartVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const resetChartVisibility = useCallback(() => {
    setChartVisibility({ ...DEFAULT_CHART_VISIBILITY_SETTINGS });
  }, []);
  const whatsappUrl = useMemo(() => {
    if (!selectedRow) return "";
    const message = [
      "Hello MSPK Support,",
      "",
      "I would like to request TradingView chart access for the following instrument:",
      `- Symbol: ${selectedRow.symbol}`,
      `- Name: ${selectedRow.name}`,
      `- Segment: ${selectedRow.segment}`,
      `- Exchange: ${selectedRow.exchange}`,
      "",
      "Please guide me on the next steps. Thank you.",
    ].join("\n");
    return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }, [selectedRow]);

  const openChartWindow = (symbol: string) => {
    if (!symbol) return;
    const params = new URLSearchParams({
      chart: "1",
      symbol,
      interval: chartInterval,
    });
    const url = `/dashboard/watchlist?${params.toString()}`;
    window.location.href = url;
  };

  useEffect(() => {
    if (selectedRow && !chartMode) {
      setChartInterval("15");
    }
  }, [selectedRow?.symbol, chartMode]);

  const chartParams = useMemo(() => {
    if (!selectedSymbol) return null;
    const now = Math.floor(Date.now() / 1000);
    const spanSeconds = intervalSeconds * HISTORY_CANDLE_COUNT;
    return {
      symbol: selectedSymbol,
      resolution: chartInterval,
      from: now - spanSeconds,
      to: now,
      count: HISTORY_CANDLE_COUNT,
    };
  }, [selectedSymbol, chartInterval, intervalSeconds]);

  const historyQuery = useMarketHistoryQuery(
    chartParams ?? { symbol: "", resolution: "15", from: 0, to: 0, count: HISTORY_CANDLE_COUNT },
    Boolean(chartParams)
  );

  const historyCandles = useMemo<HistoryCandle[]>(() => {
    const raw = historyQuery.data as unknown;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { candles?: unknown[] })?.candles)
        ? (raw as { candles: unknown[] }).candles
        : [];

    const candles: HistoryCandle[] = [];

    for (const item of list) {
      const row = item as Record<string, unknown>;
      const timeRaw = row.time ?? row.timestamp ?? row.t;
      let time =
        typeof timeRaw === "number"
          ? timeRaw
          : typeof timeRaw === "string"
            ? Math.floor(new Date(timeRaw).getTime() / 1000)
            : undefined;
      if (typeof time === "number" && time > 10_000_000_000) {
        time = Math.floor(time / 1000);
      }
      if (typeof time === "number" && Number.isFinite(time)) {
        time = Number(
          normalizeCandleTime(time, chartInterval, intervalSeconds, isIndianChartMarket)
        );
      }
      const open = toNumber(row.open);
      let high = toNumber(row.high);
      let low = toNumber(row.low);
      const close = toNumber(row.close);
      if (
        !time ||
        open === undefined ||
        high === undefined ||
        low === undefined ||
        close === undefined ||
        open <= 0 ||
        high <= 0 ||
        low <= 0 ||
        close <= 0
      ) {
        continue;
      }
      if (high < low) {
        [high, low] = [low, high];
      }
      const previous = candles[candles.length - 1];
      if (previous && Number(previous.time) === time) {
        previous.high = Math.max(previous.high, high);
        previous.low = Math.min(previous.low, low);
        previous.close = close;
        const volume = toNumber(row.volume);
        if (typeof volume === "number") {
          previous.volume = (previous.volume ?? 0) + volume;
        }
        continue;
      }
      const candle: HistoryCandle = { time: toUTCTimestamp(time), open, high, low, close };
      const volume = toNumber(row.volume);
      if (typeof volume === "number") {
        candle.volume = volume;
      }
      candles.push(candle);
    }

    return candles
      .sort((left, right) => Number(left.time) - Number(right.time))
      .slice(-HISTORY_CANDLE_COUNT);
  }, [historyQuery.data, chartInterval, intervalSeconds, isIndianChartMarket]);

  const historyKey = selectedSymbol ? `${selectedSymbol}:${chartInterval}` : "";

  useEffect(() => {
    if (!historyKey) return;
    if (historyCandles.length >= MIN_HISTORY_CANDLES) {
      historyCacheRef.current[historyKey] = historyCandles.slice(-HISTORY_CANDLE_COUNT);
    }
  }, [historyKey, historyCandles]);

  const seedCandles = useMemo(() => {
    if (!selectedSymbol) return [];
    if (historyCandles.length >= MIN_HISTORY_CANDLES) {
      return historyCandles;
    }
    if (historyKey) {
      const cached = historyCacheRef.current[historyKey];
      if (cached && cached.length >= MIN_HISTORY_CANDLES) {
        return cached;
      }
    }
    const points = tickHistoryRef.current[selectedSymbol] ?? [];
    const tickCandles = buildCandlesFromTicks(
      points,
      chartInterval,
      intervalSeconds,
      isIndianChartMarket
    );
    if (tickCandles.length >= MIN_HISTORY_CANDLES) {
      return tickCandles;
    }
    return [];
  }, [selectedSymbol, historyCandles, chartInterval, intervalSeconds, historyKey, isIndianChartMarket]);

  useEffect(() => {
    if (!selectedSymbol || !chartContainerRef.current || !chartContainerReady) return;
    chartManualZoomRef.current = false;
    chartBarSpacingRef.current = CHART_BAR_SPACING_DEFAULT;
    chartRef.current?.remove();
    const container = chartContainerRef.current;
    const isDark = document.documentElement.classList.contains("dark");
    const initialHeight = Math.max(220, Math.floor(container.clientHeight || 260));
    const touchCrosshairMode = isTouchInteractionDevice() && crosshairEnabledRef.current;
    const chartTimeZone = isIndianChartMarket ? INDIA_TIME_ZONE : undefined;
    const chart = createChart(container, {
      height: initialHeight,
      layout: {
        background: { color: "transparent" },
        textColor: isDark ? "#e2e8f0" : "#0f172a",
      },
      localization: chartTimeZone
        ? {
            locale: "en-IN",
            timeFormatter: (time: unknown) =>
              formatChartTimeLabel(time, chartInterval, chartTimeZone, true),
          }
        : undefined,
      handleScroll: {
        pressedMouseMove: true,
        horzTouchDrag: !touchCrosshairMode,
        vertTouchDrag: !touchCrosshairMode,
        mouseWheel: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      trackingMode: {
        exitMode: TrackingModeExitMode.OnNextTap,
      },
      crosshair: {
        mode: crosshairEnabledRef.current ? 0 : 2,
        vertLine: {
          visible: true,
          labelVisible: true,
          color: isDark ? "rgba(148, 163, 184, 0.85)" : "rgba(15, 23, 42, 0.45)",
        },
        horzLine: {
          visible: true,
          labelVisible: true,
          color: isDark ? "rgba(148, 163, 184, 0.85)" : "rgba(15, 23, 42, 0.45)",
        },
      },
      grid: {
        vertLines: { color: isDark ? "rgba(51, 65, 85, 0.45)" : "rgba(148, 163, 184, 0.25)" },
        horzLines: { color: isDark ? "rgba(51, 65, 85, 0.45)" : "rgba(148, 163, 184, 0.25)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: chartInterval !== "D" && chartInterval !== "W" && chartInterval !== "M",
        barSpacing: chartBarSpacingRef.current,
        tickMarkFormatter: chartTimeZone
          ? (time: unknown) => formatChartTimeLabel(time, chartInterval, chartTimeZone, false)
          : undefined,
      },
    });
    const series = chart.addCandlestickSeries({
      upColor: "#22C55E",
      downColor: "#EF4444",
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
      borderVisible: false,
    });
    chartRef.current = chart;
    candleSeriesRef.current = series;

    const handleCrosshairMove = (param: MouseEventParams) => {
      if (!crosshairEnabledRef.current) {
        chartHoverRef.current = false;
        updateLegendFromLatest();
        return;
      }
      const seriesData = param?.seriesData;
    const time = typeof param?.time === "number" ? toUTCTimestamp(param.time) : null;
      if (!seriesData || time === null || !candleSeriesRef.current) {
        chartHoverRef.current = false;
        updateLegendFromLatest();
        return;
      }

      const data = seriesData.get(candleSeriesRef.current) as
        | { open: number; high: number; low: number; close: number; time?: number }
        | undefined;
      if (!data) {
        chartHoverRef.current = false;
        updateLegendFromLatest();
        return;
      }

      chartHoverRef.current = true;
      const matched = chartCandlesRef.current.find((candle) => candle.time === time);
      setChartLegendSafe({
        time,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: matched?.volume,
      });
    };

    const handleChartClick = (param: MouseEventParams) => {
      if (!candleSeriesRef.current) return;
      const candles = chartCandlesRef.current;
      if (candles.length === 0) return;
      const last = candles[candles.length - 1];
      if (!last || !Number.isFinite(last.close)) return;
      const priceY = candleSeriesRef.current.priceToCoordinate(last.close);
      if (priceY === null) return;
      const clickY =
        param?.point?.y ??
        (param.sourceEvent ? param.sourceEvent.clientY - container.getBoundingClientRect().top : null);
      if (clickY === null) return;
      if (clickY < 0 || clickY > container.clientHeight) return;
      if (Math.abs(clickY - priceY) <= PRICE_LINE_CLICK_TOLERANCE_PX) {
        setIsAdjustOpen((prev) => !prev);
      }
    };
    const updateCrosshairFromTouchPoint = (clientX: number, clientY: number) => {
      if (!crosshairEnabledRef.current || !chartRef.current || !candleSeriesRef.current) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
      const time = chart.timeScale().coordinateToTime(x);
      const price = candleSeriesRef.current.coordinateToPrice(y);
      if (time === null || price === null) return;
      chartRef.current.setCrosshairPosition(price, time as UTCTimestamp, candleSeriesRef.current);
    };
    const handleTouchPointerDown = (event: PointerEvent) => {
      if (!isTouchInteractionDevice() || event.pointerType !== "touch" || !crosshairEnabledRef.current) {
        return;
      }
      touchCrosshairPointerIdRef.current = event.pointerId;
      if (typeof container.setPointerCapture === "function") {
        container.setPointerCapture(event.pointerId);
      }
      updateCrosshairFromTouchPoint(event.clientX, event.clientY);
      event.preventDefault();
    };
    const handleTouchPointerMove = (event: PointerEvent) => {
      if (
        !isTouchInteractionDevice() ||
        event.pointerType !== "touch" ||
        touchCrosshairPointerIdRef.current !== event.pointerId ||
        !crosshairEnabledRef.current
      ) {
        return;
      }
      updateCrosshairFromTouchPoint(event.clientX, event.clientY);
      event.preventDefault();
    };
    const handleTouchPointerEnd = (event: PointerEvent) => {
      if (touchCrosshairPointerIdRef.current !== event.pointerId) return;
      touchCrosshairPointerIdRef.current = null;
      if (
        typeof container.hasPointerCapture === "function" &&
        typeof container.releasePointerCapture === "function" &&
        container.hasPointerCapture(event.pointerId)
      ) {
        container.releasePointerCapture(event.pointerId);
      }
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    chart.subscribeClick(handleChartClick);
    const handleRangeChange = () => {
      if (chartFitProgrammaticRef.current) return;
      chartManualZoomRef.current = true;
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);
    container.addEventListener("pointerdown", handleTouchPointerDown, { capture: true, passive: false });
    container.addEventListener("pointermove", handleTouchPointerMove, { capture: true, passive: false });
    container.addEventListener("pointerup", handleTouchPointerEnd, true);
    container.addEventListener("pointercancel", handleTouchPointerEnd, true);

    const resizeToContainer = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      chart.applyOptions({
        width: rect.width,
        height: Math.max(220, Math.floor(rect.height)),
      });
      if (!chartManualZoomRef.current) {
        fitChartToContent();
      }
    };

    resizeToContainer();
    requestAnimationFrame(resizeToContainer);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      resizeToContainer();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.unsubscribeClick(handleChartClick);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      container.removeEventListener("pointerdown", handleTouchPointerDown, true);
      container.removeEventListener("pointermove", handleTouchPointerMove, true);
      container.removeEventListener("pointerup", handleTouchPointerEnd, true);
      container.removeEventListener("pointercancel", handleTouchPointerEnd, true);
      signalPriceLinesRef.current = [];
      candleSeriesRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
  }, [selectedSymbol, chartInterval, chartContainerReady, isIndianChartMarket]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    const nextKey = historyKey;
    const sameKey = nextKey && nextKey === chartKeyRef.current;
    if (seedCandles.length === 0) {
      if (!sameKey) {
        candleSeriesRef.current.setData([]);
        chartRawCandlesRef.current = [];
        chartCandlesRef.current = [];
        setHasChartData(false);
        chartKeyRef.current = nextKey;
      }
      return;
    }
    const displayCandles = chartType === "heikin" ? calculateHeikinAshi(seedCandles) : seedCandles;
    candleSeriesRef.current.setData(displayCandles);
    chartRawCandlesRef.current = [...seedCandles];
    chartCandlesRef.current = [...displayCandles];
    chartKeyRef.current = nextKey;
    lastChartUpdateRef.current = 0;
    setHasChartData(seedCandles.length > 0);
    if (!chartManualZoomRef.current) {
      fitChartToContent();
    }
    if (!chartHoverRef.current) {
      updateLegendFromLatest();
    }
  }, [seedCandles, historyKey]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    const rawCandles = chartRawCandlesRef.current;
    if (rawCandles.length === 0) return;
    const displayCandles = chartType === "heikin" ? calculateHeikinAshi(rawCandles) : rawCandles;
    candleSeriesRef.current.setData(displayCandles);
    chartCandlesRef.current = [...displayCandles];
    if (!chartHoverRef.current) {
      updateLegendFromLatest();
    }
  }, [chartType]);

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;

    for (const line of signalPriceLinesRef.current) {
      try {
        series.removePriceLine(line);
      } catch {
        // Ignore stale handles after chart recreation.
      }
    }
    signalPriceLinesRef.current = [];

    const addSignalPriceLine = (
      price: number | undefined,
      title: string,
      color: string,
      lineStyle: LineStyle,
      lineWidth: LineWidth = 1,
      axisLabelColor?: string,
      axisLabelTextColor?: string
    ) => {
      if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return;
      try {
        const line = series.createPriceLine({
          price,
          title,
          color,
          lineStyle,
          lineWidth,
          axisLabelVisible: true,
          lineVisible: true,
          axisLabelColor,
          axisLabelTextColor,
        });
        signalPriceLinesRef.current.push(line);
      } catch {
        // Ignore fast chart-switch races.
      }
    };

    if (chartVisibility.showEntryLine) {
      addSignalPriceLine(currentSignalEntry, "Entry", "#0ea5e9", LineStyle.Solid, 2);
    }
    if (chartVisibility.showStopLossLine) {
      addSignalPriceLine(currentSignalStopLoss, "SL", "#f43f5e", LineStyle.Dashed, 2);
    }
    if (chartVisibility.showTargetLines) {
      currentSignalTargets.forEach((target, index) => {
        const level = index + 1;
        const isAchieved = currentSignalAchievedTargetLevels.includes(level);
        addSignalPriceLine(
          target,
          isAchieved ? `TP${level} HIT` : `TP${level}`,
          isAchieved ? "#f59e0b" : "#22c55e",
          isAchieved ? LineStyle.Solid : LineStyle.LargeDashed,
          isAchieved ? 3 : 1,
          isAchieved ? "#f59e0b" : "#22c55e",
          isAchieved ? "#0f172a" : "#ecfdf5"
        );
      });
    }

    return () => {
      for (const line of signalPriceLinesRef.current) {
        try {
          series.removePriceLine(line);
        } catch {
          // Ignore cleanup races during teardown.
        }
      }
      signalPriceLinesRef.current = [];
    };
  }, [
    chartInterval,
    chartType,
    chartVisibility.showEntryLine,
    chartVisibility.showStopLossLine,
    chartVisibility.showTargetLines,
    currentSignalEntry,
    currentSignalAchievedTargetLevels,
    currentSignalStopLoss,
    currentSignalTargets,
    selectedSymbol,
  ]);

  useEffect(() => {
    if (!candleSeriesRef.current || !selectedSymbol) return;
    const tick = selectedTick;
    if (!tick) return;
    const price = getTickPrice(tick);
    if (price === undefined) return;
    const time = getTickTimestamp(tick);
    const rawCandles = chartRawCandlesRef.current;
    if (rawCandles.length === 0) return;
    const bucketOffsetSec = getChartBucketOffset(chartInterval, intervalSeconds, isIndianChartMarket);
    const bucketTime = getBucketStart(
      time,
      chartInterval,
      intervalSeconds,
      bucketOffsetSec,
      isIndianChartMarket ? INDIA_TIME_ZONE_OFFSET_SEC : 0
    );
    if (!Number.isFinite(bucketTime) || bucketTime <= 0) return;
    const lastRaw = rawCandles[rawCandles.length - 1];
    const lastTime = lastRaw ? Number(lastRaw.time) : 0;
    const nowMs = Date.now();
    const isNewBucket = !lastRaw || bucketTime > lastTime;

    if (!isNewBucket) {
      if (bucketTime < lastTime) return;
      if (nowMs - lastChartUpdateRef.current < CHART_UPDATE_THROTTLE_MS) return;
    }

    let updatedRaw: HistoryCandle;
    let shouldReset = false;
    if (!lastRaw || bucketTime > lastTime) {
      const seededOpen: number = lastRaw?.close ?? price;
      updatedRaw = {
        time: bucketTime,
        open: seededOpen,
        high: Math.max(seededOpen, price),
        low: Math.min(seededOpen, price),
        close: price,
      };
      rawCandles.push(updatedRaw);
      if (rawCandles.length > HISTORY_CANDLE_COUNT) {
        rawCandles.splice(0, rawCandles.length - HISTORY_CANDLE_COUNT);
        shouldReset = true;
      }
    } else {
      updatedRaw = {
        ...lastRaw,
        close: price,
        high: Math.max(lastRaw.high, price),
        low: Math.min(lastRaw.low, price),
      };
      rawCandles[rawCandles.length - 1] = updatedRaw;
    }

    chartRawCandlesRef.current = rawCandles;

    if (chartType === "heikin") {
      let displayCandles = chartCandlesRef.current;
      if (shouldReset || displayCandles.length === 0 || displayCandles.length !== rawCandles.length) {
        displayCandles = calculateHeikinAshi(rawCandles);
        candleSeriesRef.current.setData(displayCandles);
      } else {
        let displayUpdated: HistoryCandle;
        if (isNewBucket) {
          const prevHa = displayCandles[displayCandles.length - 1];
          if (!prevHa) {
            displayUpdated = { ...updatedRaw };
          } else {
            const haOpen = (prevHa.open + prevHa.close) / 2;
            const haClose = (updatedRaw.open + updatedRaw.high + updatedRaw.low + updatedRaw.close) / 4;
            const haHigh = Math.max(updatedRaw.high, haOpen, haClose);
            const haLow = Math.min(updatedRaw.low, haOpen, haClose);
            displayUpdated = {
              time: updatedRaw.time,
              open: haOpen,
              high: haHigh,
              low: haLow,
              close: haClose,
              volume: updatedRaw.volume,
            };
          }
          displayCandles = [...displayCandles, displayUpdated];
        } else {
          const currentHa = displayCandles[displayCandles.length - 1];
          const haOpen = currentHa ? currentHa.open : updatedRaw.open;
          const haClose = (updatedRaw.open + updatedRaw.high + updatedRaw.low + updatedRaw.close) / 4;
          const haHigh = Math.max(updatedRaw.high, haOpen, haClose);
          const haLow = Math.min(updatedRaw.low, haOpen, haClose);
          displayUpdated = {
            time: updatedRaw.time,
            open: haOpen,
            high: haHigh,
            low: haLow,
            close: haClose,
            volume: updatedRaw.volume,
          };
          displayCandles = [...displayCandles];
          displayCandles[displayCandles.length - 1] = displayUpdated;
        }
        candleSeriesRef.current.update(displayUpdated);
      }
      chartCandlesRef.current = displayCandles;
    } else {
      chartCandlesRef.current = rawCandles;
      if (shouldReset) {
        candleSeriesRef.current.setData(rawCandles);
      } else {
        candleSeriesRef.current.update(updatedRaw);
      }
    }
    if (isNewBucket && !chartManualZoomRef.current) {
      fitChartToContent();
    }
    if (!hasChartData) {
      setHasChartData(true);
    }
    if (!chartHoverRef.current) {
      updateLegendFromLatest();
    }
    lastChartUpdateRef.current = nowMs;
  }, [selectedTick, selectedSymbol, chartInterval, intervalSeconds, hasChartData, chartType, isIndianChartMarket]);

  const refreshWatchlistQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: USER_MARKET_WATCHLISTS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: USER_WATCHLIST_QUERY_KEY }),
    ]);
  };

  const handleCreateWatchlist = async () => {
    const name = newWatchlistName.trim();
    if (!name) {
      toast.error("Watchlist name is required");
      return;
    }
    try {
      await createWatchlistMutation.mutateAsync({
        name,
        setActive: true,
      });
      await refreshWatchlistQueries();
      setNewWatchlistName("");
      setIsCreateWatchlistOpen(false);
      toast.success(`${name} created`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create watchlist"));
    }
  };

  const handleActivateWatchlist = async (watchlistId: string, watchlistName: string) => {
    if (!watchlistId || watchlistId === activeWatchlistId) return;
    try {
      await updateWatchlistMutation.mutateAsync({
        id: watchlistId,
        setActive: true,
      });
      await refreshWatchlistQueries();
      setSelectedSymbol(null);
      toast.success(`${watchlistName} selected`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to switch watchlist"));
    }
  };

  const handleDeleteActiveWatchlist = async () => {
    if (!activeWatchlist?.id) return;
    if (userWatchlists.length <= 1) {
      toast.error("At least one watchlist is required");
      return;
    }
    const proceed =
      typeof window === "undefined"
        ? true
        : window.confirm(
            `Delete watchlist "${activeWatchlist.name}"? This will remove only this list, not your account.`
          );
    if (!proceed) return;

    try {
      await deleteWatchlistMutation.mutateAsync(activeWatchlist.id);
      await refreshWatchlistQueries();
      setSelectedSymbol(null);
      toast.success("Watchlist deleted");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete watchlist"));
    }
  };

  const handleAddSymbol = async (candidate?: string) => {
    const target = normalizeSymbol(candidate ?? symbolInput);
    if (!target) {
      toast.error("Symbol required");
      return;
    }
    if (!activeWatchlistId) {
      toast.error("Select or create a watchlist first");
      return;
    }
    if (watchlistSymbols.includes(target)) {
      toast.info(`${target} already in watchlist`);
      return;
    }

    try {
      await addMutation.mutateAsync({ symbol: target, watchlistId: activeWatchlistId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: USER_WATCHLIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USER_MARKET_WATCHLISTS_QUERY_KEY }),
      ]);
      setSymbolInput("");
      setSearchQuery("");
      toast.success(`${target} added`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to add symbol"));
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    if (!activeWatchlistId) {
      toast.error("Select or create a watchlist first");
      return;
    }
    setRemovingSymbol(symbol);
    try {
      await removeMutation.mutateAsync({ symbol, watchlistId: activeWatchlistId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: USER_WATCHLIST_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: USER_MARKET_WATCHLISTS_QUERY_KEY }),
      ]);
      toast.success(`${symbol} removed`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to remove symbol"));
    } finally {
      setRemovingSymbol(null);
    }
  };

  const showLoading = watchlistQuery.isLoading && allRows.length === 0;
  const activeFilterCount =
    (tableSearch.trim() ? 1 : 0) + (segmentFilter !== "ALL" ? 1 : 0) + (exchangeFilter !== "ALL" ? 1 : 0);
  const detailDigits = selectedRow ? getPriceDigits(selectedRow, getReferencePrice(selectedRow)) : 2;
  const detailTrendClass =
    typeof selectedRow?.changePercent !== "number"
      ? "text-slate-500 dark:text-slate-400"
      : selectedRow.changePercent >= 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";
  const chartLegendDigits = useMemo(() => {
    const reference = chartLegend?.close ?? chartLegend?.open ?? chartLegend?.high ?? chartLegend?.low;
    if (selectedRow) return getPriceDigits(selectedRow, reference);
    if (typeof reference === "number" && Number.isFinite(reference)) {
      const abs = Math.abs(reference);
      if (abs > 0 && abs < 1) return 5;
      if (abs >= 1 && abs < 100) return 3;
    }
    return 2;
  }, [chartLegend, selectedRow]);
  const setChartLegendSafe = (next: HistoryCandle | null) => {
    const prev = chartLegendRef.current;
    if (
      prev &&
      next &&
      prev.time === next.time &&
      prev.open === next.open &&
      prev.high === next.high &&
      prev.low === next.low &&
      prev.close === next.close &&
      prev.volume === next.volume
    ) {
      return;
    }
    chartLegendRef.current = next;
    setChartLegend(next);
  };
  const updateLegendFromLatest = () => {
    const candles = chartCandlesRef.current;
    if (!candles.length) {
      setChartLegendSafe(null);
      return;
    }
    setChartLegendSafe(candles[candles.length - 1]);
  };
  const fitChartToContent = () => {
    if (!chartRef.current) return;
    chartFitProgrammaticRef.current = true;
    chartRef.current.timeScale().fitContent();
    requestAnimationFrame(() => {
      chartFitProgrammaticRef.current = false;
    });
  };
  const applyChartBarSpacing = (nextSpacing: number) => {
    chartBarSpacingRef.current = nextSpacing;
    chartRef.current?.applyOptions({ timeScale: { barSpacing: nextSpacing } });
  };
  const handleChartZoom = (direction: "in" | "out") => {
    const current = chartBarSpacingRef.current;
    const delta = direction === "in" ? CHART_BAR_SPACING_STEP : -CHART_BAR_SPACING_STEP;
    const nextSpacing = Math.min(
      CHART_BAR_SPACING_MAX,
      Math.max(CHART_BAR_SPACING_MIN, current + delta)
    );
    if (nextSpacing === current) return;
    chartManualZoomRef.current = true;
    applyChartBarSpacing(nextSpacing);
  };
  const handleChartReset = () => {
    chartManualZoomRef.current = false;
    applyChartBarSpacing(CHART_BAR_SPACING_DEFAULT);
    fitChartToContent();
    chartRef.current?.priceScale("right").applyOptions({ autoScale: true });
  };
  const syncChartInteractionMode = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const touchCrosshairMode = isTouchInteractionDevice() && crosshairEnabledRef.current;
    chart.applyOptions({
      crosshair: {
        mode: crosshairEnabledRef.current ? 0 : 2,
      },
      handleScroll: {
        pressedMouseMove: true,
        horzTouchDrag: !touchCrosshairMode,
        vertTouchDrag: !touchCrosshairMode,
        mouseWheel: true,
      },
      trackingMode: {
        exitMode: TrackingModeExitMode.OnNextTap,
      },
    });
  }, []);
  const handleChartRefresh = useCallback(async () => {
    if (!chartParams) return;
    if (historyKey) {
      delete historyCacheRef.current[historyKey];
    }
    const [historyResult, signalResult] = await Promise.all([
      historyQuery.refetch(),
      shouldFetchCurrentSignal ? currentSignalQuery.refetch() : Promise.resolve(null),
    ]);
    if (historyResult.error) {
      toast.error("Failed to refresh chart data");
    }
    if (signalResult && "error" in signalResult && signalResult.error) {
      toast.error("Failed to refresh signal data");
    }
  }, [chartParams, currentSignalQuery, historyKey, historyQuery, shouldFetchCurrentSignal]);
  useEffect(() => {
    crosshairEnabledRef.current = crosshairEnabled;
    syncChartInteractionMode();
    if (!crosshairEnabled) {
      chartHoverRef.current = false;
      touchCrosshairPointerIdRef.current = null;
      chartRef.current?.clearCrosshairPosition();
      updateLegendFromLatest();
    }
  }, [crosshairEnabled, syncChartInteractionMode]);

  const triggerChartToolbar = useCallback(() => {
    if (!chartMode) return;
    setShowChartToolbar(true);
    if (hideToolbarTimerRef.current) {
      window.clearTimeout(hideToolbarTimerRef.current);
    }
    hideToolbarTimerRef.current = window.setTimeout(() => {
      setShowChartToolbar(false);
    }, 3000);
  }, [chartMode]);

  useEffect(() => {
    if (!chartMode) return;
    triggerChartToolbar();
    return () => {
      if (hideToolbarTimerRef.current) {
        window.clearTimeout(hideToolbarTimerRef.current);
        hideToolbarTimerRef.current = null;
      }
    };
  }, [chartMode, triggerChartToolbar]);

  const ActiveChartTypeIcon = getChartTypeIcon(chartType);

  if (chartMode) {
    const activeSymbol = selectedSymbol || urlSymbol;
    const activeIntervalLabel =
      CHART_INTERVALS.find((interval) => interval.value === chartInterval)?.label ?? chartInterval;
    const chartToolbarClass =
      "absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 px-1 py-0.5 shadow-sm backdrop-blur transition dark:border-slate-700/70 dark:bg-slate-900/80 sm:bottom-10 lg:bottom-8 lg:gap-1.5 lg:px-1.5 lg:py-1";
    const chartToolButtonClass =
      "inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200/70 bg-white/90 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white sm:h-6 sm:w-6";
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-950">
        <div className="flex h-full flex-col gap-3 p-2 sm:gap-4 sm:p-4">
          <header className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950/85 sm:gap-3 sm:p-4">
            <div>
              <div className="inline-flex items-center gap-1.5">
                <p className="inline-flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:text-[10px] sm:tracking-[0.16em]">
                  <BarChart3 className="h-3 w-3" />
                  Live Chart
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsChartVisibilityDialogOpen(true)}
                  aria-label="Chart visibility settings"
                  title="Chart visibility settings"
                  className="h-5 w-5 rounded-full border-slate-300/80 bg-white/85 text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700/70 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100 sm:h-6 sm:w-6"
                >
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2">
                <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                  {activeSymbol || "Select a symbol"}
                </p>
                <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 p-0.5 dark:bg-slate-900/70 sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-6 min-w-[56px] justify-between gap-1 border-0 bg-white/85 px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-none dark:bg-slate-900/70 dark:text-slate-200"
                      >
                        <span>{activeIntervalLabel}</span>
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      sideOffset={6}
                      className="max-h-[45vh] w-36 overflow-y-auto border border-slate-300/85 bg-white/95 p-1 dark:border-slate-700/80 dark:bg-slate-950/95"
                    >
                      {CHART_INTERVALS.map((interval) => (
                        <DropdownMenuItem
                          key={interval.value}
                          onSelect={(event) => {
                            event.preventDefault();
                            setChartInterval(interval.value);
                          }}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-sky-500/10 hover:text-sky-700 focus:bg-sky-500/10 focus:text-sky-700 data-[highlighted]:bg-sky-500/10 data-[highlighted]:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-500/20 dark:hover:text-slate-100 dark:focus:bg-sky-500/20 dark:focus:text-slate-100 dark:data-[highlighted]:bg-sky-500/20 dark:data-[highlighted]:text-slate-100",
                            chartInterval === interval.value &&
                              "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-slate-100"
                          )}
                        >
                          <span>{interval.label}</span>
                          {chartInterval === interval.value ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                          ) : null}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-6 min-w-[104px] max-w-[132px] justify-between gap-1 overflow-hidden border-0 bg-white/85 px-2 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-none dark:bg-slate-900/70 dark:text-slate-200"
                      >
                        <span className="inline-flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                          <ActiveChartTypeIcon className="h-3 w-3" />
                          <span className="truncate">{chartType === "heikin" ? "HA" : "Candle"}</span>
                        </span>
                        <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={6}
                      className="w-32 border border-slate-300/85 bg-white/95 p-1 dark:border-slate-700/80 dark:bg-slate-950/95"
                    >
                      {CHART_TYPES.map((type) => (
                        <DropdownMenuItem
                          key={type.value}
                          onSelect={(event) => {
                            event.preventDefault();
                            setChartType(type.value);
                          }}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-sky-500/10 hover:text-sky-700 focus:bg-sky-500/10 focus:text-sky-700 data-[highlighted]:bg-sky-500/10 data-[highlighted]:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-500/20 dark:hover:text-slate-100 dark:focus:bg-sky-500/20 dark:focus:text-slate-100 dark:data-[highlighted]:bg-sky-500/20 dark:data-[highlighted]:text-slate-100",
                            chartType === type.value &&
                              "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-slate-100"
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            {(() => {
                              const TypeIcon = getChartTypeIcon(type.value);
                              return <TypeIcon className="h-3.5 w-3.5 opacity-80" />;
                            })()}
                            {type.label}
                          </span>
                          {chartType === type.value ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                          ) : null}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-[148px] justify-between gap-2 overflow-hidden border-slate-300/80 bg-white/80 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 transition dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200"
                    >
                      <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                        <ActiveChartTypeIcon className="h-3.5 w-3.5" />
                        <span className="truncate">{chartType === "heikin" ? "Heikin Ashi" : "Candles"}</span>
                      </span>
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    collisionPadding={12}
                    sideOffset={8}
                    className="w-[max(7.5rem,var(--radix-dropdown-menu-trigger-width))] max-w-[calc(100vw-2rem)] border border-slate-300/85 bg-white/95 p-1 dark:border-slate-700/80 dark:bg-slate-950/95"
                  >
                    {CHART_TYPES.map((type) => (
                      <DropdownMenuItem
                        key={type.value}
                        onSelect={(event) => {
                          event.preventDefault();
                          setChartType(type.value);
                        }}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-sky-500/10 hover:text-sky-700 focus:bg-sky-500/10 focus:text-sky-700 data-[highlighted]:bg-sky-500/10 data-[highlighted]:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-500/20 dark:hover:text-slate-100 dark:focus:bg-sky-500/20 dark:focus:text-slate-100 dark:data-[highlighted]:bg-sky-500/20 dark:data-[highlighted]:text-slate-100",
                          chartType === type.value &&
                            "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-slate-100"
                        )}
                      >
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          {(() => {
                            const TypeIcon = getChartTypeIcon(type.value);
                            return <TypeIcon className="h-3.5 w-3.5 opacity-80" />;
                          })()}
                          <span className="truncate">{type.label}</span>
                        </span>
                        {chartType === type.value ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                type="button"
                onClick={() => {
                  window.location.href = "/dashboard/watchlist";
                }}
                aria-label="Back to watchlist"
                className="hidden h-9 w-9 rounded-full border border-slate-300/80 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/80 sm:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex w-full flex-wrap items-center gap-1.5 pt-1 sm:gap-2 sm:pt-2">
              <div className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-700/70 dark:bg-slate-900/70 sm:flex">
                {CHART_INTERVALS.map((interval) => (
                  <button
                    key={interval.value}
                    type="button"
                    onClick={() => setChartInterval(interval.value)}
                    className={cn(
                      "rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] transition sm:px-2.5 sm:text-[10px]",
                      chartInterval === interval.value
                        ? "bg-sky-500 text-white shadow-[0_6px_14px_-10px_rgba(14,165,233,0.9)]"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    )}
                  >
                    {interval.label}
                  </button>
                ))}
              </div>
              {!activeSymbol ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Pass `?symbol=SYMBOL` in the URL to load a chart.
                </span>
              ) : historyQuery.isFetching ? (
                <div className="flex items-center">
                  <CandleLoader size="sm" />
                </div>
              ) : historyCandles.length === 0 ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">No chart data available.</span>
              ) : null}
            </div>
          </header>

          <section
            className="group relative flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] focus:outline-none dark:border-slate-800 dark:bg-slate-950/70 touch-none"
            tabIndex={0}
            onPointerDown={(event) => {
              event.currentTarget.focus();
              triggerChartToolbar();
            }}
            onPointerMove={triggerChartToolbar}
            onMouseEnter={triggerChartToolbar}
          >
            {shouldRenderChartLegend ? (
              <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] rounded-lg border border-slate-200/80 bg-white/90 px-1.5 py-1 text-[10px] text-slate-600 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-300 sm:left-3 sm:top-3 sm:max-w-[calc(100%-1.5rem)] sm:px-2 sm:py-1 sm:text-[11px]">
                {chartVisibility.showOhlc && chartLegend ? (
                  <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap sm:flex-wrap sm:gap-2 sm:overflow-visible">
                    <span className="shrink-0">
                      O{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatNumber(chartLegend.open, chartLegendDigits)}
                      </span>
                    </span>
                    <span className="shrink-0">
                      H{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatNumber(chartLegend.high, chartLegendDigits)}
                      </span>
                    </span>
                    <span className="shrink-0">
                      L{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatNumber(chartLegend.low, chartLegendDigits)}
                      </span>
                    </span>
                    <span className="shrink-0">
                      C{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatNumber(chartLegend.close, chartLegendDigits)}
                      </span>
                    </span>
                  </div>
                ) : null}
                {shouldRenderSignalSummary ? (
                  <div
                    className={cn(
                      chartVisibility.showOhlc && "mt-1 border-t border-slate-200/70 pt-1 dark:border-slate-700/70"
                    )}
                  >
                    <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap text-slate-600 dark:text-slate-300 sm:flex-wrap sm:gap-x-3 sm:gap-y-0.5 sm:overflow-visible">
                      <span className="shrink-0 uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:hidden">
                        Signal
                      </span>
                      <span className="hidden uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:inline">
                        Current Signal
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-semibold",
                          currentSignalLabel === "BUY"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : currentSignalLabel === "SELL" || currentSignalLabel === "STOPLOSS"
                              ? "text-rose-700 dark:text-rose-300"
                              : "text-amber-700 dark:text-amber-300"
                        )}
                      >
                        {currentSignalLabel}
                      </span>
                      {currentSignalAchievedSummary ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_12px_20px_-14px_rgba(22,163,74,0.95)] dark:border-emerald-400/55 dark:bg-emerald-500 dark:text-slate-950">
                          <Check className="h-3 w-3" />
                          {currentSignalAchievedSummary}
                        </span>
                      ) : null}
                      {typeof currentSignalEntry === "number" ? (
                        <span className="shrink-0">
                          Entry{" "}
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(currentSignalEntry, chartLegendDigits)}
                          </span>
                        </span>
                      ) : null}
                      {typeof currentSignalStopLoss === "number" ? (
                        <span className="shrink-0">
                          SL{" "}
                          <span className="font-semibold text-rose-700 dark:text-rose-300">
                            {formatNumber(currentSignalStopLoss, chartLegendDigits)}
                          </span>
                        </span>
                      ) : null}
                      {currentSignalTargets.map((target, index) => {
                        const level = index + 1;
                        const isAchieved = currentSignalAchievedTargetLevels.includes(level);

                        return (
                          <span
                            key={`current-signal-target-${level}`}
                            className={cn(
                              "shrink-0",
                              isAchieved &&
                                "inline-flex items-center gap-1 rounded-full border border-emerald-500/70 bg-emerald-600 px-2 py-0.5 text-white shadow-[0_12px_20px_-14px_rgba(22,163,74,0.95)] dark:border-emerald-400/55 dark:bg-emerald-500 dark:text-slate-950"
                            )}
                          >
                            {isAchieved ? <Check className="h-3 w-3" /> : null}
                            <span className={cn(isAchieved ? "font-semibold" : undefined)}>TP{level}</span>{" "}
                            <span
                              className={cn(
                                "font-semibold text-emerald-700 dark:text-emerald-300",
                                isAchieved && "text-white dark:text-slate-950"
                              )}
                            >
                              {formatNumber(target, chartLegendDigits)}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div
              className={cn(
                chartToolbarClass,
                isAdjustOpen || showChartToolbar
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none",
                "sm:opacity-90"
              )}
              onPointerDown={triggerChartToolbar}
            >
              <button
                type="button"
                onClick={() => setCrosshairEnabled((prev) => !prev)}
                className={cn(
                  chartToolButtonClass,
                  crosshairEnabled
                    ? "border-sky-500/60 text-sky-600 dark:border-sky-400/60 dark:text-sky-300"
                    : "opacity-80"
                )}
                aria-label={crosshairEnabled ? "Hide crosshair" : "Show crosshair"}
                title={crosshairEnabled ? "Hide crosshair" : "Show crosshair"}
              >
                <Crosshair className="h-3 w-3 lg:h-4 lg:w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleChartZoom("out")}
                className={chartToolButtonClass}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <Minus className="h-3 w-3 lg:h-4 lg:w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleChartZoom("in")}
                className={chartToolButtonClass}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerChartToolbar();
                  void handleChartRefresh();
                }}
                className={cn(chartToolButtonClass, historyQuery.isFetching && "opacity-80")}
                aria-label="Refresh chart"
                title="Refresh chart"
                disabled={historyQuery.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "h-3 w-3 lg:h-4 lg:w-4",
                    historyQuery.isFetching && "animate-spin"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={handleChartReset}
                className={chartToolButtonClass}
                aria-label="Reset chart"
                title="Reset chart"
              >
                <RotateCcw className="h-3 w-3 lg:h-4 lg:w-4" />
              </button>
            </div>
            <div ref={setChartContainer} className="h-full w-full touch-none select-none" />
          </section>
          <Dialog open={isChartVisibilityDialogOpen} onOpenChange={setIsChartVisibilityDialogOpen}>
            <DialogContent className="flex h-auto max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col overflow-hidden border border-slate-200/85 bg-[linear-gradient(170deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))] p-0 text-slate-900 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48)] sm:max-h-[min(82vh,720px)] sm:max-w-md dark:border-slate-700/80 dark:bg-[linear-gradient(170deg,rgba(7,16,27,0.98),rgba(6,12,22,0.96))] dark:text-slate-100">
              <DialogHeader className="shrink-0 border-b border-slate-200/85 bg-[linear-gradient(120deg,rgba(240,249,255,0.9),rgba(255,255,255,0.88))] px-4 py-3 dark:border-slate-800/80 dark:[background-image:none] dark:bg-transparent sm:px-5 sm:py-4">
                <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  <Eye className="h-4 w-4" />
                  Chart Visibility
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  Choose what stays visible on the chart. Changes apply instantly.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4">
                <div className="space-y-2">
                {CHART_VISIBILITY_OPTIONS.map((option) => {
                  const enabled = chartVisibility[option.key];
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggleChartVisibility(option.key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition sm:px-3 sm:py-3",
                        enabled
                          ? "border-sky-400/45 bg-sky-500/10 text-slate-900 dark:border-sky-400/35 dark:bg-sky-500/10 dark:text-slate-100"
                          : "border-slate-200/85 bg-white/80 text-slate-700 dark:border-slate-700/75 dark:bg-slate-900/55 dark:text-slate-300"
                      )}
                      aria-pressed={enabled}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {option.description}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                          enabled
                            ? "border-emerald-400/50 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/12 dark:text-emerald-300"
                            : "border-slate-300/80 bg-slate-100/80 text-slate-500 dark:border-slate-700/75 dark:bg-slate-800/80 dark:text-slate-400"
                        )}
                      >
                        {enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {enabled ? "Visible" : "Hidden"}
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-between border-t border-slate-200/85 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-slate-800/80 sm:px-5 sm:pb-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-slate-300/80 bg-white/85 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/65 dark:text-slate-200"
                  onClick={resetChartVisibility}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button type="button" className="h-9" onClick={() => setIsChartVisibilityDialogOpen(false)}>
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-300/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(239,246,255,0.92))] p-3 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700/60 dark:bg-[linear-gradient(145deg,rgba(2,7,18,0.95),rgba(5,12,24,0.92))] sm:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,0.14),transparent_46%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.1),transparent_44%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,0.1),transparent_46%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.08),transparent_44%)]" />
        <div className="relative space-y-3">
          <div className="grid gap-3">
            <div className="rounded-xl border border-slate-300/75 bg-white/85 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
                  <ChevronDown className="h-3.5 w-3.5" />
                  Watchlists
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {userWatchlists.length} list{userWatchlists.length === 1 ? "" : "s"}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {watchlistSymbols.length} symbol{watchlistSymbols.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="grid gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-between border-slate-300/80 bg-white/90 text-left text-xs font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-[1px] hover:border-emerald-400/55 hover:bg-emerald-100/40 hover:shadow-[0_10px_22px_-16px_rgba(16,185,129,0.45)] dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-emerald-400/45 dark:hover:bg-emerald-500/[0.14] dark:hover:shadow-[0_12px_24px_-16px_rgba(16,185,129,0.6)]"
                      disabled={watchlistsQuery.isLoading || watchlistBusy}
                    >
                      <span className="truncate">
                        {activeWatchlist?.name || (watchlistsQuery.isLoading ? "Loading watchlists..." : "Select watchlist")}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    className="max-h-[45vh] w-[min(280px,calc(100vw-2.5rem))] overflow-y-auto border border-slate-300/85 bg-white/95 p-1 dark:border-slate-700/80 dark:bg-slate-950/95"
                  >
                    {userWatchlists.length === 0 ? (
                      <DropdownMenuItem disabled className="text-xs text-slate-500 dark:text-slate-400">
                        No watchlists available
                      </DropdownMenuItem>
                    ) : (
                      userWatchlists.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          onSelect={(event) => {
                            event.preventDefault();
                            void handleActivateWatchlist(item.id, item.name);
                          }}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-xs text-slate-700 transition-colors duration-150 hover:bg-emerald-500/10 hover:text-emerald-800 focus:bg-emerald-500/10 focus:text-emerald-800 data-[highlighted]:bg-emerald-500/10 data-[highlighted]:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-500/[0.22] dark:hover:text-emerald-100 dark:focus:bg-emerald-500/[0.22] dark:focus:text-emerald-100 dark:data-[highlighted]:bg-emerald-500/[0.22] dark:data-[highlighted]:text-emerald-100",
                            item.id === activeWatchlistId &&
                              "bg-emerald-500/18 text-emerald-900 dark:bg-emerald-500/[0.32] dark:text-emerald-100"
                          )}
                        >
                          <span className="min-w-0 truncate font-semibold">{item.name}</span>
                          <span className="shrink-0 rounded-full border border-slate-300/80 px-2 py-0.5 text-[10px] text-slate-600 dark:border-slate-700/70 dark:text-slate-300">
                            {item.symbolCount ?? item.symbols?.length ?? 0}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-[auto_auto] sm:justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-emerald-500/30 bg-emerald-500/12 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/18 dark:border-emerald-400/35 dark:bg-emerald-500/12 dark:text-emerald-200"
                    onClick={() => setIsCreateWatchlistOpen(true)}
                    disabled={watchlistBusy}
                  >
                    Create
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-700 hover:bg-rose-500/16 dark:border-rose-400/35 dark:bg-rose-500/12 dark:text-rose-200"
                    onClick={() => void handleDeleteActiveWatchlist()}
                    disabled={watchlistBusy || !activeWatchlistId || userWatchlists.length <= 1}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <p className="mt-2 hidden text-[11px] text-slate-600 dark:text-slate-300 sm:block">
                Create named watchlists and switch instantly. Signals and dashboard view follow the selected active watchlist.
              </p>
            </div>

            <div className="rounded-xl border border-slate-300/75 bg-white/85 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="watchlist-symbol"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Instrument
                </label>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Quick add</span>
              </div>

              <div>
                <Input
                  id="watchlist-symbol"
                  value={symbolInput}
                  onChange={(event) => setSymbolInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAddSymbol();
                    }
                  }}
                  placeholder="Type symbol (example: BTCUSDT)"
                  className="h-11 border-slate-300/80 bg-white/90 dark:border-slate-700/70 dark:bg-slate-950/65"
                />
              </div>

              {(showQuickAdd || searchQuery.length >= 2) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {showQuickAdd ? (
                    <button
                      type="button"
                      className="rounded-full border border-emerald-400/70 bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/18 dark:border-emerald-500/55 dark:bg-emerald-500/14 dark:text-emerald-300"
                      onClick={() => void handleAddSymbol(pendingSymbol)}
                    >
                      Add {pendingSymbol}
                    </button>
                  ) : null}

                  {searchQuery.length >= 2 && searchMarketQuery.isFetching ? (
                    <span className="text-xs text-muted-foreground">Searching symbols...</span>
                  ) : searchQuery.length >= 2 && searchSuggestions.length > 0 ? (
                    searchSuggestions.map((item) => (
                      <button
                        key={item.symbol}
                        type="button"
                        className="group rounded-full border border-slate-300/80 bg-white/90 px-2.5 py-1 text-[11px] text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400/70 hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700/75 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-slate-500/65 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                        onClick={() => void handleAddSymbol(item.symbol)}
                      >
                        {getSuggestionLabel(item)}
                        {item.segment ? (
                          <span className="ml-1 text-[10px] opacity-70">({item.segment})</span>
                        ) : null}
                      </button>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <span className="text-xs text-muted-foreground">No matching symbol found.</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-300/75 bg-white/80 p-2 dark:border-slate-700/70 dark:bg-slate-900/55">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 border-slate-300/80 bg-white/90 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200"
                onClick={() => setIsFilterDialogOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="ml-1 rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/25 dark:text-sky-200">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsWatchlistEditMode((prev) => !prev)}
                className={cn(
                  "h-9 text-xs font-semibold transition-colors md:hidden",
                  isWatchlistEditMode
                    ? "border-rose-500/30 bg-rose-500/12 text-rose-700 hover:bg-rose-500/16 dark:border-rose-400/35 dark:bg-rose-500/12 dark:text-rose-200"
                    : "border-slate-300/80 bg-white/90 text-slate-700 hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/80"
                )}
              >
                {isWatchlistEditMode ? "Done" : "Edit Watchlist"}
              </Button>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="inline-flex flex-1 overflow-hidden rounded-lg border border-slate-300/80 bg-white/90 dark:border-slate-700/70 dark:bg-slate-900/70 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex-1 px-4 py-2 text-xs font-semibold transition-colors sm:flex-none",
                    viewMode === "table"
                      ? "bg-sky-500/16 text-sky-700 dark:bg-sky-500/24 dark:text-sky-200"
                      : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/80"
                  )}
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "flex-1 px-4 py-2 text-xs font-semibold transition-colors sm:flex-none",
                    viewMode === "cards"
                      ? "bg-emerald-500/16 text-emerald-700 dark:bg-emerald-500/24 dark:text-emerald-200"
                      : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800/80"
                  )}
                >
                  Cards
                </button>
              </div>
              {viewMode === "table" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsColumnDialogOpen(true)}
                    className="hidden h-9 border-slate-300/80 bg-white/90 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 md:inline-flex"
                  >
                    <SlidersHorizontal className="mr-1 h-4 w-4" />
                    Visible Columns
                  </Button>
                </>
              ) : (
                reorderMutation.isPending ? (
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Saving card order...
                  </span>
                ) : null
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-300/70 bg-white/90 shadow-[0_18px_55px_-36px_rgba(2,132,199,0.75)] dark:border-slate-700/60 dark:bg-slate-950/50">
        {viewMode === "table" ? (
          <>
            <div className="md:hidden">
              {showLoading ? (
                <div className="flex min-h-[220px] items-center justify-center px-4">
                  <CandleLoader size="md" />
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  {allRows.length === 0
                    ? "No records found. Add your first symbol above."
                    : "No records found for current filters."}
                </div>
              ) : (
                <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
                  {filteredRows.map((row) => {
                    const digits = getPriceDigits(row, getReferencePrice(row));
                    const isUp =
                      typeof row.changePercent === "number"
                        ? row.changePercent >= 0
                        : typeof row.points === "number"
                          ? row.points >= 0
                          : false;
                    const changeClass = isUp ? "text-emerald-500" : "text-rose-500";
                    const priceClass = "text-sky-600 dark:text-sky-300";
                    const highClass = "text-emerald-600 dark:text-emerald-300";
                    const lowClass = "text-rose-600 dark:text-rose-300";
                    const bidClass = "text-emerald-600 dark:text-emerald-300";
                    const askClass = "text-rose-600 dark:text-rose-300";

                    return (
                      <div
                        key={row.symbol}
                        className="flex items-stretch gap-2 px-3 py-2 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedSymbol(row.symbol)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                                {row.symbol}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                                {row.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn("text-[15px] font-bold", priceClass)}>
                                {formatNumber(row.currentPrice, digits)}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className={highClass}>H {formatNumber(row.high, digits)}</span>
                                {" / "}
                                <span className={lowClass}>L {formatNumber(row.low, digits)}</span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
                            <p className={cn("font-semibold", changeClass)}>
                              {formatPoints(row.points, digits)} ({formatPercent(row.changePercent)})
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <span className={bidClass}>Bid {formatNumber(row.bid, digits)}</span>
                              {" / "}
                              <span className={askClass}>Ask {formatNumber(row.ask, digits)}</span>
                            </p>
                          </div>
                        </button>
                        {isWatchlistEditMode ? (
                          <button
                            type="button"
                            onClick={() => {
                              void handleRemoveSymbol(row.symbol);
                            }}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-700 transition-colors hover:bg-rose-500/16 dark:border-rose-400/35 dark:bg-rose-500/12 dark:text-rose-200"
                            disabled={removeMutation.isPending && removingSymbol === row.symbol}
                            aria-label={`Remove ${row.symbol}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow className="bg-slate-100/80 dark:bg-slate-900/80">
              {visibleColumns.map((col) => (
                <TableHead
                  key={col}
                  draggable
                  onDragStart={() => handleColumnDragStart(col)}
                  onDragOver={(event) => handleColumnDragOver(event, col)}
                  onDrop={handleColumnDrop}
                  onDragEnd={clearColumnDragState}
                  className={cn(
                    "group relative select-none pr-3 transition-colors",
                    getColumnDividerClass(col),
                    draggedColumn === col &&
                      "bg-sky-100/80 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
                    dragOverColumn === col &&
                      draggedColumn !== col &&
                      "bg-sky-50/90 ring-1 ring-inset ring-sky-400/45 dark:bg-sky-500/10 dark:ring-sky-400/45",
                    resizingColumn === col &&
                      "bg-sky-50/95 text-sky-700 ring-1 ring-inset ring-sky-400/45 dark:bg-sky-500/12 dark:text-sky-200 dark:ring-sky-300/45",
                    ["open", "current", "high", "low", "close", "changePercent", "points", "bid", "ask", "action"].includes(col)
                      ? "text-right"
                      : ""
                  )}
                  title={`Drag to reorder ${tableColumnLabels[col]}`}
                  style={getColumnWidthStyle(col)}
                >
                  <span
                    className={cn(
                      "inline-flex w-full items-center gap-2 font-bold",
                      ["open", "current", "high", "low", "close", "changePercent", "points", "bid", "ask", "action"].includes(col)
                        ? "justify-end"
                        : "justify-start"
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span>{tableHeaderMap[col]}</span>
                  </span>
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute right-0 top-2 bottom-2 w-px rounded-full bg-slate-300/55 transition-all duration-150 dark:bg-slate-600/60",
                      resizingColumn === col
                        ? "bg-sky-500/85 shadow-[0_0_0_1px_rgba(14,165,233,0.18)] dark:bg-sky-300/85"
                        : "group-hover:bg-slate-400/65 dark:group-hover:bg-slate-500/70"
                    )}
                  />
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    onPointerDown={(event) => startResize(col, event)}
                    className={cn(
                      "absolute -right-1 top-0 z-10 h-full w-3 cursor-col-resize touch-none select-none",
                      resizingColumn === col && "z-20"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute right-1 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-full bg-slate-300/55 transition-all duration-150 dark:bg-slate-600/65",
                        resizingColumn === col
                          ? "h-[calc(100%-10px)] bg-sky-500/85 dark:bg-sky-300/85"
                          : "group-hover:h-10 group-hover:bg-slate-400/65 dark:group-hover:bg-slate-500/70"
                      )}
                    />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-28 align-middle text-center text-sm text-muted-foreground">
                  <div className="flex items-center justify-center">
                    <CandleLoader size="sm" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-28 align-middle text-center text-sm text-muted-foreground">
                  {allRows.length === 0
                    ? "No records found. Add your first symbol above."
                    : "No records found for current filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const trend = row.changePercent ?? 0;
                const digits = getPriceDigits(row, getReferencePrice(row));
                const pulse = cardPulseMap[row.symbol];
                const highPulse = highPulseMap[row.symbol];
                const lowPulse = lowPulseMap[row.symbol];
                const isUp =
                  typeof row.changePercent === "number"
                    ? row.changePercent >= 0
                    : typeof row.points === "number"
                      ? row.points >= 0
                      : false;
                const currentDirectionUp = pulse ? pulse === "up" : isUp;
                const highDirectionUp = highPulse ? highPulse === "up" : true;
                const lowDirectionUp = lowPulse ? lowPulse === "up" : false;
                const trendDirectionUp =
                  typeof row.changePercent === "number"
                    ? row.changePercent >= 0
                    : typeof row.points === "number"
                      ? row.points >= 0
                      : currentDirectionUp;
                const trendClass =
                  typeof row.changePercent !== "number"
                    ? "text-slate-500 dark:text-slate-400"
                    : trend >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400";
                const currentTextClass =
                  pulse === "up"
                    ? "text-emerald-800 dark:text-emerald-200"
                    : pulse === "down"
                      ? "text-rose-800 dark:text-rose-200"
                      : isUp
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-rose-700 dark:text-rose-300";
                const currentPulseBgClass =
                  pulse === "up"
                    ? "bg-[linear-gradient(135deg,rgba(134,239,172,0.72),rgba(74,222,128,0.58))] text-emerald-900 ring-1 ring-emerald-500/50 shadow-[0_8px_20px_-16px_rgba(16,185,129,0.9)] dark:bg-emerald-500/38 dark:text-emerald-100 dark:ring-emerald-400/45 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.55)]"
                    : pulse === "down"
                      ? "bg-[linear-gradient(135deg,rgba(254,205,211,0.78),rgba(251,113,133,0.48))] text-rose-900 ring-1 ring-rose-500/50 shadow-[0_8px_20px_-16px_rgba(244,63,94,0.95)] dark:bg-rose-500/38 dark:text-rose-100 dark:ring-rose-400/45 dark:shadow-[0_0_0_1px_rgba(244,63,94,0.55)]"
                      : "";
                const highTextClass =
                  highPulse === "up"
                    ? "text-emerald-800 dark:text-emerald-200"
                    : highPulse === "down"
                      ? "text-rose-800 dark:text-rose-200"
                      : "text-emerald-700 dark:text-emerald-300";
                const highPulseBgClass =
                  highPulse === "up"
                    ? "bg-emerald-500/20 ring-1 ring-emerald-500/45 dark:bg-emerald-500/32 dark:ring-emerald-400/45"
                    : highPulse === "down"
                      ? "bg-rose-500/20 ring-1 ring-rose-500/45 dark:bg-rose-500/32 dark:ring-rose-400/45"
                      : "";
                const lowTextClass =
                  lowPulse === "up"
                    ? "text-emerald-800 dark:text-emerald-200"
                    : lowPulse === "down"
                      ? "text-rose-800 dark:text-rose-200"
                      : "text-rose-700 dark:text-rose-300";
                const lowPulseBgClass =
                  lowPulse === "up"
                    ? "bg-emerald-500/20 ring-1 ring-emerald-500/45 dark:bg-emerald-500/32 dark:ring-emerald-400/45"
                    : lowPulse === "down"
                      ? "bg-rose-500/20 ring-1 ring-rose-500/45 dark:bg-rose-500/32 dark:ring-rose-400/45"
                      : "";
                const closeTextClass = "text-sky-700 dark:text-sky-300";
                const openTextClass = "text-amber-700 dark:text-amber-300";
                const bidTextClass = "text-emerald-700 dark:text-emerald-300";
                const askTextClass = "text-rose-700 dark:text-rose-300";
                const closeDirectionUp =
                  typeof row.currentPrice === "number" && typeof row.close === "number"
                    ? row.currentPrice >= row.close
                    : trendDirectionUp;
                let dayRangeTag: { label: string; className: string } | null = null;
                if (
                  typeof row.currentPrice === "number" &&
                  typeof row.high === "number" &&
                  typeof row.low === "number" &&
                  Number.isFinite(row.currentPrice) &&
                  Number.isFinite(row.high) &&
                  Number.isFinite(row.low) &&
                  row.high > row.low
                ) {
                  const dayRange = row.high - row.low;
                  const nearHighRatio = (row.high - row.currentPrice) / dayRange;
                  const nearLowRatio = (row.currentPrice - row.low) / dayRange;
                  if (nearHighRatio <= 0.12 && nearHighRatio <= nearLowRatio) {
                    dayRangeTag = {
                      label: "Day High",
                      className:
                        "border-emerald-500/35 bg-emerald-500/14 text-emerald-700 dark:border-emerald-500/45 dark:bg-emerald-500/20 dark:text-emerald-200",
                    };
                  } else if (nearLowRatio <= 0.12) {
                    dayRangeTag = {
                      label: "Day Low",
                      className:
                        "border-rose-500/35 bg-rose-500/14 text-rose-700 dark:border-rose-500/45 dark:bg-rose-500/20 dark:text-rose-200",
                    };
                  }
                }

                const cellMap: Record<TableColumnId, React.ReactNode> = {
                  symbol: (
                    <TableCell
                      key="symbol"
                      className={cn(
                        "font-bold tracking-wide text-slate-900 dark:text-slate-100",
                        getColumnDividerClass("symbol")
                      )}
                      style={getColumnWidthStyle("symbol")}
                    >
                      <span className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onPointerDown={(event) => handleRowPointerStart(event, row.symbol)}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          className="inline-flex h-6 w-6 touch-none cursor-grab items-center justify-center rounded-md border border-slate-200/80 bg-white/90 text-slate-400 transition hover:border-slate-400/70 hover:text-slate-600 active:cursor-grabbing dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-500 dark:hover:border-slate-500/70 dark:hover:text-slate-300"
                          aria-label={`Drag to reorder ${row.symbol}`}
                          disabled={reorderMutation.isPending || watchlistSymbols.length < 2}
                        >
                          <GripVertical className="h-3.5 w-3.5 shrink-0" />
                        </button>
                        <span>{row.symbol}</span>
                      </span>
                    </TableCell>
                  ),
                  name: (
                    <TableCell
                      key="name"
                      className={cn("max-w-44 truncate font-semibold", getColumnDividerClass("name"))}
                      style={getColumnWidthStyle("name")}
                    >
                      {row.name}
                    </TableCell>
                  ),
                  segment: (
                    <TableCell
                      key="segment"
                      className={cn("font-semibold", getColumnDividerClass("segment"))}
                      style={getColumnWidthStyle("segment")}
                    >
                      <Badge
                        variant="outline"
                        className="border-slate-300/80 bg-slate-100/75 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-300"
                      >
                        {row.segment}
                      </Badge>
                    </TableCell>
                  ),
                  exchange: (
                    <TableCell
                      key="exchange"
                      className={cn("font-semibold", getColumnDividerClass("exchange"))}
                      style={getColumnWidthStyle("exchange")}
                    >
                      {row.exchange}
                    </TableCell>
                  ),
                  open: (
                    <TableCell
                      key="open"
                      className={cn("text-right font-bold tabular-nums", openTextClass, getColumnDividerClass("open"))}
                      style={getColumnWidthStyle("open")}
                    >
                      {formatNumber(row.open, digits)}
                    </TableCell>
                  ),
                  current: (
                    <TableCell
                      key="current"
                      className={cn("text-right font-bold tabular-nums", getColumnDividerClass("current"))}
                      style={getColumnWidthStyle("current")}
                    >
                      <div className="inline-flex min-w-[132px] flex-col items-end">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 transition-colors duration-200",
                            currentTextClass,
                            currentPulseBgClass
                          )}
                        >
                          {currentDirectionUp ? (
                            <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                          ) : (
                            <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                          )}
                          {formatNumber(row.currentPrice, digits)}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 inline-flex min-h-[16px] items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                            dayRangeTag
                              ? dayRangeTag.className
                              : "invisible border-transparent bg-transparent text-transparent"
                          )}
                        >
                          {dayRangeTag ? dayRangeTag.label : "Day High"}
                        </span>
                      </div>
                    </TableCell>
                  ),
                  high: (
                    <TableCell
                      key="high"
                      className={cn("text-right font-bold tabular-nums", getColumnDividerClass("high"))}
                      style={getColumnWidthStyle("high")}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 transition-colors duration-200",
                          highTextClass,
                          highPulseBgClass
                        )}
                      >
                        {highDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatNumber(row.high, digits)}
                      </span>
                    </TableCell>
                  ),
                  low: (
                    <TableCell
                      key="low"
                      className={cn("text-right font-bold tabular-nums", getColumnDividerClass("low"))}
                      style={getColumnWidthStyle("low")}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 transition-colors duration-200",
                          lowTextClass,
                          lowPulseBgClass
                        )}
                      >
                        {lowDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatNumber(row.low, digits)}
                      </span>
                    </TableCell>
                  ),
                  close: (
                    <TableCell
                      key="close"
                      className={cn("text-right font-bold tabular-nums", closeTextClass, getColumnDividerClass("close"))}
                      style={getColumnWidthStyle("close")}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {closeDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatNumber(row.close, digits)}
                      </span>
                    </TableCell>
                  ),
                  changePercent: (
                    <TableCell
                      key="changePercent"
                      className={cn(
                        "text-right font-bold tabular-nums",
                        trendClass,
                        getColumnDividerClass("changePercent")
                      )}
                      style={getColumnWidthStyle("changePercent")}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {trendDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatPercent(row.changePercent)}
                      </span>
                    </TableCell>
                  ),
                  points: (
                    <TableCell
                      key="points"
                      className={cn(
                        "text-right font-bold tabular-nums",
                        trendClass,
                        getColumnDividerClass("points")
                      )}
                      style={getColumnWidthStyle("points")}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {trendDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatPoints(row.points, digits)}
                      </span>
                    </TableCell>
                  ),
                  bid: (
                    <TableCell
                      key="bid"
                      className={cn("text-right font-bold tabular-nums", bidTextClass, getColumnDividerClass("bid"))}
                      style={getColumnWidthStyle("bid")}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        {formatNumber(row.bid, digits)}
                      </span>
                    </TableCell>
                  ),
                  ask: (
                    <TableCell
                      key="ask"
                      className={cn("text-right font-bold tabular-nums", askTextClass, getColumnDividerClass("ask"))}
                      style={getColumnWidthStyle("ask")}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        {formatNumber(row.ask, digits)}
                      </span>
                    </TableCell>
                  ),
                  action: (
                    <TableCell
                      key="action"
                      className={cn("text-right font-semibold", getColumnDividerClass("action"))}
                      style={getColumnWidthStyle("action")}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-rose-600 hover:bg-rose-500/[0.07] hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/[0.14] dark:hover:text-rose-200"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRemoveSymbol(row.symbol);
                        }}
                        disabled={removeMutation.isPending && removingSymbol === row.symbol}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </TableCell>
                  ),
                };

                return (
                  <TableRow
                    key={row.symbol}
                    data-watchlist-table-row-symbol={row.symbol}
                    onClick={() => setSelectedSymbol(row.symbol)}
                    className={cn(
                      "group cursor-pointer transition-all duration-300 hover:bg-sky-500/[0.06] dark:hover:bg-sky-400/[0.08]",
                      draggedRowSymbol === row.symbol &&
                        "bg-sky-100/80 ring-1 ring-inset ring-sky-400/45 dark:bg-sky-500/10 dark:ring-sky-400/45",
                      dragOverRowSymbol === row.symbol &&
                        draggedRowSymbol !== row.symbol &&
                        "bg-sky-50/90 ring-1 ring-inset ring-sky-300/45 dark:bg-sky-500/10 dark:ring-sky-300/35"
                    )}
                  >
                    {visibleColumns.map((col) => cellMap[col])}
                  </TableRow>
                );
              })
            )}
          </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.16),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.14),transparent_44%),linear-gradient(140deg,rgba(255,255,255,0.96),rgba(240,249,255,0.92))] p-2.5 dark:bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.14),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.12),transparent_44%),linear-gradient(140deg,rgba(5,11,19,0.98),rgba(5,12,21,0.96))] sm:p-3">
            {showLoading ? (
              <div className="flex min-h-[220px] items-center justify-center px-4">
                <CandleLoader size="md" />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                {allRows.length === 0
                  ? "No records found. Add your first symbol above."
                  : "No records found for current filters."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filteredRows.map((row) => {
                  const digits = getPriceDigits(row, getReferencePrice(row));
                  const pulse = cardPulseMap[row.symbol];
                  const isUp =
                    typeof row.changePercent === "number"
                      ? row.changePercent >= 0
                      : typeof row.points === "number"
                        ? row.points >= 0
                        : false;
                  const accentClass = isUp ? "before:bg-emerald-500" : "before:bg-rose-500";
                  const priceClass =
                    pulse === "up"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : pulse === "down"
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-slate-900 dark:text-slate-100";
                  const pointsClass = isUp ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300";
                  const priceBadgeClass =
                    "bg-slate-100/95 shadow-[0_0_0_1px_rgba(148,163,184,0.38)] dark:[background-image:none] dark:bg-[#1a2534] dark:shadow-[0_0_0_1px_rgba(100,116,139,0.45)]";
                  const pricePulseClass =
                    pulse === "up"
                      ? "bg-[linear-gradient(140deg,rgba(167,243,208,0.98),rgba(110,231,183,0.95))] shadow-[0_0_0_1px_rgba(16,185,129,0.6),0_10px_24px_-16px_rgba(16,185,129,0.82)] dark:[background-image:none] dark:bg-emerald-500/[0.35] dark:shadow-[0_0_0_1px_rgba(16,185,129,0.5)]"
                      : pulse === "down"
                        ? "bg-[linear-gradient(140deg,rgba(254,205,211,0.99),rgba(251,113,133,0.28))] shadow-[0_0_0_1px_rgba(244,63,94,0.62),0_10px_24px_-16px_rgba(244,63,94,0.86)] dark:[background-image:none] dark:bg-rose-500/[0.36] dark:shadow-[0_0_0_1px_rgba(244,63,94,0.5)]"
                        : "";
                  const pulseClass =
                    pulse === "up"
                      ? "border-emerald-400/80 bg-emerald-500/[0.08] shadow-[0_10px_24px_-16px_rgba(16,185,129,0.68)] ring-1 ring-emerald-300/65 dark:bg-emerald-500/12 dark:shadow-[0_12px_24px_-16px_rgba(16,185,129,0.95)] dark:ring-emerald-400/45"
                      : pulse === "down"
                        ? "border-rose-400/80 bg-rose-500/[0.09] shadow-[0_10px_24px_-16px_rgba(244,63,94,0.72)] ring-1 ring-rose-300/65 dark:bg-rose-500/12 dark:shadow-[0_12px_24px_-16px_rgba(244,63,94,0.95)] dark:ring-rose-400/45"
                        : "";

                  return (
                    <div
                      key={row.symbol}
                      data-watchlist-card-symbol={row.symbol}
                      className={cn(
                        "relative min-h-[94px] overflow-hidden rounded-md border border-slate-200/85 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.88))] px-1.5 py-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/85 hover:bg-white hover:shadow-[0_12px_24px_-18px_rgba(15,23,42,0.32)] dark:border-slate-800/90 dark:bg-[linear-gradient(160deg,rgba(8,17,28,0.98),rgba(11,23,36,0.96))] dark:hover:border-slate-600/70 dark:hover:bg-[linear-gradient(160deg,rgba(10,23,36,0.98),rgba(14,31,48,0.96))] dark:hover:shadow-[0_12px_24px_-18px_rgba(2,6,23,0.75)] sm:min-h-[106px] sm:px-2 sm:py-1.5",
                        "before:absolute before:inset-y-2 before:left-0 before:w-[2px]",
                        accentClass,
                        pulseClass,
                        draggedCardSymbol === row.symbol &&
                          "scale-[0.985] border-sky-400/85 bg-sky-50/90 shadow-[0_16px_34px_-20px_rgba(14,165,233,0.8)] dark:bg-sky-500/10 dark:border-sky-400/70",
                        dragOverCardSymbol === row.symbol &&
                          draggedCardSymbol !== row.symbol &&
                          "border-sky-400/80 ring-2 ring-sky-500/20 dark:border-sky-400/70 dark:ring-sky-400/20"
                      )}
                    >
                        <button
                          type="button"
                          onClick={() => setSelectedSymbol(row.symbol)}
                          className={cn(
                            "block w-full pr-7 text-left",
                            isWatchlistEditMode ? "pb-4" : "md:pb-4"
                          )}
                        >
                        <p className="truncate text-[8px] font-semibold uppercase tracking-[0.11em] text-slate-800 dark:text-slate-300 sm:text-[10px]">
                          {row.symbol}
                        </p>
                        <div className={cn("mt-0.5 inline-flex rounded-[4px] px-1.5 py-0.5 transition-colors duration-200", priceBadgeClass, pricePulseClass)}>
                          <p className={cn("text-[15px] font-black leading-none tracking-tight sm:text-[19px]", priceClass)}>
                            {formatNumber(row.currentPrice, digits)}
                          </p>
                        </div>
                        <p className={cn("mt-0.5 text-[9px] font-semibold sm:mt-1 sm:text-[11px]", pointsClass)}>
                          {formatPoints(row.points, digits)} ({formatPercent(row.changePercent)})
                        </p>
                        <p className="mt-0.5 text-[8px] text-slate-500 dark:text-slate-500 sm:mt-1 sm:text-[10px]">
                          {row.exchange}
                        </p>
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => handleCardDragStart(event, row.symbol)}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        className="absolute right-1 top-1 inline-flex h-6 w-6 touch-none cursor-grab items-center justify-center rounded-md border border-slate-200/80 bg-white/90 text-slate-400 transition hover:border-slate-400/70 hover:text-slate-600 active:cursor-grabbing dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-slate-500 dark:hover:border-slate-500/70 dark:hover:text-slate-300"
                        aria-label={`Drag to reorder ${row.symbol}`}
                        disabled={reorderMutation.isPending || watchlistSymbols.length < 2}
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleRemoveSymbol(row.symbol);
                        }}
                        className="absolute bottom-1 right-1 hidden h-6 w-6 items-center justify-center rounded-md border border-rose-300/80 bg-rose-500/10 text-rose-600 transition hover:border-rose-400/45 hover:bg-rose-500/[0.12] hover:text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:border-rose-400/50 dark:hover:bg-rose-500/[0.18] dark:hover:text-rose-200 md:inline-flex"
                        aria-label={`Remove ${row.symbol}`}
                        disabled={removeMutation.isPending && removingSymbol === row.symbol}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {isWatchlistEditMode ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            void handleRemoveSymbol(row.symbol);
                          }}
                          className="absolute bottom-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-md border border-rose-300/80 bg-rose-500/10 text-rose-600 transition hover:border-rose-400/45 hover:bg-rose-500/[0.12] hover:text-rose-700 dark:border-rose-500/50 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:border-rose-400/50 dark:hover:bg-rose-500/[0.18] dark:hover:text-rose-200 md:hidden"
                          aria-label={`Remove ${row.symbol}`}
                          disabled={removeMutation.isPending && removingSymbol === row.symbol}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <Dialog open={isCreateWatchlistOpen} onOpenChange={setIsCreateWatchlistOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] border border-slate-200/85 bg-[linear-gradient(170deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))] p-0 text-slate-900 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48)] sm:max-w-md dark:border-slate-700/80 dark:bg-[linear-gradient(170deg,rgba(7,16,27,0.98),rgba(6,12,22,0.96))] dark:text-slate-100">
          <DialogHeader className="border-b border-slate-200/85 bg-[linear-gradient(120deg,rgba(240,249,255,0.9),rgba(255,255,255,0.88))] px-5 py-4 dark:border-slate-800/80 dark:[background-image:none] dark:bg-transparent">
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Create Watchlist
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Enter a name for your new watchlist. It will become your active watchlist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            <div className="space-y-1">
              <label
                htmlFor="new-watchlist-name"
                className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400"
              >
                Watchlist Name
              </label>
              <Input
                id="new-watchlist-name"
                value={newWatchlistName}
                onChange={(event) => setNewWatchlistName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleCreateWatchlist();
                  }
                }}
                placeholder="Example: Swing Setup"
                className="h-11 border-slate-300/80 bg-white/90 dark:border-slate-700/70 dark:bg-slate-950/65"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateWatchlistOpen(false)}
                className="h-10 border-slate-300/80 bg-white/90 text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200"
                disabled={createWatchlistMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreateWatchlist()}
                className="h-10 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                disabled={createWatchlistMutation.isPending}
              >
                {createWatchlistMutation.isPending ? "Creating..." : "Create Watchlist"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-[calc(100%-1rem)] overflow-y-auto border border-slate-200/85 bg-[linear-gradient(170deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))] p-0 text-slate-900 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48)] sm:max-h-[82vh] sm:max-w-lg dark:border-slate-700/80 dark:bg-[linear-gradient(170deg,rgba(7,16,27,0.98),rgba(6,12,22,0.96))] dark:text-slate-100">
          <DialogHeader className="border-b border-slate-200/85 bg-[linear-gradient(120deg,rgba(240,249,255,0.9),rgba(255,255,255,0.88))] px-5 py-4 dark:border-slate-800/80 dark:[background-image:none] dark:bg-transparent">
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold tracking-wide text-slate-900 dark:text-slate-100">
              <SlidersHorizontal className="h-5 w-5 text-sky-600 dark:text-sky-300" />
              Filters
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Search and narrow instruments by segment and exchange.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            <div className="space-y-1">
              <label
                htmlFor="watchlist-filter"
                className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400"
              >
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="watchlist-filter"
                  value={tableSearch}
                  onChange={(event) => setTableSearch(event.target.value)}
                  placeholder="Search symbol, name, segment..."
                  className="h-11 border-slate-300/80 bg-white/90 pl-8 dark:border-slate-700/70 dark:bg-slate-950/65"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                  Segment
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-300/85 bg-white/90 px-2.5 text-left text-sm text-slate-700 outline-none transition-colors hover:border-slate-400/70 dark:border-slate-700/70 dark:bg-slate-950/65 dark:text-slate-200 dark:hover:border-slate-500/70"
                    >
                      <span className="truncate">{segmentFilter}</span>
                      <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] border-slate-300/85 bg-white/95 p-1 dark:border-slate-700/80 dark:bg-slate-950/95"
                  >
                    {segmentOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        className={cn(
                          "cursor-pointer rounded-md px-2 py-2 text-sm text-slate-700 dark:text-slate-200",
                          option === segmentFilter &&
                            "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
                        )}
                        onSelect={() => setSegmentFilter(option)}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                  Exchange
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-300/85 bg-white/90 px-2.5 text-left text-sm text-slate-700 outline-none transition-colors hover:border-slate-400/70 dark:border-slate-700/70 dark:bg-slate-950/65 dark:text-slate-200 dark:hover:border-slate-500/70"
                    >
                      <span className="truncate">{exchangeFilter}</span>
                      <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] border-slate-300/85 bg-white/95 p-1 dark:border-slate-700/80 dark:bg-slate-950/95"
                  >
                    {exchangeOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        className={cn(
                          "cursor-pointer rounded-md px-2 py-2 text-sm text-slate-700 dark:text-slate-200",
                          option === exchangeFilter &&
                            "bg-sky-500/12 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
                        )}
                        onSelect={() => setExchangeFilter(option)}
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => {
                  setTableSearch("");
                  setSegmentFilter("ALL");
                  setExchangeFilter("ALL");
                }}
              >
                Clear
              </Button>
              <Button type="button" className="h-9" onClick={() => setIsFilterDialogOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-[calc(100%-1rem)] overflow-y-auto border border-slate-200/85 bg-[linear-gradient(170deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))] p-0 text-slate-900 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48)] sm:max-h-[82vh] sm:max-w-md dark:border-slate-700/80 dark:bg-[linear-gradient(170deg,rgba(7,16,27,0.98),rgba(6,12,22,0.96))] dark:text-slate-100">
          <DialogHeader className="border-b border-slate-200/85 bg-[linear-gradient(120deg,rgba(240,249,255,0.9),rgba(255,255,255,0.88))] px-5 py-4 dark:border-slate-800/80 dark:[background-image:none] dark:bg-transparent">
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold tracking-wide text-slate-900 dark:text-slate-100">
              <SlidersHorizontal className="h-5 w-5 text-sky-600 dark:text-sky-300" />
              Visible Columns
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Choose which columns to show. Reordering happens directly from the watchlist headers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            <div className="space-y-2">
              {columnOrder.map((colId) => {
                const isHidden = hiddenColumnSet.has(colId);
                return (
                  <div
                    key={colId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-900/65"
                  >
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleColumn(colId)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                      />
                      <span className="font-semibold">{tableColumnLabels[colId]}</span>
                    </label>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {isHidden ? "Hidden" : "Visible"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" className="h-9" onClick={resetColumns}>
                Reset
              </Button>
              <Button type="button" className="h-9" onClick={() => setIsColumnDialogOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedSymbol(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-0.5rem)] max-h-[90vh] max-w-[calc(100vw-0.5rem)] overflow-x-hidden overflow-y-auto border border-slate-200/85 bg-[linear-gradient(170deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))] p-0 text-slate-900 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48)] min-[360px]:w-[calc(100vw-1rem)] min-[360px]:max-w-[calc(100vw-1rem)] sm:max-h-[82vh] sm:max-w-xl dark:border-slate-700/80 dark:bg-[linear-gradient(170deg,rgba(7,16,27,0.98),rgba(6,12,22,0.96))] dark:text-slate-100">
          {selectedRow ? (
            <div className="min-w-0 overflow-x-hidden">
              <DialogHeader className="min-w-0 border-b border-slate-200/85 bg-[linear-gradient(120deg,rgba(240,249,255,0.9),rgba(255,255,255,0.88))] px-3 py-3 dark:border-slate-800/80 dark:[background-image:none] dark:bg-transparent sm:px-5 sm:py-4">
                <DialogTitle className="text-base font-extrabold tracking-wide text-slate-900 dark:text-slate-100 sm:text-lg">
                  {selectedRow.symbol}
                </DialogTitle>
                <DialogDescription className="min-w-0 break-words text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                  {selectedRow.name} - {selectedRow.segment} / {selectedRow.exchange}
                </DialogDescription>
              </DialogHeader>

              <div className="min-w-0 space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-4">
                <div className="rounded-xl border border-slate-200/85 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(224,242,254,0.7))] p-3 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.65)] dark:border-slate-800 dark:[background-image:none] dark:bg-[#0b1726] dark:shadow-none sm:p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Bid / Ask</p>
                  <p className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 min-[360px]:text-2xl sm:text-3xl">
                    {formatNumber(selectedRow.bid, detailDigits)} / {formatNumber(selectedRow.ask, detailDigits)}
                  </p>
                  <p className={cn("mt-1 text-xs font-semibold sm:text-sm", detailTrendClass)}>
                    {formatPoints(selectedRow.points, detailDigits)} ({formatPercent(selectedRow.changePercent)})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-2.5 py-2 dark:border-slate-800 dark:bg-[#0a1422] sm:px-3 sm:py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">High</p>
                    <p className="mt-1 text-xs font-semibold sm:text-sm">{formatNumber(selectedRow.high, detailDigits)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-2.5 py-2 dark:border-slate-800 dark:bg-[#0a1422] sm:px-3 sm:py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Low</p>
                    <p className="mt-1 text-xs font-semibold sm:text-sm">{formatNumber(selectedRow.low, detailDigits)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-2.5 py-2 dark:border-slate-800 dark:bg-[#0a1422] sm:px-3 sm:py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Current Price</p>
                    <p className="mt-1 text-xs font-semibold sm:text-sm">{formatNumber(selectedRow.currentPrice, detailDigits)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-2.5 py-2 dark:border-slate-800 dark:bg-[#0a1422] sm:px-3 sm:py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Bid / Ask</p>
                    <p className="mt-1 text-xs font-semibold sm:text-sm">
                      {formatNumber(selectedRow.bid, detailDigits)} / {formatNumber(selectedRow.ask, detailDigits)}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-slate-200/85 bg-white/90 p-2.5 shadow-[0_14px_28px_-22px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-[#0a1422] dark:shadow-none sm:p-3">
                  <div className="flex min-w-0 flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Chart
                      </p>
                      <p className="min-w-0 break-words text-xs font-semibold text-slate-900 dark:text-slate-100 sm:text-sm">
                        {selectedRow.symbol} price action
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                      <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-slate-700/70 dark:bg-slate-900/70 sm:p-1">
                        {CHART_INTERVALS.map((interval) => (
                          <button
                            key={interval.value}
                            type="button"
                            onClick={() => setChartInterval(interval.value)}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] transition sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.12em]",
                              chartInterval === interval.value
                                ? "bg-sky-500 text-white shadow-[0_6px_14px_-10px_rgba(14,165,233,0.9)]"
                                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                            )}
                          >
                            {interval.label}
                          </button>
                        ))}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-7 w-[132px] justify-between gap-2 overflow-hidden border-slate-300/80 bg-white/90 px-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 sm:h-8 sm:w-[150px] sm:px-3 sm:text-[10px] sm:tracking-[0.12em]"
                        >
                          <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                            <ActiveChartTypeIcon className="h-3.5 w-3.5" />
                            <span className="truncate">{chartType === "heikin" ? "Heikin Ashi" : "Candles"}</span>
                          </span>
                          <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          collisionPadding={12}
                          sideOffset={8}
                          className="w-[max(7.5rem,var(--radix-dropdown-menu-trigger-width))] max-w-[calc(100vw-2rem)] border border-slate-300/85 bg-white/95 p-1 dark:border-slate-700/80 dark:bg-slate-950/95"
                        >
                          {CHART_TYPES.map((type) => (
                            <DropdownMenuItem
                              key={type.value}
                              onSelect={(event) => {
                                event.preventDefault();
                                setChartType(type.value);
                              }}
                              className={cn(
                                "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-sky-500/10 hover:text-sky-700 focus:bg-sky-500/10 focus:text-sky-700 data-[highlighted]:bg-sky-500/10 data-[highlighted]:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-500/20 dark:hover:text-slate-100 dark:focus:bg-sky-500/20 dark:focus:text-slate-100 dark:data-[highlighted]:bg-sky-500/20 dark:data-[highlighted]:text-slate-100",
                                chartType === type.value &&
                                  "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-slate-100"
                              )}
                            >
                              <span className="inline-flex min-w-0 items-center gap-1.5">
                                {(() => {
                                  const TypeIcon = getChartTypeIcon(type.value);
                                  return <TypeIcon className="h-3.5 w-3.5 opacity-80" />;
                                })()}
                                <span className="truncate">{type.label}</span>
                              </span>
                              {chartType === type.value ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                              ) : null}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleChartRefresh()}
                        disabled={historyQuery.isFetching}
                        className="h-7 max-w-full border-slate-300/80 bg-white/90 px-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 sm:h-8 sm:px-3 sm:text-[10px] sm:tracking-[0.12em]"
                      >
                        <RefreshCw
                          className={cn("mr-1.5 h-3.5 w-3.5", historyQuery.isFetching && "animate-spin")}
                        />
                        Refresh
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openChartWindow(selectedRow.symbol)}
                        className="h-7 max-w-full border-slate-300/80 bg-white/90 px-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 sm:h-8 sm:px-3 sm:text-[10px] sm:tracking-[0.12em]"
                      >
                        <ScanSearch className="mr-1.5 h-3.5 w-3.5" />
                        Open Full Chart
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 h-[260px] w-full rounded-lg border border-slate-200/80 bg-white/70 p-2 sm:h-[320px] dark:border-slate-700/70 dark:bg-slate-950/60">
                    <div ref={setChartContainer} className="h-full w-full" />
                  </div>

                  {historyQuery.isFetching ? (
                    <div className="mt-3 flex justify-center">
                      <CandleLoader size="sm" />
                    </div>
                  ) : historyCandles.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      No chart data available right now.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-no-leave-confirm="true"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-400/70 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-500/20 hover:text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-500/10 dark:text-emerald-100"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    WhatsApp: Request Chart Access
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 border border-rose-300/70 bg-rose-500/10 px-3 text-rose-700 hover:bg-rose-500/16 hover:text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20 dark:hover:text-rose-200"
                    onClick={async () => {
                      await handleRemoveSymbol(selectedRow.symbol);
                      setSelectedSymbol(null);
                    }}
                    disabled={removeMutation.isPending && removingSymbol === selectedRow.symbol}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Symbol
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WatchlistPageFallback() {
  return (
    <div className="space-y-4 pb-6">
      <div className="rounded-2xl border border-slate-300/70 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-950/70">
        <div className="flex justify-center">
          <CandleLoader size="lg" />
        </div>
      </div>
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={<WatchlistPageFallback />}>
      <WatchlistPageContent />
    </Suspense>
  );
}


