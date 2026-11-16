import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from 'lucide-react';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toYmd = (year, monthZeroIdx, day) => {
  return `${year}-${String(monthZeroIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseYmd = (str) => {
  if (!str || typeof str !== 'string') return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const monthZero = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  if (monthZero < 0 || monthZero > 11 || day < 1 || day > 31) return null;
  return { year, monthZero, day };
};

const formatHumanDate = (str) => {
  const parsed = parseYmd(str);
  if (!parsed) return '';
  return `${MONTHS_SHORT[parsed.monthZero]} ${String(parsed.day).padStart(2, '0')}, ${parsed.year}`;
};

export function ModernDatePicker({
  value = '',
  onChange,
  min = '2015-01-01',
  max = '2036-12-31',
  placeholder = 'Select date',
  showQuickJumps = false,
  renderTrigger,
  hasError = false,
  inputStyle = {},
  title = 'Open interactive calendar'
}) {
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days' | 'months' | 'years'
  const [coords, setCoords] = useState({ top: 0, left: 0, origin: 'top left' });

  const today = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      monthZero: now.getMonth(),
      day: now.getDate(),
      str: toYmd(now.getFullYear(), now.getMonth(), now.getDate())
    };
  }, []);

  const parsedValue = useMemo(() => parseYmd(value), [value]);
  const minParsed = useMemo(() => parseYmd(min) || { year: 1920, monthZero: 0, day: 1 }, [min]);
  const maxParsed = useMemo(() => parseYmd(max) || { year: 2050, monthZero: 11, day: 31 }, [max]);

  const [viewYear, setViewYear] = useState(() => parsedValue?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(() => parsedValue?.monthZero ?? today.monthZero);
  const [yearPageStart, setYearPageStart] = useState(() => {
    const base = parsedValue?.year ?? today.year;
    return Math.floor(base / 12) * 12;
  });

  // Sync calendar month/year whenever opened or value changes externally
  useEffect(() => {
    const target = parsedValue || today;
    setViewYear(target.year);
    setViewMonth(target.monthZero);
    setYearPageStart(Math.floor(target.year / 12) * 12);
  }, [value, isOpen]);

  const updatePopoverPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popW = Math.min(304, window.innerWidth - 20);
    const popH = showQuickJumps ? 378 : 334;

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < popH + 14 && rect.top > popH + 14;
    const top = placeAbove
      ? Math.max(10, rect.top - popH - 8)
      : Math.min(window.innerHeight - popH - 10, rect.bottom + 8);

    const rawLeft = rect.left;
    const left = Math.max(10, Math.min(window.innerWidth - popW - 10, rawLeft));
    setCoords({
      top,
      left,
      origin: placeAbove ? 'bottom left' : 'top left'
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePopoverPosition();

    const handleOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleReposition = () => updatePopoverPosition();

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, showQuickJumps]);

  const toggleOpen = () => {
    setViewMode('days');
    setIsOpen((prev) => !prev);
  };

  const commitDate = (dateStr) => {
    if (!dateStr) return;
    const clamped = dateStr < min ? min : dateStr > max ? max : dateStr;
    if (onChange) onChange(clamped);
    setIsOpen(false);
  };

  const applyQuickOffset = ({ d = 0, m = 0, y = 0, reset = false }) => {
    if (reset) {
      commitDate(today.str);
      return;
    }
    const base = new Date(today.year, today.monthZero, today.day);
    if (y) base.setFullYear(base.getFullYear() + y);
    if (m) base.setMonth(base.getMonth() + m);
    if (d) base.setDate(base.getDate() + d);
    commitDate(toYmd(base.getFullYear(), base.getMonth(), base.getDate()));
  };

  const handlePrev = () => {
    if (viewMode === 'years') {
      setYearPageStart((p) => Math.max(minParsed.year - (minParsed.year % 12), p - 12));
    } else if (viewMode === 'months') {
      setViewYear((y) => Math.max(minParsed.year, y - 1));
    } else {
      if (viewMonth === 0) {
        if (viewYear > minParsed.year) {
          setViewYear((y) => y - 1);
          setViewMonth(11);
        }
      } else {
        setViewMonth((m) => m - 1);
      }
    }
  };

  const handleNext = () => {
    if (viewMode === 'years') {
      setYearPageStart((p) => Math.min(Math.floor(maxParsed.year / 12) * 12, p + 12));
    } else if (viewMode === 'months') {
      setViewYear((y) => Math.min(maxParsed.year, y + 1));
    } else {
      if (viewMonth === 11) {
        if (viewYear < maxParsed.year) {
          setViewYear((y) => y + 1);
          setViewMonth(0);
        }
      } else {
        setViewMonth((m) => m + 1);
      }
    }
  };

  // Build 42-cell calendar grid for viewYear / viewMonth
  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const pm = viewMonth === 0 ? 11 : viewMonth - 1;
      const py = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, monthZero: pm, year: py, isOutside: true, str: toYmd(py, pm, d) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, monthZero: viewMonth, year: viewYear, isOutside: false, str: toYmd(viewYear, viewMonth, d) });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = viewMonth === 11 ? 0 : viewMonth + 1;
      const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, monthZero: nm, year: ny, isOutside: true, str: toYmd(ny, nm, d) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const yearsGrid = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => yearPageStart + idx);
  }, [yearPageStart]);

  const popoverNode = isOpen ? createPortal(
    <div
      ref={popoverRef}
      className="modern-datepicker-popover"
      role="dialog"
      aria-label="Modern Calendar Date Picker"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transformOrigin: coords.origin
      }}
    >
      {/* Top Navigation Header */}
      <div className="modern-cal-header">
        <button
          type="button"
          className="modern-cal-nav-btn"
          onClick={handlePrev}
          aria-label="Previous"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="modern-cal-title-group">
          <button
            type="button"
            className={`modern-cal-mode-pill ${viewMode === 'months' ? 'active' : ''}`}
            onClick={() => setViewMode((m) => (m === 'months' ? 'days' : 'months'))}
            title="Select Month"
          >
            <span>{MONTHS_FULL[viewMonth]}</span>
            <ChevronDown size={12} className={`modern-cal-caret ${viewMode === 'months' ? 'flipped' : ''}`} />
          </button>

          <button
            type="button"
            className={`modern-cal-mode-pill ${viewMode === 'years' ? 'active' : ''}`}
            onClick={() => {
              setYearPageStart(Math.floor(viewYear / 12) * 12);
              setViewMode((m) => (m === 'years' ? 'days' : 'years'));
            }}
            title="Select Year"
          >
            <span>{viewYear}</span>
            <ChevronDown size={12} className={`modern-cal-caret ${viewMode === 'years' ? 'flipped' : ''}`} />
          </button>
        </div>

        <button
          type="button"
          className="modern-cal-nav-btn"
          onClick={handleNext}
          aria-label="Next"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Interactive View Stage with Smooth Keyed Crossfade */}
      <div key={`${viewMode}-${viewYear}-${viewMonth}-${yearPageStart}`} className="modern-cal-stage">
        {viewMode === 'days' && (
          <>
            <div className="modern-cal-weekdays">
              {WEEKDAYS.map((wd) => (
                <span key={wd}>{wd}</span>
              ))}
            </div>
            <div className="modern-cal-days-grid">
              {calendarDays.map((cell) => {
                const isDisabled = cell.str < min || cell.str > max;
                const isSelected = cell.str === value;
                const isToday = cell.str === today.str;
                return (
                  <button
                    key={cell.str}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => commitDate(cell.str)}
                    className={[
                      'modern-cal-day',
                      cell.isOutside ? 'outside' : '',
                      isSelected ? 'selected' : '',
                      isToday ? 'today' : '',
                      isDisabled ? 'disabled' : ''
                    ].filter(Boolean).join(' ')}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'months' && (
          <div className="modern-cal-pill-grid">
            {MONTHS_SHORT.map((label, idx) => {
              const outOfRange =
                (viewYear < minParsed.year || (viewYear === minParsed.year && idx < minParsed.monthZero)) ||
                (viewYear > maxParsed.year || (viewYear === maxParsed.year && idx > maxParsed.monthZero));
              const isActive = idx === viewMonth;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={outOfRange}
                  onClick={() => {
                    setViewMonth(idx);
                    setViewMode('days');
                  }}
                  className={`modern-cal-pill-item ${isActive ? 'selected' : ''} ${outOfRange ? 'disabled' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {viewMode === 'years' && (
          <div className="modern-cal-pill-grid">
            {yearsGrid.map((yr) => {
              const outOfRange = yr < minParsed.year || yr > maxParsed.year;
              const isActive = yr === viewYear;
              return (
                <button
                  key={yr}
                  type="button"
                  disabled={outOfRange}
                  onClick={() => {
                    setViewYear(yr);
                    setViewMode('months');
                  }}
                  className={`modern-cal-pill-item ${isActive ? 'selected' : ''} ${outOfRange ? 'disabled' : ''}`}
                >
                  {yr}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Quick Actions */}
      <div className="modern-cal-footer">
        {showQuickJumps ? (
          <div className="modern-cal-quick-strip">
            {[
              { label: '-1Y', y: -1 },
              { label: '-1M', m: -1 },
              { label: '-1W', d: -7 }
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                className="modern-cal-chip past"
                onClick={() => applyQuickOffset(p)}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className="modern-cal-chip today-btn"
              onClick={() => applyQuickOffset({ reset: true })}
              title="Snap back to Live Market Today"
            >
              <RotateCcw size={10} /> Today
            </button>
            {[
              { label: '+1W', d: 7 },
              { label: '+1M', m: 1 },
              { label: '+1Y', y: 1 }
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                className="modern-cal-chip future"
                onClick={() => applyQuickOffset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="modern-cal-simple-footer">
            <span className="modern-cal-selected-preview">
              {value ? formatHumanDate(value) : 'No date selected'}
            </span>
            <button
              type="button"
              className="modern-cal-chip today-btn"
              onClick={() => commitDate(today.str)}
            >
              Today
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ isOpen, toggle: toggleOpen, triggerRef })
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleOpen}
          title={title}
          className={`modern-datepicker-trigger ${isOpen ? 'open' : ''} ${hasError ? 'error' : ''}`}
          style={inputStyle}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
            <CalendarIcon size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {value ? formatHumanDate(value) : placeholder}
            </span>
          </span>
          <ChevronDown size={13} className={`modern-cal-caret ${isOpen ? 'flipped' : ''}`} style={{ opacity: 0.7, flexShrink: 0 }} />
        </button>
      )}
      {popoverNode}
    </>
  );
}

export default ModernDatePicker;
