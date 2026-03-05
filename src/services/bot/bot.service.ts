import { apiClient } from "@/services/http/client";

export async function getBotStatus(): Promise<{ status?: string }> {
  const response = await apiClient.get<{ status?: string }>("/bot/status");
  return response.data;
}
