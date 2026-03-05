import { apiClient } from "@/services/http/client";
import type { Segment } from "./segment.types";

export async function getSegments(): Promise<Segment[]> {
  const response = await apiClient.get<Segment[]>("/segments");
  return response.data;
}
