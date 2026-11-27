import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
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
  BarChart2,
  Sparkles,
  Newspaper,
  Globe,
  Coins,
  Landmark,
  Activity,
  Zap,
  Target
} from 'lucide-react';
import { useSocketNotifications, useLiveTickerActions } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

const DARK_CATEGORY_STYLES = {
  NEWS: { bg: 'rgba(99, 102, 241, 0.16)', border: 'rgba(129, 140, 248, 0.35)', color: '#a5b4fc', icon: Newspaper },
  MOVER: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(52, 211, 153, 0.35)', color: '#34d399', icon: TrendingUp },
  PULLBACK: { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(251, 113, 133, 0.35)', color: '#fb7185', icon: TrendingDown },
  MACRO: { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8', icon: Globe },
  NSE: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(251, 191, 36, 0.35)', color: '#fbbf24', icon: Landmark },
  BULLION: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(250, 204, 21, 0.35)', color: '#facc15', icon: Coins },
  SIGNAL: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(52, 211, 153, 0.35)', color: '#34d399', icon: Sparkles },
  RELATED: { bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)', color: '#7dd3fc', icon: Activity },
  'LIVE FEED': { bg: 'rgba(16, 185, 129, 0.16)', border: 'rgba(52, 211, 153, 0.4)', color: '#34d399', icon: Zap },
  ORDER: { bg: 'rgba(6, 182, 212, 0.16)', border: 'rgba(34, 211, 238, 0.4)', color: '#22d3ee', icon: Target },
  TRIGGERED: { bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24', icon: Bell }
};

const LIGHT_CATEGORY_STYLES = {
  NEWS: { bg: '#eef2ff', border: '#c7d2fe', color: '#4338ca', icon: Newspaper },
  MOVER: { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857', icon: TrendingUp },
  PULLBACK: { bg: '#fff1f2', border: '#fecdd3', color: '#be123c', icon: TrendingDown },
  MACRO: { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1', icon: Globe },
  NSE: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', icon: Landmark },
  BULLION: { bg: '#fefce8', border: '#fef08a', color: '#a16207', icon: Coins },
  SIGNAL: { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857', icon: Sparkles },
  RELATED: { bg: '#f0f9ff', border: '#bae6fd', color: '#0369a1', icon: Activity },
  'LIVE FEED': { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', icon: Zap },
  ORDER: { bg: '#ecfeff', border: '#a5f3fc', color: '#0e7490', icon: Target },
  TRIGGERED: { bg: '#fffbeb', border: '#fcd34d', color: '#b45309', icon: Bell }
};

function formatRelativeTime(ts) {
  const value = ts ? new Date(ts).getTime() : Date.now();
  const diffSec = Math.max(0, Math.floor((Date.now() - value) / 1000));
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  const { theme } = useTheme();
  const isLight = theme === 'light';
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
  const styleMap = isLight ? LIGHT_CATEGORY_STYLES : DARK_CATEGORY_STYLES;

  return (
    <div ref={menuRef} className="notification-menu" role="dialog" aria-label="Activity and Alerts Center">
      {/* Modern Header */}
      <div className="notification-header">
        <div className="notification-header-left">
          {selectedNotification ? (
            <button
              type="button"
              className="notification-back-btn"
              onClick={() => setSelectedNotifId(null)}
            >
              <ArrowLeft size={13} />
              <span>Feed</span>
            </button>
          ) : (
            <div className="notification-title-group">
              <span className="notification-header-icon" aria-hidden="true">
                <Bell size={14} />
              </span>
              <span className="notification-header-title">Activity &amp; Alerts</span>
              <span className="notification-count-pill font-mono">{notifications.length}</span>
            </div>
          )}
        </div>

        <div className="notification-header-actions">
          {selectedNotification ? (
            <div className="notification-stepper">
              <button
                type="button"
                className="notification-stepper-btn"
                disabled={selectedIndex <= 0}
                onClick={() => {
                  const prev = visibleNotifications[selectedIndex - 1];
                  if (prev) setSelectedNotifId(getNotifKey(prev, selectedIndex - 1));
                }}
                title="Previous notification"
                aria-label="Previous notification"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="notification-stepper-count font-mono">
                {selectedIndex + 1} / {visibleNotifications.length}
              </span>
              <button
                type="button"
                className="notification-stepper-btn"
                disabled={selectedIndex >= visibleNotifications.length - 1}
                onClick={() => {
                  const next = visibleNotifications[selectedIndex + 1];
                  if (next) setSelectedNotifId(getNotifKey(next, selectedIndex + 1));
                }}
                title="Next notification"
                aria-label="Next notification"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            notifications.length > 0 && (
              <button
                type="button"
                className="notification-clear-btn"
                onClick={() => {
                  setSelectedNotifId(null);
                  clearNotifications();
                }}
                title="Clear all notifications"
              >
                <CheckCheck size={13} />
                <span>Clear all</span>
              </button>
            )
          )}

          <button
            type="button"
            className="notification-close-btn"
            onClick={onClose}
            title="Close notifications"
            aria-label="Close notifications"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Modern Segmented Tabs Control */}
      {!selectedNotification && (
        <div className="notification-tabs-bar">
          <div className="notification-segmented-tabs" role="tablist" aria-label="Notification filters">
            {[
              { id: 'ALL', label: 'All', count: notifications.length },
              { id: 'MARKET', label: 'Market', count: marketCount },
              { id: 'ALERTS', label: 'Alerts', count: personalCount }
            ].map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`notification-seg-tab ${active ? 'active' : ''}`}
                  onClick={() => {
                    setFilterTab(tab.id);
                    setSelectedNotifId(null);
                  }}
                >
                  <span>{tab.label}</span>
                  <span className="notification-seg-count font-mono">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Inspector View OR Scrollable Activity Feed */}
      {selectedNotification ? (() => {
        const n = selectedNotification;
        const cat = (n.category || (n.orderId ? 'ORDER' : isMarketItem(n) ? 'MOVER' : 'TRIGGERED')).toUpperCase();
        const pillStyle = styleMap[cat] || styleMap.MACRO;
        const CatIcon = pillStyle.icon || Activity;
        const cs = n.currencySymbol || '$';
        const liveQuote = n.symbol && getQuote ? getQuote(n.symbol) : null;
        const details = n.details || buildFallbackDetails(n, liveQuote);
        const pctVal = n.changePercent !== undefined ? Number(n.changePercent) : (liveQuote?.changePercent !== undefined ? Number(liveQuote.changePercent) : null);
        const isPositive = (pctVal ?? 0) >= 0;
        const displayPrice = n.price !== undefined ? Number(n.price) : (liveQuote?.price ? Number(liveQuote.price) : null);

        return (
          <div className="notification-detail-view notification-scroll-area">
            <div className="notification-detail-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span
                  className="notification-cat-pill"
                  style={{
                    background: pillStyle.bg,
                    borderColor: pillStyle.border,
                    color: pillStyle.color
                  }}
                >
                  <CatIcon size={11} />
                  <span>{cat}</span>
                </span>
                {n.symbol && (
                  <span className="notification-ticker-chip font-mono">
                    {n.symbol}
                  </span>
                )}
              </div>
              <span className="notification-time-label">
                {new Date(n.timestamp || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="notification-detail-hero">
              <h4 className="notification-detail-title">
                {n.title || `${n.symbol || 'Market'} Alert`}
              </h4>

              {(displayPrice !== null || pctVal !== null) && (
                <div className="notification-detail-price-row">
                  {displayPrice !== null && (
                    <span className="notification-detail-price font-mono">
                      {cs}{displayPrice.toFixed(2)}
                    </span>
                  )}
                  {pctVal !== null && (
                    <span
                      className={`notification-trend-pill font-mono ${isPositive ? 'is-bull' : 'is-bear'}`}
                    >
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isPositive ? '+' : ''}{pctVal.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}

              <p className="notification-detail-copy">{n.message}</p>
            </div>

            <div className="notification-context-box">
              <div className="notification-context-hdr">
                <Info size={13} />
                <span>{details.categoryLabel || 'Signal Context'}</span>
              </div>
              <p className="notification-context-copy">{details.whatItMeans}</p>
              {details.summary && details.summary !== n.title && details.summary !== n.message && (
                <p className="notification-context-sub">{details.summary}</p>
              )}
            </div>

            {Array.isArray(details.metrics) && details.metrics.length > 0 && (
              <div className="notification-metrics-grid">
                {details.metrics.map((m, mIdx) => (
                  <div key={mIdx} className="notification-metric-cell">
                    <span className="notification-metric-label">{m.label}</span>
                    <span className="notification-metric-val font-mono">{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="notification-detail-footer">
              {n.symbol && onSelectSymbol && (
                <button
                  type="button"
                  className="btn btn-primary notification-primary-action"
                  onClick={() => {
                    onSelectSymbol(n.symbol);
                    if (onClose) onClose();
                  }}
                >
                  <BarChart2 size={14} />
                  <span>Open {n.symbol} Chart</span>
                </button>
              )}

              {n.url && (
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="notification-secondary-link"
                >
                  <span>Read Article</span>
                  <ExternalLink size={12} />
                </a>
              )}

              <button
                type="button"
                className="notification-danger-btn"
                onClick={() => {
                  const idToRemove = getNotifKey(n, selectedIndex);
                  setSelectedNotifId(null);
                  dismissNotification(idToRemove);
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })() : (
        <div
          className="notification-feed-list notification-scroll-area"
          onClick={() => {
            if (visibleNotifications.length === 0 && notifications.length === 0 && onClose) {
              onClose();
            }
          }}
          style={{
            cursor: visibleNotifications.length === 0 && notifications.length === 0 ? 'pointer' : 'default'
          }}
        >
          {visibleNotifications.length === 0 ? (
            <div className="notification-empty-state">
              <div className="notification-empty-icon">
                <BellOff size={22} />
              </div>
              <p className="notification-empty-title">
                {filterTab === 'ALERTS'
                  ? 'No personal target alerts yet'
                  : 'You’re all caught up'}
              </p>
              <p className="notification-empty-sub">
                {filterTab === 'ALERTS'
                  ? 'Set target price alerts or bracket orders to track executions here.'
                  : 'Live market movers and breaking headlines sync automatically as ticks arrive.'}
              </p>
            </div>
          ) : (
            visibleNotifications.map((n, idx) => {
              const notifId = getNotifKey(n, idx);
              const cat = (n.category || (n.orderId ? 'ORDER' : isMarketItem(n) ? 'MOVER' : 'TRIGGERED')).toUpperCase();
              const pillStyle = styleMap[cat] || styleMap.MACRO;
              const CatIcon = pillStyle.icon || Activity;
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
                  style={{ '--notif-accent': pillStyle.color }}
                  title="Click to inspect full details about this message"
                >
                  <div className="notification-card-icon-col">
                    <span
                      className="notification-card-avatar"
                      style={{
                        background: pillStyle.bg,
                        borderColor: pillStyle.border,
                        color: pillStyle.color
                      }}
                    >
                      <CatIcon size={14} />
                    </span>
                  </div>

                  <div className="notification-card-content">
                    <div className="notification-card-top">
                      <div className="notification-card-badges">
                        {n.symbol && (
                          <button
                            type="button"
                            className="notification-ticker-chip font-mono"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectSymbol) onSelectSymbol(n.symbol);
                              if (onClose) onClose();
                            }}
                            title={`Open ${n.symbol} interactive chart`}
                          >
                            {n.symbol}
                          </button>
                        )}

                        <span
                          className="notification-cat-pill"
                          style={{
                            background: pillStyle.bg,
                            borderColor: pillStyle.border,
                            color: pillStyle.color
                          }}
                        >
                          {cat}
                        </span>
                      </div>

                      <div className="notification-card-right-meta">
                        <span className="notification-time-label">
                          {formatRelativeTime(n.timestamp)}
                        </span>
                        <button
                          type="button"
                          className="notification-dismiss-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notifId);
                          }}
                          title="Dismiss notification"
                          aria-label="Dismiss notification"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {n.title && (
                      <div className="notification-card-title">{n.title}</div>
                    )}

                    <p className="notification-card-msg">{n.message}</p>

                    <div className="notification-card-footer">
                      <div className="notification-card-telemetry">
                        {n.price !== undefined && (
                          <span className="notification-card-price font-mono">
                            {isMarketItem(n) ? `${cs}${Number(n.price).toFixed(2)}` : `Fill/Breach: ${cs}${Number(n.price).toFixed(2)}`}
                          </span>
                        )}
                        {hasPct && (
                          <span
                            className={`notification-trend-pill font-mono ${isPositive ? 'is-bull' : 'is-bear'}`}
                          >
                            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isPositive ? '+' : ''}{pctVal.toFixed(2)}%
                          </span>
                        )}
                      </div>

                      <div className="notification-card-links">
                        {n.url && (
                          <a
                            href={n.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="notification-inline-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>News</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                        <span className="notification-inspect-cue">
                          Details <ChevronRight size={12} />
                        </span>
                      </div>
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
