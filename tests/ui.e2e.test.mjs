import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const workspaceDir = process.cwd();
const backendApp = require(path.join(workspaceDir, 'server/src/server.js'));
const ingestionWorker = require(path.join(workspaceDir, 'server/src/services/ingestionWorker.js'));
const marketFeedManager = require(path.join(workspaceDir, 'server/src/services/marketFeedManager.js'));
const distDir = path.join(workspaceDir, 'dist');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const findBrowserExe = () => {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
};

const run = async () => {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error('dist/index.html missing. Run `npm run build` before `npm run test:e2e`.');
  }

  const exe = findBrowserExe();
  if (!exe) {
    if (process.argv.includes('--require-browser')) {
      throw new Error('No headless Chromium/Chrome/Edge executable found on this host.');
    }
    console.log('SKIP UI E2E: No headless Chrome/Chromium/Edge binary detected on PATH.');
    marketFeedManager.resetForTesting();
    try { ingestionWorker.stop(); } catch {}
    process.exit(0);
  }

  const srv = http.createServer((req, res) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
      return backendApp(req, res);
    }
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, cleanUrl === '/' ? 'index.html' : cleanUrl);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const mime =
      ext === '.html' ? 'text/html' :
      ext === '.js' ? 'application/javascript' :
      ext === '.css' ? 'text/css' :
      ext === '.svg' ? 'image/svg+xml' :
      ext === '.json' ? 'application/json' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => srv.listen(0, '127.0.0.1', resolve));
  const port = srv.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const cdpPort = 9250 + Math.floor(Math.random() * 200);
  const userDataDir = path.join(process.env.TEMP || '/tmp', `auratrade_e2e_${Date.now()}`);
  fs.mkdirSync(userDataDir, { recursive: true });

  const proc = spawn(exe, [
    '--headless=new',
    '--no-sandbox',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `${baseUrl}/`
  ], { stdio: 'ignore' });

  let ws;
  try {
    let wsUrl = null;
    for (let i = 0; i < 45; i++) {
      try {
        const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json());
        const page = targets.find((t) => t.type === 'page');
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {}
      await sleep(200);
    }
    assert.ok(wsUrl, 'Failed to attach Chrome DevTools WebSocket');

    ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    let msgId = 1;
    const pending = new Map();
    const consoleErrors = [];
    const pageExceptions = [];
    const failedNetwork = [];

    ws.addEventListener('message', (ev) => {
      const data = JSON.parse(ev.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
      if (data.method === 'Runtime.consoleAPICalled' && data.params?.type === 'error') {
        consoleErrors.push(data.params.args.map((a) => a.value || a.description).join(' '));
      }
      if (data.method === 'Runtime.exceptionThrown') {
        pageExceptions.push(data.params?.exceptionDetails?.text || 'exception');
      }
      if (data.method === 'Network.responseReceived' && data.params?.response?.status >= 400) {
        failedNetwork.push({ url: data.params.response.url, status: data.params.response.status });
      }
    });

    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evalJs = async (expression) => {
      const res = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(`Browser eval failed: ${JSON.stringify(res.exceptionDetails)}`);
      }
      return res.result?.value;
    };

    await cdp('Runtime.enable');
    await cdp('Network.enable');
    await cdp('Page.enable');
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(1600);

    const assertViewHealthy = async (label) => {
      const metrics = await evalJs(`(() => {
        const docEl = document.documentElement;
        const bodyText = document.body.innerText || '';
        const badRegexes = [];
        if (/\\b160\\+\\b/.test(bodyText)) badRegexes.push('160+');
        if (/\\+-\\d/.test(bodyText)) badRegexes.push('+-');
        if (/\\$\\$/.test(bodyText)) badRegexes.push('$$');
        if (/\\$-\\d/.test(bodyText)) badRegexes.push('$-');
        const brokenImgs = Array.from(document.querySelectorAll('img')).filter((i) => !i.complete || i.naturalWidth === 0).length;
        return {
          overflowPx: Math.round(docEl.scrollWidth - window.innerWidth),
          badRegexes,
          brokenImgs,
          textLength: bodyText.length
        };
      })()`);
      assert.ok(metrics.textLength > 300, `${label}: empty view rendered`);
      assert.ok(metrics.overflowPx <= 0, `${label}: horizontal overflow ${metrics.overflowPx}px`);
      assert.deepEqual(metrics.badRegexes, [], `${label}: unexpected formatting strings ${metrics.badRegexes}`);
      assert.equal(metrics.brokenImgs, 0, `${label}: broken images detected`);
    };

    const tabs = ['All Companies Market', 'Workstation', 'NSE Indian Market', 'Global Major Indices', 'Gold & Silver Market'];

    // Verify Notification Bell + unread pill badge fit cleanly inside the header button with no overlap
    let bellLayout = { ready: false, insideBtn: false, clearOfIcon: false, visibleHeight: 0 };
    for (let i = 0; i < 20; i++) {
      await sleep(180);
      bellLayout = await evalJs(`(() => {
        const bell = document.getElementById('header-notification-bell-btn');
        const svg = bell ? bell.querySelector('svg') : null;
        const badge = bell ? bell.querySelector('.notification-badge') : null;
        if (!bell || !svg || !badge) return { ready: false, insideBtn: false, clearOfIcon: false, visibleHeight: bell ? bell.getBoundingClientRect().height : 0 };
        const br = bell.getBoundingClientRect();
        const sr = svg.getBoundingClientRect();
        const gr = badge.getBoundingClientRect();
        return {
          ready: true,
          visibleHeight: br.height,
          insideBtn: gr.left >= br.left && gr.right <= br.right && gr.top >= br.top && gr.bottom <= br.bottom,
          clearOfIcon: gr.left >= sr.right
        };
      })()`);
      if (bellLayout.ready) break;
    }
    assert.equal(bellLayout.ready, true, 'Notification bell and unread count pill must appear automatically on load');
    assert.ok(bellLayout.visibleHeight >= 34, 'Notification bell button must have crisp header height >= 34px');
    assert.equal(bellLayout.insideBtn, true, 'Unread count badge must fit cleanly inside the notification bell pill button');
    assert.equal(bellLayout.clearOfIcon, true, 'Unread count badge must not overlap the bell icon');

    // Verify Signature Architectural Opening Stage & Streamlined Strategy Segmented Bar
    const openingHeroCheck = await evalJs(`(() => {
      const stage = document.querySelector('.opening-bento-stage');
      const wave = document.querySelector('.opening-pulse-svg');
      const cta = document.getElementById('opening-workstation-cta');
      const dockCells = document.querySelectorAll('.opening-telemetry-cell').length;
      const strategyPills = document.querySelectorAll('.screener-command-dock .screener-strategy-pill').length;
      const bandCount = document.querySelectorAll('.screener-command-dock .screener-band').length;
      const controlChips = document.querySelectorAll('.screener-command-dock .screener-control-chip').length;
      const sortJoin = document.querySelector('.screener-command-dock .screener-sort-join');
      const regionTabs = document.querySelectorAll('.screener-command-dock .screener-region-tab').length;
      const bodyTxt = document.body.innerText || '';
      const headlineEl = document.querySelector('.opening-hero-headline');
      const accentEl = document.querySelector('.opening-headline-accent');
      const headlineFont = headlineEl ? getComputedStyle(headlineEl).fontFamily : '';
      const accentStyle = accentEl ? getComputedStyle(accentEl).fontStyle : '';
      const moverTab = Array.from(document.querySelectorAll('.opening-obs-tab')).find((b) => /24H Mover/i.test(b.innerText));
      if (moverTab) moverTab.click();
      return {
        hasStage: !!stage,
        hasWave: !!wave,
        hasCta: !!cta,
        dockCells,
        strategyPills,
        bandCount,
        controlChips,
        hasSortJoin: !!sortJoin,
        regionTabs,
        hasProFont: /Plus Jakarta Sans/i.test(headlineFont) && accentStyle === 'normal',
        hasRemovedAlphaBtn: !/AI 30D Alpha Picks/i.test(bodyTxt),
        hasRemovedRedundantPresets: !/Mega-Cap Club|Dividend Aristocrats/i.test(bodyTxt),
        hasRemovedAssetsBadge: !document.querySelector('.screener-matched-badge'),
        stageWidthOk: stage ? stage.getBoundingClientRect().right <= window.innerWidth + 1 : false
      };
    })()`);
    assert.equal(openingHeroCheck.hasStage, true, 'Signature architectural opening bento stage must render');
    assert.equal(openingHeroCheck.hasWave, true, 'Pulse Observatory SVG waveform must render');
    assert.equal(openingHeroCheck.hasCta, true, 'Workstation primary CTA must render in opening stage');
    assert.equal(openingHeroCheck.dockCells, 4, 'Telemetry dock must render 4 metric slots');
    assert.equal(openingHeroCheck.strategyPills, 5, 'Clean strategy segmented bar must render 5 essential options');
    assert.equal(openingHeroCheck.bandCount, 3, 'Screener command dock must organize controls into 3 clean bands');
    assert.equal(openingHeroCheck.controlChips, 2, 'Refine band must organize Cap & Sector into 2 clean control chips');
    assert.equal(openingHeroCheck.hasSortJoin, true, 'Unified Sort split control must render cleanly');
    assert.ok(openingHeroCheck.regionTabs >= 6, 'Clean region hairline selector strip must render global regions');
    assert.equal(openingHeroCheck.hasProFont, true, 'Opening hero headline must use unified Plus Jakarta Sans upright professional typography');
    assert.equal(openingHeroCheck.hasRemovedAlphaBtn, true, 'Redundant AI 30D Alpha Picks secondary CTA must be removed');
    assert.equal(openingHeroCheck.hasRemovedRedundantPresets, true, 'Redundant Mega-Cap Club and Dividend Aristocrats presets must be removed');
    assert.equal(openingHeroCheck.hasRemovedAssetsBadge, true, '309 Assets badge must be removed');
    assert.equal(openingHeroCheck.stageWidthOk, true, 'Opening hero must fit cleanly within viewport');
    await sleep(120);
    const obsSwitched = await evalJs(`(() => {
      const k = document.querySelector('.opening-obs-mode-badge');
      return k ? /24H MOMENTUM LEADER/i.test(k.innerText) : false;
    })()`);
    assert.equal(obsSwitched, true, 'Clicking 24H Mover tab inside Pulse Observatory must switch live spotlight card');

    // Verify Notification Bell shows live market & related notifications even before sign-in
    await evalJs(`(() => {
      const bell = document.getElementById('header-notification-bell-btn');
      if (bell) bell.click();
    })()`);
    let notifCheck = { open: false, cardCount: 0, hasEmptyPrompt: true, hasLiveFeed: false, hasManualLiveSync: true };
    for (let i = 0; i < 20; i++) {
      await sleep(200);
      notifCheck = await evalJs(`(() => {
        const menu = document.querySelector('.notification-menu');
        const txt = menu ? menu.innerText : '';
        const cards = menu ? menu.querySelectorAll('.notification-feed-card').length : 0;
        return {
          open: !!menu,
          cardCount: cards,
          hasEmptyPrompt: /No alerts triggered yet|No market notifications right now/i.test(txt),
          hasLiveFeed: cards > 0 && /Market & Alert Feed/i.test(txt),
          hasManualLiveSync: /Live Sync/i.test(txt)
        };
      })()`);
      if (notifCheck.cardCount > 0) break;
    }
    assert.equal(notifCheck.open, true, 'Notification Center must open cleanly');
    assert.equal(notifCheck.hasEmptyPrompt, false, 'Guest notifications must not be empty when live market feed exists');
    assert.equal(notifCheck.hasLiveFeed, true, 'Notification Center must render real market & related notification cards');
    assert.equal(notifCheck.hasManualLiveSync, false, 'Manual Live Sync button must be removed in favor of automatic sync');

    // Click a message card to open its Additional Details Inspector
    await evalJs(`(() => {
      const card = document.querySelector('.notification-feed-card');
      if (card) card.click();
    })()`);
    await sleep(250);
    const notifDetailCheck = await evalJs(`(() => {
      const detail = document.querySelector('.notification-detail-view');
      const menu = document.querySelector('.notification-menu');
      return {
        open: !!detail,
        hasBackBtn: menu ? /Back to Feed/i.test(menu.innerText) : false,
        hasDetailsText: detail ? detail.innerText.length > 80 : false
      };
    })()`);
    assert.equal(notifDetailCheck.open, true, 'Clicking a notification card must show the Additional Details Inspector');
    assert.equal(notifDetailCheck.hasBackBtn, true, 'Detail inspector must display Back to Feed navigation');
    assert.equal(notifDetailCheck.hasDetailsText, true, 'Detail inspector must show explanation & metrics');
    await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    await sleep(120);
    await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    await sleep(150);

    for (const tab of tabs) {
      await evalJs(`(() => {
        const btn = Array.from(document.querySelectorAll('.sidebar-topic-btn')).find((b) => b.innerText.includes(${JSON.stringify(tab)}));
        if (btn) btn.click();
      })()`);
      await sleep(700);
      await assertViewHealthy(`desktop:${tab}`);
      if (tab === 'Workstation') {
        const barCheck = await evalJs(`(() => {
          const bar = document.querySelector('.chart-permanent-ticker-bar');
          const txt = bar ? bar.innerText : '';
          return { exists: !!bar, hasOhlcClutter: txt.includes('Vol:') || txt.includes('O:') };
        })()`);
        assert.equal(barCheck.exists, true, 'StockChart ticker bar must exist');
        assert.equal(barCheck.hasOhlcClutter, false, 'Top bar near time must not render inline OHLC/Vol details');

        const chartBox = await evalJs(`(() => {
          const el = document.querySelector('.chart-canvas-container');
          if (!el) return null;
          el.scrollIntoView({ block: 'center' });
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width * 0.45, y: r.top + r.height * 0.5, rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom } };
        })()`);
        assert.ok(chartBox, 'Workstation chart container must be present');
        await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: chartBox.x, y: chartBox.y });
        await sleep(250);
        const floatCheck = await evalJs(`(() => {
          const card = document.querySelector('.chart-floating-cursor-card');
          const container = document.querySelector('.chart-canvas-container');
          if (!card || !container) return { present: false };
          const cr = card.getBoundingClientRect();
          const pr = container.getBoundingClientRect();
          const txt = card.innerText || '';
          return {
            present: true,
            left: cr.left,
            hasDetails: txt.includes('O:') && txt.includes('H:') && txt.includes('L:') && txt.includes('C:') && txt.includes('Vol:') && txt.includes('Rng:'),
            insideContainer: cr.left >= pr.left && cr.right <= pr.right && cr.top >= pr.top && cr.bottom <= pr.bottom
          };
        })()`);
        assert.equal(floatCheck.present, true, 'Floating cursor details card must appear on chart hover');
        assert.equal(floatCheck.hasDetails, true, 'Floating card must show O/H/L/C and Vol details');
        assert.equal(floatCheck.insideContainer, true, 'Floating card must remain strictly inside chart bounds');

        // Sweep cursor right & lower to confirm smooth translate3d glide & hysteresis flip stay inside bounds
        await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: chartBox.rect.left + (chartBox.rect.right - chartBox.rect.left) * 0.85, y: chartBox.rect.top + (chartBox.rect.bottom - chartBox.rect.top) * 0.78 });
        await sleep(320);
        const sweepCheck = await evalJs(`(() => {
          const card = document.querySelector('.chart-floating-cursor-card');
          const container = document.querySelector('.chart-canvas-container');
          if (!card || !container) return { present: false };
          const cr = card.getBoundingClientRect();
          const pr = container.getBoundingClientRect();
          return {
            present: true,
            left: cr.left,
            insideContainer: cr.left >= pr.left && cr.right <= pr.right && cr.top >= pr.top && cr.bottom <= pr.bottom
          };
        })()`);
        assert.equal(sweepCheck.present, true, 'Floating card must remain visible during cursor sweep');
        assert.equal(sweepCheck.insideContainer, true, 'Floating card must flip/clamp cleanly near bottom-right corner');
        assert.notEqual(Math.round(sweepCheck.left), Math.round(floatCheck.left), 'Floating card must glide to follow cursor sweep');

        // Verify modern custom calendar popover opens cleanly with month/year grid and zero native input[type="date"]
        await evalJs(`(() => {
          const trigger = document.querySelector('.chart-permanent-ticker-bar button[title*="Modern"]');
          if (trigger) trigger.click();
        })()`);
        await sleep(250);
        const calCheck = await evalJs(`(() => {
          const pop = document.querySelector('.modern-datepicker-popover');
          const nativeDates = document.querySelectorAll('input[type="date"]').length;
          return { open: !!pop, nativeDates, insideViewport: pop ? pop.getBoundingClientRect().right <= window.innerWidth : false };
        })()`);
        assert.equal(calCheck.open, true, 'Modern custom calendar popover must open from chart bar trigger');
        assert.equal(calCheck.nativeDates, 0, 'No old-fashioned native <input type="date"> should remain');
        assert.equal(calCheck.insideViewport, true, 'Modern calendar popover must stay inside viewport');
        await evalJs(`(() => {
          const monthBtn = document.querySelector('.modern-cal-mode-pill');
          if (monthBtn) monthBtn.click();
        })()`);
        await sleep(180);
        const monthGridOk = await evalJs(`document.querySelectorAll('.modern-cal-pill-item').length === 12`);
        assert.equal(monthGridOk, true, 'Modern calendar must switch smoothly to 12-month pill grid');
        await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
        await sleep(150);

        // Verify Strategy Desk hides Engine/Auto AI button & automatically routes questions cleanly
        await evalJs(`(() => {
          const orb = document.querySelector('button[aria-label="Open Trading Strategy Desk"]');
          if (orb) orb.click();
        })()`);
        await sleep(300);
        const aiHeaderCheck = await evalJs(`(() => {
          const btns = Array.from(document.querySelectorAll('.assistant-hdr-btn')).map((b) => b.innerText.trim());
          const starter = document.querySelector('.assistant-starter-chip');
          if (starter) starter.click();
          return {
            hasEngineOrAutoAiBtn: btns.some((t) => /Auto AI|Engine/i.test(t)),
            btnsCount: btns.length
          };
        })()`);
        assert.equal(aiHeaderCheck.hasEngineOrAutoAiBtn, false, 'Auto AI / Engine header button must stay hidden');
        let aiReplyOk = false;
        for (let i = 0; i < 20; i++) {
          await sleep(200);
          aiReplyOk = await evalJs(`(() => {
            const pill = document.querySelector('.assistant-ai-desk-pill');
            return pill ? /AUTO L[123]/i.test(pill.innerText) : false;
          })()`);
          if (aiReplyOk) break;
        }
        assert.equal(aiReplyOk, true, 'Strategy Desk must auto-route prompt and show AUTO L1/L2/L3 badge');
        await evalJs(`(() => {
          const closeBtn = document.querySelector('.assistant-hdr-btn-icon.close-btn');
          if (closeBtn) closeBtn.click();
        })()`);
        await sleep(200);
      }
    }

    // Authenticated sign-in + Paper Trading + Trader Profile Settings (Webhook UI)
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E CI Trader', email: `e2e_${Date.now()}@auratrade.test`, password: 'E2ePassword123!' })
    }).then((r) => r.json());
    assert.ok(reg.token, 'E2E test user registration must return token');

    await evalJs(`(() => {
      localStorage.removeItem('auratrade_logged_out');
      localStorage.setItem('auratrade_token', ${JSON.stringify(reg.token)});
      if (${JSON.stringify(!!reg.user)}) localStorage.setItem('auratrade_user', ${JSON.stringify(JSON.stringify(reg.user))});
    })()`);
    await cdp('Page.reload', { ignoreCache: true });
    let clickedPaper = false;
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      clickedPaper = await evalJs(`(() => {
        const btn = Array.from(document.querySelectorAll('.sidebar-topic-btn')).find((b) => b.innerText.includes('Paper Trading'));
        if (!btn) return false;
        btn.click();
        return true;
      })()`);
      if (clickedPaper) break;
    }
    assert.equal(clickedPaper, true, 'Authenticated reload must render Paper Trading sidebar button');

    let paperReady = false;
    for (let i = 0; i < 20; i++) {
      await sleep(200);
      paperReady = await evalJs(`(document.body.innerText || '').length > 300 && /Capital Allocation/i.test(document.body.innerText || '')`);
      if (paperReady) break;
    }
    await assertViewHealthy('authed:Paper Trading');
    const paperChecks = await evalJs(`(() => {
      const t = document.body.innerText || '';
      return {
        has1000: /\\$1,000(\\.00)?/.test(t),
        hasRealized: /Realized P&L/i.test(t),
        hasReset: /Reset\s*\(\$1,000\)/i.test(t) || t.toLowerCase().includes('reset ($1,000)'),
        hasAllocation: /Capital Allocation/i.test(t)
      };
    })()`);
    assert.equal(paperChecks.has1000, true, 'Paper Trading must display $1,000 balance');
    assert.equal(paperChecks.hasRealized, true, 'Paper Trading must display Realized P&L & Win Rate KPI card');
    assert.equal(paperChecks.hasReset, true, 'Paper Trading must display Reset ($1,000) control');
    assert.equal(paperChecks.hasAllocation, true, 'Paper Trading must display Capital Allocation bar');

    // Open TradeModal inside Paper Trading to verify Limit & $ Amount controls render cleanly
    await evalJs(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => /Execute Trade/i.test(b.innerText));
      if (btn) btn.click();
    })()`);
    await sleep(400);
    const modalChecks = await evalJs(`(() => {
      const t = document.body.innerText || '';
      return {
        hasLimit: /Limit \(Target Price\)/i.test(t) || t.toLowerCase().includes('limit (target price)'),
        hasUsdMode: t.includes('$ Amount'),
        hasBrackets: /Protective Brackets/i.test(t)
      };
    })()`);
    assert.equal(modalChecks.hasLimit, true, 'TradeModal must show Limit execution mode');
    assert.equal(modalChecks.hasUsdMode, true, 'TradeModal must show $ Amount fractional sizing mode');
    assert.equal(modalChecks.hasBrackets, true, 'TradeModal must show SL/TP Protective Brackets on BUY');
    await evalJs(`(() => {
      const closeBtn = document.querySelector('.modal-overlay button[aria-label="Close"], .modal-overlay button');
      const esc = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(esc);
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) overlay.click();
    })()`);
    await sleep(250);

    await evalJs(`(() => {
      const profileBtn = document.querySelector('.sidebar-profile-trigger') || Array.from(document.querySelectorAll('.sidebar-topic-btn')).find((b) => b.innerText.includes('Trader Profile'));
      if (profileBtn) profileBtn.click();
    })()`);
    await sleep(600);
    await evalJs(`(() => {
      const settingsBtn = Array.from(document.querySelectorAll('button')).find((b) => /Settings|Preferences/i.test(b.innerText));
      if (settingsBtn) settingsBtn.click();
    })()`);
    await sleep(500);
    const hasWebhookBridge = await evalJs(`document.body.innerText.includes('Live Market Data Feeds & Webhook Bridge')`);
    assert.equal(hasWebhookBridge, true, 'Trader Profile Settings must render Live Market Data Feeds & Webhook Bridge');

    // Click Push Sample Tick to test webhook pipeline live in browser UI
    await evalJs(`(() => {
      const pushBtn = Array.from(document.querySelectorAll('button')).find((b) => /Push Sample Tick/i.test(b.innerText));
      if (pushBtn) pushBtn.click();
    })()`);
    await sleep(900);
    const webhookToastVisible = await evalJs(`/Webhook ingested AAPL/i.test(document.body.innerText)`);
    assert.equal(webhookToastVisible, true, 'Push Sample Tick button must ingest tick and show confirmation banner');

    // Mobile 390px pass
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await sleep(300);

    // Reload on 390px mobile to verify OpeningReveal alignment & single-line centering
    await cdp('Page.reload', { ignoreCache: true });
    let revealCheck = { found: false, centered: false, tagSingleLine: false, emblemOnHorizon: false };
    for (let i = 0; i < 20; i++) {
      await sleep(75);
      revealCheck = await evalJs(`(() => {
        const emblem = document.querySelector('.opening-reveal-emblem');
        const brand = document.querySelector('.opening-reveal-brand');
        const tag = document.querySelector('.opening-reveal-tag');
        if (!emblem || !brand || !tag) return { found: false, centered: false, tagSingleLine: false, emblemOnHorizon: false };
        const vwCenter = window.innerWidth / 2;
        const vhCenter = window.innerHeight / 2;
        const er = emblem.getBoundingClientRect();
        const br = brand.getBoundingClientRect();
        const tr = tag.getBoundingClientRect();
        const eCenterX = (er.left + er.right) / 2;
        const bCenterX = (br.left + br.right) / 2;
        const tCenterX = (tr.left + tr.right) / 2;
        const eCenterY = (er.top + er.bottom) / 2;
        return {
          found: true,
          centered: Math.abs(eCenterX - vwCenter) <= 5 && Math.abs(bCenterX - vwCenter) <= 8 && Math.abs(tCenterX - vwCenter) <= 8,
          tagSingleLine: tr.height <= 22,
          emblemOnHorizon: Math.abs(eCenterY - vhCenter) <= 22
        };
      })()`);
      if (revealCheck.found) break;
    }
    assert.equal(revealCheck.found, true, 'Mobile 390px reload must show OpeningReveal curtain briefly');
    assert.equal(revealCheck.centered, true, 'Mobile 390px OpeningReveal emblem, brand, and tag must be centered');
    assert.equal(revealCheck.tagSingleLine, true, 'Mobile 390px GLOBAL MARKET INTELLIGENCE tag must stay on a single line');
    assert.equal(revealCheck.emblemOnHorizon, true, 'Mobile 390px emblem square must sit centered across the horizon beam');
    await sleep(1100);

    for (const tab of ['All Companies Market', 'Paper Trading', 'Gold & Silver Market']) {
      await evalJs(`(() => {
        const btn = Array.from(document.querySelectorAll('.sidebar-topic-btn')).find((b) => b.innerText.includes(${JSON.stringify(tab)}));
        if (btn) btn.click();
      })()`);
      await sleep(600);
      await assertViewHealthy(`mobile390:${tab}`);
    }

    assert.deepEqual(failedNetwork, [], `Failed HTTP requests detected: ${JSON.stringify(failedNetwork)}`);
    assert.deepEqual(consoleErrors, [], `Console errors detected: ${JSON.stringify(consoleErrors)}`);
    assert.deepEqual(pageExceptions, [], `Uncaught page exceptions: ${JSON.stringify(pageExceptions)}`);
    console.log('UI E2E CI SUITE PASSED: All desktop, authenticated, webhook UI, and mobile 390px checks clean.');
  } finally {
    try { ws?.close(); } catch {}
    try { proc.kill(); } catch {}
    marketFeedManager.resetForTesting();
    try { ingestionWorker.stop(); } catch {}
    await new Promise((resolve) => srv.close(resolve));
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
