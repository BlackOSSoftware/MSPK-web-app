import { useQuery } from "@tanstack/react-query";
import { getSegments } from "./segment.service";

export const SEGMENTS_QUERY_KEY = ["segments"] as const;

export function useSegmentsQuery(enabled = true) {
  return useQuery({
    queryKey: SEGMENTS_QUERY_KEY,
    queryFn: getSegments,
    enabled,
  });
}
