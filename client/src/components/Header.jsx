import React, { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useSocketNotifications } from '../context/SocketContext';
import { NotificationCenter } from './NotificationCenter';
import { BrandLogo } from './BrandLogo';

export const Header = React.memo(function Header({
  onToggleSidebar,
  onSelectSymbol
}) {
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

  return (
    <header className="navbar">
      {/* Brand Modern Geometric Logo (Always cleanly anchored top-left) */}
      <BrandLogo />

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
