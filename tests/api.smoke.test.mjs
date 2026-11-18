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

  it('supports fractional paper trades, OCO SL/TP brackets, limit auto-fills, realized P&L, and account reset', async () => {
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    };

    // 1. Fractional BUY with OCO SL/TP brackets (AAPL live price is 342.75; 0.25 shares = $85.69)
    const buyRes = await fetch(`${baseUrl}/api/portfolio/trade`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        symbol: 'AAPL',
        type: 'BUY',
        shares: 0.25,
        orderKind: 'MARKET',
        stopLossPrice: 310.0,
        takeProfitPrice: 365.0
      })
    });
    assert.equal(buyRes.status, 200);
    const buyBody = await buyRes.json();
    assert.equal(buyBody.success, true);
    assert.equal(buyBody.trade.shares, 0.25);
    assert.equal(buyBody.bracketOrders.length, 2, 'BUY should create SL and TP OCO bracket orders');

    // 2. Queue a standalone BUY LIMIT order and test DELETE cancel
    const queueRes = await fetch(`${baseUrl}/api/portfolio/trade`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        symbol: 'MSFT',
        type: 'BUY',
        shares: 0.5,
        orderKind: 'LIMIT',
        limitPrice: 200.0
      })
    });
    assert.equal(queueRes.status, 200);
    const queueBody = await queueRes.json();
    assert.equal(queueBody.pending, true);
    const msftOrderId = queueBody.order.id;

    const cancelRes = await fetch(`${baseUrl}/api/portfolio/orders/${msftOrderId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.equal(cancelRes.status, 200);

    // 3. Push live webhook tick >= takeProfitPrice (370.0) so TP bracket fills and cancels OCO sibling SL
    const tpTick = JSON.stringify({ symbol: 'AAPL', price: 370.0, volume: 1200000, source: 'Webhook-TP-CI' });
    const tpHmac = crypto.createHmac('sha256', 'ci_wh_secret_9876').update(tpTick).digest('hex');
    const tpRes = await fetch(`${baseUrl}/api/market-feed/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${tpHmac}`
      },
      body: tpTick
    });
    assert.equal(tpRes.status, 200);

    // Give async alertEngine / pending order tick evaluation a brief settle window
    await new Promise((r) => setTimeout(r, 150));

    const portRes = await fetch(`${baseUrl}/api/portfolio`, { headers: authHeaders });
    assert.equal(portRes.status, 200);
    const portBody = await portRes.json();
    assert.equal(portBody.portfolio.holdings.length, 0, 'AAPL position should be closed after Take-Profit fill');
    assert.ok(portBody.portfolio.realizedPnL > 0, `expected positive realizedPnL after TP exit, got ${portBody.portfolio.realizedPnL}`);
    assert.equal(portBody.portfolio.closedTradesCount, 1);
    assert.equal(portBody.portfolio.winRate, 100);

    const aaplOrders = portBody.portfolio.orders.filter((o) => o.symbol === 'AAPL');
    assert.equal(aaplOrders.find((o) => o.orderKind === 'TAKE_PROFIT')?.status, 'FILLED');
    assert.equal(aaplOrders.find((o) => o.orderKind === 'STOP_LOSS')?.status, 'CANCELLED');

    // 4. Reset paper portfolio cleanly back to $1,000.00
    const resetRes = await fetch(`${baseUrl}/api/portfolio/reset`, {
      method: 'POST',
      headers: authHeaders
    });
    assert.equal(resetRes.status, 200);
    const resetBody = await resetRes.json();
    assert.equal(resetBody.portfolio.cashBalance, 1000);
    assert.equal(resetBody.portfolio.realizedPnL, 0);
    assert.deepEqual(resetBody.portfolio.orders, []);
  });

  it('auto-routes /api/ai/chat across question complexity levels without manual engine selection', async () => {
    const cases = [
      { message: 'If I invest $1,000 in AAPL what is my profit?', expectedLevel: 1, expectedTier: 'QUANT_PRECISION' },
      { message: 'Explain RSI divergence', expectedLevel: 2, expectedTier: 'BALANCED_ANALYTICAL' },
      { message: 'Why does yield curve inversion affect tech stocks and what hedging portfolio strategy should I use?', expectedLevel: 3, expectedTier: 'DEEP_STRATEGY' }
    ];

    for (const tc of cases) {
      const res = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'AAPL', message: tc.message, model: 'auto' })
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.questionLevel?.level, tc.expectedLevel);
      assert.equal(body.data.questionLevel?.tier, tc.expectedTier);
      assert.ok(typeof body.data.reply === 'string' && body.data.reply.length > 40, 'AI reply must be populated');
    }
  });

  it('serves live market, macro, bullion, NSE, and related notifications from /api/alerts/notifications', async () => {
    const res = await fetch(`${baseUrl}/api/alerts/notifications?focus=AAPL,NVDA`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.notifications) && body.notifications.length >= 4, 'expected live market notifications even for guests');
    const cats = new Set(body.notifications.map((n) => n.category));
    assert.ok(cats.has('RELATED'), 'expected RELATED focus stock notification for AAPL/NVDA');
    assert.ok(cats.has('MACRO') || cats.has('BULLION') || cats.has('NSE') || cats.has('MOVER'), 'expected live market pulse categories');
    const firstWithDetails = body.notifications.find((n) => n.details && typeof n.details.whatItMeans === 'string');
    assert.ok(firstWithDetails && Array.isArray(firstWithDetails.details.metrics), 'notifications must include structured details explanation & telemetry metrics');

    const feedRes = await fetch(`${baseUrl}/api/alerts/market-feed?focus=TSLA`);
    assert.equal(feedRes.status, 200);
    const feedBody = await feedRes.json();
    assert.equal(feedBody.success, true);
    assert.ok(feedBody.notifications.length >= 4);
  });

  it('authenticates with Google and Apple OAuth endpoints, links accounts, and provisions portfolio', async () => {
    // 1. Google OAuth sign-in
    const googleEmail = `google_trader_${Date.now()}@gmail.com`;
    const googleRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleEmail,
        name: 'Google Verified Trader',
        sub: 'g_sub_123456789'
      })
    });
    assert.equal(googleRes.status, 200, 'Google OAuth should return 200');
    const googleBody = await googleRes.json();
    assert.equal(googleBody.success, true);
    assert.equal(googleBody.provider, 'google');
    assert.equal(googleBody.isNewUser, true);
    assert.ok(googleBody.token, 'OAuth response must contain JWT session token');
    assert.equal(googleBody.user.email, googleEmail);
    assert.equal(googleBody.user.cashBalance, 1000);

    // Verify /api/auth/me accepts the OAuth token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${googleBody.token}` }
    });
    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.success, true);
    assert.equal(meBody.user.email, googleEmail);
    assert.equal(meBody.user.authProvider, 'google');

    // 2. Apple OAuth sign-in
    const appleEmail = `apple_trader_${Date.now()}@icloud.com`;
    const appleRes = await fetch(`${baseUrl}/api/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: appleEmail,
        name: 'Apple Trader',
        sub: 'apple_sub_987654321'
      })
    });
    assert.equal(appleRes.status, 200, 'Apple OAuth should return 200');
    const appleBody = await appleRes.json();
    assert.equal(appleBody.success, true);
    assert.equal(appleBody.provider, 'apple');
    assert.equal(appleBody.isNewUser, true);
    assert.ok(appleBody.token);

    // 3. Account Linking: register an email first, then sign in with Google using that email
    const linkEmail = `link_test_${Date.now()}@auratrade.test`;
    const origReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: linkEmail,
        password: 'Password123!',
        name: 'Original Account'
      })
    }).then(r => r.json());
    assert.ok(origReg.token);
    const originalUserId = origReg.user.id;

    // Now sign in with Google using the same email
    const linkRes = await fetch(`${baseUrl}/api/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        email: linkEmail,
        name: 'Original Account',
        sub: 'google_linked_sub_456'
      })
    });
    assert.equal(linkRes.status, 200);
    const linkBody = await linkRes.json();
    assert.equal(linkBody.success, true);
    assert.equal(linkBody.isNewUser, false, 'Linking to existing email must not create a duplicate user');
    assert.equal(linkBody.user.id, originalUserId, 'User ID must match the existing account');
  });
});
