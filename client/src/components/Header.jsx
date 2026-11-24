import React, { useState } from 'react';
import { Bell, Menu, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { useSocket, useSocketNotifications } from '../context/SocketContext';
import { NotificationCenter } from './NotificationCenter';
import { BrandLogo } from './BrandLogo';

export const Header = React.memo(function Header({
  onToggleSidebar,
  onSelectSymbol,
  onGoHome,
  onNavigateTab
}) {
  const { quotes } = useSocket();
  const { notifications, markAllNotificationsRead } = useSocketNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next && unreadCount > 0 && markAllNotificationsRead) {
        markAllNotificationsRead();
      }
      return next;
    });
  };

  // Institutional Multi-Market Live Benchmarks
  const sp500Quote = quotes['^GSPC'] || quotes['SPX'] || quotes['AAPL'];
  const niftyQuote = quotes['^NSEI'] || quotes['NIFTY 50'] || quotes['RELIANCE.NS'];
  const goldQuote = quotes['XAU'] || quotes['GOLD'] || quotes['GOLDBEES.NS'];
  const btcQuote = quotes['BTC-USD'] || quotes['BTC'] || quotes['NVDA'];

  const marketBenchmarks = [
    {
      label: 'S&P 500',
      price: quotes['^GSPC']?.price || 5910.45,
      changePercent: quotes['^GSPC']?.changePercent ?? 0.38,
      tab: 'global-indices',
      prefix: '$',
      decimals: 1
    },
    {
      label: 'NIFTY 50',
      price: quotes['^NSEI']?.price || 23518.50,
      changePercent: quotes['^NSEI']?.changePercent ?? -0.22,
      tab: 'nse-india',
      prefix: '₹',
      decimals: 1
    },
    {
      label: 'GOLD (10g)',
      price: quotes['XAU']?.price ? quotes['XAU'].price * 10 : 129379,
      changePercent: quotes['XAU']?.changePercent ?? 0.85,
      tab: 'gold-silver',
      prefix: '₹',
      decimals: 0
    },
    {
      label: 'BITCOIN',
      price: quotes['BTC-USD']?.price || 96420,
      changePercent: quotes['BTC-USD']?.changePercent ?? 1.45,
      tab: 'all-markets',
      prefix: '$',
      decimals: 0
    }
  ];

  return (
    <header className="navbar">
      {/* Brand Modern Geometric Logo (Always cleanly anchored top-left) */}
      <BrandLogo onClick={onGoHome} title="Return to homepage" />

      {/* Institutional Live Multi-Market Ticker Ribbon (Center) */}
      <div className="header-market-pulse-bar" aria-label="Global Live Market Pulse">
        {marketBenchmarks.map((bm) => {
          const isBull = (bm.changePercent ?? 0) >= 0;
          return (
            <button
              key={bm.label}
              type="button"
              className="header-pulse-chip"
              onClick={() => onNavigateTab && onNavigateTab(bm.tab)}
              title={`Click to open ${bm.label} desk`}
            >
              <span className="header-pulse-label">{bm.label}</span>
              <span className="header-pulse-price font-mono">
                {bm.prefix}{Number(bm.price).toLocaleString('en-US', { minimumFractionDigits: bm.decimals, maximumFractionDigits: bm.decimals })}
              </span>
              <span className={`header-pulse-chg font-mono ${isBull ? 'text-bull' : 'text-bear'}`}>
                {isBull ? '+' : ''}{Number(bm.changePercent).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation Actions */}
      <div className="nav-actions">
        {/* Quick Utility Control Icons (Notifications, Mobile Topics Drawer) */}
        <div className="header-controls-cluster">
          {/* Notification Bell */}
          <div style={{ position: 'relative' }} className="header-notification-container">
            <button
              type="button"
              className={`header-bell-btn${unreadCount > 0 ? ' has-unread' : ''}${showNotifications ? ' is-open' : ''}`}
              title="Market Intelligence, News & Triggered Alerts"
              aria-label={`Notifications (${unreadCount} unread)`}
              aria-expanded={showNotifications}
              onClick={handleToggleNotifications}
              id="header-notification-bell-btn"
            >
              <Bell size={18} strokeWidth={2.2} className="header-bell-icon" />
              {unreadCount > 0 && (
                <span className="notification-badge" aria-hidden="true">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                {/* Dismissible Invisible Backdrop for Empty Area Clicking */}
                <div
                  className="notification-backdrop"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2990,
                    background: 'transparent',
                    cursor: 'default'
                  }}
                />
                <NotificationCenter
                  onClose={() => setShowNotifications(false)}
                  onSelectSymbol={onSelectSymbol}
                />
              </>
            )}
          </div>

          {/* Mobile & Tablet Sidebar Drawer Button (Cleanly grouped on top-right controls) */}
          {onToggleSidebar && (
            <button
              type="button"
              className="btn-icon header-mobile-menu-btn"
              onClick={onToggleSidebar}
              title="Open Topics Menu"
              aria-label="Open Topics Navigation Drawer"
            >
              <Menu size={17} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
});
