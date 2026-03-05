import { apiClient } from "@/services/http/client";
import type { CreateLeadPayload, LeadItem } from "./lead.types";

export async function createLead(payload: CreateLeadPayload): Promise<LeadItem> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("email", payload.email);
  formData.append("phone", payload.phone);
  formData.append("password", payload.password);
  if (payload.city) formData.append("city", payload.city);
  if (payload.segment) formData.append("segment", payload.segment);
  if (payload.plan) formData.append("plan", payload.plan);
  formData.append("verificationToken", payload.verificationToken);
  if (payload.paymentScreenshot) formData.append("paymentScreenshot", payload.paymentScreenshot);

  const response = await apiClient.post<LeadItem>("/leads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
