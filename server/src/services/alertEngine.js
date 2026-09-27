const store = require('../models/store');
const cacheService = require('./cacheService');

class AlertEngine {
  constructor() {
    this.io = null;
    // Map to keep track of last observed state for crossing detection (symbol -> lastPrice)
    this.lastObservedPrices = new Map();
  }

  setSocketServer(io) {
    this.io = io;
  }

  async evaluateTick(quote) {
    const { symbol, price, changePercent } = quote;
    const lastPrice = this.lastObservedPrices.get(symbol) || price;
    this.lastObservedPrices.set(symbol, price);

    const activeAlerts = await store.getAllActiveAlerts();
    const symbolAlerts = activeAlerts.filter(a => a.symbol === symbol);

    if (symbolAlerts.length === 0) return;

    const now = Date.now();

    for (const alert of symbolAlerts) {
      // Check cooldown if it was triggered previously
      if (alert.lastTriggeredAt) {
        const elapsedMinutes = (now - new Date(alert.lastTriggeredAt).getTime()) / (60 * 1000);
        if (elapsedMinutes < (alert.cooldownMinutes || 30)) {
          // Still in cooldown period, suppress spam
          continue;
        }
      }

      let triggered = false;
      let reason = '';

      if (alert.condition === 'ABOVE') {
        if (price >= alert.targetPrice) {
          // Check if crossed above or first check
          triggered = true;
          reason = `${symbol} surged above target $${alert.targetPrice.toFixed(2)} (Current: $${price.toFixed(2)})`;
        }
      } else if (alert.condition === 'BELOW') {
        if (price <= alert.targetPrice) {
          triggered = true;
          reason = `${symbol} dropped below target $${alert.targetPrice.toFixed(2)} (Current: $${price.toFixed(2)})`;
        }
      } else if (alert.condition === 'PCT_CHANGE') {
        if (Math.abs(changePercent) >= Math.abs(alert.targetPrice)) {
          triggered = true;
          reason = `${symbol} experienced a ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}% intraday move`;
        }
      }

      if (triggered) {
        // Mark alert as triggered
        await store.updateAlert(alert.id, {
          status: 'TRIGGERED',
          lastTriggeredAt: new Date().toISOString()
        });

        // Record persistent notification
        const notification = await store.addNotification(alert.userId, {
          alertId: alert.id,
          symbol,
          title: `Price Alert: ${symbol}`,
          message: reason,
          price,
          targetPrice: alert.targetPrice,
          condition: alert.condition
        });

        console.log(`[AlertEngine] 🔔 Alert breached for user ${alert.userId}: ${reason}`);

        // Broadcast directly to user's private socket room
        if (this.io) {
          this.io.to(`user:${alert.userId}`).emit('alert-triggered', notification);
        }

        // Also publish on Redis Pub/Sub for multi-node deployments
        cacheService.publish('stock:alert_triggered', {
          userId: alert.userId,
          notification
        });
      }
    }
  }
}

module.exports = new AlertEngine();
