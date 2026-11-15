import React, { useState, useEffect, useCallback } from 'react';
import {
  Webhook,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MarketFeedIntegrationCard() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferredProvider, setPreferredProvider] = useState('auto');
  const [finnhubKeyInput, setFinnhubKeyInput] = useState('');
  const [alphaVantageKeyInput, setAlphaVantageKeyInput] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [testSymbol, setTestSymbol] = useState('AAPL');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok: boolean, text: string }
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/market-feed/status');
      const json = await res.json();
      if (json.success && json.data) {
        setStatus(json.data);
        setPreferredProvider(json.data.preferredProvider || 'auto');
      }
    } catch (err) {
      setFeedback({ ok: false, text: `Unable to load feed status: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/market-feed/webhook`;

  const handleSaveConfig = async (overrides = {}) => {
    if (!token) {
      setFeedback({ ok: false, text: 'Sign in required to save market data credentials.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/market-feed/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          preferredProvider: overrides.preferredProvider ?? preferredProvider,
          finnhubApiKey: finnhubKeyInput.trim(),
          alphaVantageKey: alphaVantageKeyInput.trim(),
          webhookSecret: webhookSecretInput.trim(),
          ...overrides
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update configuration');
      }
      setStatus(json.data);
      setPreferredProvider(json.data.preferredProvider);
      setFinnhubKeyInput('');
      setAlphaVantageKeyInput('');
      setWebhookSecretInput('');
      setFeedback({ ok: true, text: 'Market feed provider settings updated cleanly.' });
    } catch (err) {
      setFeedback({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestProvider = async (providerName) => {
    if (!token) {
      setFeedback({ ok: false, text: 'Sign in required to test external providers.' });
      return;
    }
    setTesting(true);
    setFeedback(null);
    try {
      const apiKey =
        providerName === 'finnhub'
          ? finnhubKeyInput.trim()
          : providerName === 'alphavantage'
            ? alphaVantageKeyInput.trim()
            : '';

      const res = await fetch('/api/market-feed/test-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ provider: providerName, symbol: testSymbol.trim().toUpperCase() || 'AAPL', apiKey })
      });
      const json = await res.json();
      if (json.success && json.data?.quote) {
        const q = json.data.quote;
        setFeedback({
          ok: true,
          text: `${providerName.toUpperCase()} live quote OK in ${json.data.latencyMs}ms: ${q.symbol} = $${Number(q.price).toFixed(2)} (${q.source})`
        });
      } else {
        setFeedback({
          ok: false,
          text: json.error || `${providerName} test did not return a quote.`
        });
      }
      loadStatus();
    } catch (err) {
      setFeedback({ ok: false, text: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!token) {
      setFeedback({ ok: false, text: 'Sign in required to dispatch a test webhook tick.' });
      return;
    }
    setSimulatingWebhook(true);
    setFeedback(null);
    try {
      const sym = testSymbol.trim().toUpperCase() || 'AAPL';
      const res = await fetch('/api/market-feed/webhook/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ symbol: sym, deltaPercent: 0.42 })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Webhook push failed');
      }
      const pushed = json.quotes?.[0];
      setFeedback({
        ok: true,
        text: `Webhook ingested ${pushed?.symbol || sym} at ${pushed?.price} (${pushed?.source || 'Webhook-Push'}). Broadcasted via Socket & Alert Engine.`
      });
      loadStatus();
    } catch (err) {
      setFeedback({ ok: false, text: err.message });
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    try {
      navigator.clipboard?.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch (e) {}
  };

  const providers = status?.providers || {};

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Webhook size={18} style={{ color: '#38bdf8' }} />
            Live Market Data Feeds &amp; Webhook Bridge
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
            Connect Finnhub or Alpha Vantage API keys, choose your feed cascade priority, or stream exchange ticks via HTTP Webhook.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="btn btn-secondary"
          style={{ fontSize: '0.76rem', padding: '0.38rem 0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RefreshCw size={13} /> Refresh Status
        </button>
      </div>

      {/* Provider Priority Selector */}
      <div style={{ padding: '0.95rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Active Feed Resolution Priority
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'auto', label: 'Auto Cascade (Webhook → API → Yahoo → Sim)' },
            { id: 'webhook', label: 'Webhook Priority' },
            { id: 'finnhub', label: 'Finnhub First' },
            { id: 'alphavantage', label: 'Alpha Vantage First' },
            { id: 'yahoo', label: 'Yahoo Direct' },
            { id: 'simulator', label: 'Quant Simulator' }
          ].map((opt) => {
            const active = preferredProvider === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSaveConfig({ preferredProvider: opt.id })}
                disabled={saving}
                style={{
                  padding: '0.38rem 0.72rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: active ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  background: active ? 'rgba(56, 189, 248, 0.16)' : 'var(--bg-card)',
                  color: active ? '#38bdf8' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
        {/* Finnhub */}
        <div style={{ padding: '0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <KeyRound size={13} style={{ color: '#10b981' }} /> Finnhub API Key
            </span>
            <span className="badge-pill" style={{ fontSize: '0.68rem', background: providers.finnhub?.configured ? 'rgba(16,185,129,0.16)' : 'rgba(148,163,184,0.14)', color: providers.finnhub?.configured ? '#10b981' : 'var(--text-muted)' }}>
              {providers.finnhub?.configured ? `Active (${providers.finnhub.keyHint})` : 'Not Set'}
            </span>
          </div>
          <input
            type="password"
            value={finnhubKeyInput}
            onChange={(e) => setFinnhubKeyInput(e.target.value)}
            placeholder={providers.finnhub?.configured ? 'Enter new key to replace...' : 'Paste Finnhub token (finnhub.io)'}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.48rem 0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => handleTestProvider('finnhub')} disabled={testing} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
              Test Finnhub ({testSymbol})
            </button>
            {providers.finnhub?.configured && (
              <button type="button" onClick={() => handleSaveConfig({ clearFinnhubKey: true })} disabled={saving} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', color: '#f87171' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Alpha Vantage */}
        <div style={{ padding: '0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <KeyRound size={13} style={{ color: '#818cf8' }} /> Alpha Vantage Key
            </span>
            <span className="badge-pill" style={{ fontSize: '0.68rem', background: providers.alphavantage?.configured ? 'rgba(129,140,248,0.16)' : 'rgba(148,163,184,0.14)', color: providers.alphavantage?.configured ? '#818cf8' : 'var(--text-muted)' }}>
              {providers.alphavantage?.configured ? `Active (${providers.alphavantage.keyHint})` : 'Not Set'}
            </span>
          </div>
          <input
            type="password"
            value={alphaVantageKeyInput}
            onChange={(e) => setAlphaVantageKeyInput(e.target.value)}
            placeholder={providers.alphavantage?.configured ? 'Enter new key to replace...' : 'Paste Alpha Vantage API key'}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.48rem 0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => handleTestProvider('alphavantage')} disabled={testing} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}>
              Test AlphaV ({testSymbol})
            </button>
            {providers.alphavantage?.configured && (
              <button type="button" onClick={() => handleSaveConfig({ clearAlphaVantageKey: true })} disabled={saving} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', color: '#f87171' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Webhook Receiver */}
        <div style={{ padding: '0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={13} style={{ color: '#f59e0b' }} /> Webhook Ingest Secret
            </span>
            <span className="badge-pill" style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24' }}>
              {providers.webhook?.eventsCount || 0} Pushes
            </span>
          </div>
          <input
            type="password"
            value={webhookSecretInput}
            onChange={(e) => setWebhookSecretInput(e.target.value)}
            placeholder={providers.webhook?.hasSecret ? `Protected (${providers.webhook.secretHint})` : 'Optional HMAC / X-Webhook-Secret'}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.48rem 0.7rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleCopyWebhookUrl} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              {copiedWebhook ? <Check size={12} /> : <Copy size={12} />} {copiedWebhook ? 'Copied URL' : 'Copy Endpoint'}
            </button>
            <button type="button" onClick={handleSimulateWebhook} disabled={simulatingWebhook} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Send size={12} /> Push Sample Tick
            </button>
          </div>
        </div>
      </div>

      {/* Save Row + Test Symbol */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Test Symbol:</label>
          <input
            type="text"
            value={testSymbol}
            onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
            style={{ width: '92px', padding: '0.38rem 0.55rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
          />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            POST /api/market-feed/webhook
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSaveConfig()}
          disabled={saving || (!finnhubKeyInput.trim() && !alphaVantageKeyInput.trim() && !webhookSecretInput.trim())}
          className="btn btn-primary"
          style={{ fontSize: '0.8rem', padding: '0.48rem 1rem' }}
        >
          {saving ? 'Saving...' : 'Save Feed Credentials'}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: feedback.ok ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: `1px solid ${feedback.ok ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            color: feedback.ok ? '#34d399' : '#f87171',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
        >
          {feedback.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
}
