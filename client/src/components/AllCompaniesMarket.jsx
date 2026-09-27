import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  Zap,
  Bookmark,
  Bell,
  ExternalLink,
  DollarSign,
  Layers,
  BarChart2,
  PieChart,
  LayoutGrid,
  List,
  Globe,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Scale,
  Download,
  X,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { defaultAllCompanies } from '../data/defaultAllCompanies';

// Helper to map country or asset to institutional ISO country/market code
const getCountryCode = (country, symbol) => {
  if (!country) return symbol ? String(symbol).slice(0, 2).toUpperCase() : 'GL';
  const c = String(country).trim().toLowerCase();
  if (c.includes('united states') || c === 'usa' || c === 'us') return 'US';
  if (c.includes('taiwan')) return 'TW';
  if (c.includes('saudi')) return 'SA';
  if (c.includes('japan')) return 'JP';
  if (c.includes('netherlands')) return 'NL';
  if (c.includes('denmark')) return 'DK';
  if (c.includes('germany')) return 'DE';
  if (c.includes('france')) return 'FR';
  if (c.includes('united kingdom') || c.includes('uk')) return 'GB';
  if (c.includes('india')) return 'IN';
  if (c.includes('switzerland')) return 'CH';
  if (c.includes('south korea') || c.includes('korea')) return 'KR';
  if (c.includes('canada')) return 'CA';
  if (c.includes('australia')) return 'AU';
  if (c.includes('brazil')) return 'BR';
  if (c.includes('italy')) return 'IT';
  if (c.includes('china') || c.includes('hong kong')) return 'CN';
  if (c.includes('global') || c.includes('crypto') || c.includes('digital') || c.includes('etf') || c.includes('europe')) return 'GL';
  return String(country).trim().substring(0, 2).toUpperCase() || 'GL';
};

// ============================================================================
// SIDE-BY-SIDE MULTI-ASSET COMPARISON MODAL
// ============================================================================
function ComparisonModal({ isOpen, onClose, symbols, allCompanies, onSelectSymbol, onOpenTradeModal, onRemoveSymbol }) {
  if (!isOpen || !symbols || symbols.length === 0) return null;
  const comparedAssets = symbols.map(sym => allCompanies.find(c => c.symbol === sym)).filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '1060px', width: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
              <Scale size={20} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>
                Institutional Multi-Asset Showdown
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Side-by-side valuation, quantitative 30-day forecasts, dividend yields, and risk analysis
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close Comparison">
            <X size={18} />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="comparison-grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, comparedAssets.length)}, minmax(240px, 1fr))` }}>
          {comparedAssets.map(c => {
            const price = Number(c.price) || 0;
            const change = Number(c.change) || 0;
            const changePercent = Number(c.changePercent) || 0;
            const isPos = change >= 0;
            const low52 = Number(c.low52) || (price ? parseFloat((price * 0.85).toFixed(2)) : 50);
            const high52 = Number(c.high52) || (price ? parseFloat((price * 1.15).toFixed(2)) : 150);
            const rangeDiff = high52 - low52 || 1;
            const posPercent = Math.min(100, Math.max(0, ((price - low52) / rangeDiff) * 100));
            const forecastGain = typeof c.forecastGainPercent === 'number' ? c.forecastGainPercent : (Number(c.forecastGainPercent) || 7.5);
            const forecastTarget = typeof c.forecastPrice30d === 'number' ? c.forecastPrice30d : parseFloat((price * (1 + forecastGain / 100)).toFixed(2));

            return (
              <div key={c.symbol} className="comparison-column">
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', padding: '0.1rem 0.4rem', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: 'var(--accent-cyan)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {getCountryCode(c.country, c.symbol)}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.exchange}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-brand)' }}>
                      {c.symbol}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      {c.name}
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
                    onClick={() => onRemoveSymbol(c.symbol)}
                    title="Remove from comparison"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Live Price Box */}
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,252,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Live Market Price</span>
                    <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                      <Zap size={9} fill="currentColor" /> LIVE
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span className={`tick-text ${c.lastTickDirection || 'neutral'} font-mono`} style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                      ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`quote-change-pill ${isPos ? 'bull' : 'bear'}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                      {isPos ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Metric comparisons */}
                <div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Market Capitalization</span>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{c.marketCapFormatted}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">P/E Ratio</span>
                    <span className="font-mono">{c.peRatio > 0 ? `${c.peRatio}x` : 'N/A'}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Dividend Yield</span>
                    <span className="font-mono" style={{ color: 'var(--bull-green)', fontWeight: 600 }}>{c.dividendYield || '0.0%'}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Sector</span>
                    <span style={{ fontSize: '0.78rem' }}>{c.sector}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Analyst Consensus</span>
                    <span className="badge-pill" style={{ fontSize: '0.7rem', background: c.rating === 'STRONG BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.15)', color: c.rating === 'STRONG BUY' ? 'var(--bull-green)' : 'var(--accent-cyan)' }}>
                      {c.rating} ({c.ratingScore || 85})
                    </span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">30D AI Expected Target</span>
                    <span className="font-mono" style={{ color: 'var(--bull-green)', fontWeight: 700 }}>
                      ${forecastTarget.toFixed(2)} (+{forecastGain}%)
                    </span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Risk Profile</span>
                    <span style={{ fontWeight: 600, color: c.riskLevel?.includes('Low') ? 'var(--bull-green)' : 'var(--warning-amber)' }}>
                      {c.riskLevel}
                    </span>
                  </div>
                </div>

                {/* 52-Week Range */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span>52W Low: ${c.low52}</span>
                    <span>52W High: ${c.high52}</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${posPercent}%`, background: 'linear-gradient(90deg, #06b6d4, #10b981)', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* Investment Appeal */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', lineHeight: 1.45, flex: 1 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Investment Case:</strong> {c.investorAppeal}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center' }}
                    onClick={() => {
                      onClose();
                      onSelectSymbol(c.symbol);
                    }}
                  >
                    Analyze Chart
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                    onClick={() => {
                      onClose();
                      onOpenTradeModal(c.symbol);
                    }}
                  >
                    Trade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ON-DEMAND GLOBAL TICKER INGESTION MODAL
// ============================================================================
function IngestGlobalTickerModal({ isOpen, onClose, onIngestSuccess }) {
  const [tickerInput, setTickerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const popularGlobal = [
    { sym: 'SPOT', name: 'Spotify Tech', ex: 'NYSE' },
    { sym: 'ARM', name: 'Arm Holdings', ex: 'Nasdaq' },
    { sym: 'RACE', name: 'Ferrari N.V.', ex: 'NYSE' },
    { sym: 'PLTR', name: 'Palantir Tech', ex: 'NYSE' },
    { sym: 'UBER', name: 'Uber Tech', ex: 'NYSE' },
    { sym: 'COIN', name: 'Coinbase Global', ex: 'Nasdaq' },
    { sym: 'SHEL.L', name: 'Shell plc', ex: 'LSE' },
    { sym: '7203.T', name: 'Toyota Motor', ex: 'Tokyo' },
    { sym: 'BABA', name: 'Alibaba Group', ex: 'NYSE' }
  ];

  const handleIngest = async (symbolToIngest) => {
    const sym = (symbolToIngest || tickerInput).trim().toUpperCase();
    if (!sym) {
      setError('Please provide a valid stock ticker symbol.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const res = await fetch('/api/stocks/fetch-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuccess(json.data);
        onIngestSuccess(json.data);
      } else {
        setError(json.error || 'Failed to ingest global ticker.');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="ingest-modal-card"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="glass-card-header" style={{ padding: '1.1rem 1.45rem', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Globe size={18} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-brand)', fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Ingest Worldwide Asset
              </h3>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Universal live Yahoo Finance connection across global exchanges
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body - Perfect Fit & Clean Hierarchy */}
        <div className="ingest-modal-body">
          {/* STEP 1: Main Search & Ingest Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleIngest(); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Search size={13} style={{ color: 'var(--accent-cyan)' }} />
                Enter Company Symbol / Ticker:
              </label>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Real-Time Feeds
              </span>
            </div>

            {/* Integrated Search Input Container */}
            <div style={{
              display: 'flex',
              gap: '0.45rem',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.3rem',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <input
                type="text"
                className="font-mono"
                placeholder="e.g. SPOT, ARM, RACE, SHEL.L, 7203.T"
                value={tickerInput}
                onChange={e => setTickerInput(e.target.value.toUpperCase())}
                disabled={loading}
                autoFocus
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !tickerInput.trim()}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
                  border: 'none',
                  cursor: loading || !tickerInput.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }} />
                    <span>Ingesting...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={15} />
                    <span>Ingest Live</span>
                  </>
                )}
              </button>
            </div>

            {/* Clickable Quick Format Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>Examples:</span>
              {[
                { label: 'US (SPOT)', hint: 'SPOT' },
                { label: 'London (SHEL.L)', hint: 'SHEL.L' },
                { label: 'Tokyo (7203.T)', hint: '7203.T' },
                { label: 'Paris (MC.PA)', hint: 'MC.PA' },
                { label: 'India (RELIANCE.NS)', hint: 'RELIANCE.NS' }
              ].map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setTickerInput(chip.hint)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    padding: '0.15rem 0.45rem',
                    fontSize: '0.67rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--accent-cyan)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)';
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </form>

          {/* STEP 2: Live Feedback Alert Area */}
          {error && (
            <div style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(244,63,94,0.12)',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem 0.9rem',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.35)',
              borderRadius: 'var(--radius-md)',
              color: '#6ee7b7',
              fontSize: '0.8rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                <CheckCircle2 size={15} style={{ color: '#10b981' }} />
                <span>Successfully Ingested {success.symbol} ({success.name})</span>
              </div>
              <div style={{ fontSize: '0.73rem', color: '#a7f3d0' }}>
                Price: ${success.price} • Market Cap: {success.marketCapFormatted} • Exchange: {success.exchange} ({success.currency})
              </div>
            </div>
          )}

          {/* STEP 3: Popular Worldwide Suggestions (1-Click Add) */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Popular Worldwide Tickers (1-Click Add):
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Zap size={11} fill="currentColor" /> Click to ingest
              </span>
            </div>

            {/* 3x3 Perfectly Fitted Suggestion Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.55rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {popularGlobal.map(item => (
                <button
                  key={item.sym}
                  type="button"
                  className="ingest-card-item"
                  onClick={() => {
                    setTickerInput(item.sym);
                    handleIngest(item.sym);
                  }}
                  disabled={loading}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {item.sym}
                    </span>
                    <span style={{
                      fontSize: '0.63rem',
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.08rem 0.35rem',
                      background: 'rgba(6, 182, 212, 0.12)',
                      borderRadius: '3px',
                      border: '1px solid rgba(6, 182, 212, 0.22)'
                    }}>
                      {item.ex}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    fontFamily: 'var(--font-sans)'
                  }}>
                    {item.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: Institutional Reassurance Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            paddingTop: '0.4rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.69rem',
            color: 'var(--text-muted)'
          }}>
            <Zap size={11} style={{ color: '#10b981' }} />
            <span>Real-time quotes update with live ticks and persist across your session.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MEMOIZED TABLE ROW (With Direct Alert, Compare & Column Views)
// ============================================================================
const MarketTableRow = React.memo(
  function MarketTableRow({
    c,
    isInWatchlist,
    isCompared,
    columnView,
    onSelectSymbol,
    onOpenTradeModal,
    onOpenAlertModal,
    onAddToWatchlist,
    onRemoveFromWatchlist,
    onToggleCompare
  }) {
    const price = Number(c.price) || 0;
    const change = Number(c.change) || 0;
    const changePercent = Number(c.changePercent) || 0;
    const isPos = change >= 0;
    const low52 = Number(c.low52) || (price ? parseFloat((price * 0.85).toFixed(2)) : 50);
    const high52 = Number(c.high52) || (price ? parseFloat((price * 1.15).toFixed(2)) : 150);
    const rangeDiff = high52 - low52 || 1;
    const posPercent = Math.min(100, Math.max(0, ((price - low52) / rangeDiff) * 100));
    const forecastGain = typeof c.forecastGainPercent === 'number' ? c.forecastGainPercent : (Number(c.forecastGainPercent) || 7.5);
    const forecastTarget = typeof c.forecastPrice30d === 'number' ? c.forecastPrice30d : parseFloat((price * (1 + forecastGain / 100)).toFixed(2));
    const volume = Number(c.volume) || 0;
    const dayHigh = Number(c.dayHigh) || (price ? parseFloat((price * 1.01).toFixed(2)) : 0);
    const dayLow = Number(c.dayLow) || (price ? parseFloat((price * 0.99).toFixed(2)) : 0);
    const dayRangeDiff = dayHigh - dayLow || 1;
    const dayPosPercent = Math.min(100, Math.max(0, ((price - dayLow) / dayRangeDiff) * 100));
    const prevClose = Number(c.previousClose) || (price ? parseFloat((price - change).toFixed(2)) : 0);
    const formatVolume = (v) => { if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'; if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'; return String(v); };

    return (
      <tr className="market-row" onClick={() => onSelectSymbol(c.symbol)}>
        {/* Compare Checkbox */}
        <td style={{ width: '38px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onToggleCompare(c.symbol)}
            title="Select to compare (max 4 assets)"
            style={{ cursor: 'pointer', accentColor: 'var(--accent-cyan)', width: '15px', height: '15px' }}
          />
        </td>

        {/* Company Info with Country Flag */}
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                fontSize: '0.75rem',
                color: 'var(--accent-cyan)',
                letterSpacing: '0.04em',
                flexShrink: 0
              }}
            >
              {getCountryCode(c.country, c.symbol)}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                {c.symbol}
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    padding: '0.1rem 0.35rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px'
                  }}
                >
                  {c.sector}
                </span>
                {c.tier && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: c.tier?.includes('Mega') ? '#38bdf8' : c.tier?.includes('Large') ? '#a78bfa' : 'var(--text-muted)',
                      fontWeight: 600,
                      padding: '0.08rem 0.3rem',
                      background: c.tier?.includes('Mega') ? 'rgba(56, 189, 248, 0.1)' : c.tier?.includes('Large') ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255,255,255,0.04)',
                      borderRadius: '3px',
                      border: `1px solid ${c.tier?.includes('Mega') ? 'rgba(56, 189, 248, 0.2)' : c.tier?.includes('Large') ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.08)'}`
                    }}
                  >
                    {c.tier?.includes('Mega') ? 'MEGA' : c.tier?.includes('Large') ? 'LARGE' : c.tier?.includes('Growth') ? 'GROWTH' : c.tier?.includes('Index') ? 'INDEX' : ''}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '190px'
                }}
              >
                {c.name}
              </div>
            </div>
          </div>
        </td>

        {/* Region / Exchange (Standard view) */}
        {columnView === 'standard' && (
          <td>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>{c.country}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {c.exchange} • {c.currency}
              </div>
            </div>
          </td>
        )}

        {/* Market Cap (Always visible) */}
        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
          {c.marketCapFormatted}
        </td>

        {/* Live Price with verified indicator */}
        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>
          <div className={`tick-text ${c.lastTickDirection || 'neutral'}`}>
            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem',
              justifyContent: 'flex-end',
              fontWeight: 600
            }}
          >
            <Zap size={9} fill="currentColor" /> LIVE
          </div>
        </td>

        {/* 24h Change */}
        <td style={{ textAlign: 'right' }}>
          <div className={`quote-change-pill ${isPos ? 'bull' : 'bear'}`} style={{ display: 'inline-flex', padding: '0.2rem 0.55rem', fontSize: '0.8rem' }}>
            {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isPos ? '+' : ''}
            {changePercent.toFixed(2)}%
          </div>
        </td>

        {/* Volume (Always visible) */}
        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {formatVolume(volume)}
        </td>

        {/* DYNAMIC MIDDLE COLUMNS BASED ON columnView */}
        {columnView === 'standard' && (
          <>
            {/* 52-Week Range Bar */}
            <td style={{ minWidth: '120px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>${low52}</span>
                  <span>${high52}</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${posPercent}%`,
                      background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            </td>

            {/* Today's Day Range Bar */}
            <td style={{ minWidth: '110px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>${dayLow}</span>
                  <span>${dayHigh}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${dayPosPercent}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                      borderRadius: '2px'
                    }}
                  />
                </div>
              </div>
            </td>

            {/* P/E Ratio */}
            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {c.peRatio > 0 ? `${c.peRatio}x` : 'N/A'}
            </td>

            {/* Analyst Consensus */}
            <td style={{ textAlign: 'center' }}>
              <span
                className="badge-pill"
                style={{
                  background:
                    c.rating === 'STRONG BUY'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : c.rating === 'BUY'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                  color:
                    c.rating === 'STRONG BUY'
                      ? 'var(--bull-green)'
                      : c.rating === 'BUY'
                        ? 'var(--accent-cyan)'
                        : 'var(--warning-amber)',
                  border: `1px solid ${c.rating === 'STRONG BUY'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : c.rating === 'BUY'
                        ? 'rgba(6, 182, 212, 0.3)'
                        : 'rgba(245, 158, 11, 0.3)'
                    }`,
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}
              >
                {c.rating} ({c.ratingScore || 85})
              </span>
            </td>

            {/* 30-Day AI Target & Gain */}
            <td style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--bull-green)', fontSize: '0.88rem' }}>
                ${forecastTarget.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--bull-green)', fontWeight: 600 }}>
                +{forecastGain}% Expected
              </div>
            </td>
          </>
        )}

        {columnView === 'valuation' && (
          <>
            {/* P/E Ratio */}
            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {c.peRatio > 0 ? `${c.peRatio}x` : 'N/A'}
            </td>

            {/* Dividend Yield */}
            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--bull-green)', fontWeight: 600 }}>
              {c.dividendYield || '0.0%'}
            </td>

            {/* Previous Close */}
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ${prevClose.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>

            {/* 52W Low */}
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ${low52}
            </td>

            {/* 52W High */}
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ${high52}
            </td>

            {/* Risk Profile */}
            <td style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: c.riskLevel?.includes('Low') ? 'var(--bull-green)' : 'var(--warning-amber)' }}>
                {c.riskLevel}
              </span>
            </td>
          </>
        )}

        {columnView === 'ai_quant' && (
          <>
            {/* 30-Day AI Target */}
            <td style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--bull-green)', fontSize: '0.9rem' }}>
                ${forecastTarget.toFixed(2)}
              </div>
            </td>

            {/* AI Upside */}
            <td style={{ textAlign: 'center' }}>
              <span className="badge-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--bull-green)', fontWeight: 700, fontSize: '0.75rem' }}>
                +{forecastGain}%
              </span>
            </td>

            {/* Consensus Score */}
            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {c.ratingScore || 85}/100
            </td>

            {/* Rating */}
            <td style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: c.rating === 'STRONG BUY' ? 'var(--bull-green)' : 'var(--accent-cyan)' }}>
                {c.rating}
              </span>
            </td>

            {/* Risk Profile */}
            <td style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: c.riskLevel?.includes('Low') ? 'var(--bull-green)' : 'var(--warning-amber)' }}>
                {c.riskLevel}
              </span>
            </td>
          </>
        )}

        {/* Row Actions: Chart, Trade, Alert, Bookmark */}
        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
              title="Open in Interactive Workstation Chart"
              onClick={() => onSelectSymbol(c.symbol)}
            >
              Chart
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
              title="Execute Paper Trade"
              onClick={() => onOpenTradeModal(c.symbol)}
            >
              Trade
            </button>
            <button
              className="btn-icon"
              style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
              title="Set Live Price Alert"
              onClick={() => onOpenAlertModal && onOpenAlertModal(c.symbol)}
            >
              <Bell size={13} />
            </button>
            <button
              className={`btn-icon ${isInWatchlist ? 'active' : ''}`}
              style={{
                width: '28px',
                height: '28px',
                color: isInWatchlist ? 'var(--accent-cyan)' : 'var(--text-muted)'
              }}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              onClick={() => {
                if (isInWatchlist) {
                  onRemoveFromWatchlist(c.symbol);
                } else {
                  onAddToWatchlist(c.symbol);
                }
              }}
            >
              <Bookmark size={13} fill={isInWatchlist ? 'currentColor' : 'none'} />
            </button>
          </div>
        </td>
      </tr>
    );
  },
  (prev, next) => {
    return (
      prev.c.symbol === next.c.symbol &&
      prev.c.price === next.c.price &&
      prev.c.change === next.c.change &&
      prev.c.changePercent === next.c.changePercent &&
      prev.c.lastTickDirection === next.c.lastTickDirection &&
      prev.isInWatchlist === next.isInWatchlist &&
      prev.isCompared === next.isCompared &&
      prev.columnView === next.columnView
    );
  }
);

// ============================================================================
// MEMOIZED INVESTOR CARD (With Compare Checkbox & Direct Alert Action)
// ============================================================================
const MarketInvestorCard = React.memo(
  function MarketInvestorCard({
    c,
    isInWatchlist,
    isCompared,
    onSelectSymbol,
    onOpenTradeModal,
    onOpenAlertModal,
    onAddToWatchlist,
    onRemoveFromWatchlist,
    onToggleCompare
  }) {
    const price = Number(c.price) || 0;
    const change = Number(c.change) || 0;
    const changePercent = Number(c.changePercent) || 0;
    const isPos = change >= 0;
    const low52 = Number(c.low52) || (price ? parseFloat((price * 0.85).toFixed(2)) : 50);
    const high52 = Number(c.high52) || (price ? parseFloat((price * 1.15).toFixed(2)) : 150);
    const rangeDiff = high52 - low52 || 1;
    const posPercent = Math.min(100, Math.max(0, ((price - low52) / rangeDiff) * 100));
    const forecastGain = typeof c.forecastGainPercent === 'number' ? c.forecastGainPercent : (Number(c.forecastGainPercent) || 7.5);
    const forecastTarget = typeof c.forecastPrice30d === 'number' ? c.forecastPrice30d : parseFloat((price * (1 + forecastGain / 100)).toFixed(2));
    const volume = Number(c.volume) || 0;
    const dayHigh = Number(c.dayHigh) || (price ? parseFloat((price * 1.01).toFixed(2)) : 0);
    const dayLow = Number(c.dayLow) || (price ? parseFloat((price * 0.99).toFixed(2)) : 0);
    const dayRangeDiff = dayHigh - dayLow || 1;
    const dayPosPercent = Math.min(100, Math.max(0, ((price - dayLow) / dayRangeDiff) * 100));
    const prevClose = Number(c.previousClose) || (price ? parseFloat((price - change).toFixed(2)) : 0);
    const formatVolume = (v) => { if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'; if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'; return String(v); };

    return (
      <div className={`glass-card investor-card ${isCompared ? 'compared' : ''}`} onClick={() => onSelectSymbol(c.symbol)}>
        <div className="glass-card-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          {/* Top Bar: Rank, Header & Compare Checkbox */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-brand)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', padding: '0.12rem 0.35rem', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--accent-cyan)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {getCountryCode(c.country, c.symbol)}
                    </span>
                    <span>{c.symbol}</span>
                    {c.tier && (
                      <span
                        style={{
                          fontSize: '0.58rem',
                          color: c.tier?.includes('Mega') ? '#38bdf8' : c.tier?.includes('Large') ? '#a78bfa' : 'var(--text-muted)',
                          fontWeight: 600,
                          padding: '0.06rem 0.25rem',
                          background: c.tier?.includes('Mega') ? 'rgba(56, 189, 248, 0.1)' : c.tier?.includes('Large') ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255,255,255,0.04)',
                          borderRadius: '3px',
                          border: `1px solid ${c.tier?.includes('Mega') ? 'rgba(56, 189, 248, 0.2)' : c.tier?.includes('Large') ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.08)'}`
                        }}
                      >
                        {c.tier?.includes('Mega') ? 'MEGA' : c.tier?.includes('Large') ? 'LARGE' : c.tier?.includes('Growth') ? 'GROWTH' : c.tier?.includes('Index') ? 'INDEX' : ''}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                    {c.name}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isCompared}
                    onChange={() => onToggleCompare(c.symbol)}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span>Compare</span>
                </label>
                <span
                  className="badge-pill"
                  style={{
                    background: c.rating === 'STRONG BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                    color: c.rating === 'STRONG BUY' ? 'var(--bull-green)' : 'var(--accent-cyan)',
                    border: `1px solid ${c.rating === 'STRONG BUY' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}
                >
                  {c.rating || 'BUY'}
                </span>
              </div>
            </div>

            {/* Price and 24h Change */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div className="font-mono" style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                <span className={`tick-text ${c.lastTickDirection || 'neutral'}`}>
                  ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#10b981', marginLeft: '0.4rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  <Zap size={9} fill="currentColor" /> LIVE
                </span>
              </div>
              <div className={`quote-change-pill ${isPos ? 'bull' : 'bear'}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.55rem' }}>
                {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPos ? '+' : ''}
                {changePercent.toFixed(2)}%
              </div>
            </div>

            {/* Institutional Key Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '0.85rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Market Cap</div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {c.marketCapFormatted}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Volume</div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {formatVolume(volume)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Prev Close</div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  ${prevClose.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>P/E Ratio</div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {c.peRatio > 0 ? `${c.peRatio}x` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Dividend Yield</div>
                <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bull-green)' }}>
                  {c.dividendYield || '0.0%'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Risk Profile</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: c.riskLevel?.includes('Low') ? 'var(--bull-green)' : 'var(--warning-amber)' }}>
                  {c.riskLevel}
                </div>
              </div>
            </div>

            {/* Today's Day Range */}
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <span>Day Low: ${dayLow}</span>
                <span>Day High: ${dayHigh}</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${dayPosPercent}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                    borderRadius: '2px'
                  }}
                />
              </div>
            </div>

            {/* 52-Week Range Progress */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <span>52W Low: ${low52}</span>
                <span>52W High: ${high52}</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${posPercent}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                    borderRadius: '2px'
                  }}
                />
              </div>
            </div>

            {/* AI Expected 30-Day Growth Card */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.55rem 0.75rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} style={{ color: 'var(--bull-green)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--bull-green)' }}>30D AI Target:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                  ${forecastTarget.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--bull-green)', fontWeight: 700 }}>
                  +{forecastGain}%
                </span>
              </div>
            </div>

            {/* Key Investment Thesis */}
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1rem', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Investment Case:</strong> {c.investorAppeal}
            </div>
          </div>

          {/* Card Action Buttons: Chart, Trade, Alert, Bookmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', justifyContent: 'center' }}
              onClick={() => onSelectSymbol(c.symbol)}
            >
              Analyze Chart
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
              onClick={() => onOpenTradeModal(c.symbol)}
            >
              Trade
            </button>
            <button
              className="btn-icon"
              style={{ width: '34px', height: '34px', color: 'var(--text-muted)' }}
              title="Set Price Alert"
              onClick={() => onOpenAlertModal && onOpenAlertModal(c.symbol)}
            >
              <Bell size={15} />
            </button>
            <button
              className={`btn-icon ${isInWatchlist ? 'active' : ''}`}
              style={{
                width: '34px',
                height: '34px',
                color: isInWatchlist ? 'var(--accent-cyan)' : 'var(--text-muted)'
              }}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              onClick={() => {
                if (isInWatchlist) {
                  onRemoveFromWatchlist(c.symbol);
                } else {
                  onAddToWatchlist(c.symbol);
                }
              }}
            >
              <Bookmark size={15} fill={isInWatchlist ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.c.symbol === next.c.symbol &&
      prev.c.price === next.c.price &&
      prev.c.change === next.c.change &&
      prev.c.changePercent === next.c.changePercent &&
      prev.c.lastTickDirection === next.c.lastTickDirection &&
      prev.c.rank === next.c.rank &&
      prev.isInWatchlist === next.isInWatchlist &&
      prev.isCompared === next.isCompared
    );
  }
);

// ============================================================================
// PAGINATION CONTROLS BAR
// ============================================================================
function PaginationControls({
  currentPage = 1,
  totalPages = 1,
  pageSize = 24,
  totalItems = 0,
  onPageChange,
  onPageSizeChange
}) {
  if (!totalItems || totalItems <= 0) return null;
  const isAll = pageSize === 'all';
  const numericSize = isAll ? totalItems : (Number(pageSize) || 24);
  const safeTotalPages = isAll ? 1 : (Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : 1);
  const safeCurrentPage = Math.max(1, Math.min(Number(currentPage) || 1, safeTotalPages));

  const startItem = totalItems === 0 ? 0 : (isAll ? 1 : (safeCurrentPage - 1) * numericSize + 1);
  const endItem = isAll ? totalItems : Math.min(safeCurrentPage * numericSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.65rem 1rem',
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.8rem',
        margin: '0.5rem 0'
      }}
    >
      <div style={{ color: 'var(--text-secondary)' }}>
        Showing <strong style={{ color: 'var(--text-primary)' }}>{startItem}–{endItem}</strong> of <strong style={{ color: 'var(--accent-cyan)' }}>{totalItems}</strong> global assets
      </div>

      {!isAll && safeTotalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', opacity: safeCurrentPage === 1 ? 0.35 : 1, cursor: safeCurrentPage === 1 ? 'default' : 'pointer' }}
            disabled={safeCurrentPage === 1}
            onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
          >
            <ChevronLeft size={13} /> Prev
          </button>

          {Array.from({ length: safeTotalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === safeTotalPages || Math.abs(p - safeCurrentPage) <= 1)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span style={{ color: 'var(--text-muted)', padding: '0 0.2rem' }}>...</span>
                )}
                <button
                  className={`tier-filter-btn ${safeCurrentPage === p ? 'active' : ''}`}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.75rem',
                    minWidth: '28px',
                    borderRadius: '4px'
                  }}
                  onClick={() => onPageChange && onPageChange(p)}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}

          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', opacity: safeCurrentPage >= safeTotalPages ? 0.35 : 1, cursor: safeCurrentPage >= safeTotalPages ? 'default' : 'pointer' }}
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>View:</span>
        {[24, 48, 'all'].map((size) => (
          <button
            key={size}
            className={`tier-filter-btn ${pageSize === size ? 'active' : ''}`}
            style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem', borderRadius: '4px' }}
            onClick={() => onPageSizeChange && onPageSizeChange(size)}
          >
            {size === 'all' ? `All (${totalItems})` : `${size}/page`}
          </button>
        ))}
      </div>
    </div>
  );
}

// Module-level in-memory cache for all companies market data (pre-seeded with institutional leaders)
let allMarketMemoryCache = defaultAllCompanies;

// ============================================================================
// MAIN COMPONENT: ALL COMPANIES MARKET SCREENER
// ============================================================================
export const AllCompaniesMarket = React.memo(function AllCompaniesMarket({
  onSelectSymbol,
  onOpenTradeModal,
  onOpenAlertModal,
  watchlistSymbols,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  isActive = true
}) {
  const { quotes, subscribeBatch, unsubscribeBatch } = useSocket();
  const [marketData, setMarketData] = useState(allMarketMemoryCache || defaultAllCompanies);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState('marketCap');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [columnView, setColumnView] = useState('standard'); // 'standard' | 'valuation' | 'ai_quant'

  // Strategy Presets
  const [activePreset, setActivePreset] = useState('all'); // 'all' | 'ai_upside' | 'dividend' | 'mega_cap' | 'top_gainers' | 'strong_buy' | 'near_52w_low'

  // Compare Mode State
  const [selectedCompareSymbols, setSelectedCompareSymbols] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // High-performance O(1) lookup Sets for watchlist and comparison
  const watchlistSet = useMemo(() => new Set(watchlistSymbols || []), [watchlistSymbols]);
  const compareSet = useMemo(() => new Set(selectedCompareSymbols || []), [selectedCompareSymbols]);

  // Ingest Global Ticker Modal State
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  // High-performance pagination state
  const [pageSize, setPageSize] = useState(24); // 24, 48, or 'all'
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Download Menu State (Sheet / Document / CSV)
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    if (!isDownloadMenuOpen) return;
    const handleClickOutside = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDownloadMenuOpen]);

  // Fetch all companies from backend
  const fetchMarketData = async () => {
    try {
      if (!allMarketMemoryCache) setLoading(true);
      const queryParams = new URLSearchParams({
        region: selectedRegion,
        tier: selectedTier,
        sector: selectedSector,
        sortBy,
        order: sortOrder,
        search: searchQuery
      });
      const res = await fetch(`/api/stocks/all-markets?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setMarketData(json.data);
        if (selectedRegion === 'all' && selectedTier === 'all' && selectedSector === 'all' && !searchQuery) {
          allMarketMemoryCache = json.data;
        }
      }
    } catch (err) {
      console.error('Failed to fetch all market companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [selectedRegion, selectedTier, selectedSector, sortBy, sortOrder]);

  // Reset pagination to page 1 on filter, preset, or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegion, selectedTier, selectedSector, searchQuery, sortBy, sortOrder, activePreset, pageSize]);

  // Smart server search fallback: ONLY query backend if client-side search yields 0 matches and user typed >= 3 chars
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) return;
    // Check if client-side already found matching companies in memory
    const q = searchQuery.trim().toLowerCase();
    const hasLocalMatch = (rawCompanies || []).some(
      c => String(c?.symbol || '').toLowerCase().includes(q) || String(c?.name || '').toLowerCase().includes(q)
    );
    if (hasLocalMatch) return; // Zero network traffic needed!

    const handler = setTimeout(() => {
      fetchMarketData();
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const overview = marketData?.overview;

  // Client-side deduplication safeguard ensuring zero duplicate market rows can render
  const rawCompanies = useMemo(() => {
    const list = marketData?.companies || [];
    const seenSymbols = new Set();
    const seenNames = new Set();
    return list.filter((c) => {
      const sym = (c?.symbol || '').toUpperCase().trim();
      const name = (c?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!sym || seenSymbols.has(sym)) return false;
      if (name && seenNames.has(name)) return false;
      seenSymbols.add(sym);
      if (name) seenNames.add(name);
      return true;
    });
  }, [marketData?.companies]);

  // Sector allocation calculation for visual market cap bar
  const sectorAllocation = useMemo(() => {
    if (!rawCompanies || rawCompanies.length === 0) return [];
    const sectorTotals = {};
    let grandTotal = 0;
    rawCompanies.forEach(c => {
      const sec = c.sector || 'Other';
      const cap = c.marketCap || 0;
      sectorTotals[sec] = (sectorTotals[sec] || 0) + cap;
      grandTotal += cap;
    });

    const colors = [
      '#06b6d4', // Cyan
      '#6366f1', // Indigo
      '#10b981', // Emerald
      '#8b5cf6', // Purple
      '#f59e0b', // Amber
      '#ec4899', // Pink
      '#3b82f6', // Blue
      '#14b8a6'  // Teal
    ];

    return Object.entries(sectorTotals)
      .map(([name, cap], idx) => ({
        name,
        cap,
        percent: grandTotal > 0 ? (cap / grandTotal) * 100 : 0,
        formattedCap: `$${(cap / 1e12).toFixed(2)}T`,
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.cap - a.cap)
      .slice(0, 7); // Top 7 sectors
  }, [rawCompanies]);

  // Apply Quick Strategy Presets filter
  const presetFilteredCompanies = useMemo(() => {
    if (activePreset === 'all') return rawCompanies;
    return (rawCompanies || []).filter(c => {
      switch (activePreset) {
        case 'ai_upside':
          return (Number(c?.forecastGainPercent) || 0) >= 10;
        case 'dividend':
          return parseFloat(c?.dividendYield || 0) >= 1.5;
        case 'mega_cap':
          return (Number(c?.marketCap) || 0) >= 1000000000000;
        case 'top_gainers':
          return (Number(c?.changePercent) || 0) >= 1.0;
        case 'strong_buy':
          return c?.rating === 'STRONG BUY';
        case 'near_52w_low': {
          const high = Number(c?.high52) || 0;
          const low = Number(c?.low52) || 0;
          const price = Number(c?.price) || 0;
          const diff = high - low || 1;
          const pos = (price - low) / diff;
          return pos <= 0.25; // in bottom 25% of 52-week range
        }
        default:
          return true;
      }
    });
  }, [rawCompanies, activePreset]);

  // Instant client-side search filtering (0ms typing latency)
  const filteredRawCompanies = useMemo(() => {
    if (!presetFilteredCompanies || presetFilteredCompanies.length === 0) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return presetFilteredCompanies;
    return presetFilteredCompanies.filter(
      (c) =>
        String(c?.symbol || '').toLowerCase().includes(q) ||
        String(c?.name || '').toLowerCase().includes(q) ||
        (Array.isArray(c?.aliases) && c.aliases.some((a) => String(a || '').toLowerCase().includes(q))) ||
        ((q === 'goole' || q.startsWith('gool')) && (c?.symbol === 'GOOGL' || c?.symbol === 'GOOG')) ||
        ((q === 'facebook' || q === 'fb' || q === 'instagram' || q === 'insta') && c?.symbol === 'META') ||
        (c?.country && String(c.country).toLowerCase().includes(q)) ||
        (c?.sector && String(c.sector).toLowerCase().includes(q))
    );
  }, [presetFilteredCompanies, searchQuery]);

  // Object reference cache: preserves existing object references for un-ticked companies
  // This enables React.memo on MarketTableRow and MarketInvestorCard to skip 98%+ of DOM re-renders
  const stableCompanyCacheRef = useRef(new Map());

  // Merge live WebSocket quotes into companies list in real-time with zero-churn reference stability
  const companies = useMemo(() => {
    if (!isActive || !quotes) return filteredRawCompanies;
    const cacheMap = stableCompanyCacheRef.current;

    return (filteredRawCompanies || []).map((c) => {
      const live = quotes[c.symbol];
      const prev = cacheMap.get(c.symbol);

      if (!live) {
        if (prev && prev._rawRef === c) {
          return prev;
        }
        const safePrice = Number(c.price) || 0;
        const forecastGain = typeof c.forecastGainPercent === 'number' ? c.forecastGainPercent : (Number(c.forecastGainPercent) || 7.5);
        const forecastPrice = typeof c.forecastPrice30d === 'number' ? c.forecastPrice30d : parseFloat((safePrice * (1 + forecastGain / 100)).toFixed(2));
        const item = { ...c, price: safePrice, forecastPrice30d: forecastPrice, _rawRef: c };
        cacheMap.set(c.symbol, item);
        return item;
      }

      const livePrice = Number(live.price) || Number(c.price) || 0;
      const liveChange = Number(live.change) || 0;
      const liveChangePercent = Number(live.changePercent) || 0;
      const liveDirection = live.lastTickDirection || 'neutral';

      if (
        prev &&
        prev._rawRef === c &&
        prev.price === livePrice &&
        prev.change === liveChange &&
        prev.changePercent === liveChangePercent &&
        prev.lastTickDirection === liveDirection
      ) {
        return prev;
      }

      const forecastGain = typeof c.forecastGainPercent === 'number' ? c.forecastGainPercent : (Number(c.forecastGainPercent) || 7.5);
      const forecastPrice = parseFloat((livePrice * (1 + forecastGain / 100)).toFixed(2));

      const updated = {
        ...c,
        price: livePrice,
        change: liveChange,
        changePercent: liveChangePercent,
        lastTickDirection: liveDirection,
        forecastPrice30d: forecastPrice,
        _rawRef: c
      };
      cacheMap.set(c.symbol, updated);
      return updated;
    });
  }, [filteredRawCompanies, isActive ? quotes : null, isActive]);

  // Paginated companies slice
  const totalItems = companies.length;
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? Math.max(1, totalItems) : (Number(pageSize) || 24);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safeCurrentPage = isAll ? 1 : Math.max(1, Math.min(currentPage, totalPages));

  const displayedCompanies = useMemo(() => {
    if (isAll) return companies;
    const start = (safeCurrentPage - 1) * effectivePageSize;
    return companies.slice(start, start + effectivePageSize);
  }, [companies, safeCurrentPage, effectivePageSize, isAll]);

  // DYNAMIC WEBSOCKET BATCH SUBSCRIPTION FOR VISIBLE STOCKS
  // Compute stable visible symbols key so subscription ONLY updates when the list of visible
  // tickers changes (e.g. page turn or filter change), NEVER on incoming price ticks!
  const visibleSymbolsKey = useMemo(() => {
    if (isAll) {
      return (filteredRawCompanies || []).map(c => c?.symbol).filter(Boolean).join(',');
    }
    const start = (safeCurrentPage - 1) * effectivePageSize;
    const slice = (filteredRawCompanies || []).slice(start, start + effectivePageSize);
    return slice.map(c => c?.symbol).filter(Boolean).join(',');
  }, [filteredRawCompanies, safeCurrentPage, effectivePageSize, isAll]);

  useEffect(() => {
    if (!isActive || !subscribeBatch || !visibleSymbolsKey) return;
    const syms = visibleSymbolsKey.split(',').filter(Boolean);
    if (syms.length === 0) return;

    subscribeBatch(syms);

    return () => {
      if (unsubscribeBatch && syms.length > 0) {
        unsubscribeBatch(syms);
      }
    };
  }, [visibleSymbolsKey, isActive, subscribeBatch, unsubscribeBatch]);

  // Multi-Asset Comparison Handlers
  const handleToggleCompare = useCallback((symbol) => {
    setSelectedCompareSymbols(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        if (prev.length >= 4) {
          alert('You can compare a maximum of 4 assets side-by-side.');
          return prev;
        }
        return [...prev, symbol];
      }
    });
  }, []);

  const handleClearCompare = useCallback(() => {
    setSelectedCompareSymbols([]);
  }, []);

  // Ingest Global Ticker Success Handler
  const handleIngestSuccess = useCallback((newAsset) => {
    if (!newAsset || !newAsset.symbol) return;

    const safePrice = Number(newAsset.price) || Number(newAsset.basePrice) || 0;
    const safeChange = Number(newAsset.change) || 0;
    const safeChangePercent = Number(newAsset.changePercent) || 0;
    const safeForecastGain = Number(newAsset.forecastGainPercent) || 7.5;
    const safeForecastPrice = Number(newAsset.forecastPrice30d) || parseFloat((safePrice * (1 + safeForecastGain / 100)).toFixed(2));

    const normalizedAsset = {
      ...newAsset,
      symbol: newAsset.symbol.toUpperCase().trim(),
      name: newAsset.name || `${newAsset.symbol} Corp`,
      price: safePrice,
      change: safeChange,
      changePercent: safeChangePercent,
      forecastGainPercent: safeForecastGain,
      forecastPrice30d: safeForecastPrice,
      high52: Number(newAsset.high52) || parseFloat((safePrice * 1.15).toFixed(2)),
      low52: Number(newAsset.low52) || parseFloat((safePrice * 0.85).toFixed(2)),
      peRatio: newAsset.peRatio ?? 24.5,
      dividendYield: newAsset.dividendYield || '1.2%',
      rank: newAsset.rank || 1,
      rating: newAsset.rating || 'BUY',
      ratingScore: newAsset.ratingScore || 88,
      riskLevel: newAsset.riskLevel || 'Moderate',
      country: newAsset.country || 'Global',
      exchange: newAsset.exchange || 'Global Exchange',
      currency: newAsset.currency || 'USD',
      sector: newAsset.sector || 'Global Equities',
      tier: newAsset.tier || 'Growth Leaders ($30B-$200B)',
      marketCapFormatted: newAsset.marketCapFormatted || '$10.0B',
      lastTickDirection: newAsset.lastTickDirection || 'neutral',
      investorAppeal: newAsset.investorAppeal || `Active publicly traded world instrument on ${newAsset.exchange || 'Global Exchange'}.`
    };

    setMarketData(prev => {
      if (!prev) return { total: 1, companies: [normalizedAsset] };
      const currentList = prev.companies || [];
      const existingIdx = currentList.findIndex(c => c.symbol === normalizedAsset.symbol);
      let updatedList;
      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = { ...updatedList[existingIdx], ...normalizedAsset };
      } else {
        updatedList = [normalizedAsset, ...currentList];
      }
      return {
        ...prev,
        companies: updatedList
      };
    });

    // Reset filters to ensure the newly ingested asset is immediately visible to user
    setActivePreset('all');
    setSelectedRegion('all');
    setSelectedTier('all');
    setSelectedSector('all');
    setCurrentPage(1);
    setSearchQuery(normalizedAsset.symbol);
  }, []);

  // Export Screener Data (Sheet, Document, and CSV)
  const handleExportSheet = useCallback(() => {
    if (!companies || companies.length === 0) return;

    const dateStr = new Date().toISOString().slice(0, 10);

    // Build CSV rows with UTF-8 BOM — opens natively in Excel/Google Sheets without format mismatch warnings
    const headers = [
      'Symbol', 'Company Name', 'Sector', 'Country', 'Exchange',
      'Currency', 'Market Cap (USD)', 'Price (USD)', '24h Change (%)',
      'P/E Ratio', 'Dividend Yield', '52W Low', '52W High',
      'Analyst Rating', 'Rating Score (/100)', '30D AI Target Price',
      'AI Upside (%)', 'Risk Level'
    ];

    const escapeCSV = (val) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = companies.map(c => [
      c.symbol,
      c.name || '',
      c.sector || 'Equities',
      c.country || 'Global',
      c.exchange || 'NYSE',
      c.currency || 'USD',
      c.marketCap || 0,
      (c.price || 0).toFixed(2),
      (c.changePercent || 0).toFixed(2),
      c.peRatio ? Number(c.peRatio).toFixed(1) : 'N/A',
      c.dividendYield || '0.0%',
      (c.low52 || 0).toFixed(2),
      (c.high52 || 0).toFixed(2),
      c.rating || 'HOLD',
      c.ratingScore || 85,
      (c.forecastPrice30d || 0).toFixed(2),
      (c.forecastGainPercent || 0).toFixed(1),
      c.riskLevel || 'Moderate'
    ].map(escapeCSV));

    // UTF-8 BOM (\uFEFF) ensures Excel on Windows opens the file without encoding issues
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // .csv extension opens directly in Excel & Google Sheets — no format-mismatch warning
    link.download = `auratrade_global_market_sheet_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [companies]);

  const handleExportDocument = useCallback(() => {
    if (!companies || companies.length === 0) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const topGainer = [...companies].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))[0];
    const topConviction = [...companies].sort((a, b) => (b.ratingScore || 0) - (a.ratingScore || 0))[0];
    const totalMarketCap = companies.reduce((acc, c) => acc + (c.marketCap || 0), 0);
    const formattedTotalCap = '$' + (totalMarketCap / 1e12).toFixed(2) + 'T';

    const companyRows = companies.slice(0, 100).map(c => `
      <tr>
        <td style="font-weight: bold; color: #0284c7;">${c.symbol}</td>
        <td><strong>${(c.name || '').replace(/</g, '&lt;')}</strong></td>
        <td>${c.sector || 'Equities'}</td>
        <td>${c.countryFlag || ''} ${c.country || 'Global'}</td>
        <td style="text-align: right; font-weight: bold;">${c.marketCapFormatted || 'N/A'}</td>
        <td style="text-align: right; font-weight: bold;">$${(c.price || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold; color: ${c.changePercent >= 0 ? '#16a34a' : '#dc2626'};">
          ${c.changePercent >= 0 ? '+' : ''}${(c.changePercent || 0).toFixed(2)}%
        </td>
        <td style="text-align: center; font-weight: bold; color: ${c.rating === 'STRONG BUY' || c.rating === 'BUY' ? '#16a34a' : '#d97706'};">
          ${c.rating} (${c.ratingScore || 85})
        </td>
        <td style="text-align: right; color: #0284c7; font-weight: bold;">+${(c.forecastGainPercent || 0).toFixed(1)}%</td>
      </tr>
    `).join('');

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>AuraTrade Institutional Market Intelligence Brief</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; }
          .header-box { border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 24px; }
          .title { font-size: 22pt; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 10pt; color: #64748b; margin: 6px 0 0; }
          .kpi-container { width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 20px 0; }
          .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
          .kpi-label { font-size: 8pt; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .kpi-value { font-size: 18pt; font-weight: 800; color: #0284c7; margin: 4px 0 0; }
          .table-title { font-size: 14pt; font-weight: 700; color: #0f172a; margin: 24px 0 10px; }
          .styled-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
          .styled-table th { background: #0f172a; color: #ffffff; padding: 9px 8px; font-weight: 700; text-align: left; font-size: 9pt; }
          .styled-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
          .styled-table tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 8pt; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1 class="title">AuraTrade™ Market Intelligence Document</h1>
          <p class="subtitle">Global Market Hierarchy, Valuation Metrics & Predictive Momentum Briefing &bull; Generated: ${new Date().toLocaleString()}</p>
        </div>

        <table class="kpi-container">
          <tr>
            <td class="kpi-box" style="width: 25%;">
              <div class="kpi-label">Tracked Market Cap</div>
              <div class="kpi-value">${formattedTotalCap}</div>
            </td>
            <td class="kpi-box" style="width: 25%;">
              <div class="kpi-label">Total Global Assets</div>
              <div class="kpi-value">${companies.length} Assets</div>
            </td>
            <td class="kpi-box" style="width: 25%;">
              <div class="kpi-label">Top AI Conviction</div>
              <div class="kpi-value" style="font-size: 14pt; color: #16a34a;">${topConviction ? topConviction.symbol + ' (+' + topConviction.forecastGainPercent + '%)' : 'N/A'}</div>
            </td>
            <td class="kpi-box" style="width: 25%;">
              <div class="kpi-label">Top Market Gainer</div>
              <div class="kpi-value" style="font-size: 14pt; color: #16a34a;">${topGainer ? topGainer.symbol + ' (+' + topGainer.changePercent + '%)' : 'N/A'}</div>
            </td>
          </tr>
        </table>

        <h2 class="table-title">Premier Global Equities & Market Overview</h2>
        <table class="styled-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company Name</th>
              <th>Sector</th>
              <th>Country</th>
              <th style="text-align: right;">Market Cap</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">24h Change</th>
              <th style="text-align: center;">Rating (Score)</th>
              <th style="text-align: right;">30D Upside</th>
            </tr>
          </thead>
          <tbody>
            ${companyRows}
          </tbody>
        </table>

        <div class="footer">
          AuraTrade Institutional Workstation &bull; This market document is generated dynamically with real-time financial market data.
        </div>
      </body>
      </html>
    `;

    // UTF-8 BOM + Word XML namespace ensures Word opens in Print Layout without Protected View / format mismatch warnings
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auratrade_market_intelligence_${dateStr}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [companies]);

  // Export Screener Data (CSV & JSON)
  const handleExportCSV = useCallback(() => {
    if (!companies || companies.length === 0) return;
    const headers = [
      'Symbol',
      'Name',
      'Sector',
      'Country',
      'Exchange',
      'Currency',
      'Market Cap (USD)',
      'Price (USD)',
      '24h Change (%)',
      'P/E Ratio',
      'Dividend Yield',
      '52W Low',
      '52W High',
      'Analyst Rating',
      'Rating Score',
      '30D AI Target',
      'AI Upside (%)',
      'Risk Level'
    ];

    const rows = companies.map(c => [
      `"${c.symbol}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.sector || ''}"`,
      `"${c.country || ''}"`,
      `"${c.exchange || ''}"`,
      `"${c.currency || 'USD'}"`,
      c.marketCap,
      c.price,
      c.changePercent,
      c.peRatio || 'N/A',
      `"${c.dividendYield || '0.0%'}"`,
      c.low52,
      c.high52,
      `"${c.rating}"`,
      c.ratingScore,
      c.forecastPrice30d,
      c.forecastGainPercent,
      `"${c.riskLevel}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auratrade_global_screener_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [companies]);

  const handleExportJSON = useCallback(() => {
    if (!companies || companies.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(companies, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `auratrade_global_screener_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [companies]);

  // Stable event handlers to preserve memoization
  const handleSelectSymbol = useCallback((sym) => {
    onSelectSymbol(sym);
  }, [onSelectSymbol]);

  const handleOpenTrade = useCallback((sym) => {
    onOpenTradeModal(sym);
  }, [onOpenTradeModal]);

  const handleAddToWatch = useCallback((sym) => {
    onAddToWatchlist(sym);
  }, [onAddToWatchlist]);

  const handleRemoveFromWatch = useCallback((sym) => {
    onRemoveFromWatchlist(sym);
  }, [onRemoveFromWatchlist]);

  const regions = [
    { id: 'all', label: overview?.totalCount ? `All World (${overview.totalCount})` : 'All World (147)' },
    { id: 'north_america', label: 'North America' },
    { id: 'europe', label: 'Europe' },
    { id: 'asiapac', label: 'Asia-Pac & Japan' },
    { id: 'india_emerging', label: 'India & Emerging' },
    { id: 'latam_mideast', label: 'LatAm & MidEast' },
    { id: 'etf', label: 'ETFs & Digital Reserves' }
  ];

  const tiers = [
    { id: 'all', label: 'All Tiers' },
    { id: 'mega', label: 'Mega-Cap ($1T+)' },
    { id: 'large', label: 'Large-Cap ($200B-$1T)' },
    { id: 'growth', label: 'Growth Leaders ($30B-$200B)' },
    { id: 'index', label: 'Index & ETFs' }
  ];

  const presets = [
    { id: 'all', label: 'All Assets', icon: Layers },
    { id: 'ai_upside', label: 'AI High Upside (>10%)', icon: Sparkles },
    { id: 'dividend', label: 'Dividend Aristocrats (>1.5%)', icon: DollarSign },
    { id: 'mega_cap', label: 'Mega-Cap Club ($1T+)', icon: ShieldCheck },
    { id: 'top_gainers', label: "Today's Top Gainers", icon: TrendingUp },
    { id: 'strong_buy', label: 'Strong Buy Only', icon: CheckCircle2 },
    { id: 'near_52w_low', label: 'Oversold (Near 52W Low)', icon: TrendingDown }
  ];

  const sectors = [
    'All Sectors',
    'Technology',
    'Semiconductors',
    'Healthcare',
    'Financials',
    'Consumer Staples',
    'Consumer Cyclical',
    'Energy',
    'Industrial & Aerospace',
    'Industrials',
    'Basic Materials',
    'Entertainment',
    'Telecommunications',
    'Index ETF',
    'Digital Asset',
    'Commodity'
  ];

  return (
    <div className="all-markets-container motion-entry stagger-2">
      {/* Page Header & Executive Market Banner */}
      {/* overflow:visible + contain:none override to allow the Download dropdown to extend outside this card */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', background: 'var(--profile-hero-bg)', overflow: 'visible', contain: 'none' }}>
        <div className="glass-card-body" style={{ padding: '1.75rem', overflow: 'visible' }}>
          {/* Executive Header Row: Hero Title & Badges on Left, Action Toolbar on Right */}
          <div
            className="screener-header-row"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              paddingBottom: '1.25rem',
              marginBottom: '1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
            }}
          >
            {/* Left: Branding, Eyebrow Badges, Title & Subtitle */}
            <div className="screener-title-block" style={{ flex: '1 1 560px', minWidth: 0 }}>

              <h1
                className="screener-main-title"
                style={{
                  fontFamily: 'var(--font-brand)',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  margin: '0 0 0.4rem 0',
                  color: 'var(--text-primary)',
                  lineHeight: 1.25
                }}
              >
                Worldwide Global Market Hierarchy & Real-Time Screener
              </h1>
              <p
                className="screener-main-subtitle"
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: '780px'
                }}
              >
                Explore the premier companies of the world economy ordered by market capitalization, real-time valuation, and 30-day AI predictive upside. Ingest and trade any worldwide asset on-demand directly with live market feeds.
              </p>
            </div>

            {/* Right: Quick Action Toolbar (Ingest, Download Menu, View Mode Switcher) */}
            <div
              className="screener-action-toolbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                flexWrap: 'wrap',
                alignSelf: 'center'
              }}
            >
              <div className="screener-primary-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {/* Ingest Global Asset Trigger */}
                <button
                  className="btn btn-primary screener-ingest-btn"
                  style={{
                    fontSize: '0.82rem',
                    padding: '0.48rem 0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                    fontWeight: 600
                  }}
                  onClick={() => setIsIngestModalOpen(true)}
                  title="Ingest any international company on demand from Yahoo Finance"
                >
                  <PlusCircle size={15} /> Ingest Global Asset
                </button>

              {/* Screener Data Download Menu (Sheet, Document, CSV) */}
              <div ref={downloadMenuRef} style={{ position: 'relative', zIndex: 200 }}>
                <button
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.82rem',
                    padding: '0.48rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: isDownloadMenuOpen ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)',
                    borderColor: isDownloadMenuOpen ? 'var(--accent-cyan)' : 'var(--border-subtle)'
                  }}
                  onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                  title="Download market screener data as Spreadsheet (.xls), Document report (.doc), or CSV"
                  id="screener-download-menu-btn"
                >
                  <Download size={14} />
                  <span>Download</span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: isDownloadMenuOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      opacity: 0.7
                    }}
                  />
                </button>

                {isDownloadMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-card)',
                      padding: '0.4rem',
                      minWidth: '240px',
                      zIndex: 99999,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    {/* Option 1: Sheet format */}
                    <button
                      type="button"
                      onClick={() => {
                        handleExportSheet();
                        setIsDownloadMenuOpen(false);
                      }}
                      style={{
                        padding: '0.55rem 0.75rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      id="download-sheet-btn"
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <FileSpreadsheet size={16} color="#10b981" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Download as Sheet</span>
                        <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Excel & Google Sheets (.xls)</span>
                      </div>
                    </button>

                    {/* Option 2: Document format */}
                    <button
                      type="button"
                      onClick={() => {
                        handleExportDocument();
                        setIsDownloadMenuOpen(false);
                      }}
                      style={{
                        padding: '0.55rem 0.75rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      id="download-doc-btn"
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <FileText size={16} color="#06b6d4" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Download as Document</span>
                        <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>Microsoft Word / Report (.doc)</span>
                      </div>
                    </button>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.2rem 0.4rem' }} />

                    {/* Option 3: CSV Data */}
                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV();
                        setIsDownloadMenuOpen(false);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '7px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      id="download-csv-btn"
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Download size={15} color="#94a3b8" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>Download as CSV</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Comma-separated values (.csv)</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode Switcher */}
            <div
              className="screener-viewmode-switcher"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'var(--bg-input)',
                padding: '0.2rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
                <button
                  className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
                  style={{
                    background: viewMode === 'table' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    color: viewMode === 'table' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                  onClick={() => setViewMode('table')}
                >
                  <List size={15} /> Table
                </button>
                <button
                  className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                  style={{
                    background: viewMode === 'grid' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={15} /> Cards
                </button>
              </div>
            </div>
          </div>

          {/* Overview Hero Stat Pills */}
          <div className="overview-stats-grid">
            <div className="overview-stat-box">
              <div className="overview-stat-label">Total Tracked Market Cap</div>
              <div className="overview-stat-val font-mono" style={{ color: 'var(--accent-cyan)' }}>
                {overview?.totalMarketCapFormatted || '$47.75T'}
              </div>
              <div className="overview-stat-sub">Across {overview?.totalCount || 147}+ Premier Global Assets</div>
            </div>

            <div className="overview-stat-box">
              <div className="overview-stat-label">Global Market Breadth</div>
              <div className="overview-stat-val font-mono" style={{ color: 'var(--bull-green)' }}>
                {overview?.bullishRatio || 95}%
              </div>
              <div className="overview-stat-sub">Consensus BUY / STRONG BUY</div>
            </div>

            <div className="overview-stat-box">
              <div className="overview-stat-label">Top AI Conviction Pick</div>
              <div className="overview-stat-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800 }}>{overview?.topConviction?.symbol || 'NVDA'}</span>
                <span className="badge-pill" style={{ background: 'var(--bull-green-bg)', color: 'var(--bull-green)', fontSize: '0.75rem' }}>
                  +{overview?.topConviction?.forecastGain || 14.2}% 30D
                </span>
              </div>
              <div className="overview-stat-sub">{overview?.topConviction?.name || 'NVIDIA Corporation'}</div>
            </div>

            <div className="overview-stat-box">
              <div className="overview-stat-label">Worldwide Top Gainer</div>
              <div className="overview-stat-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800 }}>{overview?.topGainer?.symbol || 'META'}</span>
                <span className="badge-pill" style={{ background: 'var(--bull-green-bg)', color: 'var(--bull-green)', fontSize: '0.75rem' }}>
                  {(overview?.topGainer?.changePercent || 0) >= 0 ? '+' : ''}
                  {overview?.topGainer?.changePercent || '+1.20'}%
                </span>
              </div>
              <div className="overview-stat-sub">{overview?.topGainer?.name || 'Meta Platforms Inc.'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Screener Strategy Quick-Presets Ribbon (Clean Vector Icons, No Emojis) */}
      <div className="screener-preset-ribbon">
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Sparkles size={13} style={{ color: 'var(--accent-cyan)' }} /> Presets:
        </span>
        {presets.map(p => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              className={`screener-preset-pill ${activePreset === p.id ? 'active' : ''}`}
              onClick={() => setActivePreset(p.id)}
            >
              <Icon size={13} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Filter & Sorting Control Bar */}
      <div className="market-filter-bar glass-card" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
        {/* Row 1: Global Region Selector */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Globe size={13} style={{ color: 'var(--accent-cyan)' }} /> Geographic Economic Region:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {regions.map((reg) => (
              <button
                key={reg.id}
                className={`tier-filter-btn ${selectedRegion === reg.id ? 'active' : ''}`}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.75rem',
                  background: selectedRegion === reg.id ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: selectedRegion === reg.id ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  color: selectedRegion === reg.id ? '#38bdf8' : 'var(--text-secondary)'
                }}
                onClick={() => setSelectedRegion(reg.id)}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Capitalization Tier & Quick Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Tier Segmented Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            {tiers.map((t) => (
              <button
                key={t.id}
                className={`tier-filter-btn ${selectedTier === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTier(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Input (Instant 0ms client filter with live match count & quick clear) */}
          <div style={{ position: 'relative', minWidth: 'min(100%, 200px)', flex: '1 1 200px', maxWidth: '380px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="custom-input"
              style={{
                width: '100%',
                paddingLeft: '2.3rem',
                paddingRight: searchQuery ? '4.8rem' : '1rem',
                fontSize: '0.85rem'
              }}
              placeholder="Instant Search (e.g., Apple, NVDA, India, Chips)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}
                  title="Matching Companies"
                >
                  {filteredRawCompanies.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Sector Filter, Column Views & Sorting */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Sector Filter Dropdown & Column View Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Sector:</span>
              <select
                className="custom-input"
                style={{
                  padding: '0.4rem 2rem 0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  width: 'auto',
                  minWidth: '160px'
                }}
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                {sectors.map((sec) => (
                  <option
                    key={sec}
                    value={sec === 'All Sectors' ? 'all' : sec}
                  >
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Table View Column Selector */}
            {viewMode === 'table' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Columns:</span>
                <div className="column-view-segmented" style={{ flexShrink: 0 }}>
                  <button
                    type="button"
                    className={`column-view-btn ${columnView === 'standard' ? 'active' : ''}`}
                    onClick={() => setColumnView('standard')}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    className={`column-view-btn ${columnView === 'valuation' ? 'active' : ''}`}
                    onClick={() => setColumnView('valuation')}
                  >
                    Valuation & Income
                  </button>
                  <button
                    type="button"
                    className={`column-view-btn ${columnView === 'ai_quant' ? 'active' : ''}`}
                    onClick={() => setColumnView('ai_quant')}
                  >
                    AI Forecast & Risk
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sorting Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'nowrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Sort By:</span>
            <select
              className="custom-input"
              style={{
                padding: '0.4rem 2rem 0.4rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                width: 'auto',
                minWidth: '220px'
              }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="marketCap">Market Cap (High to Low)</option>
              <option value="price">Current Live Price</option>
              <option value="changePercent">24h Gainers (%)</option>
              <option value="volume">Trading Volume</option>
              <option value="forecastGain">AI 30-Day Upside (%)</option>
              <option value="rating">Analyst Consensus Score</option>
              <option value="peRatio">P/E Ratio</option>
              <option value="dividendYield">Dividend Yield</option>
            </select>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0, whiteSpace: 'nowrap' }}
              onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
              title={`Switch to ${sortOrder === 'desc' ? 'Ascending (Low to High)' : 'Descending (High to Low)'}`}
            >
              <ArrowUpDown size={14} />
              {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}
            </button>
          </div>
        </div>
      </div>

      {/* Top Pagination Bar */}
      {!loading && totalItems > 0 && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Content: Table View vs. Grid View */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          Loading verified institutional market data across worldwide exchanges...
        </div>
      ) : displayedCompanies.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No companies found matching your filter criteria.
          </div>
          <p style={{ maxWidth: '500px', margin: '0 auto 1.25rem', fontSize: '0.85rem' }}>
            Looking for a worldwide company or ETF not listed here (e.g. Spotify, Ferrari, Arm, Palantir)? You can ingest any publicly traded ticker on demand!
          </p>
          <button
            className="btn btn-primary"
            style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', border: 'none' }}
            onClick={() => setIsIngestModalOpen(true)}
          >
            <PlusCircle size={15} /> Ingest Global Ticker Live
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ================= INSTITUTIONAL TABLE VIEW ================= */
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ minWidth: '1320px' }}>
            <thead>
              <tr>
                <th style={{ width: '38px', textAlign: 'center' }}>
                  <Scale size={13} style={{ color: 'var(--text-muted)' }} title="Compare selection" />
                </th>
                <th>Company & Market</th>
                {columnView === 'standard' && <th>Region / Exchange</th>}
                <th style={{ textAlign: 'right' }}>Market Cap</th>
                <th style={{ textAlign: 'right' }}>Live Price</th>
                <th style={{ textAlign: 'right' }}>24h Change</th>
                <th style={{ textAlign: 'right' }}>Volume</th>

                {/* DYNAMIC HEADERS BASED ON columnView */}
                {columnView === 'standard' && (
                  <>
                    <th>52-Week Range</th>
                    <th>Day Range</th>
                    <th style={{ textAlign: 'center' }}>P/E Ratio</th>
                    <th style={{ textAlign: 'center' }}>Analyst Rating</th>
                    <th style={{ textAlign: 'right' }}>30-Day AI Target</th>
                  </>
                )}
                {columnView === 'valuation' && (
                  <>
                    <th style={{ textAlign: 'center' }}>P/E Ratio</th>
                    <th style={{ textAlign: 'center' }}>Dividend Yield</th>
                    <th style={{ textAlign: 'right' }}>Prev Close</th>
                    <th style={{ textAlign: 'right' }}>52W Low</th>
                    <th style={{ textAlign: 'right' }}>52W High</th>
                    <th style={{ textAlign: 'center' }}>Risk Profile</th>
                  </>
                )}
                {columnView === 'ai_quant' && (
                  <>
                    <th style={{ textAlign: 'right' }}>30-Day AI Target</th>
                    <th style={{ textAlign: 'center' }}>AI Upside</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Rating</th>
                    <th style={{ textAlign: 'center' }}>Risk Profile</th>
                  </>
                )}

                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedCompanies.map((c) => {
                const isInWatchlist = watchlistSet.has(c.symbol);
                const isCompared = compareSet.has(c.symbol);
                return (
                  <MarketTableRow
                    key={c.symbol}
                    c={c}
                    isInWatchlist={isInWatchlist}
                    isCompared={isCompared}
                    columnView={columnView}
                    onSelectSymbol={handleSelectSymbol}
                    onOpenTradeModal={handleOpenTrade}
                    onOpenAlertModal={onOpenAlertModal}
                    onAddToWatchlist={handleAddToWatch}
                    onRemoveFromWatchlist={handleRemoveFromWatch}
                    onToggleCompare={handleToggleCompare}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================= INVESTOR CARDS GRID VIEW ================= */
        <div className="investor-cards-grid">
          {displayedCompanies.map((c) => {
            const isInWatchlist = watchlistSet.has(c.symbol);
            const isCompared = compareSet.has(c.symbol);
            return (
              <MarketInvestorCard
                key={c.symbol}
                c={c}
                isInWatchlist={isInWatchlist}
                isCompared={isCompared}
                onSelectSymbol={handleSelectSymbol}
                onOpenTradeModal={handleOpenTrade}
                onOpenAlertModal={onOpenAlertModal}
                onAddToWatchlist={handleAddToWatch}
                onRemoveFromWatchlist={handleRemoveFromWatch}
                onToggleCompare={handleToggleCompare}
              />
            );
          })}
        </div>
      )}

      {/* Bottom Pagination Bar */}
      {!loading && totalItems > 24 && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Floating Comparison Dock (Appears when 1 or more assets are checked) */}
      {selectedCompareSymbols.length > 0 && (
        <div className="compare-floating-dock">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Scale size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Compare:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {selectedCompareSymbols.map(sym => (
              <span key={sym} className="compare-chip">
                {sym}
                <span className="compare-chip-remove" onClick={() => handleToggleCompare(sym)} title="Remove">
                  ✕
                </span>
              </span>
            ))}
          </div>

          <button
            className="btn btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', border: 'none' }}
            onClick={() => setIsCompareModalOpen(true)}
            disabled={selectedCompareSymbols.length < 2}
            title={selectedCompareSymbols.length < 2 ? 'Select at least 2 assets to compare' : 'Launch side-by-side comparison showdown'}
          >
            Compare ({selectedCompareSymbols.length}/4)
          </button>

          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            onClick={handleClearCompare}
          >
            Clear
          </button>
        </div>
      )}

      {/* Side-by-Side Multi-Asset Comparison Modal */}
      <ComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        symbols={selectedCompareSymbols}
        allCompanies={rawCompanies}
        onSelectSymbol={handleSelectSymbol}
        onOpenTradeModal={handleOpenTrade}
        onRemoveSymbol={handleToggleCompare}
      />

      {/* On-Demand Global Ticker Ingestion Modal */}
      <IngestGlobalTickerModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestSuccess={handleIngestSuccess}
      />
    </div>
  );
});

export default AllCompaniesMarket;
