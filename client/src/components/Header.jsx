import React, { useState } from 'react';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationCenter } from './NotificationCenter';
import { BrandLogo } from './BrandLogo';

export const Header = React.memo(function Header({
  onToggleSidebar,
  isSidebarCollapsed
}) {
  const { notifications } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="navbar">
      <div className="navbar-left-cluster">
        {onToggleSidebar && (
          <button
            type="button"
            className="btn-icon header-sidebar-toggle"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand Sidebar Navigation' : 'Toggle Sidebar Navigation'}
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu size={17} />
          </button>
        )}

        {/* Brand Modern Geometric Logo */}
        <BrandLogo />
      </div>

      {/* Navigation Actions */}
      <div className="nav-actions">
        {/* Quick Utility Control Icons (Theme, Notifications) */}
        <div className="header-controls-cluster">
          {/* Theme Toggle Button */}
          <button
            className="btn-icon"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            onClick={toggleTheme}
            aria-label="Toggle Color Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }} className="header-notification-container">
            <button
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
        </div>
      </div>
    </header>
  );
});
