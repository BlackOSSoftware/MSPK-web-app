import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPaymentDetails, verifyPayment } from "./payment.service";
import type { VerifyPaymentPayload } from "./payment.types";
import { SUBSCRIPTION_STATUS_QUERY_KEY } from "@/services/subscriptions/subscription.hooks";

export const PAYMENT_DETAILS_QUERY_KEY = ["payments", "details"] as const;

export function usePaymentDetailsQuery(enabled = true) {
  return useQuery({
    queryKey: PAYMENT_DETAILS_QUERY_KEY,
    queryFn: getPaymentDetails,
    enabled,
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) => verifyPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_DETAILS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_STATUS_QUERY_KEY });
    },
  });
}
