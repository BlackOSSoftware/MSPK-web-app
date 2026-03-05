import { useQuery } from "@tanstack/react-query";
import { getPlanById, getPlans } from "./plan.service";

export const PLANS_QUERY_KEY = ["plans"] as const;
export const PLAN_QUERY_KEY = ["plans", "detail"] as const;

export function usePlansQuery(enabled = true) {
  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: getPlans,
    enabled,
  });
}

export function usePlanQuery(planId: string, enabled = true) {
  return useQuery({
    queryKey: [...PLAN_QUERY_KEY, planId],
    queryFn: () => getPlanById(planId),
    enabled: enabled && Boolean(planId),
  });
}
