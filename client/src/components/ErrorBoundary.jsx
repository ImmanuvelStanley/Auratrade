import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            margin: '1.5rem 0',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#f8fafc',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: '#f87171', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={22} />
            <span>Component Display Protected</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1rem' }}>
            A temporary display error occurred in this module. Your market data, trading session, and portfolio remain safe.
          </p>
          {this.state.error && (
            <div
              style={{
                margin: '0 auto 1.25rem',
                maxWidth: '640px',
                padding: '0.6rem 0.85rem',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#fca5a5',
                fontFamily: 'monospace',
                textAlign: 'left',
                wordBreak: 'break-word'
              }}
            >
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '0.55rem 1.2rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <RefreshCw size={15} /> Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
