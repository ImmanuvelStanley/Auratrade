import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  ShoppingBag,
  FileDown,
  PlusCircle,
  RotateCcw,
  Award,
  Clock,
  XCircle,
  LogOut,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { downloadOrderPdf, downloadStatementPdf } from '../utils/statementPdfGenerator';
import { DepositCashModal } from './DepositCashModal';

const ALLOCATION_COLORS = [
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#6366f1'
];

const formatSharesQty = (val) => {
  const num = Number(val || 0);
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 10000) / 10000);
};

export const PortfolioView = React.memo(function PortfolioView({
  portfolio,
  onOpenTradeModal,
  onTradeComplete,
  onSelectSymbol
}) {
  const { quotes } = useSocket();
  const { user } = useAuth();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [closingSymbol, setClosingSymbol] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [actionBanner, setActionBanner] = useState(null); // { type: 'success' | 'error', text }
  const [orderTab, setOrderTab] = useState('PENDING'); // 'PENDING' | 'ALL'
  const [txFilter, setTxFilter] = useState('ALL'); // 'ALL' | 'BUY' | 'SELL' | 'DEPOSIT'
  const [showAllTx, setShowAllTx] = useState(false);

  const traderProfile = (() => {
    try {
      const saved = user?.id
        ? (localStorage.getItem(`trader_extended_profile_${user.id}`) || localStorage.getItem(`trader_profile_${user.id}`))
        : (localStorage.getItem('trader_extended_profile_guest') || localStorage.getItem('trader_extended_profile'));
      if (saved) return JSON.parse(saved);
      if (user?.traderProfile) return user.traderProfile;
    } catch (e) {}
    return { name: user?.name || 'Trader', currency: user?.traderProfile?.currency || 'USD' };
  })();
  const activeCurrency = traderProfile.currency || 'USD';

  // Instant guaranteed safe fallback ($1,000 baseline) so user never sees an infinite loading block
  const safePortfolio = portfolio || {
    cashBalance: 1000.00,
    minBalance: 100.00,
    investedValue: 0.00,
    totalPortfolioValue: 1000.00,
    totalUnrealizedPnL: 0.00,
    totalPnLPercent: 0.00,
    realizedPnL: 0.00,
    winRate: 0,
    closedTradesCount: 0,
    winningTradesCount: 0,
    holdings: [],
    orders: [],
    transactions: []
  };

  const effectiveMinBalance = Number(safePortfolio.minBalance ?? user?.minBalance ?? 100);
  const safeBuffer = Math.max(0, Number(safePortfolio.cashBalance || 0) - effectiveMinBalance);

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

  const totalValue = Number(safePortfolio.cashBalance || 0) + currentHoldingsValue;
  const totalPnL = currentHoldingsValue - totalInvestedCost;
  const totalPnLPercent = totalInvestedCost > 0 ? (totalPnL / totalInvestedCost) * 100 : 0;
  const isOverallBull = totalPnL >= 0;

  const realizedPnL = Number(safePortfolio.realizedPnL || 0);
  const closedTradesCount = Number(safePortfolio.closedTradesCount || 0);
  const winRate = Number(safePortfolio.winRate || 0);
  const isRealizedBull = realizedPnL >= 0;

  // Portfolio allocation slices (Cash + Holdings)
  const allocationSlices = [];
  if (totalValue > 0) {
    allocationSlices.push({
      label: 'Cash',
      value: Number(safePortfolio.cashBalance || 0),
      pct: (Number(safePortfolio.cashBalance || 0) / totalValue) * 100,
      color: '#10b981'
    });
    dynamicHoldings.forEach((h, idx) => {
      if (h.currentVal > 0) {
        allocationSlices.push({
          label: h.symbol,
          value: h.currentVal,
          pct: (h.currentVal / totalValue) * 100,
          color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length]
        });
      }
    });
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auratrade_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleResetPortfolio = async () => {
    setResetLoading(true);
    setActionBanner(null);
    try {
      const res = await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to reset paper account');
      setConfirmReset(false);
      setActionBanner({ type: 'success', text: json.message || 'Paper account reset to $1,000.00 successfully.' });
      if (onTradeComplete) await onTradeComplete();
    } catch (err) {
      setActionBanner({ type: 'error', text: err.message });
    } finally {
      setResetLoading(false);
    }
  };

  const handleClosePosition = async (holding) => {
    setClosingSymbol(holding.symbol);
    setActionBanner(null);
    try {
      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          symbol: holding.symbol,
          type: 'SELL',
          shares: holding.shares,
          orderKind: 'MARKET'
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to close position');
      setActionBanner({ type: 'success', text: json.message || `Closed 100% of ${holding.symbol}.` });
      if (onTradeComplete) await onTradeComplete();
    } catch (err) {
      setActionBanner({ type: 'error', text: err.message });
    } finally {
      setClosingSymbol(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingOrderId(orderId);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/portfolio/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to cancel order');
      setActionBanner({ type: 'success', text: json.message || 'Order cancelled.' });
      if (onTradeComplete) await onTradeComplete();
    } catch (err) {
      setActionBanner({ type: 'error', text: err.message });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const allOrders = safePortfolio.orders || [];
  const pendingOrdersCount = allOrders.filter((o) => o.status === 'PENDING').length;
  const visibleOrders = orderTab === 'PENDING' ? allOrders.filter((o) => o.status === 'PENDING') : allOrders;

  const allTransactions = safePortfolio.transactions || [];
  const filteredTransactions = txFilter === 'ALL'
    ? allTransactions
    : allTransactions.filter((tx) => tx.type === txFilter);
  const displayedTransactions = showAllTx ? filteredTransactions : filteredTransactions.slice(0, 10);

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Type', 'Symbol', 'Shares', 'Price', 'Total Amount', 'Realized PnL'];
    const rows = (allTransactions || []).map((t) => [
      t.timestamp ? `"${new Date(t.timestamp).toLocaleString()}"` : '""',
      `"${t.type || ''}"`,
      `"${t.symbol || ''}"`,
      t.shares || 0,
      t.price || 0,
      t.total || 0,
      t.realizedPnL || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auratrade_paper_trading_statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Portfolio NAV Historical Trajectory Curve Generator
  const navPoints = useMemo(() => {
    const baseline = 1000.0;
    if (!allTransactions || allTransactions.length === 0) {
      return [
        { label: 'Inception', val: baseline },
        { label: 'Current Live', val: totalValue }
      ];
    }
    const sorted = [...allTransactions].reverse();
    let runningVal = baseline;
    const pts = [{ label: 'Inception ($1,000)', val: baseline }];
    sorted.forEach((tx, idx) => {
      const pnl = Number(tx.realizedPnL || 0);
      runningVal += pnl;
      pts.push({
        label: `${tx.type} ${tx.symbol}`,
        val: parseFloat(runningVal.toFixed(2))
      });
    });
    pts.push({ label: 'Current Live NAV', val: parseFloat(totalValue.toFixed(2)) });
    return pts;
  }, [allTransactions, totalValue]);

  return (
    <div className="motion-entry" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {actionBanner && (
        <div
          style={{
            padding: '0.7rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: actionBanner.type === 'success' ? 'var(--bull-green-bg)' : 'var(--bear-red-bg)',
            border: `1px solid ${actionBanner.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
            color: actionBanner.type === 'success' ? 'var(--bull-green)' : 'var(--bear-red)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <span>{actionBanner.text}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Banner (4 balanced KPI Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* 1. Total Portfolio Value */}
        <div className="glass-card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Total Portfolio Value</span>
            <Briefcase size={16} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            <span className={`font-mono ${isOverallBull ? 'text-bull' : 'text-bear'}`} style={{ fontWeight: 600 }}>
              {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)} ({totalPnLPercent.toFixed(2)}%)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Unrealized</span>
          </div>
        </div>

        {/* 2. Available Cash & Safe Zone */}
        <div className="glass-card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Available Cash</span>
            <DollarSign size={16} style={{ color: 'var(--bull-green)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            ${Number(safePortfolio.cashBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>Safe Reserve: <strong style={{ color: 'var(--warning-amber)' }}>${effectiveMinBalance.toLocaleString()}</strong></span>
            <span style={{ color: (Number(safePortfolio.cashBalance || 0) - effectiveMinBalance) >= 0 ? 'var(--bull-green)' : 'var(--bear-red)', fontWeight: 600 }}>
              ${safeBuffer.toLocaleString()} Buffer
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDepositModal(true)}
            style={{
              marginTop: '0.6rem',
              width: '100%',
              padding: '0.38rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.16)',
              color: 'var(--bull-green)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem'
            }}
          >
            <PlusCircle size={13} />
            <span>Purchase Cash / Add Funds</span>
          </button>
        </div>

        {/* 3. Invested Holdings Value */}
        <div className="glass-card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Active Positions Value</span>
            <PieChart size={16} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            ${currentHoldingsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', gap: '0.3rem', flexWrap: 'wrap' }}>
            <span>Across {dynamicHoldings.length} {dynamicHoldings.length === 1 ? 'security' : 'securities'}</span>
            <span className="font-mono" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {totalValue > 0 ? ((currentHoldingsValue / totalValue) * 100).toFixed(1) : '0.0'}% deployed
            </span>
          </div>
        </div>

        {/* 4. Realized P&L & Win Rate */}
        <div className="glass-card" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>Realized P&amp;L &amp; Win Rate</span>
            <Award size={16} style={{ color: 'var(--warning-amber)' }} />
          </div>
          <div
            className={`font-mono ${isRealizedBull ? 'text-bull' : 'text-bear'}`}
            style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '0.4rem' }}
          >
            {realizedPnL >= 0 ? '+' : '-'}${Math.abs(realizedPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
            <span>Win Rate: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{winRate.toFixed(1)}%</strong></span>
            <span>{closedTradesCount} closed {closedTradesCount === 1 ? 'exit' : 'exits'}</span>
          </div>
        </div>
      </div>

      {/* Portfolio Equity Growth & Net Asset Value (NAV) Performance Curve */}
      <div className="glass-card" style={{ padding: '1.15rem 1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--bull-green)' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Portfolio Equity Growth &amp; NAV Trajectory
              </h4>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Account performance trajectory anchored to $1,000.00 baseline
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.74rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>High-Water Mark: </span>
              <strong className="font-mono text-bull">${Math.max(1000, totalValue).toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Net Growth: </span>
              <strong className={`font-mono ${totalValue >= 1000 ? 'text-bull' : 'text-bear'}`}>
                {totalValue >= 1000 ? '+' : ''}{((totalValue - 1000) / 10).toFixed(2)}%
              </strong>
            </div>
          </div>
        </div>

        {/* SVG Equity Trajectory Curve */}
        {(() => {
          const vals = navPoints.map((p) => p.val);
          const minVal = Math.min(...vals, 1000) * 0.98;
          const maxVal = Math.max(...vals, 1000) * 1.02;
          const range = maxVal - minVal || 1;
          const width = 600;
          const height = 90;
          const pad = 10;
          const h = height - pad * 2;
          const coords = navPoints.map((p, i) => {
            const x = pad + (i / Math.max(1, navPoints.length - 1)) * (width - pad * 2);
            const y = pad + h - ((p.val - minVal) / range) * h;
            return { x, y, val: p.val, label: p.label };
          });
          const pathD = `M ${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ')}`;
          const areaD = `${pathD} L ${width - pad},${height} L ${pad},${height} Z`;
          const isGain = totalValue >= 1000;
          const strokeColor = isGain ? '#10b981' : '#f43f5e';

          return (
            <div style={{ position: 'relative', width: '100%', height: '90px' }}>
              <svg width="100%" height="90" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="nav-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill="url(#nav-grad)" />
                <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                {coords.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r="3.5" fill={strokeColor} stroke="#ffffff" strokeWidth="1.2" />
                ))}
              </svg>
            </div>
          );
        })()}
      </div>

      {/* Portfolio Exposure Allocation Bar */}
      {allocationSlices.length > 0 && (
        <div className="glass-card" style={{ padding: '0.95rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Capital Allocation &amp; Exposure
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', fontSize: '0.72rem' }}>
              {allocationSlices.map((slice) => (
                <span key={slice.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: slice.color, display: 'inline-block' }} />
                  <span>{slice.label}</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{slice.pct.toFixed(1)}%</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: '10px', borderRadius: '999px', overflow: 'hidden', display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
            {allocationSlices.map((slice) => (
              <div
                key={slice.label}
                title={`${slice.label}: $${slice.value.toFixed(2)} (${slice.pct.toFixed(1)}%)`}
                style={{ width: `${Math.max(1.5, slice.pct)}%`, background: slice.color, height: '100%' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Limit / Stop-Loss / Take-Profit Orders */}
      {allOrders.length > 0 && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
            <div className="glass-card-title">
              <Clock size={17} style={{ color: 'var(--accent-cyan)' }} />
              <span>Working &amp; Bracket Orders ({pendingOrdersCount} Active)</span>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'PENDING', label: `Active (${pendingOrdersCount})` },
                { id: 'ALL', label: `All (${allOrders.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderTab(tab.id)}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.73rem',
                    padding: '0.28rem 0.65rem',
                    borderColor: orderTab === tab.id ? 'var(--accent-cyan)' : undefined,
                    color: orderTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Kind / Side</th>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Trigger Target</th>
                  <th>Live Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No pending orders right now. Switch to <strong>All</strong> to view filled/cancelled orders.
                    </td>
                  </tr>
                ) : (
                  visibleOrders.map((ord) => {
                    const livePx = quotes[ord.symbol]?.price;
                    const gapPct = livePx && ord.targetPrice ? ((ord.targetPrice - livePx) / livePx) * 100 : null;
                    return (
                      <tr key={ord.id}>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: ord.type === 'BUY' ? 'var(--bull-green-bg)' : 'var(--bear-red-bg)',
                                color: ord.type === 'BUY' ? 'var(--bull-green)' : 'var(--bear-red)'
                              }}
                            >
                              {ord.type}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: 'rgba(6, 182, 212, 0.14)',
                                color: 'var(--accent-cyan)'
                              }}
                            >
                              {ord.orderKind}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 700 }}>{ord.symbol}</span>
                        </td>
                        <td>
                          <span className="font-mono">{formatSharesQty(ord.shares)}</span>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--warning-amber)' }}>
                            ${Number(ord.targetPrice).toFixed(2)}
                          </span>
                          {gapPct !== null && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                              ({gapPct >= 0 ? '+' : ''}{gapPct.toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="font-mono">
                            {livePx ? `$${Number(livePx).toFixed(2)}` : '—'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              background: ord.status === 'FILLED' ? 'var(--bull-green-bg)' : ord.status === 'PENDING' ? 'rgba(245, 158, 11, 0.14)' : 'var(--bg-input)',
                              color: ord.status === 'FILLED' ? 'var(--bull-green)' : ord.status === 'PENDING' ? 'var(--warning-amber)' : 'var(--text-muted)'
                            }}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {ord.status === 'PENDING' ? (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={cancellingOrderId === ord.id}
                              onClick={() => handleCancelOrder(ord.id)}
                              style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem', color: 'var(--bear-red)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <XCircle size={12} />
                              <span>{cancellingOrderId === ord.id ? 'Cancelling...' : 'Cancel'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="glass-card">
        <div className="glass-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div className="glass-card-title">
            <ShoppingBag size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span>Open Positions &amp; Holdings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowDepositModal(true)}
              style={{ fontSize: '0.78rem', padding: '0.38rem 0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={14} style={{ color: 'var(--bull-green)' }} />
              <span>Purchase Cash</span>
            </button>

            {confirmReset ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resetLoading}
                  onClick={handleResetPortfolio}
                  style={{
                    fontSize: '0.76rem',
                    padding: '0.38rem 0.7rem',
                    color: '#ffffff',
                    background: 'rgba(244, 63, 94, 0.85)',
                    borderColor: 'rgba(244, 63, 94, 0.9)'
                  }}
                >
                  {resetLoading ? 'Resetting...' : 'Confirm Reset $1,000'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resetLoading}
                  onClick={() => setConfirmReset(false)}
                  style={{ fontSize: '0.74rem', padding: '0.38rem 0.55rem' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmReset(true)}
                style={{ fontSize: '0.78rem', padding: '0.38rem 0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                title="Reset holdings, pending orders, and cash back to $1,000.00"
              >
                <RotateCcw size={13} style={{ color: 'var(--warning-amber)' }} />
                <span>Reset ($1,000)</span>
              </button>
            )}

            <button className="btn btn-primary" onClick={() => onOpenTradeModal()} style={{ fontSize: '0.78rem', padding: '0.38rem 0.78rem' }}>
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
                <th>Unrealized P&amp;L</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dynamicHoldings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.25rem', color: 'var(--text-muted)' }}>
                    No stock holdings yet. Use <strong>+ Execute Trade</strong> to buy whole or fractional shares ($ or share amount) with your $1,000 starting paper balance.
                  </td>
                </tr>
              ) : (
                dynamicHoldings.map((h) => {
                  const isBull = h.pnl >= 0;
                  return (
                    <tr key={h.symbol}>
                      <td>
                        <button
                          type="button"
                          onClick={() => (onSelectSymbol ? onSelectSymbol(h.symbol) : onOpenTradeModal(h.symbol))}
                          title="Inspect live chart on Workstation"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px'
                          }}
                        >
                          {h.symbol}
                        </button>
                      </td>
                      <td>
                        <span className="font-mono">{formatSharesQty(h.shares)}</span>
                      </td>
                      <td>
                        <span className="font-mono">${Number(h.averagePrice).toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          ${Number(h.livePrice).toFixed(2)}
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
                          {h.pnl >= 0 ? '+' : '-'}${Math.abs(h.pnl).toFixed(2)} ({h.pnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.73rem', padding: '0.28rem 0.58rem' }}
                            onClick={() => onOpenTradeModal(h.symbol)}
                          >
                            Trade
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={closingSymbol === h.symbol}
                            onClick={() => handleClosePosition(h)}
                            style={{
                              fontSize: '0.73rem',
                              padding: '0.28rem 0.58rem',
                              color: 'var(--bear-red)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title={`Sell 100% of ${h.symbol} at market price`}
                          >
                            <LogOut size={12} />
                            <span>{closingSymbol === h.symbol ? 'Closing...' : 'Close 100%'}</span>
                          </button>
                        </div>
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
      {allTransactions.length > 0 && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
            <span className="glass-card-title">Order Execution &amp; Funding Ledger</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                {['ALL', 'BUY', 'SELL', 'DEPOSIT'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setTxFilter(f)}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.24rem 0.52rem',
                      borderColor: txFilter === f ? 'var(--accent-cyan)' : undefined,
                      color: txFilter === f ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                    }}
                  >
                    {f === 'ALL' ? 'All' : f}
                  </button>
                ))}
              </div>

              {filteredTransactions.length > 10 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAllTx((prev) => !prev)}
                  style={{ fontSize: '0.72rem', padding: '0.26rem 0.58rem' }}
                >
                  {showAllTx ? 'Show Recent 10' : `Show All (${filteredTransactions.length})`}
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportCsv}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.32rem 0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  color: 'var(--accent-cyan)'
                }}
                title="Download Account Ledger as CSV spreadsheet"
              >
                <FileSpreadsheet size={13} /> Export CSV
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  downloadStatementPdf(allTransactions, {
                    user,
                    traderProfile,
                    portfolio: safePortfolio,
                    currency: activeCurrency,
                    fxRate: 1.0
                  });
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.32rem 0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: 'var(--bull-green)'
                }}
                title="Download Full Institutional Account Statement (PDF)"
              >
                <FileDown size={13} /> Export Statement (PDF)
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Symbol</th>
                  <th>Shares</th>
                  <th>Price</th>
                  <th>Total Value</th>
                  <th>Realized P&amp;L</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Soft Copy</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  const isDeposit = tx.type === 'DEPOSIT';
                  const badgeBg = isBuy
                    ? 'var(--bull-green-bg)'
                    : isDeposit
                      ? 'rgba(6, 182, 212, 0.14)'
                      : 'var(--bear-red-bg)';
                  const badgeColor = isBuy
                    ? 'var(--bull-green)'
                    : isDeposit
                      ? 'var(--accent-cyan)'
                      : 'var(--bear-red)';
                  const hasRealized = tx.type === 'SELL' && tx.realizedPnL !== null && tx.realizedPnL !== undefined;

                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.18rem 0.48rem',
                              borderRadius: 'var(--radius-sm)',
                              background: badgeBg,
                              color: badgeColor
                            }}
                          >
                            {tx.type}
                          </span>
                          {tx.executionMode && tx.executionMode !== 'MARKET' && (
                            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {tx.executionMode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 700 }}>
                          {tx.symbol}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono">{isDeposit ? '—' : formatSharesQty(tx.shares)}</span>
                      </td>
                      <td>
                        <span className="font-mono">${Number(tx.price).toFixed(2)}</span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontWeight: 600 }}>
                          ${((Number(tx.shares) || 1) * Number(tx.price)).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {hasRealized ? (
                          <span className={`font-mono ${Number(tx.realizedPnL) >= 0 ? 'text-bull' : 'text-bear'}`} style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            {Number(tx.realizedPnL) >= 0 ? '+' : '-'}${Math.abs(Number(tx.realizedPnL)).toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                        )}
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
                  );
                })}
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
