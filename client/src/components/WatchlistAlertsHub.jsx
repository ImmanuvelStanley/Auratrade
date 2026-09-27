import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck,
  Bookmark,
  Bell,
  Plus,
  Search,
  Eye,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Globe,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { WatchlistTable } from './WatchlistTable';
import { AlertManager } from './AlertManager';
import { WatchlistCompanyChooserModal } from './WatchlistCompanyChooserModal';

export const WatchlistAlertsHub = React.memo(function WatchlistAlertsHub({
  watchlistSymbols = [],
  activeSymbol,
  alerts = [],
  onSelectSymbol,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onToggleAlert,
  onDeleteAlert,
  onOpenCreateAlertModal,
  onOpenTradeModal,
  initialViewMode = 'dual'
}) {
  const { quotes } = useSocket();
  const [viewMode, setViewMode] = useState(initialViewMode); // 'dual' | 'watchlist' | 'alerts'
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const activeAlertsCount = useMemo(() => {
    return alerts.filter(a => a.status === 'ACTIVE').length;
  }, [alerts]);

  const triggeredAlertsCount = useMemo(() => {
    return alerts.filter(a => a.status === 'TRIGGERED').length;
  }, [alerts]);

  // Overall watchlist market stats
  const watchlistStats = useMemo(() => {
    let gainers = 0;
    let losers = 0;
    watchlistSymbols.forEach(sym => {
      const q = quotes[sym];
      if (q && q.change !== undefined) {
        if (q.change >= 0) gainers++;
        else losers++;
      }
    });
    return { gainers, losers, total: watchlistSymbols.length };
  }, [watchlistSymbols, quotes]);

  return (
    <div className="motion-entry perf-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Institutional Hero Banner & Radar Control Header */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'var(--profile-hero-bg)',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Background Accents */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '20%',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          {/* Left Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)'
              }}
            >
              <BookmarkCheck size={24} style={{ color: 'var(--accent-cyan)' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Watchlist &amp; Price Alerts Radar
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)'
                  }}
                >
                  Dual Split View Ready
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Track high-conviction market leaders, customize triggers, and synchronize real-time alerts across all asset desks.
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsChooserOpen(true)}
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
              title="Browse 160+ companies across US, NSE India, Commodities, and Crypto"
            >
              <Globe size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>Browse Markets</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenCreateAlertModal && onOpenCreateAlertModal(activeSymbol)}
              style={{
                padding: '0.5rem 1.05rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-indigo) 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                cursor: 'pointer'
              }}
              title="Set a new automated price alert on any asset"
            >
              <Bell size={15} />
              <span>+ Set Price Alert</span>
            </button>
          </div>
        </div>

        {/* Quick Institutional Stats Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          {/* Watched Assets */}
          <div
            style={{
              background: 'var(--bg-input)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Watched Assets
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {watchlistSymbols.length}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                Equities & Bullion
              </span>
            </div>
          </div>

          {/* Watchlist Breadth (Gainers / Losers) */}
          <div
            style={{
              background: 'var(--bg-input)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Watchlist Sentiment
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem' }}>
              <span className="font-mono text-bull" style={{ fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <ArrowUpRight size={14} /> {watchlistStats.gainers} Bull
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
              <span className="font-mono text-bear" style={{ fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <ArrowDownRight size={14} /> {watchlistStats.losers} Bear
              </span>
            </div>
          </div>

          {/* Active Price Alerts */}
          <div
            style={{
              background: activeAlertsCount > 0 ? 'var(--status-active-bg)' : 'var(--bg-input)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: activeAlertsCount > 0 ? '1px solid var(--status-active-border)' : '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: activeAlertsCount > 0 ? 'var(--status-active-color)' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Server Alerts
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="font-mono text-active" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                {activeAlertsCount}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Armed &amp; Monitoring
              </span>
            </div>
          </div>

          {/* Triggered Breaches */}
          <div
            style={{
              background: triggeredAlertsCount > 0 ? 'var(--status-triggered-bg)' : 'var(--bg-input)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: triggeredAlertsCount > 0 ? '1px solid var(--status-triggered-border)' : '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: '0.7rem', color: triggeredAlertsCount > 0 ? 'var(--status-triggered-color)' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Recent Breaches
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="font-mono text-triggered" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                {triggeredAlertsCount}
              </span>
              <span style={{ fontSize: '0.72rem', color: triggeredAlertsCount > 0 ? 'var(--status-triggered-color)' : 'var(--text-muted)' }}>
                {triggeredAlertsCount > 0 ? 'Triggered events' : 'Zero breaches'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-View Mode Switcher Strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        {/* Segmented View Pills */}
        <div className="segmented-control">
          <button
            type="button"
            className={`segmented-tab-btn ${viewMode === 'dual' ? 'active' : ''}`}
            onClick={() => setViewMode('dual')}
          >
            <Layers size={14} /> Split Radar (Dual View)
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${viewMode === 'watchlist' ? 'active' : ''}`}
            onClick={() => setViewMode('watchlist')}
          >
            <Bookmark size={14} /> Live Watchlist ({watchlistSymbols.length})
          </button>
          <button
            type="button"
            className={`segmented-tab-btn ${viewMode === 'alerts' ? 'active' : ''}`}
            onClick={() => setViewMode('alerts')}
          >
            <Bell size={14} /> Price Alerts ({alerts.length})
          </button>
        </div>

        {/* Quick Helper Badge */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={13} style={{ color: 'var(--warning-amber)' }} />
          <span>Click the bell on any watched stock to arm an instant price alert</span>
        </div>
      </div>

      {/* Content Rendering based on ViewMode */}
      {viewMode === 'dual' && (
        <div
          className="watchlist-alerts-dual-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '1.25rem',
            alignItems: 'stretch',
            width: '100%'
          }}
        >
          {/* Watchlist Panel */}
          <div style={{ minWidth: 0, height: '100%' }}>
            <WatchlistTable
              watchlistSymbols={watchlistSymbols}
              activeSymbol={activeSymbol}
              compact={false}
              isDualMode={true}
              alerts={alerts}
              onSelectSymbol={onSelectSymbol}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
              onOpenAlertModal={onOpenCreateAlertModal}
            />
          </div>

          {/* Price Alerts Panel */}
          <div style={{ minWidth: 0, height: '100%' }}>
            <AlertManager
              alerts={alerts}
              watchlistSymbols={watchlistSymbols}
              isDualMode={true}
              onToggleAlert={onToggleAlert}
              onDeleteAlert={onDeleteAlert}
              onOpenCreateModal={onOpenCreateAlertModal}
              onAddToWatchlist={onAddToWatchlist}
              onSelectSymbol={onSelectSymbol}
            />
          </div>
        </div>
      )}

      {viewMode === 'watchlist' && (
        <div>
          <WatchlistTable
            watchlistSymbols={watchlistSymbols}
            activeSymbol={activeSymbol}
            compact={false}
            alerts={alerts}
            onSelectSymbol={onSelectSymbol}
            onAddToWatchlist={onAddToWatchlist}
            onRemoveFromWatchlist={onRemoveFromWatchlist}
            onOpenAlertModal={onOpenCreateAlertModal}
          />
        </div>
      )}

      {viewMode === 'alerts' && (
        <div>
          <AlertManager
            alerts={alerts}
            watchlistSymbols={watchlistSymbols}
            onToggleAlert={onToggleAlert}
            onDeleteAlert={onDeleteAlert}
            onOpenCreateModal={onOpenCreateAlertModal}
            onAddToWatchlist={onAddToWatchlist}
            onSelectSymbol={onSelectSymbol}
          />
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

export default WatchlistAlertsHub;
