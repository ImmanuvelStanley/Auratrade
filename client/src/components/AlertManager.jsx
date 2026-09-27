import React, { useState, useMemo } from 'react';
import { Bell, Trash2, Power, AlertTriangle, CheckCircle, RefreshCw, BookmarkCheck, Bookmark, Plus, Search } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function AlertManager({
  alerts = [],
  watchlistSymbols = [],
  isDualMode = false,
  onToggleAlert,
  onDeleteAlert,
  onOpenCreateModal,
  onAddToWatchlist,
  onSelectSymbol,
  style = {}
}) {
  const { quotes } = useSocket();
  const [searchFilter, setSearchFilter] = useState('');

  const filteredAlerts = useMemo(() => {
    if (!searchFilter.trim()) return alerts;
    const q = searchFilter.trim().toUpperCase();
    return alerts.filter(a => a.symbol.toUpperCase().includes(q));
  }, [alerts, searchFilter]);

  const cellPadding = isDualMode ? '0.65rem 0.8rem' : '0.9rem 1rem';

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
          <Bell size={17} style={{ color: 'var(--warning-amber)' }} />
          <span>Price Alerts</span>
          <span
            className="badge-pill"
            style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.45rem',
              background: 'rgba(245, 158, 11, 0.12)',
              color: 'var(--warning-amber)',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}
          >
            {alerts.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {alerts.length > 3 && (
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-field font-mono"
                placeholder="Filter..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: isDualMode ? '85px' : '110px',
                  height: '30px',
                  padding: '0.25rem 0.5rem 0.25rem 1.45rem',
                  fontSize: '0.75rem',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={11} style={{ position: 'absolute', left: '0.45rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => onOpenCreateModal()}
            style={{
              height: '30px',
              padding: '0 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              boxSizing: 'border-box'
            }}
          >
            + New Alert
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
              <th style={{ padding: cellPadding, width: isDualMode ? '28%' : '20%' }}>Symbol</th>
              <th style={{ padding: cellPadding, width: isDualMode ? '22%' : '18%' }}>{isDualMode ? 'Trigger' : 'Condition'}</th>
              {!isDualMode && <th style={{ padding: cellPadding, width: '15%' }}>Target Price</th>}
              <th style={{ padding: cellPadding, width: isDualMode ? '20%' : '15%' }}>Live Price</th>
              <th style={{ padding: cellPadding, width: isDualMode ? '18%' : '14%' }}>Status</th>
              {!isDualMode && <th style={{ padding: cellPadding, width: '10%' }}>Cooldown</th>}
              <th style={{ textAlign: 'right', padding: cellPadding, width: isDualMode ? '12%' : '8%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={isDualMode ? 5 : 7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Bell size={28} style={{ margin: '0 auto 0.65rem auto', opacity: 0.4, color: 'var(--warning-amber)' }} />
                  <p style={{ fontSize: '0.85rem', margin: '0 0 0.35rem 0' }}>
                    {searchFilter ? 'No alerts match your search.' : 'No active price alerts.'}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    Click <strong>+ New Alert</strong> or the <strong>+ Alert</strong> button on any stock.
                  </p>
                </td>
              </tr>
            ) : (
              filteredAlerts.map((a) => {
                const liveQuote = quotes[a.symbol];
                const livePrice = liveQuote?.price;

                const isTriggered = a.status === 'TRIGGERED';
                const isActive = a.status === 'ACTIVE';
                const isWatched = watchlistSymbols.includes(a.symbol);

                return (
                  <tr key={a.id} style={{ transition: 'background 0.15s ease' }}>
                    {/* Symbol & Watched Badge */}
                    <td style={{ padding: cellPadding, width: isDualMode ? '28%' : undefined }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap' }}>
                        <span
                          className="font-mono"
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            fontSize: isDualMode ? '0.82rem' : '0.9rem',
                            cursor: onSelectSymbol ? 'pointer' : 'default'
                          }}
                          onClick={() => onSelectSymbol && onSelectSymbol(a.symbol)}
                          title={onSelectSymbol ? `Select ${a.symbol} on workstation` : ''}
                        >
                          {a.symbol}
                        </span>

                        {isWatched ? (
                          <span
                            style={{
                              fontSize: '0.62rem',
                              color: 'var(--accent-cyan)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.15rem',
                              background: 'rgba(6, 182, 212, 0.1)',
                              padding: '0.1rem 0.3rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid rgba(6, 182, 212, 0.25)',
                              whiteSpace: 'nowrap'
                            }}
                            title="In your Live Watchlist"
                          >
                            <BookmarkCheck size={9} /> Watched
                          </span>
                        ) : onAddToWatchlist ? (
                          <button
                            type="button"
                            className="btn-icon"
                            style={{
                              padding: '0.1rem 0.3rem',
                              fontSize: '0.62rem',
                              color: 'var(--text-muted)',
                              border: '1px dashed rgba(255, 255, 255, 0.15)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.15rem',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => onAddToWatchlist(a.symbol)}
                            title={`Add ${a.symbol} to Watchlist`}
                          >
                            <Plus size={9} /> Watch
                          </button>
                        ) : null}
                      </div>
                    </td>

                    {/* Trigger (Dual Mode) or Condition (Full Mode) */}
                    <td style={{ padding: cellPadding, width: isDualMode ? '22%' : undefined }}>
                      {isDualMode ? (
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            background: a.condition === 'ABOVE' ? 'var(--bull-green-bg)' : 'var(--bear-red-bg)',
                            color: a.condition === 'ABOVE' ? 'var(--bull-green)' : 'var(--bear-red)',
                            fontFamily: 'monospace',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title={`Trigger: Price ${a.condition === 'ABOVE' ? 'rises above or equals (≥)' : 'drops below or equals (≤)'} $${a.targetPrice?.toFixed(2)}`}
                        >
                          {a.condition === 'ABOVE' ? '≥' : '≤'} ${a.targetPrice?.toFixed(2)}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: a.condition === 'ABOVE' ? 'var(--bull-green-bg)' : 'var(--bear-red-bg)',
                            color: a.condition === 'ABOVE' ? 'var(--bull-green)' : 'var(--bear-red)'
                          }}
                        >
                          {a.condition === 'ABOVE' ? 'Rises Above (≥)' : 'Drops Below (≤)'}
                        </span>
                      )}
                    </td>

                    {/* Target Price (Full Mode only) */}
                    {!isDualMode && (
                      <td style={{ padding: cellPadding }}>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ${a.targetPrice?.toFixed(2)}
                        </span>
                      </td>
                    )}

                    {/* Live Price */}
                    <td style={{ padding: cellPadding, width: isDualMode ? '20%' : undefined }}>
                      <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: isDualMode ? '0.82rem' : '0.875rem' }}>
                        ${livePrice ? livePrice.toFixed(2) : '--'}
                      </span>
                    </td>

                    {/* Status (+ Cooldown in Dual Mode) */}
                    <td style={{ padding: cellPadding, width: isDualMode ? '18%' : undefined }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span
                          className={`status-pill ${isTriggered ? 'status-triggered' : isActive ? 'status-active' : 'status-disabled'}`}
                          data-status={isTriggered ? 'TRIGGERED' : a.status}
                          style={{
                            display: 'inline-flex',
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            letterSpacing: '0.03em',
                            padding: '0.18rem 0.48rem',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          title={isTriggered ? 'Alert was triggered by market price breach' : 'Alert active and actively monitoring'}
                        >
                          {isTriggered ? 'TRIGGERED' : a.status}
                        </span>
                        {isDualMode && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }} title={`Cooldown: ${a.cooldownMinutes || 30} minutes`}>
                            {a.cooldownMinutes || 30}m
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cooldown (Full Mode only) */}
                    {!isDualMode && (
                      <td style={{ padding: cellPadding }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {a.cooldownMinutes || 30}m
                        </span>
                      </td>
                    )}

                    {/* Actions Column (Power + Delete) */}
                    <td style={{ textAlign: 'right', padding: cellPadding, width: isDualMode ? '12%' : undefined }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-icon"
                          style={{ padding: '0.3rem' }}
                          title={isActive ? 'Disable Alert' : 'Re-arm / Enable Alert'}
                          onClick={() => onToggleAlert(a.id)}
                        >
                          <Power size={13} style={{ color: isActive ? 'var(--bull-green)' : 'var(--text-muted)' }} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ padding: '0.3rem' }}
                          title="Delete Alert"
                          onClick={() => onDeleteAlert(a.id)}
                        >
                          <Trash2 size={13} style={{ color: 'var(--text-muted)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning-amber)', display: 'inline-block' }} />
            {alerts.length} Server Triggers Configured
          </span>
          <span style={{ fontSize: '0.7rem' }}>24/7 Tick Breach Surveillance</span>
        </div>
      )}
    </div>
  );
}
