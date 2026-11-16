const express = require('express');
const router = express.Router();
const store = require('../models/store');
const cacheService = require('../services/cacheService');
const marketNotificationService = require('../services/marketNotificationService');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// Get all alerts for current user (supports guest/demo)
router.get('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ success: true, alerts: [] });
    }
    const userId = req.user.id;
    const alerts = await store.getAlerts(userId);
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new price alert
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, targetPrice, condition, cooldownMinutes } = req.body;
    if (!symbol || targetPrice === undefined) {
      return res.status(400).json({ success: false, error: 'Symbol and target price are required.' });
    }

    const sym = symbol.toUpperCase().trim();
    const alert = await store.createAlert(userId, {
      symbol: sym,
      targetPrice: parseFloat(targetPrice),
      condition: condition || 'ABOVE',
      cooldownMinutes: cooldownMinutes || 30
    });

    // Make sure poller watches this symbol
    await cacheService.sadd('active_symbols', sym);

    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Notification Routes (Must be before /:id routes) ---
// Get live market + related notifications alongside user's triggered alerts & orders
router.get('/notifications', optionalAuth, async (req, res) => {
  try {
    const includeMarket = req.query.includeMarket !== '0';
    const rawFocus = typeof req.query.focus === 'string' ? req.query.focus.split(',') : [];
    const focusSet = new Set(rawFocus.map((s) => String(s || '').trim().toUpperCase()).filter(Boolean));

    let personalNotifs = [];
    if (req.user) {
      const userId = req.user.id;
      const [savedNotifs, portfolio, watchlist] = await Promise.all([
        store.getNotifications(userId),
        store.getPortfolio(userId).catch(() => null),
        store.getWatchlist(userId).catch(() => [])
      ]);

      personalNotifs = (savedNotifs || []).map((n) => ({
        ...n,
        kind: n.kind || (n.orderId ? 'order' : 'alert'),
        category: n.category || (n.orderId ? 'ORDER' : 'TRIGGERED')
      }));

      (portfolio?.holdings || []).forEach((h) => h?.symbol && focusSet.add(h.symbol.toUpperCase()));
      (watchlist || []).forEach((sym) => sym && focusSet.add(String(sym).toUpperCase()));
    }

    const marketNotifs = includeMarket
      ? await marketNotificationService.getLiveMarketNotifications(Array.from(focusSet))
      : [];

    const combined = [...personalNotifs, ...marketNotifs].slice(0, 25);
    res.json({ success: true, notifications: combined });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Explicit endpoint for live market pulse, movers, & financial headlines
router.get('/market-feed', async (req, res) => {
  try {
    const rawFocus = typeof req.query.focus === 'string' ? req.query.focus.split(',') : [];
    const notifications = await marketNotificationService.getLiveMarketNotifications(rawFocus);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark all notifications as read
router.post('/notifications/read', requireAuth, async (req, res) => {
  try {
    const updated = await store.markNotificationsAsRead(req.user.id);
    res.json({ success: true, notifications: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear all notifications for user
router.delete('/notifications', requireAuth, async (req, res) => {
  try {
    await store.clearNotifications(req.user.id);
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete specific notification by ID
router.delete('/notifications/:id', requireAuth, async (req, res) => {
  try {
    const updated = await store.deleteNotification(req.user.id, req.params.id);
    res.json({ success: true, notifications: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Parameterized Alert Routes ---
// Delete alert
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await store.deleteAlert(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Alert not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Alert deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle alert active/disabled or re-arm triggered alert
router.patch('/:id/toggle', requireAuth, async (req, res) => {
  try {
    const alerts = await store.getAlerts(req.user.id);
    const alert = alerts.find(a => a.id === req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found.' });
    }

    const nextStatus = alert.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const updated = await store.updateAlert(alert.id, {
      status: nextStatus,
      lastTriggeredAt: null // reset trigger timestamp on manual toggle/re-arm
    });

    res.json({ success: true, alert: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
