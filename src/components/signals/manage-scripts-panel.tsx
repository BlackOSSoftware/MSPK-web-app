"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  MARKET_QUERY_KEY,
  useMarketSearchQuery,
  useMarketUserWatchlistsQuery,
  useMarketUserWatchlistAddMutation,
  useMarketUserWatchlistQuery,
  useMarketUserWatchlistRemoveMutation,
} from "@/services/market/market.hooks";
import type { MarketSearchItem } from "@/services/market/market.types";
import { Eye, Filter, Plus, Search, Trash2 } from "lucide-react";

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

function getSuggestionLabel(item: MarketSearchItem): string {
  const symbol = item.symbol ?? "";
  const name = item.name ? ` - ${item.name}` : "";
  return `${symbol}${name}`;
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

type ManageScriptsPanelProps = {
  className?: string;
};

export function ManageScriptsPanel({ className }: ManageScriptsPanelProps) {
  const queryClient = useQueryClient();
  const [symbolInput, setSymbolInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSegmentFilter, setSearchSegmentFilter] = useState("ALL");
  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState("ALL");
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);

  const watchlistsQuery = useMarketUserWatchlistsQuery(true);
  const watchlistQuery = useMarketUserWatchlistQuery(true, {
    staleTime: 15_000,
    refetchInterval: 25_000,
  });
  const addMutation = useMarketUserWatchlistAddMutation();
  const removeMutation = useMarketUserWatchlistRemoveMutation();
  const searchMarketQuery = useMarketSearchQuery(
    { q: searchQuery, limit: 12 },
    searchQuery.trim().length >= 2
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

  const pendingSymbol = useMemo(() => normalizeSymbol(symbolInput), [symbolInput]);
  const searchSuggestions = useMemo(() => {
    const list = searchMarketQuery.data ?? [];
    const selected = new Set(selectedSymbols);
    const used = new Set<string>();
    const suggestions: MarketSearchItem[] = [];

    for (const item of list) {
      if (!item.symbol) continue;
      const symbol = normalizeSymbol(item.symbol);
      if (selected.has(symbol) || used.has(symbol)) continue;
      if (
        searchSegmentFilter !== "ALL" &&
        getSegmentBucketLabel(item.segment, item.exchange, item.symbol, item.name) !==
          searchSegmentFilter
      ) {
        continue;
      }
      used.add(symbol);
      suggestions.push({ ...item, symbol });
      if (suggestions.length >= 10) break;
    }

    return suggestions;
  }, [searchMarketQuery.data, searchSegmentFilter, selectedSymbols]);

  const hasExactSuggestion = useMemo(
    () => searchSuggestions.some((item) => item.symbol === pendingSymbol),
    [pendingSymbol, searchSuggestions]
  );
  const showQuickAdd =
    pendingSymbol.length > 0 && !selectedSymbols.includes(pendingSymbol) && !hasExactSuggestion;

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
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span>Quick search</span>
              <select
                value={searchSegmentFilter}
                onChange={(event) => setSearchSegmentFilter(event.target.value)}
                className="h-7 rounded-full border border-slate-300/80 bg-white/85 px-2.5 text-[10px] font-semibold text-slate-700 outline-none transition-all duration-200 hover:border-sky-500/40 dark:border-slate-700/70 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-sky-400/45"
              >
                {["ALL", "COMEX", "COMMODITY", "CRYPTO", "CURRENCY", "EQUITY", "FNO", "INDICES"].map((segment) => (
                  <option key={segment} value={segment}>
                    {segment === "ALL" ? "All segments" : segment}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              value={symbolInput}
              onChange={(event) => setSymbolInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAddSymbol();
                }
              }}
              placeholder="Type script name like BTCUSDT or BANKNIFTY"
              className="h-11 border-slate-300/80 bg-white/90 pl-9 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-500/25 dark:border-slate-700/70 dark:bg-slate-950/65 dark:focus-visible:ring-sky-400/30"
            />
          </div>

          {(showQuickAdd || searchQuery.length >= 2) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {showQuickAdd ? (
                <button
                  type="button"
                  className="rounded-full border border-emerald-400/70 bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/80 hover:bg-emerald-500/20 hover:shadow-[0_10px_22px_-16px_rgba(16,185,129,0.95)] dark:border-emerald-500/55 dark:bg-emerald-500/14 dark:text-emerald-300 dark:hover:border-emerald-400/70 dark:hover:bg-emerald-500/22 dark:hover:shadow-[0_12px_22px_-15px_rgba(52,211,153,0.6)]"
                  onClick={() => void handleAddSymbol(pendingSymbol)}
                >
                  Add {pendingSymbol}
                </button>
              ) : null}

              {searchQuery.length >= 2 && searchMarketQuery.isFetching ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">Searching scripts...</span>
              ) : searchQuery.length >= 2 && searchSuggestions.length > 0 ? (
                searchSuggestions.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    className="rounded-full border border-slate-300/80 bg-white/90 px-3 py-1 text-[11px] text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/75 hover:bg-sky-500/10 hover:text-sky-700 hover:shadow-[0_12px_20px_-16px_rgba(59,130,246,0.95)] dark:border-slate-700/75 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-sky-500/70 dark:hover:text-sky-200 dark:hover:shadow-[0_12px_20px_-15px_rgba(56,189,248,0.55)]"
                    onClick={() => void handleAddSymbol(item.symbol)}
                  >
                    {getSuggestionLabel(item)}
                    {item.segment || item.exchange ? (
                      <span className="ml-1 text-[10px] opacity-70">
                        ({getSegmentBucketLabel(item.segment, item.exchange, item.symbol, item.name)})
                      </span>
                    ) : null}
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">No matching script found.</span>
              ) : null}
            </div>
          )}
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
