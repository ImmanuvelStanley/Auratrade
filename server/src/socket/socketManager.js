const jwt = require('jsonwebtoken');
const config = require('../config');
const cacheService = require('../services/cacheService');
const marketDataService = require('../services/marketDataService');

function setupSocketManager(io) {
  // Optional Handshake auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
      } catch (err) {
        // Allow unauthenticated connection for public price ticker, but without user room
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // If authenticated, join user-specific private room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Dynamic authentication for persistent socket connections
    socket.on('authenticate', (data) => {
      const token = data?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwtSecret);
          socket.userId = decoded.userId;
          socket.userEmail = decoded.email;
          socket.join(`user:${socket.userId}`);
          socket.emit('authenticated', { success: true, userId: socket.userId });
        } catch (err) {
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      } else {
        if (socket.userId) {
          socket.leave(`user:${socket.userId}`);
          socket.userId = null;
          socket.userEmail = null;
        }
      }
    });

    // Single Symbol Subscription
    socket.on('subscribe', async (symbol) => {
      if (!symbol || typeof symbol !== 'string') return;
      const sym = symbol.toUpperCase().trim();
      socket.join(sym);

      // Register symbol in active set
      await cacheService.sadd('active_symbols', sym);

      // Immediately return cached or fresh quote so user doesn't wait for next poll tick
      try {
        const cachedRaw = await cacheService.get(`price:${sym}`);
        if (cachedRaw) {
          socket.emit('price-update', JSON.parse(cachedRaw));
        } else {
          const fresh = await marketDataService.getQuote(sym);
          socket.emit('price-update', fresh);
        }
      } catch (e) {}
    });

    // Batch Subscription (for watchlists)
    socket.on('subscribe-batch', async (symbols) => {
      if (!Array.isArray(symbols)) return;
      for (const rawSym of symbols) {
        if (typeof rawSym === 'string') {
          const sym = rawSym.toUpperCase().trim();
          socket.join(sym);
          await cacheService.sadd('active_symbols', sym);

          try {
            const cachedRaw = await cacheService.get(`price:${sym}`);
            if (cachedRaw) {
              socket.emit('price-update', JSON.parse(cachedRaw));
            } else {
              const fresh = await marketDataService.getQuote(sym);
              socket.emit('price-update', fresh);
            }
          } catch (e) {}
        }
      }
    });

    // Unsubscribe
    socket.on('unsubscribe', (symbol) => {
      if (!symbol || typeof symbol !== 'string') return;
      const sym = symbol.toUpperCase().trim();
      socket.leave(sym);
    });

    // Client heartbeat ping
    socket.on('ping-check', (clientTimestamp, callback) => {
      if (typeof callback === 'function') {
        callback({ serverTimestamp: Date.now(), clientTimestamp });
      }
    });

    socket.on('disconnect', () => {
      // Socket disconnected
    });
  });

  // Cross-node Pub/Sub bridge
  cacheService.subscribe('stock:price_updates', (data) => {
    try {
      const quote = typeof data === 'string' ? JSON.parse(data) : data;
      if (quote && quote.symbol) {
        io.to(quote.symbol).emit('price-update', quote);
      }
    } catch (e) {}
  });

  cacheService.subscribe('stock:alert_triggered', (data) => {
    try {
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      if (payload && payload.userId && payload.notification) {
        io.to(`user:${payload.userId}`).emit('alert-triggered', payload.notification);
      }
    } catch (e) {}
  });
}

module.exports = { setupSocketManager };
