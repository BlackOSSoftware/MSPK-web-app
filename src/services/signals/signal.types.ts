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
  originalSymbol?: string;
  sourceSymbol?: string;
  symbolName?: string;
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
  updatedAt?: string;
  timestamp?: string;
  signalTime?: string;
  displaySignalTime?: string;
  exitPrice?: number;
  totalPoints?: number;
  exitReason?: string;
  exitTime?: string;
  displayExitTime?: string;
  category?: string;
  isFree?: boolean;
  notes?: string;
};

export type SignalSelectedScript = {
  symbol: string;
  name?: string;
  segment?: string;
  segmentGroup?: string;
  exchange?: string;
  provider?: string | null;
  isAdded?: boolean;
  signalActivityState?: "ongoing" | "inactive" | "none";
  ongoingSignalCount?: number;
  latestSignalStatus?: string | null;
  latestSignalAt?: string | null;
};

export type SignalSelectedScriptsResponse = {
  symbols?: string[];
  scripts?: SignalSelectedScript[];
};

export type SignalListResponse = {
  access?: {
    mode?: string;
    scope?: string;
    tokenProvided?: boolean;
    planStatus?: string | null;
    planName?: string | null;
    planExpiry?: string | null;
    selectedSymbolCount?: number;
    signalVisibleFrom?: string | null;
    message?: string | null;
  };
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
  periodStats?: {
    todaySignals?: number;
    weeklySignals?: number;
    monthlySignals?: number;
    planSignals?: number;
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
