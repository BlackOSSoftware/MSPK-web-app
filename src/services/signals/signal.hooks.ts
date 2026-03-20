import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addSignalSelectedScript,
  getSignalAnalysis,
  getSignalById,
  getSignalSelectedScripts,
  getSignals,
  removeSignalSelectedScript,
} from "./signal.service";

export const SIGNALS_QUERY_KEY = ["signals"] as const;
export const SIGNAL_SELECTED_SCRIPTS_QUERY_KEY = [...SIGNALS_QUERY_KEY, "selected-scripts"] as const;

export function useSignalsQuery(params?: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery({
    queryKey: [...SIGNALS_QUERY_KEY, params ?? {}],
    queryFn: () => getSignals(params),
    enabled,
    staleTime: 5_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: enabled ? 15_000 : false,
    refetchIntervalInBackground: true,
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

export function useSignalSelectedScriptsQuery(enabled = true) {
  return useQuery({
    queryKey: SIGNAL_SELECTED_SCRIPTS_QUERY_KEY,
    queryFn: getSignalSelectedScripts,
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useSignalSelectedScriptAddMutation() {
  return useMutation({
    mutationFn: (symbol: string) => addSignalSelectedScript(symbol),
  });
}

export function useSignalSelectedScriptRemoveMutation() {
  return useMutation({
    mutationFn: (symbol: string) => removeSignalSelectedScript(symbol),
  });
}
