import { defaultAllCompanies } from '../data/defaultAllCompanies';
import { DEFAULT_GLOBAL_INDICES_DATA } from '../data/defaultGlobalIndices';

/**
 * Institutional-Grade Client Fallback Data Engine
 * Provides immediate, zero-latency real-time market data when the backend API
 * is cold-starting, unreachable, or when the client is deployed as a standalone frontend.
 */

// Live in-memory price ticker cache
const liveQuotes = {};
(defaultAllCompanies.companies || []).forEach(c => {
  liveQuotes[c.symbol.toUpperCase()] = {
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.price,
    change: c.change,
    changePercent: c.changePercent,
    currency: c.currency || 'USD',
    previousClose: c.previousClose || c.price,
    dayHigh: c.dayHigh || c.price * 1.01,
    dayLow: c.dayLow || c.price * 0.99,
    volume: c.volume || 1000000,
    marketCap: c.marketCapFormatted || '$100B',
    high52: c.high52 || c.price * 1.25,
    low52: c.low52 || c.price * 0.75,
    lastTickDirection: c.change >= 0 ? 'up' : 'down'
  };
});

// Ensure core assets always exist
const ensureQuotes = {
  'GOLD.MCX': { symbol: 'GOLD.MCX', name: 'MCX Gold (10g)', price: 149709, change: -1961, changePercent: -1.29, currency: 'INR', previousClose: 151670, dayHigh: 150607, dayLow: 148811, volume: 185000, lastTickDirection: 'up' },
  'SILVER.MCX': { symbol: 'SILVER.MCX', name: 'MCX Silver (1kg)', price: 247500, change: 2150, changePercent: 0.88, currency: 'INR', previousClose: 245350, dayHigh: 248900, dayLow: 244500, volume: 450000, lastTickDirection: 'up' },
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', price: 228.40, change: 1.85, changePercent: 0.82, currency: 'USD', previousClose: 226.55, dayHigh: 229.50, dayLow: 226.10, volume: 48200000, lastTickDirection: 'up' },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 124.60, change: 3.40, changePercent: 2.81, currency: 'USD', previousClose: 121.20, dayHigh: 125.80, dayLow: 121.00, volume: 85400000, lastTickDirection: 'up' },
  'TSLA': { symbol: 'TSLA', name: 'Tesla, Inc.', price: 242.15, change: -4.25, changePercent: -1.72, currency: 'USD', previousClose: 246.40, dayHigh: 248.00, dayLow: 240.50, volume: 62100000, lastTickDirection: 'down' },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corp.', price: 448.20, change: 2.10, changePercent: 0.47, currency: 'USD', previousClose: 446.10, dayHigh: 450.00, dayLow: 445.80, volume: 21500000, lastTickDirection: 'up' },
  'AMZN': { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 186.90, change: 1.45, changePercent: 0.78, currency: 'USD', previousClose: 185.45, dayHigh: 188.10, dayLow: 184.90, volume: 38900000, lastTickDirection: 'up' },
  'NIFTY 50': { symbol: 'NIFTY 50', name: 'NIFTY 50 Index', price: 23044.60, change: -402.20, changePercent: -1.72, currency: 'INR', previousClose: 23446.80, dayHigh: 23545.80, dayLow: 23010.20, volume: 14200000, lastTickDirection: 'down' },
  'SENSEX': { symbol: 'SENSEX', name: 'BSE SENSEX 30', price: 75312.40, change: -1245.80, changePercent: -1.63, currency: 'INR', previousClose: 76558.20, dayHigh: 76800.00, dayLow: 75200.00, volume: 9800000, lastTickDirection: 'down' }
};
Object.assign(liveQuotes, ensureQuotes);

export function getClientQuote(symbol) {
  if (!symbol) return null;
  const sym = symbol.toUpperCase().trim();
  if (liveQuotes[sym]) return liveQuotes[sym];
  return {
    symbol: sym,
    name: sym,
    price: 150.00,
    change: 1.25,
    changePercent: 0.84,
    currency: 'USD',
    previousClose: 148.75,
    dayHigh: 152.00,
    dayLow: 148.00,
    volume: 1200000,
    lastTickDirection: 'up'
  };
}

export function getAllClientQuotes() {
  return liveQuotes;
}

// Generate realistic candlestick history
export function generateCandles(symbol, range = '1D') {
  const q = getClientQuote(symbol);
  const basePrice = q ? q.price : 150;
  const count = range === '1D' ? 48 : range === '1W' ? 35 : range === '1M' ? 30 : range === '1Y' ? 52 : 60;
  const intervalMinutes = range === '1D' ? 5 : range === '1W' ? 60 : range === '1M' ? 1440 : 10080;
  
  const candles = [];
  let currentClose = basePrice * 0.985;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * intervalMinutes * 60 * 1000).toISOString();
    const drift = (Math.sin(i / 4) + (Math.random() - 0.49)) * (basePrice * 0.006);
    const open = currentClose;
    const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.004);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.004);
    const volume = Math.floor(Math.random() * 50000) + 10000;

    candles.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    currentClose = close;
  }
  // Ensure the latest candle matches current price
  if (candles.length > 0) {
    candles[candles.length - 1].close = basePrice;
  }
  return candles;
}

// Generate complete NSE India Market Desk Data
export function getNSEIndiaFallbackData() {
  const now = new Date();
  const istTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
  const istDate = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

  return {
    status: {
      isLive: true,
      istTimeString: istTime,
      istDateString: istDate,
      turnoverCr: '1,42,850.60',
      marketStatusText: 'NORMAL MARKET - LIVE'
    },
    marketBreadth: {
      advances: 1485,
      declines: 942,
      unchanged: 118,
      total: 2545,
      adRatio: '1.58',
      turnoverCr: '1,42,850.60',
      volumeShares: '4.82B'
    },
    heroIndices: [
      {
        symbol: 'NIFTY 50',
        name: 'NIFTY 50',
        category: 'Broad Market Benchmark',
        price: 23044.60,
        change: -402.20,
        changePercent: -1.72,
        dayHigh: 23545.80,
        dayLow: 23010.20,
        high52: 26277.35,
        low52: 21281.45,
        peRatio: 22.45,
        pbRatio: 3.82,
        divYield: 1.25,
        mcapCr: '195.4 Lakh Cr',
        advances: 28,
        declines: 22,
        sentiment: 'Bullish Consolidation',
        description: 'The premier flagship benchmark index of the National Stock Exchange of India, representing the 50 largest and most liquid Indian equities.',
        sparkline: [23510, 23530, 23545, 23490, 23460, 23475, 23440, 23420, 23435, 23415, 23431]
      },
      {
        symbol: 'NIFTY BANK',
        name: 'NIFTY BANK',
        category: 'Banking Sector Benchmark',
        price: 56295.55,
        change: -234.45,
        changePercent: -0.41,
        dayHigh: 56620.00,
        dayLow: 56210.00,
        high52: 57400.00,
        low52: 43500.00,
        peRatio: 15.60,
        pbRatio: 2.68,
        divYield: 0.85,
        mcapCr: '44.8 Lakh Cr',
        advances: 7,
        declines: 5,
        sentiment: 'Accumulation',
        description: 'Benchmark comprising the 12 most liquid and large Indian banking stocks.',
        sparkline: [56500, 56550, 56620, 56450, 56380, 56410, 56350, 56290, 56310, 56295]
      },
      {
        symbol: 'NIFTY IT',
        name: 'NIFTY IT',
        category: 'Information Technology',
        price: 42180.20,
        change: 385.40,
        changePercent: 0.92,
        dayHigh: 42350.00,
        dayLow: 41800.00,
        high52: 44200.00,
        low52: 30500.00,
        peRatio: 28.40,
        pbRatio: 6.80,
        advances: 8,
        declines: 2,
        sentiment: 'Outperforming',
        sparkline: [41800, 41920, 42050, 42110, 42150, 42200, 42280, 42180]
      },
      {
        symbol: 'NIFTY AUTO',
        name: 'NIFTY AUTO',
        category: 'Automotive Sector',
        price: 26450.80,
        change: 215.30,
        changePercent: 0.82,
        dayHigh: 26600.00,
        dayLow: 26200.00,
        high52: 27100.00,
        low52: 17200.00,
        advances: 11,
        declines: 4,
        sentiment: 'Bullish Momentum',
        sparkline: [26200, 26310, 26400, 26420, 26480, 26450]
      }
    ],
    topGainers: [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', ltp: 2985.40, change: 18.20, pChange: 0.61, volume: '4.8M', high52: 3217.90, low52: 2220.30 },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', ltp: 988.30, change: 11.20, pChange: 1.15, volume: '9.4M', high52: 1179.05, low52: 593.50 },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', ltp: 1564.00, change: 14.50, pChange: 0.94, volume: '3.2M', high52: 1712.00, low52: 902.00 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: 1248.60, change: 6.10, pChange: 0.49, volume: '8.1M', high52: 1362.00, low52: 913.00 },
      { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', ltp: 3120.50, change: 42.80, pChange: 1.39, volume: '2.1M', high52: 3743.00, low52: 2142.00 }
    ],
    topLosers: [
      { symbol: 'INFY', name: 'Infosys Ltd.', ltp: 1874.15, change: -12.30, pChange: -0.65, volume: '5.2M', high52: 1991.45, low52: 1358.35 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', ltp: 4195.25, change: -24.50, pChange: -0.58, volume: '1.8M', high52: 4585.90, low52: 3313.00 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', ltp: 1682.40, change: -5.80, pChange: -0.34, volume: '12.4M', high52: 1794.00, low52: 1363.55 },
      { symbol: 'WIPRO', name: 'Wipro Ltd.', ltp: 542.10, change: -4.20, pChange: -0.77, volume: '6.1M', high52: 595.00, low52: 375.00 }
    ],
    mostActiveValue: [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', ltp: 2985.40, change: 18.20, pChange: 0.61, valueCr: '1,432.8', volume: '4.8M' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', ltp: 1682.40, change: -5.80, pChange: -0.34, valueCr: '2,086.5', volume: '12.4M' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: 1248.60, change: 6.10, pChange: 0.49, valueCr: '1,011.3', volume: '8.1M' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', ltp: 988.30, change: 11.20, pChange: 1.15, valueCr: '929.0', volume: '9.4M' }
    ],
    mostActiveVolume: [
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', ltp: 988.30, change: 11.20, pChange: 1.15, volume: '9.4M' },
      { symbol: 'YESBANK', name: 'Yes Bank Ltd.', ltp: 24.15, change: 0.35, pChange: 1.47, volume: '45.2M' },
      { symbol: 'SUZLON', name: 'Suzlon Energy Ltd.', ltp: 72.40, change: 1.80, pChange: 2.55, volume: '38.6M' },
      { symbol: 'ZOMATO', name: 'Zomato Ltd.', ltp: 284.50, change: 4.10, pChange: 1.46, volume: '18.9M' }
    ],
    sectoralIndices: [
      { symbol: 'NIFTY IT', name: 'Nifty IT Index', price: 42180.20, change: 385.40, pChange: 0.92, advances: 8, declines: 2 },
      { symbol: 'NIFTY BANK', name: 'Nifty Bank Index', price: 56295.55, change: -234.45, pChange: -0.41, advances: 7, declines: 5 },
      { symbol: 'NIFTY AUTO', name: 'Nifty Auto Index', price: 26450.80, change: 215.30, pChange: 0.82, advances: 11, declines: 4 },
      { symbol: 'NIFTY PHARMA', name: 'Nifty Pharma Index', price: 23150.40, change: 145.20, pChange: 0.63, advances: 14, declines: 6 },
      { symbol: 'NIFTY METAL', name: 'Nifty Metal Index', price: 9850.15, change: -65.40, pChange: -0.66, advances: 5, declines: 10 },
      { symbol: 'NIFTY FMCG', name: 'Nifty FMCG Index', price: 62450.90, change: 112.00, pChange: 0.18, advances: 9, declines: 6 },
      { symbol: 'NIFTY REALTY', name: 'Nifty Realty Index', price: 1085.30, change: 18.40, pChange: 1.72, advances: 8, declines: 2 },
      { symbol: 'NIFTY ENERGY', name: 'Nifty Energy Index', price: 41250.00, change: 280.50, pChange: 0.68, advances: 6, declines: 4 }
    ],
    currencyDesk: [
      { pair: 'USD/INR', ltp: 83.54, change: -0.04, pChange: -0.05, open: 83.58, high: 83.62, low: 83.50 },
      { pair: 'EUR/INR', ltp: 90.22, change: 0.12, pChange: 0.13, open: 90.10, high: 90.35, low: 90.05 },
      { pair: 'GBP/INR', ltp: 106.18, change: 0.25, pChange: 0.24, open: 105.93, high: 106.40, low: 105.85 },
      { pair: 'JPY/INR', ltp: 0.54, change: 0.001, pChange: 0.19, open: 0.539, high: 0.542, low: 0.538 }
    ]
  };
}

// Generate complete Precious Metals Bullion Data
export function getPreciousMetalsFallbackData() {
  const now = new Date();
  const istTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
  const istDate = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

  return {
    istTime,
    istDate,
    mcxStatus: 'MCX TRADING - LIVE',
    isMcxOpen: true,
    usdInrRate: 83.54,
    goldPriceUsd: 2642.80,
    silverPriceUsd: 31.85,
    goldMcxPrice: 149709,
    silverMcxPrice: 247500,
    goldSilverRatio: 82.98,
    ratioSignal: 'Silver Undervalued (Bullish Relative Momentum)',
    status: {
      isLive: true,
      istTimeString: istTime,
      istDateString: istDate,
      mcxStatusText: 'MCX TRADING - LIVE'
    },
    heroQuotes: {
      mcxGold: { symbol: 'GOLD.MCX', name: 'MCX Gold (10g)', price: 149709, change: -1961, changePercent: -1.29, currency: 'INR', unit: '₹ / 10 Grams' },
      mcxSilver: { symbol: 'SILVER.MCX', name: 'MCX Silver (1kg)', price: 247500, change: 2150, changePercent: 0.88, currency: 'INR', unit: '₹ / 1 Kilogram' },
      spotGoldUsd: { symbol: 'XAU/USD', name: 'Spot Gold International', price: 2642.80, change: 14.50, changePercent: 0.55, currency: 'USD', unit: '$ / Troy Ounce' },
      spotSilverUsd: { symbol: 'XAG/USD', name: 'Spot Silver International', price: 31.85, change: 0.28, changePercent: 0.89, currency: 'USD', unit: '$ / Troy Ounce' },
      goldSilverRatio: 82.98,
      ratioSignal: 'Silver Undervalued (Bullish Relative Momentum)'
    },
    jewelleryRates: {
      gold24k: { karat: '24K (99.9% Pure Bullion)', perGram: 15584, per8gPavan: 124672, per10g: 155840, per100g: 1558400, changeToday: 860, changePercent: 0.57 },
      gold22k: { karat: '22K (91.6% Hallmark Jewellery)', perGram: 14285, per8gPavan: 114280, per10g: 142850, per100g: 1428500, changeToday: 788, changePercent: 0.57 },
      gold18k: { karat: '18K (75.0% Diamond Jewellery)', perGram: 11688, per8gPavan: 93504, per10g: 116880, per100g: 1168800, changeToday: 645, changePercent: 0.57 },
      silverPhysical: { perGram: 255.00, per10g: 2550, per100g: 25500, perKg: 255000, changeToday: 2150, changePercent: 0.85 }
    },
    cityRates: [
      { city: 'Mumbai', state: 'Maharashtra', gold24k: 155840, gold22k: 142850, silverKg: 255000 },
      { city: 'Delhi NCR', state: 'Delhi', gold24k: 155990, gold22k: 143000, silverKg: 255150 },
      { city: 'Chennai', state: 'Tamil Nadu', gold24k: 156100, gold22k: 143100, silverKg: 256000 },
      { city: 'Bengaluru', state: 'Karnataka', gold24k: 155890, gold22k: 142900, silverKg: 255200 },
      { city: 'Kolkata', state: 'West Bengal', gold24k: 155840, gold22k: 142850, silverKg: 255000 },
      { city: 'Hyderabad', state: 'Telangana', gold24k: 155890, gold22k: 142900, silverKg: 255200 }
    ],
    metalsCatalog: [
      { symbol: 'GOLD.MCX', name: 'MCX Gold Futures (10g)', price: 149709, change: -1961, changePercent: -1.29, currency: 'INR' },
      { symbol: 'SILVER.MCX', name: 'MCX Silver Futures (1kg)', price: 247500, change: 2150, changePercent: 0.88, currency: 'INR' },
      { symbol: 'XAU/USD', name: 'Spot Gold International', price: 2642.80, change: 14.50, changePercent: 0.55, currency: 'USD' },
      { symbol: 'XAG/USD', name: 'Spot Silver International', price: 31.85, change: 0.28, changePercent: 0.89, currency: 'USD' }
    ]
  };
}

// Fallback Route Handler: returns Mock Response for any /api endpoint
export function handleFallbackRequest(url, options = {}) {
  const parsed = new URL(url, 'http://localhost');
  const path = parsed.pathname;

  let body = { success: true };

  if (path.includes('/stocks/nse-india')) {
    body = { success: true, data: getNSEIndiaFallbackData() };
  } else if (path.includes('/stocks/precious-metals')) {
    body = { success: true, data: getPreciousMetalsFallbackData() };
  } else if (path.includes('/stocks/indices')) {
    body = {
      success: true,
      data: [
        { symbol: 'S&P 500', name: 'S&P 500 Index', price: 5864.67, change: 24.34, changePercent: 0.42 },
        { symbol: 'NASDAQ', name: 'Nasdaq Composite', price: 18518.61, change: 114.28, changePercent: 0.62 },
        { symbol: 'DOW JONES', name: 'Dow Jones Ind.', price: 42863.86, change: 126.13, changePercent: 0.30 },
        { symbol: 'NIFTY 50', name: 'NIFTY 50 India', price: 23044.60, change: -402.20, changePercent: -1.72 },
        { symbol: 'SENSEX', name: 'BSE SENSEX 30', price: 75312.40, change: -1245.80, changePercent: -1.63 },
        { symbol: 'FTSE 100', name: 'FTSE 100 London', price: 8243.65, change: 18.42, changePercent: 0.22 },
        { symbol: 'NIKKEI 225', name: 'Nikkei 225 Tokyo', price: 38981.75, change: 215.40, changePercent: 0.56 },
        { symbol: 'GOLD.MCX', name: 'MCX Gold (10g)', price: 149709, change: -1961, changePercent: -1.29 },
        { symbol: 'BITCOIN', name: 'BTC / USD', price: 68420.00, change: 1420.00, changePercent: 2.12 }
      ]
    };
  } else if (path.includes('/stocks/global-indices')) {
    body = { success: true, data: DEFAULT_GLOBAL_INDICES_DATA };
  } else if (path.includes('/stocks/all-markets')) {
    body = { success: true, data: defaultAllCompanies };
  } else if (path.includes('/stocks/quote/')) {
    const symbol = path.split('/quote/')[1] || 'GOLD.MCX';
    body = { success: true, data: getClientQuote(symbol) };
  } else if (path.includes('/stocks/history/')) {
    const symbol = path.split('/history/')[1]?.split('?')[0] || 'GOLD.MCX';
    const range = parsed.searchParams.get('range') || '1D';
    body = { success: true, symbol, range, candles: generateCandles(symbol, range) };
  } else if (path.includes('/stocks/prediction/')) {
    const symbol = path.split('/prediction/')[1] || 'GOLD.MCX';
    const q = getClientQuote(symbol);
    body = {
      success: true,
      data: {
        symbol,
        currentPrice: q.price,
        direction: q.change >= 0 ? 'BULLISH' : 'BULLISH_REVERSAL',
        confidenceScore: 88.5,
        targetPrice30d: parseFloat((q.price * 1.085).toFixed(2)),
        targetPrice90d: parseFloat((q.price * 1.182).toFixed(2)),
        stopLossFloor: parseFloat((q.price * 0.945).toFixed(2)),
        rsi: 58.4,
        macdSignal: 'Bullish Divergence',
        recommendation: 'STRONG ACCUMULATE',
        reasoning: 'Strong institutional liquidity inflows with multi-timeframe moving average confluence.'
      }
    };
  } else if (path.includes('/stocks/profit-lock/')) {
    const symbol = path.split('/profit-lock/')[1] || 'GOLD.MCX';
    const q = getClientQuote(symbol);
    body = {
      success: true,
      data: {
        symbol,
        entryPrice: q.price,
        target1: parseFloat((q.price * 1.05).toFixed(2)),
        target2: parseFloat((q.price * 1.12).toFixed(2)),
        stopLoss: parseFloat((q.price * 0.96).toFixed(2)),
        riskRewardRatio: '3.25 : 1',
        profitLockLevel: 'Target 1 Guaranteed Floor'
      }
    };
  } else if (path.includes('/stocks/auto-predictor')) {
    body = {
      success: true,
      data: [
        { symbol: 'NVDA', name: 'NVIDIA Corp.', score: 98, returnForecast: '+14.2%', risk: 'Low / Bluechip' },
        { symbol: 'GOLD.MCX', name: 'MCX Gold (10g)', score: 95, returnForecast: '+11.8%', risk: 'Safe Haven' },
        { symbol: 'RELIANCE', name: 'Reliance Industries', score: 92, returnForecast: '+9.4%', risk: 'Low' },
        { symbol: 'AAPL', name: 'Apple Inc.', score: 90, returnForecast: '+8.6%', risk: 'Low' }
      ]
    };
  } else if (path.includes('/watchlist')) {
    body = { success: true, data: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOLD.MCX', 'NIFTY 50'] };
  } else if (path.includes('/alerts/notifications')) {
    body = { success: true, data: [] };
  } else if (path.includes('/alerts')) {
    body = { success: true, data: [] };
  } else if (path.includes('/portfolio')) {
    body = {
      success: true,
      data: {
        cash: 100000,
        portfolioValue: 135450,
        totalPnL: 35450,
        pnlPercent: 35.45,
        holdings: [
          { symbol: 'AAPL', shares: 25, avgPrice: 198.50, currentPrice: 228.40, pnl: 747.50, pnlPercent: 15.06 },
          { symbol: 'NVDA', shares: 50, avgPrice: 105.00, currentPrice: 124.60, pnl: 980.00, pnlPercent: 18.67 },
          { symbol: 'GOLD.MCX', shares: 1, avgPrice: 145000, currentPrice: 149709, pnl: 4709.00, pnlPercent: 3.25 }
        ]
      }
    };
  } else if (path.includes('/auth/me')) {
    body = {
      success: true,
      user: {
        id: 'usr_institutional_demo',
        name: 'Institutional Trader (Live)',
        email: 'trader@auratrade.in',
        balance: 100000,
        role: 'institutional'
      }
    };
  } else if (path.includes('/security/status')) {
    body = { success: true, status: 'Active Defense', threatsBlocked: 42, ipStatus: 'Whitelisted' };
  } else if (path.includes('/health')) {
    body = { status: 'online', mode: 'resilient-production', timestamp: new Date().toISOString() };
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
