export type SignalTargets =
  | {
      target1?: number;
      target2?: number;
      target3?: number;
      t1?: number;
      t2?: number;
      t3?: number;
    }
  | number[];

export type SignalItem = {
  _id?: string;
  id?: string;
  uniqueId?: string;
  webhookId?: string;
  symbol?: string;
  segment?: string;
  status?: string;
  type?: string;
  timeframe?: string;
  entry?: number;
  entryPrice?: number;
  stoploss?: number;
  stopLoss?: number;
  targets?: SignalTargets;
  createdAt?: string;
  timestamp?: string;
  signalTime?: string;
  exitPrice?: number;
  totalPoints?: number;
  exitReason?: string;
  exitTime?: string;
  category?: string;
  isFree?: boolean;
  notes?: string;
};

export type SignalListResponse = {
  results?: SignalItem[];
  pagination?: {
    page?: number;
    limit?: number;
    totalPages?: number;
    totalResults?: number;
  };
  stats?: {
    totalSignals?: number;
    activeSignals?: number;
    closedSignals?: number;
    targetHit?: number;
    stoplossHit?: number;
    successRate?: number;
  };
};

export type SignalAnalysisResponse = {
  symbol?: string;
  analysis?: Record<
    string,
    {
      timeframe?: string;
      trend?: string;
      signalType?: string;
      price?: number;
      support?: number;
      resistance?: number;
      isStrong?: boolean;
    }
  >;
  volatility?: {
    atr?: number;
    expectedHigh?: number;
    expectedLow?: number;
    buyPrice?: number;
    sellPrice?: number;
  };
  timestamp?: string;
};
