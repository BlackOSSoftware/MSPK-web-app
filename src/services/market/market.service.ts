import { apiClient } from "@/services/http/client";
import type {
  MarketAnalysis,
  MarketLoginUrlResponse,
  MarketNews,
  MarketSegment,
  MarketSentiment,
  MarketStats,
  MarketSymbol,
  MarketSearchItem,
  MarketTickers,
} from "./market.types";

export async function getMarketSegments(): Promise<MarketSegment[]> {
  const response = await apiClient.get<MarketSegment[]>("/market/segments");
  return response.data;
}

export async function getMarketSymbols(params?: Record<string, string | number | boolean | undefined>): Promise<MarketSymbol[]> {
  const response = await apiClient.get<MarketSymbol[]>("/market/symbols", { params });
  return response.data;
}

export async function getMarketHistory(params: Record<string, string | number>): Promise<Record<string, unknown>> {
  const response = await apiClient.get<Record<string, unknown>>("/market/history", { params });
  return response.data;
}

export async function searchMarket(params: Record<string, string | number>): Promise<MarketSearchItem[]> {
  const response = await apiClient.get<MarketSearchItem[]>("/market/search", { params });
  return response.data;
}

export async function getMarketLoginKiteUrl(): Promise<MarketLoginUrlResponse> {
  const response = await apiClient.get<MarketLoginUrlResponse>("/market/login/kite/url");
  return response.data;
}

export async function postMarketLoginKite(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await apiClient.post<Record<string, unknown>>("/market/login/kite", payload);
  return response.data;
}

export async function getMarketLoginKite(): Promise<Record<string, unknown>> {
  const response = await apiClient.get<Record<string, unknown>>("/market/login/kite");
  return response.data;
}

export async function getMarketStats(): Promise<MarketStats> {
  const response = await apiClient.get<MarketStats>("/market/stats");
  return response.data;
}

export async function getMarketTickers(): Promise<MarketTickers> {
  const response = await apiClient.get<MarketTickers>("/market/tickers");
  return response.data;
}

export async function getMarketUserWatchlist(): Promise<MarketTickers> {
  const response = await apiClient.get<MarketTickers>("/market/watchlist");
  return response.data;
}

export async function addMarketUserWatchlist(symbol: string): Promise<{ symbols: string[] }> {
  const response = await apiClient.post<{ symbols: string[] }>("/market/watchlist/add", { symbol });
  return response.data;
}

export async function removeMarketUserWatchlist(symbol: string): Promise<{ symbols: string[] }> {
  const response = await apiClient.post<{ symbols: string[] }>("/market/watchlist/remove", { symbol });
  return response.data;
}

export async function reorderMarketUserWatchlist(symbols: string[]): Promise<{ symbols: string[] }> {
  const response = await apiClient.post<{ symbols: string[] }>("/market/watchlist/reorder", { symbols });
  return response.data;
}

export async function getMarketSentiment(): Promise<MarketSentiment> {
  const response = await apiClient.get<MarketSentiment>("/market/sentiment");
  return response.data;
}

export async function getMarketAnalysis(symbol: string): Promise<MarketAnalysis> {
  const response = await apiClient.get<MarketAnalysis>(`/market/analysis/${symbol}`);
  return response.data;
}

export async function getMarketNews(symbol: string): Promise<MarketNews> {
  const response = await apiClient.get<MarketNews>(`/market/news/${symbol}`);
  return response.data;
}
