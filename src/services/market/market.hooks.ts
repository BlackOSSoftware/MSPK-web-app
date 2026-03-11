import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  getMarketAnalysis,
  getMarketHistory,
  getMarketLoginKite,
  getMarketLoginKiteUrl,
  getMarketNews,
  getMarketSegments,
  getMarketSentiment,
  getMarketStats,
  getMarketSymbols,
  getMarketTickers,
  getMarketUserWatchlist,
  getMarketUserWatchlists,
  createMarketUserWatchlist,
  updateMarketUserWatchlist,
  deleteMarketUserWatchlist,
  addMarketUserWatchlist,
  postMarketLoginKite,
  reorderMarketUserWatchlist,
  searchMarket,
  removeMarketUserWatchlist,
} from "./market.service";

export const MARKET_QUERY_KEY = ["market"] as const;
export const USER_MARKET_WATCHLISTS_QUERY_KEY = [...MARKET_QUERY_KEY, "user-watchlists"] as const;

export function useMarketSegmentsQuery(enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "segments"],
    queryFn: getMarketSegments,
    enabled,
  });
}

export function useMarketSymbolsQuery(params?: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "symbols", params ?? {}],
    queryFn: () => getMarketSymbols(params),
    enabled,
  });
}

export function useMarketSearchQuery(params: Record<string, string | number>, enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "search", params],
    queryFn: () => searchMarket(params),
    enabled,
  });
}

export function useMarketHistoryQuery(params: Record<string, string | number>, enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "history", params],
    queryFn: () => getMarketHistory(params),
    enabled,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

export function useMarketLoginKiteUrlQuery(enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "kite", "url"],
    queryFn: getMarketLoginKiteUrl,
    enabled,
  });
}

export function useMarketLoginKiteQuery(enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "kite", "status"],
    queryFn: getMarketLoginKite,
    enabled,
  });
}

export function useMarketStatsQuery(enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "stats"],
    queryFn: getMarketStats,
    enabled,
  });
}

export function useMarketTickersQuery(
  enabled = true,
  options?: {
    refetchInterval?: number;
    staleTime?: number;
  },
) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "tickers"],
    queryFn: getMarketTickers,
    enabled,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime,
  });
}

export function useMarketUserWatchlistQuery(
  enabled = true,
  options?: {
    refetchInterval?: number;
    staleTime?: number;
  },
  watchlistId?: string,
) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "user-watchlist", watchlistId ?? "active"],
    queryFn: () => getMarketUserWatchlist(watchlistId),
    enabled,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime,
  });
}

export function useMarketUserWatchlistAddMutation() {
  return useMutation({
    mutationFn: (input: string | { symbol: string; watchlistId?: string }) => {
      if (typeof input === "string") {
        return addMarketUserWatchlist(input);
      }
      return addMarketUserWatchlist(input.symbol, input.watchlistId);
    },
  });
}

export function useMarketUserWatchlistRemoveMutation() {
  return useMutation({
    mutationFn: (input: string | { symbol: string; watchlistId?: string }) => {
      if (typeof input === "string") {
        return removeMarketUserWatchlist(input);
      }
      return removeMarketUserWatchlist(input.symbol, input.watchlistId);
    },
  });
}

export function useMarketUserWatchlistReorderMutation() {
  return useMutation({
    mutationFn: (input: string[] | { symbols: string[]; watchlistId?: string }) => {
      if (Array.isArray(input)) {
        return reorderMarketUserWatchlist(input);
      }
      return reorderMarketUserWatchlist(input.symbols, input.watchlistId);
    },
  });
}

export function useMarketUserWatchlistsQuery(enabled = true) {
  return useQuery({
    queryKey: USER_MARKET_WATCHLISTS_QUERY_KEY,
    queryFn: getMarketUserWatchlists,
    enabled,
    staleTime: 15_000,
  });
}

export function useMarketUserWatchlistCreateMutation() {
  return useMutation({
    mutationFn: (payload: { name: string; setActive?: boolean }) =>
      createMarketUserWatchlist(payload),
  });
}

export function useMarketUserWatchlistUpdateMutation() {
  return useMutation({
    mutationFn: (payload: { id: string; name?: string; setActive?: boolean }) =>
      updateMarketUserWatchlist(payload.id, {
        name: payload.name,
        setActive: payload.setActive,
      }),
  });
}

export function useMarketUserWatchlistDeleteMutation() {
  return useMutation({
    mutationFn: (id: string) => deleteMarketUserWatchlist(id),
  });
}

export function useMarketSentimentQuery(enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "sentiment"],
    queryFn: getMarketSentiment,
    enabled,
  });
}

export function useMarketAnalysisQuery(symbol: string, enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "analysis", symbol],
    queryFn: () => getMarketAnalysis(symbol),
    enabled: enabled && Boolean(symbol),
  });
}

export function useMarketNewsQuery(symbol: string, enabled = true) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "news", symbol],
    queryFn: () => getMarketNews(symbol),
    enabled: enabled && Boolean(symbol),
  });
}

export function useMarketLoginKiteMutation() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => postMarketLoginKite(payload),
  });
}
