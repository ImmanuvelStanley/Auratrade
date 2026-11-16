import React, { useEffect, useRef, useState } from 'react';
import { CheckCheck, BellOff, X, RefreshCw, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { useSocketNotifications } from '../context/SocketContext';

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

export function NotificationCenter({ onClose, onSelectSymbol }) {
  const {
    notifications,
    clearNotifications,
    dismissNotification,
    refreshMarketNotifications
  } = useSocketNotifications();
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'MARKET' | 'ALERTS'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const menuRef = useRef(null);

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
        if (onClose) onClose();
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
  }, [onClose]);

  const handleRefreshFeed = async (e) => {
    e.stopPropagation();
    if (!refreshMarketNotifications || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshMarketNotifications();
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  const isMarketItem = (n) => n.kind === 'market' || n.kind === 'news' || String(n.id || '').startsWith('mkt_');
  const marketCount = notifications.filter(isMarketItem).length;
  const personalCount = notifications.length - marketCount;

  const visibleNotifications = notifications.filter((n) => {
    if (filterTab === 'MARKET') return isMarketItem(n);
    if (filterTab === 'ALERTS') return !isMarketItem(n);
    return true;
  });

  return (
    <div ref={menuRef} className="notification-menu" style={{ width: 'min(410px, calc(100vw - 24px))' }}>
      <div className="notification-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.86rem' }}>
          <span>Market &amp; Alert Feed</span>
          <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
            ({notifications.length})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            onClick={handleRefreshFeed}
            disabled={isRefreshing}
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.32)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--bull-green)',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.48rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="Fetch latest live market movers, indices & headlines"
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin' : ''} />
            <span>Live Sync</span>
          </button>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
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

      {/* Category Filter Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.45rem 0.7rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.25)'
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
              onClick={() => setFilterTab(tab.id)}
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
                : 'Click Live Sync above to pull the latest market movers and breaking headlines.'}
            </p>
          </div>
        ) : (
          visibleNotifications.map((n, idx) => {
            const notifId = n.id || n._id || `notif_${idx}`;
            const cat = (n.category || (n.orderId ? 'ORDER' : isMarketItem(n) ? 'MOVER' : 'TRIGGERED')).toUpperCase();
            const pillStyle = CATEGORY_STYLES[cat] || CATEGORY_STYLES.MACRO;
            const cs = n.currencySymbol || '$';
            const hasPct = n.changePercent !== undefined && n.changePercent !== null;
            const pctVal = Number(n.changePercent || 0);
            const isPositive = pctVal >= 0;

            return (
              <div
                key={notifId}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {n.symbol && (
                      <button
                        type="button"
                        onClick={() => {
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

                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.72rem', marginTop: '0.15rem' }}>
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
                    {!isMarketItem(n) && n.targetPrice !== undefined && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        • Target: {cs}{Number(n.targetPrice).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {n.url && (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
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
                      Read News <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
