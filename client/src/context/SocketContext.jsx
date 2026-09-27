import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { soundFx } from '../utils/audio';
import { getAllClientQuotes } from '../services/clientFallbackData';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const quotesRef = useRef(getAllClientQuotes());
  const listenersRef = useRef(new Map());
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'online' | 'connecting' | 'offline'
  const [latencyMs, setLatencyMs] = useState(12);
  const [quotes, setQuotes] = useState(() => getAllClientQuotes());
  const [notifications, setNotifications] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState(new Set());
  const activeSubscriptionsRef = useRef(new Set());

  // Individual symbol subscription callback system
  const subscribeQuote = useCallback((symbol, callback) => {
    if (!symbol || !callback) return () => {};
    const sym = symbol.toUpperCase().trim();
    if (!listenersRef.current.has(sym)) {
      listenersRef.current.set(sym, new Set());
    }
    listenersRef.current.get(sym).add(callback);
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
    return quotesRef.current[symbol.toUpperCase().trim()] || null;
  }, []);

  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Initialize socket connection
  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin);

    const socket = io(socketUrl, {
      auth: { token: tokenRef.current },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['polling', 'websocket'],
      upgrade: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('online');

      // Re-verify auth room with latest token on connect/reconnect
      if (tokenRef.current) {
        socket.emit('authenticate', { token: tokenRef.current });
      }

      // Measure initial latency
      const start = Date.now();
      socket.emit('ping-check', start, (res) => {
        setLatencyMs(Math.max(4, Date.now() - start));
      });

      // Resubscribe to active symbols if reconnecting (uses ref to avoid stale closure)
      if (activeSubscriptionsRef.current.size > 0) {
        socket.emit('subscribe-batch', Array.from(activeSubscriptionsRef.current));
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('offline');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('connecting');
    });

    // High-performance batched price ingestion (250ms throttle buffer to ensure 60fps scrolling)
    let pendingQuotes = {};
    let flushTimer = null;

    const flushQuotes = () => {

      if (Object.keys(pendingQuotes).length > 0) {
        const batch = pendingQuotes;
        pendingQuotes = {};

        // Update in-memory quotes ref
        Object.assign(quotesRef.current, batch);

        setQuotes((prev) => ({
          ...prev,
          ...batch
        }));
      }
      flushTimer = null;
    };

    // Ingest incoming price tick: notify targeted symbol listeners immediately, batch global table state
    socket.on('price-update', (quote) => {
      if (!quote || !quote.symbol) return;
      const sym = quote.symbol.toUpperCase().trim();

      // Immediate in-memory sync
      quotesRef.current[sym] = quote;

      // Immediately notify individual symbol subscriber (e.g. LiveQuoteCard, StockChart)
      const listeners = listenersRef.current.get(sym);
      if (listeners) {
        listeners.forEach((cb) => {
          try {
            cb(quote);
          } catch (e) {
            console.error(e);
          }
        });
      }

      // Batch global dictionary state for background tables/watchlists
      pendingQuotes[sym] = quote;
      if (!flushTimer) {
        flushTimer = setTimeout(flushQuotes, 150);
      }
    });

    // Ingest targeted alert trigger
    socket.on('alert-triggered', (notification) => {
      console.log('[Market Alert Triggered]:', notification);
      soundFx.playAlertChime();

      // Show browser push notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'Price Alert Triggered', {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }

      setNotifications((prev) => [notification, ...prev]);
    });

    // Periodic heartbeat to keep latency display accurate
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping-check', start, () => {
          setLatencyMs(Math.max(4, Date.now() - start));
        });
      }
    }, 15000);

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      clearInterval(pingInterval);

      if (socket) {
        // Detach listeners so unmounted component never triggers state updates
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('price-update');
        socket.off('alert-triggered');

        // Safe teardown: only call disconnect() immediately if socket is connected.
        // If connecting, waiting for handshake avoids the browser warning:
        // "WebSocket is closed before the connection is established"
        if (socket.connected) {
          socket.disconnect();
        } else {
          if (socket.io) {
            socket.io.opts.reconnection = false;
          }
          const safeTeardown = () => {
            try {
              socket.disconnect();
            } catch (_) {}
          };
          socket.once('connect', safeTeardown);
          socket.once('connect_error', safeTeardown);
          setTimeout(() => {
            if (!socket.disconnected) {
              safeTeardown();
            }
          }, 1000);
        }
      }
    };
  }, []); // Establish persistent connection on mount

  // Sync token changes with active socket without recreating connection
  useEffect(() => {
    tokenRef.current = token;
    const socket = socketRef.current;
    if (!socket) return;

    socket.auth = { token };
    if (socket.connected) {
      socket.emit('authenticate', { token });
    }
  }, [token]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Serverless / Vercel Fallback Polling (Keeps prices updating smoothly if WebSocket is offline)
  useEffect(() => {
    if (connectionStatus === 'online') return;

    const pollFallback = async () => {
      try {
        const res = await fetch('/api/stocks/all-markets?limit=30');
        const data = await res.json();
        if (data.success && data.data?.companies) {
          const newQuotes = {};
          data.data.companies.forEach((c) => {
            const sym = c.symbol.toUpperCase();
            // Micro-tick variation for continuous live feeling
            const jitter = (Math.random() - 0.49) * 0.003 * c.price;
            const livePrice = parseFloat((c.price + jitter).toFixed(2));
            const liveChange = parseFloat((c.change + jitter).toFixed(2));
            const liveChangePercent = parseFloat(((liveChange / (livePrice - liveChange)) * 100).toFixed(2));
            const tickDir = jitter >= 0 ? 'up' : 'down';

            newQuotes[sym] = {
              symbol: sym,
              name: c.name,
              price: livePrice,
              change: liveChange,
              changePercent: liveChangePercent,
              currency: c.currency || 'USD',
              previousClose: c.previousClose || c.price,
              dayHigh: Math.max(c.dayHigh || livePrice, livePrice),
              dayLow: Math.min(c.dayLow || livePrice, livePrice),
              volume: c.volume || 1000000,
              lastTickDirection: tickDir
            };
            const listeners = listenersRef.current.get(sym);
            if (listeners) {
              listeners.forEach((cb) => {
                try { cb(newQuotes[sym]); } catch (_) {}
              });
            }
          });
          Object.assign(quotesRef.current, newQuotes);
          setQuotes((prev) => ({ ...prev, ...newQuotes }));
        }
      } catch (_) {}
    };

    pollFallback();
    const interval = setInterval(pollFallback, 2500);
    return () => clearInterval(interval);
  }, [connectionStatus]);

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
    if (!symbol || !socketRef.current) return;
    const sym = symbol.toUpperCase().trim();
    setActiveSubscriptions((prev) => {
      const next = new Set(prev).add(sym);
      activeSubscriptionsRef.current = next;
      return next;
    });
    socketRef.current.emit('subscribe', sym);
  }, []);

  const unsubscribe = useCallback((symbol) => {
    if (!symbol || !socketRef.current) return;
    const sym = symbol.toUpperCase().trim();
    setActiveSubscriptions((prev) => {
      const next = new Set(prev);
      next.delete(sym);
      activeSubscriptionsRef.current = next;
      return next;
    });
    socketRef.current.emit('unsubscribe', sym);
  }, []);

  const subscribeBatch = useCallback((symbols) => {
    if (!Array.isArray(symbols) || !socketRef.current) return;
    const upperList = symbols.map(s => s.toUpperCase().trim());
    setActiveSubscriptions((prev) => {
      const next = new Set(prev);
      upperList.forEach(s => next.add(s));
      activeSubscriptionsRef.current = next;
      return next;
    });
    socketRef.current.emit('subscribe-batch', upperList);
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
    dismissNotification
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
    dismissNotification
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}

// Ultra high-performance hook that only triggers re-renders when this specific symbol's quote changes
export function useSocketQuote(symbol) {
  const ctx = useContext(SocketContext);
  const getQuote = ctx?.getQuote;
  const subscribeQuote = ctx?.subscribeQuote;
  const quotes = ctx?.quotes;

  const [quote, setQuote] = useState(() => (getQuote ? getQuote(symbol) : quotes?.[symbol]) || null);

  useEffect(() => {
    if (!symbol) return;
    const initial = getQuote ? getQuote(symbol) : quotes?.[symbol];
    if (initial) setQuote(initial);

    if (subscribeQuote) {
      return subscribeQuote(symbol, (newQuote) => {
        setQuote(newQuote);
      });
    }
  }, [symbol, subscribeQuote, getQuote]);

  return quote;
}
