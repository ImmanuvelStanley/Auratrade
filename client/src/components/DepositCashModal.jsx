import React, { useState } from 'react';
import {
  X,
  DollarSign,
  CreditCard,
  Building2,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/audio';

const PRESET_AMOUNTS = [250, 500, 1000, 2500, 5000, 10000];

const PAYMENT_METHODS = [
  {
    id: 'card',
    name: 'Instant Card Purchase',
    sub: 'Visa, Mastercard, Amex • Instant Credit',
    icon: CreditCard,
    badge: 'Zero Fee'
  },
  {
    id: 'wire',
    name: 'Institutional Wire / Bank Transfer',
    sub: 'Fedwire / SEPA / RTGS Direct Clearing',
    icon: Building2,
    badge: 'Real-Time'
  },
  {
    id: 'upi_wallet',
    name: 'Digital Wallet / UPI Fastlane',
    sub: 'Apple Pay, Google Pay, UPI Rails',
    icon: Zap,
    badge: '1-Click'
  }
];

export function DepositCashModal({ isOpen, onClose, currentCashBalance = 0, onDepositSuccess }) {
  const { token, user } = useAuth();
  const [amount, setAmount] = useState('1000');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const projectedBalance = (Number(currentCashBalance) || 0) + numAmount;

  const handleDepositSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (numAmount <= 0) {
      setError('Please select or enter an amount greater than $0.');
      return;
    }

    if (numAmount > 50000000) {
      setError('Maximum single transaction limit is $50,000,000.');
      return;
    }

    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/portfolio/deposit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: numAmount,
          paymentMethod: PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || 'Instant Card Purchase'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete cash purchase.');
      }

      try {
        soundFx.playAlertChime();
      } catch (err) {}

      // Fire global event for instant client-wide state synchronization
      window.dispatchEvent(
        new CustomEvent('auratrade_user_updated', {
          detail: { cashBalance: data.cashBalance }
        })
      );

      setSuccessData(data);
      if (onDepositSuccess) {
        onDepositSuccess(data.cashBalance, numAmount);
      }
    } catch (err) {
      setError(err.message || 'Deposit error. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessData(null);
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose} style={{ zIndex: 999999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '95%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.55), 0 0 40px rgba(6, 182, 212, 0.15)'
        }}
      >
        {/* Top Glowing Header Accent Bar */}
        <div
          style={{
            height: '3px',
            width: '100%',
            background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 50%, #6366f1 100%)'
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-input)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bull-green)'
              }}
            >
              <Wallet size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Purchase Trading Cash
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--bull-green)',
                    border: '1px solid rgba(16, 185, 129, 0.35)'
                  }}
                >
                  INSTANT CREDIT
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Add funds directly to your verified trader cash balance
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={handleClose}
            style={{ width: '32px', height: '32px', borderRadius: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {successData ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '1.5rem 1rem',
                gap: '1rem'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bull-green)'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Funds Added Successfully!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
                  ${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been credited to your trader balance.
                </p>
              </div>

              <div
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Updated Available Balance</span>
                <span className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--bull-green)' }}>
                  ${successData.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClose}
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.7rem' }}
              >
                Done • Start Trading
              </button>
            </div>
          ) : (
            <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Balance Summary HUD */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT BALANCE</div>
                  <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    ${(Number(currentCashBalance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROJECTED BALANCE</div>
                  <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--bull-green)', marginTop: '2px' }}>
                    ${projectedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Amount Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Purchase Amount ($ USD)
                </label>

                {/* Preset Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      style={{
                        padding: '0.5rem 0.4rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: amount === preset.toString() ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        background: amount === preset.toString() ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-input)',
                        color: amount === preset.toString() ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      +${preset.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter custom amount..."
                    className="custom-input"
                    style={{
                      width: '100%',
                      paddingLeft: '2.4rem',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Funding Source
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.id;
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.95rem',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-input)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Icon size={18} style={{ color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {method.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {method.sub}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.4rem',
                            borderRadius: '4px',
                            background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'
                          }}
                        >
                          {method.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.14)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    color: 'var(--bear-red)',
                    fontSize: '0.78rem'
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || numAmount <= 0}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  cursor: loading || numAmount <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Processing Credit...</span>
                  </>
                ) : (
                  <>
                    <span>Purchase & Credit +${numAmount.toLocaleString()} to Balance</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={14} style={{ color: 'var(--bull-green)' }} />
                <span>Simulated zero-risk instant funding • Immediate purchasing power update</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
