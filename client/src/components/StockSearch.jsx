import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Loader2, X } from 'lucide-react';

export function StockSearch({ onSelectSymbol }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success && json.data) {
          setResults(json.data);
          setIsOpen(true);
          setActiveIndex(-1);
        }
      } catch (e) {
        console.error('Failed to search stocks:', e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol) => {
    onSelectSymbol(symbol);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex].symbol);
      } else if (results.length > 0) {
        handleSelect(results[0].symbol);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      className="search-wrapper"
      ref={wrapperRef}
      style={{ position: 'relative', zIndex: 1000 }}
    >
      <Search size={16} className="search-icon" />
      <input
        type="text"
        className="search-input font-mono"
        placeholder="Search ticker or company (e.g., AAPL, NVDA, TSLA)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setResults([]);
            setIsOpen(false);
          }}
          style={{
            position: 'absolute',
            right: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px'
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}

      {isOpen && query.trim() && (
        <div
          className="search-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3), 0 0 25px rgba(6, 182, 212, 0.15)',
            maxHeight: '360px',
            overflowY: 'auto',
            zIndex: 99999
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                color: 'var(--text-muted)',
                fontSize: '0.82rem'
              }}
            >
              <Loader2 size={16} className="spin" style={{ color: 'var(--accent-cyan)' }} />
              <span>Searching global market exchanges...</span>
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: '1.25rem 1rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem'
              }}
            >
              No verified market assets found matching "{query}".
            </div>
          ) : (
            results.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={item.symbol}
                  className={`search-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelect(item.symbol)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    background: isActive ? 'rgba(6, 182, 212, 0.16)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem'
                        }}
                      >
                        {item.symbol}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.12)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                      >
                        {item.sector || 'Global Equities'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.15rem'
                      }}
                    >
                      {item.name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}
                    >
                      ${item.price?.toFixed(2)}
                    </span>
                    <ArrowRight
                      size={14}
                      style={{
                        color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        transition: 'transform 0.15s ease',
                        transform: isActive ? 'translateX(2px)' : 'none'
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

