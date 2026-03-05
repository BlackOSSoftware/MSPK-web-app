import { useQuery } from "@tanstack/react-query";
import { getEconomicCalendar } from "./economic-calendar.service";

export const ECONOMIC_CALENDAR_QUERY_KEY = ["economic-calendar"] as const;

export function useEconomicCalendarQuery(params?: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery({
    queryKey: [...ECONOMIC_CALENDAR_QUERY_KEY, params ?? {}],
    queryFn: () => getEconomicCalendar(params),
    enabled,
  });
}
