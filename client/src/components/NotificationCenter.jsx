import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCheck,
  BellOff,
  X,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Info,
  BarChart2
} from 'lucide-react';
import { useSocketNotifications, useLiveTickerActions } from '../context/SocketContext';

const CATEGORY_STYLES = {
  NEWS: { bg: 'rgba(99, 102, 241, 0.16)', border: 'rgba(99, 102, 241, 0.4)', color: '#818cf8' },
  MOVER: { bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.4)', color: 'var(--bull-green)' },
  PULLBACK: { bg: 'rgba(244, 63, 94, 0.16)', border: 'rgba(244, 63, 94, 0.4)', color: 'var(--bear-red)' },
  MACRO: { bg: 'rgba(6, 182, 212, 0.16)', border: 'rgba(6, 182, 212, 0.4)', color: 'var(--accent-cyan)' },
  NSE: { bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.4)', color: 'var(--warning-amber)' },
  BULLION: { bg: 'rgba(234, 179, 8, 0.16)', border: 'rgba(234, 179, 8, 0.4)', color: '#eab308' },
  SIGNAL: { bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(16, 185, 129, 0.4)', color: 'var(--bull-green)' },
  RELATED: { bg: 'rgba(56, 189, 248, 0.16)', border: 'rgba(56, 189, 248, 0.42)', color: '#38bdf8' },
  'LIVE FEED': { bg: 'rgba(16, 185, 129, 0.18)', border: 'rgba(16, 185, 129, 0.45)', color: 'var(--bull-green)' },
  ORDER: { bg: 'rgba(6, 182, 212, 0.18)', border: 'rgba(6, 182, 212, 0.45)', color: 'var(--accent-cyan)' },
  TRIGGERED: { bg: 'rgba(245, 158, 11, 0.18)', border: 'rgba(245, 158, 11, 0.45)', color: 'var(--warning-amber)' }
};

function buildFallbackDetails(n, liveQuote) {
  const cs = n.currencySymbol || '$';
  const cat = (n.category || (n.orderId ? 'ORDER' : 'TRIGGERED')).toUpperCase();
  const isOrder = cat === 'ORDER' || Boolean(n.orderId);
  const isTriggered = cat === 'TRIGGERED' || Boolean(n.alertId);

  const metrics = [];
  if (n.symbol) metrics.push({ label: 'Symbol', value: n.symbol });
  if (n.price !== undefined) {
    metrics.push({
      label: isOrder ? 'Fill Price' : isTriggered ? 'Trigger Price' : 'Snapshot Price',
      value: `${cs}${Number(n.price).toFixed(2)}`
    });
  }
  if (n.targetPrice !== undefined) {
    metrics.push({ label: 'Target Level', value: `${cs}${Number(n.targetPrice).toFixed(2)}` });
  }
  if (liveQuote?.price) {
    const pct = Number(liveQuote.changePercent || 0);
    metrics.push({
      label: 'Current Live',
      value: `${cs}${Number(liveQuote.price).toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`
    });
  }
  if (liveQuote?.dayLow && liveQuote?.dayHigh) {
    metrics.push({
      label: 'Live Day Range',
      value: `${cs}${Number(liveQuote.dayLow).toFixed(2)} – ${cs}${Number(liveQuote.dayHigh).toFixed(2)}`
    });
  }

  let categoryLabel = 'Market Intelligence Notification';
  let whatItMeans = 'Real-time market update streamed by AuraTrade signal monitoring.';
  if (isOrder) {
    categoryLabel = 'Automated Paper Order Execution';
    whatItMeans = `Your pending conditional order (Limit / Stop-Loss / Take-Profit) for ${n.symbol || 'this security'} reached its target trigger price and settled into your paper trading portfolio.`;
  } else if (isTriggered) {
    categoryLabel = 'Custom Price Target Alert Breach';
    whatItMeans = `${n.symbol || 'Your tracked asset'} crossed the target threshold (${n.condition || 'TARGET'}) you configured in Price Alerts.`;
  } else if (cat === 'LIVE FEED') {
    categoryLabel = 'Live Streaming Spike / Webhook Event';
    whatItMeans = `Significant live tick velocity or external webhook update was ingested for ${n.symbol || 'this asset'}.`;
  }

  return { categoryLabel, whatItMeans, metrics };
}

export function NotificationCenter({ onClose, onSelectSymbol }) {
  const {
    notifications,
    clearNotifications,
    dismissNotification,
    refreshMarketNotifications
  } = useSocketNotifications();
  const { getQuote } = useLiveTickerActions();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'MARKET' | 'ALERTS'
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!refreshMarketNotifications) return undefined;
    refreshMarketNotifications();
    const autoSyncTimer = setInterval(() => {
      refreshMarketNotifications();
    }, 15000);
    return () => clearInterval(autoSyncTimer);
  }, [refreshMarketNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        const bellBtn = document.getElementById('header-notification-bell-btn');
        if (bellBtn && bellBtn.contains(e.target)) {
          return;
        }
        if (onClose) onClose();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (selectedNotifId) {
          setSelectedNotifId(null);
        } else if (onClose) {
          onClose();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, selectedNotifId]);

  const getNotifKey = (n, idx) => n.id || n._id || `notif_${idx}`;
  const isMarketItem = (n) => n.kind === 'market' || n.kind === 'news' || String(n.id || '').startsWith('mkt_');

  const marketCount = notifications.filter(isMarketItem).length;
  const personalCount = notifications.length - marketCount;

  const visibleNotifications = notifications.filter((n) => {
    if (filterTab === 'MARKET') return isMarketItem(n);
    if (filterTab === 'ALERTS') return !isMarketItem(n);
    return true;
  });

  const selectedIndex = selectedNotifId
    ? visibleNotifications.findIndex((n, idx) => getNotifKey(n, idx) === selectedNotifId)
    : -1;
  const selectedNotification = selectedIndex >= 0 ? visibleNotifications[selectedIndex] : null;

  return (
    <div ref={menuRef} className="notification-menu" style={{ width: 'min(425px, calc(100vw - 24px))' }}>
      <div className="notification-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.86rem' }}>
          {selectedNotification ? (
            <button
              type="button"
              onClick={() => setSelectedNotifId(null)}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '6px',
                color: 'var(--accent-cyan)',
                padding: '0.2rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <ArrowLeft size={13} /> Back to Feed
            </button>
          ) : (
            <>
              <span>Market &amp; Alert Feed</span>
              <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                ({notifications.length})
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {selectedNotification ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                disabled={selectedIndex <= 0}
                onClick={() => {
                  const prev = visibleNotifications[selectedIndex - 1];
                  if (prev) setSelectedNotifId(getNotifKey(prev, selectedIndex - 1));
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '5px',
                  color: selectedIndex <= 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  padding: '0.2rem 0.35rem',
                  cursor: selectedIndex <= 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                title="Previous message"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0 0.2rem' }}>
                {selectedIndex + 1}/{visibleNotifications.length}
              </span>
              <button
                type="button"
                disabled={selectedIndex >= visibleNotifications.length - 1}
                onClick={() => {
                  const next = visibleNotifications[selectedIndex + 1];
                  if (next) setSelectedNotifId(getNotifKey(next, selectedIndex + 1));
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '5px',
                  color: selectedIndex >= visibleNotifications.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  padding: '0.2rem 0.35rem',
                  cursor: selectedIndex >= visibleNotifications.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                title="Next message"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotifId(null);
                    clearNotifications();
                  }}
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.48rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.22rem'
                  }}
                  title="Clear all notifications"
                >
                  <CheckCheck size={13} /> Clear
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '4px'
            }}
            title="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Category Filter Strip (hidden while inspecting a chosen message for clean reading) */}
      {!selectedNotification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.7rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.25)',
            flexWrap: 'wrap'
          }}
        >
          {[
            { id: 'ALL', label: `All (${notifications.length})` },
            { id: 'MARKET', label: `Market & News (${marketCount})` },
            { id: 'ALERTS', label: `Alerts & Orders (${personalCount})` }
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterTab(tab.id);
                  setSelectedNotifId(null);
                }}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  fontSize: '0.69rem',
                  fontWeight: 700,
                  border: active ? '1px solid rgba(56, 189, 248, 0.55)' : '1px solid var(--border-subtle)',
                  background: active ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                  color: active ? '#38bdf8' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content: Selected Message Detail Inspector OR Clickable Message Feed */}
      {selectedNotification ? (() => {
        const n = selectedNotification;
        const cat = (n.category || (n.orderId ? 'ORDER' : isMarketItem(n) ? 'MOVER' : 'TRIGGERED')).toUpperCase();
        const pillStyle = CATEGORY_STYLES[cat] || CATEGORY_STYLES.MACRO;
        const cs = n.currencySymbol || '$';
        const liveQuote = n.symbol && getQuote ? getQuote(n.symbol) : null;
        const details = n.details || buildFallbackDetails(n, liveQuote);
        const pctVal = n.changePercent !== undefined ? Number(n.changePercent) : (liveQuote?.changePercent !== undefined ? Number(liveQuote.changePercent) : null);
        const isPositive = (pctVal ?? 0) >= 0;
        const displayPrice = n.price !== undefined ? Number(n.price) : (liveQuote?.price ? Number(liveQuote.price) : null);

        return (
          <div
            className="notification-detail-view"
            style={{
              maxHeight: '420px',
              overflowY: 'auto',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.7rem'
            }}
          >
            {/* Header Meta Strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    background: pillStyle.bg,
                    border: `1px solid ${pillStyle.border}`,
                    color: pillStyle.color,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {cat}
                </span>
                {n.symbol && (
                  <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                    {n.symbol}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>
                {new Date(n.timestamp || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Title & Live Value Snapshot */}
            <div
              style={{
                padding: '0.75rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {n.title || `${n.symbol || 'Market'} Alert`}
              </div>

              {(displayPrice !== null || pctVal !== null) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {displayPrice !== null && (
                    <span className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {cs}{displayPrice.toFixed(2)}
                    </span>
                  )}
                  {pctVal !== null && (
                    <span
                      className={`font-mono ${isPositive ? 'text-bull' : 'text-bear'}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.42rem',
                        borderRadius: '4px',
                        background: isPositive ? 'var(--bull-green-bg)' : 'var(--bear-red-bg)'
                      }}
                    >
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isPositive ? '+' : ''}{pctVal.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}

              <p style={{ fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                {n.message}
              </p>
            </div>

            {/* What This Message Is About */}
            <div
              style={{
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.07)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.32rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.71rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Info size={13} />
                <span>{details.categoryLabel || 'Additional Context'}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.48, margin: 0 }}>
                {details.whatItMeans}
              </p>
              {details.summary && details.summary !== n.title && details.summary !== n.message && (
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.42, margin: '0.2rem 0 0 0' }}>
                  {details.summary}
                </p>
              )}
            </div>

            {/* Supporting Telemetry Grid */}
            {Array.isArray(details.metrics) && details.metrics.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem' }}>
                {details.metrics.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {m.label}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action Footer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingTop: '0.15rem' }}>
              {n.symbol && onSelectSymbol && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onSelectSymbol(n.symbol);
                    if (onClose) onClose();
                  }}
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '0.45rem 0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <BarChart2 size={13} />
                  <span>Open {n.symbol} Chart</span>
                </button>
              )}

              {n.url && (
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.74rem',
                    padding: '0.45rem 0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    textDecoration: 'none',
                    color: 'var(--accent-cyan)'
                  }}
                >
                  <span>Read News</span>
                  <ExternalLink size={12} />
                </a>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const idToRemove = getNotifKey(n, selectedIndex);
                  setSelectedNotifId(null);
                  dismissNotification(idToRemove);
                }}
                style={{ fontSize: '0.73rem', padding: '0.45rem 0.65rem', color: 'var(--bear-red)' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })() : (
        <div
          onClick={() => {
            if (visibleNotifications.length === 0 && notifications.length === 0 && onClose) {
              onClose();
            }
          }}
          style={{
            maxHeight: '390px',
            overflowY: 'auto',
            padding: '0.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            cursor: visibleNotifications.length === 0 && notifications.length === 0 ? 'pointer' : 'default'
          }}
        >
          {visibleNotifications.length === 0 ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.84rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <BellOff size={28} style={{ margin: '0 auto 0.55rem auto', opacity: 0.45, color: 'var(--accent-cyan)' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                {filterTab === 'ALERTS'
                  ? 'No personal target alerts or limit orders triggered yet'
                  : 'No market notifications right now'}
              </p>
              <p style={{ fontSize: '0.74rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                {filterTab === 'ALERTS'
                  ? 'Set target price alerts or bracket orders to get notified immediately.'
                  : 'Live market movers and breaking headlines sync automatically as updates arrive.'}
              </p>
            </div>
          ) : (
            visibleNotifications.map((n, idx) => {
              const notifId = getNotifKey(n, idx);
              const cat = (n.category || (n.orderId ? 'ORDER' : isMarketItem(n) ? 'MOVER' : 'TRIGGERED')).toUpperCase();
              const pillStyle = CATEGORY_STYLES[cat] || CATEGORY_STYLES.MACRO;
              const cs = n.currencySymbol || '$';
              const hasPct = n.changePercent !== undefined && n.changePercent !== null;
              const pctVal = Number(n.changePercent || 0);
              const isPositive = pctVal >= 0;

              return (
                <div
                  key={notifId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedNotifId(notifId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedNotifId(notifId);
                    }
                  }}
                  className="notification-feed-card"
                  style={{
                    padding: '0.72rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.32rem',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'border-color 0.16s ease, background 0.16s ease, transform 0.14s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                  title="Click to inspect full details about this message"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {n.symbol && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectSymbol) onSelectSymbol(n.symbol);
                            if (onClose) onClose();
                          }}
                          title={`Open ${n.symbol} interactive chart`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            cursor: onSelectSymbol ? 'pointer' : 'default',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            color: 'var(--accent-cyan)',
                            fontSize: '0.84rem',
                            textDecoration: onSelectSymbol ? 'underline' : 'none',
                            textUnderlineOffset: '2px'
                          }}
                        >
                          {n.symbol}
                        </button>
                      )}

                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          padding: '0.08rem 0.38rem',
                          borderRadius: '4px',
                          background: pillStyle.bg,
                          border: `1px solid ${pillStyle.border}`,
                          color: pillStyle.color,
                          letterSpacing: '0.03em',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {cat}
                      </span>

                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        {new Date(n.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(notifId);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '4px'
                      }}
                      title="Dismiss notification"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {n.title && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {n.title}
                    </div>
                  )}

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.71rem', marginTop: '0.15rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {n.price !== undefined && (
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {isMarketItem(n) ? `${cs}${Number(n.price).toFixed(2)}` : `Fill/Breach: ${cs}${Number(n.price).toFixed(2)}`}
                        </span>
                      )}
                      {hasPct && (
                        <span
                          className={`font-mono ${isPositive ? 'text-bull' : 'text-bear'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}
                        >
                          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {isPositive ? '+' : ''}{pctVal.toFixed(2)}%
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      {n.url && (
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          News <ExternalLink size={10} />
                        </a>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.68rem' }}>
                        Details <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
