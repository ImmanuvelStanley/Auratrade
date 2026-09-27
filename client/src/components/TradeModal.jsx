import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShoppingCart,
  DollarSign,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Target,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  FileDown,
  Printer,
  FileText,
  ArrowRight,
  Plus,
  Minus,
  Activity,
  Zap,
  Clock,
  Layers
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { downloadOrderPdf } from '../utils/statementPdfGenerator';
import { soundFx } from '../utils/audio';
import { BrandLogo } from './BrandLogo';
import { DepositCashModal } from './DepositCashModal';

// Institutional quick-select chips for market titans and commodities
const TOP_TECH_TITANS = [
  { symbol: 'GOLD', name: 'Gold Spot', tag: 'Bullion' },
  { symbol: 'SILVER', name: 'Silver Spot', tag: 'Bullion' },
  { symbol: 'GOLDBEES.NS', name: 'Gold ETF', tag: 'ETF' },
  { symbol: 'AAPL', name: 'Apple', tag: 'Tech' },
  { symbol: 'NVDA', name: 'NVIDIA', tag: 'AI/Semis' },
  { symbol: 'MSFT', name: 'Microsoft', tag: 'Cloud' },
  { symbol: 'GOOGL', name: 'Google', tag: 'Tech' },
  { symbol: 'META', name: 'Meta', tag: 'Social' },
  { symbol: 'AMZN', name: 'Amazon', tag: 'E-Comm' },
  { symbol: 'TSLA', name: 'Tesla', tag: 'EV' },
  { symbol: 'PLTR', name: 'Palantir', tag: 'Data' },
  { symbol: 'COIN', name: 'Coinbase', tag: 'Crypto' }
];

export function TradeModal({
  defaultSymbol = 'AAPL',
  portfolio,
  onClose,
  onTradeComplete,
  lockedAsset
}) {
  const { user } = useAuth();
  const { quotes, subscribe } = useSocket();
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [orderType, setOrderType] = useState('BUY'); // 'BUY' | 'SELL'
  const [shares, setShares] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [executedTrade, setExecutedTrade] = useState(null);
  const [latestCashBalance, setLatestCashBalance] = useState(null);

  // Read extended trader profile for PDF statement personalization (user-scoped)
  const traderProfile = (() => {
    try {
      const userKey = user?.id ? `trader_profile_${user.id}` : null;
      const saved = (userKey && localStorage.getItem(userKey)) || (user ? null : localStorage.getItem('trader_extended_profile'));
      if (saved) return JSON.parse(saved);
      if (user?.traderProfile) return user.traderProfile;
    } catch (e) {}
    return { name: user?.name || 'Alex Mercer (Demo Pro)', currency: user?.traderProfile?.currency || 'USD' };
  })();
  const activeCurrency = traderProfile.currency || 'USD';

  // Live searchable ticker input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDropdownRef = useRef(null);

  // Sync internal symbol if defaultSymbol prop changes
  useEffect(() => {
    if (defaultSymbol) {
      setSymbol(defaultSymbol);
    }
  }, [defaultSymbol]);

  // Subscribe to live websocket updates for selected ticker
  useEffect(() => {
    if (symbol && subscribe) {
      subscribe(symbol);
    }
  }, [symbol, subscribe]);

  // Real-time debounced symbol search across entire market catalog
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSearchResults(json.data);
          setShowSearchDropdown(true);
        }
      } catch (e) {
      } finally {
        setIsSearching(false);
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dismiss dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSymbol = (newSym) => {
    setSymbol(newSym);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setError('');
  };

  const liveQuote = quotes[symbol];
  const price = liveQuote?.price || 150.00;
  const numShares = parseInt(shares, 10) || 0;
  const totalCost = numShares * price;

  const currentHolding = portfolio?.holdings?.find(h => h.symbol === symbol);
  const userCash = portfolio?.cashBalance !== undefined ? Number(portfolio.cashBalance) : 0;
  const minBalance = Number(user?.minBalance !== undefined ? user.minBalance : (portfolio?.minBalance !== undefined ? portfolio.minBalance : 100));
  const safeTradingPower = Math.max(0, userCash - minBalance);
  const isSafeZoneBreach = orderType === 'BUY' && totalCost > safeTradingPower && totalCost <= userCash;
  const [allowReserveBreach, setAllowReserveBreach] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const isPos = liveQuote?.change !== undefined ? liveQuote.change >= 0 : true;

  const handleStepShares = (delta) => {
    const nextVal = Math.max(1, (parseInt(shares, 10) || 0) + delta);
    setShares(String(nextVal));
  };

  const handleQuickPercent = (pct) => {
    if (orderType === 'BUY') {
      const deployableCash = safeTradingPower > 0 && !allowReserveBreach ? safeTradingPower : userCash;
      const maxShares = Math.floor(deployableCash / price);
      setShares(String(Math.max(1, Math.floor(maxShares * pct))));
    } else {
      const holdingShares = currentHolding?.shares || 0;
      setShares(String(Math.max(1, Math.floor(holdingShares * pct))));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numShares <= 0) {
      setError('Please specify at least 1 share.');
      return;
    }

    if (orderType === 'BUY' && totalCost > userCash) {
      setError(`Insufficient cash. Required: $${totalCost.toFixed(2)}, Available: $${userCash.toFixed(2)}`);
      return;
    }

    if (orderType === 'BUY' && totalCost > safeTradingPower && !allowReserveBreach) {
      setError(`Safe Zone Protection: This order leaves $${(userCash - totalCost).toFixed(2)}, which breaches your required safe reserve of $${minBalance.toFixed(2)}. Max safe purchase: $${safeTradingPower.toFixed(2)}. Check 'Authorize Safe Zone Breach' below to proceed.`);
      return;
    }

    if (orderType === 'SELL' && (!currentHolding || currentHolding.shares < numShares)) {
      setError(`Insufficient shares. You own ${currentHolding ? currentHolding.shares : 0} shares of ${symbol}.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auratrade_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbol,
          type: orderType,
          shares: numShares,
          allowReserveBreach
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Trade order failed');

      const tradeDetails = {
        id: json.trade?.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        symbol: json.trade?.symbol || symbol,
        type: json.trade?.type || orderType,
        shares: json.trade?.shares || numShares,
        price: json.trade?.price || price,
        timestamp: json.trade?.timestamp || new Date().toISOString(),
        name: liveQuote?.name || symbol
      };
      setExecutedTrade(tradeDetails);
      const updatedCash = json.cashBalance !== undefined 
        ? json.cashBalance 
        : (orderType === 'BUY' ? userCash - totalCost : userCash + totalCost);
      setLatestCashBalance(updatedCash);
      setSuccessMsg(json.message);
      
      // Play audio chime for verified execution
      soundFx.playAlertChime();

      if (onTradeComplete) onTradeComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card pro-trade-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'min(92vh, 790px)',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.5), 0 0 32px rgba(6, 182, 212, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top Dynamic Ambient Aura Bar */}
        <div
          style={{
            height: '3px',
            width: '100%',
            flexShrink: 0,
            background: orderType === 'BUY'
              ? 'linear-gradient(90deg, #059669 0%, #10b981 35%, #34d399 70%, #06b6d4 100%)'
              : 'linear-gradient(90deg, #be123c 0%, #f43f5e 35%, #fb7185 70%, #f59e0b 100%)',
            transition: 'background 0.3s ease'
          }}
        />

        {/* =================================================================
            PREMIUM HEADER WITH AURA TRADE BRAND LOGO & LIVE STATUS
            ================================================================= */}
        <div
          style={{
            padding: '0.9rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-input)',
            flexShrink: 0
          }}
        >
          {/* Official Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <BrandLogo size="normal" layout="horizontal" subtitle="Order Execution Terminal" />
          </div>

          {/* Close Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close Trade Portal"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={16} />
            </button>
        </div>

        {/* =================================================================
            POST-TRADE EXECUTED CONFIRMATION SCREEN
            ================================================================= */}
        {executedTrade ? (
          <div style={{ padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bull-green)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-brand)' }}>
                Order Executed & Cleared
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '420px' }}>
                {successMsg || `Executed ${executedTrade.type} ${executedTrade.shares} shares of ${executedTrade.symbol} at $${Number(executedTrade.price).toFixed(2)}`}
              </p>
            </div>

            {/* Official Soft Copy Particulars Card */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.84rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Order Confirmation Ref:
                </span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.8rem' }}>
                  {executedTrade.id}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Security Instrument</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {executedTrade.symbol} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)' }}>({executedTrade.name || 'Equity'})</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Order Type & Settlement</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                    <span
                      style={{
                        padding: '0.12rem 0.48rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: executedTrade.type === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                        color: executedTrade.type === 'BUY' ? '#34d399' : '#f87171',
                        border: `1px solid ${executedTrade.type === 'BUY' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`
                      }}
                    >
                      {executedTrade.type}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>SETTLED (T+0)</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Executed Shares</div>
                  <div className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {executedTrade.shares} shares
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Execution Price</div>
                  <div className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    ${Number(executedTrade.price).toFixed(2)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  paddingTop: '0.65rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>Total Settlement Consideration:</span>
                <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: executedTrade.type === 'BUY' ? 'var(--bull-green)' : 'var(--accent-cyan)' }}>
                  ${(Number(executedTrade.shares) * Number(executedTrade.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Bar with PDF Soft Copy Download */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  downloadOrderPdf(executedTrade, {
                    user,
                    traderProfile,
                    cashBalance: latestCashBalance ?? userCash,
                    currency: activeCurrency,
                    fxRate: traderProfile.fxRate || 1.0
                  });
                }}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer'
                }}
              >
                <FileDown size={18} /> Download Official PDF Contract Note
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    downloadOrderPdf(executedTrade, {
                      user,
                      traderProfile,
                      cashBalance: latestCashBalance ?? userCash,
                      currency: activeCurrency,
                      fxRate: traderProfile.fxRate || 1.0,
                      isInvoice: true
                    });
                  }}
                  style={{
                    padding: '0.65rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={15} /> Trade Invoice
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setExecutedTrade(null);
                    setShares('10');
                  }}
                  style={{
                    padding: '0.65rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  <ShoppingCart size={15} /> Place Another Order
                </button>
              </div>

              <button
                type="button"
                className="btn"
                onClick={onClose}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.45rem',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  marginTop: '0.25rem'
                }}
              >
                Done & Return to Terminal
              </button>
            </div>
          </div>
        ) : (
          /* =================================================================
             ORDER PLACEMENT FORM
             ================================================================= */
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '0.9rem clamp(0.9rem, 2.5vw, 1.35rem) 1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              boxSizing: 'border-box',
              overflowY: 'auto',
              flex: 1,
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--bear-red-bg)',
                  color: 'var(--bear-red)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* ASSET SELECTOR & LIVE SEARCH HEADER */}
            <div ref={searchDropdownRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-brand)' }}>
                  SELECT COMPANY / ASSET TO TRADE:
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  Active: <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{symbol}</strong>
                </span>
              </div>

              {/* Real-time search bar */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="custom-input"
                  style={{
                    width: '100%',
                    paddingLeft: '2.3rem',
                    paddingRight: '2rem',
                    fontSize: '0.85rem',
                    height: '38px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Search any ticker (Apple, NVIDIA, Google, Gold, Silver...)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Search dropdown results */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '100%',
                    marginTop: '6px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 100,
                    maxHeight: '230px',
                    overflowY: 'auto'
                  }}
                >
                  {searchResults.map((item) => (
                    <div
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      style={{
                        padding: '0.65rem 0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: item.symbol === symbol ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = item.symbol === symbol ? 'rgba(6, 182, 212, 0.15)' : 'transparent'}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{item.symbol}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({item.sector || 'Market'})</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                          {item.name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        ${item.price?.toFixed(2) || '--'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Tech Titans & Commodities Select Chips */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  overflowX: 'auto',
                  marginTop: '0.55rem',
                  paddingBottom: '0.25rem',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {TOP_TECH_TITANS.map((t) => {
                  const isSelected = t.symbol === symbol;
                  const isBullion = t.tag === 'Bullion';
                  return (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => handleSelectSymbol(t.symbol)}
                      style={{
                        flexShrink: 0,
                        padding: '0.3rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        border: isSelected
                          ? (isBullion ? '1px solid #f59e0b' : '1px solid var(--accent-cyan)')
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected
                          ? (isBullion ? 'rgba(245, 158, 11, 0.2)' : 'rgba(6, 182, 212, 0.22)')
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected
                          ? (isBullion ? '#fbbf24' : '#38bdf8')
                          : 'var(--text-secondary)',
                        boxShadow: isSelected
                          ? (isBullion ? '0 0 12px rgba(245, 158, 11, 0.2)' : '0 0 12px rgba(6, 182, 212, 0.2)')
                          : 'none',
                        transition: 'all 0.15s ease',
                        fontFamily: 'var(--font-sans)'
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LOCKED PROFIT PROTOCOL ACTIVE BANNER (IF APPLICABLE) */}
            {lockedAsset && lockedAsset.symbol === symbol && (
              <div
                style={{
                  background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.15) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 0.95rem',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 800, color: 'var(--bull-green)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Lock size={13} /> LOCKED ASYMMETRIC TARGET ACTIVE
                  </span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    R:R {lockedAsset.rewardRiskRatio} : 1
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <span>Target TP: <strong style={{ color: 'var(--bull-green)' }}>${lockedAsset.targetPrice?.toFixed(2)} (+{lockedAsset.profitGainPercent}%)</strong></span>
                  <span>Stop Loss: <strong style={{ color: '#f43f5e' }}>${lockedAsset.stopLossPrice?.toFixed(2)} (-{lockedAsset.maxLossPercent}%)</strong></span>
                </div>
              </div>
            )}

            {/* BUY / SELL ORDER SPLIT TOGGLE */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                background: 'var(--bg-input)',
                padding: '5px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <button
                type="button"
                onClick={() => setOrderType('BUY')}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  background: orderType === 'BUY'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'transparent',
                  color: orderType === 'BUY' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: orderType === 'BUY' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                  fontFamily: 'var(--font-brand)'
                }}
              >
                <TrendingUp size={16} /> BUY Order
              </button>

              <button
                type="button"
                onClick={() => setOrderType('SELL')}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  background: orderType === 'SELL'
                    ? 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)'
                    : 'transparent',
                  color: orderType === 'SELL' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: orderType === 'SELL' ? '0 4px 14px rgba(244, 63, 94, 0.4)' : 'none',
                  fontFamily: 'var(--font-brand)'
                }}
              >
                <TrendingDown size={16} /> SELL Order
              </button>
            </div>

            {/* LIVE ASSET SPOTLIGHT HUD CARD */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.9rem 1.15rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-brand)',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {symbol}
                  </span>
                  {liveQuote?.name && (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {liveQuote.name}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isPos ? 'var(--bull-green)' : 'var(--bear-red)'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Institutional Real-Time Execution (T+0)
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: isPos ? 'var(--bull-green)' : 'var(--text-primary)',
                    letterSpacing: '-0.02em'
                  }}
                >
                  ${price.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Position: <strong style={{ color: 'var(--text-primary)' }}>{currentHolding ? currentHolding.shares : 0}</strong> shares
                </div>
              </div>
            </div>

            {/* QUANTITY & SMART SIZING STEPPERS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Quantity of Shares / Contracts
                </label>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {[1, 5, 10, 50, 100].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleStepShares(step)}
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      +{step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stepper Input Row */}
              <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={() => handleStepShares(-1)}
                  style={{
                    width: '42px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Minus size={16} />
                </button>

                <input
                  type="number"
                  min="1"
                  required
                  className="input-field font-mono"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    height: '42px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => handleStepShares(1)}
                  style={{
                    width: '42px',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Percentage Allocators */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem', marginTop: '0.55rem' }}>
                {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.35rem',
                      borderRadius: '6px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleQuickPercent(pct)}
                  >
                    {pct === 1.0 ? 'MAX (100%)' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* INSTITUTIONAL FINANCIAL LEDGER & SAFE ZONE RESERVE */}
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>Account Cash Balance:</span>
                  <button
                    type="button"
                    onClick={() => setShowDepositModal(true)}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--bull-green)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.12rem 0.45rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    + Purchase Cash
                  </button>
                </span>
                <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  ${userCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--warning-amber)' }} />
                  Safe Zone Reserve:
                </span>
                <span className="font-mono" style={{ color: 'var(--warning-amber)', fontWeight: 700 }}>
                  ${minBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Safe Buying Power:</span>
                <span className="font-mono" style={{ color: safeTradingPower > 0 ? '#34d399' : '#f43f5e', fontWeight: 700 }}>
                  ${safeTradingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontWeight: 800,
                  fontSize: '0.96rem',
                  paddingTop: '0.45rem',
                  marginTop: '0.15rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>Estimated Value:</span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '1.18rem',
                    fontWeight: 800,
                    color: orderType === 'BUY' ? 'var(--bull-green)' : 'var(--accent-cyan)'
                  }}
                >
                  ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* SAFE ZONE PROTECTION ALERT (IF BREACHED) */}
            {isSafeZoneBreach && (
              <div
                style={{
                  padding: '0.75rem 0.95rem',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8rem',
                  color: 'var(--warning-amber)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800 }}>
                  <ShieldCheck size={16} /> Safe Zone Protection Active
                </div>
                <div style={{ lineHeight: 1.5 }}>
                  This trade of <strong>${totalCost.toFixed(2)}</strong> leaves <strong>${(userCash - totalCost).toFixed(2)}</strong>, which drops below your configured minimum safe reserve of <strong>${minBalance.toFixed(2)}</strong>.
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allowReserveBreach}
                    onChange={(e) => setAllowReserveBreach(e.target.checked)}
                    style={{ accentColor: 'var(--warning-amber)', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>Authorize Safe Zone Reserve Breach for this order</span>
                </label>
              </div>
            )}

            {/* HIGH-IMPACT COMMANDING CONFIRMATION BUTTON */}
            <button
              type="submit"
              className="pro-trade-confirm-btn"
              style={{
                width: '100%',
                padding: '0.85rem 1.15rem',
                borderRadius: '10px',
                border: 'none',
                cursor: (isSafeZoneBreach && !allowReserveBreach) ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                fontSize: '0.92rem',
                letterSpacing: '0.01em',
                fontFamily: 'var(--font-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                transition: 'all 0.2s ease',
                background: orderType === 'BUY'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                color: '#ffffff',
                boxShadow: orderType === 'BUY'
                  ? '0 6px 20px rgba(16, 185, 129, 0.4)'
                  : '0 6px 20px rgba(244, 63, 94, 0.4)',
                opacity: (isSafeZoneBreach && !allowReserveBreach) ? 0.65 : 1,
                flexShrink: 0,
                marginTop: '0.2rem',
                marginBottom: '0.25rem'
              }}
              disabled={loading || (isSafeZoneBreach && !allowReserveBreach)}
            >
              {loading ? (
                <span>Submitting to Direct DMA...</span>
              ) : (isSafeZoneBreach && !allowReserveBreach) ? (
                <span>⚠️ Exceeds Safe Reserve ($${minBalance.toFixed(2)})</span>
              ) : (
                <>
                  <span>
                    Confirm {orderType} {numShares} {symbol} • ${(totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Instant Cash Purchase Modal */}
      <DepositCashModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        currentCashBalance={userCash}
        onDepositSuccess={() => {
          if (onTradeComplete) onTradeComplete();
        }}
      />
    </div>
  );
}

export default TradeModal;
