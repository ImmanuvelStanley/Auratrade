import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLiveTickerActions } from '../context/SocketContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { defaultAllCompanies } from '../data/defaultAllCompanies';

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
  { symbol: 'GOLD', name: 'Gold (XAU/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAU', price: 4314.50, changePercent: +0.38, currency: 'USD' },
  { symbol: 'SILVER', name: 'Silver (XAG/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAG', price: 64.26, changePercent: +0.41, currency: 'USD' },
  { symbol: 'GOLD.MCX', name: 'MCX Gold 10g', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 148390.00, changePercent: +0.38, currency: 'INR' },
  { symbol: 'SILVER.MCX', name: 'MCX Silver 1kg', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 237890.00, changePercent: +0.41, currency: 'INR' },
  { symbol: 'BTC/USD', name: 'Bitcoin', region: 'Crypto', countryCode: 'CRYPTO', countryFlag: 'CRYPTO', price: 64250.00, changePercent: +2.14, currency: 'USD' },
  { symbol: 'USD/INR', name: 'USD/INR Forex', region: 'Forex', countryCode: 'FX', countryFlag: 'FX', price: 95.82, changePercent: -0.14, currency: 'INR' }
];

function buildMergedRibbonItems(baseList, incomingList = []) {
  const map = new Map();

  const upsert = (item) => {
    if (!item || !item.symbol) return;
    const sym = String(item.symbol).trim().toUpperCase();
    const existing = map.get(sym);
    map.set(sym, {
      symbol: sym,
      name: item.name || existing?.name || sym,
      region: item.country || item.region || existing?.region || 'Global',
      countryCode: item.countryCode || existing?.countryCode || '',
      countryFlag: item.countryFlag || existing?.countryFlag || '',
      price: item.price !== undefined ? item.price : existing?.price,
      changePercent: item.changePercent !== undefined ? item.changePercent : (existing?.changePercent ?? 0),
      currency: item.currency !== undefined ? item.currency : (existing?.currency ?? 'USD'),
      type: item.type || existing?.type || 'stock'
    });
  };

  (baseList || []).forEach(upsert);
  (defaultAllCompanies?.companies || []).forEach(upsert);
  (incomingList || []).forEach(upsert);

  return Array.from(map.values());
}

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

// Isolated zero-rerender ribbon ticker cell updated directly in DOM per symbol tick
const RibbonTickerItem = React.memo(function RibbonTickerItem({ item, onSelect }) {
  const { getQuote, subscribeQuote } = useLiveTickerActions();
  const initialQuote = getQuote(item.symbol);
  const initialPrice = initialQuote?.price ?? item.price;
  const initialPct = initialQuote?.changePercent ?? item.changePercent ?? 0;
  const initialBull = initialPct >= 0;
  const currSymbol = getCurrencyPrefix(item.currency, item.symbol);

  const itemRef = useRef(null);
  const priceRef = useRef(null);
  const badgeRef = useRef(null);
  const changeWrapRef = useRef(null);
  const changeTextRef = useRef(null);
  const upIconRef = useRef(null);
  const downIconRef = useRef(null);

  const prevPriceRef = useRef(initialPrice);
  const flashTimerRef = useRef(null);
  const rafRef = useRef(null);

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
        if (upIconRef.current) upIconRef.current.style.display = isBull ? 'inline-flex' : 'none';
        if (downIconRef.current) downIconRef.current.style.display = isBull ? 'none' : 'inline-flex';
      }

      const prevPrice = prevPriceRef.current;
      if (prevPrice !== undefined && prevPrice !== null && newPrice !== prevPrice) {
        const dir = newPrice > prevPrice ? 'up' : 'down';

        if (badgeRef.current) {
          badgeRef.current.textContent = dir === 'up' ? '▲' : '▼';
          badgeRef.current.className = `ribbon-tick-badge ${dir}`;
        }

        if (itemRef.current) {
          itemRef.current.classList.remove('tick-flash-up', 'tick-flash-down');
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            if (!itemRef.current) return;
            itemRef.current.classList.add(dir === 'up' ? 'tick-flash-up' : 'tick-flash-down');
            if (priceRef.current) {
              priceRef.current.classList.remove('up', 'down');
              priceRef.current.classList.add('tick-text', dir);
            }
          });

          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          flashTimerRef.current = setTimeout(() => {
            if (itemRef.current) {
              itemRef.current.classList.remove('tick-flash-up', 'tick-flash-down');
            }
            if (priceRef.current) {
              priceRef.current.classList.remove('tick-text', 'up', 'down');
            }
            flashTimerRef.current = null;
          }, 820);
        }
      }

      prevPriceRef.current = newPrice;
    });

    return () => {
      unsubscribe();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [item.symbol, currSymbol, subscribeQuote]);

  const badgeCode = item.countryCode && item.countryCode !== 'GL'
    ? item.countryCode
    : (item.region === 'India' ? 'IN' : item.region === 'US' ? 'US' : item.region?.slice(0, 2).toUpperCase() || 'GL');

  return (
    <div
      ref={itemRef}
      className="market-ribbon-item"
      onClick={() => onSelect(item)}
      style={{ cursor: 'pointer' }}
      title={`Click to view complete historical record (Starting → Now) & valuation for ${item.name || item.symbol} (${item.region})`}
    >
      {(item.countryCode || item.region) && (
        <span
          style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            lineHeight: 1.2
          }}
          title={item.region ? `${item.region} Market` : 'Market'}
        >
          <CountryFlag country={item.region} countryCode={item.countryCode} symbol={item.symbol} countryFlag={item.countryFlag} size="xs" />
          <span>{badgeCode}</span>
        </span>
      )}
      <span className="ribbon-sym">{item.symbol}</span>

      {/* Fixed-slot directional tick indicator (prevents horizontal reflow jitter) */}
      <span ref={badgeRef} className="ribbon-tick-badge neutral" aria-hidden="true" />

      <span ref={priceRef} className="ribbon-price font-mono">
        {formatPriceText(currSymbol, initialPrice)}
      </span>

      <span ref={changeWrapRef} className={`ribbon-change font-mono ${initialBull ? 'text-bull' : 'text-bear'}`}>
        <span ref={upIconRef} style={{ display: initialBull ? 'inline-flex' : 'none' }}>
          <ArrowUpRight size={12} />
        </span>
        <span ref={downIconRef} style={{ display: initialBull ? 'none' : 'inline-flex' }}>
          <ArrowDownRight size={12} />
        </span>
        <span ref={changeTextRef}>{formatPercentText(initialPct)}</span>
      </span>
    </div>
  );
});

export const MarketRibbon = React.memo(function MarketRibbon({ onSelectSymbol }) {
  const [indices, setIndices] = useState(() => buildMergedRibbonItems(CORE_BENCHMARKS));
  const { getQuote, publishTicks } = useLiveTickerActions();

  useEffect(() => {
    let isMounted = true;

    async function fetchRibbonFeeds() {
      try {
        const [indicesRes, marketsRes] = await Promise.allSettled([
          fetch('/api/stocks/indices'),
          fetch('/api/stocks/all-markets?tier=all&sortBy=marketCap&order=desc')
        ]);

        const combinedIncoming = [];
        if (indicesRes.status === 'fulfilled' && indicesRes.value.ok) {
          const json = await indicesRes.value.json();
          if (json.success && Array.isArray(json.data)) {
            combinedIncoming.push(...json.data);
          }
        }
        if (marketsRes.status === 'fulfilled' && marketsRes.value.ok) {
          const json = await marketsRes.value.json();
          if (json.success && Array.isArray(json.data?.companies)) {
            combinedIncoming.push(...json.data.companies);
          }
        }

        if (isMounted && combinedIncoming.length > 0) {
          // Push price updates directly to item subscribers without disrupting marquee track geometry
          publishTicks(combinedIncoming);

          // Append only genuinely new symbols so marquee CSS transform never restarts during normal price ticks
          setIndices((prev) => {
            const known = new Set(prev.map((x) => x.symbol));
            const hasNewSymbol = combinedIncoming.some(
              (c) => c?.symbol && !known.has(String(c.symbol).trim().toUpperCase())
            );
            return hasNewSymbol ? buildMergedRibbonItems(prev, combinedIncoming) : prev;
          });
        }
      } catch (e) {}
    }

    fetchRibbonFeeds();
    const interval = setInterval(fetchRibbonFeeds, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [publishTicks]);

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

  // Steady linear scroll duration (~2.1s per ticker) for consistent frame pacing
  const trackDurationSec = Math.max(65, Math.round(indices.length * 2.1));

  return (
    <div className="market-ribbon-wrapper">
      {/* Pinned Left Badge with Animated Radar Ripple & NSE/World Tag */}
      <div className="market-ribbon-badge">
        <span className="radar-pulse-dot" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>MARKET PULSE</span>
            <span style={{ fontSize: '0.6rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--bull-green)', padding: '1px 5px', borderRadius: '3px', fontWeight: 800, letterSpacing: '0.04em' }}>LIVE</span>
          </div>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>NSE & GLOBAL MARKETS</span>
        </div>
      </div>

      {/* Infinite Continuous Moving Marquee Track */}
      <div className="ticker-track-container">
        <div className="ticker-track" style={{ animationDuration: `${trackDurationSec}s` }}>
          {/* Primary Track */}
          {indices.map((idx, i) => (
            <RibbonTickerItem key={`orig-${idx.symbol}-${i}`} item={idx} onSelect={handleItemClick} />
          ))}
          {/* Duplicate Seamless Loop Track */}
          {indices.map((idx, i) => (
            <RibbonTickerItem key={`dup-${idx.symbol}-${i}`} item={idx} onSelect={handleItemClick} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default MarketRibbon;

