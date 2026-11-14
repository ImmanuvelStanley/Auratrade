import React, { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { NotificationCenter } from './NotificationCenter';
import { BrandLogo } from './BrandLogo';

export const Header = React.memo(function Header({
  onToggleSidebar
}) {
  const { notifications } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

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
              className="btn-icon"
              title="Triggered Alerts & Notifications"
              onClick={() => setShowNotifications(prev => !prev)}
              id="header-notification-bell-btn"
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
                <NotificationCenter onClose={() => setShowNotifications(false)} />
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
