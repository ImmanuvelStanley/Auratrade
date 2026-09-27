import React, { useState } from 'react';
import { ShoppingBag, ArrowUpRight, ArrowDownRight, Zap, DollarSign } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export function QuickTradeWidget({ symbol, portfolio, onOpenTradeModal, onTradeComplete }) {
  const { quotes } = useSocket();
  const [loading, setLoading] = useState(false);
  const [quickStatus, setQuickStatus] = useState('');

  const liveQuote = quotes[symbol];
  const price = liveQuote?.price || 150.0;
  const holding = portfolio?.holdings?.find(h => h.symbol === symbol);
  const sharesOwned = holding ? holding.shares : 0;
  const avgPrice = holding ? holding.averagePrice : 0;
  const currentVal = sharesOwned * price;
  const pnl = currentVal - (sharesOwned * avgPrice);
  const pnlPct = sharesOwned > 0 && avgPrice > 0 ? (pnl / (sharesOwned * avgPrice)) * 100 : 0;
  const isBull = pnl >= 0;

  const handleInstantBuy = async (sharesCount) => {
    setLoading(true);
    setQuickStatus('');

    const userCash = portfolio?.cashBalance !== undefined ? Number(portfolio.cashBalance) : 100000;
    const minBalance = Number(portfolio?.minBalance !== undefined ? portfolio.minBalance : 2500);
    const safeTradingPower = Math.max(0, userCash - minBalance);
    const orderCost = sharesCount * price;

    if (orderCost > safeTradingPower) {
      setQuickStatus(`⚠️ Safe Zone Alert: Order of $${orderCost.toFixed(2)} leaves $${(userCash - orderCost).toFixed(2)}, breaching your safe reserve ($${minBalance.toFixed(2)}).`);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auratrade_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbol,
          type: 'BUY',
          shares: sharesCount
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed');
      setQuickStatus(`Bought ${sharesCount} ${symbol} @ $${price.toFixed(2)}!`);
      if (onTradeComplete) onTradeComplete();
      setTimeout(() => setQuickStatus(''), 2500);
    } catch (err) {
      setQuickStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="glass-card-header" style={{ padding: '0.85rem 1rem' }}>
        <div className="glass-card-title" style={{ fontSize: '0.9rem' }}>
          <Zap size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Quick Trading Desk • {symbol}</span>
        </div>
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
          onClick={() => onOpenTradeModal(symbol)}
        >
          Custom Order
        </button>
      </div>

      <div className="glass-card-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Current Position Snapshot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Position</div>
            <div className="font-mono" style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {sharesOwned} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Shares</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unrealized Return</div>
            <div
              className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`}
              style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.1rem' }}
            >
              {sharesOwned > 0 ? (
                <>
                  {isBull ? '+' : ''}${pnl.toFixed(2)} ({isBull ? '+' : ''}{pnlPct.toFixed(1)}%)
                </>
              ) : (
                '--'
              )}
            </div>
          </div>
        </div>

        {quickStatus && (
          <div style={{ fontSize: '0.75rem', color: quickStatus.startsWith('Error') ? 'var(--bear-red)' : 'var(--bull-green)', textAlign: 'center', fontWeight: 600 }}>
            {quickStatus}
          </div>
        )}

        {/* Instant Buy Tranches */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            1-Click Market Buy
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {[1, 5, 10].map((qty) => (
              <button
                key={qty}
                className="btn btn-bull"
                style={{ fontSize: '0.75rem', padding: '0.4rem' }}
                disabled={loading}
                onClick={() => handleInstantBuy(qty)}
              >
                +{qty} Shares
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
