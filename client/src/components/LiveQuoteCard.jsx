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
  Clock,
  X
} from 'lucide-react';
import { useSocketQuote } from '../context/SocketContext';
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
  onOpenTradeModal
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
  const calendarPopoverRef = useRef(null);

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

  // Close calendar popover on outside click or Escape key
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleClickOutside = (e) => {
      if (calendarPopoverRef.current && !calendarPopoverRef.current.contains(e.target)) {
        setIsCalendarOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsCalendarOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
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

  const handleSelectDate = (isoStr, closePopover = false) => {
    if (!isoStr) return;
    setSelectedDateStr(isoStr);
    const parts = isoStr.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      setViewMonthDate(new Date(parts[0], parts[1] - 1, 1));
    }
    if (closePopover) {
      setIsCalendarOpen(false);
    }
  };

  const handleShiftDays = (deltaDays, closePopover = false) => {
    const parts = (selectedDateStr || todayISO).split('-').map(Number);
    const base = parts.length === 3 && !parts.some(isNaN)
      ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
      : new Date();
    base.setDate(base.getDate() + deltaDays);
    handleSelectDate(toISODateString(base), closePopover);
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
    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      cells.push({
        iso: toISODateString(d),
        dayNum: d.getDate(),
        inCurrentMonth: false
      });
    }
    // Current month days
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const d = new Date(year, month, dNum);
      cells.push({
        iso: toISODateString(d),
        dayNum: dNum,
        inCurrentMonth: true
      });
    }
    // Trailing days to complete 42 cells (6 rows)
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
    <div className="glass-card" style={{ minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box', overflow: 'visible', position: 'relative' }}>
      <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        {/* Top Header: Symbol Info & Action Buttons */}
        <div className="live-quote-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', minWidth: 0, width: '100%' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 className="font-mono live-quote-symbol-heading" style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {quote.symbol}
              </h1>
              <span className="status-pill live-quote-sector-pill" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
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
                    color: isPastMode ? '#fbbf24' : '#38bdf8',
                    border: `1px solid ${isPastMode ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`
                  }}
                >
                  {isPastMode ? <History size={11} /> : <Sparkles size={11} />}
                  {isPastMode ? `PAST MARKET (${dateSnapshot.daysDiff}D)` : `FUTURE PROJECTION (+${dateSnapshot.daysDiff}D)`}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem 0.6rem', flexWrap: 'wrap', minWidth: 0 }}>
              <span className="live-quote-name-text">{quote.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>

              {/* Interactive Past & Future Calendar Trigger Pill */}
              <div ref={calendarPopoverRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '6px',
                    background: isCalendarOpen
                      ? 'rgba(56, 189, 248, 0.16)'
                      : !isLiveMode
                      ? (isPastMode ? 'rgba(245, 158, 11, 0.14)' : 'rgba(6, 182, 212, 0.14)')
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isCalendarOpen
                      ? '1px solid rgba(56, 189, 248, 0.55)'
                      : !isLiveMode
                      ? (isPastMode ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(6, 182, 212, 0.45)')
                      : '1px solid rgba(148, 163, 184, 0.22)',
                    padding: '1px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Step 1 Day Back Button */}
                  <button
                    type="button"
                    onClick={() => handleShiftDays(-1)}
                    title="Previous Day (Past Market)"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '0.18rem 0.28rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    <ChevronLeft size={12} />
                  </button>

                  {/* Main Clickable Date Pill */}
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    title="Click to open Calendar and inspect Past or Future Market"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: !isLiveMode ? (isPastMode ? '#fcd34d' : '#38bdf8') : 'var(--text-primary)',
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
                    <span role="img" aria-label="calendar">📅</span>
                    <span>{dateSnapshot.formattedDate}</span>
                    <span style={{ fontSize: '0.62rem', opacity: 0.75 }}>▾</span>
                  </button>

                  {/* Step 1 Day Forward Button */}
                  <button
                    type="button"
                    onClick={() => handleShiftDays(1)}
                    title="Next Day (Future Market)"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
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

                {/* Interactive Past & Future Market Calendar Popover */}
                {isCalendarOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
                      zIndex: 120,
                      width: '320px',
                      maxWidth: 'calc(100vw - 32px)',
                      background: 'rgba(11, 18, 33, 0.98)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      borderRadius: '12px',
                      boxShadow: '0 18px 42px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                      padding: '0.85rem',
                      backdropFilter: 'blur(16px)',
                      color: '#f8fafc'
                    }}
                  >
                    {/* Popover Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', paddingBottom: '0.45rem', borderBottom: '1px solid rgba(148, 163, 184, 0.14)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} style={{ color: '#38bdf8' }} />
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#e2e8f0' }}>
                          Past & Future Market Calendar
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(false)}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          color: '#94a3b8',
                          borderRadius: '4px',
                          padding: '2px 4px',
                          cursor: 'pointer',
                          display: 'inline-flex'
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>

                    {/* Quick Horizon Jump Presets (Past & Future) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.7rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{ fontSize: '0.64rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', width: '44px' }}>
                          ◀ Past
                        </span>
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
                              flex: 1,
                              padding: '0.2rem 0',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              borderRadius: '4px',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#fcd34d',
                              cursor: 'pointer'
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{ fontSize: '0.64rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', width: '44px' }}>
                          Future ▶
                        </span>
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
                              flex: 1,
                              padding: '0.2rem 0',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              background: 'rgba(56, 189, 248, 0.1)',
                              color: '#38bdf8',
                              cursor: 'pointer'
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Month & Year Navigation Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.4rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear() - 1, viewMonthDate.getMonth(), 1))}
                          title="Previous Year"
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex' }}
                        >
                          <ChevronsLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() - 1, 1))}
                          title="Previous Month"
                          style={{ background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex' }}
                        >
                          <ChevronLeft size={14} />
                        </button>
                      </div>

                      <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                        {viewMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear(), viewMonthDate.getMonth() + 1, 1))}
                          title="Next Month"
                          style={{ background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex' }}
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMonthDate(new Date(viewMonthDate.getFullYear() + 1, viewMonthDate.getMonth(), 1))}
                          title="Next Year"
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px', display: 'inline-flex' }}
                        >
                          <ChevronsRight size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Weekday Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '4px' }}>
                      {WEEKDAYS.map((w) => (
                        <span key={w} style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748b' }}>
                          {w}
                        </span>
                      ))}
                    </div>

                    {/* Interactive 42-Cell Calendar Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '0.65rem' }}>
                      {calendarDays.map((cell) => {
                        const isSelected = cell.iso === selectedDateStr;
                        const isToday = cell.iso === todayISO;
                        const isFutureCell = cell.iso > todayISO;

                        let bg = 'transparent';
                        let border = '1px solid transparent';
                        let color = cell.inCurrentMonth ? '#cbd5e1' : '#475569';

                        if (isSelected) {
                          bg = isToday
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : isFutureCell
                            ? 'linear-gradient(135deg, #06b6d4, #6366f1)'
                            : 'linear-gradient(135deg, #f59e0b, #d97706)';
                          color = '#ffffff';
                        } else if (isToday) {
                          bg = 'rgba(16, 185, 129, 0.16)';
                          border = '1px solid rgba(16, 185, 129, 0.5)';
                          color = '#34d399';
                        }

                        return (
                          <button
                            key={cell.iso}
                            type="button"
                            onClick={() => handleSelectDate(cell.iso, false)}
                            style={{
                              padding: '0.28rem 0',
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: isSelected || isToday ? 800 : 500,
                              borderRadius: '5px',
                              background: bg,
                              border,
                              color,
                              cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            {cell.dayNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Direct Date Input & Reset to Live Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.14)' }}>
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
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.28)',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          padding: '0.25rem 0.45rem',
                          fontSize: '0.72rem',
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
                          padding: '0.28rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          background: isLiveMode ? 'rgba(16, 185, 129, 0.15)' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: isLiveMode ? '#34d399' : '#ffffff',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <RotateCcw size={11} />
                        Live Today
                      </button>
                    </div>
                  </div>
                )}
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
            {/* Watchlist Toggle */}
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

            {/* Set Alert Button */}
            <button
              className="btn btn-secondary live-quote-action-btn"
              onClick={onOpenAlertModal}
              title="Configure Price Alert"
            >
              <Bell size={14} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
              <span>Set Alert</span>
            </button>

            {/* Trade Button */}
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
                ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.6) 100%)'
                : 'linear-gradient(90deg, rgba(6, 182, 212, 0.14) 0%, rgba(99, 102, 241, 0.14) 100%)',
              border: `1px solid ${isPastMode ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.38)'}`,
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: isPastMode ? '#fbbf24' : '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {isPastMode ? <History size={13} /> : <Sparkles size={13} />}
                {isPastMode ? `PAST MARKET SNAPSHOT: ${dateSnapshot.formattedDate}` : `FUTURE AI MARKET PROJECTION: ${dateSnapshot.formattedDate}`}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                vs Current Live (${quote.price.toFixed(2)}):{' '}
                <strong style={{ color: dateSnapshot.vsLiveChange >= 0 ? 'var(--bull-green)' : 'var(--bear-red)' }}>
                  {dateSnapshot.vsLiveChange >= 0 ? '+' : ''}${dateSnapshot.vsLiveChange.toFixed(2)} ({dateSnapshot.vsLivePercent >= 0 ? '+' : ''}{dateSnapshot.vsLivePercent.toFixed(2)}%)
                </strong>
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
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
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#34d399',
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
                color: !isLiveMode ? (isPastMode ? '#fef3c7' : '#e0f2fe') : undefined
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
