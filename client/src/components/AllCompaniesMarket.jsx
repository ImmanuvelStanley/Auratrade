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
import { defaultAllCompanies } from '../data/defaultAllCompanies';
import { CountryFlag } from './CountryFlag';

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
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="xs" />
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

        {/* Row Actions: Record, Chart, Trade, Alert, Bookmark */}
        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {onOpenDeepRecord && (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' }}
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
                    <CountryFlag country={c.country} countryCode={c.countryCode} symbol={c.symbol} size="sm" showCode={true} />
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

          {/* Card Action Buttons: Record, Chart, Trade, Alert, Bookmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }} onClick={(e) => e.stopPropagation()}>
            {onOpenDeepRecord && (
              <button
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.45rem', fontSize: '0.76rem', justifyContent: 'center', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' }}
                title="View Complete Stock Record & Valuation from Starting (IPO) Till Now"
                onClick={() => onOpenDeepRecord(c.symbol, c)}
              >
                Full Record
              </button>
            )}
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
    { id: 'all', label: overview?.totalCount ? `All Markets (${overview.totalCount})` : 'All Markets (166)' },
    { id: 'north_america', label: 'North America', flagCode: 'US' },
    { id: 'europe', label: 'Europe', flagCode: 'EU' },
    { id: 'asiapac', label: 'Asia-Pacific', flagCode: 'JP' },
    { id: 'india_emerging', label: 'India', flagCode: 'IN' },
    { id: 'latam_mideast', label: 'LatAm & MidEast', flagCode: 'UY' },
    { id: 'etf', label: 'Global & ETFs', flagCode: 'GL' }
  ];

  const tiers = [
    { id: 'all', label: 'All Tiers' },
    { id: 'mega', label: 'Mega-Cap ($1T+)' },
    { id: 'large', label: 'Large-Cap ($200B-$1T)' },
    { id: 'growth', label: 'Growth ($30B-$200B)' }
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
                Explore the premier companies of the world economy ordered by market capitalization, real-time valuation, and 30-day AI predictive upside with automated real-time global exchange feeds.
              </p>
            </div>

            {/* Right: Quick Action Toolbar (View Mode Switcher) */}
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
      <div className="market-filter-bar glass-card" style={{ marginBottom: '1rem', padding: '0.85rem 1rem' }}>
        {/* Row 1: Global Region Filter Tabs + Instant Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '0.75rem'
        }}>
          {/* Region Tabs with National/Regional Flags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', minWidth: 0, flex: '1 1 auto' }}>
            {regions.map((reg) => {
              const isActive = selectedRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  type="button"
                  className={`tier-filter-btn ${isActive ? 'active' : ''}`}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.38rem 0.75rem',
                    height: '34px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    background: isActive ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isActive ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                    color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500
                  }}
                  onClick={() => setSelectedRegion(reg.id)}
                >
                  {reg.flagCode && (
                    <CountryFlag countryCode={reg.flagCode} size="xs" />
                  )}
                  <span>{reg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input (Aligned with 34px height) */}
          <div style={{ position: 'relative', minWidth: 'min(100%, 220px)', flex: '0 1 300px', height: '34px' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="custom-input"
              style={{
                width: '100%',
                height: '34px',
                paddingLeft: '2.2rem',
                paddingRight: searchQuery ? '4.8rem' : '0.85rem',
                fontSize: '0.8rem',
                borderRadius: '8px',
                boxSizing: 'border-box'
              }}
              placeholder="Search ticker, name, or country..."
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
                    fontSize: '0.66rem',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    padding: '0.1rem 0.35rem',
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

        {/* Row 2: Precision Screener Controls (Cap Tiers, Sector, Columns, Sort, Reset) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Left Group: Capitalization Tiers & Sector Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Tier Buttons */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
              {tiers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tier-filter-btn ${selectedTier === t.id ? 'active' : ''}`}
                  style={{
                    fontSize: '0.76rem',
                    padding: '0.3rem 0.65rem',
                    height: '34px',
                    borderRadius: '8px',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => setSelectedTier(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sector Dropdown */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Sector:</span>
              <select
                className="custom-input"
                style={{
                  height: '34px',
                  padding: '0.3rem 1.8rem 0.3rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  width: 'auto',
                  minWidth: '150px',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                {sectors.map((sec) => (
                  <option key={sec} value={sec === 'All Sectors' ? 'all' : sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Group: Table Columns View & Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Table View Column Selector */}
            {viewMode === 'table' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Columns:</span>
                <div className="column-view-segmented" style={{ height: '34px', boxSizing: 'border-box' }}>
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

            {/* Sort Dropdown */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Sort By:</span>
              <select
                className="custom-input"
                style={{
                  height: '34px',
                  padding: '0.3rem 1.8rem 0.3rem 0.7rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  width: 'auto',
                  minWidth: '160px',
                  borderRadius: '8px',
                  boxSizing: 'border-box'
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="marketCap">Market Cap</option>
                <option value="price">Current Price</option>
                <option value="changePercent">24h Gainers (%)</option>
                <option value="volume">Trading Volume</option>
                <option value="forecastGain">AI 30-Day Upside (%)</option>
                <option value="rating">Analyst Consensus</option>
                <option value="peRatio">P/E Ratio</option>
                <option value="dividendYield">Dividend Yield</option>
              </select>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  height: '34px',
                  padding: '0 0.7rem',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}
                onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                title={`Switch to ${sortOrder === 'desc' ? 'Ascending (Low to High)' : 'Descending (High to Low)'}`}
              >
                <ArrowUpDown size={13} />
                <span>{sortOrder === 'desc' ? 'High → Low' : 'Low → High'}</span>
              </button>
            </div>

            {/* Quick Reset Button (Visible whenever filters differ from defaults) */}
            {(selectedRegion !== 'all' || selectedTier !== 'all' || selectedSector !== 'all' || searchQuery || sortBy !== 'marketCap' || sortOrder !== 'desc') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRegion('all');
                  setSelectedTier('all');
                  setSelectedSector('all');
                  setSearchQuery('');
                  setSortBy('marketCap');
                  setSortOrder('desc');
                }}
                style={{
                  height: '34px',
                  padding: '0 0.65rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s ease'
                }}
                title="Reset all filters to default"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
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
    </div>
  );
});

export default AllCompaniesMarket;
