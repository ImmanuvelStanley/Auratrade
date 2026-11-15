const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');
const cacheService = require('./cacheService');
const alertEngine = require('./alertEngine');

const SUPPORTED_PROVIDERS = ['auto', 'webhook', 'finnhub', 'alphavantage', 'yahoo', 'simulator'];

function maskSecret(val) {
  if (!val || typeof val !== 'string' || val.trim().length === 0) return '';
  const trimmed = val.trim();
  if (trimmed.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(8, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function mapSymbolForFinnhub(sym) {
  if (!sym) return 'AAPL';
  const upper = String(sym).trim().toUpperCase();
  const cryptoMap = {
    BTC: 'BINANCE:BTCUSDT',
    ETH: 'BINANCE:ETHUSDT',
    SOL: 'BINANCE:SOLUSDT',
    XRP: 'BINANCE:XRPUSDT',
    ADA: 'BINANCE:ADAUSDT',
    DOGE: 'BINANCE:DOGEUSDT',
    AVAX: 'BINANCE:AVAXUSDT'
  };
  if (cryptoMap[upper]) return cryptoMap[upper];
  if (upper === 'USD/INR') return 'OANDA:USD_INR';
  if (upper === 'GOLD') return 'OANDA:XAU_USD';
  if (upper === 'SILVER') return 'OANDA:XAG_USD';
  return upper;
}

function mapSymbolForAlphaVantage(sym) {
  if (!sym) return 'AAPL';
  const upper = String(sym).trim().toUpperCase();
  if (upper.endsWith('.NS')) return upper.replace('.NS', '.BSE');
  if (upper === 'USD/INR') return 'USDINR';
  return upper;
}

class MarketFeedManager {
  constructor() {
    this.io = null;
    this.http = axios.create({ timeout: 4500 });
    this.webhookTtlMs = 120 * 1000;
    this.configState = {
      preferredProvider: SUPPORTED_PROVIDERS.includes(process.env.MARKET_FEED_PROVIDER)
        ? process.env.MARKET_FEED_PROVIDER
        : 'auto',
      finnhubApiKey: (config.finnhubApiKey || '').trim(),
      alphaVantageKey: (config.alphaVantageKey || '').trim(),
      webhookSecret: (process.env.MARKET_WEBHOOK_SECRET || '').trim()
    };
    this.stats = {
      webhook: { eventsCount: 0, lastSuccessAt: null, lastError: null, recentTicks: [] },
      finnhub: { requests: 0, lastSuccessAt: null, lastError: null },
      alphavantage: { requests: 0, lastSuccessAt: null, lastError: null },
      yahoo: { requests: 0, lastSuccessAt: null, lastError: null },
      simulator: { requests: 0, lastSuccessAt: null, lastError: null }
    };
  }

  setSocketServer(io) {
    this.io = io;
  }

  resetForTesting() {
    this.configState = {
      preferredProvider: 'auto',
      finnhubApiKey: (config.finnhubApiKey || '').trim(),
      alphaVantageKey: (config.alphaVantageKey || '').trim(),
      webhookSecret: (process.env.MARKET_WEBHOOK_SECRET || '').trim()
    };
    this.stats = {
      webhook: { eventsCount: 0, lastSuccessAt: null, lastError: null, recentTicks: [] },
      finnhub: { requests: 0, lastSuccessAt: null, lastError: null },
      alphavantage: { requests: 0, lastSuccessAt: null, lastError: null },
      yahoo: { requests: 0, lastSuccessAt: null, lastError: null },
      simulator: { requests: 0, lastSuccessAt: null, lastError: null }
    };
  }

  updateConfig({
    preferredProvider,
    finnhubApiKey,
    alphaVantageKey,
    webhookSecret,
    clearFinnhubKey,
    clearAlphaVantageKey,
    clearWebhookSecret
  } = {}) {
    if (preferredProvider && SUPPORTED_PROVIDERS.includes(preferredProvider)) {
      this.configState.preferredProvider = preferredProvider;
    }
    if (clearFinnhubKey) {
      this.configState.finnhubApiKey = '';
    } else if (typeof finnhubApiKey === 'string' && finnhubApiKey.trim()) {
      this.configState.finnhubApiKey = finnhubApiKey.trim();
    }

    if (clearAlphaVantageKey) {
      this.configState.alphaVantageKey = '';
    } else if (typeof alphaVantageKey === 'string' && alphaVantageKey.trim()) {
      this.configState.alphaVantageKey = alphaVantageKey.trim();
    }

    if (clearWebhookSecret) {
      this.configState.webhookSecret = '';
    } else if (typeof webhookSecret === 'string' && webhookSecret.trim()) {
      this.configState.webhookSecret = webhookSecret.trim();
    }

    return this.getPublicStatus();
  }

  getPublicStatus() {
    return {
      preferredProvider: this.configState.preferredProvider,
      supportedProviders: SUPPORTED_PROVIDERS,
      providers: {
        webhook: {
          enabled: true,
          hasSecret: Boolean(this.configState.webhookSecret),
          secretHint: maskSecret(this.configState.webhookSecret),
          endpoint: '/api/market-feed/webhook',
          ttlSeconds: Math.round(this.webhookTtlMs / 1000),
          eventsCount: this.stats.webhook.eventsCount,
          lastSuccessAt: this.stats.webhook.lastSuccessAt,
          lastError: this.stats.webhook.lastError,
          recentTicks: this.stats.webhook.recentTicks.slice(0, 8)
        },
        finnhub: {
          configured: Boolean(this.configState.finnhubApiKey),
          keyHint: maskSecret(this.configState.finnhubApiKey),
          requests: this.stats.finnhub.requests,
          lastSuccessAt: this.stats.finnhub.lastSuccessAt,
          lastError: this.stats.finnhub.lastError
        },
        alphavantage: {
          configured: Boolean(this.configState.alphaVantageKey),
          keyHint: maskSecret(this.configState.alphaVantageKey),
          requests: this.stats.alphavantage.requests,
          lastSuccessAt: this.stats.alphavantage.lastSuccessAt,
          lastError: this.stats.alphavantage.lastError
        },
        yahoo: {
          configured: true,
          requests: this.stats.yahoo.requests,
          lastSuccessAt: this.stats.yahoo.lastSuccessAt,
          lastError: this.stats.yahoo.lastError
        },
        simulator: {
          configured: true,
          requests: this.stats.simulator.requests,
          lastSuccessAt: this.stats.simulator.lastSuccessAt
        }
      }
    };
  }

  async fetchFinnhubQuote(symbol, overrideKey = null) {
    const token = (overrideKey || this.configState.finnhubApiKey || '').trim();
    if (!token) {
      throw new Error('Finnhub API key is not configured.');
    }
    const fhSym = mapSymbolForFinnhub(symbol);
    this.stats.finnhub.requests += 1;
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(fhSym)}&token=${encodeURIComponent(token)}`;
      const res = await this.http.get(url);
      const d = res.data;
      if (!d || typeof d.c !== 'number' || d.c <= 0) {
        throw new Error(`No live Finnhub price for ${fhSym}`);
      }
      this.stats.finnhub.lastSuccessAt = new Date().toISOString();
      this.stats.finnhub.lastError = null;
      return {
        symbol,
        price: parseFloat(Number(d.c).toFixed(2)),
        previousClose: parseFloat(Number(d.pc || d.c).toFixed(2)),
        dayHigh: d.h ? parseFloat(Number(d.h).toFixed(2)) : undefined,
        dayLow: d.l ? parseFloat(Number(d.l).toFixed(2)) : undefined,
        change: typeof d.d === 'number' ? parseFloat(d.d.toFixed(2)) : undefined,
        changePercent: typeof d.dp === 'number' ? parseFloat(d.dp.toFixed(2)) : undefined,
        timestamp: d.t ? d.t * 1000 : Date.now(),
        source: 'Finnhub-Live'
      };
    } catch (err) {
      this.stats.finnhub.lastError = err.message;
      throw err;
    }
  }

  async fetchAlphaVantageQuote(symbol, overrideKey = null) {
    const key = (overrideKey || this.configState.alphaVantageKey || '').trim();
    if (!key) {
      throw new Error('Alpha Vantage API key is not configured.');
    }
    const avSym = mapSymbolForAlphaVantage(symbol);
    this.stats.alphavantage.requests += 1;
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(avSym)}&apikey=${encodeURIComponent(key)}`;
      const res = await this.http.get(url);
      const gq = res.data?.['Global Quote'];
      if (!gq || !gq['05. price']) {
        const note = res.data?.Note || res.data?.Information || res.data?.['Error Message'];
        throw new Error(note || `No Alpha Vantage quote returned for ${avSym}`);
      }
      const price = parseFloat(gq['05. price']);
      const prevClose = parseFloat(gq['08. previous close']) || price;
      const change = parseFloat(gq['09. change']);
      const changePct = parseFloat(String(gq['10. change percent'] || '0').replace('%', ''));
      this.stats.alphavantage.lastSuccessAt = new Date().toISOString();
      this.stats.alphavantage.lastError = null;
      return {
        symbol,
        price: parseFloat(price.toFixed(2)),
        previousClose: parseFloat(prevClose.toFixed(2)),
        dayHigh: parseFloat(gq['03. high']) || undefined,
        dayLow: parseFloat(gq['04. low']) || undefined,
        volume: parseInt(gq['06. volume'], 10) || undefined,
        change: Number.isFinite(change) ? parseFloat(change.toFixed(2)) : undefined,
        changePercent: Number.isFinite(changePct) ? parseFloat(changePct.toFixed(2)) : undefined,
        timestamp: Date.now(),
        source: 'AlphaVantage-Live'
      };
    } catch (err) {
      this.stats.alphavantage.lastError = err.message;
      throw err;
    }
  }

  recordYahooResult(ok, errMsg = null) {
    this.stats.yahoo.requests += 1;
    if (ok) {
      this.stats.yahoo.lastSuccessAt = new Date().toISOString();
      this.stats.yahoo.lastError = null;
    } else if (errMsg) {
      this.stats.yahoo.lastError = errMsg;
    }
  }

  recordSimulatorResult() {
    this.stats.simulator.requests += 1;
    this.stats.simulator.lastSuccessAt = new Date().toISOString();
  }

  verifyWebhookRequest(headers = {}, rawBody = '') {
    const secret = (this.configState.webhookSecret || '').trim();
    if (!secret) return { verified: true, mode: 'open' };

    const headerSecret =
      headers['x-webhook-secret'] ||
      headers['x-finnhub-secret'] ||
      (String(headers.authorization || '').startsWith('Bearer ')
        ? String(headers.authorization).slice(7).trim()
        : '');

    if (headerSecret && timingSafeEqualStr(String(headerSecret).trim(), secret)) {
      return { verified: true, mode: 'secret-header' };
    }

    const sigHeader = String(headers['x-webhook-signature'] || '').trim().replace(/^sha256=/i, '');
    if (sigHeader) {
      const expectedHex = crypto.createHmac('sha256', secret).update(rawBody || '').digest('hex');
      if (timingSafeEqualStr(sigHeader.toLowerCase(), expectedHex.toLowerCase())) {
        return { verified: true, mode: 'hmac-sha256' };
      }
    }

    return { verified: false, mode: 'rejected' };
  }

  normalizeWebhookTicks(payload = {}) {
    if (!payload || typeof payload !== 'object') return [];
    // Finnhub native trade webhook shape: { type: 'trade', data: [{ s: 'AAPL', p: 220.5, v: 100, t: ... }] }
    if (Array.isArray(payload.data) && payload.type === 'trade') {
      return payload.data
        .filter((d) => d && d.s && Number(d.p) > 0)
        .map((d) => ({
          symbol: String(d.s).trim(),
          price: Number(d.p),
          volume: d.v !== undefined ? Number(d.v) : undefined,
          timestamp: d.t ? Number(d.t) : Date.now(),
          source: 'Webhook-Finnhub'
        }));
    }

    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.ticks)
        ? payload.ticks
        : [payload];

    return list
      .filter((t) => t && (t.symbol || t.s) && Number(t.price ?? t.p) > 0)
      .map((t) => ({
        symbol: String(t.symbol || t.s).trim(),
        price: Number(t.price ?? t.p),
        previousClose: t.previousClose !== undefined ? Number(t.previousClose) : undefined,
        dayHigh: t.dayHigh !== undefined ? Number(t.dayHigh) : undefined,
        dayLow: t.dayLow !== undefined ? Number(t.dayLow) : undefined,
        volume: t.volume !== undefined ? Number(t.volume) : undefined,
        change: t.change !== undefined ? Number(t.change) : undefined,
        changePercent: t.changePercent !== undefined ? Number(t.changePercent) : undefined,
        timestamp: t.timestamp ? Number(t.timestamp) : Date.now(),
        source: String(t.source || 'Webhook-Push')
      }));
  }

  async ingestWebhookTicks(rawTicks, ingestFn) {
    if (!Array.isArray(rawTicks) || rawTicks.length === 0) {
      throw new Error('Webhook payload must contain at least one valid tick with symbol and positive price.');
    }

    const ingested = [];
    for (const tick of rawTicks) {
      const quote = ingestFn({
        ...tick,
        webhookExpiresAt: Date.now() + this.webhookTtlMs
      });

      try {
        await cacheService.set(`price:${quote.symbol}`, JSON.stringify(quote), 'EX', config.cacheTtlSec);
        await cacheService.publish('stock:price_updates', quote);
      } catch (e) {}

      if (this.io) {
        this.io.to(quote.symbol).emit('price-update', quote);
      }

      try {
        await alertEngine.evaluateTick(quote);
      } catch (e) {}

      ingested.push(quote);
      this.stats.webhook.recentTicks.unshift({
        symbol: quote.symbol,
        price: quote.price,
        changePercent: quote.changePercent,
        source: quote.source,
        receivedAt: new Date().toISOString()
      });
    }

    this.stats.webhook.recentTicks = this.stats.webhook.recentTicks.slice(0, 12);
    this.stats.webhook.eventsCount += ingested.length;
    this.stats.webhook.lastSuccessAt = new Date().toISOString();
    this.stats.webhook.lastError = null;
    return ingested;
  }
}

module.exports = new MarketFeedManager();
