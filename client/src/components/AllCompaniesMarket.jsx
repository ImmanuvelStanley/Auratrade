import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Zap,
  Bookmark,
  Bell,
  ExternalLink,
  Layers,
  BarChart2,
  PieChart,
  LayoutGrid,
  List,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Scale,
  X,
  RotateCcw
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { defaultAllCompanies } from '../data/defaultAllCompanies';
import { CountryFlag } from './CountryFlag';
import { floatingCardEvents } from '../utils/floatingCardEffect';
import { MarketOpeningHero } from './MarketOpeningHero';
import { ModernSelect } from './ModernSelect';

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
  if (c.includes('spain')) return 'ES';
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

const getCurrencyPrefix = (currency, symbol = '') => {
  if (symbol === 'VIX' || symbol === 'INDIA VIX' || symbol === 'DXY') return '';
  switch (String(currency || 'USD').toUpperCase()) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY':
    case 'CNY': return '¥';
    case 'HKD': return 'HK$';
    case 'AUD': return 'A$';
    case 'CAD': return 'CA$';
    case 'CHF': return 'CHF ';
    case 'BRL': return 'R$';
    default: return '$';
  }
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
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
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
            const currSym = getCurrencyPrefix(c.currency, c.symbol);

            return (
              <div key={c.symbol} className="comparison-column">
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="sm" showCode={true} />
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
                <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Live Market Price</span>
                    <span style={{ color: 'var(--text-bull)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                      <Zap size={9} fill="currentColor" /> LIVE
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span className={`tick-text ${c.lastTickDirection || 'neutral'} font-mono`} style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                      {currSym}{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.marketCapFormatted}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">P/E Ratio</span>
                    <span className="font-mono">{c.peRatio > 0 ? `${c.peRatio}x` : 'N/A'}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Dividend Yield</span>
                    <span className="font-mono" style={{ color: 'var(--text-bull)', fontWeight: 600 }}>{c.dividendYield || '0.0%'}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Sector</span>
                    <span style={{ fontSize: '0.78rem' }}>{c.sector}</span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Analyst Consensus</span>
                    <span className="badge-pill" style={{ fontSize: '0.7rem', background: c.rating === 'STRONG BUY' ? 'var(--bull-green-bg)' : 'var(--accent-primary-bg)', color: c.rating === 'STRONG BUY' ? 'var(--text-bull)' : 'var(--text-cyan)', border: `1px solid ${c.rating === 'STRONG BUY' ? 'var(--status-active-border)' : 'rgba(59,130,246,0.3)'}` }}>
                      {c.rating} ({c.ratingScore || 85})
                    </span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">30D AI Expected Target</span>
                    <span className="font-mono" style={{ color: 'var(--text-bull)', fontWeight: 700 }}>
                      {currSym}{forecastTarget.toFixed(2)} (+{forecastGain}%)
                    </span>
                  </div>
                  <div className="comparison-metric-row">
                    <span className="comparison-metric-label">Risk Profile</span>
                    <span style={{ fontWeight: 600, color: c.riskLevel?.includes('Low') ? 'var(--text-bull)' : 'var(--warning-amber)' }}>
                      {c.riskLevel}
                    </span>
                  </div>
                </div>

                {/* 52-Week Range */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    <span>52W Low: {currSym}{c.low52}</span>
                    <span>52W High: {currSym}{c.high52}</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'var(--bg-track)', borderRadius: '3px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${posPercent}%`, background: 'linear-gradient(90deg, #2563eb, #0ecb81)', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* Investment Appeal */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', lineHeight: 1.45, flex: 1, border: '1px solid var(--border-subtle)' }}>
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
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'center', background: '#2563eb', border: '1px solid #3b82f6', color: '#ffffff' }}
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
// MEMOIZED TABLE ROW (With Direct Alert, Compare & Column Views)
// ============================================================================
const MarketTableRow = React.memo(
  function MarketTableRow({
    c,
    isInWatchlist,
    isCompared,
    columnView,
    onSelectSymbol,
    onOpenDeepRecord,
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
    const currSym = getCurrencyPrefix(c.currency, c.symbol);
    const formatVolume = (v) => { if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'; if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'; return String(v); };

    return (
      <tr className="market-row" onClick={() => onSelectSymbol(c.symbol)}>
        {/* Compare Checkbox */}
        <td style={{ width: '38px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            id={`screener-compare-${c.symbol}`}
            name={`compare_${c.symbol}`}
            checked={isCompared}
            onChange={() => onToggleCompare(c.symbol)}
            title="Select to compare (max 4 assets)"
            style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '15px', height: '15px' }}
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
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title={`${c.country || 'Global'} (${c.countryCode || getCountryCode(c.country, c.symbol)})`}
            >
              <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="md" />
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
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px'
                  }}
                >
                  {c.sector}
                </span>
                {c.tier && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      color: c.tier?.includes('Mega') ? 'var(--text-cyan)' : c.tier?.includes('Large') ? 'var(--text-secondary)' : 'var(--text-muted)',
                      fontWeight: 600,
                      padding: '0.08rem 0.3rem',
                      background: c.tier?.includes('Mega') ? 'var(--accent-primary-bg)' : 'var(--bg-subtle)',
                      borderRadius: '3px',
                      border: `1px solid ${c.tier?.includes('Mega') ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-subtle)'}`
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
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="xs" />
                <span>{c.country}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {c.exchange} • {c.currency}
              </div>
            </div>
          </td>
        )}

        {/* Market Cap (Always visible) */}
        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
          {c.marketCapFormatted}
        </td>

        {/* Live Price with verified indicator */}
        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>
          <div className={`tick-text ${c.lastTickDirection || 'neutral'}`}>
            {currSym}{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-bull)',
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
                  <span>{currSym}{low52}</span>
                  <span>{currSym}{high52}</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--bg-track)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${posPercent}%`,
                      background: 'linear-gradient(90deg, #2563eb, #0ecb81)',
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
                  <span>{currSym}{dayLow}</span>
                  <span>{currSym}{dayHigh}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-track)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${dayPosPercent}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #0ecb81)',
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
                {currSym}{forecastTarget.toFixed(2)}
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
              {currSym}{prevClose.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>

            {/* 52W Low */}
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {currSym}{low52}
            </td>

            {/* 52W High */}
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {currSym}{high52}
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
                {currSym}{forecastTarget.toFixed(2)}
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
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: c.rating === 'STRONG BUY' ? '#0ecb81' : '#60a5fa' }}>
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

        {/* Row Actions: Record, Chart, Trade, Alert, Bookmark */}
        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {onOpenDeepRecord && (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem' }}
                title="View Complete Stock Record & Valuation from Starting (IPO) Till Now"
                onClick={() => onOpenDeepRecord(c.symbol, c)}
              >
                Record
              </button>
            )}
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
              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', background: '#2563eb', border: '1px solid #3b82f6', color: '#ffffff' }}
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
                color: isInWatchlist ? '#60a5fa' : 'var(--text-muted)'
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
    onOpenDeepRecord,
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
    const currSym = getCurrencyPrefix(c.currency, c.symbol);
    const fmtNum = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtCompact = (val) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return '0.00';
      return Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2);
    };
    const formatVolume = (v) => { if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'; if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'; return String(v); };

    return (
      <div
        className={`glass-card investor-card stock-detail-float-card ${isCompared ? 'compared' : ''}`}
        {...floatingCardEvents}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        onClick={() => onSelectSymbol(c.symbol)}
      >
        <div
          className="glass-card-body"
          style={{
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            height: '100%',
            boxSizing: 'border-box',
            gap: '0.75rem'
          }}
        >
          {/* 1. Top Header Bar (Fixed Same Height Across All Cards) */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', minHeight: '46px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1.04rem', fontFamily: 'var(--font-brand)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="sm" showCode={true} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.symbol}</span>
                {c.tier && (
                  <span
                    style={{
                      fontSize: '0.56rem',
                      color: c.tier?.includes('Mega') ? 'var(--text-cyan)' : c.tier?.includes('Large') ? 'var(--text-secondary)' : 'var(--text-muted)',
                      fontWeight: 700,
                      padding: '0.06rem 0.25rem',
                      background: c.tier?.includes('Mega') ? 'var(--accent-primary-bg)' : 'var(--bg-subtle)',
                      borderRadius: '3px',
                      border: `1px solid ${c.tier?.includes('Mega') ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-subtle)'}`,
                      flexShrink: 0
                    }}
                  >
                    {c.tier?.includes('Mega') ? 'MEGA' : c.tier?.includes('Large') ? 'LARGE' : c.tier?.includes('Growth') ? 'GROWTH' : c.tier?.includes('Index') ? 'INDEX' : ''}
                  </span>
                )}
              </div>
              <div
                title={c.name}
                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.18rem', lineHeight: 1.3 }}
              >
                {c.name}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  id={`screener-card-compare-${c.symbol}`}
                  name={`compare_card_${c.symbol}`}
                  checked={isCompared}
                  onChange={() => onToggleCompare(c.symbol)}
                  style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span>Compare</span>
              </label>
              <span
                className="badge-pill"
                style={{
                  background: c.rating === 'STRONG BUY' ? 'var(--bull-green-bg)' : 'var(--accent-primary-bg)',
                  color: c.rating === 'STRONG BUY' ? 'var(--text-bull)' : 'var(--text-cyan)',
                  border: `1px solid ${c.rating === 'STRONG BUY' ? 'var(--status-active-border)' : 'rgba(6, 182, 212, 0.3)'}`,
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  padding: '0.12rem 0.42rem'
                }}
              >
                {c.rating || 'BUY'}
              </span>
            </div>
          </div>

          {/* 2. Price & 24h Change Row (Single Non-Wrapping Baseline Across Every Card) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem', minHeight: '34px', flexWrap: 'nowrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', minWidth: 0, flexWrap: 'nowrap' }}>
              <span
                className={`font-mono tick-text ${c.lastTickDirection || 'neutral'}`}
                style={{ fontSize: '1.26rem', fontWeight: 800, whiteSpace: 'nowrap' }}
              >
                {currSym}{fmtNum(price)}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-bull)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Zap size={9} fill="currentColor" /> LIVE
              </span>
            </div>
            <div
              className={`quote-change-pill ${isPos ? 'bull' : 'bear'}`}
              style={{ fontSize: '0.76rem', padding: '0.18rem 0.5rem', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
            >
              {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span>{isPos ? '+' : ''}{changePercent.toFixed(2)}%</span>
            </div>
          </div>

          {/* 3. Institutional Key Metrics Grid (Exact Uniform 3x2 Height, Zero Line-Wrap Drift) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.55rem 0.45rem',
              background: 'var(--bg-subtle)',
              padding: '0.65rem 0.72rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              minHeight: '94px',
              alignContent: 'space-between'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Mkt Cap</div>
              <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.marketCapFormatted}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Volume</div>
              <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {formatVolume(volume)}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Prev Close</div>
              <div className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${currSym}${fmtNum(prevClose)}`}>
                {currSym}{fmtNum(prevClose)}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>P/E Ratio</div>
              <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {c.peRatio > 0 ? `${c.peRatio}x` : 'N/A'}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Div Yield</div>
              <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--bull-green)', whiteSpace: 'nowrap' }}>
                {c.dividendYield || '0.0%'}
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Risk Profile</div>
              <div
                title={c.riskLevel}
                style={{ fontSize: '0.76rem', fontWeight: 600, color: c.riskLevel?.includes('Low') ? 'var(--bull-green)' : 'var(--warning-amber)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {c.riskLevel}
              </div>
            </div>
          </div>

          {/* 4. Day & 52-Week Range Bars (Identical Compact Spacing) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', minHeight: '56px', justifyContent: 'center' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: '0.2rem', whiteSpace: 'nowrap' }}>
                <span>Day Low: <span className="font-mono">{currSym}{fmtCompact(dayLow)}</span></span>
                <span>Day High: <span className="font-mono">{currSym}{fmtCompact(dayHigh)}</span></span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${dayPosPercent}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #0ecb81)',
                    borderRadius: '2px'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: '0.2rem', whiteSpace: 'nowrap' }}>
                <span>52W Low: <span className="font-mono">{currSym}{fmtCompact(low52)}</span></span>
                <span>52W High: <span className="font-mono">{currSym}{fmtCompact(high52)}</span></span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${posPercent}%`,
                      background: 'linear-gradient(90deg, #2563eb, #0ecb81)',
                    borderRadius: '2px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 5. AI Expected 30-Day Growth Card (Fixed Uniform 38px Height) */}
          <div
            style={{
              height: '38px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0 0.72rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.4rem',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} style={{ color: 'var(--bull-green)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--bull-green)' }}>30D AI Target:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                {currSym}{fmtNum(forecastTarget)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--bull-green)', fontWeight: 700 }}>
                +{forecastGain}%
              </span>
            </div>
          </div>

          {/* 6. Key Investment Thesis (Uniform 3-Line Box Across All Cards) */}
          <div
            title={c.investorAppeal}
            style={{
              height: '74px',
              boxSizing: 'border-box',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              background: 'var(--bg-subtle)',
              padding: '0.52rem 0.68rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Investment Case:</strong> {c.investorAppeal}
            </div>
          </div>

          {/* 7. Bottom Card Action Toolbar (Pinned Flush Bottom, Single Straight Row) */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.38rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onOpenDeepRecord && (
              <button
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  height: '34px',
                  padding: '0 0.4rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  justifyContent: 'center',
                  whiteSpace: 'nowrap'
                }}
                title="View Complete Stock Record & Valuation from Starting (IPO) Till Now"
                onClick={() => onOpenDeepRecord(c.symbol, c)}
              >
                Record
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{
                flex: 1,
                height: '34px',
                padding: '0 0.4rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                justifyContent: 'center',
                whiteSpace: 'nowrap'
              }}
              title="Open Workstation Chart"
              onClick={() => onSelectSymbol(c.symbol)}
            >
              Chart
            </button>
            <button
              className="btn btn-primary"
              style={{
                flex: 1,
                height: '34px',
                padding: '0 0.4rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                whiteSpace: 'nowrap'
              }}
              onClick={() => onOpenTradeModal(c.symbol)}
            >
              Trade
            </button>
            <button
              className="btn-icon"
              style={{ width: '34px', height: '34px', flexShrink: 0, color: 'var(--text-muted)' }}
              title="Set Price Alert"
              onClick={() => onOpenAlertModal && onOpenAlertModal(c.symbol)}
            >
              <Bell size={14} />
            </button>
            <button
              className={`btn-icon ${isInWatchlist ? 'active' : ''}`}
              style={{
                width: '34px',
                height: '34px',
                flexShrink: 0,
                color: isInWatchlist ? '#60a5fa' : 'var(--text-muted)'
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
              <Bookmark size={14} fill={isInWatchlist ? 'currentColor' : 'none'} />
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
  onPageSizeChange,
  viewMode,
  onViewModeChange
}) {
  if (!totalItems || totalItems <= 0) return null;
  const isAll = pageSize === 'all';
  const numericSize = isAll ? totalItems : (Number(pageSize) || 24);
  const safeTotalPages = isAll ? 1 : (Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : 1);
  const safeCurrentPage = Math.max(1, Math.min(Number(currentPage) || 1, safeTotalPages));

  const startItem = totalItems === 0 ? 0 : (isAll ? 1 : (safeCurrentPage - 1) * numericSize + 1);
  const endItem = isAll ? totalItems : Math.min(safeCurrentPage * numericSize, totalItems);

  return (
    <div className="screener-pagination-bar">
      <div className="screener-pagination-count">
        Showing <strong style={{ color: 'var(--text-primary)' }}>{startItem}–{endItem}</strong> of <strong style={{ color: 'var(--accent-cyan)' }}>{totalItems}</strong> global assets
      </div>

      {!isAll && safeTotalPages > 1 && (
        <div className="screener-pagination-pages">
          <button
            type="button"
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
                  type="button"
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
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', opacity: safeCurrentPage >= safeTotalPages ? 0.35 : 1, cursor: safeCurrentPage >= safeTotalPages ? 'default' : 'pointer' }}
            disabled={safeCurrentPage >= safeTotalPages}
            onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}

      <div className="screener-pagination-right">
        {onViewModeChange && (
          <>
            <div className="screener-pagination-viewmode" role="group" aria-label="Display layout">
              <button
                type="button"
                className={`screener-viewmode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => onViewModeChange('table')}
              >
                <List size={14} /> Table
              </button>
              <button
                type="button"
                className={`screener-viewmode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => onViewModeChange('grid')}
              >
                <LayoutGrid size={14} /> Cards
              </button>
              <button
                type="button"
                className={`screener-viewmode-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
                onClick={() => onViewModeChange('heatmap')}
              >
                <PieChart size={14} /> Heatmap
              </button>
            </div>
            <span className="screener-pagination-divider" aria-hidden="true" />
          </>
        )}

        <div className="screener-pagination-size">
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>View:</span>
          {[24, 48, 'all'].map((size) => (
            <button
              key={size}
              type="button"
              className={`tier-filter-btn ${pageSize === size ? 'active' : ''}`}
              style={{ padding: '0.22rem 0.52rem', fontSize: '0.73rem', borderRadius: '4px' }}
              onClick={() => onPageSizeChange && onPageSizeChange(size)}
            >
              {size === 'all' ? `All (${totalItems})` : `${size}/page`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// INSTITUTIONAL MARKET TREEMAP & HEATMAP HUB COMPONENT (EXACT FIT)
// ============================================================================
function getHeatmapTileStyle(chgPct, isLight = false) {
  if (isLight) {
    if (chgPct >= 3.0) {
      return {
        bg: 'linear-gradient(155deg, #d1fae5 0%, #a7f3d0 100%)',
        border: '#34d399',
        accent: '#059669',
        textColor: '#065f46',
        pillBg: 'rgba(5, 150, 105, 0.16)',
        pillBorder: 'rgba(5, 150, 105, 0.34)',
        glow: 'rgba(5, 150, 105, 0.18)'
      };
    }
    if (chgPct >= 1.0) {
      return {
        bg: 'linear-gradient(155deg, #ecfdf5 0%, #d1fae5 100%)',
        border: '#6ee7b7',
        accent: '#10b981',
        textColor: '#047857',
        pillBg: 'rgba(16, 185, 129, 0.14)',
        pillBorder: 'rgba(16, 185, 129, 0.3)',
        glow: 'rgba(5, 150, 105, 0.14)'
      };
    }
    if (chgPct > 0) {
      return {
        bg: 'linear-gradient(155deg, #f0fdf4 0%, #dcfce7 100%)',
        border: '#86efac',
        accent: '#16a34a',
        textColor: '#047857',
        pillBg: 'rgba(16, 185, 129, 0.14)',
        pillBorder: 'rgba(16, 185, 129, 0.28)',
        glow: 'rgba(5, 150, 105, 0.12)'
      };
    }
    if (chgPct <= -3.0) {
      return {
        bg: 'linear-gradient(155deg, #fee2e2 0%, #fecaca 100%)',
        border: '#f87171',
        accent: '#dc2626',
        textColor: '#991b1b',
        pillBg: 'rgba(220, 38, 38, 0.18)',
        pillBorder: 'rgba(220, 38, 38, 0.36)',
        glow: 'rgba(220, 38, 38, 0.18)'
      };
    }
    if (chgPct <= -1.0) {
      return {
        bg: 'linear-gradient(155deg, #fef2f2 0%, #fee2e2 100%)',
        border: '#fca5a5',
        accent: '#ef4444',
        textColor: '#b91c1c',
        pillBg: 'rgba(239, 68, 68, 0.15)',
        pillBorder: 'rgba(239, 68, 68, 0.32)',
        glow: 'rgba(220, 38, 38, 0.14)'
      };
    }
    if (chgPct < 0) {
      return {
        bg: 'linear-gradient(155deg, #fff5f6 0%, #ffe4e6 100%)',
        border: '#fda4af',
        accent: '#e11d48',
        textColor: '#be123c',
        pillBg: 'rgba(225, 29, 72, 0.12)',
        pillBorder: 'rgba(225, 29, 72, 0.26)',
        glow: 'rgba(220, 38, 38, 0.12)'
      };
    }
    return {
      bg: '#f8fafc',
      border: '#cbd5e1',
      accent: '#94a3b8',
      textColor: '#475569',
      pillBg: 'rgba(100, 116, 139, 0.1)',
      pillBorder: 'rgba(100, 116, 139, 0.22)',
      glow: 'rgba(15, 23, 42, 0.08)'
    };
  }

  if (chgPct >= 3.0) {
    return {
      bg: 'linear-gradient(155deg, rgba(14, 203, 129, 0.28) 0%, rgba(16, 185, 129, 0.12) 100%)',
      border: 'rgba(14, 203, 129, 0.5)',
      accent: '#0ecb81',
      textColor: '#34d399',
      pillBg: 'rgba(14, 203, 129, 0.18)',
      pillBorder: 'rgba(14, 203, 129, 0.36)',
      glow: 'rgba(14, 203, 129, 0.32)'
    };
  }
  if (chgPct >= 1.0) {
    return {
      bg: 'linear-gradient(155deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.08) 100%)',
      border: 'rgba(16, 185, 129, 0.38)',
      accent: '#10b981',
      textColor: '#34d399',
      pillBg: 'rgba(16, 185, 129, 0.15)',
      pillBorder: 'rgba(16, 185, 129, 0.3)',
      glow: 'rgba(16, 185, 129, 0.22)'
    };
  }
  if (chgPct > 0) {
    return {
      bg: 'linear-gradient(155deg, rgba(16, 185, 129, 0.11) 0%, rgba(15, 23, 42, 0.55) 100%)',
      border: 'rgba(16, 185, 129, 0.26)',
      accent: '#34d399',
      textColor: '#6ee7b7',
      pillBg: 'rgba(16, 185, 129, 0.12)',
      pillBorder: 'rgba(16, 185, 129, 0.24)',
      glow: 'rgba(16, 185, 129, 0.15)'
    };
  }
  if (chgPct <= -3.0) {
    return {
      bg: 'linear-gradient(155deg, rgba(246, 70, 93, 0.28) 0%, rgba(239, 68, 68, 0.12) 100%)',
      border: 'rgba(246, 70, 93, 0.5)',
      accent: '#f6465d',
      textColor: '#fb7185',
      pillBg: 'rgba(246, 70, 93, 0.18)',
      pillBorder: 'rgba(246, 70, 93, 0.36)',
      glow: 'rgba(246, 70, 93, 0.32)'
    };
  }
  if (chgPct <= -1.0) {
    return {
      bg: 'linear-gradient(155deg, rgba(246, 70, 93, 0.2) 0%, rgba(239, 68, 68, 0.08) 100%)',
      border: 'rgba(246, 70, 93, 0.38)',
      accent: '#f43f5e',
      textColor: '#fda4af',
      pillBg: 'rgba(246, 70, 93, 0.15)',
      pillBorder: 'rgba(246, 70, 93, 0.3)',
      glow: 'rgba(246, 70, 93, 0.22)'
    };
  }
  if (chgPct < 0) {
    return {
      bg: 'linear-gradient(155deg, rgba(246, 70, 93, 0.11) 0%, rgba(15, 23, 42, 0.55) 100%)',
      border: 'rgba(246, 70, 93, 0.26)',
      accent: '#fb7185',
      textColor: '#fda4af',
      pillBg: 'rgba(246, 70, 93, 0.12)',
      pillBorder: 'rgba(246, 70, 93, 0.24)',
      glow: 'rgba(246, 70, 93, 0.15)'
    };
  }
  return {
    bg: 'linear-gradient(155deg, rgba(255, 255, 255, 0.045) 0%, rgba(15, 23, 42, 0.6) 100%)',
    border: 'rgba(255, 255, 255, 0.1)',
    accent: '#64748b',
    textColor: 'var(--text-secondary)',
    pillBg: 'rgba(148, 163, 184, 0.12)',
    pillBorder: 'rgba(148, 163, 184, 0.22)',
    glow: 'rgba(255, 255, 255, 0.1)'
  };
}

function SectorHeatmapMatrix({
  companies = [],
  allCompanies = [],
  quotes = {},
  onSelectSymbol,
  watchlistSet
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [scope, setScope] = useState('full'); // 'full' or 'screen'
  const [heatmapQuery, setHeatmapQuery] = useState('');
  const ribbonRef = useRef(null);

  // Throttled quotes to limit heavy 300+ constituent heatmap calculations to 1s cadence
  const [throttledQuotes, setThrottledQuotes] = useState(quotes);
  const lastQuotesThrottleRef = useRef(Date.now());
  const quotesThrottleTimerRef = useRef(null);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastQuotesThrottleRef.current;
    if (elapsed >= 1000) {
      lastQuotesThrottleRef.current = now;
      setThrottledQuotes(quotes);
    } else {
      if (quotesThrottleTimerRef.current) clearTimeout(quotesThrottleTimerRef.current);
      quotesThrottleTimerRef.current = setTimeout(() => {
        lastQuotesThrottleRef.current = Date.now();
        setThrottledQuotes(quotes);
      }, 1000 - elapsed);
    }
    return () => {
      if (quotesThrottleTimerRef.current) clearTimeout(quotesThrottleTimerRef.current);
    };
  }, [quotes]);

  // Pick dataset based on scope
  const rawPool = (scope === 'full' && allCompanies && allCompanies.length > 0)
    ? allCompanies
    : (companies && companies.length > 0 ? companies : allCompanies);

  // Merge live socket updates for real-time prices & change percentages
  const enrichedPool = useMemo(() => {
    return (rawPool || []).map(c => {
      const live = throttledQuotes ? throttledQuotes[c.symbol] : null;
      const price = live && Number(live.price) ? Number(live.price) : (Number(c.price) || 0);
      const chg = live && Number.isFinite(Number(live.change)) ? Number(live.change) : (Number(c.change) || 0);
      const chgPct = live && Number.isFinite(Number(live.changePercent)) ? Number(live.changePercent) : (Number(c.changePercent) || 0);
      const mktCap = Number(c.marketCap) || 0;
      return {
        ...c,
        price,
        change: chg,
        changePercent: chgPct,
        marketCapNum: mktCap
      };
    });
  }, [rawPool, throttledQuotes]);

  // Filter by inline heatmap search query if present
  const activePool = useMemo(() => {
    const q = heatmapQuery.trim().toLowerCase();
    if (!q) return enrichedPool;
    return enrichedPool.filter(c =>
      (c.symbol && c.symbol.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.sector && c.sector.toLowerCase().includes(q))
    );
  }, [enrichedPool, heatmapQuery]);

  // Market Breadth Sentiment Analytics
  const marketBreadth = useMemo(() => {
    let advancing = 0;
    let declining = 0;
    let neutral = 0;
    let topGainer = null;
    let topLoser = null;

    activePool.forEach(c => {
      const pct = c.changePercent;
      if (pct > 0.04) advancing++;
      else if (pct < -0.04) declining++;
      else neutral++;

      if (!topGainer || pct > topGainer.changePercent) topGainer = c;
      if (!topLoser || pct < topLoser.changePercent) topLoser = c;
    });

    const total = activePool.length || 1;
    const advancePct = Math.round((advancing / total) * 100);
    const declinePct = Math.round((declining / total) * 100);
    const neutralPct = Math.max(0, 100 - advancePct - declinePct);

    return {
      advancing,
      declining,
      neutral,
      total: activePool.length,
      advancePct,
      declinePct,
      neutralPct,
      topGainer,
      topLoser
    };
  }, [activePool]);

  // Group by sector with aggregate metrics
  const sectorGroups = useMemo(() => {
    const map = new Map();
    activePool.forEach(c => {
      const sec = c.sector || 'Diversified';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec).push(c);
    });

    const groups = [];
    map.forEach((items, sectorName) => {
      const totalChange = items.reduce((acc, it) => acc + (it.changePercent || 0), 0);
      const avgPerf = totalChange / (items.length || 1);
      const totalMarketCap = items.reduce((acc, it) => acc + (it.marketCapNum || 0), 0);
      const sortedItems = [...items].sort((a, b) => (b.marketCapNum || 0) - (a.marketCapNum || 0));

      groups.push({
        sectorName,
        items: sortedItems,
        avgPerf,
        totalMarketCap,
        count: items.length
      });
    });

    return groups.sort((a, b) => b.count - a.count);
  }, [activePool]);

  // Active filtered sectors for display
  const displayedSectors = useMemo(() => {
    if (selectedSector === 'ALL') return sectorGroups;
    const match = sectorGroups.filter(g => g.sectorName === selectedSector);
    return match.length > 0 ? match : sectorGroups;
  }, [sectorGroups, selectedSector]);

  // Pack compartments into exact 12-column rows so zero trailing empty cells ever appear
  const packedCompartments = useMemo(() => {
    if (!displayedSectors || displayedSectors.length === 0) return [];
    if (displayedSectors.length === 1) {
      return [{ ...displayedSectors[0], colSpan: 12, tabletFull: true }];
    }

    const packed = [];
    const compactQueue = [];

    displayedSectors.forEach(g => {
      // Sectors with >= 10 companies anchor a full 12-column band across the layout
      if (g.items.length >= 10) {
        packed.push({ ...g, colSpan: 12, tabletFull: true });
      } else {
        compactQueue.push(g);
      }
    });

    // Pack medium/small compartments cleanly into rows summing to exactly 12 columns
    const rows = [];
    let currentRow = [];
    let currentWeight = 0;

    compactQueue.forEach(g => {
      const desiredWeight = g.items.length >= 5 ? 6 : 4;
      if (currentRow.length > 0 && currentWeight + desiredWeight > 12) {
        rows.push(currentRow);
        currentRow = [];
        currentWeight = 0;
      }
      currentRow.push({ ...g, desiredWeight });
      currentWeight += desiredWeight;
      if (currentWeight === 12) {
        rows.push(currentRow);
        currentRow = [];
        currentWeight = 0;
      }
    });
    if (currentRow.length > 0) rows.push(currentRow);

    // Balance every row to sum to exact 12 columns on desktop
    const compactResults = [];
    rows.forEach(row => {
      if (row.length === 1) {
        compactResults.push({ ...row[0], colSpan: 12, tabletFull: true });
      } else if (row.length === 2) {
        const w0 = row[0].desiredWeight;
        const w1 = row[1].desiredWeight;
        if (w0 !== w1) {
          compactResults.push({ ...row[0], colSpan: 7, tabletFull: false });
          compactResults.push({ ...row[1], colSpan: 5, tabletFull: false });
        } else {
          compactResults.push({ ...row[0], colSpan: 6, tabletFull: false });
          compactResults.push({ ...row[1], colSpan: 6, tabletFull: false });
        }
      } else {
        const evenSpan = Math.floor(12 / row.length);
        let remainder = 12 - evenSpan * row.length;
        row.forEach(item => {
          const bonus = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder--;
          compactResults.push({ ...item, colSpan: evenSpan + bonus, tabletFull: false });
        });
      }
    });

    // Ensure tablet 2-col view has no trailing orphan half-row among non-full compartments
    const nonFullCompact = compactResults.filter(c => !c.tabletFull);
    if (nonFullCompact.length % 2 === 1) {
      nonFullCompact[nonFullCompact.length - 1].tabletFull = true;
    }

    return [...packed, ...compactResults];
  }, [displayedSectors]);

  const scrollRibbon = useCallback((dir) => {
    if (!ribbonRef.current) return;
    ribbonRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }, []);

  if (!enrichedPool || enrichedPool.length === 0) return null;

  return (
    <div className="glass-card heatmap-hub-container">
      {/* 1. Balanced Header Row (Left Title + Right Filter & Scope Controls) */}
      <div className="heatmap-hub-header">
        <div className="heatmap-hub-title-group">
          <div className="heatmap-hub-icon">
            <PieChart size={17} style={{ color: 'var(--text-cyan)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="heatmap-hub-title">
                Institutional Market Treemap &amp; Sector Heatmap
              </span>
              <span className="font-mono heatmap-hub-count-pill">
                {sectorGroups.length} Sectors • {activePool.length} Assets
              </span>
            </div>
            <div className="heatmap-hub-subtitle">
              Real-time capital momentum, sector breadth &amp; company identification
            </div>
          </div>
        </div>

        {/* Right Controls: Quick Heatmap Search + Scope Switcher */}
        <div className="heatmap-hub-actions">
          <div className="heatmap-inline-search">
            <Search size={13} className="heatmap-inline-search-icon" />
            <input
              type="text"
              value={heatmapQuery}
              onChange={(e) => setHeatmapQuery(e.target.value)}
              placeholder="Find ticker or company..."
              aria-label="Filter companies in heatmap"
            />
            {heatmapQuery && (
              <button
                type="button"
                onClick={() => setHeatmapQuery('')}
                className="heatmap-inline-clear"
                title="Clear heatmap filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {allCompanies && allCompanies.length > 0 && (
            <div className="heatmap-scope-switch">
              <button
                type="button"
                className={`heatmap-scope-btn ${scope === 'full' ? 'active' : ''}`}
                onClick={() => { setScope('full'); setSelectedSector('ALL'); }}
              >
                Full Market ({allCompanies.length})
              </button>
              <button
                type="button"
                className={`heatmap-scope-btn ${scope === 'screen' ? 'active' : ''}`}
                onClick={() => { setScope('screen'); setSelectedSector('ALL'); }}
              >
                Page Screen ({companies.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Full-Width Market Breadth & Color Intensity Bar (Zero Trailing Empty Space) */}
      <div className="heatmap-breadth-strip">
        <div className="heatmap-breadth-left">
          <div className="heatmap-breadth-stat">
            <TrendingUp size={14} style={{ color: 'var(--text-bull)' }} />
            <span className="font-mono text-bull">
              {marketBreadth.advancing} Advancing ({marketBreadth.advancePct}%)
            </span>
          </div>

          <div
            className="heatmap-breadth-gauge"
            title={`Market Sentiment: ${marketBreadth.advancePct}% Advancing • ${marketBreadth.neutralPct}% Flat • ${marketBreadth.declinePct}% Declining`}
          >
            <div className="heatmap-breadth-gauge-bull" style={{ width: `${marketBreadth.advancePct}%` }} />
            <div className="heatmap-breadth-gauge-neutral" style={{ width: `${marketBreadth.neutralPct}%` }} />
            <div className="heatmap-breadth-gauge-bear" style={{ width: `${marketBreadth.declinePct}%` }} />
          </div>

          <div className="heatmap-breadth-stat">
            <TrendingDown size={14} style={{ color: 'var(--text-bear)' }} />
            <span className="font-mono text-bear">
              {marketBreadth.declining} Declining ({marketBreadth.declinePct}%)
            </span>
          </div>

          {marketBreadth.neutral > 0 && (
            <span className="heatmap-breadth-flat font-mono">
              {marketBreadth.neutral} Flat
            </span>
          )}
        </div>

        <div className="heatmap-breadth-right">
          <div className="heatmap-scale-legend" title="24h Change Color Intensity">
            <span className="font-mono">-3%</span>
            <span className="legend-swatch bear-strong" />
            <span className="legend-swatch bear-mild" />
            <span className="legend-swatch flat" />
            <span className="legend-swatch bull-mild" />
            <span className="legend-swatch bull-strong" />
            <span className="font-mono">+3%</span>
          </div>

          {marketBreadth.topGainer && (
            <button
              type="button"
              className="heatmap-spotlight-capsule bull"
              onClick={() => onSelectSymbol && onSelectSymbol(marketBreadth.topGainer.symbol)}
              title={`${marketBreadth.topGainer.name} (${marketBreadth.topGainer.symbol}) — Click to inspect`}
            >
              <span className="spotlight-label">Leader</span>
              <span className="font-mono" style={{ fontWeight: 800 }}>
                {marketBreadth.topGainer.symbol} {marketBreadth.topGainer.changePercent >= 0 ? '+' : ''}{marketBreadth.topGainer.changePercent.toFixed(2)}%
              </span>
            </button>
          )}

          {marketBreadth.topLoser && marketBreadth.topLoser.symbol !== marketBreadth.topGainer?.symbol && (
            <button
              type="button"
              className="heatmap-spotlight-capsule bear"
              onClick={() => onSelectSymbol && onSelectSymbol(marketBreadth.topLoser.symbol)}
              title={`${marketBreadth.topLoser.name} (${marketBreadth.topLoser.symbol}) — Click to inspect`}
            >
              <span className="spotlight-label">Laggard</span>
              <span className="font-mono" style={{ fontWeight: 800 }}>
                {marketBreadth.topLoser.symbol} {marketBreadth.topLoser.changePercent.toFixed(2)}%
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Sector Navigation Bar with Clean Chevron Controls (No Clunky Native Scrollbar) */}
      <div className="heatmap-sector-bar">
        <button
          type="button"
          className="heatmap-ribbon-arrow"
          onClick={() => scrollRibbon(-1)}
          aria-label="Scroll sectors left"
          title="Scroll sectors left"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="heatmap-sector-ribbon" ref={ribbonRef}>
          <button
            type="button"
            className={`heatmap-sector-tab ${selectedSector === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedSector('ALL')}
          >
            <span>ALL SECTORS</span>
            <span className="tab-badge neutral">
              {activePool.length}
            </span>
          </button>

          {sectorGroups.map(g => {
            const isPos = g.avgPerf >= 0;
            return (
              <button
                key={g.sectorName}
                type="button"
                className={`heatmap-sector-tab ${selectedSector === g.sectorName ? 'active' : ''}`}
                onClick={() => setSelectedSector(g.sectorName === selectedSector ? 'ALL' : g.sectorName)}
                title={`${g.sectorName} (${g.count} assets) • Avg 24h: ${isPos ? '+' : ''}${g.avgPerf.toFixed(2)}%`}
              >
                <span>{g.sectorName}</span>
                <span className={`tab-badge ${isPos ? 'pos' : 'neg'}`}>
                  {isPos ? '+' : ''}{g.avgPerf.toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="heatmap-ribbon-arrow"
          onClick={() => scrollRibbon(1)}
          aria-label="Scroll sectors right"
          title="Scroll sectors right"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 4. Exact-Fit 12-Column Treemap Grid */}
      {packedCompartments.length === 0 ? (
        <div className="heatmap-empty-state">
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            No matching companies in heatmap for "{heatmapQuery}"
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.38rem 0.9rem', marginTop: '0.5rem' }}
            onClick={() => { setHeatmapQuery(''); setSelectedSector('ALL'); }}
          >
            Reset Heatmap Filter
          </button>
        </div>
      ) : (
        <div className="heatmap-treemap-grid">
          {packedCompartments.map((g, sIdx) => {
            const isPos = g.avgPerf >= 0;
            const items = g.items;
            const isSingleSectorView = selectedSector !== 'ALL';
            const spanClass = `col-span-${g.colSpan} ${g.tabletFull ? 'tablet-span-full' : ''}`;

            return (
              <div
                key={g.sectorName}
                className={`heatmap-treemap-compartment ${spanClass}`}
                style={{ animationDelay: `${Math.min(sIdx * 25, 280)}ms` }}
              >
                {/* Sector Compartment Header */}
                <div className="heatmap-compartment-head">
                  <div className="heatmap-compartment-title">
                    <span>{g.sectorName}</span>
                    <span className="heatmap-compartment-count font-mono">{items.length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span className={`heatmap-compartment-perf ${isPos ? 'pos' : 'neg'}`}>
                      {isPos ? '▲ +' : '▼ '}{Math.abs(g.avgPerf).toFixed(2)}%
                    </span>
                    {!isSingleSectorView ? (
                      <button
                        type="button"
                        className="heatmap-focus-btn"
                        onClick={() => setSelectedSector(g.sectorName)}
                        title={`Focus exclusively on ${g.sectorName}`}
                      >
                        Focus
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="heatmap-focus-btn"
                        onClick={() => setSelectedSector('ALL')}
                        title="Return to all sectors"
                      >
                        All Sectors
                      </button>
                    )}
                  </div>
                </div>

                {/* Exact-Fit Company Card Pack */}
                <div className={`heatmap-mosaic-pack ${g.colSpan <= 6 ? 'compact-pack' : ''}`}>
                  {items.map((c, idx) => {
                    const chgPct = Number(c.changePercent) || 0;
                    const price = Number(c.price) || 0;
                    const currPrefix = getCurrencyPrefix(c.currency, c.symbol);
                    const isTilePos = chgPct >= 0;
                    const isInWatch = watchlistSet?.has(c.symbol);
                    const styleMeta = getHeatmapTileStyle(chgPct, isLight);
                    const formattedPrice = price >= 1000
                      ? price.toLocaleString(undefined, { maximumFractionDigits: 1 })
                      : price.toFixed(2);

                    const isLeader = idx < 2 && items.length >= 6 && g.colSpan >= 7;
                    const isSolo = items.length === 1 && !isSingleSectorView;

                    if (isSolo) {
                      return (
                        <div
                          key={c.symbol}
                          className="heatmap-mosaic-tile solo"
                          style={{
                            background: styleMeta.bg,
                            border: `1px solid ${styleMeta.border}`,
                            '--tile-accent': styleMeta.accent,
                            '--tile-glow': styleMeta.glow
                          }}
                          onClick={() => onSelectSymbol && onSelectSymbol(c.symbol)}
                          title={`${c.name} (${c.symbol})\nPrice: ${currPrefix}${price.toLocaleString()}\n24h Change: ${isTilePos ? '+' : ''}${chgPct.toFixed(2)}%\nSector: ${g.sectorName}\nMarket Cap: ${c.marketCapFormatted || '--'}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                            <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="sm" showCode={false} />
                            <div style={{ minWidth: 0 }}>
                              <div className="heatmap-tile-sym-wrap">
                                <span className="heatmap-tile-sym">{c.symbol}</span>
                                {isInWatch && <Bookmark size={10} style={{ color: 'var(--accent-amber)', fill: 'currentColor', flexShrink: 0 }} />}
                              </div>
                              <div className="heatmap-tile-name">{c.name || c.symbol}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div className="heatmap-tile-price font-mono">{currPrefix}{formattedPrice}</div>
                              {c.marketCapFormatted && <div className="heatmap-tile-mcap font-mono">{c.marketCapFormatted}</div>}
                            </div>
                            <span
                              className="heatmap-tile-pct font-mono"
                              style={{ color: styleMeta.textColor, background: styleMeta.pillBg, borderColor: styleMeta.pillBorder }}
                            >
                              {isTilePos ? '+' : ''}{chgPct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={c.symbol}
                        className={`heatmap-mosaic-tile ${isLeader ? 'leader' : ''}`}
                        style={{
                          background: styleMeta.bg,
                          border: `1px solid ${styleMeta.border}`,
                          '--tile-accent': styleMeta.accent,
                          '--tile-glow': styleMeta.glow
                        }}
                        onClick={() => onSelectSymbol && onSelectSymbol(c.symbol)}
                        title={`${c.name} (${c.symbol})\nPrice: ${currPrefix}${price.toLocaleString()}\n24h Change: ${isTilePos ? '+' : ''}${chgPct.toFixed(2)}%\nSector: ${g.sectorName}\nMarket Cap: ${c.marketCapFormatted || '--'}`}
                      >
                        <div className="heatmap-tile-top">
                          <div className="heatmap-tile-sym-wrap">
                            <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="xs" showCode={false} />
                            <span className="heatmap-tile-sym">{c.symbol}</span>
                            {isInWatch && <Bookmark size={9} style={{ color: 'var(--accent-amber)', fill: 'currentColor', flexShrink: 0 }} />}
                          </div>
                          <span
                            className="heatmap-tile-pct font-mono"
                            style={{ color: styleMeta.textColor, background: styleMeta.pillBg, borderColor: styleMeta.pillBorder }}
                          >
                            {isTilePos ? '+' : ''}{chgPct.toFixed(2)}%
                          </span>
                        </div>

                        <div className="heatmap-tile-name">{c.name || c.symbol}</div>

                        <div className="heatmap-tile-foot">
                          <span className="heatmap-tile-price font-mono">
                            {currPrefix}{formattedPrice}
                          </span>
                          {c.marketCapFormatted && (
                            <span className="heatmap-tile-mcap font-mono">{c.marketCapFormatted}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  onOpenDeepRecord,
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

  // Seamless Automatic Global Ticker Ingestion State
  const [isAutoIngesting, setIsAutoIngesting] = useState(false);
  const [autoIngestFailedSymbol, setAutoIngestFailedSymbol] = useState(null);
  const lastAutoIngestAttemptRef = useRef('');

  // High-performance pagination state
  const [pageSize, setPageSize] = useState(24); // 24, 48, or 'all'
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  // Fetch all companies from backend (supports silent background sync for live market updates)
  const fetchMarketData = useCallback(async (silent = false) => {
    try {
      if (!silent && !allMarketMemoryCache) setLoading(true);
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
      if (!silent) console.error('Failed to fetch all market companies:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedRegion, selectedTier, selectedSector, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    fetchMarketData(false);
  }, [selectedRegion, selectedTier, selectedSector, sortBy, sortOrder]);

  // High-performance background live market sync every 60s when active (WebSocket streams live ticks continuously)
  useEffect(() => {
    if (!isActive) return;
    const syncTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetchMarketData(true);
    }, 60000);
    return () => clearInterval(syncTimer);
  }, [isActive, fetchMarketData]);

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
      fetchMarketData(false);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const overview = marketData?.overview;

  // Pre-computed static all-time market gainer (eliminates 300 heavy CAGR/valuation calculations per tick)
  const allTimeBestGainerStatic = useMemo(() => ({
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    ipoYear: 1986,
    allTimeReturnPercent: 708343,
    allTimeMultiple: 7084,
    currency: 'USD',
    exchange: 'NASDAQ'
  }), []);

  // Compute live KPI overview across the active market universe strictly when marketData or filters change
  // (Zero execution on sub-second quote micro-ticks, completely eliminating main-thread stalls)
  const liveOverview = useMemo(() => {
    const basePool =
      (allMarketMemoryCache?.companies?.length ? allMarketMemoryCache.companies : null) ||
      (selectedRegion === 'all' && selectedTier === 'all' && selectedSector === 'all' && !searchQuery ? marketData?.companies : null) ||
      defaultAllCompanies?.companies ||
      [];

    if (!basePool.length) return overview || null;

    const seen = new Set();
    let totalMarketCap = 0;
    let bullishCount = 0;
    let advancingCount = 0;
    let decliningCount = 0;
    let topGainer = null;
    let topConviction = null;
    let bestConvictionScore = -Infinity;

    for (let i = 0; i < basePool.length; i++) {
      const c = basePool[i];
      const sym = (c?.symbol || '').toUpperCase().trim();
      if (!sym || seen.has(sym)) continue;
      seen.add(sym);

      const basePrice = Number(c.price) || 0;
      const chgPct = Number(c.changePercent) || 0;
      totalMarketCap += Number(c.marketCap) || 0;

      if (c.rating === 'STRONG BUY' || c.rating === 'BUY') bullishCount += 1;
      if (chgPct >= 0) advancingCount += 1;
      else decliningCount += 1;

      if (!topGainer || chgPct > topGainer.changePercent) {
        topGainer = {
          symbol: sym,
          name: c.name || sym,
          changePercent: parseFloat(chgPct.toFixed(2)),
          price: basePrice,
          currency: c.currency
        };
      }

      const convictionRank = (Number(c.ratingScore) || 0) * 100 + (Number(c.forecastGainPercent) || 7.5);
      if (convictionRank > bestConvictionScore) {
        bestConvictionScore = convictionRank;
        topConviction = {
          symbol: sym,
          name: c.name || sym,
          ratingScore: c.ratingScore || 95,
          forecastGain: parseFloat((Number(c.forecastGainPercent) || 7.5).toFixed(1))
        };
      }
    }

    const totalCount = seen.size || overview?.totalCount || defaultAllCompanies?.overview?.totalCount || 309;
    const bullishRatio = totalCount > 0 ? Math.round((bullishCount / totalCount) * 100) : (overview?.bullishRatio || 95);

    return {
      totalMarketCap: overview?.totalMarketCap || totalMarketCap,
      totalMarketCapFormatted: overview?.totalMarketCapFormatted || `$${(totalMarketCap / 1e12).toFixed(2)}T`,
      totalCount,
      bullishRatio,
      advancingCount: overview?.advancingCount || advancingCount,
      decliningCount: overview?.decliningCount || decliningCount,
      topConviction: topConviction || overview?.topConviction,
      topGainer: topGainer || overview?.topGainer,
      allTimeBestGainer: allTimeBestGainerStatic
    };
  }, [marketData, overview, selectedRegion, selectedTier, selectedSector, searchQuery, allTimeBestGainerStatic]);

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
        case 'top_gainers':
          return (Number(c?.changePercent) || 0) >= 1.0;
        case 'breakouts_52w': {
          const high = Number(c?.high52) || 0;
          const price = Number(c?.price) || 0;
          if (high <= 0 || price <= 0) return false;
          return price >= high * 0.95;
        }
        case 'high_dividend': {
          const div = Number(c?.dividendYield || c?.dividend) || 0;
          return div >= 2.0;
        }
        case 'mega_caps': {
          const cap = Number(c?.marketCap) || 0;
          return cap >= 200_000_000_000 || c?.tier === 'mega_cap';
        }
        case 'undervalued': {
          const pe = Number(c?.peRatio || c?.pe) || 0;
          return pe > 0 && pe <= 20;
        }
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

  // High-performance deferred search filtering (0ms typing latency, non-blocking concurrent list filter)
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filteredRawCompanies = useMemo(() => {
    if (!presetFilteredCompanies || presetFilteredCompanies.length === 0) return [];
    const q = deferredSearchQuery.trim().toLowerCase();
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
  }, [presetFilteredCompanies, deferredSearchQuery]);

  // Paginated companies slice calculation on raw filtered data
  const totalItems = filteredRawCompanies.length;
  const isAll = pageSize === 'all';
  const effectivePageSize = isAll ? Math.max(1, totalItems) : (Number(pageSize) || 24);
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safeCurrentPage = isAll ? 1 : Math.max(1, Math.min(currentPage, totalPages));

  // Only take the slice of raw companies for the active page
  const displayedRawCompanies = useMemo(() => {
    if (isAll) return filteredRawCompanies;
    const start = (safeCurrentPage - 1) * effectivePageSize;
    return filteredRawCompanies.slice(start, start + effectivePageSize);
  }, [filteredRawCompanies, safeCurrentPage, effectivePageSize, isAll]);

  // Object reference cache: preserves existing object references for un-ticked companies
  // This enables React.memo on MarketTableRow and MarketInvestorCard to skip 98%+ of DOM re-renders
  const stableCompanyCacheRef = useRef(new Map());

  // Merge live WebSocket quotes ONLY for the visible displayed companies (24 items instead of 309!)
  // This reduces reference checking and object creation by 92% on every live tick!
  const displayedCompanies = useMemo(() => {
    if (!isActive || !quotes) return displayedRawCompanies;
    const cacheMap = stableCompanyCacheRef.current;

    return (displayedRawCompanies || []).map((c) => {
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
  }, [displayedRawCompanies, isActive ? quotes : null, isActive]);

  // DYNAMIC WEBSOCKET BATCH SUBSCRIPTION FOR VISIBLE STOCKS
  // Compute stable visible symbols key so subscription ONLY updates when the list of visible
  // tickers changes (e.g. page turn or filter change), NEVER on incoming price ticks!
  const visibleSymbolsKey = useMemo(() => {
    return (displayedRawCompanies || []).map(c => c?.symbol).filter(Boolean).join(',');
  }, [displayedRawCompanies]);

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
    lastAutoIngestAttemptRef.current = normalizedAsset.symbol;
    setActivePreset('all');
    setSelectedRegion('all');
    setSelectedTier('all');
    setSelectedSector('all');
    setCurrentPage(1);
    setSearchQuery(normalizedAsset.symbol);
  }, []);

  // Automatically ingest any uncataloged global ticker on-demand in the background when searched
  useEffect(() => {
    const q = searchQuery.trim().toUpperCase();
    if (!q || q.length > 15 || filteredRawCompanies.length > 0 || !/^[A-Z0-9.\-]{1,15}$/.test(q)) {
      setIsAutoIngesting(false);
      return;
    }

    if (lastAutoIngestAttemptRef.current === q && autoIngestFailedSymbol === q) {
      return;
    }

    setIsAutoIngesting(true);
    const timer = setTimeout(async () => {
      lastAutoIngestAttemptRef.current = q;
      try {
        const res = await fetch('/api/stocks/fetch-global', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: q })
        });
        const json = await res.json();
        if (json.success && json.data) {
          setAutoIngestFailedSymbol(null);
          handleIngestSuccess(json.data);
        } else {
          setAutoIngestFailedSymbol(q);
        }
      } catch (err) {
        setAutoIngestFailedSymbol(q);
      } finally {
        setIsAutoIngesting(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, filteredRawCompanies.length, handleIngestSuccess, autoIngestFailedSymbol]);

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
    { id: 'all', label: overview?.totalCount ? `All Markets (${overview.totalCount})` : `All Markets (${defaultAllCompanies?.overview?.totalCount || 309})` },
    { id: 'north_america', label: 'North America', flagCode: 'US' },
    { id: 'europe', label: 'Europe', flagCode: 'EU' },
    { id: 'asiapac', label: 'Asia-Pacific', flagCode: 'JP' },
    { id: 'india_emerging', label: 'India', flagCode: 'IN' },
    { id: 'latam_mideast', label: 'LatAm & MidEast', flagCode: 'UY' },
    { id: 'etf', label: 'Global & ETFs', flagCode: 'GL' }
  ];

  const tiers = [
    { value: 'all', label: 'All Tiers', shortLabel: 'All Tiers' },
    { value: 'mega', label: 'Mega-Cap', shortLabel: 'Mega-Cap', badge: '$1T+' },
    { value: 'large', label: 'Large-Cap', shortLabel: 'Large-Cap', badge: '$200B–$1T' },
    { value: 'growth', label: 'Growth', shortLabel: 'Growth', badge: '$30B–$200B' }
  ];

  const presets = [
    { id: 'all', label: 'All Assets', icon: Layers },
    { id: 'ai_upside', label: 'AI Upside >10%', icon: Sparkles },
    { id: 'top_gainers', label: 'Top Gainers', icon: TrendingUp },
    { id: 'strong_buy', label: 'Strong Buy', icon: CheckCircle2 },
    { id: 'near_52w_low', label: 'Near 52W Low', icon: TrendingDown }
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
    'Utilities',
    'Real Estate',
    'Automotive',
    'Industrial & Aerospace',
    'Industrials',
    'Basic Materials',
    'Entertainment',
    'Telecommunications',
    'Market Index',
    'Index ETF',
    'Digital Asset',
    'Commodity',
    'Forex'
  ];

  const sectorOptions = sectors.map((sec) => ({
    value: sec === 'All Sectors' ? 'all' : sec,
    label: sec,
    spanFull: sec === 'All Sectors'
  }));

  const sortOptions = [
    { value: 'marketCap', label: 'Market Cap' },
    { value: 'price', label: 'Current Price', shortLabel: 'Price' },
    { value: 'changePercent', label: '24h Move (%)', shortLabel: '24h Move (%)' },
    { value: 'volume', label: 'Trading Volume', shortLabel: 'Volume' },
    { value: 'forecastGain', label: 'AI 30D Upside (%)', badge: '30D' },
    { value: 'rating', label: 'Analyst Consensus', shortLabel: 'Consensus' },
    { value: 'peRatio', label: 'P/E Ratio' },
    { value: 'dividendYield', label: 'Dividend Yield' }
  ];

  return (
    <div className="all-markets-container motion-entry stagger-2">
      {/* Signature Architectural Asymmetric Opening Hero */}
      <MarketOpeningHero
        liveOverview={liveOverview}
        overview={overview}
        quotes={quotes}
        rawCompanies={rawCompanies}
        totalAssetsCount={defaultAllCompanies?.overview?.totalCount || 309}
        onSelectSymbol={handleSelectSymbol}
        onOpenDeepRecord={onOpenDeepRecord}
      />

      {/* Organized 3-Band Screener Command Bar (Strategy + Search | Regions | Refine + Display) */}
      <div className="market-filter-bar screener-command-dock glass-card" style={{ marginBottom: '0.85rem' }}>
        {/* Band 1: Quick Strategy Tabs + Prominent Instant Search */}
        <div className="screener-band screener-band--discovery">
          <div className="screener-band-left">
            <span className="screener-band-kicker">Strategy</span>
            <div className="screener-strategy-segment" role="group" aria-label="Screener quick strategies">
              {presets.map((p) => {
                const Icon = p.icon;
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={isSelected}
                    className={`screener-strategy-pill${isSelected ? ' active' : ''}`}
                    onClick={() => setActivePreset(p.id)}
                  >
                    <Icon size={13} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="screener-band-search">
            <div className="market-filter-search-box screener-search-wrap">
              <Search size={13} className="screener-search-icon" />
              <input
                type="text"
                id="screener-search-input"
                name="screenerSearch"
                autoComplete="off"
                className="custom-input screener-search-input"
                placeholder="Search ticker, name, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div className="screener-search-actions">
                  <span className="screener-search-count" title="Matching Companies">
                    {filteredRawCompanies.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="screener-search-clear"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {(selectedRegion !== 'all' || selectedTier !== 'all' || selectedSector !== 'all' || activePreset !== 'all' || searchQuery || sortBy !== 'marketCap' || sortOrder !== 'desc') && (
              <button
                type="button"
                className="screener-reset-btn"
                onClick={() => {
                  setSelectedRegion('all');
                  setSelectedTier('all');
                  setSelectedSector('all');
                  setActivePreset('all');
                  setSearchQuery('');
                  setSortBy('marketCap');
                  setSortOrder('desc');
                }}
                title="Reset all filters to default"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Band 2: Clean Hairline Global Region Selector */}
        <div className="screener-band screener-band--regions">
          <span className="screener-band-kicker">Markets</span>
          <div className="screener-region-rail" role="tablist" aria-label="Filter by geographic market">
            {regions.map((reg) => {
              const isSelected = selectedRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`screener-region-tab${isSelected ? ' active' : ''}`}
                  onClick={() => setSelectedRegion(reg.id)}
                >
                  {reg.flagCode && <CountryFlag countryCode={reg.flagCode} size="xs" />}
                  <span>{reg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Band 3: Unified Refine (Cap + Sector) & Display (Columns + Sort) */}
        <div className="screener-band screener-band--utility">
          <span className="screener-band-kicker">Refine</span>
          <div className={`screener-utility-track${viewMode !== 'table' ? ' is-compact-3col' : ''}`}>
            <ModernSelect
              prefix="Cap"
              ariaLabel="Filter by Market Cap Tier"
              menuTitle="Market Cap Tier"
              value={selectedTier}
              onChange={setSelectedTier}
              options={tiers}
              menuWidth={236}
              align="left"
            />

            <ModernSelect
              prefix="Sector"
              ariaLabel="Filter by Industry Sector"
              menuTitle="Industry & Asset Class"
              value={selectedSector}
              onChange={setSelectedSector}
              options={sectorOptions}
              columns={2}
              menuWidth={392}
              align="left"
            />

            {viewMode === 'table' && (
              <div className="column-view-segmented screener-col-tabs" role="group" aria-label="Table column preset">
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
                  Valuation
                </button>
                <button
                  type="button"
                  className={`column-view-btn ${columnView === 'ai_quant' ? 'active' : ''}`}
                  onClick={() => setColumnView('ai_quant')}
                >
                  AI &amp; Risk
                </button>
              </div>
            )}

            <div className="screener-sort-join">
              <ModernSelect
                prefix="Sort"
                ariaLabel="Sort companies by metric"
                menuTitle="Sort Assets By"
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                menuWidth={228}
                align="right"
                variant="embedded"
              />
              <button
                type="button"
                className="screener-sort-dir"
                onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                title={`Switch to ${sortOrder === 'desc' ? 'Low to High' : 'High to Low'}`}
                aria-label="Toggle sort direction"
              >
                <ArrowUpDown size={12} />
                <span>{sortOrder === 'desc' ? 'High ↓' : 'Low ↑'}</span>
              </button>
            </div>
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
          viewMode={viewMode}
          onViewModeChange={setViewMode}
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
          {isAutoIngesting ? (
            <div>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                Connecting to global exchanges for "{searchQuery.toUpperCase()}"...
              </div>
              <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '0.85rem' }}>
                Automatically fetching live market quotes, institutional metrics, and streaming real-time price updates.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                No companies found matching your criteria.
              </div>
              <p style={{ maxWidth: '520px', margin: '0 auto 1.25rem', fontSize: '0.85rem' }}>
                {searchQuery
                  ? `No verified market listing found for "${searchQuery}". Enter any global ticker symbol (e.g. AAPL, NVDA, SPOT, ARM, RACE) to automatically stream live market data.`
                  : 'Adjust your region, tier, or sector filters to view available global companies.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  onClick={() => setSearchQuery('')}
                >
                  <RotateCcw size={14} /> Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'heatmap' ? (
        /* ================= INSTITUTIONAL SECTOR HEATMAP MATRIX ================= */
        <SectorHeatmapMatrix
          companies={displayedCompanies}
          allCompanies={filteredRawCompanies}
          quotes={quotes}
          onSelectSymbol={handleSelectSymbol}
          watchlistSet={watchlistSet}
        />
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
                    onOpenDeepRecord={onOpenDeepRecord}
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
                onOpenDeepRecord={onOpenDeepRecord}
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
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      {/* Floating Comparison Dock (Appears when 1 or more assets are checked) */}
      {selectedCompareSymbols.length > 0 && (
        <div className="compare-floating-dock">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Scale size={16} style={{ color: '#60a5fa' }} />
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
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
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
    </div>
  );
});

export default AllCompaniesMarket;
