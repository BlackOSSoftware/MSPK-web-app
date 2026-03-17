import { apiClient } from "@/services/http/client";
import type {
  SignalAnalysisResponse,
  SignalItem,
  SignalListResponse,
  SignalSelectedScript,
  SignalSelectedScriptsResponse,
} from "./signal.types";

export async function getSignals(params?: Record<string, string | number | boolean | undefined>): Promise<SignalListResponse> {
  const response = await apiClient.get<SignalListResponse>("/signals", { params });
  return response.data;
}

export async function getSignalById(signalId: string): Promise<SignalItem> {
  const response = await apiClient.get<SignalItem>(`/signals/${signalId}`);
  return response.data;
}

export async function getSignalAnalysis(signalId: string): Promise<SignalAnalysisResponse> {
  const response = await apiClient.get<SignalAnalysisResponse>(`/signals/${signalId}/analysis`);
  return response.data;
}

export async function getSignalSelectedScripts(): Promise<SignalSelectedScript[]> {
  const response = await apiClient.get<SignalSelectedScript[]>("/signals/scripts");
  return response.data;
}

export async function addSignalSelectedScript(symbol: string): Promise<SignalSelectedScriptsResponse> {
  const response = await apiClient.post<SignalSelectedScriptsResponse>("/signals/scripts/add", { symbol });
  return response.data;
}

export async function removeSignalSelectedScript(symbol: string): Promise<SignalSelectedScriptsResponse> {
  const response = await apiClient.post<SignalSelectedScriptsResponse>("/signals/scripts/remove", { symbol });
  return response.data;
}
