import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Crosshair,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Clock,
  Activity,
  Target,
  SlidersHorizontal,
  ArrowUpRight,
  Compass,
  Layers
} from 'lucide-react';
import { getCurrencySymbol, getDefaultExpectationsForMode } from '../utils/predictorEngine';

const HORIZON_OPTIONS = [
  { key: '7d', label: '7 Days', sub: 'Swing' },
  { key: '30d', label: '30 Days', sub: 'Monthly' },
  { key: '90d', label: '90 Days', sub: 'Quarterly' },
  { key: '1y', label: '1 Year', sub: 'Positional' }
];

const REGION_OPTIONS = [
  { key: 'all', label: 'All Global Markets (309)' },
  { key: 'north_america', label: 'US & North America' },
  { key: 'india_emerging', label: 'India (NSE / BSE / MCX)' },
  { key: 'europe', label: 'Europe (EMEA)' },
  { key: 'asia_pacific', label: 'Asia-Pacific' },
  { key: 'etf', label: 'ETFs, Metals & FX' }
];

const SECTOR_OPTIONS = [
  { key: 'all', label: 'All Sectors' },
  { key: 'Technology', label: 'Technology & AI' },
  { key: 'Financial Services', label: 'Financial Services' },
  { key: 'Healthcare', label: 'Healthcare & Pharma' },
  { key: 'Precious Metals', label: 'Precious Metals' },
  { key: 'Energy', label: 'Energy & Oil' },
  { key: 'Consumer Cyclical', label: 'Consumer & Auto' },
  { key: 'Industrials', label: 'Industrials & Defense' },
  { key: 'Global Index', label: 'Global Indices' },
  { key: 'Crypto ETF / Digital', label: 'Digital Assets & ETFs' }
];

function formatMoney(val, currSym = '$') {
  const num = Number(val);
  if (!Number.isFinite(num)) return `${currSym}0.00`;
  if (Math.abs(num) >= 1000) {
    return `${currSym}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currSym}${num.toFixed(2)}`;
}

export const AutoPredictorModal = ({
  isOpen,
  onClose,
  onLockAsset,
  activeLockedAsset,
  onSelectSymbol,
  onOpenTradeModal
}) => {
  const [riskMode, setRiskMode] = useState('balanced');
  const [horizon, setHorizon] = useState('30d');
  const [targetReturn, setTargetReturn] = useState(12.0);
  const [maxRisk, setMaxRisk] = useState(3.2);
  const [region, setRegion] = useState('all');
  const [sector, setSector] = useState('all');
  const [budget, setBudget] = useState(10000);

  const [data, setData] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const handlePresetChange = (newRisk, newHorizon = horizon) => {
    setRiskMode(newRisk);
    setHorizon(newHorizon);
    const defaults = getDefaultExpectationsForMode(newRisk, newHorizon);
    setTargetReturn(defaults.targetReturn);
    setMaxRisk(defaults.maxRisk);
  };

  const runGoalScan = useCallback(async (paramsOverride = null) => {
    const p = paramsOverride || {
      riskMode,
      horizon,
      targetReturn,
      maxRisk,
      region,
      sector,
      budget
    };
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        riskMode: p.riskMode,
        horizon: p.horizon,
        targetReturn: String(p.targetReturn),
        maxRisk: String(p.maxRisk),
        region: p.region,
        sector: p.sector,
        budget: String(Math.max(100, Number(p.budget) || 10000)),
        limit: '6'
      });
      const res = await fetch(`/api/stocks/auto-predictor?${qs.toString()}`);
      const json = await res.json();
      if (json.success && (json.bestPick || (json.candidates && json.candidates.length > 0))) {
        setData(json);
        const firstPick = json.bestPick || json.candidates[0];
        setSelectedSymbol(firstPick?.symbol || null);
      } else {
        setError('No matching global assets found for the current filters.');
      }
    } catch (e) {
      setError('Unable to reach quantitative prediction engine.');
    } finally {
      setLoading(false);
    }
  }, [riskMode, horizon, targetReturn, maxRisk, region, sector, budget]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runGoalScan({ riskMode, horizon, targetReturn, maxRisk, region, sector, budget });
    }, 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen, riskMode, horizon, targetReturn, maxRisk, region, sector, budget, runGoalScan]);

  if (!isOpen) return null;

  const candidates = data?.candidates || [];
  const activePick = candidates.find((c) => c.symbol === selectedSymbol) || data?.bestPick || candidates[0] || null;
  const pickCurr = activePick ? (activePick.currencySymbol || getCurrencySymbol(activePick.currency)) : '$';
  const tr = activePick?.trackRecord;
  const activeHorizonStat = tr?.horizonStats?.[activePick?.horizon || horizon] || tr?.horizonStats?.['30d'];
  const isAlreadyActivePlan = Boolean(activePick && activeLockedAsset && activeLockedAsset.symbol === activePick.symbol);

  const handleActivateStrategyPlan = (pick) => {
    if (!pick) return;
    if (onLockAsset) {
      onLockAsset({
        ...pick,
        activatedAt: new Date().toISOString()
      });
    }
    if (onSelectSymbol) {
      onSelectSymbol(pick.symbol);
    }
    if (onClose) onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--bg-modal-overlay)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1040px',
          maxHeight: 'calc(100dvh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 100000,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-modal)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-hero-grad)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '11px',
                background: 'var(--bull-green-bg)',
                border: '1px solid var(--status-active-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bull-green)',
                flexShrink: 0
              }}
            >
              <Crosshair size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  AI Goal-Fit Predictor &amp; Strategy Blueprint
                </h2>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'var(--accent-primary-bg)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: 'var(--text-cyan)'
                  }}
                >
                  {data?.scannedCount || 309} GLOBAL ASSETS • 1Y BACKTESTED
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Set your expected return, risk limit, and horizon — the engine scans past records &amp; walk-forward backtests to rank your best-fit strategy.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close AI Goal-Fit Predictor"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {/* Interactive Expectation Controls */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '13px',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <SlidersHorizontal size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>Your Target Expectations</span>
                {data?.matchedPoolCount && (
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
                    ({data.matchedPoolCount} assets in filter)
                  </span>
                )}
              </div>

              {/* Risk Profile Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'ultra-safe', label: 'Ultra-Safe Capital' },
                  { id: 'balanced', label: 'Balanced Growth' },
                  { id: 'high-growth', label: 'High Momentum' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handlePresetChange(m.id)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '7px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: riskMode === m.id ? '1px solid var(--status-active-border)' : '1px solid var(--border-subtle)',
                      background: riskMode === m.id ? 'var(--bull-green-bg)' : 'var(--bg-card)',
                      color: riskMode === m.id ? 'var(--text-bull)' : 'var(--text-secondary)'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Input Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                gap: '12px',
                alignItems: 'end'
              }}
            >
              {/* Horizon */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>
                  INVESTMENT HORIZON
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {HORIZON_OPTIONS.map((h) => (
                    <button
                      key={h.key}
                      type="button"
                      onClick={() => handlePresetChange(riskMode, h.key)}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '7px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: horizon === h.key ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        background: horizon === h.key ? 'var(--accent-primary-bg)' : 'var(--bg-card)',
                        color: horizon === h.key ? 'var(--text-cyan)' : 'var(--text-secondary)'
                      }}
                    >
                      {h.key.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Return % */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>
                  <span>MIN EXPECTED RETURN</span>
                  <span style={{ color: 'var(--text-bull)', fontFamily: 'var(--font-mono)' }}>+{targetReturn}%</span>
                </div>
                <input
                  type="range"
                  min={horizon === '7d' ? 2 : horizon === '30d' ? 4 : horizon === '90d' ? 8 : 12}
                  max={horizon === '7d' ? 12 : horizon === '30d' ? 28 : horizon === '90d' ? 42 : 65}
                  step="0.5"
                  value={targetReturn}
                  onChange={(e) => setTargetReturn(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                />
              </div>

              {/* Max Risk Tolerance % */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>
                  <span>MAX RISK CAP</span>
                  <span style={{ color: 'var(--text-bear)', fontFamily: 'var(--font-mono)' }}>-{maxRisk}%</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max={horizon === '1y' ? 14 : horizon === '90d' ? 10 : 7.5}
                  step="0.2"
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer' }}
                />
              </div>

              {/* Market / Region */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>
                  MARKET / REGION
                </div>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '7px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 600
                  }}
                >
                  {REGION_OPTIONS.map((r) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Sector */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>
                  SECTOR FOCUS
                </div>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '7px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 600
                  }}
                >
                  {SECTOR_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Capital Allocation Budget */}
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '5px' }}>
                  ALLOCATION BUDGET
                </div>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(100, Number(e.target.value) || 10000))}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '7px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700
                  }}
                />
              </div>
            </div>
          </div>

          {/* Loading or Error */}
          {loading && !activePick && (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Scanning 309 global assets &amp; running 1-year walk-forward backtests against your goals...
            </div>
          )}

          {error && !activePick && (
            <div style={{ padding: '20px', borderRadius: '10px', background: 'var(--bear-red-bg)', border: '1px solid var(--status-triggered-border)', color: 'var(--text-bear)', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {/* Selected / Best Fit Strategy Blueprint */}
          {activePick && (
            <div
              style={{
                background: 'var(--bg-hero-grad)',
                border: '1px solid var(--status-active-border)',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                opacity: loading ? 0.65 : 1,
                transition: 'opacity 0.15s ease'
              }}
            >
              {/* Top Row: Identity + Match Score */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.18)',
                        color: 'var(--bull-green)',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      BEST GOAL MATCH • {activePick.timeHorizon}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {activePick.exchange} • {activePick.sector}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: 'var(--accent-primary-bg)',
                        color: 'var(--text-cyan)'
                      }}
                    >
                      {activePick.safetyRating}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.38rem', fontWeight: 900, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                      {activePick.symbol}
                    </span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {activePick.name}
                    </span>
                  </div>
                </div>

                {/* Match Score & Probabilities */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ padding: '8px 13px', borderRadius: '10px', background: 'var(--bull-green-bg)', border: '1px solid var(--status-active-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-bull)', textTransform: 'uppercase' }}>Expectation Fit</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--bull-green)', fontFamily: 'var(--font-mono)' }}>
                      {activePick.expectationMatchScore}%
                    </div>
                  </div>
                  <div style={{ padding: '8px 13px', borderRadius: '10px', background: 'var(--accent-primary-bg)', border: '1px solid rgba(56, 189, 248, 0.35)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-cyan)', textTransform: 'uppercase' }}>Win Probability</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {activePick.winProbability}%
                    </div>
                  </div>
                  <div style={{ padding: '8px 13px', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reward / Risk</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-amber)', fontFamily: 'var(--font-mono)' }}>
                      {activePick.rewardRiskRatio}:1
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Levels & Position Sizing Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '11px 13px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700 }}>CURRENT ENTRY</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '3px', color: 'var(--text-primary)' }}>
                    {formatMoney(activePick.entryPrice, pickCurr)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Live Benchmark Quote</div>
                </div>

                <div style={{ padding: '11px 13px', borderRadius: '10px', background: 'var(--bull-green-bg)', border: '1px solid var(--status-active-border)' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-bull)', fontWeight: 700 }}>AI GOAL TARGET ({(activePick.horizon || horizon).toUpperCase()})</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--bull-green)', marginTop: '3px' }}>
                    {formatMoney(activePick.targetPrice, pickCurr)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-bull)', fontWeight: 700, marginTop: '2px' }}>
                    +{activePick.profitGainPercent}% upside target
                  </div>
                </div>

                <div style={{ padding: '11px 13px', borderRadius: '10px', background: 'var(--bear-red-bg)', border: '1px solid var(--status-triggered-border)' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-bear)', fontWeight: 700 }}>ATR RISK GUARD FLOOR</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--bear-red)', marginTop: '3px' }}>
                    {formatMoney(activePick.stopLossPrice, pickCurr)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-bear)', fontWeight: 700, marginTop: '2px' }}>
                    -{activePick.maxLossPercent}% protective floor
                  </div>
                </div>

                <div style={{ padding: '11px 13px', borderRadius: '10px', background: 'var(--accent-primary-bg)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-cyan)', fontWeight: 700 }}>POSITION SIZING PLAN</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '3px' }}>
                    {activePick.suggestedShares} Units
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Est. +{formatMoney(activePick.projectedProfitAmount, pickCurr)} / -{formatMoney(activePick.maxRiskAmount, pickCurr)} risk
                  </div>
                </div>
              </div>

              {/* Multi-Horizon Trajectory */}
              {activePick.targets && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'd7', label: '7-Day Trajectory' },
                    { key: 'd30', label: '30-Day Target' },
                    { key: 'd90', label: '90-Day Target' },
                    { key: 'y1', label: '1-Year Target' }
                  ].map((item) => {
                    const t = activePick.targets[item.key];
                    if (!t) return null;
                    return (
                      <div
                        key={item.key}
                        style={{
                          padding: '8px 11px',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700 }}>{item.label}</div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '1px', color: 'var(--text-primary)' }}>
                            {formatMoney(t.price, pickCurr)}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-bull)', fontFamily: 'var(--font-mono)' }}>
                          +{t.gainPct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Past-Record Telemetry & Why This Fits */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '12px' }}>
                {/* Why It Fits */}
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    <Sparkles size={13} />
                    Why This Fits Your Expectations
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(activePick.fitReasons || [activePick.strategyRationale]).map((reason, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        <CheckCircle2 size={13} style={{ color: 'var(--bull-green)', marginTop: '2px', flexShrink: 0 }} />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Past-Record Verification Telemetry */}
                {tr && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-indigo)', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <BarChart3 size={13} />
                      Past-Record Backtest Verification (252D)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.73rem' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>Roll Win Rate</div>
                        <div style={{ fontWeight: 800, color: 'var(--text-bull)', fontFamily: 'var(--font-mono)' }}>
                          {activeHorizonStat?.winRate ?? tr.historicalWinRate}%
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>Walk-Fwd Acc</div>
                        <div style={{ fontWeight: 800, color: 'var(--text-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {tr.walkForwardAccuracy}%
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>1Y Realized</div>
                        <div style={{ fontWeight: 800, color: tr.realized1YReturn >= 0 ? 'var(--text-bull)' : 'var(--text-bear)', fontFamily: 'var(--font-mono)' }}>
                          {tr.realized1YReturn >= 0 ? '+' : ''}{tr.realized1YReturn}%
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>Sharpe / Sortino</div>
                        <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {tr.sharpeRatio}x / {tr.sortinoRatio}x
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>Max 90D DD</div>
                        <div style={{ fontWeight: 800, color: 'var(--text-bear)', fontFamily: 'var(--font-mono)' }}>
                          {tr.maxDrawdown90D}%
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.64rem' }}>RSI(14) / ATR</div>
                        <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {tr.rsi14} / {tr.atrPercent}%
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Trend Structure: <strong style={{ color: 'var(--text-secondary)' }}>{tr.trendStrength}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '4px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--bull-green)' }} />
                  <span>Activating overlays the Goal Target &amp; Risk Guard live progress tracker on the chart &amp; trade ticket.</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectSymbol) onSelectSymbol(activePick.symbol);
                      if (onClose) onClose();
                    }}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '9px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Compass size={14} /> Inspect Chart
                  </button>

                  {onOpenTradeModal && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onLockAsset) onLockAsset({ ...activePick, activatedAt: new Date().toISOString() });
                        if (onClose) onClose();
                        onOpenTradeModal(activePick.symbol);
                      }}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '9px',
                        border: '1px solid rgba(56, 189, 248, 0.45)',
                        background: 'var(--accent-primary-bg)',
                        color: 'var(--text-cyan)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ArrowUpRight size={14} /> Trade Blueprint
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleActivateStrategyPlan(activePick)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '9px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px'
                    }}
                  >
                    <Target size={15} />
                    {isAlreadyActivePlan ? 'Update Active Plan on Chart' : 'Activate Strategy Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Top Matched Candidates List */}
          {candidates.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} style={{ color: 'var(--accent-cyan)' }} />
                  Top Ranked Goal-Fit Candidates ({candidates.length})
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Click any candidate to inspect its full blueprint
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '9px' }}>
                {candidates.map((cand, idx) => {
                  const isSel = activePick?.symbol === cand.symbol;
                  const cSym = cand.currencySymbol || getCurrencySymbol(cand.currency);
                  return (
                    <div
                      key={cand.symbol}
                      onClick={() => setSelectedSymbol(cand.symbol)}
                      style={{
                        padding: '11px 13px',
                        borderRadius: '11px',
                        cursor: 'pointer',
                        background: isSel ? 'var(--accent-primary-bg)' : 'var(--bg-subtle)',
                        border: isSel ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-cyan)' }}>#{idx + 1}</span>
                          <span style={{ fontWeight: 800, fontSize: '0.86rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{cand.symbol}</span>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{cand.exchange}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '185px' }}>
                          {cand.name}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                          Target {formatMoney(cand.targetPrice, cSym)} • Floor {formatMoney(cand.stopLossPrice, cSym)}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-bull)', fontFamily: 'var(--font-mono)' }}>
                          +{cand.profitGainPercent}%
                        </div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-cyan)' }}>
                          {cand.expectationMatchScore}% Fit • {cand.winProbability}% Win
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                          {cand.rewardRiskRatio}:1 R:R
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoPredictorModal;
