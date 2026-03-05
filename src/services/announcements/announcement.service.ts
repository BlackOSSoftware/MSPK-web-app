import { apiClient } from "@/services/http/client";
import type { AnnouncementItem, AnnouncementListResponse } from "./announcement.types";

export async function getAnnouncements(params?: Record<string, string | number | boolean | undefined>): Promise<AnnouncementListResponse> {
  const response = await apiClient.get<AnnouncementListResponse>("/announcements", { params });
  return response.data;
}

export async function getAnnouncementById(id: string): Promise<AnnouncementItem> {
  const response = await apiClient.get<AnnouncementItem>(`/announcements/${id}`);
  return response.data;
}
