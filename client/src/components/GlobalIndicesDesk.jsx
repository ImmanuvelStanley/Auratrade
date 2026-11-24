import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CountryFlag } from './CountryFlag';
import { useSocket } from '../context/SocketContext';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Building2,
  Calendar
} from 'lucide-react';

import { DEFAULT_GLOBAL_INDICES_DATA } from '../data/defaultGlobalIndices';

export const WORLD_EXCHANGES = [
  { city: 'New York', country: 'United States', countryCode: 'US', exchange: 'NYSE / NASDAQ', timeZone: 'America/New_York', openHour: 9.5, closeHour: 16.0, benchmark: 'S&P 500 (^GSPC)', flag: '🇺🇸' },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', exchange: 'London Stock Exchange (LSE)', timeZone: 'Europe/London', openHour: 8.0, closeHour: 16.5, benchmark: 'FTSE 100 (^FTSE)', flag: '🇬🇧' },
  { city: 'Frankfurt', country: 'Germany', countryCode: 'DE', exchange: 'Deutsche Börse (XETRA)', timeZone: 'Europe/Berlin', openHour: 9.0, closeHour: 17.5, benchmark: 'DAX 40 (^GDAXI)', flag: '🇩🇪' },
  { city: 'Tokyo', country: 'Japan', countryCode: 'JP', exchange: 'Tokyo Stock Exchange (TSE)', timeZone: 'Asia/Tokyo', openHour: 9.0, closeHour: 15.5, benchmark: 'Nikkei 225 (^N225)', flag: '🇯🇵' },
  { city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', exchange: 'Hong Kong Exchanges (HKEX)', timeZone: 'Asia/Hong_Kong', openHour: 9.5, closeHour: 16.0, benchmark: 'Hang Seng (^HSI)', flag: '🇭🇰' },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', exchange: 'Singapore Exchange (SGX)', timeZone: 'Asia/Singapore', openHour: 9.0, closeHour: 17.0, benchmark: 'Straits Times (^STI)', flag: '🇸🇬' },
  { city: 'Mumbai', country: 'India', countryCode: 'IN', exchange: 'National Stock Exchange (NSE)', timeZone: 'Asia/Kolkata', openHour: 9.25, closeHour: 15.5, benchmark: 'NIFTY 50 (^NSEI)', flag: '🇮🇳' },
  { city: 'Sydney', country: 'Australia', countryCode: 'AU', exchange: 'Australian Securities (ASX)', timeZone: 'Australia/Sydney', openHour: 10.0, closeHour: 16.0, benchmark: 'S&P/ASX 200 (^AXJO)', flag: '🇦🇺' }
];

export function getSessionStatus(timeZone, openHour, closeHour) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    let weekday = '';
    let hour = 0;
    let minute = 0;
    let tzName = '';
    parts.forEach((p) => {
      if (p.type === 'weekday') weekday = p.value;
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
      if (p.type === 'timeZoneName') tzName = p.value;
    });

    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const currentDec = hour + minute / 60;
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    if (isWeekend) {
      return { status: 'CLOSED', timeStr, tzName, label: 'Weekend Closed', color: 'var(--text-muted)' };
    }
    if (currentDec >= openHour && currentDec < closeHour) {
      return { status: 'OPEN', timeStr, tzName, label: 'Trading Session Active', color: 'var(--bull-green)' };
    }
    if (currentDec >= openHour - 1.0 && currentDec < openHour) {
      return { status: 'PRE-MARKET', timeStr, tzName, label: 'Pre-Market Auction', color: 'var(--accent-cyan)' };
    }
    return { status: 'CLOSED', timeStr, tzName, label: 'Market Closed', color: 'var(--warning-amber)' };
  } catch (e) {
    return { status: 'CLOSED', timeStr: '--:--', tzName: '', label: 'Market Closed', color: 'var(--text-muted)' };
  }
}

const fmtSigned = (v, decimals = 2) => {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return '0.00';
  return `${n > 0 ? '+' : ''}${n.toFixed(decimals)}`;
};

// Module-level in-memory cache for instant zero-spinner tab switching
const globalIndicesCache = {
  all: DEFAULT_GLOBAL_INDICES_DATA,
  major: DEFAULT_GLOBAL_INDICES_DATA
};

// Map live WebSocket quote keys to GlobalIndicesDesk canonical benchmark symbols
const SOCKET_TO_INDEX_ALIAS = {
  'S&P 500': '^GSPC',
  'SPX': '^GSPC',
  'NASDAQ': '^IXIC',
  'DOW JONES': '^DJI',
  'NIFTY 50': '^NSEI',
  'NIFTY50': '^NSEI',
  'BANK NIFTY': '^NSEBANK',
  'BANKNIFTY': '^NSEBANK',
  'SENSEX': '^BSESN',
  'DAX 40': '^GDAXI',
  'FTSE 100': '^FTSE',
  'CAC 40': '^FCHI',
  'NIKKEI 225': '^N225',
  'HANG SENG': '^HSI',
  'ASX 200': '^AXJO'
};

export const GlobalIndicesDesk = React.memo(function GlobalIndicesDesk({ onSelectSymbol, isActive = true }) {
  const { quotes: socketQuotes } = useSocket();
  const [data, setData] = useState(() => globalIndicesCache['all'] || DEFAULT_GLOBAL_INDICES_DATA);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'gain_desc', 'loss_desc', 'name'
  const [activeMoversTab, setActiveMoversTab] = useState('gainers'); // 'gainers' | 'losers' | 'activeValue' | 'activeVolume'
  const prevPricesRef = useRef({});
  const isFetchingRef = useRef(false);
  const [flashingIndices, setFlashingIndices] = useState({});
  const [lastSyncedAt, setLastSyncedAt] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

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

  const applyFlashCheck = useCallback((dataset) => {
    const newFlashes = {};
    const checkItem = (sym, price) => {
      if (!sym || price === undefined || price === null) return;
      const oldVal = prevPricesRef.current[sym];
      if (oldVal !== undefined && oldVal !== price) {
        newFlashes[sym] = price > oldVal ? 'tick-flash-up' : 'tick-flash-down';
      }
      prevPricesRef.current[sym] = price;
    };
    (dataset?.indices || []).forEach(idx => checkItem(idx.symbol, idx.last));
    (dataset?.topGainers || []).forEach(idx => checkItem(idx.symbol, idx.last));
    (dataset?.topLosers || []).forEach(idx => checkItem(idx.symbol, idx.last));
    (dataset?.mostActiveValue || []).forEach(idx => checkItem(idx.symbol, idx.last));
    (dataset?.mostActiveVolume || []).forEach(idx => checkItem(idx.symbol, idx.last));

    if (Object.keys(newFlashes).length > 0) {
      setFlashingIndices(prev => ({ ...prev, ...newFlashes }));
      setTimeout(() => {
        setFlashingIndices({});
      }, 1100);
    }
  }, []);

  const fetchGlobalIndices = useCallback(async (selectedRegion = region) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch(`/api/stocks/global-indices?region=${selectedRegion}&t=${Date.now()}`);
      const json = await res.json();
      if (json.success && json.data) {
        globalIndicesCache[selectedRegion] = json.data;
        applyFlashCheck(json.data);
        setData(json.data);
        setLastSyncedAt(
          new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      }
    } catch (e) {
      console.error('Failed to load global indices:', e);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [region, applyFlashCheck]);

  // Continuous 4-second auto-sync + instant refresh on tab visibility/window focus
  useEffect(() => {
    if (!isActive) return;
    fetchGlobalIndices(region);
    const interval = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) {
        fetchGlobalIndices(region);
      }
    }, 4000);
    const handleVisibilityOrFocus = () => {
      if (!document.hidden) fetchGlobalIndices(region);
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isActive, region, fetchGlobalIndices]);

  // Real-time flash detection whenever indices data updates
  useEffect(() => {
    if (data) applyFlashCheck(data);
  }, [data, applyFlashCheck]);

  // Real-time SocketContext quote stream merge for zero-delay live index ticks
  useEffect(() => {
    if (!isActive || !socketQuotes) return;
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let anyUpdated = false;
    setData((prev) => {
      if (!prev || !Array.isArray(prev.indices) || prev.indices.length === 0) return prev;
      let changed = false;
      const updateList = (arr) =>
        (arr || []).map((item) => {
          if (!item) return item;
          const sock =
            socketQuotes[item.symbol] ||
            Object.entries(SOCKET_TO_INDEX_ALIAS).reduce((acc, [k, v]) => (v === item.symbol && socketQuotes[k] ? socketQuotes[k] : acc), null);
          if (!sock || typeof sock.price !== 'number' || sock.price === item.last) return item;
          changed = true;
          const prevClose = Number(sock.previousClose) || (item.last - item.chg) || sock.price;
          const newChg = typeof sock.change === 'number' ? sock.change : parseFloat((sock.price - prevClose).toFixed(2));
          const newChgPct = typeof sock.changePercent === 'number' ? sock.changePercent : (prevClose > 0 ? parseFloat(((newChg / prevClose) * 100).toFixed(2)) : item.chgPercent);
          return {
            ...item,
            last: parseFloat(sock.price.toFixed(2)),
            chg: parseFloat(newChg.toFixed(2)),
            chgPercent: parseFloat(newChgPct.toFixed(2)),
            high: Math.max(Number(item.high) || sock.price, sock.price),
            low: Math.min(Number(item.low) || sock.price, sock.price),
            time: nowTimeStr,
            trend: newChg >= 0 ? 'bull' : 'bear'
          };
        });

      const updatedIndices = updateList(prev.indices);
      if (!changed) return prev;
      anyUpdated = true;
      return {
        ...prev,
        indices: updatedIndices,
        topGainers: updateList(prev.topGainers),
        topLosers: updateList(prev.topLosers),
        mostActiveValue: updateList(prev.mostActiveValue),
        mostActiveVolume: updateList(prev.mostActiveVolume)
      };
    });
    if (anyUpdated) setLastSyncedAt(nowTimeStr);
  }, [isActive, socketQuotes]);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span
            className="status-pill"
            title="Live Auto-Sync Timestamp"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              borderColor: 'rgba(16, 185, 129, 0.35)',
              color: 'var(--bull-green)',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '0.4rem 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <span className="status-dot online" />
            <span className="font-mono" data-testid="global-sync-time">{lastSyncedAt}</span>
          </span>
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
              {fmtSigned(summary?.topGainer?.chgPercent)}%
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
              {fmtSigned(summary?.topLoser?.chgPercent)}%
            </span>
          </div>
        </div>
      </div>

      {/* World Financial Centers 24-Hour Trading Sessions & Clocks */}
      <div className="glass-card" style={{ padding: '1.25rem 1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Clock size={18} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                World Financial Centers • 24-Hour Trading Sessions &amp; Clocks
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Real-time local hours, opening/closing bells, and benchmark index status
              </div>
            </div>
          </div>
          <span className="status-pill status-bull" style={{ fontSize: '0.7rem' }}>
            Multi-Timezone Engine Live
          </span>
        </div>

        <div className="world-clocks-grid">
          {WORLD_EXCHANGES.map((ex) => {
            const sess = getSessionStatus(ex.timeZone, ex.openHour, ex.closeHour);
            const isOpen = sess.status === 'OPEN';
            const isPre = sess.status === 'PRE-MARKET';

            return (
              <div
                key={ex.city}
                className="world-clock-card"
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: isOpen ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isOpen ? 'rgba(16, 185, 129, 0.28)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.55rem',
                  minHeight: '118px',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CountryFlag country={ex.country} countryCode={ex.countryCode} size="xs" />
                    <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 700 }}>{ex.city}</strong>
                  </div>
                  <span
                    className="status-pill"
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.5rem',
                      borderRadius: '4px',
                      letterSpacing: '0.2px',
                      background: isOpen ? 'rgba(16, 185, 129, 0.15)' : isPre ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                      color: isOpen ? 'var(--bull-green)' : isPre ? 'var(--accent-cyan)' : 'var(--warning-amber)'
                    }}
                  >
                    {isOpen ? '● OPEN' : isPre ? '▲ PRE-MKT' : '○ CLOSED'}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <div className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                      {sess.timeStr}
                    </div>
                    {sess.tzName && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {sess.tzName}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ex.exchange}
                  </div>
                </div>

                <div style={{ paddingTop: '0.4rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Benchmark</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ex.benchmark}</span>
                </div>
              </div>
            );
          })}
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
                        <CountryFlag country={stock.country} countryCode={stock.countryCode} symbol={stock.symbol || symKey} countryFlag={stock.countryFlag} size="md" />
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
                        {stock.chg !== undefined && stock.chg !== null ? fmtSigned(stock.chg) : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className={`status-pill ${isBull ? 'bg-bull' : 'bg-bear'}`}
                        style={{ display: 'inline-flex', padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        {fmtSigned(stock.chgPercent)}%
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
              className={`btn ${region === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => handleRegionChange('all')}
            >
              All Global Indices
            </button>
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
              <span>Commodities & Metals</span>
            </button>
          </div>

          {/* Search and Sort controls */}
          <div className="global-controls-cluster" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                id="global-indices-filter-input"
                name="globalIndicesFilter"
                autoComplete="off"
                placeholder="Filter index or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                style={{ padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.8rem' }}
              />
            </div>

            <select
              id="global-indices-sort-select"
              name="globalIndicesSort"
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
                        <CountryFlag country={idx.country} countryCode={idx.countryCode} symbol={idx.symbol || symKey} countryFlag={idx.countryFlag} size="md" />
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
                        {idx.chg !== undefined && idx.chg !== null ? fmtSigned(idx.chg) : '--'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className={`status-pill ${isBull ? 'bg-bull' : 'bg-bear'}`}
                        style={{ display: 'inline-flex', padding: '0.25rem 0.55rem', fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        {isBull ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {fmtSigned(idx.chgPercent)}%
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
                        onClick={() => handleInspectIndex(idx)}
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
