const config = require('../config');
const cacheService = require('./cacheService');
const marketDataService = require('./marketDataService');
const alertEngine = require('./alertEngine');
const store = require('../models/store');

class IngestionWorker {
  constructor() {
    this.timer = null;
    this.io = null;
    this.isRunning = false;
  }

  setSocketServer(io) {
    this.io = io;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[IngestionWorker] Started shared price poller (Interval: ${config.pollIntervalMs}ms, Cache TTL: ${config.cacheTtlSec}s).`);

    // Ensure default active symbols are present in Redis
    await cacheService.sadd('active_symbols', ...config.defaultSymbols);

    // Main tick loop
    this.timer = setInterval(() => this.pollCycle(), config.pollIntervalMs);
    // Run first cycle immediately
    this.pollCycle();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[IngestionWorker] Stopped shared poller.');
  }

  async pollCycle() {
    try {
      // 1. Gather all symbols that need polling:
      // Active client rooms + symbols from active user alerts
      const activeSymbols = new Set(await cacheService.smembers('active_symbols'));

      const activeAlerts = await store.getAllActiveAlerts();
      activeAlerts.forEach(a => activeSymbols.add(a.symbol));

      // If empty, fallback to default symbols
      if (activeSymbols.size === 0) {
        config.defaultSymbols.forEach(s => activeSymbols.add(s));
      }

      // 2. Poll symbols in parallel with cache shielding
      const symbolList = Array.from(activeSymbols);

      for (const symbol of symbolList) {
        try {
          const cacheKey = `price:${symbol}`;
          // Generate fresh real-time quote on each cycle for continuous streaming
          const quote = await marketDataService.getQuote(symbol);
          await cacheService.set(cacheKey, JSON.stringify(quote), 'EX', config.cacheTtlSec);

          // 3. Emit price update to Socket.io room for that symbol
          if (this.io) {
            this.io.to(symbol).emit('price-update', quote);
          }

          // 4. Publish to pub/sub channel for cross-node multi-instance broadcast
          await cacheService.publish('stock:price_updates', quote);

          // 5. Evaluate tick in Alert Engine
          await alertEngine.evaluateTick(quote);
        } catch (err) {
          console.error(`[IngestionWorker] Failed poll for ${symbol}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[IngestionWorker] Error in poll cycle:', err.message);
    }
  }
}

module.exports = new IngestionWorker();
