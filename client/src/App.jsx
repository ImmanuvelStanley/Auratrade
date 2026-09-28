import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { Header } from './components/Header';
import { MarketRibbon } from './components/MarketRibbon';
import { LiveQuoteCard } from './components/LiveQuoteCard';
import { StockChart } from './components/StockChart';
import { WatchlistTable } from './components/WatchlistTable';
import { AlertManager } from './components/AlertManager';
import { PortfolioView } from './components/PortfolioView';
import { MarketPredictionCard } from './components/MarketPredictionCard';
import { QuickTradeWidget } from './components/QuickTradeWidget';
import { AIAssistant } from './components/AIAssistant';
import { AlertModal } from './components/AlertModal';
import { TradeModal } from './components/TradeModal';
import { AuthModal } from './components/AuthModal';
import { AllCompaniesMarket } from './components/AllCompaniesMarket';
import { MarketLeadersStrip } from './components/MarketLeadersStrip';
import { UserProfile } from './components/UserProfile';
import { AutoPredictorModal } from './components/AutoPredictorModal';
import { NSEIndiaMarketDesk } from './components/NSEIndiaMarketDesk';
import { GlobalIndicesDesk } from './components/GlobalIndicesDesk';
import { GoldSilverMarketDesk, GoldBarIcon } from './components/GoldSilverMarketDesk';
import { SecurityModal } from './components/SecurityModal';
import { WatchlistAlertsHub } from './components/WatchlistAlertsHub';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LayoutDashboard, Bookmark, BookmarkCheck, Bell, Briefcase, BrainCircuit, Globe, User, Flame, Landmark, Layers, Coins } from 'lucide-react';

export function App() {
  const { user, token } = useAuth();
  const { subscribe, unsubscribe, subscribeBatch } = useSocket();


  const [activeTab, setActiveTab] = useState('all-markets'); // 'all-markets' | 'dashboard' | 'gold-silver' | 'watchlist' | 'alerts' | 'portfolio' | 'profile' | 'nse-india' | 'global-indices'

  // When switching tabs, immediately realign scroll to top without delay
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  const [watchlistSymbols, setWatchlistSymbols] = useState(['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN']);
  const [alerts, setAlerts] = useState([]);
  const getPortfolioCacheKey = (userId) => `auratrade_portfolio_${userId || 'guest'}`;

  const [portfolio, setPortfolio] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auratrade_token');
      const saved = localStorage.getItem('auratrade_portfolio_cache');
      return saved ? JSON.parse(saved) : {
        cashBalance: 100000.00,
        investedValue: 0.00,
        totalPortfolioValue: 100000.00,
        totalUnrealizedPnL: 0.00,
        totalPnLPercent: 0.00,
        holdings: [],
        transactions: []
      };
    } catch (e) {
      return {
        cashBalance: 100000.00,
        investedValue: 0.00,
        totalPortfolioValue: 100000.00,
        totalUnrealizedPnL: 0.00,
        totalPnLPercent: 0.00,
        holdings: [],
        transactions: []
      };
    }
  });

  // Auto-Predictor & Profit-Lock State (strictly isolated per user)
  const getLockedAssetKey = (userId) => `auratrade_locked_asset_${userId || 'guest'}`;

  const [lockedAsset, setLockedAsset] = useState(() => {
    try {
      const key = getLockedAssetKey(user?.id);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAutoPredictorOpen, setIsAutoPredictorOpen] = useState(false);

  useEffect(() => {
    const key = getLockedAssetKey(user?.id);
    try {
      const saved = localStorage.getItem(key);
      setLockedAsset(saved ? JSON.parse(saved) : null);
    } catch (e) {
      setLockedAsset(null);
    }
  }, [user?.id]);

  const handleLockAsset = useCallback((asset) => {
    setLockedAsset(asset);
    try {
      const key = getLockedAssetKey(user?.id);
      localStorage.setItem(key, JSON.stringify(asset));
    } catch (e) {}
    if (asset?.symbol) {
      setActiveSymbol(asset.symbol);
    }
  }, [user?.id]);

  const handleUnlockAsset = useCallback(() => {
    setLockedAsset(null);
    try {
      const key = getLockedAssetKey(user?.id);
      localStorage.removeItem(key);
    } catch (e) {}
  }, [user?.id]);

  // Modals state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [tradeTargetSymbol, setTradeTargetSymbol] = useState('AAPL');
  const [resetTokenData, setResetTokenData] = useState(null);

  // Detect password reset link from email (e.g. ?action=reset-password&token=...&email=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const tokenParam = urlParams.get('token') || urlParams.get('resetToken');
      const emailParam = urlParams.get('email');

      if (action === 'reset-password' || tokenParam) {
        setResetTokenData({
          token: tokenParam || '',
          email: emailParam ? decodeURIComponent(emailParam) : ''
        });
        setIsAuthModalOpen(true);
      }
    } catch (e) {}
  }, []);

  const handleOpenAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const handleCloseAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setResetTokenData(null);
  }, []);
  const handleOpenProfile = useCallback(() => {
    if (!token) { setIsAuthModalOpen(true); return; }
    setActiveTab('profile');
  }, [token]);
  const handleOpenAlertModal = useCallback((sym) => {
    if (!token) { setIsAuthModalOpen(true); return; }
    if (sym && typeof sym === 'string') {
      setActiveSymbol(sym);
    }
    setIsAlertModalOpen(true);
  }, [token]);
  const handleCloseAlertModal = useCallback(() => setIsAlertModalOpen(false), []);
  const handleOpenAutoPredictor = useCallback(() => setIsAutoPredictorOpen(true), []);
  const handleCloseAutoPredictor = useCallback(() => setIsAutoPredictorOpen(false), []);
  const handleOpenAllMarkets = useCallback(() => setActiveTab('all-markets'), []);
  const handleCloseTradeModal = useCallback(() => setIsTradeModalOpen(false), []);

  // Load Watchlist from Server (supports both authenticated and guest/demo users)
  const loadWatchlist = useCallback(async () => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/watchlist', { headers });
      const json = await res.json();
      if (json.success && json.symbols) {
        setWatchlistSymbols(json.symbols);
      }
    } catch (e) {}
  }, [token]);

  // Load Alerts from Server
  const loadAlerts = useCallback(async () => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/alerts', { headers });
      const json = await res.json();
      if (json.success && json.alerts) {
        setAlerts(json.alerts);
      }
    } catch (e) {}
  }, [token]);

  // Load Portfolio from Server keyed strictly to current user token
  const loadPortfolio = useCallback(async () => {
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/portfolio', { headers });
      const json = await res.json();
      if (json.success && json.portfolio) {
        setPortfolio(json.portfolio);
        try {
          const cacheKey = getPortfolioCacheKey(user?.id);
          localStorage.setItem(cacheKey, JSON.stringify(json.portfolio));
        } catch (e) {}
      }
    } catch (e) {}
  }, [token, user?.id]);

  // Immediate switch to exact user ID balance upon user state update
  useEffect(() => {
    if (user?.id) {
      try {
        const userCache = localStorage.getItem(getPortfolioCacheKey(user.id));
        if (userCache) {
          setPortfolio(JSON.parse(userCache));
        } else if (user.cashBalance !== undefined) {
          setPortfolio(prev => ({
            ...prev,
            cashBalance: user.cashBalance,
            minBalance: user.minBalance !== undefined ? user.minBalance : (prev?.minBalance || 100)
          }));
        }
      } catch (e) {}
    } else {
      setPortfolio({
        cashBalance: 1000.00,
        investedValue: 0.00,
        totalPortfolioValue: 1000.00,
        totalUnrealizedPnL: 0.00,
        totalPnLPercent: 0.00,
        holdings: [],
        transactions: []
      });
    }
  }, [user?.id, user?.cashBalance]);

  // Handle global auth events for zero-delay balance sync
  useEffect(() => {
    const handleUserUpdate = (e) => {
      if (e.detail?.cashBalance !== undefined) {
        setPortfolio(prev => ({
          ...prev,
          cashBalance: e.detail.cashBalance,
          minBalance: e.detail.minBalance !== undefined ? e.detail.minBalance : prev?.minBalance
        }));
      }
      loadPortfolio();
    };
    const handleLogout = () => {
      setPortfolio({
        cashBalance: 1000.00,
        investedValue: 0.00,
        totalPortfolioValue: 1000.00,
        totalUnrealizedPnL: 0.00,
        totalPnLPercent: 0.00,
        holdings: [],
        transactions: []
      });
      setWatchlistSymbols(['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN']);
      setAlerts([]);
      setLockedAsset(null);
    };
    window.addEventListener('auratrade_user_updated', handleUserUpdate);
    window.addEventListener('auratrade_logout', handleLogout);
    return () => {
      window.removeEventListener('auratrade_user_updated', handleUserUpdate);
      window.removeEventListener('auratrade_logout', handleLogout);
    };
  }, [loadPortfolio]);

  useEffect(() => {
    loadWatchlist();
    loadAlerts();
    loadPortfolio();
    // Warm up precious metals cache in background immediately on site load
    fetch('/api/stocks/precious-metals')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          try {
            localStorage.setItem('auratrade_precious_metals_cache', JSON.stringify(json.data));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, [token, user?.id, loadWatchlist, loadAlerts, loadPortfolio]);

  // Subscribe to active symbol and watchlist batch
  useEffect(() => {
    subscribe(activeSymbol);
    if (watchlistSymbols.length > 0) {
      subscribeBatch(watchlistSymbols);
    }
  }, [activeSymbol, watchlistSymbols, subscribe, subscribeBatch]);

  // Watchlist Actions
  const handleAddToWatchlist = useCallback(async (symbol) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/watchlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol })
      });
      const json = await res.json();
      if (json.success && json.symbols) {
        setWatchlistSymbols(json.symbols);
        subscribe(symbol);
      }
    } catch (e) {}
  }, [token, subscribe]);

  const handleRemoveFromWatchlist = useCallback(async (symbol) => {
    if (!token) { setIsAuthModalOpen(true); return; }
    try {
      const res = await fetch('/api/watchlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ symbol })
      });
      const json = await res.json();
      if (json.success && json.symbols) {
        setWatchlistSymbols(json.symbols);
        unsubscribe(symbol);
      }
    } catch (e) {}
  }, [token, unsubscribe]);

  const handleToggleWatchlist = useCallback(() => {
    if (watchlistSymbols.includes(activeSymbol)) {
      handleRemoveFromWatchlist(activeSymbol);
    } else {
      handleAddToWatchlist(activeSymbol);
    }
  }, [activeSymbol, watchlistSymbols, handleRemoveFromWatchlist, handleAddToWatchlist]);

  // Alert Actions
  const handleToggleAlert = useCallback(async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/alerts/${id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        loadAlerts();
      }
    } catch (e) {}
  }, [token, loadAlerts]);

  const handleDeleteAlert = useCallback(async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        loadAlerts();
      }
    } catch (e) {}
  }, [token, loadAlerts]);

  const handleOpenTrade = useCallback((sym) => {
    if (!token) { setIsAuthModalOpen(true); return; }
    setTradeTargetSymbol(sym || activeSymbol);
    setIsTradeModalOpen(true);
  }, [activeSymbol, token]);

  const handleSelectSymbol = useCallback((sym) => {
    setActiveSymbol(sym);
  }, []);

  const handleSelectSymbolAndGoDashboard = useCallback((sym) => {
    setActiveSymbol(sym);
    setActiveTab('dashboard');
  }, []);

  const isInWatchlist = watchlistSymbols.includes(activeSymbol);

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Header
        onOpenAuthModal={handleOpenAuthModal}
        onOpenProfile={handleOpenProfile}
        portfolioCash={portfolio?.cashBalance}
      />

      {/* Market Indices Ribbon (Ticker Tape) */}
      <MarketRibbon onSelectSymbol={handleSelectSymbol} />

      {/* Main Container */}
      <main className="main-content">
        {/* Desk Navigation Tabs */}
        <div className="workstation-action-bar">
          {/* Navigation Segments / Quick Desk Views */}
          <div className="tab-list">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'all-markets' ? 'active' : ''}`}
              onClick={() => setActiveTab('all-markets')}
            >
              <Layers size={16} /> All Companies Market
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} /> Workstation
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'nse-india' ? 'active' : ''}`}
              onClick={() => setActiveTab('nse-india')}
            >
              <Landmark size={16} /> NSE Indian Market
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'global-indices' ? 'active' : ''}`}
              onClick={() => setActiveTab('global-indices')}
            >
              <Globe size={16} /> Global Major Indices
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'gold-silver' ? 'active' : ''}`}
              onClick={() => setActiveTab('gold-silver')}
            >
              <GoldBarIcon size={16} /> Gold & Silver Market
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'watchlist-alerts' || activeTab === 'watchlist' || activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => { if (!token) { setIsAuthModalOpen(true); return; } setActiveTab('watchlist-alerts'); }}
            >
              <BookmarkCheck size={16} /> Watchlist & Price Alerts
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => { if (!token) { setIsAuthModalOpen(true); return; } setActiveTab('portfolio'); }}
            >
              <Briefcase size={16} /> Paper Trading ($1,000)
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { if (!token) { setIsAuthModalOpen(true); return; } setActiveTab('profile'); }}
            >
              <User size={16} /> Trader Profile
            </button>
          </div>
        </div>

        {/* Conditional Tab Rendering - Protected with Tab-Level Error Boundary */}
        <ErrorBoundary key={activeTab}>
          {activeTab === 'dashboard' && (
            <div className="motion-entry" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0 }}>
              {/* Horizontal Market Leaders Ranked by Market Cap */}
              <MarketLeadersStrip
                activeSymbol={activeSymbol}
                onSelectSymbol={handleSelectSymbol}
                onOpenAllMarkets={handleOpenAllMarkets}
              />

              {/* Upper Workstation Row: Charting Mainstage (Left) + Trading Desk Sidebar (Right) */}
              <div className="dashboard-grid">
                {/* Left Column: Spotlight Live Quote & Interactive Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
                  <LiveQuoteCard
                    symbol={activeSymbol}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onOpenAlertModal={handleOpenAlertModal}
                    onOpenTradeModal={handleOpenTrade}
                  />

                  <StockChart
                    symbol={activeSymbol}
                    lockedAsset={lockedAsset}
                    onUnlockAsset={handleUnlockAsset}
                    onOpenAutoPredictor={handleOpenAutoPredictor}
                    onOpenTradeModal={handleOpenTrade}
                  />
                </div>

                {/* Right Column: Quick Trading Desk + Compact Live Watchlist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
                  <QuickTradeWidget
                    symbol={activeSymbol}
                    portfolio={portfolio}
                    onOpenTradeModal={handleOpenTrade}
                    onTradeComplete={loadPortfolio}
                  />

                  <WatchlistTable
                    watchlistSymbols={watchlistSymbols}
                    activeSymbol={activeSymbol}
                    compact={true}
                    alerts={alerts}
                    onSelectSymbol={handleSelectSymbol}
                    onAddToWatchlist={handleAddToWatchlist}
                    onRemoveFromWatchlist={handleRemoveFromWatchlist}
                    onOpenAlertModal={handleOpenAlertModal}
                  />
                </div>
              </div>

              {/* Lower Workstation Row: Full-Width Panoramic Market Prediction & Future Valuation */}
              <div className="perf-section" style={{ padding: 0 }}>
                <MarketPredictionCard
                  symbol={activeSymbol}
                  lockedAsset={lockedAsset}
                  onLockAsset={handleLockAsset}
                  onUnlockAsset={handleUnlockAsset}
                  onOpenAutoPredictor={handleOpenAutoPredictor}
                />
              </div>
            </div>
          )}

          {activeTab === 'all-markets' && (
            <AllCompaniesMarket
              isActive={true}
              onSelectSymbol={handleSelectSymbolAndGoDashboard}
              onOpenTradeModal={handleOpenTrade}
              onOpenAlertModal={handleOpenAlertModal}
              watchlistSymbols={watchlistSymbols}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
            />
          )}

          {activeTab === 'gold-silver' && (
            <GoldSilverMarketDesk
              onSelectSymbol={handleSelectSymbolAndGoDashboard}
              onOpenTradeModal={handleOpenTrade}
              onOpenAlertModal={handleOpenAlertModal}
              isActive={true}
            />
          )}

          {(activeTab === 'watchlist-alerts' || activeTab === 'watchlist' || activeTab === 'alerts') && (
            <WatchlistAlertsHub
              watchlistSymbols={watchlistSymbols}
              activeSymbol={activeSymbol}
              alerts={alerts}
              onSelectSymbol={handleSelectSymbolAndGoDashboard}
              onAddToWatchlist={handleAddToWatchlist}
              onRemoveFromWatchlist={handleRemoveFromWatchlist}
              onToggleAlert={handleToggleAlert}
              onDeleteAlert={handleDeleteAlert}
              onOpenCreateAlertModal={handleOpenAlertModal}
              onOpenTradeModal={handleOpenTrade}
              initialViewMode={activeTab === 'alerts' ? 'alerts' : (activeTab === 'watchlist' ? 'watchlist' : 'dual')}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioView
              portfolio={portfolio}
              onOpenTradeModal={handleOpenTrade}
            />
          )}

          {activeTab === 'profile' && (
            <UserProfile
              portfolio={portfolio}
              watchlistSymbols={watchlistSymbols}
              alerts={alerts}
              onSelectSymbol={handleSelectSymbolAndGoDashboard}
              onOpenTradeModal={handleOpenTrade}
              onResetPortfolio={loadPortfolio}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'nse-india' && (
            <NSEIndiaMarketDesk
              isActive={true}
              onSelectSymbol={handleSelectSymbolAndGoDashboard}
            />
          )}

          {activeTab === 'global-indices' && (
            <GlobalIndicesDesk
              isActive={true}
              onSelectSymbol={handleSelectSymbolAndGoDashboard}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Global Institutional Footer & Copyright */}
      <Footer
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAutoPredictor={handleOpenAutoPredictor}
        onOpenTradeModal={() => {
          setTradeTargetSymbol(activeSymbol || 'AAPL');
          setIsTradeModalOpen(true);
        }}
        onOpenAlertModal={() => {
          handleOpenAlertModal(activeSymbol || 'AAPL');
        }}
      />

      {/* Modals */}
      {isAlertModalOpen && (
        <AlertModal
          symbol={activeSymbol}
          onClose={handleCloseAlertModal}
          onAlertCreated={(newAlert) => {
            setAlerts((prev) => [newAlert, ...prev]);
          }}
        />
      )}

      {isTradeModalOpen && (
        <TradeModal
          defaultSymbol={tradeTargetSymbol}
          portfolio={portfolio}
          user={user}
          onClose={handleCloseTradeModal}
          onTradeComplete={loadPortfolio}
          lockedAsset={lockedAsset}
        />
      )}

      {/* AI Auto Predictor & Profit-Lock Modal */}
      <AutoPredictorModal
        isOpen={isAutoPredictorOpen}
        onClose={handleCloseAutoPredictor}
        onLockAsset={handleLockAsset}
        activeLockedAsset={lockedAsset}
        onSelectSymbol={handleSelectSymbolAndGoDashboard}
      />

      {isAuthModalOpen && (
        <AuthModal
          onClose={handleCloseAuthModal}
          initialResetData={resetTokenData}
        />
      )}

      {/* Autonomous Cyber Security Defense Center Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Floating AI Trading Advisor */}
      <AIAssistant
        activeSymbol={activeSymbol}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onOpenTrade={(sym) => {
          if (sym) setActiveSymbol(sym);
          setIsTradeModalOpen(true);
        }}
        onOpenAutoPredictor={() => setIsAutoPredictorOpen(true)}
      />
    </div>
  );
}

export default App;
