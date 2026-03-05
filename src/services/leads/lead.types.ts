export type CreateLeadPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  city?: string;
  segment?: string;
  plan?: string;
  verificationToken: string;
  paymentScreenshot?: File | null;
};

export type LeadItem = Record<string, unknown>;
