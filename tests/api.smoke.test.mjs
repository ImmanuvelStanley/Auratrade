import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const workspaceDir = process.cwd();
const backendApp = require(path.join(workspaceDir, 'server/src/server.js'));
const ingestionWorker = require(path.join(workspaceDir, 'server/src/services/ingestionWorker.js'));
const marketFeedManager = require(path.join(workspaceDir, 'server/src/services/marketFeedManager.js'));

let server;
let baseUrl;
let authToken;

describe('AuraTrade Backend API & Webhook Smoke Suite', () => {
  before(async () => {
    server = http.createServer((req, res) => backendApp(req, res));
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    marketFeedManager.resetForTesting();
    try { ingestionWorker.stop(); } catch {}
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('serves /api/health with online status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'online');
  });

  it('returns 300+ companies in /api/stocks/all-markets', async () => {
    const res = await fetch(`${baseUrl}/api/stocks/all-markets?region=all&tier=all&sector=all&sortBy=marketCap&order=desc&search=`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data?.companies), 'companies array must exist');
    assert.ok(body.data.companies.length >= 300, `expected >= 300 assets, got ${body.data.companies.length}`);
  });

  it('returns valid historical OHLCV candles for 1D and 1Y ranges without crashing', async () => {
    for (const range of ['1D', '1Y']) {
      const res = await fetch(`${baseUrl}/api/stocks/history/AAPL?range=${range}`);
      assert.equal(res.status, 200, `history range=${range} should return 200`);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.candles) && body.candles.length > 5, `history ${range} should have candles`);
    }
  });

  it('returns ranked bestPick and candidates from /api/stocks/auto-predictor', async () => {
    const res = await fetch(`${baseUrl}/api/stocks/auto-predictor?targetReturn=10&riskMode=balanced&horizon=30d`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.bestPick && body.bestPick.symbol, 'bestPick must have a symbol');
    assert.ok(Array.isArray(body.candidates) && body.candidates.length > 0, 'candidates must be non-empty');
  });

  it('serves global indices, NSE India, precious metals, and security telemetry', async () => {
    const endpoints = [
      '/api/stocks/global-indices?region=major',
      '/api/stocks/nse-india',
      '/api/stocks/precious-metals',
      '/api/security/status'
    ];
    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert.equal(res.status, 200, `${ep} failed with ${res.status}`);
      const body = await res.json();
      assert.equal(body.success, true);
    }
  });

  it('enforces authentication and masks external API keys in /api/market-feed', async () => {
    const unauthRes = await fetch(`${baseUrl}/api/market-feed/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredProvider: 'finnhub' })
    });
    assert.equal(unauthRes.status, 401);

    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'CI Smoke Tester',
        email: `ci_${Date.now()}@auratrade.test`,
        password: 'CiTestPassword123!'
      })
    });
    assert.equal(regRes.status, 201);
    const regBody = await regRes.json();
    assert.ok(regBody.token, 'auth register must return JWT token');
    authToken = regBody.token;

    const testSecret = 'ci_wh_secret_9876';
    const testFinnhubKey = 'finnhub_live_mock_key_5432';
    const cfgRes = await fetch(`${baseUrl}/api/market-feed/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        preferredProvider: 'auto',
        finnhubApiKey: testFinnhubKey,
        webhookSecret: testSecret
      })
    });
    assert.equal(cfgRes.status, 200);
    const cfgBody = await cfgRes.json();
    assert.equal(cfgBody.success, true);
    assert.equal(cfgBody.data.providers.finnhub.configured, true);
    assert.equal(cfgBody.data.providers.webhook.hasSecret, true);

    const statusRes = await fetch(`${baseUrl}/api/market-feed/status`);
    const statusText = await statusRes.text();
    assert.ok(!statusText.includes(testFinnhubKey), 'raw API key must never leak in public /status');
    assert.ok(!statusText.includes(testSecret), 'raw webhook secret must never leak in public /status');
  });

  it('validates webhook secret / HMAC-SHA256 signatures and ingests live market ticks', async () => {
    const payloadObj = { symbol: 'AAPL', price: 342.75, volume: 1950000, source: 'Webhook-CI' };
    const payloadStr = JSON.stringify(payloadObj);

    const badRes = await fetch(`${baseUrl}/api/market-feed/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'wrong_secret'
      },
      body: payloadStr
    });
    assert.equal(badRes.status, 401, 'invalid webhook secret must be rejected with 401');

    const hmac = crypto.createHmac('sha256', 'ci_wh_secret_9876').update(payloadStr).digest('hex');
    const goodRes = await fetch(`${baseUrl}/api/market-feed/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${hmac}`
      },
      body: payloadStr
    });
    assert.equal(goodRes.status, 200);
    const goodBody = await goodRes.json();
    assert.equal(goodBody.success, true);
    assert.equal(goodBody.verificationMode, 'hmac-sha256');
    assert.equal(goodBody.ingestedCount, 1);
    assert.equal(goodBody.quotes[0].price, 342.75);

    const quoteRes = await fetch(`${baseUrl}/api/stocks/quote/AAPL`);
    assert.equal(quoteRes.status, 200);
    const quoteBody = await quoteRes.json();
    assert.equal(quoteBody.data.price, 342.75);
    assert.equal(quoteBody.data.source, 'Webhook-CI');
  });
});
