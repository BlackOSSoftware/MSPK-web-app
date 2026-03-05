import { useQuery } from "@tanstack/react-query";
import { getAnnouncementById, getAnnouncements } from "./announcement.service";

export const ANNOUNCEMENTS_QUERY_KEY = ["announcements"] as const;

export function useAnnouncementsQuery(params?: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery({
    queryKey: [...ANNOUNCEMENTS_QUERY_KEY, params ?? {}],
    queryFn: () => getAnnouncements(params),
    enabled,
  });
}

export function useAnnouncementQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: [...ANNOUNCEMENTS_QUERY_KEY, id],
    queryFn: () => getAnnouncementById(id),
    enabled: enabled && Boolean(id),
  });
}
