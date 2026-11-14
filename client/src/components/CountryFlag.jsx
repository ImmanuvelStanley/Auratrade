import React from 'react';
import { defaultAllCompanies } from '../data/defaultAllCompanies';

/**
 * Institutional Vector SVG National Flags & Market Identification
 * Renders high-fidelity national flags that display consistently on all operating systems (including Windows).
 */

const FLAG_COMPONENTS = {
  US: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#B22234" />
      <path d="M0 1.54h30 M0 4.62h30 M0 7.69h30 M0 10.77h30 M0 13.85h30 M0 16.92h30" stroke="#FFFFFF" strokeWidth="1.54" />
      <rect width="12" height="10.8" fill="#3C3B6E" />
      <g fill="#FFFFFF">
        <circle cx="2" cy="2" r="0.6" /><circle cx="4.5" cy="2" r="0.6" /><circle cx="7" cy="2" r="0.6" /><circle cx="9.5" cy="2" r="0.6" />
        <circle cx="3.25" cy="3.8" r="0.6" /><circle cx="5.75" cy="3.8" r="0.6" /><circle cx="8.25" cy="3.8" r="0.6" /><circle cx="10.75" cy="3.8" r="0.6" />
        <circle cx="2" cy="5.6" r="0.6" /><circle cx="4.5" cy="5.6" r="0.6" /><circle cx="7" cy="5.6" r="0.6" /><circle cx="9.5" cy="5.6" r="0.6" />
        <circle cx="3.25" cy="7.4" r="0.6" /><circle cx="5.75" cy="7.4" r="0.6" /><circle cx="8.25" cy="7.4" r="0.6" /><circle cx="10.75" cy="7.4" r="0.6" />
        <circle cx="2" cy="9.2" r="0.6" /><circle cx="4.5" cy="9.2" r="0.6" /><circle cx="7" cy="9.2" r="0.6" /><circle cx="9.5" cy="9.2" r="0.6" />
      </g>
    </svg>
  ),
  IN: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="6.67" fill="#FF9933" />
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#138808" />
      <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.5" />
      <circle cx="15" cy="10" r="0.6" fill="#000080" />
      <g stroke="#000080" strokeWidth="0.25">
        <line x1="15" y1="7.4" x2="15" y2="12.6" />
        <line x1="12.4" y1="10" x2="17.6" y2="10" />
        <line x1="13.16" y1="8.16" x2="16.84" y2="11.84" />
        <line x1="13.16" y1="11.84" x2="16.84" y2="8.16" />
        <line x1="14.0" y1="7.6" x2="16.0" y2="12.4" />
        <line x1="16.0" y1="7.6" x2="14.0" y2="12.4" />
        <line x1="12.6" y1="9.0" x2="17.4" y2="11.0" />
        <line x1="12.6" y1="11.0" x2="17.4" y2="9.0" />
      </g>
    </svg>
  ),
  JP: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="6" fill="#BC002D" />
    </svg>
  ),
  GB: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#C8102E" strokeWidth="2" />
      <path d="M15 0 v20 M0 10 h30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M15 0 v20 M0 10 h30" stroke="#C8102E" strokeWidth="3.6" />
    </svg>
  ),
  DE: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="6.67" fill="#000000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </svg>
  ),
  FR: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="10" height="20" fill="#002654" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
    </svg>
  ),
  IT: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="10" height="20" fill="#009246" />
      <rect x="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" width="10" height="20" fill="#CE2B37" />
    </svg>
  ),
  NL: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="6.67" fill="#AE1C28" />
      <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
      <rect y="13.33" width="30" height="6.67" fill="#21468B" />
    </svg>
  ),
  CH: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#D52B1E" />
      <rect x="13" y="4" width="4" height="12" fill="#FFFFFF" />
      <rect x="9" y="8" width="12" height="4" fill="#FFFFFF" />
    </svg>
  ),
  CN: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#DE2910" />
      <polygon points="5,2 6,4.5 8.5,4.5 6.5,6 7.5,8.5 5,7 2.5,8.5 3.5,6 1.5,4.5 4,4.5" fill="#FFDE00" />
      <circle cx="10" cy="2.5" r="0.7" fill="#FFDE00" />
      <circle cx="12" cy="4.5" r="0.7" fill="#FFDE00" />
      <circle cx="12" cy="7.5" r="0.7" fill="#FFDE00" />
      <circle cx="10" cy="9.5" r="0.7" fill="#FFDE00" />
    </svg>
  ),
  HK: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#EE1C25" />
      <circle cx="15" cy="10" r="5" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="15" cy="10" r="2.2" fill="#FFFFFF" />
    </svg>
  ),
  TW: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#FE0000" />
      <rect width="15" height="10" fill="#000095" />
      <circle cx="7.5" cy="5" r="2.8" fill="#FFFFFF" />
      <circle cx="7.5" cy="5" r="1.7" fill="#000095" />
      <circle cx="7.5" cy="5" r="1.3" fill="#FFFFFF" />
    </svg>
  ),
  KR: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#FFFFFF" />
      <path d="M15 5 a5 5 0 0 1 0 10 a2.5 2.5 0 0 1 0 -5 a2.5 2.5 0 0 0 0 -5" fill="#CD2E3A" />
      <path d="M15 15 a5 5 0 0 1 0 -10 a2.5 2.5 0 0 1 0 5 a2.5 2.5 0 0 0 0 5" fill="#0047A0" />
      <g stroke="#000000" strokeWidth="0.5">
        <line x1="5" y1="4" x2="8" y2="4" /><line x1="5" y1="5.2" x2="8" y2="5.2" /><line x1="5" y1="6.4" x2="8" y2="6.4" />
        <line x1="22" y1="13.6" x2="25" y2="13.6" /><line x1="22" y1="14.8" x2="25" y2="14.8" /><line x1="22" y1="16" x2="25" y2="16" />
      </g>
    </svg>
  ),
  SA: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#006C35" />
      <rect x="7" y="7.5" width="16" height="2" fill="#FFFFFF" rx="0.5" />
      <path d="M6 12 h18 M6 11.5 v1 M22 11 l2 1 l-2 1" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
    </svg>
  ),
  BR: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#009739" />
      <polygon points="15,2 28,10 15,18 2,10" fill="#FEDD00" />
      <circle cx="15" cy="10" r="4.2" fill="#012169" />
      <path d="M11 11 a4.2 4.2 0 0 1 8 -1.5" stroke="#FFFFFF" strokeWidth="0.6" fill="none" />
    </svg>
  ),
  AU: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#00008B" />
      <g>
        <rect width="14" height="9.5" fill="#012169" />
        <path d="M0 0 L14 9.5 M14 0 L0 9.5" stroke="#FFFFFF" strokeWidth="1.8" />
        <path d="M0 0 L14 9.5 M14 0 L0 9.5" stroke="#C8102E" strokeWidth="0.9" />
        <path d="M7 0 v9.5 M0 4.75 h14" stroke="#FFFFFF" strokeWidth="2.8" />
        <path d="M7 0 v9.5 M0 4.75 h14" stroke="#C8102E" strokeWidth="1.6" />
      </g>
      <circle cx="7" cy="15" r="2.2" fill="#FFFFFF" />
      <circle cx="23" cy="4" r="0.7" fill="#FFFFFF" />
      <circle cx="21" cy="8" r="0.7" fill="#FFFFFF" />
      <circle cx="25" cy="8.5" r="0.7" fill="#FFFFFF" />
      <circle cx="23" cy="14" r="0.9" fill="#FFFFFF" />
      <circle cx="24" cy="10.5" r="0.5" fill="#FFFFFF" />
    </svg>
  ),
  CA: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="7.5" height="20" fill="#FF0000" />
      <rect x="7.5" width="15" height="20" fill="#FFFFFF" />
      <rect x="22.5" width="7.5" height="20" fill="#FF0000" />
      <polygon points="15,4 16,8 18,6.5 17.5,9.5 20,9.5 17.5,12 18,14.5 15.5,13.5 15,16 14.5,13.5 12,14.5 12.5,12 10,9.5 12.5,9.5 12,6.5 14,8" fill="#FF0000" />
    </svg>
  ),
  SE: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#006AA7" />
      <rect x="9" width="4" height="20" fill="#FECC00" />
      <rect y="8" width="30" height="4" fill="#FECC00" />
    </svg>
  ),
  DK: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#C60C30" />
      <rect x="8" width="3.5" height="20" fill="#FFFFFF" />
      <rect y="8.2" width="30" height="3.5" fill="#FFFFFF" />
    </svg>
  ),
  ES: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="5" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
      <rect y="15" width="30" height="5" fill="#AA151B" />
      <rect x="7.5" y="7.5" width="3.2" height="5" rx="0.8" fill="#AA151B" />
    </svg>
  ),
  EU: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#003399" />
      <g fill="#FFCC00">
        <circle cx="15" cy="4" r="0.8" /><circle cx="18" cy="4.8" r="0.8" /><circle cx="20.2" cy="7" r="0.8" />
        <circle cx="21" cy="10" r="0.8" /><circle cx="20.2" cy="13" r="0.8" /><circle cx="18" cy="15.2" r="0.8" />
        <circle cx="15" cy="16" r="0.8" /><circle cx="12" cy="15.2" r="0.8" /><circle cx="9.8" cy="13" r="0.8" />
        <circle cx="9" cy="10" r="0.8" /><circle cx="9.8" cy="7" r="0.8" /><circle cx="12" cy="4.8" r="0.8" />
      </g>
    </svg>
  ),
  UY: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#FFFFFF" />
      <path d="M0 2.2h30 M0 6.6h30 M0 11.1h30 M0 15.5h30" stroke="#0038A8" strokeWidth="2.2" />
      <rect width="10" height="10" fill="#FFFFFF" />
      <circle cx="5" cy="5" r="2.5" fill="#FCD116" stroke="#7B5B00" strokeWidth="0.4" />
    </svg>
  ),
  GL: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#0B192C" />
      <circle cx="15" cy="10" r="6.5" fill="none" stroke="#06B6D4" strokeWidth="1.2" />
      <ellipse cx="15" cy="10" rx="3" ry="6.5" fill="none" stroke="#06B6D4" strokeWidth="0.8" />
      <line x1="8.5" y1="10" x2="21.5" y2="10" stroke="#06B6D4" strokeWidth="0.8" />
    </svg>
  ),
  METAL: (
    <svg viewBox="0 0 30 20" width="100%" height="100%" aria-hidden="true">
      <rect width="30" height="20" fill="#1C1917" />
      <circle cx="15" cy="10" r="6.5" fill="#F59E0B" stroke="#FEF08A" strokeWidth="0.8" />
      <circle cx="15" cy="10" r="4.5" fill="none" stroke="#78350F" strokeWidth="0.5" />
    </svg>
  )
};

const COUNTRY_NAMES = {
  US: 'United States',
  IN: 'India',
  JP: 'Japan',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CN: 'China',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  KR: 'South Korea',
  NL: 'Netherlands',
  CH: 'Switzerland',
  SA: 'Saudi Arabia',
  BR: 'Brazil',
  AU: 'Australia',
  CA: 'Canada',
  SE: 'Sweden',
  DK: 'Denmark',
  ES: 'Spain',
  IT: 'Italy',
  EU: 'European Union',
  UY: 'Latin America',
  METAL: 'Precious Metals',
  GL: 'Global / INTL'
};

// Build instant O(1) lookup map for all workstation companies, ETFs, and indices
const SYMBOL_COUNTRY_MAP = (() => {
  const map = new Map();
  (defaultAllCompanies?.companies || []).forEach((c) => {
    const sym = String(c.symbol || '').trim().toUpperCase();
    const code = String(c.countryCode || '').trim().toUpperCase();
    if (sym && code && code !== 'GL' && FLAG_COMPONENTS[code]) {
      map.set(sym, {
        code,
        name: c.country || COUNTRY_NAMES[code] || code,
        flag: c.countryFlag || ''
      });
    }
  });

  const extraMappings = [
    [['S&P 500', '^GSPC', 'NASDAQ', '^IXIC', 'DOW JONES', '^DJI', 'RUSSELL 2000', '^RUT', 'VIX', '^VIX', 'SPY', 'QQQ', 'DIA', 'IWM', 'TLT', 'XLK', 'XLF', 'SOXX', 'GLD', 'BRK-B', 'BRK.B'], 'US', '🇺🇸'],
    [['NIFTY 50', '^NSEI', 'BANK NIFTY', '^NSEBANK', 'SENSEX', '^BSESN', 'INDIA VIX', '^INDIAVIX', 'NIFTY IT', 'GOLD.MCX', 'SILVER.MCX', 'GOLDBEES.NS', 'SILVERBEES.NS', 'INDA'], 'IN', '🇮🇳'],
    [['FTSE 100', '^FTSE'], 'GB', '🇬🇧'],
    [['DAX 40', '^GDAXI'], 'DE', '🇩🇪'],
    [['CAC 40', '^FCHI'], 'FR', '🇫🇷'],
    [['NIKKEI 225', '^N225', 'EWJ'], 'JP', '🇯🇵'],
    [['HANG SENG', '^HSI'], 'HK', '🇭🇰'],
    [['ASX 200', '^AXJO', 'BHP'], 'AU', '🇦🇺'],
    [['SHANGHAI', '000001.SS'], 'CN', '🇨🇳'],
    [['KOSPI', '^KS11', 'SSNLF', 'HXSCF'], 'KR', '🇰🇷'],
    [['TAIEX', '^TWII', 'TSM', 'MDTKY'], 'TW', '🇹🇼'],
    [['VGK'], 'EU', '🇪🇺'],
    [['MELI'], 'UY', '🇺🇾'],
    [['ARMCO'], 'SA', '🇸🇦'],
    [['SPOT'], 'SE', '🇸🇪'],
    [['RACE'], 'IT', '🇮🇹'],
    [['SHOP'], 'CA', '🇨🇦'],
    [['NVO'], 'DK', '🇩🇰'],
    [['ASML', 'STLA'], 'NL', '🇳🇱'],
    [['PBR', 'VALE'], 'BR', '🇧🇷'],
    [['GOLD', 'SILVER', 'XAU/USD', 'XAG/USD', 'GC=F', 'SI=F'], 'METAL', '🪙']
  ];

  extraMappings.forEach(([syms, code, flag]) => {
    syms.forEach((sym) => {
      if (!map.has(sym)) {
        map.set(sym, { code, name: COUNTRY_NAMES[code] || code, flag });
      }
    });
  });

  return map;
})();

/**
 * Universal Country & Market Resolver
 */
export function resolveCountryInfo(country = '', symbol = '', countryCode = '', countryFlag = '') {
  const c = String(country || '').trim().toLowerCase();
  const s = String(symbol || '').trim().toUpperCase();
  const codeParam = String(countryCode || '').trim().toUpperCase();

  // 1. Direct non-generic ISO countryCode matching
  if (codeParam && codeParam !== 'GL' && FLAG_COMPONENTS[codeParam]) {
    return { code: codeParam, name: COUNTRY_NAMES[codeParam] || country || codeParam, flag: countryFlag || '🌐' };
  }

  // 2. Exact workstation company / index / ETF lookup by ticker symbol
  if (s && SYMBOL_COUNTRY_MAP.has(s)) {
    return SYMBOL_COUNTRY_MAP.get(s);
  }

  // 3. Exchange suffix & digital/asset patterns
  if (s.endsWith('.NS') || s.endsWith('.BO') || s.endsWith('.MCX')) {
    return { code: 'IN', name: 'India', flag: '🇮🇳' };
  }
  if (s === 'BTC' || s === 'ETH' || s === 'SOL' || s.includes('BTC') || s.includes('ETH')) {
    return { code: 'GL', name: 'Digital Asset (Crypto)', flag: '🌐' };
  }

  // 4. Country string & exchange suffix matching
  if (c.includes('united states') || c === 'usa' || c === 'us' || c.includes('global / us')) {
    return { code: 'US', name: 'United States', flag: '🇺🇸' };
  }
  if (c.includes('india')) return { code: 'IN', name: 'India', flag: '🇮🇳' };
  if (c.includes('japan') || s.endsWith('.T')) return { code: 'JP', name: 'Japan', flag: '🇯🇵' };
  if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || s.endsWith('.L')) {
    return { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' };
  }
  if (c.includes('germany') || s.endsWith('.DE')) return { code: 'DE', name: 'Germany', flag: '🇩🇪' };
  if (c.includes('france') || s.endsWith('.PA')) return { code: 'FR', name: 'France', flag: '🇫🇷' };
  if (c.includes('china') || s.endsWith('.SS') || s.endsWith('.SZ')) return { code: 'CN', name: 'China', flag: '🇨🇳' };
  if (c.includes('hong kong') || s.endsWith('.HK')) return { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' };
  if (c.includes('taiwan') || s.endsWith('.TW')) return { code: 'TW', name: 'Taiwan', flag: '🇹🇼' };
  if (c.includes('south korea') || c.includes('korea') || s.endsWith('.KS')) return { code: 'KR', name: 'South Korea', flag: '🇰🇷' };
  if (c.includes('netherlands') || s.endsWith('.AS')) return { code: 'NL', name: 'Netherlands', flag: '🇳🇱' };
  if (c.includes('switzerland') || s.endsWith('.SW')) return { code: 'CH', name: 'Switzerland', flag: '🇨🇭' };
  if (c.includes('saudi') || s.endsWith('.SR')) return { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' };
  if (c.includes('brazil') || s.endsWith('.SA')) return { code: 'BR', name: 'Brazil', flag: '🇧🇷' };
  if (c.includes('australia') || s.endsWith('.AX')) return { code: 'AU', name: 'Australia', flag: '🇦🇺' };
  if (c.includes('canada') || s.endsWith('.TO')) return { code: 'CA', name: 'Canada', flag: '🇨🇦' };
  if (c.includes('sweden')) return { code: 'SE', name: 'Sweden', flag: '🇸🇪' };
  if (c.includes('denmark')) return { code: 'DK', name: 'Denmark', flag: '🇩🇰' };
  if (c.includes('spain') || s.endsWith('.MC')) return { code: 'ES', name: 'Spain', flag: '🇪🇸' };
  if (c.includes('italy') || s.endsWith('.MI')) return { code: 'IT', name: 'Italy', flag: '🇮🇹' };
  if (c.includes('europe')) return { code: 'EU', name: 'Europe', flag: '🇪🇺' };
  if (c.includes('latin america')) return { code: 'UY', name: 'Latin America', flag: '🌎' };

  // Fallback
  return { code: 'GL', name: country || 'Global', flag: countryFlag || '🌐' };
}

const SIZE_PRESETS = {
  xs: { width: '16px', height: '11px', borderRadius: '2px' },
  sm: { width: '20px', height: '13px', borderRadius: '3px' },
  md: { width: '24px', height: '16px', borderRadius: '3px' },
  lg: { width: '32px', height: '21px', borderRadius: '4px' },
  xl: { width: '40px', height: '26px', borderRadius: '5px' }
};

/**
 * CountryFlag Component
 */
export const CountryFlag = React.memo(function CountryFlag({
  country = '',
  symbol = '',
  countryCode = '',
  countryFlag = '',
  size = 'sm',
  showCode = false,
  showName = false,
  style = {},
  className = ''
}) {
  const info = resolveCountryInfo(country, symbol, countryCode, countryFlag);
  const dims = SIZE_PRESETS[size] || SIZE_PRESETS.sm;
  const flagSvg = FLAG_COMPONENTS[info.code] || FLAG_COMPONENTS.GL;

  return (
    <span
      className={`country-flag-badge ${className}`}
      title={`${info.name} (${info.code})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: dims.width,
          height: dims.height,
          borderRadius: dims.borderRadius,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.18), 0 1px 2px rgba(0, 0, 0, 0.25)',
          flexShrink: 0
        }}
      >
        {flagSvg}
      </span>

      {showCode && (
        <span
          className="font-mono"
          style={{
            fontSize: size === 'xs' ? '0.62rem' : size === 'sm' ? '0.68rem' : '0.74rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.04em'
          }}
        >
          {info.code}
        </span>
      )}

      {showName && (
        <span
          style={{
            fontSize: size === 'xs' ? '0.68rem' : size === 'sm' ? '0.76rem' : '0.84rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap'
          }}
        >
          {info.name}
        </span>
      )}
    </span>
  );
});

export default CountryFlag;

