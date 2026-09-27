const express = require('express');
const router = express.Router();
const marketDataService = require('../services/marketDataService');
const cacheService = require('../services/cacheService');
const config = require('../config');

// Search stocks by symbol or company name
router.get('/search', (req, res) => {
  const query = req.query.q || '';
  const results = marketDataService.searchSymbols(query);
  res.json({ success: true, data: results });
});

// Get single stock quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const cacheKey = `price:${symbol}`;

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

