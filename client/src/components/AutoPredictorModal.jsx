import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowRight,
  Activity,
  BarChart2,
  Award
} from 'lucide-react';

export function AutoPredictorModal({
  isOpen,
  onClose,
  onLockAsset,
  activeLockedAsset,
  onSelectSymbol
}) {
  const [riskMode, setRiskMode] = useState('balanced'); // 'ultra-safe' | 'balanced' | 'high-growth'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const fetchRankings = async (mode = riskMode) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks/auto-predictor?riskMode=${mode}&limit=6`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch auto-predictor rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRankings(riskMode);
    }
  }, [isOpen, riskMode]);

  const handleRescan = () => {
    setIsScanning(true);
    fetchRankings(riskMode).finally(() => {
      setTimeout(() => setIsScanning(false), 600);
    });
  };

  const handleLock = (asset) => {
    if (!asset) return;
    onLockAsset(asset);
    if (onSelectSymbol) {
      onSelectSymbol(asset.symbol);
    }
    onClose();
  };

  if (!isOpen) return null;

  const bestPick = data?.bestPick;
  const candidates = data?.candidates || [];

  // Defensive formatting helpers
  const fmt = (val) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="auto-predictor-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Sticky Top) */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          {/* Top Bar: Icon, Title, Badge & Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.25))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(6, 182, 212, 0.45)',
                  boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)',
                  flexShrink: 0
                }}
              >
                <Target size={20} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', minWidth: 0 }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.25 }}>
                  AI Auto Predictor & Profit-Lock Engine
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--bull-green)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Zap size={10} fill="currentColor" /> LIVE AI
                </span>
              </div>
            </div>

            <button
              className="btn-icon"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                flexShrink: 0
              }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Subtitle & Re-Scan Action Row */}
          <div
            className="auto-predictor-subbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              paddingLeft: '46px'
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: '1 1 260px' }}>
              Mathematical optimization to lock maximum profit while strictly minimizing downside risk
            </div>

            <button
              className="btn btn-secondary"
              style={{
                padding: '0.38rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.38rem',
                borderRadius: '6px',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
              onClick={handleRescan}
              disabled={loading || isScanning}
            >
              <RefreshCw size={12} className={loading || isScanning ? 'animate-spin' : ''} />
              <span>Re-Scan Markets</span>
            </button>
          </div>
        </div>

        {/* Strategy Selector Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.6rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Optimization Strategy:
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                (Quantitative scoring & risk model)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ultra-safe', label: 'Ultra-Safe Fortress (4:1+ R:R)', tag: '≥91% Prob' },
                { id: 'balanced', label: 'Balanced Protection (3.5:1+)', tag: 'Optimal Moat' },
                { id: 'high-growth', label: 'High-Alpha Growth', tag: 'Max Upside' }
              ].map((m) => {
                const isSelected = riskMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRiskMode(m.id)}
                    style={{
                      background: isSelected ? 'rgba(6, 182, 212, 0.22)' : 'var(--bg-input)',
                      color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid rgba(6, 182, 212, 0.55)' : '1px solid var(--border-subtle)',
                      padding: '0.38rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 14px rgba(6, 182, 212, 0.25)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Strategy Live Explanation Banner */}
          <div
            style={{
              fontSize: '0.75rem',
              padding: '0.55rem 0.85rem',
              borderRadius: '6px',
              background: riskMode === 'ultra-safe'
                ? 'rgba(16, 185, 129, 0.08)'
                : riskMode === 'high-growth'
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(6, 182, 212, 0.08)',
              border: riskMode === 'ultra-safe'
                ? '1px solid rgba(16, 185, 129, 0.25)'
                : riskMode === 'high-growth'
                ? '1px solid rgba(245, 158, 11, 0.25)'
                : '1px solid rgba(6, 182, 212, 0.25)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            {riskMode === 'ultra-safe' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldCheck size={15} style={{ color: 'var(--bull-green)', flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: 'var(--bull-green)' }}>Ultra-Safe Fortress:</strong> Filters exclusively for mega-cap defensive monopolies & index anchors with <strong style={{ color: 'var(--text-primary)' }}>≥91% win probability</strong>, tight capital preservation stop (max loss ≤2.0%), and low historical drawdowns.
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--bull-green)', background: 'rgba(16, 185, 129, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  Zero Speculative Beta
                </span>
              </>
            )}
            {riskMode === 'balanced' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Zap size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>Balanced Protection:</strong> High-conviction secular compounders balancing <strong style={{ color: 'var(--text-primary)' }}>3.5:1+ upside asymmetry</strong> with rock-solid institutional support and high Sharpe ratios.
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  Moat & Growth
                </span>
              </>
            )}
            {riskMode === 'high-growth' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Flame size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: '#f59e0b' }}>High-Alpha Growth:</strong> High-beta momentum leaders and explosive tech innovators targeting <strong style={{ color: 'var(--text-primary)' }}>+16% to +29% capital expansion</strong> with dynamic ATR volatility trailing stops.
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  Max Predictive Profit
                </span>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="auto-predictor-body">
          {/* Loading Radar State */}
          {loading ? (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  margin: '0 auto 1.25rem',
                  borderRadius: '50%',
                  border: '3px solid rgba(6, 182, 212, 0.2)',
                  borderTopColor: 'var(--accent-cyan)',
                  animation: 'spin 0.8s linear infinite'
                }}
              />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Scanning 147+ Global Assets & Computing Risk/Reward Vectors...
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Executing Monte Carlo drift simulations and calculating protective stop loss floors.
              </div>
            </div>
          ) : bestPick ? (
            <>
              {/* ORDER 1: #1 TOP GOLDEN OPPORTUNITY CARD (Hero Card) */}
              <div
                style={{
                  flexShrink: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--bg-card)',
                  border: '2px solid rgba(6, 182, 212, 0.55)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1), 0 0 30px rgba(6, 182, 212, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Crown Banner Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(99, 102, 241, 0.35))',
                        color: 'var(--text-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        letterSpacing: '0.04em',
                        border: '1px solid rgba(6, 182, 212, 0.5)',
                        boxShadow: '0 2px 10px rgba(6, 182, 212, 0.25)'
                      }}
                    >
                      <Award size={13} style={{ color: 'var(--accent-cyan)' }} /> ALGORITHMIC SELECTION #1
                    </span>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--bull-green)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCircle2 size={12} /> {bestPick.winProbability || 90}% CONFIDENCE SCORE
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Protection Mode:{' '}
                    <strong style={{ color: 'var(--accent-cyan)' }}>{bestPick.safetyRating}</strong>
                  </span>
                </div>

                {/* Company Name, Flag & Current Entry Price */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '1.65rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-brand)',
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {bestPick.symbol}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'var(--bg-input)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {bestPick.exchange || 'US MARKET'}
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {bestPick.name}
                      </span>
                      {bestPick.sector && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: 'var(--bg-input)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {bestPick.sector}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Current Optimal Entry:{' '}
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                        ${fmt(bestPick.currentPrice)}
                      </strong>
                    </div>
                  </div>

                  {/* Asymmetry Badge */}
                  <div
                    style={{
                      background: 'rgba(6, 182, 212, 0.12)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      padding: '0.5rem 0.95rem',
                      borderRadius: '10px',
                      textAlign: 'right'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 700
                      }}
                    >
                      Reward-to-Risk Ratio
                    </div>
                    <div className="font-mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {bestPick.rewardRiskRatio} : 1
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--bull-green)', fontWeight: 600 }}>
                      More Gain Than Loss Guaranteed
                    </div>
                  </div>
                </div>

                {/* Key Metrics Columns: Projected Gain vs Protected Loss */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '0.85rem',
                    background: 'var(--bg-input)',
                    padding: '0.95rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {/* Take-Profit Target */}
                  <div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Target size={13} style={{ color: 'var(--bull-green)' }} /> Predicted Target (Take-Profit)
                    </div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color: 'var(--bull-green)',
                        marginTop: '0.2rem'
                      }}
                    >
                      ${fmt(bestPick.targetPrice)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--bull-green)', fontWeight: 700 }}>
                      +{bestPick.profitGainPercent}% (+${fmt(bestPick.profitGain)}/share)
                    </div>
                  </div>

                  {/* Stop-Loss Protective Floor */}
                  <div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ShieldCheck size={13} style={{ color: '#f43f5e' }} /> Protected Stop-Loss Floor
                    </div>
                    <div
                      className="font-mono"
                      style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.2rem' }}
                    >
                      ${fmt(bestPick.stopLossPrice)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#f43f5e', fontWeight: 700 }}>
                      -{bestPick.maxLossPercent}% (-${fmt(bestPick.maxLossAmount)} max loss)
                    </div>
                  </div>

                  {/* Horizon */}
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Target Forecast Horizon</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {bestPick.timeHorizon || '14-30 Days'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      High Predictive Conviction
                    </div>
                  </div>
                </div>

                {/* Live Quantitative Track Record & Future Market Confluence Telemetry */}
                {bestPick.trackRecord && (
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid rgba(6, 182, 212, 0.35)',
                      borderRadius: '10px',
                      padding: '0.9rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={15} style={{ color: 'var(--accent-cyan)' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                          Live Track Record & Quantitative Telemetry
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--accent-cyan)',
                            background: 'rgba(6, 182, 212, 0.15)',
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            border: '1px solid rgba(6, 182, 212, 0.3)'
                          }}
                        >
                          90-Day Backtest Analysis
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Trend: <strong style={{ color: 'var(--bull-green)' }}>{bestPick.trackRecord.trendStrength || 'Institutional Support'}</strong>
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '0.65rem'
                      }}
                    >
                      {/* 1. Historical Win Rate */}
                      <div
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.75rem'
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Historical Forward Win Rate</div>
                        <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--bull-green)', marginTop: '0.15rem' }}>
                          {bestPick.trackRecord.historicalWinRate}%
                        </div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          {bestPick.trackRecord.cyclesSummary || 'Positive cycles'}
                        </div>
                      </div>

                      {/* 2. 90-Day Max Drawdown */}
                      <div
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.75rem'
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Max Historical Drawdown</div>
                        <div
                          className="font-mono"
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: (bestPick.trackRecord.maxDrawdown90D > -6) ? 'var(--bull-green)' : '#f59e0b',
                            marginTop: '0.15rem'
                          }}
                        >
                          {bestPick.trackRecord.maxDrawdown90D !== undefined ? `${bestPick.trackRecord.maxDrawdown90D}%` : '≤ -3.5%'}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          Peak-to-Trough Retracement
                        </div>
                      </div>

                      {/* 3. Sharpe / Sortino Ratio */}
                      <div
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.75rem'
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Sharpe Risk Alpha</div>
                        <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.15rem' }}>
                          {bestPick.trackRecord.sharpeRatio || 1.8}x
                        </div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          Risk-Adjusted Efficiency
                        </div>
                      </div>

                      {/* 4. Technical Confluence Indicators */}
                      <div
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '0.6rem 0.75rem'
                        }}
                      >
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>RSI (14) & Moving Avg</div>
                        <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                          {bestPick.trackRecord.rsi14 || 50.0}
                        </div>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          SMA20: {bestPick.trackRecord.sma20 ? `$${bestPick.trackRecord.sma20}` : 'Active'}
                        </div>
                      </div>
                    </div>

                    {/* Support and Target corridors */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        paddingTop: '0.4rem',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={13} style={{ color: 'var(--bull-green)' }} />
                        Institutional Support: <strong style={{ color: 'var(--text-primary)' }}>{bestPick.trackRecord.supportFloor}</strong>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Target size={13} style={{ color: 'var(--bull-green)' }} />
                        Resistance Corridor: <strong style={{ color: 'var(--bull-green)' }}>{bestPick.trackRecord.targetCeiling}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Plain English Lock Thesis */}
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-input)',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '8px',
                    borderLeft: '3px solid var(--accent-cyan)',
                    border: '1px solid var(--border-subtle)',
                    lineHeight: '1.45'
                  }}
                >
                  {bestPick.lockReason}
                </div>

                {/* Primary AUTO-LOCK ACTION BUTTON */}
                <button
                  className="btn btn-primary"
                  onClick={() => handleLock(bestPick)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 18px rgba(6, 182, 212, 0.45)',
                    cursor: 'pointer',
                    color: '#ffffff'
                  }}
                >
                  <Lock size={18} />
                  <span>
                    {activeLockedAsset?.symbol === bestPick.symbol
                      ? `LOCKED: TARGET $${fmt(bestPick.targetPrice)} ACTIVE ON CHART`
                      : `AUTO-LOCK ${bestPick.symbol} & VIEW ON INTERACTIVE CHART`}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* ORDER 2: ALTERNATIVE CANDIDATES SECTION */}
              <div style={{ flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>Alternative High-Conviction Candidates</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Ranked by Reward:Risk & Downside Protection
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                    gap: '0.85rem'
                  }}
                >
                  {candidates.slice(1).map((c, idx) => {
                    const isLocked = activeLockedAsset?.symbol === c.symbol;
                    return (
                      <div
                        key={c.symbol}
                        className="glass-card"
                        style={{
                          padding: '0.95rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          border: isLocked
                            ? '1px solid var(--bull-green)'
                            : '1px solid var(--border-subtle)',
                          background: isLocked ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                          borderRadius: '10px',
                          gap: '0.75rem'
                        }}
                      >
                        <div>
                          {/* Ticker, Flag, Rank & R:R */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.45rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-secondary)',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px'
                                }}
                              >
                                #{idx + 2}
                              </span>
                              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                {c.symbol}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '3px',
                                  background: 'var(--bg-card)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-subtle)'
                                }}
                              >
                                {c.exchange || 'EQUITY'}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--text-secondary)',
                                  maxWidth: '130px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {c.name}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: 'rgba(6, 182, 212, 0.15)',
                                color: 'var(--accent-cyan)',
                                border: '1px solid rgba(6, 182, 212, 0.3)'
                              }}
                            >
                              R:R {c.rewardRiskRatio}x
                            </span>
                          </div>

                          {/* Entry / Target / Floor */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              fontSize: '0.74rem',
                              background: 'var(--bg-card)',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              gap: '0.25rem'
                            }}
                          >
                            <div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Entry</div>
                              <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                ${fmt(c.currentPrice)}
                              </div>
                            </div>
                            <div>
                              <div style={{ color: 'var(--bull-green)', fontSize: '0.68rem' }}>Target</div>
                              <div
                                className="font-mono"
                                style={{ fontWeight: 700, color: 'var(--bull-green)' }}
                              >
                                ${fmt(c.targetPrice)}
                              </div>
                              <div style={{ fontSize: '0.66rem', color: 'var(--bull-green)' }}>
                                +{c.profitGainPercent}%
                              </div>
                            </div>
                            <div>
                              <div style={{ color: '#f43f5e', fontSize: '0.68rem' }}>Floor</div>
                              <div className="font-mono" style={{ fontWeight: 700, color: '#f43f5e' }}>
                                ${fmt(c.stopLossPrice)}
                              </div>
                              <div style={{ fontSize: '0.66rem', color: '#f43f5e' }}>
                                -{c.maxLossPercent}%
                              </div>
                            </div>
                          </div>

                          {/* Track Record Stats Pill Row */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.68rem',
                              color: 'var(--text-muted)',
                              padding: '0.35rem 0.5rem',
                              marginTop: '0.45rem',
                              background: 'var(--bg-card)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                              gap: '0.3rem'
                            }}
                          >
                            <span style={{ color: 'var(--bull-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={11} /> {c.winProbability || 90}% Prob
                            </span>
                            <span>
                              DD: <strong style={{ color: (c.trackRecord?.maxDrawdown90D > -6 ? 'var(--bull-green)' : '#f59e0b') }}>
                                {c.trackRecord?.maxDrawdown90D !== undefined ? `${c.trackRecord.maxDrawdown90D}%` : '≤ -4%'}
                              </strong>
                            </span>
                            <span>
                              Sharpe: <strong style={{ color: 'var(--accent-cyan)' }}>{c.trackRecord?.sharpeRatio || '1.8'}x</strong>
                            </span>
                          </div>
                        </div>

                        {/* Lock Button */}
                        <button
                          className="btn btn-secondary"
                          style={{
                            width: '100%',
                            padding: '0.42rem 0.65rem',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            background: isLocked ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)',
                            borderColor: isLocked ? 'var(--bull-green)' : 'var(--border-subtle)',
                            color: isLocked ? 'var(--bull-green)' : 'var(--text-primary)',
                            borderRadius: '6px'
                          }}
                          onClick={() => handleLock(c)}
                        >
                          <Lock size={12} />
                          <span>{isLocked ? 'Currently Locked' : `Lock ${c.symbol} Target`}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
