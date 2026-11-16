import React, { useEffect, useState } from 'react';

export function OpeningReveal() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1150);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="opening-reveal-curtain" aria-hidden="true">
      <div className="opening-curtain-blade opening-curtain-blade--top" />
      <div className="opening-curtain-blade opening-curtain-blade--bottom" />
      <div className="opening-horizon-beam" />
      <div className="opening-reveal-center">
        <div className="opening-reveal-emblem">
          <svg
            width="44"
            height="44"
            viewBox="4.5 3.6 17 18.8"
            shapeRendering="geometricPrecision"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="revealPlatinum" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="revealEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <path d="M6 21 L13 5 L16.5 13 L10.5 21 Z" fill="url(#revealPlatinum)" />
            <path d="M13 5 L20 21 L15.5 21 L13 15 Z" fill="url(#revealEmerald)" />
            <polygon points="13,10 15,14 13,18 11,14" fill="#090d16" />
          </svg>
        </div>
        <div className="opening-reveal-wordmark">
          <span className="opening-reveal-brand">AURATRADE</span>
          <span className="opening-reveal-tag">GLOBAL MARKET INTELLIGENCE</span>
        </div>
      </div>
    </div>
  );
}
