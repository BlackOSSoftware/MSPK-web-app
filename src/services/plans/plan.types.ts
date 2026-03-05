export type Plan = {
  _id: string;
  name: string;
  description?: string;
  durationDays?: number;
  features?: string[];
  isActive?: boolean;
  isDemo?: boolean;
  permissions?: string[];
  price?: number;
  segment?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};
