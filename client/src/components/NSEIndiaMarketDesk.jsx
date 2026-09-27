import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Zap,
  Layers,
  PieChart,
  X,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react';

import { getNSEIndiaFallbackData } from '../services/clientFallbackData';

// Module-level in-memory cache for instant zero-spinner tab switching
let nseMemoryCache = null;

export const NSEIndiaMarketDesk = React.memo(function NSEIndiaMarketDesk({ onSelectSymbol, isActive = true }) {
  const [data, setData] = useState(() => nseMemoryCache || getNSEIndiaFallbackData());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gainers');
  const [selectedHeroIndex, setSelectedHeroIndex] = useState('NIFTY 50');
  const [showSectorDetails, setShowSectorDetails] = useState(true);
  const sectorDetailsRef = useRef(null);
  const prevPricesRef = useRef({});
  const [flashingSymbols, setFlashingSymbols] = useState({});
  const [tickDirections, setTickDirections] = useState({});

  const handleSelectHeroSector = (sym) => {
    setSelectedHeroIndex(sym);
    setShowSectorDetails(true);
    setTimeout(() => {
      sectorDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 40);
  };

  const fetchNSEData = async () => {
    try {
      const res = await fetch('/api/stocks/nse-india');
      const json = await res.json();
      if (json.success && json.data) {
        nseMemoryCache = json.data;
        const newFlashes = {};
        const newDirections = {};
        const checkItem = (sym, price) => {
          if (!sym || price === undefined || price === null) return;
          const old = prevPricesRef.current[sym];
          if (old !== undefined && old !== price) {
            const dir = price > old ? 'up' : 'down';
            newFlashes[sym] = dir === 'up' ? 'tick-flash-up' : 'tick-flash-down';
            newDirections[sym] = dir;
          }
          prevPricesRef.current[sym] = price;
        };

        (json.data.heroIndices || []).forEach(h => checkItem(h.symbol, h.price));
        (json.data.topGainers || []).forEach(s => checkItem(s.symbol, s.ltp));
        (json.data.topLosers || []).forEach(s => checkItem(s.symbol, s.ltp));
        (json.data.mostActiveValue || []).forEach(s => checkItem(s.symbol, s.ltp));
        (json.data.mostActiveVolume || []).forEach(s => checkItem(s.symbol, s.ltp));
        (json.data.sectoralIndices || []).forEach(sec => checkItem(sec.symbol, sec.price));
        (json.data.currencyDesk || []).forEach(c => checkItem(c.pair, c.ltp));

        if (Object.keys(newFlashes).length > 0) {
          setFlashingSymbols(prev => ({ ...prev, ...newFlashes }));
          setTickDirections(prev => ({ ...prev, ...newDirections }));
          setTimeout(() => {
            setFlashingSymbols({});
          }, 1100);
        }

        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load NSE India data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    fetchNSEData();
    const interval = setInterval(fetchNSEData, 20000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (loading && !data) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={28} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Connecting to National Stock Exchange of India (NSE)...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
          Ingesting real-time NIFTY 50, Bank Nifty, Market Breadth, and Sectoral Indices feeds...
        </p>
      </div>
    );
  }

  const { status, marketBreadth, heroIndices, topGainers, topLosers, mostActiveValue, mostActiveVolume, sectoralIndices, currencyDesk } = data || {};

  // Render SVG live wave sparkline with pulsing beacon tip
  const renderSparkline = (points, isBull, sym) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 220;
    const height = 36;
    const pad = 4;
    const h = height - pad * 2;
    const coords = points.map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (width - pad * 2);
      const y = pad + h - ((p - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const pathD = `M ${coords.join(' L ')}`;
    const areaD = `${pathD} L ${width - pad},${height} L ${pad},${height} Z`;
    const lastCoord = coords[coords.length - 1].split(',');
    const lastX = parseFloat(lastCoord[0]);
    const lastY = parseFloat(lastCoord[1]);
    const color = isBull ? '#10b981' : '#f43f5e';
    const gradId = `nse-grad-${sym.replace(/[^a-zA-Z0-9]/g, '')}`;

    return (
      <div style={{ position: 'relative', width: '100%', height: '36px', margin: '0.5rem 0' }}>
        <svg width="100%" height="36" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={lastX} cy={lastY} r="3" fill={color} stroke="#ffffff" strokeWidth="1.2" />
        </svg>
        {/* Animated Live Beacon at the tip */}
        <div
          className={`nse-sparkline-beacon ${isBull ? 'bull' : 'bear'}`}
          style={{
            left: `${(lastX / width) * 100}%`,
            top: `${(lastY / height) * 100}%`
          }}
        />
      </div>
    );
  };

  return (
    <div className="motion-entry perf-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: 0, maxWidth: '100%' }}>
      {/* Top NSE Official Header & IST Clock */}
      <div
        className="glass-card"
        style={{
          background: 'var(--profile-hero-bg)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', minWidth: 0, flex: '1 1 auto' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.35)',
              flexShrink: 0
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.88rem', color: '#ffffff', letterSpacing: '0.06em' }}>
              NSE
            </span>
          </div>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'clamp(1.05rem, 3vw, 1.25rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                National Stock Exchange of India <span style={{ color: '#f59e0b' }}>(NSE)</span>
              </h2>
              <span
                className="status-pill"
                style={{
                  background: status?.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  borderColor: status?.isOpen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
                  color: status?.isOpen ? 'var(--bull-green)' : 'var(--bear-red)',
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.6rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <span className="radar-beacon" style={{ width: '8px', height: '8px', borderRadius: '50%' }}>
                  <span className={`status-dot ${status?.isOpen ? 'online' : 'offline'}`} style={{ width: '8px', height: '8px' }} />
                </span>
                {status?.statusText}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={13} style={{ color: 'var(--accent-cyan)' }} />
                {status?.asOn}
              </span>
              <span>•</span>
              <span>Exchange: <strong>NSE India / Mumbai</strong></span>
              <span>•</span>
              <span>Turnover: <strong style={{ color: 'var(--text-primary)' }}>₹{marketBreadth?.totalTurnoverCr?.toLocaleString('en-IN')} Cr</strong></span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchNSEData}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <RefreshCw size={14} /> Refresh Live Feed
          </button>
          <a
            href="https://www.nseindia.com/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', textDecoration: 'none' }}
          >
            Official Portal <ExternalLink size={13} style={{ marginLeft: '0.25rem' }} />
          </a>
        </div>
      </div>

      {/* NSE India Official Continuous Live Marquee Ticker Tape */}
      <div className="nse-marquee-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.85rem', borderRight: '1px solid rgba(245, 158, 11, 0.3)', whiteSpace: 'nowrap', zIndex: 2, background: 'var(--bg-card)' }}>
          <span className="radar-beacon" style={{ width: '8px', height: '8px', borderRadius: '50%' }}>
            <span className="status-dot online" style={{ width: '8px', height: '8px' }} />
          </span>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.04em' }}>
            NSE LIVE PULSE
          </span>
        </div>
        <div className="nse-marquee-track">
          {[...(heroIndices || []), ...(sectoralIndices || []), ...(currencyDesk || []), ...(heroIndices || []), ...(sectoralIndices || [])].map((item, idx) => {
            const sym = item.symbol || item.pair;
            const isBull = (item.change !== undefined ? item.change : item.changePercent) >= 0;
            const priceVal = item.price || item.ltp;
            const flashClass = flashingSymbols[sym] || '';
            return (
              <div
                key={`${sym}-${idx}`}
                className="nse-ticker-chip"
                onClick={() => handleSelectHeroSector(sym)}
                title={`Click to view ${sym}`}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sym}</span>
                <span className={`font-mono ${flashClass}`} style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {sym === 'INDIA VIX' ? '' : '₹'}{priceVal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isBull ? 'var(--bull-green)' : 'var(--bear-red)', display: 'inline-flex', alignItems: 'center' }}>
                  {isBull ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {isBull ? '+' : ''}{item.changePercent?.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero Index Cards 3x2 Grid (Strictly 2 rows of 3 cards each) */}
      <div
        className="nse-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.25rem'
        }}
      >
        {heroIndices?.map((idx) => {
          const isBull = idx.change >= 0;
          const isSelected = selectedHeroIndex === idx.symbol;

          return (
            <div
              key={idx.symbol}
              className={`glass-card nse-hero-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectHeroSector(idx.symbol)}
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {idx.category}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{idx.name}</h3>
                  </div>
                  <span
                    className={`status-pill ${isBull ? 'bg-bull' : 'bg-bear'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.55rem' }}
                  >
                    {isBull ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {isBull ? '+' : ''}{idx.changePercent?.toFixed(2)}%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  <span
                    className={`font-mono ${flashingSymbols[idx.symbol] || ''}`}
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      display: 'inline-block',
                      borderRadius: '4px',
                      padding: '1px 5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {idx.symbol === 'INDIA VIX' ? '' : '₹'}{idx.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {isBull ? '+' : ''}{idx.change?.toFixed(2)}
                  </span>
                  {tickDirections[idx.symbol] && (
                    <span
                      className={`status-pill font-mono ${tickDirections[idx.symbol] === 'up' ? 'bg-bull' : 'bg-bear'}`}
                      style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 700 }}
                    >
                      {tickDirections[idx.symbol] === 'up' ? '▲ UPTICK' : '▼ DOWNTICK'}
                    </span>
                  )}
                </div>

                {/* Live Intraday Sparkline Wave with Pulsing Radar Beacon */}
                {renderSparkline(idx.sparkline, isBull, idx.symbol)}
              </div>

              {/* Intraday High / Low Bar & Click Action Prompt */}
              <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Low: <strong className="font-mono" style={{ color: 'var(--bear-red)' }}>₹{idx.dayLow?.toLocaleString('en-IN')}</strong></span>
                  <span>High: <strong className="font-mono" style={{ color: 'var(--bull-green)' }}>₹{idx.dayHigh?.toLocaleString('en-IN')}</strong></span>
                </div>
                <div
                  style={{
                    height: '4px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--border-subtle)',
                    marginTop: '0.4rem',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '20%',
                      right: '25%',
                      height: '100%',
                      background: isBull ? 'linear-gradient(90deg, var(--bull-green), var(--accent-cyan))' : 'linear-gradient(90deg, var(--bear-red), var(--warning-amber))',
                      borderRadius: 'var(--radius-full)'
                    }}
                  />
                </div>

                {/* Click for Sector Breakdown Prompt */}
                <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: isSelected ? 700 : 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {isSelected ? '● Sector Details Active Below' : 'Click to inspect sector details →'}
                  </span>
                  {isSelected && (
                    <span style={{ color: 'var(--accent-cyan)', fontSize: '0.65rem', fontWeight: 800 }}>VIEWING</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          INTERACTIVE SECTOR DEEP-DIVE & INDEX ANATOMY PANEL (Triggered by Click)
          ========================================================================= */}
      {(() => {
        const currentSector = heroIndices?.find(h => h.symbol === selectedHeroIndex) || heroIndices?.[0];
        if (!currentSector || !showSectorDetails) return null;
        const isBull = currentSector.change >= 0;

        return (
          <div
            ref={sectorDetailsRef}
            className="glass-card motion-entry sector-details-panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.35rem'
            }}
          >
            {/* Panel Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)',
                    flexShrink: 0
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {currentSector.name} Sector Breakdown & Key Fundamentals
                    </h3>
                    <span
                      className="status-pill"
                      style={{
                        background: isBull ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isBull ? 'var(--bull-green)' : 'var(--bear-red)',
                        border: `1px solid ${isBull ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem'
                      }}
                    >
                      {isBull ? '▲ +' : '▼ '}{currentSector.changePercent?.toFixed(2)}% ({isBull ? '+' : ''}{currentSector.change?.toFixed(2)})
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {currentSector.description}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Index Benchmark Level</div>
                  <div className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currentSector.symbol === 'INDIA VIX' ? '' : '₹'}{currentSector.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowSectorDetails(false)}
                  title="Close Sector Details"
                  style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Comprehensive Fundamentals / Volatility Strip */}
            {currentSector.symbol === 'INDIA VIX' ? (
              /* Specialized Volatility Metrics Strip */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '0.85rem' }}>
                  <div className="sector-stat-tile">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market Sentiment Gauge</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                      {currentSector.fearGreedLabel || 'Greed / Risk-On'} ({currentSector.fearGreedScore || 64}/100)
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Derivatives market pricing low tail-risk</div>
                  </div>

                  <div className="sector-stat-tile">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nifty Put-Call Ratio (PCR)</div>
                    <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                      {currentSector.pcrRatio || 1.18}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Heavy put writing forming strong support floor</div>
                  </div>

                  <div className="sector-stat-tile">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected 30-Day Nifty Range</div>
                    <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                      {currentSector.expectedBand || '22,650 – 24,200 (±3.4%)'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Statistically expected volatility band</div>
                  </div>

                  <div className="sector-stat-tile">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>52-Week Volatility Band</div>
                    <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--warning-amber)', marginTop: '0.25rem' }}>
                      Low: {currentSector.low52} • High: {currentSector.high52}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#818cf8', marginTop: '0.2rem' }}>{currentSector.sentiment || 'Low Volatility Regime'}</div>
                  </div>
                </div>

                {/* Key Volatility Drivers Chips */}
                {currentSector.drivers && currentSector.drivers.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', padding: '0.65rem 0.85rem', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Zap size={13} /> Key Volatility Drivers:
                    </span>
                    {currentSector.drivers.map((drv, dIdx) => (
                      <span key={dIdx} style={{ fontSize: '0.74rem', background: 'var(--bg-card)', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {drv}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Standard Equity Sector Fundamentals Strip */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '0.75rem' }}>
                <div className="sector-stat-tile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Index P/E Multiple</div>
                  <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {currentSector.peRatio ? `${currentSector.peRatio}x` : '22.45x'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Trailing 12-month earnings</div>
                </div>

                <div className="sector-stat-tile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Price-to-Book (P/B)</div>
                  <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {currentSector.pbRatio ? `${currentSector.pbRatio}x` : '3.82x'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Book value multiple</div>
                </div>

                <div className="sector-stat-tile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dividend Yield</div>
                  <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                    {currentSector.divYield ? `${currentSector.divYield}%` : '1.25%'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Annual cash return</div>
                </div>

                <div className="sector-stat-tile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market Capitalization</div>
                  <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                    {currentSector.mcapCr || '₹195.4 Lakh Cr'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Aggregate sector cap</div>
                </div>

                <div className="sector-stat-tile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sector Breadth</div>
                  <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    <span style={{ color: 'var(--bull-green)' }}>{currentSector.advances || 28} Adv</span> / <span style={{ color: 'var(--bear-red)' }}>{currentSector.declines || 22} Dec</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Internal momentum</div>
                </div>

                <div className="sector-stat-tile">
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>52-Week Range</div>
                  <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    L: ₹{currentSector.low52?.toLocaleString('en-IN')} — H: ₹{currentSector.high52?.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#818cf8', marginTop: '0.15rem' }}>{currentSector.sentiment || 'Bullish Stance'}</div>
                </div>
              </div>
            )}

            {/* Top Heavyweight Constituents Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <PieChart size={16} style={{ color: 'var(--accent-cyan)' }} />
                  {currentSector.symbol === 'INDIA VIX' ? 'Key Strike Concentrations & Options Open Interest' : `${currentSector.name} Heavyweight Constituents & Index Weights`}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Click any stock to analyze live in workstation
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                  gap: '0.75rem'
                }}
              >
                {currentSector.constituents?.map((stk, i) => {
                  const isStkBull = stk.changePercent >= 0;
                  return (
                    <div
                      key={stk.symbol || i}
                      className="sector-constituent-chip"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        cursor: onSelectSymbol ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (onSelectSymbol && !stk.symbol.includes('CE') && !stk.symbol.includes('PE')) {
                          onSelectSymbol(stk.symbol);
                        }
                      }}
                      title={`Click to analyze ${stk.name} (${stk.symbol}) in workstation`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{stk.symbol}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stk.name}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="font-mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            ₹{stk.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isStkBull ? 'var(--bull-green)' : 'var(--bear-red)' }}>
                            {isStkBull ? '+' : ''}{stk.changePercent?.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {/* Weightage Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          <span>Index Weight</span>
                          <span className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{stk.weight}%</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(100, stk.weight * 3.5)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #06b6d4, #6366f1)',
                              borderRadius: '2px'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Middle Row: Market Breadth (Advances/Declines) & Sectoral Indices Heatmap */}
      <div className="nse-middle-row">
        {/* Left Card: Market Breadth (Advances vs Declines Meter) */}
        <div className="glass-card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <BarChart3 size={16} style={{ color: '#f59e0b' }} /> NSE Market Breadth
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Total: <strong>{marketBreadth?.totalTradedEquities?.toLocaleString()} Equities</strong>
              </span>
            </div>

            {/* Advances vs Declines Progress Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.45rem' }}>
                <span style={{ color: 'var(--bull-green)', fontWeight: 700 }}>
                  Advances: {marketBreadth?.advances} ({marketBreadth?.advancesPercent}%)
                </span>
                <span style={{ color: 'var(--bear-red)', fontWeight: 700 }}>
                  Declines: {marketBreadth?.declines} ({marketBreadth?.declinesPercent}%)
                </span>
              </div>
              <div
                style={{
                  height: '10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  overflow: 'hidden',
                  background: 'var(--border-subtle)'
                }}
              >
                <div style={{ width: `${marketBreadth?.advancesPercent}%`, background: 'var(--bull-green)', transition: 'width 0.5s ease' }} />
                <div style={{ width: `${100 - marketBreadth?.advancesPercent - marketBreadth?.declinesPercent}%`, background: 'var(--text-muted)' }} />
                <div style={{ width: `${marketBreadth?.declinesPercent}%`, background: 'var(--bear-red)', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                <span>Unchanged: <strong style={{ color: 'var(--text-secondary)' }}>{marketBreadth?.unchanged}</strong></span>
                <span>A/D Ratio: <strong style={{ color: 'var(--text-primary)' }}>{(marketBreadth?.advances / (marketBreadth?.declines || 1)).toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Key Market Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Traded Turnover</span>
                <p className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  ₹{marketBreadth?.totalTurnoverCr?.toLocaleString('en-IN')} Cr
                </p>
              </div>
              <div style={{ padding: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Traded Volume</span>
                <p className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {marketBreadth?.totalVolumeFormatted} Shares
                </p>
              </div>
            </div>
          </div>

          {/* NSE Currency Cross Rates Desk */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              NSE Currency Derivatives (INR Crosses)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              {currencyDesk?.map(c => (
                <div key={c.pair} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.6rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.pair}</span>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`font-mono ${flashingSymbols[c.pair] || ''}`}
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        display: 'inline-block',
                        borderRadius: '3px',
                        padding: '1px 4px'
                      }}
                    >
                      ₹{c.ltp.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: c.change >= 0 ? 'var(--bull-green)' : 'var(--bear-red)', marginLeft: '0.35rem' }}>
                      {c.change >= 0 ? '+' : ''}{c.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Sectoral Indices Performance Heatmap */}
        <div className="glass-card" style={{ padding: '1.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={16} style={{ color: 'var(--accent-cyan)' }} /> NSE Sectoral Indices Performance
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              10 Key Indian Sectors
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
              gap: '0.75rem'
            }}
          >
            {sectoralIndices?.map((sec) => {
              const isBull = sec.changePercent >= 0;
              return (
                <div
                  key={sec.symbol}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: isBull ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                    border: `1px solid ${isBull ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.35rem'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {sec.symbol}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span
                      className={`font-mono ${flashingSymbols[sec.symbol] || ''}`}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        display: 'inline-block',
                        borderRadius: '3px',
                        padding: '1px 4px'
                      }}
                    >
                      ₹{sec.price.toLocaleString('en-IN')}
                    </span>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isBull ? 'var(--bull-green)' : 'var(--bear-red)'
                      }}
                    >
                      {isBull ? '+' : ''}{sec.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Gainers, Losers & Most Active Equities (Live NSE Table) */}
      <div className="glass-card" style={{ padding: '1.35rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.85rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              NSE Market Movers & Equities Live Watch
            </h4>
          </div>

          {/* Sub-tabs */}
          <div className="nse-subtabs-strip mobile-touch-strip" style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'gainers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('gainers')}
            >
              <TrendingUp size={13} /> Top 5 Gainers
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'losers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('losers')}
            >
              <TrendingDown size={13} /> Top 5 Losers
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'activeValue' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('activeValue')}
            >
              Most Active (₹ Value)
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'activeVolume' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveTab('activeVolume')}
            >
              Most Active (Volume)
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="mobile-scroll-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '700px' }}>
            <thead>
              <tr>
                <th>Symbol / Company</th>
                <th style={{ textAlign: 'right' }}>LTP (₹)</th>
                <th style={{ textAlign: 'right' }}>Change</th>
                <th style={{ textAlign: 'right' }}>% Change</th>
                <th style={{ textAlign: 'right' }}>Volume / Value</th>
                <th style={{ textAlign: 'right' }}>52W High</th>
                <th style={{ textAlign: 'right' }}>52W Low</th>
                <th style={{ textAlign: 'center' }}>Workstation Action</th>
              </tr>
            </thead>
            <tbody>
              {((activeTab === 'gainers' ? topGainers :
                activeTab === 'losers' ? topLosers :
                activeTab === 'activeValue' ? mostActiveValue :
                mostActiveVolume) || []).map((stock) => {
                if (!stock) return null;
                const chg = Number(stock.change || 0);
                const chgPct = Number(stock.changePercent || 0);
                const isBull = chgPct >= 0;

                const rowFlash = flashingSymbols[stock.symbol] === 'tick-flash-up' ? 'nse-row-flash-up' : flashingSymbols[stock.symbol] === 'tick-flash-down' ? 'nse-row-flash-down' : '';

                return (
                  <tr key={stock.symbol} className={rowFlash} style={{ transition: 'background-color 0.4s ease' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.62rem', padding: '1px 4px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                          IN
                        </span>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{stock.symbol}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stock.name}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className={`font-mono ${flashingSymbols[stock.symbol] || ''}`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          display: 'inline-block',
                          borderRadius: '4px',
                          padding: '1px 5px'
                        }}
                      >
                        ₹{Number(stock.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`} style={{ fontWeight: 600 }}>
                        {isBull ? '+' : ''}{chg.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className={`status-pill ${isBull ? 'bg-bull' : 'bg-bear'}`}
                        style={{ display: 'inline-flex', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        {isBull ? '+' : ''}{chgPct.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {stock.turnoverCr ? `₹${stock.turnoverCr.toLocaleString()} Cr` : stock.volume}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--bull-green)', fontSize: '0.8rem' }}>
                        {stock.high52 ? `₹${stock.high52.toLocaleString('en-IN')}` : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--bear-red)', fontSize: '0.8rem' }}>
                        {stock.low52 ? `₹${stock.low52.toLocaleString('en-IN')}` : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onSelectSymbol && onSelectSymbol(stock.symbol)}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <Zap size={12} style={{ color: 'var(--accent-cyan)' }} /> Inspect Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default NSEIndiaMarketDesk;
