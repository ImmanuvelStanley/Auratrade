import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const MarketRibbon = React.memo(function MarketRibbon({ onSelectSymbol }) {
  const [indices, setIndices] = useState([
    // Interleaved Indian (NSE) and Global World Market leaders for immediate dual visibility
    { symbol: 'NIFTY 50', name: 'Nifty 50', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 23044.60, changePercent: -1.72, currency: 'INR' },
    { symbol: 'S&P 500', name: 'S&P 500', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 7636.12, changePercent: -0.58, currency: 'USD' },
    { symbol: 'BANK NIFTY', name: 'Bank Nifty', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 56295.55, changePercent: -0.41, currency: 'INR' },
    { symbol: 'NASDAQ', name: 'Nasdaq 100', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 26241.12, changePercent: -0.32, currency: 'USD' },
    { symbol: 'SENSEX', name: 'BSE Sensex', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 73563.27, changePercent: -1.69, currency: 'INR' },
    { symbol: 'DOW JONES', name: 'Dow Jones 30', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 52786.07, changePercent: -1.18, currency: 'USD' },
    { symbol: 'RELIANCE', name: 'Reliance Ind.', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 2985.40, changePercent: +0.61, currency: 'INR' },
    { symbol: 'NVDA', name: 'NVIDIA', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 224.58, changePercent: -0.41, currency: 'USD' },
    { symbol: 'TCS', name: 'Tata Consultancy', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 4195.25, changePercent: -0.58, currency: 'INR' },
    { symbol: 'AAPL', name: 'Apple', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 335.92, changePercent: -0.33, currency: 'USD' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1682.40, changePercent: +0.53, currency: 'INR' },
    { symbol: 'MSFT', name: 'Microsoft', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 497.93, changePercent: -0.53, currency: 'USD' },
    { symbol: 'INFY', name: 'Infosys', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1874.15, changePercent: -0.65, currency: 'INR' },
    { symbol: 'AMZN', name: 'Amazon', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 249.38, changePercent: +0.04, currency: 'USD' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1248.60, changePercent: +0.49, currency: 'INR' },
    { symbol: 'GOOGL', name: 'Alphabet', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 342.36, changePercent: +1.34, currency: 'USD' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1564.00, changePercent: +0.94, currency: 'INR' },
    { symbol: 'TSLA', name: 'Tesla', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 377.94, changePercent: -0.57, currency: 'USD' },
    { symbol: 'SBIN', name: 'State Bank of India', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 826.80, changePercent: -0.51, currency: 'INR' },
    { symbol: 'META', name: 'Meta', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 777.59, changePercent: +4.50, currency: 'USD' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 988.30, changePercent: +1.15, currency: 'INR' },
    { symbol: 'DAX 40', name: 'DAX Germany', region: 'Europe', countryCode: 'DE', countryFlag: '🇩🇪', price: 25792.00, changePercent: -0.32, currency: 'EUR' },
    { symbol: 'GOLD', name: 'Gold (XAU/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAU', price: 4314.50, changePercent: +0.38, currency: 'USD' },
    { symbol: 'SILVER', name: 'Silver (XAG/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAG', price: 64.26, changePercent: +0.41, currency: 'USD' },
    { symbol: 'GOLD.MCX', name: 'MCX Gold 10g', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 148390.00, changePercent: +0.38, currency: 'INR' },
    { symbol: 'SILVER.MCX', name: 'MCX Silver 1kg', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 237890.00, changePercent: +0.41, currency: 'INR' },
    { symbol: 'INDIA VIX', name: 'India VIX', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 11.77, changePercent: +3.70, currency: '' },
    { symbol: 'FTSE 100', name: 'FTSE London', region: 'Europe', countryCode: 'GB', countryFlag: '🇬🇧', price: 10763.88, changePercent: -0.44, currency: 'GBP' },
    { symbol: 'NIFTY IT', name: 'Nifty IT', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 41852.70, changePercent: -0.84, currency: 'INR' },
    { symbol: 'CAC 40', name: 'CAC Paris', region: 'Europe', countryCode: 'FR', countryFlag: '🇫🇷', price: 8240.50, changePercent: -0.54, currency: 'EUR' },
    { symbol: 'NIKKEI 225', name: 'Nikkei Tokyo', region: 'Asia', countryCode: 'JP', countryFlag: '🇯🇵', price: 65142.78, changePercent: -0.19, currency: 'JPY' },
    { symbol: 'HANG SENG', name: 'Hang Seng HK', region: 'Asia', countryCode: 'HK', countryFlag: '🇭🇰', price: 17450.60, changePercent: +0.35, currency: 'HKD' },
    { symbol: 'ASX 200', name: 'ASX Australia', region: 'Asia-Pacific', countryCode: 'AU', countryFlag: '🇦🇺', price: 8560.40, changePercent: -0.29, currency: 'AUD' },
    { symbol: 'BTC/USD', name: 'Bitcoin', region: 'Crypto', countryCode: 'CRYPTO', countryFlag: '🌐', price: 64250.00, changePercent: +2.14, currency: 'USD' },
    { symbol: 'USD/INR', name: 'USD/INR Forex', region: 'Forex', countryCode: 'FX', countryFlag: '💱', price: 95.82, changePercent: -0.14, currency: 'INR' }
  ]);
  const { quotes } = useSocket();
  const prevPricesRef = useRef({});
  const [flashingSymbols, setFlashingSymbols] = useState({});
  const [tickDirections, setTickDirections] = useState({});

  useEffect(() => {
    async function fetchIndices() {
      try {
        const res = await fetch('/api/stocks/indices');
        const json = await res.json();
        if (json.success && json.data) {
          // Detect tick changes and flash
          const newFlashes = {};
          const newDirections = {};
          json.data.forEach(item => {
            const old = prevPricesRef.current[item.symbol];
            if (old !== undefined && old !== item.price) {
              const dir = item.price > old ? 'up' : 'down';
              newFlashes[item.symbol] = dir === 'up' ? 'tick-flash-up' : 'tick-flash-down';
              newDirections[item.symbol] = dir;
            }
            prevPricesRef.current[item.symbol] = item.price;
          });

          if (Object.keys(newFlashes).length > 0) {
            setFlashingSymbols(prev => ({ ...prev, ...newFlashes }));
            setTickDirections(prev => ({ ...prev, ...newDirections }));
            setTimeout(() => {
              setFlashingSymbols({});
            }, 1100);
          }

          setIndices(json.data);
        }
      } catch (e) {}
    }
    fetchIndices();
    const interval = setInterval(fetchIndices, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (idx) => {
    if (!onSelectSymbol) return;
    if (idx.symbol === 'BTC/USD' || idx.symbol === 'USD/INR') return;
    // Smart mapping for index or direct stock
    const mapped = idx.symbol === 'NIFTY 50' ? 'RELIANCE' :
                   idx.symbol === 'BANK NIFTY' ? 'HDFCBANK' :
                   idx.symbol === 'SENSEX' ? 'TCS' :
                   idx.symbol === 'S&P 500' ? 'SPY' :
                   idx.symbol === 'NASDAQ' ? 'QQQ' :
                   idx.symbol === 'DOW JONES' ? 'DIA' :
                   idx.symbol;
    onSelectSymbol(mapped);
  };

  const renderItem = (idx, uniqueKey) => {
    const live = quotes[idx.symbol];
    const price = live ? live.price : idx.price;
    const changePercent = live ? live.changePercent : idx.changePercent;
    const isBull = changePercent >= 0;
    const flashClass = flashingSymbols[idx.symbol] || '';
    const dir = tickDirections[idx.symbol];

    const currSymbol = idx.currency === 'INR' ? '₹' :
                       idx.currency === 'EUR' ? '€' :
                       idx.currency === 'GBP' ? '£' :
                       idx.currency === 'JPY' ? '¥' :
                       idx.currency === 'HKD' ? 'HK$' :
                       idx.currency === 'AUD' ? 'A$' :
                       idx.symbol === 'INDIA VIX' ? '' : '$';

    return (
      <div
        key={uniqueKey}
        className={`market-ribbon-item ${flashClass}`}
        onClick={() => handleItemClick(idx)}
        title={`Click to analyze ${idx.name || idx.symbol} (${idx.region})`}
      >
        {(idx.countryCode || idx.region) && (
          <span
            style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              lineHeight: 1.2
            }}
            title={idx.region ? `${idx.region} Market` : 'Market'}
          >
            {idx.countryCode || (idx.region === 'India' ? 'IN' : idx.region === 'US' ? 'US' : idx.region?.slice(0, 2).toUpperCase() || '')}
          </span>
        )}
        <span className="ribbon-sym">{idx.symbol}</span>
        
        {/* Dynamic directional tick indicator badge */}
        {dir === 'up' && <span className="ribbon-tick-badge up">▲</span>}
        {dir === 'down' && <span className="ribbon-tick-badge down">▼</span>}

        <span className="ribbon-price font-mono">
          {currSymbol}{price ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
        </span>
        
        <span className={`ribbon-change font-mono ${isBull ? 'text-bull' : 'text-bear'}`}>
          {isBull ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {changePercent >= 0 ? '+' : ''}{changePercent ? changePercent.toFixed(2) : '0.00'}%
        </span>
      </div>
    );
  };

  return (
    <div className="market-ribbon-wrapper">
      {/* Pinned Left Badge with Animated Radar Ripple & NSE/World Tag */}
      <div className="market-ribbon-badge">
        <span className="radar-pulse-dot" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>MARKET PULSE</span>
            <span style={{ fontSize: '0.6rem', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--bull-green)', padding: '1px 5px', borderRadius: '3px', fontWeight: 800, letterSpacing: '0.04em' }}>LIVE</span>
          </div>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>NSE & GLOBAL MARKETS</span>
        </div>
      </div>

      {/* Infinite Continuous Moving Marquee Track */}
      <div className="ticker-track-container">
        <div className="ticker-track">
          {/* Primary Track */}
          {indices.map((idx, i) => renderItem(idx, `orig-${idx.symbol}-${i}`))}
          {/* Duplicate Seamless Loop Track */}
          {indices.map((idx, i) => renderItem(idx, `dup-${idx.symbol}-${i}`))}
        </div>
      </div>
    </div>
  );
});

export default MarketRibbon;

