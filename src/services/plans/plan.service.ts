import { apiClient } from "@/services/http/client";
import type { Plan } from "./plan.types";

export async function getPlans(): Promise<Plan[]> {
  const response = await apiClient.get<Plan[]>("/plans");
  return response.data;
}

export async function getPlanById(planId: string): Promise<Plan> {
  const response = await apiClient.get<Plan>(`/plans/${planId}`);
  return response.data;
}
