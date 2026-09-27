import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Crown, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const MarketLeadersStrip = React.memo(function MarketLeadersStrip({ activeSymbol, onSelectSymbol, onOpenAllMarkets }) {
  const { quotes } = useSocket();
  const [leaders, setLeaders] = useState([]);
  const prevPricesRef = useRef({});
  const [flashingSymbols, setFlashingSymbols] = useState({});

  useEffect(() => {
    // Fetch top 10 market leaders by market cap
    fetch('/api/stocks/all-markets?tier=all&sortBy=marketCap&order=desc')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.companies) {
          setLeaders(json.data.companies.slice(0, 10));
        }
      })
      .catch(() => {});
  }, []);

  // Detect live quote updates and trigger moving tick flash
  useEffect(() => {
    if (!quotes || Object.keys(quotes).length === 0) return;
    const newFlashes = {};
    for (const [sym, q] of Object.entries(quotes)) {
      if (!q || q.price === undefined) continue;
      const old = prevPricesRef.current[sym];
      if (old !== undefined && old !== q.price) {
        newFlashes[sym] = q.price > old ? 'tick-flash-up' : 'tick-flash-down';
      }
      prevPricesRef.current[sym] = q.price;
    }
    if (Object.keys(newFlashes).length > 0) {
      setFlashingSymbols(prev => ({ ...prev, ...newFlashes }));
      const timer = setTimeout(() => {
        setFlashingSymbols({});
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [quotes]);

  if (leaders.length === 0) return null;

  return (
    <div className="glass-card market-leaders-card" style={{ padding: '0.65rem 1rem', background: 'var(--bg-card)', minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem', minWidth: 0, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 0 }}>
          <ShieldCheck size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <span className="market-leaders-title">Top Global Market Leaders</span>
        </div>

        <button
          onClick={onOpenAllMarkets}
          className="market-leaders-all-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-cyan)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            flexShrink: 0
          }}
        >
          <span className="market-leaders-link-text">All World Markets (160+ Assets)</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="market-leaders-scroll-track mobile-touch-strip" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.35rem', WebkitOverflowScrolling: 'touch', minWidth: 0, width: '100%', maxWidth: '100%' }}>
        {leaders.map((item) => {
          const live = quotes[item.symbol];
          const price = live?.price || item.price;
          const changePercent = live?.changePercent !== undefined ? live.changePercent : item.changePercent;
          const isPos = changePercent >= 0;
          const isSelected = item.symbol === activeSymbol;

          // Institutional country code mapping
          const getCountryCode = (c) => {
            if (!c) return 'GL';
            if (c.includes('States')) return 'US';
            if (c.includes('Denmark')) return 'DK';
            if (c.includes('Netherlands')) return 'NL';
            if (c.includes('France')) return 'FR';
            if (c.includes('Germany')) return 'DE';
            if (c.includes('Taiwan')) return 'TW';
            if (c.includes('Japan')) return 'JP';
            if (c.includes('China') || c.includes('Hong Kong')) return 'CN';
            if (c.includes('Kingdom')) return 'GB';
            if (c.includes('Saudi')) return 'SA';
            if (c.includes('Switzerland')) return 'CH';
            if (c.includes('Korea')) return 'KR';
            if (c.includes('India')) return 'IN';
            if (c.includes('Brazil')) return 'BR';
            if (c.includes('Australia')) return 'AU';
            if (c.includes('Canada')) return 'CA';
            return 'GL';
          };

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)',
                border: isSelected ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="market-leader-chip"
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: item.rank <= 3 ? '#38bdf8' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                #{item.rank}
              </span>

              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-card)',
                  padding: '0.15rem 0.35rem',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                {getCountryCode(item.country)}
              </span>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isSelected ? '#38bdf8' : 'var(--text-primary)' }}>
                    {item.symbol}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {item.marketCapFormatted}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  <span className={flashingSymbols[item.symbol] || ''} style={{ color: 'var(--text-secondary)', padding: '0 2px', borderRadius: '3px', transition: 'all 0.15s ease' }}>
                    ${price.toFixed(2)}
                  </span>
                  <span style={{ color: isPos ? 'var(--bull-green)' : 'var(--bear-red)', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
                    {isPos ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default MarketLeadersStrip;
