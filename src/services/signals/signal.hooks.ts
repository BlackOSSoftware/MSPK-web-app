import { useQuery } from "@tanstack/react-query";
import { getSignalAnalysis, getSignalById, getSignals } from "./signal.service";

export const SIGNALS_QUERY_KEY = ["signals"] as const;

export function useSignalsQuery(params?: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery({
    queryKey: [...SIGNALS_QUERY_KEY, params ?? {}],
    queryFn: () => getSignals(params),
    enabled,
  });
}

export function useSignalQuery(signalId: string, enabled = true) {
  return useQuery({
    queryKey: [...SIGNALS_QUERY_KEY, signalId],
    queryFn: () => getSignalById(signalId),
    enabled: enabled && Boolean(signalId),
  });
}

export function useSignalAnalysisQuery(signalId: string, enabled = true) {
  return useQuery({
    queryKey: [...SIGNALS_QUERY_KEY, signalId, "analysis"],
    queryFn: () => getSignalAnalysis(signalId),
    enabled: enabled && Boolean(signalId),
  });
}
