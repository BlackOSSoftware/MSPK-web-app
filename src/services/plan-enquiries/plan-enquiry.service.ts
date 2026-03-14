import { apiClient } from "@/services/http/client";

export type CreatePlanEnquiryPayload = {
  planId?: string;
  planName: string;
  planPriceLabel?: string;
  planDurationLabel?: string;
  planSegment?: string;
  source: "dashboard" | "public_website";
  sourcePage?: string;
  pageUrl?: string;
  referrerUrl?: string;
  visitorId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  clientId?: string;
  googleAccountEmail?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  deviceType?: string;
  platform?: string;
  language?: string;
  userAgent?: string;
};

export async function createPlanEnquiry(payload: CreatePlanEnquiryPayload) {
  const response = await apiClient.post("/enquiries/plans", payload);
  return response.data;
}
