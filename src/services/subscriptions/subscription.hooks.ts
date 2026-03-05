import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHasAccess, getSubscriptionStatus, purchaseSubscription } from "./subscription.service";
import type { SubscribePurchasePayload } from "./subscription.types";

export const SUBSCRIPTION_STATUS_QUERY_KEY = ["subscription", "status"] as const;
export const SUBSCRIPTION_ACCESS_QUERY_KEY = ["subscription", "access"] as const;

export function useSubscriptionStatusQuery(enabled = true) {
  return useQuery({
    queryKey: SUBSCRIPTION_STATUS_QUERY_KEY,
    queryFn: getSubscriptionStatus,
    enabled,
  });
}

export function useHasAccessQuery(segment: string, enabled = true) {
  return useQuery({
    queryKey: [...SUBSCRIPTION_ACCESS_QUERY_KEY, segment],
    queryFn: () => getHasAccess(segment),
    enabled: enabled && Boolean(segment),
  });
}

export function usePurchaseSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubscribePurchasePayload) => purchaseSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_STATUS_QUERY_KEY });
    },
  });
}
