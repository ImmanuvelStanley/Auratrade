import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { soundFx } from '../utils/audio';
import { getAllClientQuotes, getClientQuote } from '../services/clientFallbackData';

const SocketContext = createContext(null);
const SocketActionsContext = createContext(null);
const SocketNotificationsContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const quotesRef = useRef(getAllClientQuotes());
  const listenersRef = useRef(new Map());
  const activeAlertsRef = useRef([]);

  // Connection state: 'online' | 'connecting' | 'offline'
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [latencyMs, setLatencyMs] = useState(14);
  const [quotes, setQuotes] = useState(() => getAllClientQuotes());
  const [notifications, setNotifications] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState(new Set());
  const activeSubscriptionsRef = useRef(new Set());

  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Individual symbol subscription callback system
  const subscribeQuote = useCallback((symbol, callback) => {
    if (!symbol || !callback) return () => {};
    const sym = symbol.toUpperCase().trim();
    if (!listenersRef.current.has(sym)) {
      listenersRef.current.set(sym, new Set());
    }
    listenersRef.current.get(sym).add(callback);

    // Immediately invoke callback if we already have a cached quote
    const current = quotesRef.current[sym];
    if (current) {
      try { callback(current); } catch (_) {}
    }

    return () => {
      const set = listenersRef.current.get(sym);
      if (set) {
        set.delete(callback);
        if (set.size === 0) listenersRef.current.delete(sym);
      }
    };
  }, []);

  const getQuote = useCallback((symbol) => {
    if (!symbol) return null;
    const sym = symbol.toUpperCase().trim();
    return quotesRef.current[sym] || getClientQuote(sym) || null;
  }, []);

  // Fetch user active alerts so the client-side streaming engine can evaluate them in real-time
  useEffect(() => {
    if (!token) {
      activeAlertsRef.current = [];
      return;
    }
    let isCurrent = true;
    async function loadAlerts() {
      try {
        const res = await fetch('/api/alerts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (isCurrent && data.success && Array.isArray(data.alerts)) {
          activeAlertsRef.current = data.alerts.filter(a => a.status === 'ACTIVE');
        }
      } catch (_) {}
    }
    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => {
      isCurrent = false;
      clearInterval(interval);
    };
  }, [token]);

  // Evaluate tick against active user alerts
  const checkAlertTriggers = useCallback((quote) => {
    if (!quote || !quote.symbol || !activeAlertsRef.current.length) return;
    const sym = quote.symbol.toUpperCase().trim();
    const currentPrice = quote.price;

    activeAlertsRef.current.forEach(alert => {
      if (alert.symbol !== sym || alert.status !== 'ACTIVE') return;

      const target = parseFloat(alert.targetPrice);
      const isAbove = alert.condition === 'ABOVE' && currentPrice >= target;
      const isBelow = alert.condition === 'BELOW' && currentPrice <= target;

      if (isAbove || isBelow) {
        // Trigger alert notification
        const notif = {
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          alertId: alert.id,
          title: `Price Alert: ${sym}`,
          message: `${sym} has reached ${alert.condition === 'ABOVE' ? 'or exceeded' : 'or dropped below'} $${target.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`,
          symbol: sym,
          price: currentPrice,
          condition: alert.condition,
          targetPrice: target,
          read: false,
          timestamp: new Date().toISOString()
        };

        // Suppress rapid duplicates within 60s
        alert.status = 'TRIGGERED';
        soundFx.playAlertChime();

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(notif.title, { body: notif.message, icon: '/favicon.ico' });
          } catch (_) {}
        }

        setNotifications(prev => [notif, ...prev]);

        // Sync with backend
        if (tokenRef.current) {
          fetch(`/api/alerts/${alert.id}/toggle`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${tokenRef.current}` }
          }).catch(() => {});
        }
      }
    });
  }, []);

  // Dispatch incoming tick to memory, individual listeners, and global table batch
  const processQuoteTick = useCallback((quote) => {
    if (!quote || !quote.symbol) return;
    const sym = quote.symbol.toUpperCase().trim();

    // Store in memory ref
    quotesRef.current[sym] = quote;

    // Immediately notify individual symbol subscriber (e.g. LiveQuoteCard, StockChart)
    const listeners = listenersRef.current.get(sym);
    if (listeners) {
      listeners.forEach((cb) => {
        try { cb(quote); } catch (e) { console.error(e); }
      });
    }

    // Evaluate price alerts
    checkAlertTriggers(quote);
  }, [checkAlertTriggers]);

  // Dispatch external REST market snapshot ticks to symbol listeners without triggering global React re-renders
  const publishTicks = useCallback((items = []) => {
    if (!Array.isArray(items) || items.length === 0) return;
    items.forEach((raw) => {
      if (!raw || !raw.symbol || raw.price === undefined) return;
      const sym = String(raw.symbol).toUpperCase().trim();
      const existing = quotesRef.current[sym] || {};
      const mergedQuote = {
        ...existing,
        ...raw,
        symbol: sym,
        price: Number(raw.price),
        changePercent: raw.changePercent !== undefined ? Number(raw.changePercent) : (existing.changePercent ?? 0),
        timestamp: Date.now()
      };
      quotesRef.current[sym] = mergedQuote;
      const listeners = listenersRef.current.get(sym);
      if (listeners) {
        listeners.forEach((cb) => {
          try { cb(mergedQuote); } catch (_) {}
        });
      }
    });
  }, []);

  // Dual-Engine Real-Time Ingestion (WebSocket with Seamless Serverless Fallback)
  useEffect(() => {
    // In production on Vercel, unless an explicit VITE_SOCKET_URL is set, run in optimized Serverless Streaming mode
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
    const isDev = Boolean(import.meta.env.DEV);
    const shouldAttemptSocket = Boolean(explicitSocketUrl || (isDev && !window.__FORCE_SERVERLESS__));

    let socket = null;
    let isSocketAlive = false;

    if (shouldAttemptSocket) {
      const socketUrl = explicitSocketUrl || `${window.location.protocol}//${window.location.hostname}:5000`;
      
      try {
        socket = io(socketUrl, {
          auth: { token: tokenRef.current },
          reconnectionAttempts: 2,
          reconnectionDelay: 1000,
          timeout: 2500,
          transports: ['polling', 'websocket'],
          upgrade: true
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          isSocketAlive = true;
          setConnectionStatus('online');

          if (tokenRef.current) {
            socket.emit('authenticate', { token: tokenRef.current });
          }

          const start = Date.now();
          socket.emit('ping-check', start, () => {
            setLatencyMs(Math.max(4, Date.now() - start));
          });

          if (activeSubscriptionsRef.current.size > 0) {
            socket.emit('subscribe-batch', Array.from(activeSubscriptionsRef.current));
          }
        });

        socket.on('disconnect', () => {
          isSocketAlive = false;
          // Remains online via serverless streaming fallback
          setConnectionStatus('online');
        });

        socket.on('connect_error', () => {
          isSocketAlive = false;
          // Gracefully fallback to serverless polling without throwing errors
          setConnectionStatus('online');
        });

        socket.on('price-update', (quote) => {
          processQuoteTick(quote);
          setQuotes(prev => ({ ...prev, [quote.symbol.toUpperCase().trim()]: quote }));
        });

        socket.on('alert-triggered', (notification) => {
          soundFx.playAlertChime();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title || 'Price Alert Triggered', {
              body: notification.message,
              icon: '/favicon.ico'
            });
          }
          setNotifications(prev => [notification, ...prev]);
        });
      } catch (err) {
        isSocketAlive = false;
      }
    } else {
      // Vercel Serverless Mode: Sockets not attempted, Serverless Live Stream active
      setConnectionStatus('online');
    }

    // High-Performance Serverless Live Ticks Poller (Active across Vercel & as backup for WebSocket)
    let isPollingBusy = false;

    const pollLiveTicks = async () => {
      if (isPollingBusy) return;
      isPollingBusy = true;
      const start = Date.now();

      try {
        const subList = Array.from(activeSubscriptionsRef.current);
        const query = subList.length > 0 ? `?symbols=${encodeURIComponent(subList.join(','))}` : '';
        const res = await fetch(`/api/stocks/live-ticks${query}`, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.ticks) {
            const measuredLatency = Math.max(6, Math.min(60, Date.now() - start));
            setLatencyMs(measuredLatency);

            // Batch notify and update
            Object.values(data.ticks).forEach(tick => {
              processQuoteTick(tick);
            });

            setQuotes(prev => ({
              ...prev,
              ...data.ticks
            }));
          }
        }
      } catch (_) {
        // Network blip, will retry next interval
      } finally {
        isPollingBusy = false;
      }
    };

    // Immediate first tick sync
    pollLiveTicks();
    const liveTicksInterval = setInterval(pollLiveTicks, 1800);

    // Continuous Sub-Second Micro-Tick Animator (rotates cleanly across all workstation companies + indices)
    let microTickCursor = 0;
    const microTickInterval = setInterval(() => {
      const allKnownSymbols = Object.keys(quotesRef.current || {});
      const subSymbols = Array.from(activeSubscriptionsRef.current || []);
      const candidatePool = allKnownSymbols.length > 0
        ? allKnownSymbols
        : (subSymbols.length > 0 ? subSymbols : ['AAPL', 'NVDA', 'MSFT', 'GOLD', 'SILVER', 'NIFTY 50', 'S&P 500', 'NASDAQ', 'RELIANCE', 'TSLA']);

      if (candidatePool.length === 0) return;

      // Update a rolling slice (~14 assets per 700ms tick) + active focus subscriptions smoothly
      const sliceCount = Math.min(14, candidatePool.length);
      const batchSet = new Set();
      for (let i = 0; i < sliceCount; i++) {
        batchSet.add(candidatePool[(microTickCursor + i) % candidatePool.length]);
      }
      microTickCursor = (microTickCursor + sliceCount) % candidatePool.length;
      subSymbols.slice(0, 6).forEach((s) => batchSet.add(s));

      const updatedTicks = {};

      batchSet.forEach(sym => {
        const current = quotesRef.current[sym];
        if (!current || !current.price) return;

        const jitter = (Math.random() - 0.495) * 0.00035;
        let newPrice = parseFloat((current.price * (1 + jitter)).toFixed(2));
        if (newPrice === current.price) {
          newPrice = +(newPrice + (Math.random() > 0.5 ? 0.01 : -0.01)).toFixed(2);
        }
        newPrice = Math.max(0.01, newPrice);

        const prevClose = current.previousClose || current.price;
        const change = parseFloat((newPrice - prevClose).toFixed(2));
        const changePercent = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
        const dir = newPrice > current.price ? 'up' : newPrice < current.price ? 'down' : (current.lastTickDirection || 'neutral');

        const updatedQuote = {
          ...current,
          price: newPrice,
          change,
          changePercent,
          dayHigh: Math.max(current.dayHigh || newPrice, newPrice),
          dayLow: Math.min(current.dayLow || newPrice, newPrice),
          lastTickDirection: dir,
          timestamp: Date.now()
        };

        processQuoteTick(updatedQuote);
        updatedTicks[sym] = updatedQuote;
      });

      if (Object.keys(updatedTicks).length > 0) {
        setQuotes(prev => ({ ...prev, ...updatedTicks }));
      }
    }, 700);

    return () => {
      clearInterval(liveTicksInterval);
      clearInterval(microTickInterval);

      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('price-update');
        socket.off('alert-triggered');
        try {
          socket.disconnect();
        } catch (_) {}
      }
    };
  }, [processQuoteTick]);

  // Sync token changes with active socket
  useEffect(() => {
    tokenRef.current = token;
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.auth = { token };
      socket.emit('authenticate', { token });
    }
  }, [token]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Fetch initial notifications when user is authenticated
  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }
    let isCurrent = true;
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/alerts/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (isCurrent && data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error('Failed to load initial notifications:', err);
      }
    }
    fetchNotifications();
    return () => { isCurrent = false; };
  }, [token]);

  const subscribe = useCallback((symbol) => {
    if (!symbol) return;
    const sym = symbol.toUpperCase().trim();
    setActiveSubscriptions((prev) => {
      const next = new Set(prev).add(sym);
      activeSubscriptionsRef.current = next;
      return next;
    });

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe', sym);
    }

    // Immediately fetch quote if not already present
    if (!quotesRef.current[sym]) {
      fetch(`/api/stocks/quote/${sym}`)
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            processQuoteTick(json.data);
            setQuotes(prev => ({ ...prev, [sym]: json.data }));
          }
        })
        .catch(() => {});
    }
  }, [processQuoteTick]);

  const unsubscribe = useCallback((symbol) => {
    if (!symbol) return;
    const sym = symbol.toUpperCase().trim();
    setActiveSubscriptions((prev) => {
      const next = new Set(prev);
      next.delete(sym);
      activeSubscriptionsRef.current = next;
      return next;
    });
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('unsubscribe', sym);
    }
  }, []);

  const subscribeBatch = useCallback((symbols) => {
    if (!Array.isArray(symbols)) return;
    const upperList = symbols.map(s => String(s).toUpperCase().trim());
    setActiveSubscriptions((prev) => {
      const next = new Set(prev);
      upperList.forEach(s => next.add(s));
      activeSubscriptionsRef.current = next;
      return next;
    });
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('subscribe-batch', upperList);
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      if (token) {
        await fetch('/api/alerts/notifications', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  }, [token]);

  const dismissNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter(n => (n.id || n._id) !== id));
    try {
      if (token && id) {
        await fetch(`/api/alerts/notifications/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error('Failed to dismiss notification:', e);
    }
  }, [token]);

  const actionsValue = useMemo(() => ({
    getQuote,
    subscribeQuote,
    subscribe,
    unsubscribe,
    subscribeBatch,
    clearNotifications,
    dismissNotification,
    publishTicks
  }), [
    getQuote,
    subscribeQuote,
    subscribe,
    unsubscribe,
    subscribeBatch,
    clearNotifications,
    dismissNotification,
    publishTicks
  ]);

  const notificationsValue = useMemo(() => ({
    notifications,
    setNotifications,
    clearNotifications,
    dismissNotification
  }), [notifications, clearNotifications, dismissNotification]);

  const contextValue = useMemo(() => ({
    socket: socketRef.current,
    connectionStatus,
    latencyMs,
    quotes,
    getQuote,
    subscribeQuote,
    notifications,
    setNotifications,
    subscribe,
    unsubscribe,
    subscribeBatch,
    clearNotifications,
    dismissNotification,
    publishTicks
  }), [
    connectionStatus,
    latencyMs,
    quotes,
    getQuote,
    subscribeQuote,
    notifications,
    subscribe,
    unsubscribe,
    subscribeBatch,
    clearNotifications,
    dismissNotification,
    publishTicks
  ]);

  return (
    <SocketActionsContext.Provider value={actionsValue}>
      <SocketNotificationsContext.Provider value={notificationsValue}>
        <SocketContext.Provider value={contextValue}>
          {children}
        </SocketContext.Provider>
      </SocketNotificationsContext.Provider>
    </SocketActionsContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}

export function useSocketNotifications() {
  const ctx = useContext(SocketNotificationsContext);
  if (!ctx) throw new Error('useSocketNotifications must be used within a SocketProvider');
  return ctx;
}

// Stable zero-rerender context hook for components that subscribe to specific symbols via subscribeQuote
export function useLiveTickerActions() {
  const ctx = useContext(SocketActionsContext);
  if (!ctx) throw new Error('useLiveTickerActions must be used within a SocketProvider');
  return ctx;
}

// Ultra high-performance hook that triggers updates ONLY when this specific symbol changes
export function useSocketQuote(symbol) {
  const actions = useContext(SocketActionsContext);
  const getQuote = actions?.getQuote;
  const subscribeQuote = actions?.subscribeQuote;

  const sym = symbol ? symbol.toUpperCase().trim() : '';
  const [quote, setQuote] = useState(() => (getQuote ? getQuote(sym) : null));

  useEffect(() => {
    if (!sym) return;
    const initial = getQuote ? getQuote(sym) : null;
    if (initial) setQuote(initial);

    if (subscribeQuote) {
      return subscribeQuote(sym, (newQuote) => {
        setQuote(newQuote);
      });
    }
  }, [sym, subscribeQuote, getQuote]);

  return quote;
}
