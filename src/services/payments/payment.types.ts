export type PaymentDetails = {
  _id?: string;
  upiId?: string;
  accountHolderName?: string;
  qrCodeUrl?: string;
};

export type VerifyPaymentPayload = {
  segmentCodes: string[];
  transactionId: string;
  screenshot: File;
};

export type VerifyPaymentResponse = {
  message?: string;
  subscription?: {
    _id?: string;
    status?: string;
  };
};
