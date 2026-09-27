import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, Bell, BookmarkPlus, BookmarkCheck, ShoppingCart } from 'lucide-react';
import { useSocketQuote } from '../context/SocketContext';

export const LiveQuoteCard = React.memo(function LiveQuoteCard({
  symbol,
  quote: propQuote,
  isInWatchlist,
  onToggleWatchlist,
  onOpenAlertModal,
  onOpenTradeModal
}) {
  const socketQuote = useSocketQuote(symbol);
  const [fallbackQuote, setFallbackQuote] = useState(null);
  const [pulseClass, setPulseClass] = useState('');
  const [tickDirection, setTickDirection] = useState('neutral');
  const [lastTickTime, setLastTickTime] = useState(Date.now());
  const [tickCount, setTickCount] = useState(0);

  const quote = propQuote || socketQuote || fallbackQuote;
  const prevPriceRef = useRef(quote?.price);

  useEffect(() => {
    if (!propQuote && symbol) {
      fetch(`/api/stocks/quote/${symbol}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setFallbackQuote(json.data);
          }
        })
        .catch(() => {});
    }
  }, [propQuote, symbol]);

  useEffect(() => {
    if (!quote?.price) return;
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== quote.price) {
      const isUp = quote.price > prevPriceRef.current;
      setPulseClass(isUp ? 'tick-pulse-up' : 'tick-pulse-down');
      setTickDirection(isUp ? 'up' : 'down');
      setLastTickTime(Date.now());
      setTickCount((prev) => prev + 1);

      const timer = setTimeout(() => {
        setPulseClass('');
      }, 800);
      prevPriceRef.current = quote.price;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = quote.price;
  }, [quote?.price]);

  if (!quote) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading real-time quote for {symbol}...
      </div>
    );
  }

  const isBull = (quote.change || 0) >= 0;

  return (
    <div className="glass-card" style={{ minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
      <div className="glass-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        {/* Top Header: Symbol Info & Action Buttons */}
        <div className="live-quote-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', minWidth: 0, width: '100%' }}>
          <div style={{ flex: '1 1 auto', minWidth: 0, maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 className="font-mono live-quote-symbol-heading" style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {quote.symbol}
              </h1>
              <span className="status-pill live-quote-sector-pill" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                {quote.sector || 'US Equity'}
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem 0.6rem', flexWrap: 'wrap', minWidth: 0 }}>
              <span className="live-quote-name-text">{quote.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                📅 {quote.regularMarketDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                Last tick: {new Date(lastTickTime).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="live-quote-actions-cluster" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', minWidth: 0 }}>
            {/* Watchlist Toggle */}
            <button
              className="btn btn-secondary live-quote-action-btn"
              onClick={onToggleWatchlist}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isInWatchlist ? (
                <>
                  <BookmarkCheck size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <span>Watching</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={14} style={{ flexShrink: 0 }} />
                  <span>Watchlist</span>
                </>
              )}
            </button>

            {/* Set Alert Button */}
            <button
              className="btn btn-secondary live-quote-action-btn"
              onClick={onOpenAlertModal}
              title="Configure Price Alert"
            >
              <Bell size={14} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
              <span>Set Alert</span>
            </button>

            {/* Trade Button */}
            <button
              className="btn btn-bull live-quote-action-btn live-quote-trade-btn"
              onClick={onOpenTradeModal}
              title="Simulate Paper Order"
            >
              <ShoppingCart size={14} style={{ flexShrink: 0 }} />
              <span>Trade</span>
            </button>
          </div>
        </div>

        {/* Big Live Price Block with Flash Animation */}
        <div className="live-quote-price-hero" style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem 1rem', flexWrap: 'wrap', minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', minWidth: 0 }}>
            <div
              className={`font-mono live-quote-big-price ${pulseClass}`}
              style={{
                fontSize: '2.4rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.15s ease'
              }}
            >
              ${quote.price.toFixed(2)}
            </div>

            {tickDirection !== 'neutral' && (
              <span
                className={`status-pill font-mono ${tickDirection === 'up' ? 'bg-bull' : 'bg-bear'}`}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                {tickDirection === 'up' ? '▲ UPTICK' : '▼ DOWNTICK'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
            <span
              className={`font-mono ${isBull ? 'bg-bull' : 'bg-bear'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.92rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {isBull ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}
              {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Today ({quote.regularMarketDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
            </span>
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div
          className="live-quote-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 75px), 1fr))',
            gap: '0.65rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)',
            minWidth: 0,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Day High</div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ${quote.dayHigh?.toFixed(2) || '--'}
            </div>
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Day Low</div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ${quote.dayLow?.toFixed(2) || '--'}
            </div>
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Prev Close</div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              ${quote.previousClose?.toFixed(2) || '--'}
            </div>
          </div>

          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Volume</div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {quote.volume ? quote.volume.toLocaleString() : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default LiveQuoteCard;
