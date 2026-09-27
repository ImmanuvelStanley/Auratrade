import React, { useState } from 'react';
import { TrendingUp, Activity, Bell, Volume2, VolumeX, User, LogOut, Sun, Moon } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { soundFx } from '../utils/audio';
import { NotificationCenter } from './NotificationCenter';
import { BrandLogo } from './BrandLogo';

export const Header = React.memo(function Header({ onOpenAuthModal, portfolioCash, onOpenProfile }) {
  const { notifications } = useSocket();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [soundOn, setSoundOn] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleSound = () => {
    const next = soundFx.toggleSound();
    setSoundOn(next);
  };

  return (
    <header className="navbar">
      {/* Brand Modern Geometric Logo */}
      <BrandLogo />

      {/* Navigation Actions */}
      <div className="nav-actions">
        {/* Quick Utility Control Icons (Theme, Audio, Notifications) */}
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

          {/* Audio Toggle */}
          <button
            className="btn-icon"
            title={soundOn ? 'Mute Alert Chimes' : 'Enable Alert Chimes'}
            onClick={handleToggleSound}
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
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

        {/* Subtle separator divider between controls and user profile */}
        <div className="header-nav-divider" />

        {/* User Auth Profile / Quick Login */}
        {user ? (
          <div className="header-user-cluster">
            {/* Profile Avatar & Sign Out Group */}
            <div className="header-profile-group">
              <button
                className="btn btn-secondary header-profile-trigger"
                onClick={onOpenProfile}
                title={`Logged in as ${user.name || user.email}`}
                id="header-profile-btn"
              >
                <div
                  className="header-profile-avatar"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#fff',
                    flexShrink: 0
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="header-profile-name">
                  {user.name || user.email.split('@')[0]}
                </span>
              </button>

              <button
                className="btn btn-secondary header-signout-btn"
                onClick={logout}
                title="Sign out from workstation"
                id="header-signout-btn"
                aria-label="Sign out"
              >
                <LogOut size={13} className="header-signout-icon" />
                <span className="header-signout-text">Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-primary header-signin-btn"
            onClick={onOpenAuthModal}
            title="Sign in to workstation"
            aria-label="Sign in"
          >
            <User size={13} />
            <span className="header-signin-text">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
});
