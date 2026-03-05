export type WatchlistItem = {
  _id: string;
  user?: string;
  name: string;
  signals?: string[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateWatchlistPayload = {
  name: string;
};

export type ToggleWatchlistPayload = {
  signalId: string;
};
