import React, { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLiveTickerActions } from '../context/SocketContext';
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
  { symbol: 'GOLD', name: 'Gold (XAU/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAU', price: 3758.10, changePercent: +0.33, currency: 'USD' },
  { symbol: 'SILVER', name: 'Silver (XAG/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAG', price: 44.95, changePercent: +0.78, currency: 'USD' },
  { symbol: 'GOLD.MCX', name: 'MCX Gold 10g', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 129379.00, changePercent: +0.33, currency: 'INR' },
  { symbol: 'SILVER.MCX', name: 'MCX Silver 1kg', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 179612.00, changePercent: +0.47, currency: 'INR' },
  { symbol: 'BTC/USD', name: 'Bitcoin', region: 'Crypto', countryCode: 'CRYPTO', countryFlag: 'CRYPTO', price: 64250.00, changePercent: +2.14, currency: 'USD' },
  { symbol: 'USD/INR', name: 'USD/INR Forex', region: 'Forex', countryCode: 'FX', countryFlag: 'FX', price: 93.43, changePercent: -0.04, currency: 'INR' }
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

// Isolated zero-rerender ribbon ticker cell updated cleanly in-place per symbol tick (no popups)
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
      title={`Click to view complete historical record (Starting → Now) & valuation for ${item.name || item.symbol} (${item.region})`}
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

const RIBBON_SPEED_PX_PER_SEC = 60;

function getChunkSizeForViewport() {
  if (typeof window === 'undefined') return 8;
  const w = window.innerWidth || 1280;
  if (w <= 768) return 6;
  if (w <= 1600) return 8;
  return 10;
}

export const MarketRibbon = React.memo(function MarketRibbon({ onSelectSymbol }) {
  const [indices, setIndices] = useState(() => buildMergedRibbonItems(CORE_BENCHMARKS));
  const [headIndex, setHeadIndex] = useState(0);
  const [chunkCount, setChunkCount] = useState(getChunkSizeForViewport);

  const { getQuote, publishTicks } = useLiveTickerActions();

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const rateRafRef = useRef(0);
  const playbackRateRef = useRef(1);
  const isPausedRef = useRef(false);
  const queuedAdditionsRef = useRef([]);

  const effectiveChunk = Math.max(1, Math.min(chunkCount, Math.floor(indices.length / 2) || 1));
  const indicesLengthRef = useRef(indices.length);
  const headIndexRef = useRef(headIndex);
  const effectiveChunkRef = useRef(effectiveChunk);
  indicesLengthRef.current = indices.length;
  headIndexRef.current = headIndex;
  effectiveChunkRef.current = effectiveChunk;

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
          // Push live price updates directly to item subscribers without disrupting marquee geometry
          publishTicks(combinedIncoming);

          // Append ONLY truly unseen symbols so active composited chunk never shifts mid-flight
          setIndices((prev) => {
            const known = new Set(prev.map((x) => x.symbol));
            queuedAdditionsRef.current.forEach((q) => known.add(q.symbol));
            const additions = [];
            combinedIncoming.forEach((raw) => {
              if (!raw || !raw.symbol) return;
              const sym = String(raw.symbol).trim().toUpperCase();
              if (known.has(sym)) return;
              known.add(sym);
              additions.push({
                symbol: sym,
                name: raw.name || sym,
                region: raw.country || raw.region || 'Global',
                countryCode: raw.countryCode || '',
                countryFlag: raw.countryFlag || '',
                price: raw.price,
                changePercent: raw.changePercent ?? 0,
                currency: raw.currency ?? 'USD',
                type: raw.type || 'stock'
              });
            });
            if (additions.length === 0) return prev;
            if (headIndexRef.current + 2 * effectiveChunkRef.current > prev.length) {
              queuedAdditionsRef.current.push(...additions);
              return prev;
            }
            return [...prev, ...additions];
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

  // Adjust active chunk tier cleanly across viewport breakpoints
  useEffect(() => {
    const syncChunk = () => {
      const next = getChunkSizeForViewport();
      setChunkCount((prev) => (prev === next ? prev : next));
    };
    window.addEventListener('resize', syncChunk, { passive: true });
    return () => window.removeEventListener('resize', syncChunk);
  }, []);

  // Build two contiguous chunks: [activeChunk (moves out), nextChunk (glides smoothly into slot 0)]
  const visibleEntries = useMemo(() => {
    const len = indices.length;
    if (!len) return [];
    const total = Math.min(len, effectiveChunk * 2);
    const list = [];
    for (let i = 0; i < total; i++) {
      list.push(indices[(headIndex + i) % len]);
    }
    return list;
  }, [indices, headIndex, effectiveChunk]);

  const visibleKey = useMemo(
    () => visibleEntries.map((item) => item.symbol).join('|'),
    [visibleEntries]
  );

  // GPU compositor-thread WAAPI conveyor (immune to React re-renders below)
  useLayoutEffect(() => {
    const trackEl = trackRef.current;

    if (animRef.current) {
      animRef.current.onfinish = null;
      animRef.current.cancel();
      animRef.current = null;
    }

    if (!trackEl || trackEl.children.length <= effectiveChunk) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      trackEl.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    const r0 = trackEl.children[0].getBoundingClientRect();
    const rChunk = trackEl.children[effectiveChunk].getBoundingClientRect();
    const chunkPx = rChunk.left - r0.left;
    if (!Number.isFinite(chunkPx) || chunkPx <= 0) return;

    const durationMs = (chunkPx / RIBBON_SPEED_PX_PER_SEC) * 1000;

    if (typeof trackEl.animate === 'function') {
      const anim = trackEl.animate(
        [
          { transform: 'translate3d(0px, 0, 0)' },
          { transform: `translate3d(-${chunkPx.toFixed(3)}px, 0, 0)` }
        ],
        {
          duration: durationMs,
          easing: 'linear',
          fill: 'forwards'
        }
      );

      try {
        anim.playbackRate = isPausedRef.current ? 0 : playbackRateRef.current;
      } catch (_) {}

      if (document.hidden) {
        anim.pause();
      }

      anim.onfinish = () => {
        if (animRef.current !== anim) return;
        if (queuedAdditionsRef.current.length > 0) {
          const queued = queuedAdditionsRef.current;
          queuedAdditionsRef.current = [];
          setIndices((prev) => [...prev, ...queued]);
        }
        setHeadIndex((prev) => (prev + effectiveChunkRef.current) % (indicesLengthRef.current || 1));
      };

      animRef.current = anim;
    }

    return () => {
      if (animRef.current) {
        animRef.current.onfinish = null;
        animRef.current.cancel();
        animRef.current = null;
      }
    };
  }, [visibleKey, effectiveChunk]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const anim = animRef.current;
      if (!anim) return;
      if (document.hidden) {
        anim.pause();
      } else {
        anim.play();
        try {
          anim.playbackRate = isPausedRef.current ? 0 : playbackRateRef.current;
        } catch (_) {}
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (rateRafRef.current) cancelAnimationFrame(rateRafRef.current);
    };
  }, []);

  const easePlaybackRate = useCallback((targetRate) => {
    if (rateRafRef.current) {
      cancelAnimationFrame(rateRafRef.current);
      rateRafRef.current = 0;
    }

    let lastTs = 0;
    const step = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
      lastTs = ts;

      const cur = playbackRateRef.current;
      const alpha = 1 - Math.exp(-10 * dt);
      let next = cur + (targetRate - cur) * alpha;
      const done = Math.abs(targetRate - next) < 0.015;
      if (done) next = targetRate;

      playbackRateRef.current = next;
      if (animRef.current) {
        try {
          animRef.current.playbackRate = next;
        } catch (_) {}
      }

      if (!done) {
        rateRafRef.current = requestAnimationFrame(step);
      } else {
        rateRafRef.current = 0;
      }
    };

    rateRafRef.current = requestAnimationFrame(step);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia && !window.matchMedia('(hover: hover)').matches) {
      return;
    }
    isPausedRef.current = true;
    easePlaybackRate(0);
  }, [easePlaybackRate]);

  const handleMouseLeave = useCallback(() => {
    isPausedRef.current = false;
    easePlaybackRate(1);
  }, [easePlaybackRate]);

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

      {/* Smooth Windowed Linear Marquee Conveyor */}
      <div
        ref={containerRef}
        className="ticker-track-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={trackRef} className="ticker-track">
          {visibleEntries.map((idx) => (
            <RibbonTickerItem key={idx.symbol} item={idx} onSelect={handleItemClick} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default MarketRibbon;

