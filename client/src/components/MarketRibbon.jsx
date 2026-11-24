import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLiveTickerActions } from '../context/SocketContext';
import { CountryFlag } from './CountryFlag';

const CORE_BENCHMARKS = [
  { symbol: 'NIFTY 50', name: 'Nifty 50', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 23044.60, changePercent: -1.72, currency: 'INR' },
  { symbol: 'S&P 500', name: 'S&P 500', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 7636.12, changePercent: -0.58, currency: 'USD' },
  { symbol: 'BANK NIFTY', name: 'Bank Nifty', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 56295.55, changePercent: -0.41, currency: 'INR' },
  { symbol: 'NASDAQ', name: 'Nasdaq 100', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 26241.12, changePercent: -0.32, currency: 'USD' },
  { symbol: 'SENSEX', name: 'BSE Sensex', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 73563.27, changePercent: -1.69, currency: 'INR' },
  { symbol: 'DOW JONES', name: 'Dow Jones 30', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 52786.07, changePercent: -1.18, currency: 'USD' },
  { symbol: 'DAX 40', name: 'DAX Germany', region: 'Europe', countryCode: 'DE', countryFlag: '🇩🇪', price: 25792.00, changePercent: -0.32, currency: 'EUR' },
  { symbol: 'FTSE 100', name: 'FTSE London', region: 'Europe', countryCode: 'GB', countryFlag: '🇬🇧', price: 10763.88, changePercent: -0.44, currency: 'GBP' },
  { symbol: 'NIFTY IT', name: 'Nifty IT', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 41852.70, changePercent: -0.84, currency: 'INR' },
  { symbol: 'CAC 40', name: 'CAC Paris', region: 'Europe', countryCode: 'FR', countryFlag: '🇫🇷', price: 8240.50, changePercent: -0.54, currency: 'EUR' },
  { symbol: 'NIKKEI 225', name: 'Nikkei Tokyo', region: 'Asia', countryCode: 'JP', countryFlag: '🇯🇵', price: 65142.78, changePercent: -0.19, currency: 'JPY' },
  { symbol: 'HANG SENG', name: 'Hang Seng HK', region: 'Asia', countryCode: 'HK', countryFlag: '🇭🇰', price: 17450.60, changePercent: +0.35, currency: 'HKD' },
  { symbol: 'ASX 200', name: 'ASX Australia', region: 'Asia-Pacific', countryCode: 'AU', countryFlag: '🇦🇺', price: 8560.40, changePercent: -0.29, currency: 'AUD' },
  { symbol: 'INDIA VIX', name: 'India VIX', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 11.77, changePercent: +3.70, currency: '' },
  { symbol: 'GOLD', name: 'Gold (XAU/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAU', price: 3758.10, changePercent: +0.33, currency: 'USD' },
  { symbol: 'SILVER', name: 'Silver (XAG/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAG', price: 44.95, changePercent: +0.78, currency: 'USD' },
  { symbol: 'GOLD.MCX', name: 'MCX Gold 10g', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 129379.00, changePercent: +0.33, currency: 'INR' },
  { symbol: 'SILVER.MCX', name: 'MCX Silver 1kg', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 179612.00, changePercent: +0.47, currency: 'INR' },
  { symbol: 'BTC/USD', name: 'Bitcoin', region: 'Crypto', countryCode: 'CRYPTO', countryFlag: 'CRYPTO', price: 96420.00, changePercent: +1.45, currency: 'USD' },
  { symbol: 'ETH/USD', name: 'Ethereum', region: 'Crypto', countryCode: 'CRYPTO', countryFlag: 'CRYPTO', price: 3580.00, changePercent: +1.85, currency: 'USD' },
  { symbol: 'USD/INR', name: 'USD/INR Forex', region: 'Forex', countryCode: 'FX', countryFlag: 'FX', price: 84.43, changePercent: -0.04, currency: 'INR' },
  { symbol: 'EUR/USD', name: 'EUR/USD Forex', region: 'Forex', countryCode: 'FX', countryFlag: 'FX', price: 1.054, changePercent: +0.12, currency: 'USD' },
  { symbol: 'GBP/USD', name: 'GBP/USD Forex', region: 'Forex', countryCode: 'FX', countryFlag: 'FX', price: 1.262, changePercent: +0.08, currency: 'USD' },
  { symbol: 'AAPL', name: 'Apple Inc.', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 232.80, changePercent: +0.75, currency: 'USD' }
];

function getCurrencyPrefix(currency, symbol) {
  if (symbol === 'INDIA VIX') return '';
  switch (currency) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY':
    case 'CNY': return '¥';
    case 'HKD': return 'HK$';
    case 'AUD': return 'A$';
    case 'CAD': return 'CA$';
    case 'CHF': return 'CHF ';
    case 'SAR': return 'SAR ';
    case 'BRL': return 'R$';
    case 'SEK':
    case 'DKK': return 'kr';
    case 'KRW': return '₩';
    case 'TWD': return 'NT$';
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

// Isolated zero-rerender ribbon ticker cell updated cleanly in-place per symbol tick
const RibbonTickerItem = React.memo(function RibbonTickerItem({ item, onSelect }) {
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
  const badgeRef = useRef(null);
  const changeWrapRef = useRef(null);
  const arrowRef = useRef(null);
  const changeTextRef = useRef(null);

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
        if (badgeRef.current) {
          badgeRef.current.textContent = dir === 'up' ? '▲' : '▼';
          badgeRef.current.className = `ribbon-tick-badge ${dir}`;
        }
      }

      prevPriceRef.current = newPrice;
    });

    return () => {
      unsubscribe();
    };
  }, [item.symbol, currSymbol, subscribeQuote]);

  const badgeCode = item.countryCode && item.countryCode !== 'GL'
    ? item.countryCode
    : (item.region === 'India' ? 'IN' : item.region === 'US' ? 'US' : item.region?.slice(0, 2).toUpperCase() || 'GL');

  return (
    <div
      data-symbol={item.symbol}
      className="market-ribbon-item"
      onClick={() => onSelect(item)}
      style={{ cursor: 'pointer' }}
      title={`Click to view complete historical record & valuation for ${item.name || item.symbol} (${item.region})`}
    >
      <div className="ribbon-item-left">
        {(item.countryCode || item.region) && (
          <span
            style={{
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              lineHeight: 1.2,
              flexShrink: 0
            }}
            title={item.region ? `${item.region} Market` : 'Market'}
          >
            <CountryFlag country={item.region} countryCode={item.countryCode} symbol={item.symbol} countryFlag={item.countryFlag} size="xs" />
            <span>{badgeCode}</span>
          </span>
        )}
        <span className="ribbon-sym">{item.symbol}</span>
      </div>

      <div className="ribbon-item-right">
        <span ref={badgeRef} className={`ribbon-tick-badge ${initialDir}`} aria-hidden="true">
          {initialDir === 'up' ? '▲' : initialDir === 'down' ? '▼' : ''}
        </span>

        <span ref={priceRef} className="ribbon-price font-mono">
          {formatPriceText(currSymbol, initialPrice)}
        </span>

        <span ref={changeWrapRef} className={`ribbon-change font-mono ${initialBull ? 'text-bull' : 'text-bear'}`}>
          <span ref={arrowRef} aria-hidden="true">{initialBull ? '↗' : '↘'}</span>
          <span ref={changeTextRef}>{formatPercentText(initialPct)}</span>
        </span>
      </div>
    </div>
  );
});

// Calibrated to match NSE Live Pulse tape velocity (162 px/s across 24 items = 48s linear infinite)
function getRibbonDurationSeconds() {
  if (typeof window === 'undefined') return 48;
  try {
    const rawKey = Object.keys(localStorage).find((k) => k.startsWith('trader_workstation_prefs_'));
    const raw = rawKey ? localStorage.getItem(rawKey) : null;
    const prefs = raw ? JSON.parse(raw) : null;
    const mode = prefs?.tickerRibbonSpeed || 'normal';
    if (mode === 'fast') return 32;
    if (mode === 'slow') return 72;
    return 48;
  } catch (_) {
    return 48;
  }
}

export const MarketRibbon = React.memo(function MarketRibbon({ onSelectSymbol }) {
  const [items, setItems] = useState(CORE_BENCHMARKS);
  const [duration, setDuration] = useState(getRibbonDurationSeconds);
  const { getQuote, publishTicks } = useLiveTickerActions();

  // Periodically update live prices from API without modifying ribbon geometry or triggering layout reflow
  useEffect(() => {
    let isMounted = true;

    async function fetchRibbonFeeds() {
      try {
        const indicesRes = await fetch('/api/stocks/indices');
        if (indicesRes.ok) {
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
            <RibbonTickerItem
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
