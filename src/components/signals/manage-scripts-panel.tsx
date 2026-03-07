"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MARKET_QUERY_KEY,
  useMarketSearchQuery,
  useMarketUserWatchlistAddMutation,
  useMarketUserWatchlistQuery,
  useMarketUserWatchlistRemoveMutation,
} from "@/services/market/market.hooks";
import type { MarketSearchItem } from "@/services/market/market.types";
import { Eye, Plus, Search, Trash2 } from "lucide-react";

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

type ManageScriptsPanelProps = {
  className?: string;
};

export function ManageScriptsPanel({ className }: ManageScriptsPanelProps) {
  const queryClient = useQueryClient();
  const [symbolInput, setSymbolInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);

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
  const scriptsBySegment = useMemo(() => {
    const groups = new Map<string, typeof selectedScripts>();
    selectedScripts.forEach((item) => {
      const key = item.segment || item.exchange || "OTHER";
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    });

    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [selectedScripts]);

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
      used.add(symbol);
      suggestions.push({ ...item, symbol });
      if (suggestions.length >= 10) break;
    }

    return suggestions;
  }, [searchMarketQuery.data, selectedSymbols]);

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
              Selected scripts ke liye signals unlimited mil sakte hain. Limit sirf itni hai ki har segment me maximum 10 scripts add kar sakte ho.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200">
            {selectedScripts.length} script{selectedScripts.length === 1 ? "" : "s"} selected
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300/75 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-950/45">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
              <Plus className="h-3.5 w-3.5" />
              Add Script
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Quick search</span>
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
              className="h-11 border-slate-300/80 bg-white/90 pl-9 dark:border-slate-700/70 dark:bg-slate-950/65"
            />
          </div>

          {(showQuickAdd || searchQuery.length >= 2) && (
            <div className="mt-3 flex flex-wrap gap-2">
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
                <span className="text-xs text-slate-500 dark:text-slate-400">Searching scripts...</span>
              ) : searchQuery.length >= 2 && searchSuggestions.length > 0 ? (
                searchSuggestions.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    className="rounded-full border border-slate-300/80 bg-white/90 px-3 py-1 text-[11px] text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/75 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-700/75 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:border-sky-500/70 dark:hover:text-sky-200"
                    onClick={() => void handleAddSymbol(item.symbol)}
                  >
                    {getSuggestionLabel(item)}
                    {item.segment ? (
                      <span className="ml-1 text-[10px] opacity-70">({item.segment})</span>
                    ) : null}
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">No matching script found.</span>
              ) : null}
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {scriptsBySegment.map(([segment, scripts]) => (
            <div
              key={segment}
              className="rounded-2xl border border-slate-300/75 bg-white/80 p-4 dark:border-slate-700/70 dark:bg-slate-950/45"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Segment
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {segment}
                  </div>
                </div>
                <div className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200">
                  {scripts.length}/10
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {scripts.map((item) => (
                  <span
                    key={item.symbol}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
                  >
                    <span>{item.symbol}</span>
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-rose-600 transition-colors hover:bg-rose-500/12 hover:text-rose-700 dark:bg-slate-950/55 dark:text-rose-300 dark:hover:bg-rose-500/16 dark:hover:text-rose-200"
                      onClick={() => void handleRemoveSymbol(item.symbol)}
                      disabled={removeMutation.isPending && removingSymbol === item.symbol}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {watchlistQuery.isLoading ? (
          <div className="rounded-2xl border border-slate-300/75 bg-white/80 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/45 dark:text-slate-400">
            Loading selected scripts...
          </div>
        ) : selectedScripts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-500/35 bg-amber-500/10 p-6 text-sm text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
            Abhi koi script selected nahi hai. Upar search karke scripts add karo. Signals par koi count limit nahi hai, limit sirf 10 scripts per segment ki hai.
          </div>
        ) : null}
      </div>
    </section>
  );
}
