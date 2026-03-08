import { useMutation, useQuery } from "@tanstack/react-query";
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
  addMarketUserWatchlist,
  postMarketLoginKite,
  reorderMarketUserWatchlist,
  searchMarket,
  removeMarketUserWatchlist,
} from "./market.service";

export const MARKET_QUERY_KEY = ["market"] as const;

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
) {
  return useQuery({
    queryKey: [...MARKET_QUERY_KEY, "user-watchlist"],
    queryFn: getMarketUserWatchlist,
    enabled,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime,
  });
}

export function useMarketUserWatchlistAddMutation() {
  return useMutation({
    mutationFn: (symbol: string) => addMarketUserWatchlist(symbol),
  });
}

export function useMarketUserWatchlistRemoveMutation() {
  return useMutation({
    mutationFn: (symbol: string) => removeMarketUserWatchlist(symbol),
  });
}

export function useMarketUserWatchlistReorderMutation() {
  return useMutation({
    mutationFn: (symbols: string[]) => reorderMarketUserWatchlist(symbols),
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
