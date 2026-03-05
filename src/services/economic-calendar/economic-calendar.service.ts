import { apiClient } from "@/services/http/client";
import type { EconomicCalendarListResponse } from "./economic-calendar.types";

export async function getEconomicCalendar(
  params?: Record<string, string | number | boolean | undefined>,
): Promise<EconomicCalendarListResponse> {
  const response = await apiClient.get<EconomicCalendarListResponse>("/economic-calendar", { params });
  return response.data;
}
