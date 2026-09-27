import React, { useState } from 'react';
import { Briefcase, ArrowUpRight, ArrowDownRight, DollarSign, PieChart, ShoppingBag, FileDown, PlusCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { downloadOrderPdf, downloadStatementPdf } from '../utils/statementPdfGenerator';
import { DepositCashModal } from './DepositCashModal';

export const PortfolioView = React.memo(function PortfolioView({ portfolio, onOpenTradeModal, onTradeComplete }) {
  const { quotes } = useSocket();
  const { user } = useAuth();
  const [showDepositModal, setShowDepositModal] = useState(false);

  const traderProfile = (() => {
    try {
      const userKey = user?.id ? `trader_profile_${user.id}` : null;
      const saved = (userKey && localStorage.getItem(userKey)) || (user ? null : localStorage.getItem('trader_extended_profile'));
      if (saved) return JSON.parse(saved);
      if (user?.traderProfile) return user.traderProfile;
    } catch (e) {}
    return { name: user?.name || 'Trader', currency: user?.traderProfile?.currency || 'USD' };
  })();
  const activeCurrency = traderProfile.currency || 'USD';

  // Instant guaranteed safe fallback ($1,000 baseline) so user never sees an infinite loading block
  const safePortfolio = portfolio || {
    cashBalance: 1000.00,
    investedValue: 0.00,
    totalPortfolioValue: 1000.00,
    totalUnrealizedPnL: 0.00,
    totalPnLPercent: 0.00,
    holdings: [],
    transactions: []
  };

  // Recalculate dynamic live values with incoming socket quotes
  let currentHoldingsValue = 0;
  let totalInvestedCost = 0;

  const dynamicHoldings = (safePortfolio.holdings || []).map((h) => {
    const liveQuote = quotes[h.symbol];
    const livePrice = liveQuote?.price || h.currentPrice || h.averagePrice;
    const invested = h.shares * h.averagePrice;
    const currentVal = h.shares * livePrice;
    const pnl = currentVal - invested;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

    totalInvestedCost += invested;
    currentHoldingsValue += currentVal;

    return {
      ...h,
      livePrice,
      currentVal,
      pnl,
      pnlPercent
    };
  });

  const totalValue = safePortfolio.cashBalance + currentHoldingsValue;
  const totalPnL = currentHoldingsValue - totalInvestedCost;
  const totalPnLPercent = totalInvestedCost > 0 ? (totalPnL / totalInvestedCost) * 100 : 0;
  const isOverallBull = totalPnL >= 0;

  return (
    <div className="motion-entry" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Total Portfolio Value */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Total Portfolio Value</span>
            <Briefcase size={16} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', marginTop: '0.35rem' }}>
            <span className={`font-mono ${isOverallBull ? 'text-bull' : 'text-bear'}`} style={{ fontWeight: 600 }}>
              {isOverallBull ? '+' : ''}${totalPnL.toFixed(2)} ({totalPnLPercent.toFixed(2)}%)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Unrealized Return</span>
          </div>
        </div>

        {/* Available Cash & Safe Zone */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Available Cash</span>
            <DollarSign size={16} style={{ color: 'var(--bull-green)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            ${safePortfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>Safe Reserve: <strong style={{ color: 'var(--warning-amber)' }}>${(safePortfolio.minBalance || user?.minBalance || 100).toLocaleString()}</strong></span>
            <span style={{ color: (safePortfolio.cashBalance - (safePortfolio.minBalance || user?.minBalance || 100)) >= 0 ? '#34d399' : '#f43f5e', fontWeight: 600 }}>
              ${Math.max(0, safePortfolio.cashBalance - (safePortfolio.minBalance || user?.minBalance || 100)).toLocaleString()} Safe Buffer
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            style={{
              marginTop: '0.65rem',
              width: '100%',
              padding: '0.38rem 0.65rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.16)',
              color: 'var(--bull-green)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <PlusCircle size={13} />
            <span>Purchase Cash / Add Funds</span>
          </button>
        </div>

        {/* Invested Holdings Value */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Active Positions Value</span>
            <PieChart size={16} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            ${currentHoldingsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Across {dynamicHoldings.length} securities
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card">
        <div className="glass-card-header">
          <div className="glass-card-title">
            <ShoppingBag size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Open Positions & Holdings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowDepositModal(true)}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={14} style={{ color: 'var(--bull-green)' }} />
              <span>Purchase Cash</span>
            </button>
            <button className="btn btn-primary" onClick={() => onOpenTradeModal()} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              + Execute Trade
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Shares</th>
                <th>Avg Buy Price</th>
                <th>Current Price</th>
                <th>Market Value</th>
                <th>Unrealized P&L</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dynamicHoldings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No stock holdings yet. Use the <strong>Trade</strong> button on any stock to buy simulated shares with your $100k balance.
                  </td>
                </tr>
              ) : (
                dynamicHoldings.map((h) => {
                  const isBull = h.pnl >= 0;
                  return (
                    <tr key={h.symbol}>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {h.symbol}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono">{h.shares}</span>
                      </td>
                      <td>
                        <span className="font-mono">${h.averagePrice.toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ${h.livePrice.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 600 }}>
                          ${h.currentVal.toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}
                        >
                          {isBull ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {isBull ? '+' : ''}${h.pnl.toFixed(2)} ({h.pnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          onClick={() => onOpenTradeModal(h.symbol)}
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History Ledger */}
      {safePortfolio.transactions && safePortfolio.transactions.length > 0 && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="glass-card-title">Recent Order Executions</span>
            <button
              className="btn btn-secondary"
              onClick={() => {
                downloadStatementPdf(safePortfolio.transactions, {
                  user,
                  traderProfile,
                  portfolio: safePortfolio,
                  currency: activeCurrency,
                  fxRate: 1.0
                });
              }}
              style={{
                padding: '0.28rem 0.65rem',
                fontSize: '0.72rem',
                gap: '0.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.08)'
              }}
              title="Download complete ledger as official PDF statement"
            >
              <FileDown size={13} /> Statement PDF
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Order Type</th>
                  <th>Symbol</th>
                  <th>Shares</th>
                  <th>Execution Price</th>
                  <th>Total Consideration</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Soft Copy</th>
                </tr>
              </thead>
              <tbody>
                {safePortfolio.transactions.slice(0, 8).map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          background: tx.type === 'BUY' ? 'var(--bull-green-bg)' : 'var(--bear-red-bg)',
                          color: tx.type === 'BUY' ? 'var(--bull-green)' : 'var(--bear-red)'
                        }}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700 }}>
                        {tx.symbol}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono">{tx.shares}</span>
                    </td>
                    <td>
                      <span className="font-mono">${Number(tx.price).toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 600 }}>
                        ${(tx.shares * tx.price).toFixed(2)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          downloadOrderPdf(tx, {
                            user,
                            traderProfile,
                            cashBalance: safePortfolio.cashBalance,
                            currency: activeCurrency,
                            fxRate: 1.0
                          });
                        }}
                        style={{
                          padding: '0.18rem 0.5rem',
                          fontSize: '0.7rem',
                          gap: '0.2rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.08)'
                        }}
                        title="Download Order Contract Note (PDF)"
                      >
                        <FileDown size={11} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Cash & Deposit Modal */}
      <DepositCashModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        currentCashBalance={safePortfolio.cashBalance}
        onDepositSuccess={() => {
          if (onTradeComplete) onTradeComplete();
        }}
      />
    </div>
  );
});

export default PortfolioView;
