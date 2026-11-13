import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Building2,
  Calculator,
  ShieldCheck,
  Sparkles,
  BookmarkPlus,
  BookmarkCheck,
  Bell,
  ShoppingCart,
  BarChart3,
  Layers,
  History,
  CheckCircle2,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useSocketQuote } from '../context/SocketContext';
import { CountryFlag } from './CountryFlag';
import { getCompleteStockRecord, formatRecordPrice, formatScaledMarketCap } from '../utils/stockRecordEngine';
import { floatingCardEvents } from '../utils/floatingCardEffect';

export const StockDeepRecordSection = React.memo(function StockDeepRecordSection({
  symbol,
  initialItem = null,
  isModal = false,
  isInWatchlist = false,
  onToggleWatchlist,
  onOpenAlertModal,
  onOpenTradeModal,
  onOpenWorkstationChart,
  onClose
}) {
  const socketQuote = useSocketQuote(symbol);
  const [fetchedQuote, setFetchedQuote] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'trajectory' | 'valuation' | 'calculator' | 'history'
  const [investAmount, setInvestAmount] = useState(1000);
  const [selectedHorizon, setSelectedHorizon] = useState('ipo'); // 'ipo' | 'y10' | 'y5' | 'y1'
  const [hoveredCursor, setHoveredCursor] = useState(null);
  const chartSvgRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    if (symbol) {
      fetch(`/api/stocks/quote/${encodeURIComponent(symbol)}`)
        .then((r) => r.json())
        .then((json) => {
          if (isMounted && json?.success && json?.data) {
            setFetchedQuote(json.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const mergedLiveQuote = useMemo(() => {
    return {
      ...(initialItem || {}),
      ...(fetchedQuote || {}),
      ...(socketQuote || {})
    };
  }, [initialItem, fetchedQuote, socketQuote]);

  const record = useMemo(() => {
    return getCompleteStockRecord(symbol, mergedLiveQuote);
  }, [symbol, mergedLiveQuote]);

  const { identity, priceRecord, wealthHorizons, milestones, allTimeSeries, annualHistory, valuation } = record;
  const curr = identity.currencySymbol;
  const isBull = priceRecord.changePercent >= 0;

  // Wealth Calculator Computation
  const activeHorizonObj = wealthHorizons[selectedHorizon] || wealthHorizons.ipo;
  const entryPrice = Math.max(0.0001, activeHorizonObj.entryPrice);
  const sharesAccumulated = investAmount / entryPrice;
  const currentInvestmentValue = sharesAccumulated * priceRecord.currentPrice;
  const netProfit = currentInvestmentValue - investAmount;
  const calcReturnPercent = ((currentInvestmentValue - investAmount) / Math.max(1, investAmount)) * 100;
  const calcMultiple = currentInvestmentValue / Math.max(1, investAmount);
  const calcCagr =
    activeHorizonObj.years > 0
      ? (Math.pow(Math.max(1.0001, calcMultiple), 1 / activeHorizonObj.years) - 1) * 100
      : calcReturnPercent;

  // Interactive SVG All-Time Trajectory Geometry
  const chartWidth = 860;
  const chartHeight = 250;
  const padLeft = 58;
  const padRight = 28;
  const padTop = 26;
  const padBottom = 38;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const seriesPrices = allTimeSeries.map((p) => p.price);
  const minSeriesPrice = Math.min(...seriesPrices) * 0.92;
  const maxSeriesPrice = Math.max(...seriesPrices) * 1.05;
  const priceSpan = Math.max(0.0001, maxSeriesPrice - minSeriesPrice);

  const chartNodes = allTimeSeries.map((pt, idx) => {
    const x = padLeft + (idx / Math.max(1, allTimeSeries.length - 1)) * plotW;
    const y = padTop + plotH - ((pt.price - minSeriesPrice) / priceSpan) * plotH;
    return { ...pt, x, y, idx };
  });

  const polylinePoints = chartNodes.map((n) => `${n.x.toFixed(1)},${n.y.toFixed(1)}`).join(' ');
  const areaPath =
    chartNodes.length > 1
      ? `M ${chartNodes[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ` +
        chartNodes.map((n) => `${n.x.toFixed(1)} ${n.y.toFixed(1)}`).join(' L ') +
        ` L ${chartNodes[chartNodes.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const defaultNode = chartNodes[chartNodes.length - 1];

  const handleChartPointerMove = (clientX) => {
    const svgEl = chartSvgRef.current;
    if (!svgEl || chartNodes.length === 0) return;
    const rect = svgEl.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;

    const svgXRaw = ((clientX - rect.left) / rect.width) * chartWidth;
    const svgX = Math.max(padLeft, Math.min(padLeft + plotW, svgXRaw));
    const t = Math.max(0, Math.min(1, (svgX - padLeft) / Math.max(1, plotW)));
    const floatIdx = t * (chartNodes.length - 1);
    const i0 = Math.floor(floatIdx);
    const i1 = Math.min(chartNodes.length - 1, i0 + 1);
    const frac = floatIdx - i0;

    const n0 = chartNodes[i0];
    const n1 = chartNodes[i1];
    if (!n0 || !n1) return;

    const x = n0.x + (n1.x - n0.x) * frac;
    const y = n0.y + (n1.y - n0.y) * frac;
    const price = n0.price + (n1.price - n0.price) * frac;
    const nearestIdx = frac < 0.5 ? i0 : i1;
    const nearestNode = chartNodes[nearestIdx];

    const exactYearVal = n0.year + (n1.year - n0.year) * frac;
    const isNearMilestone = frac < 0.22 || frac > 0.78 || i0 === i1;
    let periodLabel = nearestNode.label;
    if (!isNearMilestone && n1.year > n0.year) {
      const wholeYear = Math.floor(exactYearVal);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = Math.min(11, Math.max(0, Math.floor((exactYearVal - wholeYear) * 12)));
      periodLabel = `${monthNames[monthIdx]} ${wholeYear}`;
    }

    const gainFromStartPercent =
      ((price - priceRecord.ipoPriceAdjusted) / Math.max(0.0001, priceRecord.ipoPriceAdjusted)) * 100;
    const multipleFromStart = price / Math.max(0.0001, priceRecord.ipoPriceAdjusted);
    const valueHeldOnCapital = (price / Math.max(0.0001, entryPrice)) * investAmount;
    const marketCapAtPoint = formatScaledMarketCap(
      identity.marketCapFormatted,
      price / Math.max(0.0001, priceRecord.currentPrice)
    );

    setHoveredCursor({
      x,
      y,
      xPct: (x / chartWidth) * 100,
      yPct: (y / chartHeight) * 100,
      price,
      periodLabel,
      tag: nearestNode.tag,
      nearestIdx,
      gainFromStartPercent,
      multipleFromStart,
      valueHeldOnCapital,
      marketCapAtPoint
    });
  };

  const activeDisplayPoint = hoveredCursor || (defaultNode
    ? {
        x: defaultNode.x,
        y: defaultNode.y,
        xPct: (defaultNode.x / chartWidth) * 100,
        yPct: (defaultNode.y / chartHeight) * 100,
        price: defaultNode.price,
        periodLabel: defaultNode.label,
        tag: defaultNode.tag,
        nearestIdx: defaultNode.idx,
        gainFromStartPercent: defaultNode.gainFromStartPercent,
        multipleFromStart: defaultNode.price / Math.max(0.0001, priceRecord.ipoPriceAdjusted),
        valueHeldOnCapital: (defaultNode.price / Math.max(0.0001, entryPrice)) * investAmount,
        marketCapAtPoint: identity.marketCapFormatted
      }
    : null);

  return (
    <div
      className="glass-card"
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        border: isModal ? '1px solid rgba(6, 182, 212, 0.38)' : '1px solid var(--border-subtle)',
        background: isModal ? 'rgba(10, 15, 29, 0.98)' : 'var(--bg-card)',
        boxShadow: isModal ? '0 28px 75px rgba(0, 0, 0, 0.82)' : 'var(--shadow-card)',
        overflow: 'hidden'
      }}
    >
      {/* Top Executive Header Banner (Clean 2-Tier Architecture) */}
      <div
        style={{
          padding: '1.15rem 1.5rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(15, 23, 42, 0.94) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Tier 1: Aligned Metadata Utility Bar + Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.65rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                height: '26px',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '0 0.6rem',
                borderRadius: '5px',
                background: 'rgba(6, 182, 212, 0.16)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <History size={12} />
              <span>Complete Record • {identity.ipoYear} → 2026</span>
            </span>

            <span
              style={{
                height: '26px',
                padding: '0 0.55rem',
                borderRadius: '5px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <CountryFlag
                country={identity.country}
                countryCode={identity.countryCode}
                symbol={identity.symbol}
                countryFlag={identity.countryFlag}
                size="xs"
                showName={true}
              />
            </span>

            <span
              className="font-mono"
              style={{
                height: '26px',
                fontSize: '0.71rem',
                fontWeight: 700,
                padding: '0 0.55rem',
                borderRadius: '5px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              {identity.exchange} • {identity.currency}
            </span>

            <span
              style={{
                height: '26px',
                fontSize: '0.71rem',
                fontWeight: 700,
                padding: '0 0.55rem',
                borderRadius: '5px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--bull-green)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              {identity.sector}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span
              className="font-mono"
              style={{
                height: '28px',
                fontSize: '0.73rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.28)',
                padding: '0 0.65rem',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Mkt Cap: {identity.marketCapFormatted}
            </span>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Close Record Dossier (Esc)"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '7px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Main 2-Column Split (Identity & Structured Genesis Grid | Live Quote & Action Deck) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            gap: '1.25rem'
          }}
        >
          {/* Left Column: Asset Title, Summary & Structured 3-Box Genesis Bar */}
          <div
            style={{
              flex: '1 1 520px',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.85rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2
                  className="font-mono"
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: 0,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {identity.symbol}
                </h2>
                <span style={{ fontSize: '1.12rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {identity.name}
                </span>
              </div>

              <p
                style={{
                  margin: '0.45rem 0 0',
                  fontSize: '0.84rem',
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  maxWidth: '780px'
                }}
              >
                {identity.businessSummary}
              </p>
            </div>

            {/* Structured 3-Column Genesis Grid (Zero Orphan Bullets, Perfect Alignment) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '0.65rem'
              }}
            >
              <div
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)'
                }}
              >
                <div style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building2 size={11} /> Founded &amp; Headquarters
                </div>
                <div style={{ fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.35 }}>
                  {identity.foundedYear} • {identity.headquarters}
                </div>
              </div>

              <div
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)'
                }}
              >
                <div style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--bull-green)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={11} /> Public Debut / Base Date
                </div>
                <div style={{ fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.35 }}>
                  {identity.ipoDate}
                </div>
              </div>

              <div
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)'
                }}
              >
                <div style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--warning-amber)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Award size={11} /> Founder / Origin
                </div>
                <div style={{ fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem', lineHeight: 1.35 }}>
                  {identity.founderOrOrigin}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Live Quote Box + Quick Action Deck */}
          <div
            style={{
              flex: '0 1 390px',
              minWidth: '300px',
              padding: '0.9rem 1.05rem',
              borderRadius: '12px',
              background: 'rgba(9, 14, 28, 0.72)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Live Market Price
                </span>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  REAL-TIME FEED
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem' }}>
                <span className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {formatRecordPrice(priceRecord.currentPrice, curr)}
                </span>
                <span
                  className="font-mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '0.24rem 0.55rem',
                    borderRadius: '6px',
                    background: isBull ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)',
                    color: isBull ? 'var(--bull-green)' : 'var(--bear-red)',
                    border: isBull ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {isBull ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {isBull ? '+' : ''}
                  {priceRecord.changePercent.toFixed(2)}%
                </span>
              </div>

              {/* All-Time Return Highlight Bar */}
              <div
                className="font-mono"
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: 'var(--bull-green)',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  textAlign: 'center'
                }}
              >
                <TrendingUp size={13} style={{ flexShrink: 0 }} />
                <span>
                  Since {identity.ipoYear}: +{Math.round(priceRecord.allTimeReturnPercent).toLocaleString()}% ({priceRecord.allTimeMultiple.toFixed(1)}x) • {priceRecord.cagrPercent.toFixed(1)}% CAGR
                </span>
              </div>
            </div>

            {/* Uniform 2x2 or Inline Action Toolbar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '0.45rem'
              }}
            >
              {onOpenWorkstationChart && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    height: '34px',
                    padding: '0 0.6rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    borderColor: 'rgba(6, 182, 212, 0.45)',
                    color: 'var(--accent-cyan)',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => onOpenWorkstationChart(identity.chartSymbol || identity.symbol)}
                >
                  <BarChart3 size={14} />
                  <span>Open Chart</span>
                </button>
              )}

              {onOpenTradeModal && (
                <button
                  type="button"
                  className="btn btn-bull"
                  style={{
                    height: '34px',
                    padding: '0 0.6rem',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => onOpenTradeModal(identity.chartSymbol || identity.symbol)}
                >
                  <ShoppingCart size={14} />
                  <span>Trade Asset</span>
                </button>
              )}

              {onToggleWatchlist && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    height: '34px',
                    padding: '0 0.6rem',
                    fontSize: '0.74rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => onToggleWatchlist(identity.chartSymbol || identity.symbol)}
                >
                  {isInWatchlist ? (
                    <>
                      <BookmarkCheck size={14} style={{ color: 'var(--accent-cyan)' }} />
                      <span>Watching</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={14} />
                      <span>Watchlist</span>
                    </>
                  )}
                </button>
              )}

              {onOpenAlertModal && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    height: '34px',
                    padding: '0 0.6rem',
                    fontSize: '0.74rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => onOpenAlertModal(identity.chartSymbol || identity.symbol)}
                >
                  <Bell size={14} style={{ color: 'var(--warning-amber)' }} />
                  <span>Set Alert</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Filter Navigation Bar & Share Split Basis */}
      <div
        style={{
          padding: '0.7rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.78)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Complete Record (All-in-One)', icon: Layers },
            { id: 'trajectory', label: 'All-Time Trajectory & Eras', icon: TrendingUp },
            { id: 'calculator', label: 'IPO Wealth Calculator', icon: Calculator },
            { id: 'valuation', label: 'True Stock Value & Ratios', icon: ShieldCheck },
            { id: 'history', label: 'Year-by-Year Record Table', icon: History }
          ].map((tab) => {
            const IconComp = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  height: '32px',
                  padding: '0 0.78rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  background: active ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: active ? '1px solid rgba(6, 182, 212, 0.45)' : '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            fontSize: '0.71rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            padding: '0.26rem 0.6rem',
            borderRadius: '5px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          Basis: {identity.stockSplits}
        </div>
      </div>

      {/* Main Dossier Body */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
        {/* 6-Card Genesis-to-Present Key Metrics Strip (Uniform Single-Row Grid on Desktop) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.75rem',
            alignItems: 'stretch'
          }}
        >
          {/* Card 1: Starting / IPO Price */}
          <div
            className="stock-detail-float-card"
            {...floatingCardEvents}
            style={{
              padding: '0.85rem 0.95rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Starting / IPO ({identity.ipoYear})
            </div>
            <div className="font-mono" style={{ fontSize: '1.24rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatRecordPrice(priceRecord.ipoPriceAdjusted, curr)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Nominal Issue: <span className="font-mono">{formatRecordPrice(priceRecord.ipoPriceNominal, curr)}</span>
            </div>
          </div>

          {/* Card 2: Present Live Market Price */}
          <div
            className="stock-detail-float-card"
            {...floatingCardEvents}
            style={{
              padding: '0.85rem 0.95rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Present Day Price (Live)
            </div>
            <div className="font-mono" style={{ fontSize: '1.24rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {formatRecordPrice(priceRecord.currentPrice, curr)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Day: <span className="font-mono">{formatRecordPrice(priceRecord.dayLow, curr)} – {formatRecordPrice(priceRecord.dayHigh, curr)}</span>
            </div>
          </div>

          {/* Card 3: All-Time Return & Multiple */}
          <div
            className="stock-detail-float-card"
            {...floatingCardEvents}
            style={{
              padding: '0.85rem 0.95rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--bull-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Return (Start → Now)
            </div>
            <div className="font-mono" style={{ fontSize: '1.24rem', fontWeight: 800, color: 'var(--bull-green)' }}>
              +{Math.round(priceRecord.allTimeReturnPercent).toLocaleString()}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              Wealth Multiplier: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{priceRecord.allTimeMultiple.toFixed(1)}x</strong>
            </div>
          </div>

          {/* Card 4: Compound Annual Growth (CAGR) */}
          <div
            className="stock-detail-float-card"
            {...floatingCardEvents}
            style={{
              padding: '0.85rem 0.95rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Annualized CAGR ({identity.yearsSinceIpo} Yrs)
            </div>
            <div className="font-mono" style={{ fontSize: '1.24rem', fontWeight: 800, color: 'var(--bull-green)' }}>
              +{priceRecord.cagrPercent.toFixed(2)}% / yr
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              10Y: <span className="font-mono" style={{ color: priceRecord.return10YPercent >= 0 ? 'var(--bull-green)' : 'var(--bear-red)' }}>{priceRecord.return10YPercent >= 0 ? '+' : ''}{priceRecord.return10YPercent.toFixed(0)}%</span> • 5Y: <span className="font-mono" style={{ color: priceRecord.return5YPercent >= 0 ? 'var(--bull-green)' : 'var(--bear-red)' }}>{priceRecord.return5YPercent >= 0 ? '+' : ''}{priceRecord.return5YPercent.toFixed(0)}%</span>
            </div>
          </div>

          {/* Card 5: All-Time High & 52W Range */}
          <div
            className="stock-detail-float-card"
            {...floatingCardEvents}
            style={{
              padding: '0.85rem 0.95rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              All-Time High &amp; 52W Range
            </div>
            <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatRecordPrice(priceRecord.athPrice, curr)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              52W: <span className="font-mono">{formatRecordPrice(priceRecord.low52, curr)} – {formatRecordPrice(priceRecord.high52, curr)}</span>
            </div>
          </div>

          {/* Card 6: Intrinsic Fair Value & Verdict */}
          <div
            className="stock-detail-float-card"
            {...floatingCardEvents}
            style={{
              padding: '0.85rem 0.95rem',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.07)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Intrinsic Fair Value Est.
            </div>
            <div className="font-mono" style={{ fontSize: '1.24rem', fontWeight: 800, color: valuation.verdictColor }}>
              {formatRecordPrice(valuation.intrinsicFairValue, curr)}
            </div>
            <div style={{ fontSize: '0.69rem', fontWeight: 700, color: valuation.verdictColor }}>
              {valuation.verdict} ({valuation.valuationGapPercent >= 0 ? `+${valuation.valuationGapPercent.toFixed(1)}%` : `${valuation.valuationGapPercent.toFixed(1)}%`})
            </div>
          </div>
        </div>

        {/* SECTION A: ALL-TIME TRAJECTORY CHART & ERA MILESTONES */}
        {(activeSubTab === 'all' || activeSubTab === 'trajectory') && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '1.15rem'
            }}
          >
            {/* Interactive All-Time Trajectory SVG Chart */}
            <div
              style={{
                padding: '1.1rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <TrendingUp size={16} style={{ color: 'var(--bull-green)' }} />
                    <span>All-Time Price Trajectory ({identity.ipoYear} Starting → 2026 Live)</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Move cursor anywhere across the graph to inspect stock price, market cap &amp; holding value at any point
                  </div>
                </div>

                {activeDisplayPoint && (
                  <div
                    className="font-mono"
                    style={{
                      padding: '0.38rem 0.75rem',
                      borderRadius: '8px',
                      background: hoveredCursor ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.12)',
                      border: hoveredCursor ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid rgba(6, 182, 212, 0.35)',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{activeDisplayPoint.periodLabel}:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatRecordPrice(activeDisplayPoint.price, curr)}</strong>
                    <span style={{ color: 'var(--bull-green)' }}>
                      ({activeDisplayPoint.gainFromStartPercent >= 0 ? '+' : ''}
                      {Math.round(activeDisplayPoint.gainFromStartPercent).toLocaleString()}%)
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>
                      Cap: {activeDisplayPoint.marketCapAtPoint}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  cursor: 'crosshair',
                  userSelect: 'none',
                  touchAction: 'none'
                }}
                onMouseMove={(e) => handleChartPointerMove(e.clientX)}
                onMouseLeave={() => setHoveredCursor(null)}
                onTouchStart={(e) => {
                  if (e.touches && e.touches[0]) handleChartPointerMove(e.touches[0].clientX);
                }}
                onTouchMove={(e) => {
                  if (e.touches && e.touches[0]) handleChartPointerMove(e.touches[0].clientX);
                }}
                onTouchEnd={() => setHoveredCursor(null)}
              >
                <svg
                  ref={chartSvgRef}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  style={{ width: '100%', height: 'auto', minHeight: '220px', display: 'block', overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id={`allTimeGrad-${identity.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.38" />
                      <stop offset="65%" stopColor="#06b6d4" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Reference Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = padTop + plotH * ratio;
                    const val = maxSeriesPrice - priceSpan * ratio;
                    return (
                      <g key={idx}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={chartWidth - padRight}
                          y2={y}
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          fill="rgba(148, 163, 184, 0.78)"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          {formatRecordPrice(val, curr)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area Fill */}
                  {areaPath && <path d={areaPath} fill={`url(#allTimeGrad-${identity.symbol})`} />}

                  {/* Main Trajectory Line */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

                  {/* Interactive Data Nodes */}
                  {chartNodes.map((n) => {
                    const isNearest = activeDisplayPoint?.nearestIdx === n.idx;
                    return (
                      <g key={n.idx}>
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={isNearest ? 5 : 3.5}
                          fill={isNearest ? '#06b6d4' : '#10b981'}
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                        <text
                          x={n.x}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          fill={isNearest ? '#38bdf8' : 'rgba(148, 163, 184, 0.85)'}
                          fontSize={isNearest ? '10.5' : '9.5'}
                          fontWeight={isNearest ? '700' : '500'}
                          fontFamily="monospace"
                        >
                          {n.year}
                        </text>
                      </g>
                    );
                  })}

                  {/* Continuous Smooth Cursor Crosshair & Highlight Beacon */}
                  {hoveredCursor && (
                    <g style={{ pointerEvents: 'none' }}>
                      <line
                        x1={hoveredCursor.x}
                        y1={padTop}
                        x2={hoveredCursor.x}
                        y2={padTop + plotH}
                        stroke="rgba(56, 189, 248, 0.7)"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={padLeft}
                        y1={hoveredCursor.y}
                        x2={chartWidth - padRight}
                        y2={hoveredCursor.y}
                        stroke="rgba(56, 189, 248, 0.38)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={hoveredCursor.x}
                        cy={hoveredCursor.y}
                        r="11"
                        fill="rgba(56, 189, 248, 0.18)"
                      />
                      <circle
                        cx={hoveredCursor.x}
                        cy={hoveredCursor.y}
                        r="5.5"
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </svg>

                {/* Floating Cursor Tooltip Showing Value Held Right Under Mouse */}
                {hoveredCursor && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${hoveredCursor.xPct}%`,
                      top: `${Math.min(Math.max(hoveredCursor.yPct, 12), 76)}%`,
                      transform:
                        hoveredCursor.xPct > 58
                          ? 'translate(calc(-100% - 14px), -50%)'
                          : 'translate(14px, -50%)',
                      pointerEvents: 'none',
                      zIndex: 25,
                      minWidth: '215px',
                      padding: '0.6rem 0.78rem',
                      borderRadius: '10px',
                      background: 'rgba(9, 14, 28, 0.96)',
                      border: '1px solid rgba(56, 189, 248, 0.55)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 14px rgba(6, 182, 212, 0.22)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.28rem' }}>
                      <span className="font-mono" style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {identity.symbol} • {hoveredCursor.periodLabel}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: hoveredCursor.gainFromStartPercent >= 0 ? 'var(--bull-green)' : 'var(--bear-red)'
                        }}
                      >
                        {hoveredCursor.gainFromStartPercent >= 0 ? '+' : ''}
                        {Math.round(hoveredCursor.gainFromStartPercent).toLocaleString()}%
                      </span>
                    </div>

                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      {hoveredCursor.tag}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem', fontSize: '0.73rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Share Value:</span>
                        <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
                          {formatRecordPrice(hoveredCursor.price, curr)}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Value Held ({curr}{investAmount.toLocaleString()}):</span>
                        <strong className="font-mono" style={{ color: 'var(--bull-green)' }}>
                          {formatRecordPrice(hoveredCursor.valueHeldOnCapital, curr)}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Est. Market Cap:</span>
                        <strong className="font-mono" style={{ color: 'var(--accent-cyan)' }}>
                          {hoveredCursor.marketCapAtPoint}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Since Start ({identity.ipoYear}):</span>
                        <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
                          {hoveredCursor.multipleFromStart.toFixed(1)}x
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Horizon Return Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '0.5rem',
                  marginTop: '0.65rem',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {[
                  { label: `Since Start (${identity.ipoYear})`, pct: priceRecord.allTimeReturnPercent },
                  { label: '10-Year Return', pct: priceRecord.return10YPercent },
                  { label: '5-Year Return', pct: priceRecord.return5YPercent },
                  { label: '3-Year Return', pct: priceRecord.return3YPercent },
                  { label: '1-Year Return', pct: priceRecord.return1YPercent }
                ].map((h, i) => (
                  <div
                    key={i}
                    className="stock-detail-float-card"
                    {...floatingCardEvents}
                    style={{
                      padding: '0.45rem 0.55rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h.label}</div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: h.pct >= 0 ? 'var(--bull-green)' : 'var(--bear-red)',
                        marginTop: '0.15rem'
                      }}
                    >
                      {h.pct >= 0 ? '+' : ''}
                      {h.pct >= 1000 ? Math.round(h.pct).toLocaleString() : h.pct.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Stage Historical Milestone Timeline ("From Starting Till Now") */}
            <div
              style={{
                padding: '1.1rem 1.25rem',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Award size={16} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Complete Historical Milestones (From Starting Till Now)</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Key inflection eras and compounding checkpoints from {identity.ipoYear} public debut to live market
                </div>
              </div>

              <div
                className="milestones-scroll-list"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  padding: '0.25rem 0.45rem 0.25rem 0.1rem'
                }}
              >
                {milestones.map((m, idx) => {
                  const isLatest = idx === milestones.length - 1;
                  return (
                    <div
                      key={idx}
                      className="stock-detail-float-card"
                      {...floatingCardEvents}
                      style={{
                        flexShrink: 0,
                        padding: '0.7rem 0.9rem',
                        borderRadius: '8px',
                        background: isLatest ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.025)',
                        border: isLatest ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.28rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '0.12rem 0.42rem',
                              borderRadius: '4px',
                              background: isLatest ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                              color: isLatest ? 'var(--bull-green)' : 'var(--accent-cyan)'
                            }}
                          >
                            {m.era}
                          </span>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{m.title}</strong>
                        </div>

                        <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{formatRecordPrice(m.price, curr)}</strong>
                          {idx > 0 && (
                            <span style={{ color: 'var(--bull-green)', fontWeight: 700, fontSize: '0.72rem' }}>
                              (+{Math.round(m.cumulativeReturnPercent).toLocaleString()}%)
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {m.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION B: INTERACTIVE "WHAT IF YOU INVESTED AT STARTING / IPO?" WEALTH CALCULATOR */}
        {(activeSubTab === 'all' || activeSubTab === 'calculator') && (
          <div
            style={{
              padding: '1.15rem 1.35rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.07) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Calculator size={16} style={{ color: 'var(--bull-green)' }} />
                  <span>Interactive Historical Wealth Calculator — &ldquo;What If You Invested in {identity.symbol}?&rdquo;</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  Select an initial investment amount and starting era to see exact split-adjusted shares and live wealth today
                </div>
              </div>

              {/* Horizon Selector Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                {Object.values(wealthHorizons).map((h) => {
                  const active = selectedHorizon === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setSelectedHorizon(h.id)}
                      style={{
                        padding: '0.34rem 0.7rem',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: active ? 'var(--bull-green)' : 'rgba(15, 23, 42, 0.75)',
                        color: active ? '#04130d' : 'var(--text-secondary)',
                        border: active ? '1px solid var(--bull-green)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      {h.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Presets & Results Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '0.85rem',
                alignItems: 'stretch'
              }}
            >
              {/* Investment Input Card */}
              <div
                className="stock-detail-float-card"
                {...floatingCardEvents}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  1. Initial Capital Invested ({curr})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{curr}</span>
                  <input
                    type="number"
                    min="10"
                    step="100"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(Math.max(1, Number(e.target.value) || 0))}
                    className="font-mono"
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.55rem',
                      borderRadius: '6px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 800
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {[100, 1000, 10000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInvestAmount(amt)}
                      className="font-mono"
                      style={{
                        padding: '0.18rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: investAmount === amt ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255,255,255,0.05)',
                        color: investAmount === amt ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      {curr}{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Price & Shares Accumulated */}
              <div
                className="stock-detail-float-card"
                {...floatingCardEvents}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  2. Entry Price in {activeHorizonObj.startYear}
                </div>
                <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {formatRecordPrice(entryPrice, curr)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ share</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  = {sharesAccumulated.toLocaleString('en-US', { maximumFractionDigits: 2 })} Split-Adj. Shares
                </div>
              </div>

              {/* Total Value Today */}
              <div
                className="stock-detail-float-card"
                {...floatingCardEvents}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--bull-green)', textTransform: 'uppercase' }}>
                  3. Portfolio Value Today (Live)
                </div>
                <div className="font-mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--bull-green)', marginTop: '0.2rem' }}>
                  {formatRecordPrice(currentInvestmentValue, curr)}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  Net Profit: <strong>+{formatRecordPrice(netProfit, curr)}</strong>
                </div>
              </div>

              {/* Total Multiplier & Annualized Return */}
              <div
                className="stock-detail-float-card"
                {...floatingCardEvents}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  4. Wealth Multiplier & CAGR
                </div>
                <div className="font-mono" style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                  {calcMultiple.toFixed(2)}x <span style={{ fontSize: '0.82rem', color: 'var(--bull-green)' }}>(+{Math.round(calcReturnPercent).toLocaleString()}%)</span>
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Compounded at <strong className="font-mono" style={{ color: 'var(--bull-green)' }}>{calcCagr.toFixed(2)}% / yr</strong> for {activeHorizonObj.years} yrs
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: DEEP VALUATION & INTRINSIC WORTH SCORECARD (Easy to Understand) */}
        {(activeSubTab === 'all' || activeSubTab === 'valuation') && (
          <div
            style={{
              padding: '1.15rem 1.35rem',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldCheck size={17} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Deep Stock Valuation, Intrinsic Worth & Plain-English Investor Guide</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Designed to make understanding {identity.name}&apos;s true fundamental value effortless for every investor
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className="font-mono"
                  style={{
                    padding: '0.28rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--bull-green)',
                    border: '1px solid rgba(16, 185, 129, 0.35)'
                  }}
                >
                  Fundamental Score: {valuation.valueScore}/100 ({identity.rating})
                </span>
              </div>
            </div>

            {/* Plain-English Valuation Summary Callout */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.08)',
                borderLeft: '4px solid var(--accent-cyan)',
                fontSize: '0.83rem',
                lineHeight: 1.55,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}
            >
              <Sparkles size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--accent-cyan)' }}>What Investors Should Know About {identity.symbol}&apos;s Value: </strong>
                {valuation.plainEnglishSummary}
              </div>
            </div>

            {/* 12 Valuation & Financial Health Cards with Plain-English Explanations */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(245px, 1fr))',
                gap: '0.75rem'
              }}
            >
              {valuation.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="stock-detail-float-card"
                  {...floatingCardEvents}
                  style={{
                    padding: '0.8rem 0.95rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.025)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem',
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{m.label}</span>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.14)',
                        color: 'var(--bull-green)'
                      }}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {m.value}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                      {m.benchmark}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', lineHeight: 1.38 }}>
                    {m.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION D: YEAR-BY-YEAR HISTORICAL RECORD TABLE (FROM STARTING / IPO TILL NOW) */}
        {(activeSubTab === 'all' || activeSubTab === 'history') && (
          <div
            style={{
              padding: '1.15rem 1.35rem',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <History size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>Annual Historical Price & Return Ledger ({identity.ipoYear} Debut → 2026 Present)</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Split-adjusted annual Open, High, Low, Ending Close, Annual Return %, and Market Cycle Regime
              </div>
            </div>

            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table className="market-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Year / Era</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Year Open</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Year High</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Year Low</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Year Close</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Annual Return</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Market Cycle Regime</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Key Fundamental Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {annualHistory.map((row, idx) => {
                    const pos = row.annualReturnPercent >= 0;
                    return (
                      <tr
                        key={idx}
                        className="stock-detail-float-row"
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: idx === 0 ? 'rgba(6, 182, 212, 0.06)' : 'transparent'
                        }}
                      >
                        <td className="font-mono" style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: idx === 0 ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                          {row.year}
                        </td>
                        <td className="font-mono" style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatRecordPrice(row.open, curr)}
                        </td>
                        <td className="font-mono" style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {formatRecordPrice(row.high, curr)}
                        </td>
                        <td className="font-mono" style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {formatRecordPrice(row.low, curr)}
                        </td>
                        <td className="font-mono" style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {formatRecordPrice(row.close, curr)}
                        </td>
                        <td className="font-mono" style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800, color: pos ? 'var(--bull-green)' : 'var(--bear-red)' }}>
                          {pos ? '+' : ''}
                          {row.annualReturnPercent.toFixed(2)}%
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.14rem 0.45rem',
                              borderRadius: '4px',
                              background: pos ? 'rgba(16, 185, 129, 0.14)' : 'rgba(245, 158, 11, 0.14)',
                              color: pos ? 'var(--bull-green)' : 'var(--warning-amber)'
                            }}
                          >
                            {row.regime}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          {row.highlight}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const StockDeepRecordModal = React.memo(function StockDeepRecordModal({
  isOpen,
  symbol,
  initialItem = null,
  isInWatchlist = false,
  onToggleWatchlist,
  onOpenAlertModal,
  onOpenTradeModal,
  onOpenWorkstationChart,
  onClose
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !symbol) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.84)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1260px',
          margin: '0 auto 2rem'
        }}
      >
        <StockDeepRecordSection
          symbol={symbol}
          initialItem={initialItem}
          isModal={true}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={onToggleWatchlist}
          onOpenAlertModal={onOpenAlertModal}
          onOpenTradeModal={onOpenTradeModal}
          onOpenWorkstationChart={onOpenWorkstationChart}
          onClose={onClose}
        />
      </div>
    </div>
  );
});

export default StockDeepRecordModal;

