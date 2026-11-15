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
    for (const tab of tabs) {
      await evalJs(`(() => {
        const btn = Array.from(document.querySelectorAll('.sidebar-topic-btn')).find((b) => b.innerText.includes(${JSON.stringify(tab)}));
        if (btn) btn.click();
      })()`);
      await sleep(700);
      await assertViewHealthy(`desktop:${tab}`);
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
    await sleep(1800);

    await evalJs(`(() => {
      const btn = Array.from(document.querySelectorAll('.sidebar-topic-btn')).find((b) => b.innerText.includes('Paper Trading'));
      if (btn) btn.click();
    })()`);
    await sleep(600);
    await assertViewHealthy('authed:Paper Trading');
    const paperHas1000 = await evalJs(`/\\$1,000(\\.00)?/.test(document.body.innerText)`);
    assert.equal(paperHas1000, true, 'Paper Trading must display $1,000 balance');

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
    await sleep(400);
    for (const tab of ['All Companies Market', 'Gold & Silver Market']) {
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
