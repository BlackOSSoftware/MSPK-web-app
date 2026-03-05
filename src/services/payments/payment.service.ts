import { apiClient } from "@/services/http/client";
import type { PaymentDetails, VerifyPaymentPayload, VerifyPaymentResponse } from "./payment.types";

export async function getPaymentDetails(): Promise<PaymentDetails> {
  const response = await apiClient.get<PaymentDetails>("/payments/details");
  return response.data;
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
  const formData = new FormData();
  formData.append("segmentCodes", JSON.stringify(payload.segmentCodes));
  formData.append("transactionId", payload.transactionId);
  formData.append("screenshot", payload.screenshot);

  const response = await apiClient.post<VerifyPaymentResponse>("/payments/verify-payment", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
