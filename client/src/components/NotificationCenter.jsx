import React, { useEffect, useRef } from 'react';
import { CheckCheck, BellOff, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function NotificationCenter({ onClose }) {
  const { notifications, clearNotifications, dismissNotification } = useSocket();
  const menuRef = useRef(null);

  // Auto-close when clicking anywhere in empty area outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        // If clicking on the notification bell button itself, let the button's toggle handler manage it
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

    // Capture phase ensures reliable detection even if propagation is stopped on child cards
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div ref={menuRef} className="notification-menu">
      <div className="notification-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
          <span>Alert Notifications</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ({notifications.length})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                transition: 'all 0.15s ease'
              }}
              title="Clear all alert notifications"
            >
              <CheckCheck size={14} /> Clear All
            </button>
          )}
          <button
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

      <div
        onClick={(e) => {
          // If user clicks in empty area inside the container when no notifications are present, close it
          if (notifications.length === 0) {
            if (onClose) onClose();
          }
        }}
        style={{
          maxHeight: '340px',
          overflowY: 'auto',
          padding: '0.6rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          cursor: notifications.length === 0 ? 'pointer' : 'default'
        }}
      >
        {notifications.length === 0 ? (
          <div
            onClick={() => {
              if (onClose) onClose();
            }}
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              transition: 'background var(--transition-fast)'
            }}
            title="Click to close notifications"
          >
            <BellOff size={32} style={{ margin: '0 auto 0.6rem auto', opacity: 0.4, color: 'var(--accent-cyan)' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No alerts triggered yet</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
              Set target alerts on any stock to get notified live in real time.
            </p>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginTop: '0.85rem',
                fontSize: '0.72rem',
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.1)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                opacity: 0.9
              }}
            >
              Click empty area to close
            </span>
          </div>
        ) : (
          notifications.map((n, idx) => {
            const notifId = n.id || `notif_${idx}`;
            return (
              <div
                key={notifId}
                style={{
                  padding: '0.8rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>
                      {n.symbol}
                    </span>
                    <span
                      className="status-pill status-triggered"
                      data-status="TRIGGERED"
                      style={{
                        fontSize: '0.62rem',
                        padding: '0.1rem 0.38rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-flex',
                        letterSpacing: '0.03em'
                      }}
                    >
                      TRIGGERED
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {new Date(n.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>

                  <button
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
                      borderRadius: '4px',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bear-red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    title="Dismiss alert"
                  >
                    <X size={14} />
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {n.message}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                  <span className="font-mono text-bull" style={{ fontWeight: 600 }}>
                    Breach: ${parseFloat(n.price || 0).toFixed(2)}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Target: ${parseFloat(n.targetPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
