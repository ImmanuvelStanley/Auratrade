import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  Calendar,
  Sparkles,
  BarChart3,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Info
} from 'lucide-react';

export const MultiYearPatternAnalysisCard = React.memo(function MultiYearPatternAnalysisCard({
  patternData,
  activeRange,
  onSelectRange,
  symbol
}) {
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [hoveredYear, setHoveredYear] = useState(null);

  if (!patternData) return null;

  const {
    yearsSpan,
    startDateFormatted,
    endDateFormatted,
    startPrice,
    endPrice,
    totalReturnDollars,
    totalReturnPercent,
    cagr,
    peak,
    trough,
    maxDrawdown,
    annualizedVol,
    yearlyBreakdown,
    upYearsCount,
    totalYears,
    winRateYears,
    bestYear,
    worstYear,
    patternType,
    patternBadgeColor,
    patternDescription,
    marketRegime,
    patternConfidence,
    clientTakeaway
  } = patternData;

  const isOverallBullish = totalReturnPercent >= 0;

  return (
    <div
      className="glass-card"
      style={{
        marginTop: '0.75rem',
        padding: '1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        minWidth: 0,
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.28rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.18), rgba(99, 102, 241, 0.18))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: 'var(--accent-cyan)',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.03em'
            }}
          >
            <Sparkles size={14} />
            <span>{activeRange} PAST TRACK & PATTERN REPORT</span>
          </div>

          <span
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.76rem',
              fontWeight: 800,
              background: `${patternBadgeColor}1a`,
              color: patternBadgeColor,
              border: `1px solid ${patternBadgeColor}4d`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Activity size={12} />
            {patternType}
          </span>

          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Award size={12} style={{ color: '#10b981' }} />
            {patternConfidence}% Confidence • {marketRegime}
          </span>
        </div>

        {/* 5Y / 10Y Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'var(--bg-input)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {['5Y', '10Y'].map((rng) => (
              <button
                key={rng}
                type="button"
                onClick={() => onSelectRange && onSelectRange(rng)}
                style={{
                  background: activeRange === rng ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))' : 'transparent',
                  color: activeRange === rng ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {rng} Track
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowDetailedReport(!showDetailedReport)}
            className="btn-icon"
            style={{
              padding: '0.28rem 0.55rem',
              fontSize: '0.72rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="Toggle Detailed Analysis & Risk Breakdown"
          >
            <span>{showDetailedReport ? 'Hide Details' : 'Full Report'}</span>
            {showDetailedReport ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Primary Track Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: '0.75rem',
          marginTop: '0.85rem'
        }}
      >
        {/* Metric 1: Total Return */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {activeRange} Total Return
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginTop: '0.2rem',
              color: isOverallBullish ? 'var(--bull-green)' : 'var(--bear-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isOverallBullish ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isOverallBullish ? '+' : ''}{totalReturnPercent}%</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            ${startPrice} → ${endPrice} ({isOverallBullish ? '+' : ''}${totalReturnDollars})
          </div>
        </div>

        {/* Metric 2: CAGR */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Annualized CAGR
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginTop: '0.2rem',
              color: cagr >= 0 ? '#38bdf8' : '#f87171'
            }}
          >
            {cagr >= 0 ? '+' : ''}{cagr}% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ yr</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Compounded across {yearsSpan} yrs
          </div>
        </div>

        {/* Metric 3: Peak (ATH / Period High) */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {activeRange} High (Peak)
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginTop: '0.2rem',
              color: 'var(--text-primary)'
            }}
          >
            ${peak.price}
          </div>
          <div style={{ fontSize: '0.68rem', color: peak.distancePercent >= -5 ? '#34d399' : 'var(--text-muted)', marginTop: '0.2rem' }}>
            {peak.distancePercent}% from Peak ({peak.dateFormatted})
          </div>
        </div>

        {/* Metric 4: Trough (Period Low) */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {activeRange} Low (Trough)
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginTop: '0.2rem',
              color: 'var(--text-primary)'
            }}
          >
            ${trough.price}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--bull-green)', marginTop: '0.2rem' }}>
            +{trough.gainPercent}% up from Low ({trough.dateFormatted})
          </div>
        </div>

        {/* Metric 5: Calendar Win Rate */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Annual Win Track
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginTop: '0.2rem',
              color: winRateYears >= 65 ? '#10b981' : '#f59e0b'
            }}
          >
            {winRateYears}%
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {upYearsCount} of {totalYears} Positive Years
          </div>
        </div>

        {/* Metric 6: Max Drawdown */}
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Max Drawdown (MDD)
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginTop: '0.2rem',
              color: maxDrawdown.percent <= -40 ? '#f43f5e' : '#f59e0b'
            }}
          >
            {maxDrawdown.percent}%
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Peak ${maxDrawdown.peakPrice} → ${maxDrawdown.troughPrice}
          </div>
        </div>
      </div>

      {/* Year-by-Year Past Track Matrix Ribbon */}
      <div style={{ marginTop: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.45rem',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}
        >
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span>Calendar Year Performance Track Matrix</span>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Best: <strong style={{ color: '#10b981' }}>{bestYear?.year} (+{bestYear?.returnPercent}%)</strong> • Worst: <strong style={{ color: '#f43f5e' }}>{worstYear?.year} ({worstYear?.returnPercent}%)</strong>
          </div>
        </div>

        {/* Strip of Year Chips */}
        <div
          style={{
            display: 'flex',
            gap: '0.45rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {yearlyBreakdown.map((item) => {
            const isBest = bestYear && item.year === bestYear.year;
            const isWorst = worstYear && item.year === worstYear.year && !item.isPositive;
            const isHovered = hoveredYear === item.year;

            return (
              <div
                key={item.year}
                onMouseEnter={() => setHoveredYear(item.year)}
                onMouseLeave={() => setHoveredYear(null)}
                style={{
                  flex: '1 0 76px',
                  minWidth: '72px',
                  padding: '0.4rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: item.isPositive
                    ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.04) 100%)'
                    : 'linear-gradient(180deg, rgba(244, 63, 94, 0.16) 0%, rgba(244, 63, 94, 0.04) 100%)',
                  border: isHovered
                    ? `1px solid ${item.isPositive ? '#10b981' : '#f43f5e'}`
                    : `1px solid ${item.isPositive ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                title={`${item.year}: Open $${item.open} • Close $${item.close} • High $${item.high} • Low $${item.low} (${item.barsCount} weekly bars)`}
              >
                {isBest && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-4px',
                      background: '#10b981',
                      color: '#fff',
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      padding: '1px 3px',
                      borderRadius: '3px'
                    }}
                  >
                    BEST
                  </span>
                )}
                {isWorst && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-4px',
                      background: '#f43f5e',
                      color: '#fff',
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      padding: '1px 3px',
                      borderRadius: '3px'
                    }}
                  >
                    LOW
                  </span>
                )}
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {item.year}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    marginTop: '0.15rem',
                    color: item.isPositive ? 'var(--bull-green)' : 'var(--bear-red)'
                  }}
                >
                  {item.isPositive ? '+' : ''}{item.returnPercent}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pattern Structure Narrative & Client Advisory Box */}
      <div
        style={{
          marginTop: '0.85rem',
          padding: '0.75rem 0.9rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm)',
          borderLeft: `3px solid ${patternBadgeColor}`,
          fontSize: '0.76rem',
          lineHeight: '1.45',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Info size={13} style={{ color: patternBadgeColor }} />
          <span>Institutional Pattern Analysis & Track Structure:</span>
        </div>
        <p style={{ margin: 0 }}>
          {patternDescription}
        </p>
      </div>

      {/* Expandable Detailed Report (Risk, Volatility, Sharpe, Drawdown Epochs) */}
      {showDetailedReport && (
        <div
          style={{
            marginTop: '0.85rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '0.75rem',
            fontSize: '0.74rem'
          }}
        >
          <div style={{ padding: '0.6rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Cyclical Risk & Drawdown Tolerance
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-secondary)' }}>
              <div>• Annualized Volatility: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{annualizedVol}%</strong></div>
              <div>• Worst Cycle Decline: <strong className="font-mono" style={{ color: '#f43f5e' }}>{maxDrawdown.percent}%</strong> ({maxDrawdown.peakDateFormatted} to {maxDrawdown.troughDateFormatted})</div>
              <div>• Distance from Trough Floor: <strong className="font-mono" style={{ color: '#10b981' }}>+{trough.gainPercent}%</strong></div>
            </div>
          </div>

          <div style={{ padding: '0.6rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              Client Long-Term Strategic Outlook
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {clientTakeaway}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default MultiYearPatternAnalysisCard;
