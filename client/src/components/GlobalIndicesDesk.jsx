import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

import { DEFAULT_GLOBAL_INDICES_DATA } from '../data/defaultGlobalIndices';

// Module-level in-memory cache for instant zero-spinner tab switching
const globalIndicesCache = {
  major: DEFAULT_GLOBAL_INDICES_DATA
};

export const GlobalIndicesDesk = React.memo(function GlobalIndicesDesk({ onSelectSymbol, isActive = true }) {
  const [data, setData] = useState(() => globalIndicesCache['major'] || DEFAULT_GLOBAL_INDICES_DATA);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState('major');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'gain_desc', 'loss_desc', 'name'
  const [activeMoversTab, setActiveMoversTab] = useState('gainers'); // 'gainers' | 'losers' | 'activeValue' | 'activeVolume'
  const prevPricesRef = useRef({});
  const [flashingIndices, setFlashingIndices] = useState({});

  const { summary, indices, topGainers, topLosers, mostActiveValue, mostActiveVolume } = data || DEFAULT_GLOBAL_INDICES_DATA;

  // Unconditionally declared hooks at the top level (Rules of Hooks strictly compliant)
  const clientTopGainers = useMemo(() => {
    return [...(indices || [])].sort((a, b) => (Number(b?.chgPercent) || 0) - (Number(a?.chgPercent) || 0)).slice(0, 5);
  }, [indices]);

  const clientTopLosers = useMemo(() => {
    return [...(indices || [])].sort((a, b) => (Number(a?.chgPercent) || 0) - (Number(b?.chgPercent) || 0)).slice(0, 5);
  }, [indices]);

  const clientActiveValue = useMemo(() => {
    return [...(indices || [])].sort((a, b) => (Number(b?.turnoverVal) || 0) - (Number(a?.turnoverVal) || 0)).slice(0, 5);
  }, [indices]);

  const clientActiveVolume = useMemo(() => {
    return [...(indices || [])].sort((a, b) => (Number(b?.volumeVal) || 0) - (Number(a?.volumeVal) || 0)).slice(0, 5);
  }, [indices]);

  const activeMoversList = useMemo(() => {
    if (activeMoversTab === 'gainers') return topGainers?.length ? topGainers : clientTopGainers;
    if (activeMoversTab === 'losers') return topLosers?.length ? topLosers : clientTopLosers;
    if (activeMoversTab === 'activeValue') return mostActiveValue?.length ? mostActiveValue : clientActiveValue;
    return mostActiveVolume?.length ? mostActiveVolume : clientActiveVolume;
  }, [activeMoversTab, topGainers, topLosers, mostActiveValue, mostActiveVolume, clientTopGainers, clientTopLosers, clientActiveValue, clientActiveVolume]);

  const displayedIndices = useMemo(() => {
    let list = (indices || []).filter(idx => {
      if (!idx) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = String(idx.name || '').toLowerCase();
      const country = String(idx.country || '').toLowerCase();
      const symbol = String(idx.symbol || '').toLowerCase();
      return name.includes(q) || country.includes(q) || symbol.includes(q);
    });

    if (sortBy === 'gain_desc') {
      list = [...list].sort((a, b) => (Number(b?.chgPercent) || 0) - (Number(a?.chgPercent) || 0));
    } else if (sortBy === 'loss_desc') {
      list = [...list].sort((a, b) => (Number(a?.chgPercent) || 0) - (Number(b?.chgPercent) || 0));
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
    }
    return list;
  }, [indices, searchQuery, sortBy]);

  const fetchGlobalIndices = async (selectedRegion = region) => {
    try {
      const res = await fetch(`/api/stocks/global-indices?region=${selectedRegion}`);
      const json = await res.json();
      if (json.success && json.data) {
        globalIndicesCache[selectedRegion] = json.data;
        // Detect price changes and trigger moving tick flash
        const newFlashes = {};
        const checkItem = (sym, price) => {
          if (!sym || price === undefined || price === null) return;
          const oldVal = prevPricesRef.current[sym];
          if (oldVal !== undefined && oldVal !== price) {
            newFlashes[sym] = price > oldVal ? 'tick-flash-up' : 'tick-flash-down';
          }
          prevPricesRef.current[sym] = price;
        };

        (json.data.indices || []).forEach(idx => checkItem(idx.symbol, idx.last));
        (json.data.topGainers || []).forEach(idx => checkItem(idx.symbol, idx.last));
        (json.data.topLosers || []).forEach(idx => checkItem(idx.symbol, idx.last));
        (json.data.mostActiveValue || []).forEach(idx => checkItem(idx.symbol, idx.last));
        (json.data.mostActiveVolume || []).forEach(idx => checkItem(idx.symbol, idx.last));

        if (Object.keys(newFlashes).length > 0) {
          setFlashingIndices(prev => ({ ...prev, ...newFlashes }));
          setTimeout(() => {
            setFlashingIndices({});
          }, 1200);
        }

        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load global indices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    fetchGlobalIndices(region);
    const interval = setInterval(() => fetchGlobalIndices(region), 20000);
    return () => clearInterval(interval);
  }, [isActive, region]);

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
    if (globalIndicesCache[newRegion]) {
      setData(globalIndicesCache[newRegion]);
    }
    fetchGlobalIndices(newRegion);
  };

  const getCurrencySymbol = (curr) => {
    return curr === 'INR' ? '₹' :
           curr === 'EUR' ? '€' :
           curr === 'GBP' ? '£' :
           curr === 'JPY' ? '¥' :
           curr === 'HKD' ? 'HK$' :
           curr === 'CAD' ? 'C$' :
           curr === 'AUD' ? 'A$' :
           curr === 'CHF' ? 'CHF ' :
           curr === 'BRL' ? 'R$ ' :
           curr === 'KRW' ? '₩' :
           curr === 'CNY' ? '¥' :
           curr === 'TWD' ? 'NT$' : '$';
  };

  const handleInspectIndex = (stock) => {
    const sym = stock?.symbol || '';
    if (!sym) return;
    const mapped = sym === '^GSPC' ? 'SPY' :
                   sym === '^IXIC' ? 'QQQ' :
                   sym === '^DJI' ? 'DIA' :
                   sym === '^NSEI' ? 'RELIANCE' :
                   sym === '^BSESN' ? 'TCS' :
                   sym === '^NSEBANK' ? 'HDFCBANK' :
                   sym.startsWith('^') ? 'AAPL' : sym;
    onSelectSymbol && onSelectSymbol(mapped);
  };

  return (
    <div className="motion-entry perf-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: 0, maxWidth: '100%' }}>
      {/* Top Banner: Global Portal Inspired by Investing.com Major Indices */}
      <div
        className="glass-card"
        style={{
          background: 'var(--profile-hero-bg)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
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
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
              flexShrink: 0
            }}
          >
            <Globe size={24} />
          </div>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'clamp(1.05rem, 3vw, 1.25rem)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Major World Indices <span style={{ color: 'var(--accent-cyan)' }}>• Global Market Overview</span>
              </h2>
              <span
                className="status-pill"
                style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.6rem'
                }}
              >
                <span className="status-dot online" />
                LIVE GLOBAL FEED
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Real-time benchmark indices across Americas, Europe (EMEA), and Asia-Pacific matching institutional standards.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchGlobalIndices(region)}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            <RefreshCw size={14} /> Refresh Feeds
          </button>
          <a
            href="https://in.investing.com/indices/major-indices"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', textDecoration: 'none' }}
          >
            Investing.com Portal <ExternalLink size={13} style={{ marginLeft: '0.25rem' }} />
          </a>
        </div>
      </div>

      {/* Global Market Overview Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        <div className="glass-card" style={{ padding: '1.1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Market Sentiment
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span
              className="status-pill"
              style={{
                background: summary?.sentiment?.includes('Risk-On') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                borderColor: summary?.sentiment?.includes('Risk-On') ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
                color: summary?.sentiment?.includes('Risk-On') ? 'var(--bull-green)' : 'var(--bear-red)',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            >
              {summary?.sentiment || 'Neutral / Active'}
            </span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Global Breadth (Advancing / Declining)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span className="font-mono text-bull" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {summary?.advancing ?? 0} ▲
            </span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span className="font-mono text-bear" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {summary?.declining ?? 0} ▼
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              Total: {summary?.totalTracked ?? (indices?.length || 0)}
            </span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Top Performing Benchmark
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {summary?.topGainer?.name || '--'}
            </span>
            <span className="font-mono status-pill bg-bull" style={{ fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
              +{Number(summary?.topGainer?.chgPercent || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.1rem 1.25rem' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            Strongest Index Lag
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              {summary?.topLoser?.name || '--'}
            </span>
            <span className="font-mono status-pill bg-bear" style={{ fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
              {Number(summary?.topLoser?.chgPercent || 0).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Global Market Movers & Benchmark Leaders Live Watch (Top 5 Gainers, Losers, Most Active Value, Volume) */}
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
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Zap size={15} style={{ color: 'var(--accent-cyan)' }} />
              Global Market Movers & Benchmark Leaders Live Watch
            </h4>
          </div>

          {/* Sub-tabs strip matching the user screenshot */}
          <div className="nse-subtabs-strip mobile-touch-strip" style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              className={`btn ${activeMoversTab === 'gainers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveMoversTab('gainers')}
            >
              <TrendingUp size={13} /> Top 5 Gainers
            </button>
            <button
              type="button"
              className={`btn ${activeMoversTab === 'losers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveMoversTab('losers')}
            >
              <TrendingDown size={13} /> Top 5 Losers
            </button>
            <button
              type="button"
              className={`btn ${activeMoversTab === 'activeValue' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveMoversTab('activeValue')}
            >
              Most Active ($ Value)
            </button>
            <button
              type="button"
              className={`btn ${activeMoversTab === 'activeVolume' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setActiveMoversTab('activeVolume')}
            >
              Most Active (Volume)
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="mobile-scroll-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '720px' }}>
            <thead>
              <tr>
                <th>Index / Benchmark</th>
                <th style={{ textAlign: 'right' }}>Last Price</th>
                <th style={{ textAlign: 'right' }}>Change</th>
                <th style={{ textAlign: 'right' }}>% Change</th>
                <th style={{ textAlign: 'right' }}>Volume / Value</th>
                <th style={{ textAlign: 'right' }}>52W High</th>
                <th style={{ textAlign: 'right' }}>52W Low</th>
                <th style={{ textAlign: 'center' }}>Workstation Action</th>
              </tr>
            </thead>
            <tbody>
              {activeMoversList?.map((stock) => {
                if (!stock) return null;
                const isBull = (Number(stock.chgPercent) || 0) >= 0;
                const currSymbol = getCurrencySymbol(stock.currency);
                const symKey = stock.symbol || String(Math.random());
                const isUpTick = flashingIndices[symKey] === 'tick-flash-up';
                const isDownTick = flashingIndices[symKey] === 'tick-flash-down';
                const rowFlash = isUpTick ? 'nse-row-flash-up' : isDownTick ? 'nse-row-flash-down' : '';

                return (
                  <tr key={symKey} className={rowFlash} style={{ transition: 'background-color 0.4s ease' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '24px',
                            borderRadius: '4px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: stock.countryFlag && stock.countryFlag.length <= 2 ? '0.95rem' : '0.65rem',
                            color: 'var(--accent-cyan)',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {stock.countryFlag || (stock.country ? String(stock.country).substring(0, 2).toUpperCase() : 'GL')}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'inline-block', fontSize: '0.92rem' }}>
                              {stock.name || symKey}
                            </span>
                            {stock.unit && (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                {stock.unit}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {stock.category ? `${stock.category} • ` : ''}{stock.country || 'Global'} • {stock.symbol}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isUpTick && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bull-green)', background: 'rgba(16, 185, 129, 0.2)', padding: '1px 4px', borderRadius: '3px' }}>
                            ▲
                          </span>
                        )}
                        {isDownTick && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bear-red)', background: 'rgba(244, 63, 94, 0.2)', padding: '1px 4px', borderRadius: '3px' }}>
                            ▼
                          </span>
                        )}
                        <span
                          className={`font-mono ${flashingIndices[symKey] || ''}`}
                          style={{
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            display: 'inline-block',
                            borderRadius: '4px',
                            padding: '2px 5px'
                          }}
                        >
                          {currSymbol}{Number(stock.last || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {isBull ? '+' : ''}{stock.chg !== undefined && stock.chg !== null ? Number(stock.chg).toFixed(2) : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className={`status-pill ${isBull ? 'bg-bull' : 'bg-bear'}`}
                        style={{ display: 'inline-flex', padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        {isBull ? '+' : ''}{Number(stock.chgPercent ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {stock.turnover ? stock.turnover : (stock.volume || '--')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--bull-green)', fontSize: '0.82rem' }}>
                        {stock.high52 ? `${currSymbol}${Number(stock.high52 || 0).toLocaleString('en-US')}` : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--bear-red)', fontSize: '0.82rem' }}>
                        {stock.low52 ? `${currSymbol}${Number(stock.low52 || 0).toLocaleString('en-US')}` : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleInspectIndex(stock)}
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

      {/* Main Table Card */}
      <div className="glass-card" style={{ padding: '1.35rem' }}>
        {/* Navigation Tabs (Major | Americas | Europe | Asia-Pacific | All) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.85rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Regional Segments */}
          <div className="global-regional-strip mobile-touch-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              className={`btn ${region === 'major' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => handleRegionChange('major')}
            >
              Major World Indices
            </button>
            <button
              type="button"
              className={`btn ${region === 'americas' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => handleRegionChange('americas')}
            >
              Americas
            </button>
            <button
              type="button"
              className={`btn ${region === 'europe' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => handleRegionChange('europe')}
            >
              Europe (EMEA)
            </button>
            <button
              type="button"
              className={`btn ${region === 'asia_pacific' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => handleRegionChange('asia_pacific')}
            >
              Asia-Pacific
            </button>
            <button
              type="button"
              className={`btn ${region === 'commodities' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => handleRegionChange('commodities')}
            >
              <span>🪙</span>
              <span>Commodities & Metals</span>
            </button>
            <button
              type="button"
              className={`btn ${region === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => handleRegionChange('all')}
            >
              All Global Indices
            </button>
          </div>

          {/* Search and Sort controls */}
          <div className="global-controls-cluster" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter index or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{ padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.8rem' }}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="default">Default Order</option>
              <option value="gain_desc">Top Gainers (%)</option>
              <option value="loss_desc">Top Losers (%)</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Investing.com Replicated Tabular Layout */}
        <div className="mobile-scroll-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: '780px' }}>
            <thead>
              <tr>
                <th>Index Name & Country</th>
                <th style={{ textAlign: 'right' }}>Last</th>
                <th style={{ textAlign: 'right' }}>High</th>
                <th style={{ textAlign: 'right' }}>Low</th>
                <th style={{ textAlign: 'right' }}>Chg.</th>
                <th style={{ textAlign: 'right' }}>Chg. %</th>
                <th style={{ textAlign: 'center' }}>Time / Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedIndices.map((idx) => {
                if (!idx) return null;
                const isBull = (Number(idx.chg) || 0) >= 0;
                const currSymbol = getCurrencySymbol(idx.currency);
                const symKey = idx.symbol || String(Math.random());

                const isUpTick = flashingIndices[symKey] === 'tick-flash-up';
                const isDownTick = flashingIndices[symKey] === 'tick-flash-down';
                const rowFlash = isUpTick ? 'nse-row-flash-up' : isDownTick ? 'nse-row-flash-down' : '';

                return (
                  <tr key={symKey} className={rowFlash} style={{ transition: 'background-color 0.4s ease' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '24px',
                            borderRadius: '4px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: idx.countryFlag ? '0.95rem' : '0.65rem',
                            color: 'var(--accent-cyan)',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {idx.countryFlag || (idx.country ? String(idx.country).substring(0, 2).toUpperCase() : 'GL')}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'inline-block', fontSize: '0.95rem' }}>
                              {idx.name || symKey}
                            </span>
                            {idx.unit && (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                {idx.unit}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {idx.category ? `${idx.category} • ` : ''}{idx.country || 'Global'} • {idx.symbol}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isUpTick && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bull-green)', background: 'rgba(16, 185, 129, 0.2)', padding: '1px 4px', borderRadius: '3px' }}>
                            ▲
                          </span>
                        )}
                        {isDownTick && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bear-red)', background: 'rgba(244, 63, 94, 0.2)', padding: '1px 4px', borderRadius: '3px' }}>
                            ▼
                          </span>
                        )}
                        <span
                          className={`font-mono ${flashingIndices[symKey] || ''}`}
                          style={{
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            fontSize: '1.05rem',
                            display: 'inline-block',
                            borderRadius: '4px',
                            padding: '2px 6px'
                          }}
                        >
                          {currSymbol}{Number(idx.last || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--bull-green)', fontSize: '0.85rem' }}>
                        {currSymbol}{Number(idx.high || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="font-mono" style={{ color: 'var(--bear-red)', fontSize: '0.85rem' }}>
                        {currSymbol}{Number(idx.low || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {isBull ? '+' : ''}{idx.chg !== undefined && idx.chg !== null ? Number(idx.chg).toFixed(2) : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className={`status-pill ${isBull ? 'bg-bull' : 'bg-bear'}`}
                        style={{ display: 'inline-flex', padding: '0.25rem 0.55rem', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        {isBull ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isBull ? '+' : ''}{Number(idx.chgPercent ?? 0).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span className="status-dot online" style={{ width: '6px', height: '6px' }} />
                        <span className="font-mono">{idx.time || 'Live'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          // Map index to stock, ETF, or direct commodity
                          const sym = idx.symbol || '';
                          const mapped = sym === '^GSPC' ? 'SPY' :
                                         sym === '^IXIC' ? 'QQQ' :
                                         sym === '^DJI' ? 'DIA' :
                                         sym === '^NSEI' ? 'RELIANCE' :
                                         sym === '^BSESN' ? 'TCS' :
                                         sym.startsWith('^') ? 'AAPL' : sym;
                          onSelectSymbol && onSelectSymbol(mapped);
                        }}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <Zap size={12} style={{ color: 'var(--accent-cyan)' }} /> View Chart
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

export default GlobalIndicesDesk;
