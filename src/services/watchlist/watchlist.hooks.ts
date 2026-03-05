import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWatchlist, deleteWatchlist, getWatchlists, toggleWatchlistSignal } from "./watchlist.service";
import type { CreateWatchlistPayload, ToggleWatchlistPayload } from "./watchlist.types";

export const WATCHLISTS_QUERY_KEY = ["watchlist"] as const;

export function useWatchlistsQuery(enabled = true) {
  return useQuery({
    queryKey: WATCHLISTS_QUERY_KEY,
    queryFn: getWatchlists,
    enabled,
  });
}

export function useCreateWatchlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWatchlistPayload) => createWatchlist(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_QUERY_KEY });
    },
  });
}

export function useDeleteWatchlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_QUERY_KEY });
    },
  });
}

export function useToggleWatchlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ToggleWatchlistPayload }) =>
      toggleWatchlistSignal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLISTS_QUERY_KEY });
    },
  });
}
