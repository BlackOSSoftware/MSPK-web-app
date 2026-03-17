import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getEconomicCalendar } from "./economic-calendar.service";

export const ECONOMIC_CALENDAR_QUERY_KEY = ["economic-calendar"] as const;

export function useEconomicCalendarQuery(params?: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery({
    queryKey: [...ECONOMIC_CALENDAR_QUERY_KEY, params ?? {}],
    queryFn: () => getEconomicCalendar(params),
    enabled,
  });
}

export function useInfiniteEconomicCalendarQuery(
  params?: Record<string, string | number | boolean | undefined>,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: [...ECONOMIC_CALENDAR_QUERY_KEY, "infinite", params ?? {}],
    queryFn: ({ pageParam = 1 }) =>
      getEconomicCalendar({
        ...(params ?? {}),
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination?.hasNextPage) return undefined;
      return (pagination.page ?? 1) + 1;
    },
    enabled,
  });
}
