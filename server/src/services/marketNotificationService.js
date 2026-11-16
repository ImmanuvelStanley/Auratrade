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
    this.http = axios.create({ timeout: 2200 });
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
        const linkRaw = (block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '';
        const pubDateRaw = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';

        const title = decodeXmlEntities(titleRaw);
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

        items.push({
          id: `mkt_news_${slug}`,
          kind: 'news',
          category: 'NEWS',
          symbol,
          title,
          message: `${title} — Live financial news feed (${symbol})`,
          url: url && url.startsWith('http') ? url : null,
          source: 'Yahoo Finance News',
          price: quote ? Number(quote.price) : undefined,
          changePercent: quote ? Number(quote.changePercent) : undefined,
          currencySymbol: getCurrSym(quote?.currency, symbol),
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

    const [baseSignals, newsItems] = await Promise.all([
      this.buildBaseMarketSignals(),
      this.fetchLiveNewsHeadlines()
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
