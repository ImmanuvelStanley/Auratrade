const express = require('express');
const router = express.Router();
const marketDataService = require('../services/marketDataService');
const cacheService = require('../services/cacheService');
const config = require('../config');

// Search stocks by symbol or company name with automatic background global asset ingestion
router.get('/search', async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    if (!rawQuery) {
      return res.json({ success: true, data: [] });
    }

    let results = marketDataService.searchSymbols(rawQuery);
    const qUpper = rawQuery.toUpperCase();

    // If no exact match in catalog and query looks like a valid global ticker symbol (e.g. ARM, RACE, SPOT, PLTR, 7203.T, SHEL.L)
    const hasExactMatch = results.some(r => r.symbol === qUpper && r.sector !== 'Global Market');
    if (!hasExactMatch && /^[A-Z0-9.\-]{1,12}$/i.test(rawQuery)) {
      try {
        const liveAsset = await marketDataService.fetchGlobalTickerOnDemand(qUpper);
        if (liveAsset && liveAsset.symbol) {
          results = [
            {
              symbol: liveAsset.symbol,
              name: liveAsset.name,
              sector: liveAsset.sector,
              price: liveAsset.price,
              country: liveAsset.country,
              countryFlag: liveAsset.countryFlag,
              change: liveAsset.change,
              changePercent: liveAsset.changePercent,
              currency: liveAsset.currency
            },
            ...results.filter(r => r.symbol !== liveAsset.symbol && r.sector !== 'Global Market')
          ];
        }
      } catch (e) {
        // Fallback gracefully to catalog search results if not found on global exchanges
      }
    }

    res.json({ success: true, data: results.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single stock quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const cacheKey = `price:${symbol}`;

    // Register symbol in active_symbols so IngestionWorker continuously streams live updates
    await cacheService.sadd('active_symbols', symbol);

    // Check hot cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), cached: true });
    }

    const quote = await marketDataService.getQuote(symbol);
    await cacheService.set(cacheKey, JSON.stringify(quote), 'EX', config.cacheTtlSec);

    res.json({ success: true, data: quote, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get historical candle data for charts (1D, 1W, 1M, 1Y, 5Y, 10Y)
router.get('/history/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const range = req.query.range || '1D';

    const candles = await marketDataService.getHistoricalCandles(symbol, range);
    res.json({ success: true, symbol, range, candles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const predictionService = require('../services/predictionService');

// Ultra-fast live ticks batch stream for Serverless and high-frequency real-time updates
router.get('/live-ticks', async (req, res) => {
  try {
    const rawSymbols = req.query.symbols;
    let symbols = [];
    if (rawSymbols && typeof rawSymbols === 'string') {
      symbols = rawSymbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    }
    const ticks = await marketDataService.getLiveTicksBatch(symbols);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ success: true, timestamp: Date.now(), ticks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get market indices ribbon (Enhanced multi-market ticker tape)
router.get('/indices', async (req, res) => {
  try {
    const indices = await marketDataService.getIndicesRibbon();
    res.json({ success: true, data: indices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Investing.com-style Global Major Indices (Americas, Europe/EMEA, Asia-Pacific)
router.get('/global-indices', async (req, res) => {
  try {
    const region = req.query.region || 'major';
    const data = await marketDataService.getGlobalIndices(region);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Precious Metals Live Market Data (Spot Gold, Silver, MCX, 24K/22K Jewellery Rates, Ratio, ETFs)
router.get('/precious-metals', async (req, res) => {
  try {
    const data = await marketDataService.getPreciousMetalsData();
    res.setHeader('Cache-Control', 'public, max-age=3');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get NSE India Live Market Portal Data (Nifty 50, Bank Nifty, Advances/Declines, Gainers/Losers)
router.get('/nse-india', async (req, res) => {
  try {
    const data = await marketDataService.getNSEIndiaMarketData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get predictive analytics, technical signals, and future valuation forecast
router.get('/prediction/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const prediction = await predictionService.generatePrediction(symbol);
    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto Predictor: Scan all market assets and pick the best profitable locked asset minimizing risk
router.get('/auto-predictor', async (req, res) => {
  try {
    const riskMode = req.query.riskMode || 'balanced';
    const limit = parseInt(req.query.limit, 10) || 6;
    const result = await predictionService.getAutoPredictorRanking({ riskMode, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get individual asset Profit-Lock metrics (target price, stop loss floor, reward/risk ratio)
router.get('/profit-lock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const strategy = req.query.strategy || req.query.riskMode || 'balanced';
    const lockData = await predictionService.getAssetProfitLock(symbol, strategy);
    res.json({ success: true, data: lockData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get popular stock quotes
router.get('/popular', async (req, res) => {
  try {
    const quotes = await Promise.all(
      config.defaultSymbols.slice(0, 6).map(sym => marketDataService.getQuote(sym))
    );
    res.json({ success: true, data: quotes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all market companies ranked from high to low with investment metrics
router.get('/all-markets', async (req, res) => {
  try {
    const { region, tier, sector, sortBy, order, search } = req.query;
    const cacheKey = `cache:all_markets:${region || 'all'}:${tier || 'all'}:${sector || 'all'}:${sortBy || 'marketCap'}:${order || 'desc'}:${search || ''}`;

    // Check hot-cache to handle high concurrent traffic
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), cached: true });
    }

    const result = await marketDataService.getAllMarketCompanies({
      region,
      tier,
      sector,
      sortBy,
      order,
      search
    });

    // Cache result for 10 seconds (shields server under concurrent multi-user load)
    await cacheService.set(cacheKey, JSON.stringify(result), 'EX', 10);
    res.json({ success: true, data: result, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ingest any worldwide company on-demand from global exchanges via live Yahoo Finance feed
router.post('/fetch-global', async (req, res) => {
  try {
    const symbol = (req.body.symbol || req.query.symbol || '').toUpperCase().trim();
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Ticker symbol is required (e.g. RACE, SPOT, ARM, SHEL.L, 7203.T)'
      });
    }

    const asset = await marketDataService.fetchGlobalTickerOnDemand(symbol);
    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;

