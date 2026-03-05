export const MOCK_SIGNALS = [
    {
      id: '1',
      symbol: 'NIFTY 50',
      type: 'BUY',
      entry: 21500,
      stopLoss: 21450,
      targets: [21600, 21700],
      status: 'Open',
      segment: 'Equity',
      isFree: true,
      timestamp: new Date().toISOString(),
      pnl: 0
    },
    {
      id: '2',
      symbol: 'BANKNIFTY',
      type: 'SELL',
      entry: 48000,
      stopLoss: 48100,
      targets: [47800, 47500],
      status: 'Closed', // Hit Target
      segment: 'Equity',
      isFree: true,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      pnl: 200 // Points captured
    },
    {
      id: '3',
      symbol: 'XAUUSD',
      type: 'BUY',
      entry: 2040,
      stopLoss: 2035,
      targets: [2050, 2060],
      status: 'Open',
      segment: 'Commodity',
      isFree: false, // Premium
      timestamp: new Date().toISOString(),
      pnl: 0
    },
    {
      id: '4',
      symbol: 'BTCUSD',
      type: 'BUY',
      entry: 45000,
      stopLoss: 44000,
      targets: [48000, 50000],
      status: 'Closed',
      segment: 'Crypto',
      isFree: false,
      timestamp: new Date(Date.now() - 100000000).toISOString(),
      pnl: 3000
    },
    {
      id: '5',
      symbol: 'RELIANCE',
      type: 'BUY',
      entry: 2600,
      stopLoss: 2580,
      targets: [2650],
      status: 'Closed',
      segment: 'Equity',
      isFree: true,
      timestamp: new Date(Date.now() - 200000000).toISOString(),
      pnl: 50
    }
  ];
  
  export const MOCK_PLANS = [
    {
      id: 'p1',
      name: 'Starter',
      description: 'Perfect for beginners starting their journey.',
      price: 2999,
      duration: 30, // days
      segment: 'Equity',
      features: ['Daily 2-3 Signals', 'Basic Support', 'Market News'],
      isPopular: false
    },
    {
      id: 'p2',
      name: 'Pro Trader',
      description: 'For serious traders who want consistent profits.',
      price: 7999,
      duration: 90, // days
      segment: 'All',
      features: ['Daily 5-8 Signals', 'Priority Support', 'F&O Strategies', 'Crypto Access'],
      isPopular: true
    },
    {
      id: 'p3',
      name: 'Elite',
      description: 'Full access to everything we offer.',
      price: 14999,
      duration: 180, // days
      segment: 'All + Algo',
      features: ['Unlimited Signals', '1-on-1 Mentorship', 'Algo Trading Access', 'Capital Protection Strategy'],
      isPopular: false
    }
  ];
  
  export const MOCK_STATS = [
    { label: 'Active Users', value: '10K+' },
    { label: 'Total Profit Generated', value: '₹50Cr+' },
    { label: 'Accuracy', value: '92%' },
    { label: 'Signals/Month', value: '500+' }
  ];
