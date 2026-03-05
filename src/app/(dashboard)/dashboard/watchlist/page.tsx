"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useMarketSearchQuery,
  useMarketUserWatchlistAddMutation,
  useMarketUserWatchlistQuery,
  useMarketUserWatchlistRemoveMutation,
} from "@/services/market/market.hooks";
import type { MarketSearchItem, MarketTicker } from "@/services/market/market.types";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";
type ViewMode = "table" | "cards";
type CardPulse = "up" | "down";

const VIEW_MODE_STORAGE_KEY = "watchlist_view_mode";
const SUPPORT_WHATSAPP = "917770039037";

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

function toNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function getReferencePrice(
  row: Pick<WatchlistRow, "currentPrice" | "high" | "low" | "close" | "bid" | "ask">
): number | undefined {
  const candidates = [row.currentPrice, row.high, row.low, row.close, row.bid, row.ask];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
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
    price: toNumber(payload.price ?? payload.last_price ?? payload.lastPrice ?? payload.last),
    high: toNumber(payload.high ?? ohlc?.high),
    low: toNumber(payload.low ?? ohlc?.low),
    close: toNumber(payload.close ?? payload.prevClose ?? ohlc?.close),
    bid: toNumber(payload.bid ?? payload.bestBid ?? bidFromDepth),
    ask: toNumber(payload.ask ?? payload.bestAsk ?? askFromDepth),
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

function mapWatchlistRow(base: MarketTicker, live?: SocketTick): WatchlistRow | null {
  if (!base.symbol) return null;
  const symbol = normalizeSymbol(base.symbol);
  const currentPrice = live?.price ?? base.price;
  const close = live?.close ?? base.close ?? base.prevClose ?? currentPrice;
  const highCandidates = [live?.high, base.high, currentPrice].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );
  const lowCandidates = [live?.low, base.low, currentPrice].filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
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
    currentPrice,
    high,
    low,
    close,
    bid: live?.bid ?? base.bid,
    ask: live?.ask ?? base.ask,
    changePercent: live?.changePercent ?? base.change,
    points,
    updatedAt: live?.timestamp,
  };
}

export default function WatchlistPage() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const subscribedSymbolsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [ticks, setTicks] = useState<Record<string, SocketTick>>({});
  const [symbolInput, setSymbolInput] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [exchangeFilter, setExchangeFilter] = useState("ALL");
  const [tableSearch, setTableSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [cardPulseMap, setCardPulseMap] = useState<Record<string, CardPulse>>({});
  const [highPulseMap, setHighPulseMap] = useState<Record<string, CardPulse>>({});
  const [lowPulseMap, setLowPulseMap] = useState<Record<string, CardPulse>>({});
  const previousPriceRef = useRef<Record<string, number>>({});
  const previousHighRef = useRef<Record<string, number>>({});
  const previousLowRef = useRef<Record<string, number>>({});
  const pulseTimeoutRef = useRef<Record<string, number>>({});

  const watchlistQuery = useMarketUserWatchlistQuery(true, {
    staleTime: 8_000,
    refetchInterval: 25_000,
  });
  const addMutation = useMarketUserWatchlistAddMutation();
  const removeMutation = useMarketUserWatchlistRemoveMutation();

  const searchMarketQuery = useMarketSearchQuery(
    { q: searchQuery, limit: 12 },
    searchQuery.trim().length >= 2
  );

  const watchlistSymbols = useMemo(
    () =>
      (watchlistQuery.data ?? [])
        .map((item) => (item.symbol ? normalizeSymbol(item.symbol) : ""))
        .filter(Boolean),
    [watchlistQuery.data]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
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
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(symbolInput.trim());
    }, 260);

    return () => window.clearTimeout(timer);
  }, [symbolInput]);

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
      setTicks({});
      return;
    }

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

    const scheduleReconnect = () => {
      if (!mountedRef.current || closedByEffect) return;
      const waitMs = Math.min(6_000, 1_200 + reconnectAttempts.current * 500);
      reconnectAttempts.current += 1;
      reconnectRef.current = window.setTimeout(() => {
        connect();
      }, waitMs);
    };

    const connect = () => {
      if (closedByEffect || !mountedRef.current) return;
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
        if (closedByEffect || !mountedRef.current) return;
        setConnectionState("connected");
        reconnectAttempts.current = 0;
        subscribedSymbolsRef.current.clear();
      };

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const message = JSON.parse(event.data) as {
            type?: string;
            payload?: unknown;
          };
          if (message.type !== "tick") return;
          if (!message.payload || typeof message.payload !== "object") return;

          const tick = mapSocketTick(message.payload as Record<string, unknown>);
          if (!tick) return;

          setTicks((prev) => ({
            ...prev,
            [tick.symbol]: tick,
          }));
        } catch {
          // ignore malformed socket payloads
        }
      };

      socket.onerror = () => {
        if (closedByEffect || !mountedRef.current) return;
        setConnectionState("error");
      };

      socket.onclose = () => {
        if (closedByEffect || !mountedRef.current) return;
        setConnectionState("disconnected");
        subscribedSymbolsRef.current.clear();
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      const socket = wsRef.current;
      wsRef.current = null;
      if (socket) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const nextSet = new Set(watchlistSymbols);
    const currentSet = subscribedSymbolsRef.current;

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
      .filter((item): item is WatchlistRow => item !== null)
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [watchlistQuery.data, ticks]);

  useEffect(() => {
    const nextPrices: Record<string, number> = {};
    const nextHighs: Record<string, number> = {};
    const nextLows: Record<string, number> = {};
    const prevPrices = previousPriceRef.current;
    const prevHighs = previousHighRef.current;
    const prevLows = previousLowRef.current;

    for (const row of allRows) {
      if (typeof row.currentPrice === "number" && Number.isFinite(row.currentPrice)) {
        nextPrices[row.symbol] = row.currentPrice;
        const previous = prevPrices[row.symbol];
        if (typeof previous === "number" && Number.isFinite(previous) && previous !== row.currentPrice) {
          const pulse: CardPulse = row.currentPrice > previous ? "up" : "down";
          setCardPulseMap((prev) => ({ ...prev, [row.symbol]: pulse }));

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
          setHighPulseMap((prev) => ({ ...prev, [row.symbol]: pulse }));

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
          setLowPulseMap((prev) => ({ ...prev, [row.symbol]: pulse }));

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


  const filteredRows = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();
    return allRows.filter((row) => {
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
  }, [allRows, tableSearch, segmentFilter, exchangeFilter]);

  const selectedRow = useMemo(() => {
    if (!selectedSymbol) return null;
    return allRows.find((row) => row.symbol === selectedSymbol) ?? null;
  }, [allRows, selectedSymbol]);
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

  const handleAddSymbol = async (candidate?: string) => {
    const target = normalizeSymbol(candidate ?? symbolInput);
    if (!target) {
      toast.error("Symbol required");
      return;
    }
    if (watchlistSymbols.includes(target)) {
      toast.info(`${target} already in watchlist`);
      return;
    }

    try {
      await addMutation.mutateAsync(target);
      await queryClient.invalidateQueries({
        queryKey: [...MARKET_QUERY_KEY, "user-watchlist"],
      });
      setSymbolInput("");
      setSearchQuery("");
      toast.success(`${target} added`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to add symbol"));
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    setRemovingSymbol(symbol);
    try {
      await removeMutation.mutateAsync(symbol);
      await queryClient.invalidateQueries({
        queryKey: [...MARKET_QUERY_KEY, "user-watchlist"],
      });
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

  return (
    <div className="space-y-5 pb-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-300/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(239,246,255,0.92))] p-3 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.35)] dark:border-slate-700/60 dark:bg-[linear-gradient(145deg,rgba(2,7,18,0.95),rgba(5,12,24,0.92))] sm:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,0.14),transparent_46%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.1),transparent_44%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,0.1),transparent_46%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.08),transparent_44%)]" />
        <div className="relative space-y-3">
          <div className="grid gap-3">
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
                        className="group rounded-full border border-slate-300/80 bg-white/90 px-2.5 py-1 text-[11px] text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/75 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-700/75 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-sky-500/70 dark:hover:text-sky-200"
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
            </div>
            <div className="inline-flex w-full overflow-hidden rounded-lg border border-slate-300/80 bg-white/90 dark:border-slate-700/70 dark:bg-slate-900/70 sm:w-auto">
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
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-300/70 bg-white/90 shadow-[0_18px_55px_-36px_rgba(2,132,199,0.75)] dark:border-slate-700/60 dark:bg-slate-950/50">
        {viewMode === "table" ? (
          <>
            <div className="md:hidden">
              {showLoading ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading watchlist...</div>
              ) : filteredRows.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {allRows.length === 0
                    ? "Watchlist empty. Add your first symbol above."
                    : "No rows match current filters."}
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
                      <button
                        key={row.symbol}
                        type="button"
                        onClick={() => setSelectedSymbol(row.symbol)}
                        className="w-full px-3 py-2 text-left transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                              {row.symbol}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
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
                    );
                  })}
                </div>
              )}
            </div>
            <div className="hidden md:block">
              <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow className="bg-slate-100/80 dark:bg-slate-900/80">
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Exchange</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  <ArrowDown className="h-3 w-3 text-rose-500" />
                  Current
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  High
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <ArrowDown className="h-3 w-3 text-rose-500" />
                  Low
                </span>
              </TableHead>
              <TableHead className="text-right">Close</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  <ArrowDown className="h-3 w-3 text-rose-500" />
                  Change %
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  <ArrowDown className="h-3 w-3 text-rose-500" />
                  Points
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  Bid
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <ArrowDown className="h-3 w-3 text-rose-500" />
                  Ask
                </span>
              </TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full items-center justify-end gap-1">
                  <Trash2 className="h-3 w-3 text-rose-500" />
                  Action
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showLoading ? (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-sm text-muted-foreground">
                  Loading watchlist...
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="py-8 text-center text-sm text-muted-foreground">
                  {allRows.length === 0
                    ? "Watchlist empty. Add your first symbol above."
                    : "No rows match current filters."}
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

                return (
                  <TableRow
                    key={row.symbol}
                    onClick={() => setSelectedSymbol(row.symbol)}
                    className="group cursor-pointer transition-all duration-300 hover:bg-sky-500/[0.06] dark:hover:bg-sky-400/[0.08]"
                  >
                    <TableCell className="font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                      {row.symbol}
                    </TableCell>
                    <TableCell className="max-w-44 truncate">{row.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-slate-300/80 bg-slate-100/75 text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-300"
                      >
                        {row.segment}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.exchange}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
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
                    <TableCell className="text-right font-semibold tabular-nums">
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
                    <TableCell className="text-right font-semibold tabular-nums">
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
                    <TableCell className={cn("text-right font-semibold tabular-nums", closeTextClass)}>
                      <span className="inline-flex items-center justify-end gap-1">
                        {closeDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatNumber(row.close, digits)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", trendClass)}>
                      <span className="inline-flex items-center justify-end gap-1">
                        {trendDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatPercent(row.changePercent)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", trendClass)}>
                      <span className="inline-flex items-center justify-end gap-1">
                        {trendDirectionUp ? (
                          <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                          <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        )}
                        {formatPoints(row.points, digits)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", bidTextClass)}>
                      <span className="inline-flex items-center justify-end gap-1">
                        <ArrowUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                        {formatNumber(row.bid, digits)}
                      </span>
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", askTextClass)}>
                      <span className="inline-flex items-center justify-end gap-1">
                        <ArrowDown className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
                        {formatNumber(row.ask, digits)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
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
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading watchlist...</div>
            ) : filteredRows.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {allRows.length === 0
                  ? "Watchlist empty. Add your first symbol above."
                  : "No cards match current filters."}
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
                    <button
                      key={row.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(row.symbol)}
                      className={cn(
                        "relative min-h-[94px] overflow-hidden rounded-md border border-slate-200/85 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.88))] px-1.5 py-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/85 hover:bg-white hover:shadow-[0_14px_30px_-18px_rgba(14,165,233,0.78)] dark:border-slate-800/90 dark:bg-[linear-gradient(160deg,rgba(8,17,28,0.98),rgba(11,23,36,0.96))] dark:hover:border-sky-500/60 dark:hover:bg-[linear-gradient(160deg,rgba(10,23,36,0.98),rgba(14,31,48,0.96))] dark:hover:shadow-[0_10px_28px_-18px_rgba(14,165,233,0.8)] sm:min-h-[106px] sm:px-2 sm:py-1.5",
                        "before:absolute before:inset-y-2 before:left-0 before:w-[2px]",
                        accentClass,
                        pulseClass
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
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

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
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-300/85 bg-white/90 px-2.5 text-left text-sm text-slate-700 outline-none transition-colors hover:border-sky-400/70 dark:border-slate-700/70 dark:bg-slate-950/65 dark:text-slate-200 dark:hover:border-sky-500/60"
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
                      className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-300/85 bg-white/90 px-2.5 text-left text-sm text-slate-700 outline-none transition-colors hover:border-sky-400/70 dark:border-slate-700/70 dark:bg-slate-950/65 dark:text-slate-200 dark:hover:border-sky-500/60"
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

      <Dialog
        open={Boolean(selectedRow)}
        onOpenChange={(open) => {
          if (!open) setSelectedSymbol(null);
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-[calc(100%-1rem)] overflow-y-auto border border-slate-200/85 bg-[linear-gradient(170deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))] p-0 text-slate-900 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48)] sm:max-h-[82vh] sm:max-w-xl dark:border-slate-700/80 dark:bg-[linear-gradient(170deg,rgba(7,16,27,0.98),rgba(6,12,22,0.96))] dark:text-slate-100">
          {selectedRow ? (
            <div>
              <DialogHeader className="border-b border-slate-200/85 bg-[linear-gradient(120deg,rgba(240,249,255,0.9),rgba(255,255,255,0.88))] px-5 py-4 dark:border-slate-800/80 dark:[background-image:none] dark:bg-transparent">
                <DialogTitle className="text-lg font-extrabold tracking-wide text-slate-900 dark:text-slate-100">
                  {selectedRow.symbol}
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  {selectedRow.name} - {selectedRow.segment} / {selectedRow.exchange}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 px-5 py-4">
                <div className="rounded-xl border border-slate-200/85 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(224,242,254,0.7))] p-4 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.65)] dark:border-slate-800 dark:[background-image:none] dark:bg-[#0b1726] dark:shadow-none">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Current Price</p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {formatNumber(selectedRow.currentPrice, detailDigits)}
                  </p>
                  <p className={cn("mt-1 text-sm font-semibold", detailTrendClass)}>
                    {formatPoints(selectedRow.points, detailDigits)} ({formatPercent(selectedRow.changePercent)})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-3 py-2.5 dark:border-slate-800 dark:bg-[#0a1422]">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">High</p>
                    <p className="mt-1 text-sm font-semibold">{formatNumber(selectedRow.high, detailDigits)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-3 py-2.5 dark:border-slate-800 dark:bg-[#0a1422]">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Low</p>
                    <p className="mt-1 text-sm font-semibold">{formatNumber(selectedRow.low, detailDigits)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-3 py-2.5 dark:border-slate-800 dark:bg-[#0a1422]">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Close</p>
                    <p className="mt-1 text-sm font-semibold">{formatNumber(selectedRow.close, detailDigits)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200/85 bg-white/90 px-3 py-2.5 dark:border-slate-800 dark:bg-[#0a1422]">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Bid / Ask</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatNumber(selectedRow.bid, detailDigits)} / {formatNumber(selectedRow.ask, detailDigits)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
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


