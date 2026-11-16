const axios = require('axios');

const getMarketDataService = () => require('./marketDataService');

const YAHOO_RSS_URL =
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^IXIC,AAPL,NVDA,MSFT,TSLA,GC=F,^NSEI&region=US&lang=en-US';

const TICKER_DETECT_MAP = [
  { pattern: /\b(nvidia|nvda)\b/i, symbol: 'NVDA' },
  { pattern: /\b(apple|aapl|iphone)\b/i, symbol: 'AAPL' },
  { pattern: /\b(tesla|tsla|elon musk)\b/i, symbol: 'TSLA' },
  { pattern: /\b(microsoft|msft)\b/i, symbol: 'MSFT' },
  { pattern: /\b(amazon|amzn|aws)\b/i, symbol: 'AMZN' },
  { pattern: /\b(alphabet|google|googl)\b/i, symbol: 'GOOGL' },
  { pattern: /\b(meta|facebook)\b/i, symbol: 'META' },
  { pattern: /\b(gold|bullion|xau)\b/i, symbol: 'GOLD' },
  { pattern: /\b(silver|xag)\b/i, symbol: 'SILVER' },
  { pattern: /\b(nifty|sensex|india|rbi|reliance)\b/i, symbol: 'RELIANCE' },
  { pattern: /\b(s&p 500|fed|powell|fomc|treasury|nasdaq|wall street)\b/i, symbol: 'SPY' }
];

const decodeXmlEntities = (str = '') =>
  String(str)
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]*>/g, '')
    .trim();

const getCurrSym = (curr, symbol = '') => {
  const c = String(curr || '').toUpperCase();
  if (c === 'INR' || symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol.endsWith('.MCX') || symbol.includes('NIFTY') || symbol.includes('SENSEX')) {
    return '₹';
  }
  if (c === 'GBP') return '£';
  if (c === 'EUR') return '€';
  if (c === 'JPY' || c === 'CNY') return '¥';
  return '$';
};

class MarketNotificationService {
  constructor() {
    this.http = axios.create({ timeout: 1200 });
    this.rssCache = { items: [], fetchedAt: 0 };
    this.snapshotCache = { items: [], fetchedAt: 0 };
    this.surgeCooldown = new Map(); // symbol -> lastBroadcastMs
  }

  async fetchLiveNewsHeadlines() {
    const now = Date.now();
    if (this.rssCache.items.length > 0 && now - this.rssCache.fetchedAt < 3 * 60 * 1000) {
      return this.rssCache.items;
    }

    try {
      const res = await this.http.get(YAHOO_RSS_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraTrade/1.0',
          Accept: 'application/rss+xml, application/xml, text/xml'
        }
      });

      const xml = typeof res.data === 'string' ? res.data : '';
      if (!xml || !xml.includes('<item')) return this.rssCache.items;

      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null && items.length < 4) {
        const block = match[1];
        const titleRaw = (block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
        const descRaw = (block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '';
        const linkRaw = (block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '';
        const pubDateRaw = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';

        const title = decodeXmlEntities(titleRaw);
        const description = decodeXmlEntities(descRaw);
        const url = decodeXmlEntities(linkRaw);
        if (!title || title.length < 12) continue;

        const detected = TICKER_DETECT_MAP.find((entry) => entry.pattern.test(title));
        const symbol = detected ? detected.symbol : 'SPY';
        let quote = null;
        try {
          quote = await getMarketDataService().getQuote(symbol);
        } catch (_) {}

        const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
        const tsIso = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
        const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
        const cs = getCurrSym(quote?.currency, symbol);

        items.push({
          id: `mkt_news_${slug}`,
          kind: 'news',
          category: 'NEWS',
          symbol,
          title,
          message: description ? description.slice(0, 180) + (description.length > 180 ? '...' : '') : `${title} — Live financial news feed (${symbol})`,
          url: url && url.startsWith('http') ? url : null,
          source: 'Yahoo Finance News',
          price: quote ? Number(quote.price) : undefined,
          changePercent: quote ? Number(quote.changePercent) : undefined,
          currencySymbol: cs,
          details: {
            categoryLabel: 'Breaking Financial News Headline',
            whatItMeans: `Real-time market news headline linked to ${symbol}. Breaking news headlines often trigger short-term volatility spikes and institutional repricing around affected equities or macro sectors.`,
            summary: description || title,
            metrics: [
              { label: 'Related Ticker', value: symbol },
              { label: 'Live Price', value: quote ? `${cs}${Number(quote.price).toFixed(2)}` : '—' },
              { label: 'Day Move', value: quote ? `${quote.changePercent >= 0 ? '+' : ''}${Number(quote.changePercent).toFixed(2)}%` : '—' },
              { label: 'Feed Source', value: 'Yahoo Finance RSS' }
            ]
          },
          read: false,
          timestamp: tsIso
        });
      }

      if (items.length > 0) {
        this.rssCache = { items, fetchedAt: now };
      }
      return items;
    } catch (_) {
      // Offline/sandbox environments cleanly fall back to live telemetry signals without throwing
      return this.rssCache.items;
    }
  }

  async buildBaseMarketSignals() {
    const now = Date.now();
    if (this.snapshotCache.items.length > 0 && now - this.snapshotCache.fetchedAt < 25 * 1000) {
      return this.snapshotCache.items;
    }

    const signals = [];
    const hourBucket = Math.floor(now / (60 * 60 * 1000));

    try {
      const mds = getMarketDataService();
      const [allMarkets, globalIndices, metals, nse] = await Promise.all([
        mds.getAllMarketCompanies({
          region: 'all',
          tier: 'all',
          sector: 'all',
          sortBy: 'marketCap',
          order: 'desc'
        }).catch(() => null),
        mds.getGlobalIndices('major').catch(() => null),
        mds.getPreciousMetalsData().catch(() => null),
        mds.getNSEIndiaMarketData().catch(() => null)
      ]);

      const companies = allMarkets?.companies || [];
      if (companies.length > 0) {
        const sortedByGain = [...companies].sort((a, b) => Number(b.changePercent || 0) - Number(a.changePercent || 0));
        const topGainer = sortedByGain[0];
        const topLoser = sortedByGain[sortedByGain.length - 1];

        if (topGainer) {
          const cs = getCurrSym(topGainer.currency, topGainer.symbol);
          signals.push({
            id: `mkt_mover_up_${topGainer.symbol}_${hourBucket}`,
            kind: 'market',
            category: 'MOVER',
            symbol: topGainer.symbol,
            title: `Top Market Breakout: ${topGainer.name} (${topGainer.symbol})`,
            message: `${topGainer.symbol} leads market momentum at ${cs}${Number(topGainer.price).toFixed(2)} (+${Number(topGainer.changePercent).toFixed(2)}%). Rating: ${topGainer.rating}.`,
            price: Number(topGainer.price),
            changePercent: Number(topGainer.changePercent),
            currencySymbol: cs,
            details: {
              categoryLabel: 'Strongest Intraday Gainer Across Tracked Markets',
              whatItMeans: `${topGainer.name} (${topGainer.symbol}) is currently the #1 percentage gainer in the live market feed. Sustained momentum above day highs indicates active buyer demand; avoid chasing extended candles without checking RSI & support levels.`,
              metrics: [
                { label: 'Sector', value: topGainer.sector || 'Equities' },
                { label: 'Day Range', value: `${cs}${Number(topGainer.dayLow).toFixed(2)} – ${cs}${Number(topGainer.dayHigh).toFixed(2)}` },
                { label: '52W High / Low', value: `${cs}${Number(topGainer.high52).toFixed(2)} / ${cs}${Number(topGainer.low52).toFixed(2)}` },
                { label: '30D Target', value: `${cs}${Number(topGainer.forecastPrice30d || topGainer.price * 1.05).toFixed(2)}` },
                { label: 'Quant Rating', value: topGainer.rating || 'BUY' },
                { label: 'Market Cap', value: topGainer.marketCapFormatted || 'Large-Cap' }
              ]
            },
            read: false,
            timestamp: new Date(now - 60 * 1000).toISOString()
          });
        }

        if (topLoser && Number(topLoser.changePercent) < 0) {
          const cs = getCurrSym(topLoser.currency, topLoser.symbol);
          signals.push({
            id: `mkt_mover_dn_${topLoser.symbol}_${hourBucket}`,
            kind: 'market',
            category: 'PULLBACK',
            symbol: topLoser.symbol,
            title: `Key Market Pullback: ${topLoser.name} (${topLoser.symbol})`,
            message: `${topLoser.symbol} is down ${Number(topLoser.changePercent).toFixed(2)}% to ${cs}${Number(topLoser.price).toFixed(2)}. Watch support & oversold reversal zones.`,
            price: Number(topLoser.price),
            changePercent: Number(topLoser.changePercent),
            currencySymbol: cs,
            details: {
              categoryLabel: 'Steepest Pullback / Volatility Alert',
              whatItMeans: `${topLoser.name} (${topLoser.symbol}) is experiencing the largest negative drawdown in this session. Sharp pullbacks can either signal trend breakdown or discounted mean-reversion entry near structural support.`,
              metrics: [
                { label: 'Sector', value: topLoser.sector || 'Equities' },
                { label: 'Day Range', value: `${cs}${Number(topLoser.dayLow).toFixed(2)} – ${cs}${Number(topLoser.dayHigh).toFixed(2)}` },
                { label: '52W Range', value: `${cs}${Number(topLoser.low52).toFixed(2)} – ${cs}${Number(topLoser.high52).toFixed(2)}` },
                { label: 'Risk Profile', value: topLoser.riskLevel || 'Elevated Volatility' },
                { label: 'Consensus', value: topLoser.rating || 'HOLD' },
                { label: 'Market Cap', value: topLoser.marketCapFormatted || 'Tracked Equity' }
              ]
            },
            read: false,
            timestamp: new Date(now - 120 * 1000).toISOString()
          });
        }

        // Near 52-Week High Breakout Candidate
        const nearHigh = companies.find(
          (c) => Number(c.high52) > 0 && Number(c.price) / Number(c.high52) >= 0.96 && Number(c.changePercent) > 0
        );
        if (nearHigh && nearHigh.symbol !== topGainer?.symbol) {
          const cs = getCurrSym(nearHigh.currency, nearHigh.symbol);
          signals.push({
            id: `mkt_52wh_${nearHigh.symbol}_${hourBucket}`,
            kind: 'market',
            category: 'SIGNAL',
            symbol: nearHigh.symbol,
            title: `Near 52-Week High Breakout: ${nearHigh.symbol}`,
            message: `${nearHigh.symbol} (${cs}${Number(nearHigh.price).toFixed(2)}) is within 4% of its 52W peak (${cs}${Number(nearHigh.high52).toFixed(2)}) with bullish momentum.`,
            price: Number(nearHigh.price),
            changePercent: Number(nearHigh.changePercent),
            currencySymbol: cs,
            details: {
              categoryLabel: 'Technical Resistance & 52-Week High Proximity',
              whatItMeans: `Assets trading within 4% of their 52-week high on positive daily gain often trigger momentum breakouts when overhead supply clears cleanly above ${cs}${Number(nearHigh.high52).toFixed(2)}.`,
              metrics: [
                { label: 'Distance to 52W High', value: `${(((Number(nearHigh.high52) - Number(nearHigh.price)) / Number(nearHigh.high52)) * 100).toFixed(2)}%` },
                { label: '52W Peak', value: `${cs}${Number(nearHigh.high52).toFixed(2)}` },
                { label: 'P/E Ratio', value: nearHigh.peRatio ? `${nearHigh.peRatio}x` : 'N/A' },
                { label: 'Quant Score', value: `${nearHigh.ratingScore || 85}/100` }
              ]
            },
            read: false,
            timestamp: new Date(now - 240 * 1000).toISOString()
          });
        }
      }

      if (globalIndices?.indices?.length > 0) {
        const sp = globalIndices.indices.find((i) => i.symbol === '^GSPC' || i.name?.includes('S&P')) || globalIndices.indices[0];
        const nq = globalIndices.indices.find((i) => i.symbol === '^IXIC' || i.name?.includes('Nasdaq'));
        const sum = globalIndices.summary || {};
        signals.push({
          id: `mkt_macro_global_${hourBucket}`,
          kind: 'market',
          category: 'MACRO',
          symbol: 'SPY',
          title: `Global Indices Pulse: ${sum.sentiment || 'Active Session'}`,
          message: `${sp.name}: ${Number(sp.last).toLocaleString()} (${sp.chgPercent >= 0 ? '+' : ''}${Number(sp.chgPercent).toFixed(2)}%)${nq ? ` · Nasdaq: ${Number(nq.chgPercent) >= 0 ? '+' : ''}${Number(nq.chgPercent).toFixed(2)}%` : ''} · ${sum.advancing || 0} advancing / ${sum.declining || 0} declining.`,
          price: Number(sp.last),
          changePercent: Number(sp.chgPercent),
          currencySymbol: '$',
          details: {
            categoryLabel: 'Macro & Sovereign Index Breadth Summary',
            whatItMeans: `Tracks cross-regional equity appetite across Americas, Europe, and Asia-Pacific benchmarks. Broad advancing breadth (>60% green indices) supports risk-on positioning; diverging breadth flags macro rotation.`,
            metrics: [
              { label: 'Market Regime', value: sum.sentiment || 'Active' },
              { label: 'Advancing / Declining', value: `${sum.advancing || 0} / ${sum.declining || 0}` },
              { label: sp.name || 'S&P 500', value: `${Number(sp.last).toLocaleString()} (${sp.chgPercent >= 0 ? '+' : ''}${Number(sp.chgPercent).toFixed(2)}%)` },
              { label: 'Leading Index', value: sum.topGainer ? `${sum.topGainer.name} (+${Number(sum.topGainer.chgPercent).toFixed(2)}%)` : '—' }
            ]
          },
          read: false,
          timestamp: new Date(now - 180 * 1000).toISOString()
        });
      }

      if (nse?.heroIndices?.length > 0) {
        const nifty = nse.heroIndices[0];
        const topNse = nse.topGainers?.[0];
        signals.push({
          id: `mkt_nse_pulse_${hourBucket}`,
          kind: 'market',
          category: 'NSE',
          symbol: 'RELIANCE',
          title: `NSE India: ${nifty.symbol} @ ₹${Number(nifty.price).toLocaleString()} (${nifty.changePercent >= 0 ? '+' : ''}${Number(nifty.changePercent).toFixed(2)}%)`,
          message: `Session ${nse.status?.isOpen ? 'Open' : 'Summary'} · ${nse.marketBreadth?.advances || 0} Advances vs ${nse.marketBreadth?.declines || 0} Declines${topNse ? ` · Top NSE Gainer: ${topNse.symbol} (+${Number(topNse.changePercent).toFixed(2)}%)` : ''}.`,
          price: Number(nifty.price),
          changePercent: Number(nifty.changePercent),
          currencySymbol: '₹',
          details: {
            categoryLabel: 'National Stock Exchange (NSE India) Breadth Alert',
            whatItMeans: `Real-time snapshot of Indian benchmark performance, market session status (${nse.status?.statusText || 'Live'}), and institutional FII/DII breadth across ${nse.marketBreadth?.totalTradedEquities || 2554} NSE stocks.`,
            metrics: [
              { label: 'Benchmark Level', value: `${nifty.symbol} ₹${Number(nifty.price).toLocaleString()}` },
              { label: 'Advances / Declines', value: `${nse.marketBreadth?.advances || 0} / ${nse.marketBreadth?.declines || 0}` },
              { label: 'Session Status', value: nse.status?.statusText || (nse.status?.isOpen ? 'Open' : 'Summary') },
              { label: 'Top NSE Gainer', value: topNse ? `${topNse.symbol} (+${Number(topNse.changePercent).toFixed(2)}%)` : '—' }
            ]
          },
          read: false,
          timestamp: new Date(now - 210 * 1000).toISOString()
        });
      }

      if (metals?.metalsCatalog?.length > 0) {
        const gold = metals.metalsCatalog.find((m) => m.symbol === 'GOLD') || metals.metalsCatalog[0];
        const silver = metals.metalsCatalog.find((m) => m.symbol === 'SILVER');
        signals.push({
          id: `mkt_bullion_spot_${hourBucket}`,
          kind: 'market',
          category: 'BULLION',
          symbol: 'GOLD',
          title: `Bullion Hedge Desk: Gold $${Number(gold.price).toFixed(2)} (${gold.changePercent >= 0 ? '+' : ''}${Number(gold.changePercent).toFixed(2)}%)`,
          message: `Spot Gold at $${Number(gold.price).toFixed(2)}/oz${silver ? ` · Spot Silver at $${Number(silver.price).toFixed(2)}/oz (${silver.changePercent >= 0 ? '+' : ''}${Number(silver.changePercent).toFixed(2)}%)` : ''} · Gold/Silver Ratio: ${metals.goldSilverRatio || '60.5'}:1.`,
          price: Number(gold.price),
          changePercent: Number(gold.changePercent),
          currencySymbol: '$',
          details: {
            categoryLabel: 'Precious Metals & Safe-Haven Hedge Desk',
            whatItMeans: `Monitors Spot Gold (XAU) & Silver (XAG) hedging flow relative to Treasury yields and DXY. The Gold/Silver Ratio compared to its historical mean (~74:1) signals relative valuation between monetary and industrial metals.`,
            metrics: [
              { label: 'Spot Gold (XAU)', value: `$${Number(gold.price).toFixed(2)} (${gold.changePercent >= 0 ? '+' : ''}${Number(gold.changePercent).toFixed(2)}%)` },
              { label: 'Spot Silver (XAG)', value: silver ? `$${Number(silver.price).toFixed(2)} (${silver.changePercent >= 0 ? '+' : ''}${Number(silver.changePercent).toFixed(2)}%)` : '—' },
              { label: 'Gold / Silver Ratio', value: `${metals.goldSilverRatio || '60.5'} : 1` },
              { label: 'Macro Driver', value: metals.macroDrivers?.[0]?.label || 'US Dollar & Real Yields' }
            ]
          },
          read: false,
          timestamp: new Date(now - 300 * 1000).toISOString()
        });
      }
    } catch (err) {
      console.error('[MarketNotificationService] Signal build warning:', err.message);
    }

    if (signals.length > 0) {
      this.snapshotCache = { items: signals, fetchedAt: now };
    }
    return signals;
  }

  async getLiveMarketNotifications(focusSymbols = []) {
    const cleanFocus = Array.from(
      new Set(
        (Array.isArray(focusSymbols) ? focusSymbols : [])
          .map((s) => String(s || '').toUpperCase().trim())
          .filter(Boolean)
      )
    ).slice(0, 6);

    const rssPromise = this.fetchLiveNewsHeadlines();
    const softBoundedRss = Promise.race([
      rssPromise,
      new Promise((resolve) => setTimeout(() => resolve(this.rssCache.items), 650))
    ]);

    const [baseSignals, newsItems] = await Promise.all([
      this.buildBaseMarketSignals(),
      softBoundedRss
    ]);

    const relatedSignals = [];
    const hourBucket = Math.floor(Date.now() / (60 * 60 * 1000));

    for (const sym of cleanFocus.slice(0, 3)) {
      try {
        const quote = await getMarketDataService().getQuote(sym);
        if (!quote || !quote.price) continue;
        const cs = getCurrSym(quote.currency, sym);
        const pct = Number(quote.changePercent || 0);
        relatedSignals.push({
          id: `mkt_related_${sym}_${hourBucket}`,
          kind: 'market',
          category: 'RELATED',
          symbol: sym,
          title: `Related Watch: ${sym} @ ${cs}${Number(quote.price).toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`,
          message: `Live pulse for your watched/held symbol ${sym}${quote.name ? ` (${quote.name})` : ''}. Day Range: ${cs}${Number(quote.low || quote.dayLow || quote.price).toFixed(2)} – ${cs}${Number(quote.high || quote.dayHigh || quote.price).toFixed(2)}.`,
          price: Number(quote.price),
          changePercent: pct,
          currencySymbol: cs,
          details: {
            categoryLabel: 'Personalized Watchlist & Holding Telemetry',
            whatItMeans: `Real-time tracker pinned automatically because ${sym} is actively in your workstation chart, watchlist, or paper portfolio holdings.`,
            metrics: [
              { label: 'Instrument', value: quote.name || sym },
              { label: 'Live Price', value: `${cs}${Number(quote.price).toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)` },
              { label: 'Day Range', value: `${cs}${Number(quote.low || quote.dayLow || quote.price).toFixed(2)} – ${cs}${Number(quote.high || quote.dayHigh || quote.price).toFixed(2)}` },
              { label: 'Source', value: quote.source || 'Live Feed' }
            ]
          },
          read: false,
          timestamp: new Date().toISOString()
        });
      } catch (_) {}
    }

    // Merge uniquely by id, prioritizing Related -> News -> Market Signals
    const seen = new Set();
    const combined = [];
    for (const item of [...relatedSignals, ...newsItems, ...baseSignals]) {
      if (!item || !item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      combined.push(item);
    }

    return combined.slice(0, 12);
  }

  /**
   * Detects significant real-time surges or webhook spikes for live Socket.io push broadcasts.
   */
  detectLiveSurgeNotification(quote, prevPrice) {
    if (!quote || !quote.symbol || !quote.price) return null;
    const sym = String(quote.symbol).toUpperCase().trim();
    const pct = Number(quote.changePercent || 0);
    const tickJumpPct = prevPrice > 0 ? Math.abs(((quote.price - prevPrice) / prevPrice) * 100) : 0;

    const isWebhookTick = String(quote.source || '').toLowerCase().includes('webhook');
    if (!isWebhookTick && tickJumpPct < 1.25 && Math.abs(pct) < 3.2) {
      return null;
    }

    const now = Date.now();
    const lastSent = this.surgeCooldown.get(sym) || 0;
    if (!isWebhookTick && now - lastSent < 10 * 60 * 1000) {
      return null;
    }
    this.surgeCooldown.set(sym, now);

    const cs = getCurrSym(quote.currency, sym);
    const up = pct >= 0;
    return {
      id: `mkt_live_${sym}_${now}`,
      kind: 'market',
      category: isWebhookTick ? 'LIVE FEED' : 'MOVER',
      symbol: sym,
      title: `${sym} ${up ? 'Surge' : 'Drop'}: ${cs}${Number(quote.price).toFixed(2)} (${up ? '+' : ''}${pct.toFixed(2)}%)`,
      message: `${sym} posted a live tick via ${quote.source || 'Market Stream'} at ${cs}${Number(quote.price).toFixed(2)}.`,
      price: Number(quote.price),
      changePercent: pct,
      currencySymbol: cs,
      read: false,
      timestamp: new Date(now).toISOString()
    };
  }
}

module.exports = new MarketNotificationService();
