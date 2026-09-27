import React, { useState } from 'react';
import { X, Bell } from 'lucide-react';
import { useSocketQuote } from '../context/SocketContext';

export function AlertModal({ symbol, currentPrice: propPrice, onClose, onAlertCreated }) {
  const socketQuote = useSocketQuote(symbol);
  const currentPrice = propPrice || socketQuote?.price;
  const [targetPrice, setTargetPrice] = useState(currentPrice ? (currentPrice * 1.02).toFixed(2) : '');
  const [condition, setCondition] = useState('ABOVE');
  const [cooldownMinutes, setCooldownMinutes] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetPrice || isNaN(targetPrice)) {
      setError('Please enter a valid numeric target price.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auratrade_token');
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol,
          targetPrice: parseFloat(targetPrice),
          condition,
          cooldownMinutes: parseInt(cooldownMinutes, 10)
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create alert');

      onAlertCreated(json.alert);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="glass-card-header">
          <div className="glass-card-title">
            <Bell size={18} style={{ color: 'var(--warning-amber)' }} />
            <span>Create Price Alert • {symbol}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {error && (
            <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bear-red-bg)', color: 'var(--bear-red)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live Price:</span>
            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              ${currentPrice ? currentPrice.toFixed(2) : '--'}
            </span>
          </div>

          <div className="input-group">
            <label className="input-label">Trigger Condition</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${condition === 'ABOVE' ? 'btn-bull' : 'btn-secondary'}`}
                onClick={() => setCondition('ABOVE')}
                style={{ fontSize: '0.8rem' }}
              >
                Price Rises Above (≥)
              </button>
              <button
                type="button"
                className={`btn ${condition === 'BELOW' ? 'btn-bear' : 'btn-secondary'}`}
                onClick={() => setCondition('BELOW')}
                style={{ fontSize: '0.8rem' }}
              >
                Price Drops Below (≤)
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Target Price ($ USD)</label>
            <input
              type="number"
              step="0.01"
              required
              className="input-field font-mono"
              placeholder="e.g. 245.50"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Anti-Spam Cooldown</label>
            <select
              className="input-field font-mono"
              value={cooldownMinutes}
              onChange={(e) => setCooldownMinutes(e.target.value)}
            >
              <option value="5">5 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes (Standard)</option>
              <option value="60">1 hour</option>
              <option value="1440">Once per day</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Arming Alert...' : 'Arm Price Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
