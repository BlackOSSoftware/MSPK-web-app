export type SubscribePurchasePayload = {
  segments: string[];
  planType: string;
};

export type SubscribeStatus = {
  hasActiveSubscription?: boolean;
  subscription?: {
    _id?: string;
    status?: string;
  };
};

export type HasAccessResponse = {
  hasAccess?: boolean;
  segment?: string;
} & Record<string, unknown>;

export type PurchaseSubscriptionResponse = {
  _id?: string;
  user?: string;
  segments?: string[];
  planType?: string;
  status?: string;
};
