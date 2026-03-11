export type MarketSegment = {
  segment?: string;
  name?: string;
};

export type MarketSymbol = {
  _id?: string;
  symbol?: string;
  name?: string;
  segment?: string;
  exchange?: string;
  price?: number;
  change?: number;
  provider?: string | null;
};

export type MarketTicker = {
  symbol: string;
  name?: string;
  segment?: string;
  exchange?: string;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  bid?: number;
  ask?: number;
  prevClose?: number;
  points?: number;
  change?: number;
  isUp?: boolean;
  lotSize?: number;
  color?: string;
  provider?: string | null;
};

export type MarketSearchItem = {
  symbol?: string;
  name?: string;
  segment?: string;
  exchange?: string;
  provider?: string | null;
  lotSize?: number;
  tickSize?: number;
};

export type MarketUserWatchlistSummary = {
  id: string;
  name: string;
  isDefault?: boolean;
  isActive?: boolean;
  symbolCount?: number;
  symbols?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type MarketUserWatchlistsResponse = {
  activeWatchlistId: string;
  watchlists: MarketUserWatchlistSummary[];
};

export type MarketStats = Record<string, unknown>;
export type MarketTickers = MarketTicker[];
export type MarketSentiment = Record<string, unknown>;
export type MarketAnalysis = Record<string, unknown>;
export type MarketNews = Record<string, unknown>;

export type MarketLoginUrlResponse = {
  url?: string;
} & Record<string, unknown>;
