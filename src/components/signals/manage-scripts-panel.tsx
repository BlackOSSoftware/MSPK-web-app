"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CandleLoader } from "@/components/ui/candle-loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  MARKET_QUERY_KEY,
  useMarketSegmentsQuery,
  useMarketSearchQuery,
  useMarketSymbolsQuery,
  useMarketUserWatchlistsQuery,
  useMarketUserWatchlistAddMutation,
  useMarketUserWatchlistQuery,
  useMarketUserWatchlistRemoveMutation,
} from "@/services/market/market.hooks";
import type { MarketSearchItem, MarketSymbol } from "@/services/market/market.types";
import { Check, Eye, Filter, Plus, RefreshCw, ScanSearch, Search, Trash2 } from "lucide-react";

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
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

function getSegmentBucketLabel(
  segmentLike?: string,
  exchangeLike?: string,
  symbolLike?: string,
  nameLike?: string
): string {
  const segment = String(segmentLike || "").trim().toUpperCase();
  const exchange = String(exchangeLike || "").trim().toUpperCase();
  const symbol = String(symbolLike || "").trim().toUpperCase();
  const name = String(nameLike || "").trim().toUpperCase();

  if (exchange === "MCX") return "COMMODITY";

  if (
    exchange === "COMEX" ||
    exchange === "NYMEX" ||
    (segment === "COMMODITY" && exchange && exchange !== "MCX") ||
    (segment === "FNO" && (exchange === "COMEX" || exchange === "NYMEX")) ||
    /(?:CRUDE|WTI|BRENT|USOIL|UKOIL|XAU|XAG|GC\d*!|SI\d*!|CL\d*!|NG\d*!|HG\d*!)/.test(symbol) ||
    /(?:CRUDE|WTI|BRENT|COMEX|NYMEX|GOLD|SILVER|NATURAL GAS|COPPER)/.test(name)
  ) {
    return "COMEX";
  }

  if (segment === "CURRENCY" || segment === "FOREX") {
    return "FOREX";
  }
  if (exchange === "CURRENCY" || exchange === "FOREX") return "FOREX";
  if (segment) return segment;
  return exchange || "OTHER";
}

const SEGMENT_LABELS: Record<string, string> = {
  EQUITY: "Equity",
  INDICES: "Indices",
  FNO: "Futures & Options",
  COMMODITY: "Commodity",
  COMEX: "Comex",
  CURRENCY: "Currency",
  FOREX: "Currency",
  CRYPTO: "Crypto",
};

function getMarketItemName(item: Pick<MarketSearchItem, "name"> | Pick<MarketSymbol, "name">): string {
  return (item.name ?? "").trim();
}

function getMarketItemSegment(
  item: Pick<MarketSearchItem, "segment" | "segmentGroup"> | Pick<MarketSymbol, "segment" | "segmentGroup">
): string {
  return (item.segmentGroup ?? item.segment ?? "").trim().toUpperCase();
}

function getMarketItemExchange(
  item: Pick<MarketSearchItem, "exchange"> | Pick<MarketSymbol, "exchange">
): string {
  return (item.exchange ?? "").trim().toUpperCase();
}

const DEDUPE_SUFFIX_PATTERN = /(\.PR|\.X)$/i;

function getSymbolAliasBase(symbol: string): string {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return "";
  return normalized.replace(DEDUPE_SUFFIX_PATTERN, "");
}

function getSearchDedupeKey(
  item: Pick<MarketSearchItem, "symbol" | "name" | "segment" | "segmentGroup" | "exchange"> |
    Pick<MarketSymbol, "symbol" | "name" | "segment" | "segmentGroup" | "exchange">
): string {
  const symbol = getSymbolAliasBase(String(item.symbol ?? ""));
  if (!symbol) return "";
  const name = getMarketItemName(item).toUpperCase();
  const segment = getMarketItemSegment(item);
  const exchange = getMarketItemExchange(item);
  return `${segment}|${exchange}|${symbol}|${name}`;
}

function isBseMarketItem(
  item: Pick<MarketSearchItem, "exchange" | "symbol" | "name"> |
    Pick<MarketSymbol, "exchange" | "symbol" | "name">
): boolean {
  const exchange = getMarketItemExchange(item);
  const symbol = normalizeSymbol(item.symbol ?? "");
  const name = getMarketItemName(item).toUpperCase();
  return (
    exchange.includes("BSE") ||
    symbol.endsWith("-BSE") ||
    symbol.endsWith("_BSE") ||
    symbol.includes(":BSE") ||
    name.includes("BSE")
  );
}

type ManageScriptsPanelProps = {
  className?: string;
};

export function ManageScriptsPanel({ className }: ManageScriptsPanelProps) {
  const queryClient = useQueryClient();
  const [symbolInput, setSymbolInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addSymbolSegment, setAddSymbolSegment] = useState("ALL");
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState("ALL");
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);

  const watchlistsQuery = useMarketUserWatchlistsQuery(true);
  const watchlistQuery = useMarketUserWatchlistQuery(true, {
    staleTime: 15_000,
    refetchInterval: 25_000,
  });
  const marketSegmentsQuery = useMarketSegmentsQuery(true);
  const addMutation = useMarketUserWatchlistAddMutation();
  const removeMutation = useMarketUserWatchlistRemoveMutation();
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const searchMarketQuery = useMarketSearchQuery(
    { q: deferredSearchQuery, limit: 10 },
    deferredSearchQuery.length >= 2
  );
  const marketSymbolsQuery = useMarketSymbolsQuery(
    {
      limit: deferredSearchQuery.length >= 2 ? 72 : 32,
      ...(deferredSearchQuery.length >= 2 ? { search: deferredSearchQuery } : {}),
      ...(addSymbolSegment !== "ALL" ? { segment: addSymbolSegment } : {}),
    },
    true
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(symbolInput.trim());
    }, 260);

    return () => window.clearTimeout(timer);
  }, [symbolInput]);

  const selectedScripts = useMemo(
    () =>
      (watchlistQuery.data ?? [])
        .map((item) => ({
          symbol: String(item.symbol || "").trim().toUpperCase(),
          segment: String(item.segment || "").trim().toUpperCase(),
          exchange: String(item.exchange || "").trim().toUpperCase(),
          name: String(item.name || "").trim(),
        }))
        .filter((item) => item.symbol.length > 0)
        .sort((left, right) =>
          `${left.segment}|${left.symbol}`.localeCompare(`${right.segment}|${right.symbol}`)
        ),
    [watchlistQuery.data]
  );

  const selectedSymbols = useMemo(() => selectedScripts.map((item) => item.symbol), [selectedScripts]);
  const selectedAliases = useMemo(
    () => new Set(selectedSymbols.map((symbol) => getSymbolAliasBase(symbol)).filter(Boolean)),
    [selectedSymbols]
  );
  const activeWatchlistName = useMemo(() => {
    const activeId = String(watchlistsQuery.data?.activeWatchlistId || "").trim();
    const lists = watchlistsQuery.data?.watchlists ?? [];
    if (activeId) {
      const found = lists.find((item) => item.id === activeId);
      if (found?.name) return found.name;
    }
    const flagged = lists.find((item) => item.isActive);
    return flagged?.name || lists[0]?.name || "Default Watchlist";
  }, [watchlistsQuery.data]);
  const segmentUsageMap = useMemo(() => {
    const groups = new Map<string, number>();
    selectedScripts.forEach((item) => {
      const key = getSegmentBucketLabel(item.segment, item.exchange, item.symbol, item.name);
      groups.set(key, (groups.get(key) ?? 0) + 1);
    });

    return groups;
  }, [selectedScripts]);

  const segmentUsageRows = useMemo(() => {
    return Array.from(segmentUsageMap.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [segmentUsageMap]);
  const segmentFilterOptions = useMemo(() => {
    const segments = new Set<string>();
    selectedScripts.forEach((item) => {
      segments.add(getSegmentBucketLabel(item.segment, item.exchange, item.symbol, item.name));
    });
    return ["ALL", ...Array.from(segments).sort((left, right) => left.localeCompare(right))];
  }, [selectedScripts]);
  const filteredSelectedScripts = useMemo(() => {
    if (selectedSegmentFilter === "ALL") return selectedScripts;
    return selectedScripts.filter(
      (item) =>
        getSegmentBucketLabel(item.segment, item.exchange, item.symbol, item.name) ===
        selectedSegmentFilter
    );
  }, [selectedScripts, selectedSegmentFilter]);
  const selectedSegmentUsageCount = useMemo(() => {
    if (selectedSegmentFilter === "ALL") return selectedScripts.length;
    return segmentUsageMap.get(selectedSegmentFilter) ?? 0;
  }, [selectedSegmentFilter, selectedScripts.length, segmentUsageMap]);
  const segmentSlotMap = useMemo(() => {
    const counters = new Map<string, number>();
    const slots = new Map<string, number>();

    selectedScripts.forEach((item) => {
      const segmentLabel = getSegmentBucketLabel(item.segment, item.exchange, item.symbol, item.name);
      const nextSlot = (counters.get(segmentLabel) ?? 0) + 1;
      counters.set(segmentLabel, nextSlot);
      slots.set(`${segmentLabel}|${item.symbol}`, nextSlot);
    });

    return slots;
  }, [selectedScripts]);

  useEffect(() => {
    if (segmentFilterOptions.includes(selectedSegmentFilter)) return;
    setSelectedSegmentFilter("ALL");
  }, [segmentFilterOptions, selectedSegmentFilter]);

  const addSymbolSegmentOptions = useMemo(() => {
    const options = new Set<string>();
    for (const item of marketSegmentsQuery.data ?? []) {
      const value = (item.segment ?? item.code ?? "").trim().toUpperCase();
      if (value && !value.includes("@") && value !== "BSE" && value !== "GLOBAL") options.add(value);
    }
    for (const item of selectedScripts) {
      const value = getSegmentBucketLabel(item.segment, item.exchange, item.symbol, item.name);
      if (value && !value.includes("@") && value !== "BSE" && value !== "GLOBAL") options.add(value);
    }
    for (const item of marketSymbolsQuery.data ?? []) {
      const value = getMarketItemSegment(item);
      if (value && !value.includes("@") && value !== "BSE" && value !== "GLOBAL") options.add(value);
    }
    for (const item of searchMarketQuery.data ?? []) {
      const value = getMarketItemSegment(item);
      if (value && !value.includes("@") && value !== "BSE" && value !== "GLOBAL") options.add(value);
    }
    return ["ALL", ...Array.from(options).sort((a, b) => a.localeCompare(b))];
  }, [marketSegmentsQuery.data, marketSymbolsQuery.data, searchMarketQuery.data, selectedScripts]);

  const addSymbolResults = useMemo(() => {
    const usedKeys = new Set<string>();
    const merged: Array<MarketSearchItem | MarketSymbol> = [
      ...(deferredSearchQuery.length >= 2 ? searchMarketQuery.data ?? [] : []),
      ...(marketSymbolsQuery.data ?? []),
    ].sort((left, right) => {
      const leftIsBse = isBseMarketItem(left);
      const rightIsBse = isBseMarketItem(right);
      if (leftIsBse !== rightIsBse) return leftIsBse ? 1 : -1;
      const leftExchange = getMarketItemExchange(left);
      const rightExchange = getMarketItemExchange(right);
      if (leftExchange === "NSE" && rightExchange !== "NSE") return -1;
      if (rightExchange === "NSE" && leftExchange !== "NSE") return 1;
      return normalizeSymbol(left.symbol ?? "").localeCompare(normalizeSymbol(right.symbol ?? ""));
    });

    const items: Array<MarketSearchItem | MarketSymbol> = [];

    for (const item of merged) {
      if (!item.symbol) continue;
      const symbol = normalizeSymbol(item.symbol);
      const aliasBase = getSymbolAliasBase(symbol);
      const segment = getMarketItemSegment(item);
      const exchange = getMarketItemExchange(item);
      const dedupeKey = getSearchDedupeKey(item);
      if (!symbol || !aliasBase || (dedupeKey && usedKeys.has(dedupeKey))) {
        continue;
      }
      if (isBseMarketItem(item) || exchange.includes("BSE")) continue;
      if (exchange === "GLOBAL") continue;
      if (addSymbolSegment !== "ALL" && segment !== addSymbolSegment) continue;
      usedKeys.add(dedupeKey || symbol);
      items.push({ ...item, symbol, segment });
      if (items.length >= 28) break;
    }

    return items;
  }, [addSymbolSegment, deferredSearchQuery, marketSymbolsQuery.data, searchMarketQuery.data]);

  const addSymbolLoading =
    marketSymbolsQuery.isFetching ||
    (deferredSearchQuery.length >= 2 && searchMarketQuery.isFetching);

  const handleAddSymbol = async (candidate?: string) => {
    const target = normalizeSymbol(candidate ?? symbolInput);
    if (!target) {
      toast.error("Script required");
      return;
    }
    if (selectedSymbols.includes(target)) {
      toast.info(`${target} already selected`);
      return;
    }

    setAddingSymbol(target);
    try {
      await addMutation.mutateAsync(target);
      await queryClient.invalidateQueries({
        queryKey: [...MARKET_QUERY_KEY, "user-watchlist"],
      });
      setSymbolInput("");
      setSearchQuery("");
      toast.success(`${target} added`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to add script"));
    } finally {
      setAddingSymbol(null);
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
      toast.error(getErrorMessage(error, "Unable to remove script"));
    } finally {
      setRemovingSymbol(null);
    }
  };

  return (
    <section
      className={cn(
        "rounded-[1.8rem] border border-slate-300/70 bg-[linear-gradient(160deg,rgba(248,250,252,0.98),rgba(226,232,240,0.95))] p-4 sm:p-5 dark:border-amber-300/18 dark:bg-[linear-gradient(165deg,rgba(5,12,24,0.9),rgba(14,23,38,0.84))]",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200">
              <Eye className="h-3.5 w-3.5" />
              Manage Scripts
            </div>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Add Or Remove Scripts For Signals
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Signals are unlimited for selected scripts. The only limit is 10 scripts per segment.
            </p>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Active watchlist: <span className="font-semibold text-slate-800 dark:text-slate-100">{activeWatchlistName}</span>
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-[0_12px_24px_-18px_rgba(16,185,129,0.9)] dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200 dark:hover:border-emerald-300/45 dark:hover:shadow-[0_14px_24px_-16px_rgba(52,211,153,0.55)]">
            {selectedScripts.length} script{selectedScripts.length === 1 ? "" : "s"} selected
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300/75 bg-white/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/35 hover:shadow-[0_20px_34px_-28px_rgba(59,130,246,0.9)] dark:border-slate-700/70 dark:bg-slate-950/45 dark:hover:border-sky-400/40 dark:hover:shadow-[0_22px_36px_-26px_rgba(56,189,248,0.45)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
              <Plus className="h-3.5 w-3.5" />
              Add Script
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Search & add</span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={symbolInput}
              onChange={(event) => setSymbolInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && addSymbolResults[0]?.symbol) {
                  event.preventDefault();
                  void handleAddSymbol(addSymbolResults[0].symbol);
                }
              }}
              placeholder="Symbol, name, segment, or exchange"
              className="h-11 border-slate-300/80 bg-white/90 pl-9 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-500/25 dark:border-slate-700/70 dark:bg-slate-950/65 dark:focus-visible:ring-sky-400/30"
            />
          </div>

          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {addSymbolSegmentOptions.map((option) => {
              const isActive = addSymbolSegment === option;
              const label = option === "ALL" ? "All" : SEGMENT_LABELS[option] ?? option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAddSymbolSegment(option)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200",
                    isActive
                      ? "bg-slate-900 text-white shadow-[0_10px_25px_-18px_rgba(15,23,42,0.75)] dark:bg-white dark:text-slate-900"
                      : "border border-slate-200/85 bg-slate-100/85 text-slate-700 hover:border-slate-300/85 hover:bg-slate-200/75 dark:border-slate-700/80 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-800/85"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-sky-300/55 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/12 dark:text-sky-200">
              {addSymbolSegment === "ALL"
                ? "All segments"
                : SEGMENT_LABELS[addSymbolSegment] ?? addSymbolSegment}
            </span>
            <span>{addSymbolResults.length} symbol{addSymbolResults.length === 1 ? "" : "s"} available</span>
            {symbolInput.trim() !== deferredSearchQuery ? (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Updating...</span>
            ) : null}
          </div>

          <div className="mt-2.5 min-h-0 overflow-hidden rounded-2xl border border-slate-200/85 bg-white/92 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] dark:border-slate-800/80 dark:bg-slate-950/55">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
              <span>Available symbols</span>
              <span className="truncate text-right">{deferredSearchQuery.length >= 2 ? "Live search" : "Suggested list"}</span>
            </div>

            <div className="max-h-[320px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
              {addSymbolLoading ? (
                <div className="flex min-h-[200px] items-center justify-center px-4">
                  <CandleLoader size="sm" />
                </div>
              ) : addSymbolResults.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center px-5 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                    <ScanSearch className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    No symbols found
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                    Try another keyword or switch the segment filter to browse more instruments.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/85 dark:divide-slate-800/80">
                  {addSymbolResults.map((item) => {
                    const symbol = normalizeSymbol(item.symbol ?? "");
                    const aliasBase = getSymbolAliasBase(symbol);
                    const segment = getMarketItemSegment(item) || "SEGMENT";
                    const exchange = getMarketItemExchange(item) || "EXCHANGE";
                    const name = getMarketItemName(item) || symbol;
                    const isAdding = addMutation.isPending && symbol === addingSymbol;
                    const isAlreadyAdded = Boolean(aliasBase && selectedAliases.has(aliasBase));
                    return (
                      <div
                        key={`${symbol}-${segment}-${exchange}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-900/60 sm:grid-cols-[minmax(0,1.2fr)_minmax(110px,0.45fr)_auto]"
                      >
                        <button
                          type="button"
                          onClick={() => void handleAddSymbol(String(item.symbol ?? symbol))}
                          disabled={addMutation.isPending || isAlreadyAdded}
                          className="contents text-left disabled:pointer-events-none"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100 sm:text-sm">
                              {symbol}
                            </p>
                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">{name}</p>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 sm:hidden">
                              <span className="font-semibold uppercase text-slate-700 dark:text-slate-200">{exchange}</span>
                              <span className="truncate">{segment}</span>
                            </div>
                          </div>
                        </button>
                        <div className="hidden min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex">
                          <span className="truncate lowercase">{segment.toLowerCase()}</span>
                          <span className="truncate font-semibold uppercase text-slate-700 dark:text-slate-200">
                            {exchange}
                          </span>
                          {isAlreadyAdded ? (
                            <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-300">
                              Added
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleAddSymbol(String(item.symbol ?? symbol))}
                            disabled={addMutation.isPending || isAlreadyAdded}
                            className="h-9 min-w-[72px] rounded-xl border-slate-200/85 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 active:scale-[0.98] dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-9 sm:min-w-0 sm:rounded-full sm:px-0 sm:w-9"
                            aria-label={isAlreadyAdded ? `${symbol} already added` : `Add ${symbol}`}
                          >
                            {addMutation.isPending && isAdding ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : isAlreadyAdded ? (
                              <>
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                <span className="ml-1 text-emerald-700 dark:text-emerald-300 sm:hidden">
                                  Added
                                </span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                <span className="ml-1 sm:hidden">Add</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {segmentUsageRows.map(([segment, count]) => (
            <div
              key={segment}
              className="group relative overflow-hidden rounded-2xl border border-slate-300/75 bg-white/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_22px_36px_-28px_rgba(59,130,246,0.95)] dark:border-slate-700/70 dark:bg-slate-950/45 dark:hover:border-sky-400/45 dark:hover:shadow-[0_24px_38px_-27px_rgba(56,189,248,0.52)]"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-sky-300/18" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Segment
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {segment}
                  </div>
                </div>
                <div
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    count >= 10
                      ? "border-rose-500/35 bg-rose-500/12 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/16 dark:text-rose-200"
                      : count >= 8
                        ? "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/16 dark:text-amber-200"
                        : "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200"
                  )}
                >
                  {count}/10
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {count >= 10 ? "Segment limit reached" : `${10 - count} slot${10 - count === 1 ? "" : "s"} left`}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-300/75 bg-white/85 transition-all duration-300 hover:border-sky-500/35 hover:shadow-[0_24px_38px_-30px_rgba(59,130,246,0.9)] dark:border-slate-700/70 dark:bg-slate-950/45 dark:hover:border-sky-400/40 dark:hover:shadow-[0_24px_40px_-28px_rgba(56,189,248,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300/75 px-4 py-3 dark:border-slate-700/70">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Selected Scripts Table</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Clear view of symbol, segment, exchange, and per-segment usage.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="selected-segment-filter"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/85 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/40 dark:border-slate-600/60 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-sky-400/45"
              >
                <Filter className="h-3.5 w-3.5 text-amber-700 dark:text-amber-100" />
                Segment
              </label>
              <select
                id="selected-segment-filter"
                value={selectedSegmentFilter}
                onChange={(event) => setSelectedSegmentFilter(event.target.value)}
                className="h-8 rounded-full border border-slate-300/80 bg-white/85 px-3 text-xs font-medium text-slate-700 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/45 focus:border-sky-500/45 dark:border-slate-600/60 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-sky-400/45"
              >
                {segmentFilterOptions.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment === "ALL" ? "All segments" : segment}
                  </option>
                ))}
              </select>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200 dark:hover:border-emerald-300/45">
                {selectedSegmentFilter === "ALL"
                  ? `${selectedScripts.length} total`
                  : `${selectedSegmentUsageCount}/10 used`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
          <Table className="min-w-[840px]">
            <TableHeader>
              <TableRow className="bg-slate-100/70 dark:bg-slate-900/70">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Segment Usage</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlistQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading selected scripts...
                  </TableCell>
                </TableRow>
              ) : selectedScripts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-slate-500 dark:text-slate-400">
                    No scripts selected. Add scripts from the search above.
                  </TableCell>
                </TableRow>
              ) : filteredSelectedScripts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-slate-500 dark:text-slate-400">
                    No scripts found in selected segment.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSelectedScripts.map((item, index) => {
                  const segmentLabel = getSegmentBucketLabel(
                    item.segment,
                    item.exchange,
                    item.symbol,
                    item.name
                  );
                  const segmentCount = segmentUsageMap.get(segmentLabel) ?? 0;
                  const segmentSlot = segmentSlotMap.get(`${segmentLabel}|${item.symbol}`) ?? segmentCount;
                  return (
                    <TableRow
                      key={`${item.symbol}-${segmentLabel}`}
                      className="transition-all duration-200 hover:bg-sky-500/8 hover:shadow-[inset_3px_0_0_0_rgba(59,130,246,0.55)] dark:hover:bg-sky-400/10 dark:hover:shadow-[inset_3px_0_0_0_rgba(56,189,248,0.55)]"
                    >
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{item.symbol}</TableCell>
                      <TableCell className="max-w-[260px] truncate text-slate-700 dark:text-slate-300">
                        {item.name || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200">
                          {segmentLabel}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {item.exchange || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            segmentCount >= 10
                              ? "border-rose-500/35 bg-rose-500/12 text-rose-700 dark:border-rose-400/35 dark:bg-rose-500/16 dark:text-rose-200"
                              : segmentCount >= 8
                                ? "border-amber-500/35 bg-amber-500/12 text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/16 dark:text-amber-200"
                                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200"
                          )}
                        >
                          {segmentSlot}/10
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 text-xs font-semibold text-rose-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-500/40 hover:bg-rose-500/16 hover:shadow-[0_10px_18px_-14px_rgba(244,63,94,0.95)] dark:border-rose-400/35 dark:bg-rose-500/14 dark:text-rose-200 dark:hover:border-rose-300/45 dark:hover:shadow-[0_10px_18px_-13px_rgba(251,113,133,0.55)]"
                          onClick={() => void handleRemoveSymbol(item.symbol)}
                          disabled={removeMutation.isPending && removingSymbol === item.symbol}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {segmentUsageRows.length === 0 && !watchlistQuery.isLoading ? (
          <div className="rounded-2xl border border-dashed border-amber-500/35 bg-amber-500/10 p-4 text-xs text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
            Segment usage summary will appear after adding your first script.
          </div>
        ) : null}
      </div>
    </section>
  );
}
