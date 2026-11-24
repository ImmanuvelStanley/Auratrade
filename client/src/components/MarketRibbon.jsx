import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLiveTickerActions } from '../context/SocketContext';

// Curated 21 global & Indian benchmark assets (42 items with duplicate conveyor)
// Lightweight geometry, zero heavy SVG vectors, hardware compositor-accelerated
const CORE_BENCHMARKS = [
  { symbol: 'NIFTY 50', name: 'Nifty 50', region: 'India', badgeCode: 'IN', price: 23044.60, changePercent: -1.72, currency: 'INR' },
  { symbol: 'S&P 500', name: 'S&P 500', region: 'US', badgeCode: 'US', price: 5910.50, changePercent: +0.38, currency: 'USD' },
  { symbol: 'BANK NIFTY', name: 'Bank Nifty', region: 'India', badgeCode: 'IN', price: 50295.55, changePercent: -0.41, currency: 'INR' },
  { symbol: 'NASDAQ', name: 'Nasdaq 100', region: 'US', badgeCode: 'US', price: 20641.12, changePercent: -0.32, currency: 'USD' },
  { symbol: 'SENSEX', name: 'BSE Sensex', region: 'India', badgeCode: 'IN', price: 76563.27, changePercent: -1.69, currency: 'INR' },
  { symbol: 'DOW JONES', name: 'Dow Jones 30', region: 'US', badgeCode: 'US', price: 43786.07, changePercent: -1.18, currency: 'USD' },
  { symbol: 'DAX 40', name: 'DAX Germany', region: 'Europe', badgeCode: 'DE', price: 19792.00, changePercent: -0.32, currency: 'EUR' },
  { symbol: 'FTSE 100', name: 'FTSE London', region: 'Europe', badgeCode: 'GB', price: 8263.88, changePercent: -0.44, currency: 'GBP' },
  { symbol: 'NIFTY IT', name: 'Nifty IT', region: 'India', badgeCode: 'IN', price: 41852.70, changePercent: -0.84, currency: 'INR' },
  { symbol: 'CAC 40', name: 'CAC Paris', region: 'Europe', badgeCode: 'FR', price: 7240.50, changePercent: -0.54, currency: 'EUR' },
  { symbol: 'NIKKEI 225', name: 'Nikkei Tokyo', region: 'Asia', badgeCode: 'JP', price: 38142.78, changePercent: -0.19, currency: 'JPY' },
  { symbol: 'HANG SENG', name: 'Hang Seng HK', region: 'Asia', badgeCode: 'HK', price: 19450.60, changePercent: +0.35, currency: 'HKD' },
  { symbol: 'ASX 200', name: 'ASX Australia', region: 'Asia-Pacific', badgeCode: 'AU', price: 8360.40, changePercent: -0.29, currency: 'AUD' },
  { symbol: 'INDIA VIX', name: 'India VIX', region: 'India', badgeCode: 'IN', price: 14.77, changePercent: +3.70, currency: '' },
  { symbol: 'GOLD', name: 'Gold (XAU/USD)', region: 'Commodity', badgeCode: 'XAU', price: 2658.10, changePercent: +0.33, currency: 'USD' },
  { symbol: 'SILVER', name: 'Silver (XAG/USD)', region: 'Commodity', badgeCode: 'XAG', price: 31.25, changePercent: +0.78, currency: 'USD' },
  { symbol: 'GOLD.MCX', name: 'MCX Gold 10g', region: 'India', badgeCode: 'IN', price: 78379.00, changePercent: +0.33, currency: 'INR' },
  { symbol: 'BTC/USD', name: 'Bitcoin', region: 'Crypto', badgeCode: 'BTC', price: 96420.00, changePercent: +1.45, currency: 'USD' },
  { symbol: 'ETH/USD', name: 'Ethereum', region: 'Crypto', badgeCode: 'ETH', price: 3580.00, changePercent: +1.85, currency: 'USD' },
  { symbol: 'USD/INR', name: 'USD/INR Forex', region: 'Forex', badgeCode: 'FX', price: 84.43, changePercent: -0.04, currency: 'INR' },
  { symbol: 'AAPL', name: 'Apple Inc.', region: 'US', badgeCode: 'US', price: 232.80, changePercent: +0.75, currency: 'USD' }
];

function getCurrencyPrefix(currency, symbol) {
  if (symbol === 'INDIA VIX') return '';
  switch (currency) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'HKD': return 'HK$';
    case 'AUD': return 'A$';
    default: return '$';
  }
}

function formatPriceText(currSymbol, val) {
  if (val === undefined || val === null || Number.isNaN(Number(val))) return `${currSymbol}--`;
  return `${currSymbol}${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercentText(val) {
  const num = val !== undefined && val !== null && !Number.isNaN(Number(val)) ? Number(val) : 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
}

// Ultra-lightweight GPU-composited ticker chip with direct text-node updates
const MarketTickerChip = React.memo(function MarketTickerChip({ item, onSelect }) {
  const { getQuote, subscribeQuote } = useLiveTickerActions();
  const initialQuote = getQuote(item.symbol);
  const initialPrice = initialQuote?.price ?? item.price;
  const initialPct = initialQuote?.changePercent ?? item.changePercent ?? 0;
  const initialBull = initialPct >= 0;
  const initialDir = initialQuote?.lastTickDirection === 'up' || initialQuote?.lastTickDirection === 'down'
    ? initialQuote.lastTickDirection
    : 'neutral';
  const currSymbol = getCurrencyPrefix(item.currency, item.symbol);

  const priceRef = useRef(null);
  const changeWrapRef = useRef(null);
  const arrowRef = useRef(null);
  const changeTextRef = useRef(null);
  const tickRef = useRef(null);
  const prevPriceRef = useRef(initialPrice);

  useEffect(() => {
    const sym = item.symbol;
    const unsubscribe = subscribeQuote(sym, (tick) => {
      if (!tick || tick.price === undefined || tick.price === null) return;
      const newPrice = Number(tick.price);
      if (Number.isNaN(newPrice)) return;

      if (priceRef.current) {
        priceRef.current.textContent = formatPriceText(currSymbol, newPrice);
      }

      if (tick.changePercent !== undefined && tick.changePercent !== null) {
        const pct = Number(tick.changePercent);
        const isBull = pct >= 0;
        if (changeTextRef.current) {
          changeTextRef.current.textContent = formatPercentText(pct);
        }
        if (changeWrapRef.current) {
          changeWrapRef.current.classList.toggle('text-bull', isBull);
          changeWrapRef.current.classList.toggle('text-bear', !isBull);
        }
        if (arrowRef.current) {
          arrowRef.current.textContent = isBull ? '↗' : '↘';
        }
      }

      const prevPrice = prevPriceRef.current;
      if (prevPrice !== undefined && prevPrice !== null && newPrice !== prevPrice) {
        const dir = newPrice > prevPrice ? 'up' : 'down';
        if (tickRef.current) {
          tickRef.current.textContent = dir === 'up' ? '▲' : '▼';
          tickRef.current.style.display = 'inline';
          tickRef.current.className = `chip-tick ${dir === 'up' ? 'text-bull' : 'text-bear'}`;
        }
      }

      prevPriceRef.current = newPrice;
    });

    return () => {
      unsubscribe();
    };
  }, [item.symbol, currSymbol, subscribeQuote]);

  return (
    <div
      data-symbol={item.symbol}
      className="market-ticker-chip"
      onClick={() => onSelect(item)}
      title={`Click to view complete historical record & valuation for ${item.name || item.symbol} (${item.region})`}
    >
      <span className="region-pill">{item.badgeCode}</span>
      <span className="chip-symbol">{item.symbol}</span>
      <span ref={priceRef} className="chip-price">
        {formatPriceText(currSymbol, initialPrice)}
      </span>
      <span
        ref={changeWrapRef}
        className={`chip-change ${initialBull ? 'text-bull' : 'text-bear'}`}
      >
        <span ref={arrowRef} aria-hidden="true">{initialBull ? '↗' : '↘'}</span>
        <span ref={changeTextRef}>{formatPercentText(initialPct)}</span>
      </span>
      <span
        ref={tickRef}
        className={`chip-tick ${initialDir === 'up' ? 'text-bull' : initialDir === 'down' ? 'text-bear' : ''}`}
        style={{ display: initialDir !== 'neutral' ? 'inline' : 'none' }}
        aria-hidden="true"
      >
        {initialDir === 'up' ? '▲' : initialDir === 'down' ? '▼' : ''}
      </span>
    </div>
  );
});

// Calibrated to 35s to match NSE Live Pulse speed exactly
function getRibbonDurationSeconds() {
  if (typeof window === 'undefined') return 35;
  try {
    const rawKey = Object.keys(localStorage).find((k) => k.startsWith('trader_workstation_prefs_'));
    const raw = rawKey ? localStorage.getItem(rawKey) : null;
    const prefs = raw ? JSON.parse(raw) : null;
    const mode = prefs?.tickerRibbonSpeed || 'normal';
    if (mode === 'fast') return 24;
    if (mode === 'slow') return 52;
    return 35;
  } catch (_) {
    return 35;
  }
}

export const MarketRibbon = React.memo(function MarketRibbon({ onSelectSymbol }) {
  const [items] = useState(CORE_BENCHMARKS);
  const [duration, setDuration] = useState(getRibbonDurationSeconds);
  const { getQuote, publishTicks } = useLiveTickerActions();

  // Periodically fetch live prices from API without modifying ribbon geometry or triggering layout reflow
  useEffect(() => {
    let isMounted = true;

    async function fetchRibbonFeeds() {
      try {
        const indicesRes = await fetch('/api/stocks/indices');
        if (indicesRes.ok && isMounted) {
          const json = await indicesRes.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            publishTicks(json.data);
          }
        }
      } catch (_) {}
    }

    fetchRibbonFeeds();
    const interval = setInterval(fetchRibbonFeeds, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [publishTicks]);

  // Sync speed preference if changed in workstation settings
  useEffect(() => {
    const checkSpeed = () => {
      const nextDuration = getRibbonDurationSeconds();
      setDuration((prev) => (prev === nextDuration ? prev : nextDuration));
    };
    window.addEventListener('storage', checkSpeed);
    return () => window.removeEventListener('storage', checkSpeed);
  }, []);

  const handleItemClick = useCallback((idx) => {
    if (!onSelectSymbol) return;
    const live = getQuote(idx.symbol);
    const enrichedItem = {
      ...idx,
      price: live ? live.price : idx.price,
      changePercent: live ? live.changePercent : idx.changePercent
    };
    onSelectSymbol(idx.symbol, enrichedItem);
  }, [onSelectSymbol, getQuote]);

  // Infinite seamless 2x duplicate conveyor running 100% on GPU compositor thread
  const renderedItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="market-ribbon-wrapper">
      {/* Pinned Left Badge with Animated Radar Pulse & NSE/World Tag */}
      <div className="market-ribbon-badge">
        <span className="radar-beacon" style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 }}>
          <span className="status-dot online" style={{ width: '8px', height: '8px' }} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>MARKET PULSE</span>
            <span style={{ fontSize: '0.6rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--bull-green)', padding: '1px 5px', borderRadius: '3px', fontWeight: 800, letterSpacing: '0.04em' }}>LIVE</span>
          </div>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>NSE &amp; GLOBAL MARKETS</span>
        </div>
      </div>

      {/* Pure GPU compositor-accelerated infinite linear marquee */}
      <div className="ticker-track-container">
        <div
          className="ticker-track"
          style={{ animationDuration: `${duration}s` }}
        >
          {renderedItems.map((idx, index) => (
            <MarketTickerChip
              key={`${idx.symbol}-${index}`}
              item={idx}
              onSelect={handleItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default MarketRibbon;
