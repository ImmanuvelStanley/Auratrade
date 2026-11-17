import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export function ModernSelect({
  value,
  onChange,
  options = [],
  prefix,
  ariaLabel,
  menuTitle,
  columns = 1,
  menuWidth = 232,
  align = 'left',
  variant = 'chip', // 'chip' | 'embedded'
  className = ''
}) {
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: menuWidth, effectiveCols: columns, origin: 'top left' });

  const normalizedOptions = useMemo(() => {
    return (options || []).map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((o) => o.value === value) || normalizedOptions[0] || { value: '', label: '' };
  }, [normalizedOptions, value]);

  const updatePopoverPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const isNarrow = window.innerWidth < 560;
    const effectiveCols = isNarrow ? 1 : columns;
    const targetW = isNarrow ? Math.min(290, window.innerWidth - 20) : Math.min(menuWidth, window.innerWidth - 20);
    const popW = Math.max(targetW, rect.width);

    const rowCount = effectiveCols === 2
      ? Math.ceil(normalizedOptions.length / 2) + 1
      : normalizedOptions.length;
    const estH = Math.min(340, (menuTitle ? 36 : 12) + rowCount * 34 + 12);

    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < estH + 14 && rect.top > estH + 14;
    const top = placeAbove
      ? Math.max(10, rect.top - estH - 6)
      : Math.min(window.innerHeight - estH - 10, rect.bottom + 6);

    const rawLeft = align === 'right' ? rect.right - popW : rect.left;
    const left = Math.max(10, Math.min(window.innerWidth - popW - 10, rawLeft));

    setCoords({
      top,
      left,
      width: popW,
      effectiveCols,
      origin: `${placeAbove ? 'bottom' : 'top'} ${align === 'right' ? 'right' : 'left'}`
    });
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    updatePopoverPosition();

    const handleOutside = (e) => {
      if (
        triggerRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const curIdx = normalizedOptions.findIndex((o) => o.value === value);
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const nextIdx = Math.max(0, Math.min(normalizedOptions.length - 1, (curIdx >= 0 ? curIdx : 0) + delta));
        const nextOpt = normalizedOptions[nextIdx];
        if (nextOpt && onChange) onChange(nextOpt.value);
      }
    };

    const handleScrollOrResize = (e) => {
      if (e.type === 'scroll' && popoverRef.current && popoverRef.current.contains(e.target)) {
        return;
      }
      if (e.type === 'resize') updatePopoverPosition();
      else setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutside, true);
    document.addEventListener('touchstart', handleOutside, true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside, true);
      document.removeEventListener('touchstart', handleOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, value, normalizedOptions.length]);

  const handleSelect = (optVal) => {
    if (onChange) onChange(optVal);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const triggerClass = variant === 'embedded'
    ? `modern-select-trigger modern-select-trigger--embedded${isOpen ? ' is-open' : ''}`
    : `screener-control-chip modern-select-trigger${isOpen ? ' is-open' : ''}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${triggerClass} ${className}`.trim()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {prefix && <span className="screener-chip-prefix">{prefix}</span>}
        <span className="modern-select-value">{selectedOption.shortLabel || selectedOption.label}</span>
        <ChevronDown
          size={13}
          className={`modern-select-chevron${isOpen ? ' is-rotated' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={ariaLabel || menuTitle || 'Options'}
          className="modern-select-popover"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            transformOrigin: coords.origin
          }}
        >
          {menuTitle && (
            <div className="modern-select-menu-hdr">{menuTitle}</div>
          )}
          <div
            className={`modern-select-list${coords.effectiveCols === 2 ? ' is-grid-2' : ''}`}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`modern-select-option${isSelected ? ' is-selected' : ''}${opt.spanFull && coords.effectiveCols === 2 ? ' is-span-full' : ''}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="modern-select-opt-label">{opt.label}</span>
                  <span className="modern-select-opt-right">
                    {opt.badge && <span className="modern-select-opt-badge">{opt.badge}</span>}
                    {isSelected && <Check size={13} className="modern-select-check" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
