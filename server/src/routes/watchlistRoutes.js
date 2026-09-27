const express = require('express');
const router = express.Router();
const store = require('../models/store');
const marketDataService = require('../services/marketDataService');
const cacheService = require('../services/cacheService');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// Get user's watchlist with current quotes (supports guest/demo)
router.get('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ success: true, symbols: [], quotes: [] });
    }
    const userId = req.user.id;
    const symbols = await store.getWatchlist(userId);
    const quotes = await Promise.all(
      symbols.map(async (sym) => {
        const cachedRaw = await cacheService.get(`price:${sym}`);
        if (cachedRaw) {
          try {
            return JSON.parse(cachedRaw);
          } catch (e) {}
        }
        return await marketDataService.getQuote(sym);
      })
    );

    res.json({ success: true, symbols, quotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add symbol to watchlist
router.post('/add', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ success: false, error: 'Symbol is required.' });

    const sym = symbol.toUpperCase().trim();
    const updated = await store.addToWatchlist(userId, sym);
    // Add to active poller symbols
    await cacheService.sadd('active_symbols', sym);

    const quote = await marketDataService.getQuote(sym);

    res.json({ success: true, symbols: updated, quote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Remove symbol from watchlist
router.post('/remove', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ success: false, error: 'Symbol is required.' });

    const sym = symbol.toUpperCase().trim();
    const updated = await store.removeFromWatchlist(userId, sym);

    res.json({ success: true, symbols: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
