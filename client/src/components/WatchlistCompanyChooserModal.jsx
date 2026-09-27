import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Plus,
  Globe,
  TrendingUp,
  TrendingDown,
  Layers,
  Filter,
  Zap,
  Bookmark
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

// Cache market companies in module memory so subsequent modal opens are instantaneous (0ms)
let cachedMarketCompanies = null;

const MARKET_REGIONS = [
  { id: 'all', label: 'All Markets', flag: '🌐', count: '160+' },
  { id: 'north_america', label: 'North America', flag: '🇺🇸', count: '75' },
  { id: 'europe', label: 'Europe (UK / EU)', flag: '🇪🇺', count: '24' },
  { id: 'asiapac', label: 'Asia-Pacific', flag: '🇯🇵', count: '20' },
  { id: 'india_emerging', label: 'India Emerging', flag: '🇮🇳', count: '22' },
  { id: 'latam_mideast', label: 'LatAm & MidEast', flag: '🌐', count: '8' },
  { id: 'etf', label: 'ETFs & Digital', flag: '📊', count: '12' }
];

const SECTORS = [
  'All Sectors',
  'Technology',
  'Semiconductors',
  'Financial Services',
  'Consumer Cyclical',
  'Healthcare',
  'Energy',
  'Communication Services',
  'Index ETF',
  'Consumer Defensive',
  'Industrials'
];

export function WatchlistCompanyChooserModal({
  isOpen,
  onClose,
  watchlistSymbols = [],
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onSelectSymbol
}) {
  const { quotes } = useSocket();
  const [companies, setCompanies] = useState(cachedMarketCompanies || []);
  const [loading, setLoading] = useState(!cachedMarketCompanies);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [searchQuery, setSearchQuery] = useState('');

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch market catalog if not already cached
  useEffect(() => {
    if (!isOpen) return;
    if (cachedMarketCompanies && cachedMarketCompanies.length > 0) {
      setCompanies(cachedMarketCompanies);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchAllMarkets() {
      setLoading(true);
      try {
        const res = await fetch('/api/stocks/all-markets');
        const json = await res.json();
        if (json.success && json.data && Array.isArray(json.data.companies)) {
          cachedMarketCompanies = json.data.companies;
          if (isMounted) setCompanies(json.data.companies);
        }
      } catch (err) {
        console.error('Failed to load market companies for watchlist chooser:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAllMarkets();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Filter companies based on client needs
  const filteredCompanies = useMemo(() => {
    let list = companies;

    if (selectedRegion !== 'all') {
      list = list.filter((c) => c.region === selectedRegion);
    }

    if (selectedSector !== 'All Sectors') {
      list = list.filter((c) => c.sector === selectedSector);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.symbol?.toLowerCase().includes(q) ||
          c.name?.toLowerCase().includes(q) ||
          c.country?.toLowerCase().includes(q) ||
          c.exchange?.toLowerCase().includes(q) ||
          c.sector?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [companies, selectedRegion, selectedSector, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="watchlist-chooser-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1rem clamp(0.75rem, 2.5vw, 1.5rem)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            gap: '0.75rem',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                flexShrink: 0
              }}
            >
              <Globe size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-brand)',
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2
                  }}
                >
                  Watchlist
                </h2>
                <span
                  className="badge-pill"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--bull-green)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {watchlistSymbols.length} Monitored
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>
                Choose companies across global markets & regional exchanges to customize your live streaming desk
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Close"
            style={{ width: '34px', height: '34px', minWidth: '34px', color: 'var(--text-secondary)', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* REGIONAL MARKET SELECTOR TABS */}
        <div
          style={{
            padding: '0.65rem clamp(0.75rem, 2.5vw, 1.5rem)',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-input)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginRight: '0.2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Filter size={12} style={{ color: 'var(--accent-cyan)' }} />
            Market:
          </span>

          {MARKET_REGIONS.map((reg) => {
            const isActive = selectedRegion === reg.id;
            return (
              <button
                key={reg.id}
                type="button"
                onClick={() => setSelectedRegion(reg.id)}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.25))'
                    : 'var(--bg-card)',
                  color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                  border: isActive
                    ? '1px solid rgba(6, 182, 212, 0.5)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{reg.label}</span>
              </button>
            );
          })}
        </div>

        {/* SEARCH & SECTOR FILTER CONTROL BAR */}
        <div
          style={{
            padding: '0.75rem clamp(0.75rem, 2.5vw, 1.5rem)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem',
            flexShrink: 0
          }}
        >
          {/* Real-time Search Input */}
          <div
            style={{
              flex: '1 1 200px',
              minWidth: '160px',
              maxWidth: '460px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              boxSizing: 'border-box'
            }}
          >
            <Search size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search ticker, company or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                width: '100%',
                minWidth: 0
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSearchQuery('')}
                style={{ width: '20px', height: '20px', padding: 0, flexShrink: 0 }}
                title="Clear Search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Sector Dropdown & Count Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Sector:</span>
              <select
                className="custom-input"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                style={{
                  padding: '0.35rem 1.6rem 0.35rem 0.55rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  minWidth: '110px'
                }}
              >
                {SECTORS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-input)',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap'
              }}
            >
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredCompanies.length}</strong> of {companies.length} assets
            </div>
          </div>
        </div>

        {/* SCROLLABLE COMPANY CARDS GRID */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '1rem clamp(0.75rem, 2.5vw, 1.5rem)',
            boxSizing: 'border-box',
            width: '100%'
          }}
        >
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem', width: '28px', height: '28px' }} />
              Loading verified companies across global market exchanges...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div
              style={{
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: 'var(--bg-input)',
                borderRadius: '12px',
                border: '1px dashed var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                No companies found
              </div>
              <p style={{ fontSize: '0.82rem', margin: '0 auto 1rem', maxWidth: '400px' }}>
                No assets matched your search "{searchQuery}" in the selected market filter.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedRegion('all');
                  setSelectedSector('All Sectors');
                  setSearchQuery('');
                }}
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
                gap: '0.75rem',
                width: '100%'
              }}
            >
              {filteredCompanies.map((c) => {
                const inWatchlist = watchlistSymbols.includes(c.symbol);
                const live = quotes[c.symbol];
                const price = Number(live?.price ?? c.price) || 0;
                const changePercent = Number(live?.changePercent ?? c.changePercent) || 0;
                const isBull = changePercent >= 0;

                return (
                  <div
                    key={c.symbol}
                    style={{
                      background: inWatchlist ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-input)',
                      border: inWatchlist ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '0.85rem 0.95rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.18s ease',
                      position: 'relative',
                      minWidth: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Top Row: Country Flag, Market Exchange & Ticker */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', gap: '0.4rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, overflow: 'hidden' }}>
                          <span style={{ fontSize: '1.05rem', flexShrink: 0 }}>{c.countryFlag || '🌐'}</span>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontFamily: 'var(--font-mono)',
                              padding: '0.1rem 0.4rem',
                              background: 'var(--bg-card)',
                              borderRadius: '4px',
                              color: 'var(--accent-cyan)',
                              border: '1px solid var(--border-subtle)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {c.exchange || 'Global'} • {c.currency || 'USD'}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {c.marketCapFormatted || ''}
                        </span>
                      </div>

                      {/* Symbol & Sector */}
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.4rem', marginBottom: '0.2rem', minWidth: 0 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            letterSpacing: '0.02em',
                            cursor: onSelectSymbol ? 'pointer' : 'default',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                          onClick={() => onSelectSymbol && onSelectSymbol(c.symbol)}
                        >
                          {c.symbol}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.35rem',
                            background: 'var(--bg-card)',
                            borderRadius: '4px',
                            color: 'var(--text-secondary)',
                            maxWidth: '120px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flexShrink: 0
                          }}
                          title={c.sector}
                        >
                          {c.sector}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          marginBottom: '0.75rem'
                        }}
                        title={c.name}
                      >
                        {c.name}
                      </div>
                    </div>

                    {/* Bottom Row: Price & 1-Click Action Button */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.45rem',
                        paddingTop: '0.6rem',
                        borderTop: '1px solid var(--border-subtle)',
                        marginTop: 'auto',
                        minWidth: 0
                      }}
                    >
                      {/* Price & Change Pill */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexShrink: 0 }}>
                        <span className="font-mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span
                          className={`quote-change-pill ${isBull ? 'bull' : 'bear'}`}
                          style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}
                        >
                          {isBull ? '+' : ''}
                          {changePercent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Add/Remove Action Button */}
                      {inWatchlist ? (
                        <button
                          type="button"
                          className="watchlist-action-btn in-watchlist"
                          onClick={() => onRemoveFromWatchlist(c.symbol)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--bull-green)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                          title="Click to remove from your watchlist"
                        >
                          <Check size={12} />
                          <span>In Watchlist</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="watchlist-action-btn add"
                          onClick={() => onAddToWatchlist(c.symbol)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.25)',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                          title="Add to personal watchlist"
                        >
                          <Plus size={13} />
                          <span>Add to Watchlist</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '0.85rem clamp(0.75rem, 2.5vw, 1.5rem)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            background: 'var(--bg-card)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Zap size={14} style={{ color: '#10b981' }} fill="currentColor" />
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>{watchlistSymbols.length}</strong> companies actively streaming in your Live Watchlist
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{
              padding: '0.45rem 1.3rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default WatchlistCompanyChooserModal;
