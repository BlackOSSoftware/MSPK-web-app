import { apiClient } from "@/services/http/client";
import type { CreateWatchlistPayload, ToggleWatchlistPayload, WatchlistItem } from "./watchlist.types";

export async function getWatchlists(): Promise<WatchlistItem[]> {
  const response = await apiClient.get<WatchlistItem[]>("/watchlist");
  return response.data;
}

export async function createWatchlist(payload: CreateWatchlistPayload): Promise<WatchlistItem> {
  const response = await apiClient.post<WatchlistItem>("/watchlist", payload);
  return response.data;
}

export async function deleteWatchlist(id: string): Promise<void> {
  await apiClient.delete(`/watchlist/${id}`);
}

export async function toggleWatchlistSignal(id: string, payload: ToggleWatchlistPayload): Promise<WatchlistItem> {
  const response = await apiClient.patch<WatchlistItem>(`/watchlist/${id}/toggle`, payload);
  return response.data;
}
