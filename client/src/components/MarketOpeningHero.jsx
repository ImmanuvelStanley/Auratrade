import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { formatAllTimePercent } from '../utils/stockRecordEngine';

const QUICK_TICKERS = [
  { symbol: 'NVDA', label: 'NVDA', currency: 'USD', fallbackPrice: 138.25, fallbackPct: 2.14 },
  { symbol: 'AAPL', label: 'AAPL', currency: 'USD', fallbackPrice: 229.40, fallbackPct: 1.08 },
  { symbol: 'RELIANCE', label: 'RELIANCE', currency: 'INR', fallbackPrice: 1294.60, fallbackPct: 1.35 },
  { symbol: 'GOLD', label: 'GOLD', currency: 'USD', fallbackPrice: 2684.50, fallbackPct: 0.72 }
];

function getCurrencySymbolSafe(currency, symbol = '') {
  const symUpper = String(symbol || '').toUpperCase();
  if (symUpper === 'VIX' || symUpper === 'INDIA VIX' || symUpper === 'DXY') return '';
  switch (String(currency || 'USD').toUpperCase()) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY':
    case 'CNY': return '¥';
    case 'HKD': return 'HK$';
    case 'AUD': return 'A$';
    case 'CAD': return 'CA$';
    case 'CHF': return 'CHF ';
    case 'BRL': return 'R$';
    default: return '$';
  }
}

function formatPriceSafe(value, currency = 'USD', symbol = '') {
  const num = Number(value);
  if (!Number.isFinite(num)) return '$0.00';
  const cs = getCurrencySymbolSafe(currency, symbol);
  const abs = Math.abs(num);
  const formatted = abs >= 1000
    ? abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toFixed(2);
  return num < 0 ? `-${cs}${formatted}` : `${cs}${formatted}`;
}

function formatSignedPct(pct) {
  const num = Number(pct);
  if (!Number.isFinite(num)) return '+0.00%';
  return `${num >= 0 ? '+' : '-'}${Math.abs(num).toFixed(2)}%`;
}

export const MarketOpeningHero = React.memo(function MarketOpeningHero({
  liveOverview,
  overview,
  quotes,
  rawCompanies = [],
  totalAssetsCount = 309,
  onSelectSymbol,
  onOpenDeepRecord,
  onExploreAiUpside
}) {
  const [spotlightTab, setSpotlightTab] = useState('ai'); // 'ai' | 'mover' | 'legacy'
  const [tabPaused, setTabPaused] = useState(false);

  useEffect(() => {
    if (tabPaused) return undefined;
    const cycle = setInterval(() => {
      setSpotlightTab((prev) => (prev === 'ai' ? 'mover' : prev === 'mover' ? 'legacy' : 'ai'));
    }, 6500);
    return () => clearInterval(cycle);
  }, [tabPaused]);

  const companyLookup = useMemo(() => {
    const map = new Map();
    (rawCompanies || []).forEach((c) => {
      if (c?.symbol) map.set(c.symbol.toUpperCase().trim(), c);
    });
    return map;
  }, [rawCompanies]);

  const totalCount = liveOverview?.totalCount || overview?.totalCount || totalAssetsCount || 309;
  const totalCapFormatted = liveOverview?.totalMarketCapFormatted || overview?.totalMarketCapFormatted || '$181.20T';
  const bullishRatio = liveOverview?.bullishRatio ?? overview?.bullishRatio ?? 98;
  const advancingCount = liveOverview?.advancingCount ?? Math.round(totalCount * 0.68);
  const decliningCount = liveOverview?.decliningCount ?? Math.max(0, totalCount - advancingCount);
  const breadthTotal = Math.max(1, advancingCount + decliningCount);
  const advancingPct = Math.max(12, Math.min(94, Math.round((advancingCount / breadthTotal) * 100)));

  const aiPick = liveOverview?.topConviction || {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    forecastGain: 14.2,
    ratingScore: 98
  };
  const topMover = liveOverview?.topGainer || {
    symbol: 'SONY',
    name: 'Sony Group Corporation',
    changePercent: 3.45,
    price: 21.8,
    currency: 'USD'
  };
  const allTimeHero = liveOverview?.allTimeBestGainer || {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    ipoYear: 1986,
    allTimeReturnPercent: 708343,
    allTimeMultiple: 7084,
    currency: 'USD'
  };

  const quickTickersLive = useMemo(() => {
    return QUICK_TICKERS.map((entry) => {
      const base = companyLookup.get(entry.symbol);
      const q = quotes?.[entry.symbol];
      const pct = q?.changePercent !== undefined
        ? Number(q.changePercent)
        : base?.changePercent !== undefined
          ? Number(base.changePercent)
          : entry.fallbackPct;
      return {
        symbol: entry.symbol,
        label: entry.label,
        pct: Number.isFinite(pct) ? pct : entry.fallbackPct
      };
    });
  }, [companyLookup, quotes]);

  const activeSpotlight = useMemo(() => {
    if (spotlightTab === 'mover') {
      const sym = topMover.symbol || 'SONY';
      const base = companyLookup.get(sym);
      const q = quotes?.[sym];
      const livePrice = q?.price ?? topMover.price ?? base?.price ?? 0;
      const currency = q?.currency || topMover.currency || base?.currency || 'USD';
      const pct = q?.changePercent ?? topMover.changePercent ?? 0;
      return {
        modeLabel: '24H MOMENTUM LEADER',
        symbol: sym,
        name: topMover.name || base?.name || sym,
        priceText: formatPriceSafe(livePrice, currency, sym),
        badgeText: `${formatSignedPct(pct)} LIVE`,
        isPositive: Number(pct) >= 0,
        subtitle: 'Top real-time session mover across global exchanges',
        item: base || topMover,
        curveBias: 1.18
      };
    }
    if (spotlightTab === 'legacy') {
      const sym = allTimeHero.symbol || 'MSFT';
      const base = companyLookup.get(sym);
      const q = quotes?.[sym];
      const livePrice = q?.price ?? base?.price ?? allTimeHero.currentPrice ?? 420;
      const currency = q?.currency || allTimeHero.currency || base?.currency || 'USD';
      return {
        modeLabel: `ALL-TIME LEADER · SINCE ${allTimeHero.ipoYear || 1986}`,
        symbol: sym,
        name: allTimeHero.name || base?.name || 'Microsoft Corporation',
        priceText: formatPriceSafe(livePrice, currency, sym),
        badgeText: `${Math.round(allTimeHero.allTimeMultiple || 7084).toLocaleString()}x RETURN`,
        isPositive: true,
        subtitle: `Cumulative compounding gain of ${formatAllTimePercent(allTimeHero.allTimeReturnPercent || 708343)}`,
        item: base || allTimeHero,
        curveBias: 1.32
      };
    }

    const sym = aiPick.symbol || 'NVDA';
    const base = companyLookup.get(sym);
    const q = quotes?.[sym];
    const livePrice = q?.price ?? base?.price ?? 138.25;
    const currency = q?.currency || base?.currency || 'USD';
    return {
      modeLabel: '30D AI CONVICTION PICK',
      symbol: sym,
      name: aiPick.name || base?.name || sym,
      priceText: formatPriceSafe(livePrice, currency, sym),
      badgeText: `+${Math.abs(Number(aiPick.forecastGain ?? 14.2)).toFixed(1)}% 30D`,
      isPositive: true,
      subtitle: `Quant conviction ${aiPick.ratingScore || 98}/100 with trend confirmation`,
      item: base || aiPick,
      curveBias: 1.0
    };
  }, [spotlightTab, topMover, allTimeHero, aiPick, companyLookup, quotes]);

  const pulsePaths = useMemo(() => {
    const amp = 15 + (advancingPct / 100) * 14 * activeSpotlight.curveBias;
    const endY = activeSpotlight.isPositive
      ? Math.max(12, Math.round(42 - amp * 0.95))
      : Math.min(72, Math.round(52 + amp * 0.55));
    const mainD = `M 4 68 C 52 65, 86 50, 128 52 C 172 54, 206 32, 248 35 C 284 38, 312 ${Math.max(15, endY + 10)}, 354 ${endY}`;
    const areaD = `${mainD} L 354 88 L 4 88 Z`;
    return { mainD, areaD, endX: 354, endY };
  }, [advancingPct, activeSpotlight.curveBias, activeSpotlight.isPositive]);

  const handleSelectSpotlightDossier = () => {
    const sym = activeSpotlight.symbol;
    if (onOpenDeepRecord) onOpenDeepRecord(sym, activeSpotlight.item);
    else if (onSelectSymbol) onSelectSymbol(sym);
  };

  return (
    <section className="opening-bento-stage" aria-label="AuraTrade Live Market Opening Overview">
      <div className="opening-bento-grid-bg" aria-hidden="true" />
      <div className="opening-aurora-glow opening-aurora-glow--emerald" aria-hidden="true" />

      <div className="opening-bento-main">
        {/* LEFT CHAMBER: Minimalist Editorial Command Canvas */}
        <div className="opening-command-deck">
          <div className="opening-eyebrow">
            <span className="opening-sonar-dot" />
            <span>LIVE EXCHANGE MATRIX · {totalCount}+ ASSETS</span>
          </div>

          <h1 className="opening-hero-headline">
            Global Capital, <br />
            <span className="opening-serif-accent">decoded</span> cleanly in real time.
          </h1>

          <p className="opening-hero-subcopy">
            Institutional streaming quotes, multi-exchange indices, bullion ticks, and 30-day quantitative upside models in one calm workspace.
          </p>

          <div className="opening-cta-row">
            <button
              type="button"
              id="opening-workstation-cta"
              className="opening-cta-primary"
              onClick={() => onSelectSymbol && onSelectSymbol(activeSpotlight.symbol)}
            >
              <span>Open {activeSpotlight.symbol} Workstation</span>
              <ArrowUpRight size={15} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              className="opening-cta-secondary"
              onClick={() => onExploreAiUpside && onExploreAiUpside()}
            >
              <Sparkles size={14} />
              <span>AI 30D Alpha Picks</span>
            </button>
          </div>

          {/* Unboxed Borderless Live Quick-Jump Strip */}
          <div className="opening-quick-dock" aria-label="Quick focus live assets">
            <span className="opening-quick-label">FOCUS</span>
            <div className="opening-quick-links">
              {quickTickersLive.map((item) => {
                const pos = item.pct >= 0;
                return (
                  <button
                    key={item.symbol}
                    type="button"
                    className="opening-quick-link"
                    onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
                    title={`Open live Workstation chart for ${item.symbol}`}
                  >
                    <span className="opening-quick-sym">{item.label}</span>
                    <span className={`opening-quick-delta ${pos ? 'is-bull' : 'is-bear'}`}>
                      {formatSignedPct(item.pct)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT CHAMBER: Box-Free Seamless Observatory Stage */}
        <div
          className="opening-observatory-stage"
          onMouseEnter={() => setTabPaused(true)}
          onMouseLeave={() => setTabPaused(false)}
        >
          {/* Underlined Minimal Tab Strip */}
          <div className="opening-obs-header">
            <span className="opening-obs-mode-badge">{activeSpotlight.modeLabel}</span>

            <div className="opening-obs-tabs" role="tablist" aria-label="Spotlight asset mode">
              {[
                { id: 'ai', label: 'AI Pick' },
                { id: 'mover', label: '24H Mover' },
                { id: 'legacy', label: 'All-Time' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={spotlightTab === t.id}
                  className={`opening-obs-tab${spotlightTab === t.id ? ' active' : ''}`}
                  onClick={() => {
                    setSpotlightTab(t.id);
                    setTabPaused(true);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Typographic Spotlight Pair (Zero nested container boxes) */}
          <div
            className="opening-obs-hero-readout"
            role="button"
            tabIndex={0}
            onClick={handleSelectSpotlightDossier}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectSpotlightDossier();
              }
            }}
            title={`Inspect full dossier for ${activeSpotlight.symbol}`}
          >
            <div className="opening-obs-spot-top">
              <div className="opening-obs-spot-id">
                <div className="opening-obs-symbol-row">
                  <span className="opening-obs-symbol">{activeSpotlight.symbol}</span>
                  <span className={`opening-obs-badge ${activeSpotlight.isPositive ? 'is-bull' : 'is-bear'}`}>
                    {activeSpotlight.badgeText}
                  </span>
                </div>
                <span className="opening-obs-company">{activeSpotlight.name}</span>
              </div>

              <div className="opening-obs-price-col">
                <span className="opening-obs-price font-mono tabular-nums">{activeSpotlight.priceText}</span>
                <span className="opening-obs-inspect">
                  Inspect Record <ArrowUpRight size={12} />
                </span>
              </div>
            </div>

            <p className="opening-obs-desc">{activeSpotlight.subtitle}</p>
          </div>

          {/* Crisp Monoline Gradient Curve SVG */}
          <div className="opening-obs-wave-box" aria-hidden="true">
            <svg viewBox="0 0 360 88" className="opening-pulse-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="obsCleanFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={activeSpotlight.isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={activeSpotlight.isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="obsCleanStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.55" />
                  <stop offset="45%" stopColor={activeSpotlight.isPositive ? '#10b981' : '#f43f5e'} />
                  <stop offset="100%" stopColor={activeSpotlight.isPositive ? '#34d399' : '#fb7185'} />
                </linearGradient>
              </defs>
              <path d={pulsePaths.areaD} fill="url(#obsCleanFill)" />
              <path d={pulsePaths.mainD} fill="none" stroke="url(#obsCleanStroke)" strokeWidth="2.1" strokeLinecap="round" />
              <circle cx={pulsePaths.endX} cy={pulsePaths.endY} r="6" fill={activeSpotlight.isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'} className="opening-wave-halo" />
              <circle cx={pulsePaths.endX} cy={pulsePaths.endY} r="3" fill={activeSpotlight.isPositive ? '#34d399' : '#fb7185'} />
            </svg>
          </div>

          {/* Quiet Slim Breadth Hairline Bar */}
          <div className="opening-breadth-meter">
            <div className="opening-breadth-labels">
              <span>Session Breadth</span>
              <span className="font-mono tabular-nums">
                <strong className="is-bull">{advancingCount}↑</strong>
                <span className="opening-sep-dot"> · </span>
                <strong className="is-bear">{decliningCount}↓</strong>
              </span>
            </div>
            <div className="opening-breadth-track">
              <div className="opening-breadth-fill" style={{ width: `${advancingPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CLEAN HAIRLINE TELEMETRY RAIL */}
      <div className="opening-telemetry-dock">
        <div className="opening-telemetry-cell">
          <div className="opening-tel-label">Global Market Cap</div>
          <div className="opening-tel-value font-mono tabular-nums">{totalCapFormatted}</div>
          <div className="opening-tel-sub">Across {totalCount}+ Premier Assets</div>
        </div>

        <div className="opening-telemetry-cell">
          <div className="opening-tel-label">Buy Consensus</div>
          <div className="opening-tel-value font-mono tabular-nums is-bull">{bullishRatio}%</div>
          <div className="opening-tel-sub">{advancingCount} Advancing · {decliningCount} Declining</div>
        </div>

        <button
          type="button"
          className="opening-telemetry-cell is-clickable"
          onClick={() => {
            const sym = aiPick.symbol || 'NVDA';
            const item = companyLookup.get(sym) || aiPick;
            if (onOpenDeepRecord) onOpenDeepRecord(sym, item);
            else if (onSelectSymbol) onSelectSymbol(sym);
          }}
          title="Open Top AI Conviction Pick complete record"
        >
          <div className="opening-tel-label">30D AI Conviction</div>
          <div className="opening-tel-value font-mono tabular-nums">
            <span>{aiPick.symbol || 'NVDA'}</span>
            <span className="opening-tel-inline-delta is-bull">+{Math.abs(Number(aiPick.forecastGain ?? 14.2)).toFixed(1)}%</span>
          </div>
          <div className="opening-tel-sub">{aiPick.name || 'NVIDIA Corporation'}</div>
        </button>

        <button
          type="button"
          className="opening-telemetry-cell is-clickable"
          onClick={() => {
            const sym = allTimeHero.symbol || 'MSFT';
            const item = companyLookup.get(sym) || allTimeHero;
            if (onOpenDeepRecord) onOpenDeepRecord(sym, item);
            else if (onSelectSymbol) onSelectSymbol(sym);
          }}
          title="Open All-Time Best Equity Legend record"
        >
          <div className="opening-tel-label">All-Time Legend · {allTimeHero.ipoYear || 1986}</div>
          <div className="opening-tel-value font-mono tabular-nums">
            <span>{allTimeHero.symbol || 'MSFT'}</span>
            <span className="opening-tel-inline-delta is-bull">{formatAllTimePercent(allTimeHero.allTimeReturnPercent || 708343)}</span>
          </div>
          <div className="opening-tel-sub">
            {Math.round(allTimeHero.allTimeMultiple || 7084).toLocaleString()}x Till Now · {allTimeHero.name || 'Microsoft Corporation'}
          </div>
        </button>
      </div>
    </section>
  );
});
