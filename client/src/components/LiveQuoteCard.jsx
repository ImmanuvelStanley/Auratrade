import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  BookmarkPlus,
  BookmarkCheck,
  ShoppingCart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Sparkles,
  History,
  X
} from 'lucide-react';
import { useSocketQuote } from '../context/SocketContext';
import { CountryFlag } from './CountryFlag';
import {
  toISODateString,
  formatCalendarDate,
  computeDateMarketSnapshot
} from '../utils/marketCalendarEngine';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const LiveQuoteCard = React.memo(function LiveQuoteCard({
  symbol,
  quote: propQuote,
  isInWatchlist,
  onToggleWatchlist,
  onOpenAlertModal,
  onOpenTradeModal,
  onOpenDeepRecord
}) {
  const socketQuote = useSocketQuote(symbol);
  const [fallbackQuote, setFallbackQuote] = useState(null);
  const [pulseClass, setPulseClass] = useState('');
  const [tickDirection, setTickDirection] = useState('neutral');
  const [lastTickTime, setLastTickTime] = useState(Date.now());

  // Interactive Past & Future Calendar State
  const todayISO = useMemo(() => toISODateString(new Date()), []);
  const [selectedDateStr, setSelectedDateStr] = useState(() => toISODateString(new Date()));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMonthDate, setViewMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const quote = propQuote || socketQuote || fallbackQuote;
  const prevPriceRef = useRef(quote?.price);

  useEffect(() => {
    if (!propQuote && symbol) {
      fetch(`/api/stocks/quote/${symbol}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setFallbackQuote(json.data);
          }
        })
        .catch(() => {});
    }
  }, [propQuote, symbol]);

  useEffect(() => {
    if (!quote?.price) return;
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== quote.price) {
      const isUp = quote.price > prevPriceRef.current;
      setPulseClass(isUp ? 'tick-pulse-up' : 'tick-pulse-down');
      setTickDirection(isUp ? 'up' : 'down');
      setLastTickTime(Date.now());

      const timer = setTimeout(() => {
        setPulseClass('');
      }, 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = quote.price;
  }, [quote?.price]);

  // Close calendar drawer on Escape key
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsCalendarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCalendarOpen]);

  // Listen for external calendar date changes (e.g. from StockChart)
  useEffect(() => {
    const handleExternalCalendarSync = (e) => {
      if (e.detail?.source === 'LiveQuoteCard') return;
      if (e.detail?.dateStr) {
        setSelectedDateStr(e.detail.dateStr);
        const parts = e.detail.dateStr.split('-').map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          setViewMonthDate(new Date(parts[0], parts[1] - 1, 1));
        }
      }
    };
    window.addEventListener('auratrade_calendar_date_changed', handleExternalCalendarSync);
    return () => window.removeEventListener('auratrade_calendar_date_changed', handleExternalCalendarSync);
  }, []);

  // Compute Past, Live, or Future Market Snapshot for the selected date
  const dateSnapshot = useMemo(() => {
    return computeDateMarketSnapshot(symbol, quote, selectedDateStr);
  }, [symbol, quote, selectedDateStr]);

  // Broadcast calendar selection to StockChart whenever symbol or selectedDateStr changes
  useEffect(() => {
    if (!quote) return;
    window.dispatchEvent(
      new CustomEvent('auratrade_calendar_date_changed', {
        detail: {
          source: 'LiveQuoteCard',
          symbol,
          dateStr: selectedDateStr,
          snapshot: dateSnapshot
        }
      })
    );
  }, [symbol, selectedDateStr, dateSnapshot.mode, dateSnapshot.price]);

  const handleSelectDate = (isoStr, closePanel = false) => {
    if (!isoStr) return;
    setSelectedDateStr(isoStr);
    const parts = isoStr.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      setViewMonthDate(new Date(parts[0], parts[1] - 1, 1));
    }
    if (closePanel) {
      setIsCalendarOpen(false);
    }
  };

  const handleShiftDays = (deltaDays) => {
    const parts = (selectedDateStr || todayISO).split('-').map(Number);
    const base = parts.length === 3 && !parts.some(isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
      : new Date();
    base.setDate(base.getDate() + deltaDays);
    handleSelectDate(toISODateString(base), false);
  };

  const handlePresetOffset = (offsetDays, offsetMonths = 0, offsetYears = 0) => {
    const now = new Date();
    const target = new Date(now.getFullYear() + offsetYears, now.getMonth() + offsetMonths, now.getDate() + offsetDays, 12, 0, 0);
    handleSelectDate(toISODateString(target), false);
  };

  const handleResetToLive = () => {
    const nowISO = toISODateString(new Date());
    handleSelectDate(nowISO, false);
  };

  // Build calendar days grid for viewMonthDate
  const calendarDays = useMemo(() => {
    const year = viewMonthDate.getFullYear();
    const month = viewMonthDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        iso: toISODateString(d),
        dayNum: d.getDate(),
        inCurrentMonth: false
      });
    }
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const d = new Date(year, month, dNum);
      cells.push({
        iso: toISODateString(d),
        dayNum: dNum,
        inCurrentMonth: true
      });
    }
    const remaining = 42 - cells.length;
    for (let j = 1; j <= remaining; j++) {
      const d = new Date(year, month + 1, j);
      cells.push({
        iso: toISODateString(d),
        dayNum: d.getDate(),
        inCurrentMonth: false
      });
    }
    return cells;
  }, [viewMonthDate]);

  if (!quote) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading real-time quote for {symbol}...
      </div>
    );
  }

  const isLiveMode = dateSnapshot.mode === 'live';
  const isPastMode = dateSnapshot.mode === 'past';
  const isFutureMode = dateSnapshot.mode === 'future';

  const activePrice = isLiveMode ? quote.price : dateSnapshot.price;
  const activeChange = isLiveMode ? (quote.change || 0) : dateSnapshot.change;
  const activeChangePct = isLiveMode ? (quote.changePercent || 0) : dateSnapshot.changePercent;
  const activeHigh = isLiveMode ? quote.dayHigh : dateSnapshot.dayHigh;
  const activeLow = isLiveMode ? quote.dayLow : dateSnapshot.dayLow;
  const activePrevClose = isLiveMode ? quote.previousClose : dateSnapshot.previousClose;
  const activeVolume = isLiveMode ? quote.volume : dateSnapshot.volume;
  const isBull = activeChange >= 0;

  return (
    <div className="glass-card" style={{ minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
      <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        {/* Top Header: Symbol Info & Action Buttons */}
        <div className="live-quote-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', minWidth: 0, width: '100%' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 className="font-mono live-quote-symbol-heading" style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {quote.symbol}
              </h1>
              <CountryFlag country={quote.country} countryCode={quote.countryCode} symbol={quote.symbol} countryFlag={quote.countryFlag} size="md" showName={true} />
              <span className="status-pill live-quote-sector-pill" style={{ fontSize: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', flexShrink: 0 }}>
                {quote.sector || 'US Equity'}
              </span>
              {!isLiveMode && (
                <span
                  className="font-mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: isPastMode ? 'rgba(245, 158, 11, 0.16)' : 'rgba(6, 182, 212, 0.16)',
                    color: isPastMode ? 'var(--warning-amber)' : 'var(--accent-cyan)',
                    border: `1px solid ${isPastMode ? 'rgba(245, 158, 11, 0.45)' : 'rgba(6, 182, 212, 0.45)'}`
                  }}
                >
                  {isPastMode ? <History size={11} /> : <Sparkles size={11} />}
                  {isPastMode ? `PAST MARKET (${dateSnapshot.daysDiff}D)` : `FUTURE PROJECTION (+${dateSnapshot.daysDiff}D)`}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem 0.6rem', flexWrap: 'wrap', minWidth: 0 }}>
              <span className="live-quote-name-text" style={{ fontWeight: 600 }}>{quote.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>

              {/* Interactive Past & Future Calendar Trigger Pill */}
              <div
                className="live-quote-calendar-trigger-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '6px',
                  background: isCalendarOpen
                    ? 'rgba(6, 182, 212, 0.14)'
                    : !isLiveMode
                    ? (isPastMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(6, 182, 212, 0.14)')
                    : 'var(--bg-input)',
                  border: isCalendarOpen
                    ? '1px solid var(--accent-cyan)'
                    : !isLiveMode
                    ? (isPastMode ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(6, 182, 212, 0.5)')
                    : '1px solid var(--border-subtle)',
                  padding: '1px',
                  transition: 'all 0.15s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => handleShiftDays(-1)}
                  title="Previous Day (Past Market)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.18rem 0.28rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <ChevronLeft size={12} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalendarOpen((prev) => !prev)}
                  title="Click to toggle Past & Future Market Calendar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: !isLiveMode ? (isPastMode ? 'var(--warning-amber)' : 'var(--accent-cyan)') : 'var(--text-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    padding: '0.16rem 0.4rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  
                  <span>{dateSnapshot.formattedDate}</span>
                  <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>{isCalendarOpen ? '▴' : '▾'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShiftDays(1)}
                  title="Next Day (Future Market)"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.18rem 0.28rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <ChevronRight size={12} />
                </button>
              </div>

              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {isLiveMode
                  ? `Last tick: ${new Date(lastTickTime).toLocaleTimeString()}`
                  : isPastMode
                  ? `Historical Tape • ${Math.abs(dateSnapshot.daysDiff)}d ago`
                  : `AI Forecast • +${dateSnapshot.daysDiff}d ahead (${dateSnapshot.confidence}% conf.)`}
              </span>
            </div>
          </div>

          <div className="live-quote-actions-cluster" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 }}>
            {onOpenDeepRecord && (
              <button
                type="button"
                className="btn btn-secondary live-quote-action-btn"
                onClick={() => onOpenDeepRecord(quote.symbol, quote)}
                title="View Complete Stock Record & Valuation from Starting (IPO) Till Now"
                style={{ borderColor: 'rgba(6, 182, 212, 0.45)', color: 'var(--accent-cyan)' }}
              >
                <History size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                <span>Full Record (Start → Now)</span>
              </button>
            )}

            <button
              className="btn btn-secondary live-quote-action-btn"
              onClick={onToggleWatchlist}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInWatchlist ? (
                <>
                  <BookmarkCheck size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <span>Watching</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={14} style={{ flexShrink: 0 }} />
                  <span>Watchlist</span>
                </>
              )}
            </button>

            <button
              className="btn btn-secondary live-quote-action-btn"
              onClick={onOpenAlertModal}
              title="Configure Price Alert"
            >
              <Bell size={14} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
              <span>Set Alert</span>
            </button>

            <button
              className="btn btn-bull live-quote-action-btn live-quote-trade-btn"
              onClick={onOpenTradeModal}
              title="Simulate Paper Order"
            >
              <ShoppingCart size={14} style={{ flexShrink: 0 }} />
              <span>Trade</span>
            </button>
          </div>
        </div>

        {/* Inline Expandable Past & Future Market Calendar Panel (Zero Overlap & Zero Clipping) */}
        {isCalendarOpen && (
          <div
            className="live-quote-calendar-panel"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-focus)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            {/* Panel Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Calendar size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Past & Future Market Time-Machine Calendar
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {!isLiveMode && (
                  <button
                    type="button"
                    onClick={handleResetToLive}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '5px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--bull-green-bg)',
                      color: 'var(--bull-green)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={11} />
                    Live Today
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  title="Close Calendar"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: '5px',
                    padding: '3px 5px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Responsive 2-Column Calendar Workbench */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 245px), 1fr))', gap: '0.9rem', alignItems: 'start' }}>
              {/* Left Column: Quick Horizon Presets & Direct Date Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* Past Presets Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase', minWidth: '58px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    ◀ Past
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', flex: 1 }}>
                    {[
                      { label: '-1W', d: -7, m: 0, y: 0 },
                      { label: '-1M', d: 0, m: -1, y: 0 },
                      { label: '-3M', d: 0, m: -3, y: 0 },
                      { label: '-6M', d: 0, m: -6, y: 0 },
                      { label: '-1Y', d: 0, m: 0, y: -1 },
                      { label: '-5Y', d: 0, m: 0, y: -5 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handlePresetOffset(p.d, p.m, p.y)}
                        style={{
                          padding: '0.26rem 0',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          borderRadius: '5px',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          background: 'rgba(245, 158, 11, 0.14)',
                          color: 'var(--warning-amber)',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Future Presets Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase', minWidth: '58px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Future ▶
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', flex: 1 }}>
                    {[
                      { label: '+1W', d: 7, m: 0, y: 0 },
                      { label: '+1M', d: 0, m: 1, y: 0 },
                      { label: '+3M', d: 0, m: 3, y: 0 },
                      { label: '+6M', d: 0, m: 6, y: 0 },
                      { label: '+1Y', d: 0, m: 0, y: 1 },
                      { label: '+5Y', d: 0, m: 0, y: 5 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handlePresetOffset(p.d, p.m, p.y)}
                        style={{
                          padding: '0.26rem 0',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          borderRadius: '5px',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          background: 'rgba(6, 182, 212, 0.14)',
                          color: 'var(--accent-cyan)',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Jump Date Input + Live Reset */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.15rem' }}>
                  <input
                    type="date"
                    value={selectedDateStr}
                    min="2015-01-01"
                    max="2036-12-31"
                    onChange={(e) => {
                      if (e.target.value) handleSelectDate(e.target.value, false);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      padding: '0.32rem 0.5rem',
                      fontSize: '0.74rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleResetToLive}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.34rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      background: isLiveMode ? 'var(--bull-green-bg)' : 'linear-gradient(135deg, #10b981, #059669)',
                      color: isLiveMode ? 'var(--bull-green)' : '#ffffff',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <RotateCcw size={12} />
                    Today
                  </button>
                </div>

                {/* Active Date Summary Box */}
                <div
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Selected Date:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{dateSnapshot.formattedDate}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{isLiveMode ? 'Market Status:' : 'vs Live ($' + quote.price.toFixed(2) + '):'}</span>
                    {isLiveMode ? (
                      <strong style={{ color: 'var(--bull-green)' }}>● Real-Time Live Tape</strong>
                    ) : (
                      <strong style={{ color: dateSnapshot.vsLiveChange >= 0 ? 'var(--bull-green)' : 'var(--bear-red)' }}>
                        {dateSnapshot.vsLiveChange >= 0 ? '+' : ''}${dateSnapshot.vsLiveChange.toFixed(2)} ({dateSnapshot.vsLivePercent >= 0 ? '+' : ''}{dateSnapshot.vsLivePercent.toFixed(2)}%)
                      </strong>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Full Month & Year Calendar Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {/* Month & Year Navigation Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.45rem', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear() - 1, viewMonthDate.getMonth(), 1))}
                      title="Previous Year"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 5px', display: 'inline-flex' }}
                    >
                      <ChevronsLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() - 1, 1))}
                      title="Previous Month"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '2px 5px', display: 'inline-flex' }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>

                  <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {viewMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() + 1, 1))}
                      title="Next Month"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '2px 5px', display: 'inline-flex' }}
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear() + 1, viewMonthDate.getMonth(), 1))}
                      title="Next Year"
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 5px', display: 'inline-flex' }}
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                  {WEEKDAYS.map((w) => (
                    <span key={w} style={{ fontSize: '0.64rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {w}
                    </span>
                  ))}
                </div>

                {/* 42-Cell Day Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
                  {calendarDays.map((cell) => {
                    const isSelected = cell.iso === selectedDateStr;
                    const isToday = cell.iso === todayISO;
                    const isFutureCell = cell.iso > todayISO;

                    let bg = 'var(--bg-card)';
                    let border = '1px solid var(--border-subtle)';
                    let color = cell.inCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)';

                    if (isSelected) {
                      bg = isToday
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : isFutureCell
                        ? 'linear-gradient(135deg, #0284c7, #4f46e5)'
                        : 'linear-gradient(135deg, #d97706, #b45309)';
                      color = '#ffffff';
                      border = '1px solid transparent';
                    } else if (isToday) {
                      bg = 'var(--bull-green-bg)';
                      border = '1px solid var(--bull-green)';
                      color = 'var(--bull-green)';
                    }

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        onClick={() => handleSelectDate(cell.iso, false)}
                        style={{
                          padding: '0.26rem 0',
                          fontSize: '0.7rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: isSelected || isToday ? 800 : 600,
                          borderRadius: '5px',
                          background: bg,
                          border,
                          color,
                          opacity: !cell.inCurrentMonth && !isSelected ? 0.55 : 1,
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {cell.dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Past / Future Market Time-Machine Status Banner when not on Today */}
        {!isLiveMode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              background: isPastMode
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(6, 182, 212, 0.12)',
              border: `1px solid ${isPastMode ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`,
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: isPastMode ? 'var(--warning-amber)' : 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {isPastMode ? <History size={13} /> : <Sparkles size={13} />}
                {isPastMode ? `PAST MARKET SNAPSHOT: ${dateSnapshot.formattedDate}` : `FUTURE AI MARKET PROJECTION: ${dateSnapshot.formattedDate}`}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                vs Current Live (${quote.price.toFixed(2)}):{' '}
                <strong style={{ color: dateSnapshot.vsLiveChange >= 0 ? 'var(--bull-green)' : 'var(--bear-red)' }}>
                  {dateSnapshot.vsLiveChange >= 0 ? '+' : ''}${dateSnapshot.vsLiveChange.toFixed(2)} ({dateSnapshot.vsLivePercent >= 0 ? '+' : ''}{dateSnapshot.vsLivePercent.toFixed(2)}%)
                </strong>
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                • {dateSnapshot.regime}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetToLive}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.55rem',
                borderRadius: '5px',
                fontSize: '0.68rem',
                fontWeight: 800,
                background: 'var(--bull-green-bg)',
                color: 'var(--bull-green)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={11} /> Return to Live
            </button>
          </div>
        )}

        {/* Big Live / Historical / Projected Price Block */}
        <div className="live-quote-price-hero" style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem 1rem', flexWrap: 'wrap', minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', minWidth: 0 }}>
            <div
              className={`font-mono live-quote-big-price ${isLiveMode ? pulseClass : ''}`}
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.15s ease',
                color: !isLiveMode ? (isPastMode ? 'var(--warning-amber)' : 'var(--accent-cyan)') : 'var(--text-primary)'
              }}
            >
              ${activePrice.toFixed(2)}
            </div>

            {isLiveMode && tickDirection !== 'neutral' && (
              <span
                className={`status-pill font-mono ${tickDirection === 'up' ? 'bg-bull' : 'bg-bear'}`}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                {tickDirection === 'up' ? '▲ UPTICK' : '▼ DOWNTICK'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
            <span
              className={`font-mono ${isBull ? 'bg-bull' : 'bg-bear'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.92rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {isBull ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
              {activeChange >= 0 ? '+' : ''}{activeChange.toFixed(2)} ({activeChangePct >= 0 ? '+' : ''}{activeChangePct.toFixed(2)}%)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {isLiveMode
                ? `Today (${formatCalendarDate(todayISO, { month: 'short', day: 'numeric' })})`
                : `${isPastMode ? 'Session' : 'Projected'} (${formatCalendarDate(selectedDateStr, { month: 'short', day: 'numeric', year: 'numeric' })})`}
            </span>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div
          className="live-quote-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 75px), 1fr))',
            gap: '0.65rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)',
            minWidth: 0,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {isFutureMode ? 'Proj. High' : 'Day High'}
            </div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ${activeHigh?.toFixed(2) || '--'}
            </div>
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {isFutureMode ? 'Proj. Low' : 'Day Low'}
            </div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ${activeLow?.toFixed(2) || '--'}
            </div>
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {isFutureMode ? 'Prior Session' : 'Prev Close'}
            </div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ${activePrevClose?.toFixed(2) || '--'}
            </div>
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {isFutureMode ? 'Est. Volume' : 'Volume'}
            </div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeVolume ? activeVolume.toLocaleString() : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LiveQuoteCard;
