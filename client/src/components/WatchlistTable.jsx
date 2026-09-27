import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, ArrowUpRight, ArrowDownRight, Eye, Globe, Bell } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { WatchlistCompanyChooserModal } from './WatchlistCompanyChooserModal';

const WatchlistRow = React.memo(function WatchlistRow({
  sym,
  quote,
  isActive,
  compact,
  isDualMode = false,
  alerts = [],
  onSelectSymbol,
  onRemoveFromWatchlist,
  onOpenAlertModal
}) {
  const [pulseClass, setPulseClass] = useState('');
  const prevPriceRef = useRef(quote?.price);

  useEffect(() => {
    if (!quote?.price) return;
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== quote.price) {
      setPulseClass(quote.price > prevPriceRef.current ? 'tick-pulse-up' : 'tick-pulse-down');
      const timer = setTimeout(() => setPulseClass(''), 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = quote.price;
  }, [quote?.price]);

  const price = quote?.price;
  const change = quote?.change || 0;
  const changePercent = quote?.changePercent || 0;
  const isBull = change >= 0;

  const activeAlert = alerts?.find(a => a.symbol === sym && (a.status === 'ACTIVE' || a.status === 'TRIGGERED'));
  const cellPadding = (compact || isDualMode) ? '0.65rem 0.8rem' : '0.9rem 1rem';

  return (
    <tr
      onClick={() => onSelectSymbol(sym)}
      style={{
        background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.15s ease'
      }}
    >
      {/* Symbol & Name */}
      <td style={{ padding: cellPadding, width: isDualMode ? '28%' : undefined }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: (compact || isDualMode) ? '0.82rem' : '0.9rem' }}>
            {sym}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {quote?.name ? ((compact || isDualMode) && quote.name.length > 14 ? quote.name.slice(0, 14) + '...' : quote.name) : 'Equity'}
          </span>
        </div>
      </td>

      {/* Price */}
      <td style={{ padding: cellPadding, width: isDualMode ? '20%' : undefined }}>
        <span
          className={`font-mono ${pulseClass}`}
          style={{
            fontWeight: 700,
            fontSize: (compact || isDualMode) ? '0.85rem' : '0.95rem',
            color: 'var(--text-primary)',
            padding: '0.1rem 0.3rem',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-block',
            transition: 'all 0.15s ease'
          }}
        >
          ${price !== undefined ? price.toFixed(2) : '--'}
        </span>
      </td>

      {/* Change */}
      <td style={{ padding: cellPadding, width: isDualMode ? '18%' : undefined }}>
        <span
          className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontWeight: 600, fontSize: (compact || isDualMode) ? '0.78rem' : '0.85rem' }}
        >
          {isBull ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </span>
      </td>

      {/* 24h Range (Full width mode only) */}
      {!compact && !isDualMode && (
        <td style={{ padding: cellPadding }}>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {quote?.dayLow ? `$${quote.dayLow.toFixed(2)} - $${quote.dayHigh.toFixed(2)}` : '--'}
          </span>
        </td>
      )}

      {/* Price Alert Column */}
      {!compact && (
        <td style={{ padding: cellPadding, width: isDualMode ? '22%' : undefined }}>
          {activeAlert ? (
            <button
              type="button"
              className={`badge-pill ${activeAlert.status === 'TRIGGERED' ? 'badge-pill-triggered status-triggered' : 'badge-pill-active status-active'}`}
              data-status={activeAlert.status}
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.18rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAlertModal) onOpenAlertModal(sym);
              }}
              title={`Alert ${activeAlert.status}: Price ${activeAlert.condition === 'ABOVE' ? '≥' : '≤'} $${activeAlert.targetPrice?.toFixed(2)}. Click to modify.`}
            >
              <Bell size={10} />
              <span>{activeAlert.condition === 'ABOVE' ? '≥' : '≤'} ${activeAlert.targetPrice?.toFixed(2)}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-icon"
              style={{
                padding: '0.18rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'var(--text-muted)',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAlertModal) onOpenAlertModal(sym);
              }}
              title={`Set server price alert for ${sym}`}
            >
              <Bell size={10} />
              <span>+ Alert</span>
            </button>
          )}
        </td>
      )}

      {/* Action Column */}
      <td style={{ textAlign: 'right', padding: cellPadding, width: isDualMode ? '12%' : undefined }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
          {compact && onOpenAlertModal && (
            <button
              className="btn-icon"
              style={{ padding: '0.3rem' }}
              title={activeAlert ? `Alert ${activeAlert.status}: $${activeAlert.targetPrice?.toFixed(2)}` : `Set Price Alert for ${sym}`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenAlertModal(sym);
              }}
            >
              <Bell
                size={13}
                style={{
                  color: activeAlert
                    ? activeAlert.status === 'TRIGGERED'
                      ? 'var(--bear-red)'
                      : 'var(--bull-green)'
                    : 'var(--text-muted)',
                  fill: activeAlert
                    ? activeAlert.status === 'TRIGGERED'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : 'rgba(16, 185, 129, 0.3)'
                    : 'none'
                }}
              />
            </button>
          )}
          <button
            className="btn-icon"
            style={{ padding: '0.3rem' }}
            title="Remove from watchlist"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromWatchlist(sym);
            }}
          >
            <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </td>
    </tr>
  );
});

export const WatchlistTable = React.memo(function WatchlistTable({
  watchlistSymbols = [],
  activeSymbol,
  compact = false,
  isDualMode = false,
  alerts = [],
  onSelectSymbol,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onOpenAlertModal,
  style = {}
}) {
  const { quotes } = useSocket();
  const [newSymbol, setNewSymbol] = useState('');
  const [isChooserOpen, setIsChooserOpen] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newSymbol.trim()) {
      setIsChooserOpen(true);
      return;
    }
    onAddToWatchlist(newSymbol.trim().toUpperCase());
    setNewSymbol('');
  };

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isDualMode ? '560px' : 'auto',
        minHeight: isDualMode ? '560px' : 'auto',
        maxHeight: isDualMode ? '560px' : 'none',
        ...style
      }}
    >
      {/* Synchronized Header */}
      <div
        className="glass-card-header"
        style={{
          padding: '0.85rem 1.15rem',
          minHeight: '54px',
          maxHeight: '54px',
          boxSizing: 'border-box',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div className="glass-card-title" style={{ fontSize: '0.92rem', gap: '0.5rem' }}>
          <Eye size={17} style={{ color: 'var(--accent-cyan)' }} />
          <span>{compact ? 'Watchlist' : 'Live Watchlist'}</span>
          <span
            className="badge-pill"
            style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.45rem',
              background: 'rgba(6, 182, 212, 0.12)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(6, 182, 212, 0.25)'
            }}
          >
            {watchlistSymbols.length}
          </span>
        </div>

        {/* Watchlist Controls: Quick Add & Browse All Global Markets Modal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.3rem' }}>
            <input
              type="text"
              className="input-field font-mono"
              placeholder="Ticker..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              style={{
                width: compact ? '65px' : '85px',
                height: '30px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                boxSizing: 'border-box'
              }}
            />
          </form>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              height: '30px',
              padding: '0 0.65rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              boxSizing: 'border-box'
            }}
            onClick={() => setIsChooserOpen(true)}
            title="Browse All Global Markets & Companies"
            id="watchlist-browse-markets-btn"
          >
            <Plus size={13} />
            {!compact && <span>Markets</span>}
          </button>
        </div>
      </div>

      {/* Internal Scrollable Table Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0
        }}
      >
        <table className="custom-table" style={{ width: '100%', tableLayout: isDualMode ? 'fixed' : 'auto' }}>
          <thead
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 4,
              background: 'var(--bg-card)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <tr>
              <th style={{ padding: (compact || isDualMode) ? '0.65rem 0.8rem' : '0.75rem 1rem', width: isDualMode ? '28%' : undefined }}>Symbol</th>
              <th style={{ padding: (compact || isDualMode) ? '0.65rem 0.8rem' : '0.75rem 1rem', width: isDualMode ? '20%' : undefined }}>Price</th>
              <th style={{ padding: (compact || isDualMode) ? '0.65rem 0.8rem' : '0.75rem 1rem', width: isDualMode ? '18%' : undefined }}>Change</th>
              {!compact && !isDualMode && <th>24h Range</th>}
              {!compact && <th style={{ padding: (compact || isDualMode) ? '0.65rem 0.8rem' : '0.75rem 1rem', width: isDualMode ? '22%' : undefined }}>Price Alert</th>}
              <th style={{ textAlign: 'right', padding: (compact || isDualMode) ? '0.65rem 0.8rem' : '0.75rem 1rem', width: isDualMode ? '12%' : undefined }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {watchlistSymbols.length === 0 ? (
              <tr>
                <td colSpan={compact ? 4 : (isDualMode ? 5 : 6)} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                    <Globe size={26} style={{ opacity: 0.5, color: 'var(--accent-cyan)' }} />
                    <span style={{ fontSize: '0.85rem' }}>Your watchlist is empty.</span>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}
                      onClick={() => setIsChooserOpen(true)}
                    >
                      <Plus size={14} />
                      <span>Browse 160+ Companies Across Markets</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              watchlistSymbols.map((sym) => (
                <WatchlistRow
                  key={sym}
                  sym={sym}
                  quote={quotes[sym]}
                  isActive={activeSymbol === sym}
                  compact={compact}
                  isDualMode={isDualMode}
                  alerts={alerts}
                  onSelectSymbol={onSelectSymbol}
                  onRemoveFromWatchlist={onRemoveFromWatchlist}
                  onOpenAlertModal={onOpenAlertModal}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Synchronized Bottom Anchor Footer in Dual Mode */}
      {isDualMode && (
        <div
          style={{
            padding: '0.55rem 1.15rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-input)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            minHeight: '38px',
            maxHeight: '38px',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bull-green)', display: 'inline-block' }} />
            {watchlistSymbols.length} Monitored Assets
          </span>
          <span style={{ fontSize: '0.7rem' }}>Click any row to view chart</span>
        </div>
      )}

      {/* Global Market Company Chooser Modal */}
      <WatchlistCompanyChooserModal
        isOpen={isChooserOpen}
        onClose={() => setIsChooserOpen(false)}
        watchlistSymbols={watchlistSymbols}
        onAddToWatchlist={onAddToWatchlist}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
        onSelectSymbol={onSelectSymbol}
      />
    </div>
  );
});

export default WatchlistTable;
