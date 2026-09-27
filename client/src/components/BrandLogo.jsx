import React from 'react';

export function BrandLogo({
  size = 'normal',
  showBadge = true,
  layout = 'horizontal',
  subtitle,
  className = ''
}) {
  const isLarge = size === 'large' || size === 'portal';
  const isVertical = layout === 'vertical';

  const emblemSize = isLarge ? 48 : 38;
  const svgSize = isLarge ? 30 : 26;
  const wordmarkSize = isLarge ? '1.42rem' : '1.25rem';
  const subtextSize = isLarge ? '0.62rem' : '0.55rem';

  return (
    <div
      className={`stealth-logo-wrapper ${className}`}
      style={{
        display: isVertical ? 'flex' : 'inline-flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isVertical ? 'center' : 'flex-start',
        gap: isVertical ? '0.55rem' : '0.65rem',
        textAlign: isVertical ? 'center' : 'left',
        cursor: 'default',
        flexShrink: 0
      }}
    >
      {/* Precision Obsidian & Emerald Geometric Emblem */}
      <div
        className="stealth-emblem-box"
        style={{
          width: `${emblemSize}px`,
          height: `${emblemSize}px`,
          borderRadius: isLarge ? '12px' : '10px',
          boxShadow: isLarge
            ? '0 8px 24px -2px rgba(16, 185, 129, 0.35), 0 0 16px rgba(6, 182, 212, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : undefined,
          borderColor: isLarge ? 'rgba(16, 185, 129, 0.45)' : undefined
        }}
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="stealthPlatinum" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="stealthEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Precision Interlocking Delta Monogram: Left Platinum Blade */}
          <path
            d="M6 21 L13 5 L16.5 13 L10.5 21 Z"
            fill="url(#stealthPlatinum)"
          />

          {/* Right Emerald Facet Blade */}
          <path
            d="M13 5 L20 21 L15.5 21 L13 15 Z"
            fill="url(#stealthEmerald)"
          />

          {/* Center Geometric Core Diamond */}
          <polygon
            points="13,10 15,14 13,18 11,14"
            fill="#0b1322"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="0.8"
          />

          {/* Apex Micro-Gem Jewel */}
          <circle cx="13" cy="5" r="1.5" fill="#34d399" />
        </svg>
      </div>

      {/* Brand Wordmark with High-End Minimalist Stealth Typography */}
      <div
        className="brand-wordmark"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isVertical ? 'center' : 'flex-start',
          gap: '0.1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: isVertical ? 'center' : 'flex-start' }}>
          <span
            className="brand-word-aura"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: wordmarkSize,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)'
            }}
          >
            AURA
          </span>
          <span
            className="brand-word-trade"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: wordmarkSize,
              letterSpacing: '-0.02em',
              color: 'var(--brand-trade-color, #475569)'
            }}
          >
            TRADE
          </span>
        </div>


        <div
          className="brand-subtext"
          style={{
            fontSize: subtextSize,
            color: '#64748b',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}
        >
          {subtitle || 'Institutional Workstation'}
        </div>
      </div>
    </div>
  );
}
