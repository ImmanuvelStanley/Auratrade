const express = require('express');
const router = express.Router();
const marketFeedManager = require('../services/marketFeedManager');
const marketDataService = require('../services/marketDataService');
const { requireAuth } = require('../middleware/authMiddleware');

// Public status (secrets & API keys are strictly masked)
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: marketFeedManager.getPublicStatus()
  });
});

// Update feed provider priority, API keys, or webhook secret (authenticated)
router.post('/config', requireAuth, (req, res) => {
  try {
    const status = marketFeedManager.updateConfig(req.body || {});
    res.json({
      success: true,
      message: 'Live market feed configuration updated.',
      data: status
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Test a configured (or candidate) external provider live fetch cleanly
router.post('/test-provider', requireAuth, async (req, res) => {
  const { provider = 'finnhub', symbol = 'AAPL', apiKey = '' } = req.body || {};
  const startedAt = Date.now();
  try {
    let rawTick = null;
    if (provider === 'finnhub') {
      rawTick = await marketFeedManager.fetchFinnhubQuote(symbol, apiKey || null);
    } else if (provider === 'alphavantage') {
      rawTick = await marketFeedManager.fetchAlphaVantageQuote(symbol, apiKey || null);
    } else if (provider === 'yahoo') {
      rawTick = await marketDataService.getQuote(symbol);
    } else {
      return res.status(400).json({ success: false, error: `Unsupported test provider: ${provider}` });
    }

    const quote = rawTick && rawTick.changePercent !== undefined && rawTick.price
      ? marketDataService.ingestExternalTick(rawTick)
      : rawTick;

    return res.json({
      success: true,
      data: {
        provider,
        latencyMs: Date.now() - startedAt,
        quote
      }
    });
  } catch (err) {
    return res.status(200).json({
      success: false,
      latencyMs: Date.now() - startedAt,
      error: err.message
    });
  }
});

// Real-time Webhook Receiver for Finnhub / Custom Market Data Providers
router.post('/webhook', async (req, res) => {
  const rawBody = req.rawBody !== undefined ? req.rawBody : JSON.stringify(req.body || {});
  const authResult = marketFeedManager.verifyWebhookRequest(req.headers, rawBody);
  if (!authResult.verified) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing webhook secret/signature.'
    });
  }

  try {
    const ticks = marketFeedManager.normalizeWebhookTicks(req.body);
    const ingested = await marketFeedManager.ingestWebhookTicks(
      ticks,
      (t) => marketDataService.ingestExternalTick(t)
    );
    return res.json({
      success: true,
      verificationMode: authResult.mode,
      ingestedCount: ingested.length,
      quotes: ingested
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Signed-in UI Helper: Push a sample live webhook tick into the pipeline
router.post('/webhook/simulate', requireAuth, async (req, res) => {
  try {
    const { symbol = 'AAPL', deltaPercent = 0.45, price } = req.body || {};
    const currentQuote = await marketDataService.getQuote(symbol);
    const basePrice = Number(currentQuote?.price) || 100;
    const nextPrice = price !== undefined && Number(price) > 0
      ? Number(price)
      : parseFloat((basePrice * (1 + Number(deltaPercent) / 100)).toFixed(2));

    const ticks = marketFeedManager.normalizeWebhookTicks({
      symbol: currentQuote?.symbol || symbol,
      price: nextPrice,
      previousClose: currentQuote?.previousClose || basePrice,
      volume: (currentQuote?.volume || 1000000) + 2500,
      source: 'Webhook-Push'
    });

    const ingested = await marketFeedManager.ingestWebhookTicks(
      ticks,
      (t) => marketDataService.ingestExternalTick(t)
    );

    res.json({
      success: true,
      ingestedCount: ingested.length,
      quotes: ingested
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
