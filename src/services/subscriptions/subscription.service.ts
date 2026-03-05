import { apiClient } from "@/services/http/client";
import type {
  HasAccessResponse,
  PurchaseSubscriptionResponse,
  SubscribePurchasePayload,
  SubscribeStatus,
} from "./subscription.types";

export async function purchaseSubscription(payload: SubscribePurchasePayload): Promise<PurchaseSubscriptionResponse> {
  const response = await apiClient.post<PurchaseSubscriptionResponse>("/subscribe/purchase", payload);
  return response.data;
}

export async function getSubscriptionStatus(): Promise<SubscribeStatus> {
  const response = await apiClient.get<SubscribeStatus>("/subscribe/status");
  return response.data;
}

export async function getHasAccess(segment: string): Promise<HasAccessResponse> {
  const response = await apiClient.get<HasAccessResponse>(`/subscribe/has-access/${segment}`);
  return response.data;
}
