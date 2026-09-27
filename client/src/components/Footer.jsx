import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Sparkles,
  Scale,
  ChevronRight,
  X,
  Printer
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export function Footer({
  onNavigateTab,
  onOpenAutoPredictor,
  onOpenTradeModal,
  onOpenAlertModal
}) {
  const currentYear = new Date().getFullYear();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState('terms'); // 'terms' | 'privacy' | 'risk' | 'regulatory'

  const handleNav = (tab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const openLegalDocument = (docType) => {
    setActiveLegalDoc(docType);
    setLegalModalOpen(true);
  };

  return (
    <footer className="pro-site-footer" id="site-global-footer">
      {/* Top Ambient Glow Line */}
      <div className="footer-glow-bar" />

      <div className="footer-container">
        {/* Brand Header */}
        <div className="footer-brand-header">
          <BrandLogo size="normal" layout="horizontal" subtitle="Institutional Workstation" />
        </div>

        {/* 3-Column Institutional Directory */}
        <div className="footer-nav-grid">
          {/* Column 1: Market Desks & Liquidity */}
          <div className="footer-nav-col">
            <h4 className="footer-nav-title">
              <Layers size={15} className="col-icon" /> Market Desks & Feeds
            </h4>
            <ul className="footer-nav-list">
              <li>
                <button type="button" onClick={() => handleNav('all-markets')}>
                  <ChevronRight size={13} /> All Companies Screener
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('dashboard')}>
                  <ChevronRight size={13} /> Workstation Terminal (US Equities)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('nse-india')}>
                  <ChevronRight size={13} /> NSE India Market (NIFTY & SENSEX)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('gold-silver')}>
                  <ChevronRight size={13} /> Bullion Desk (Gold 24K & Silver 999)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('global-indices')}>
                  <ChevronRight size={13} /> Global Sovereign & Macro Indices
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('watchlist-alerts')}>
                  <ChevronRight size={13} /> Market Radar & Watchlist Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Algorithmic Intelligence & Interactive Tools */}
          <div className="footer-nav-col">
            <h4 className="footer-nav-title">
              <Sparkles size={15} className="col-icon" /> Algorithmic Intelligence
            </h4>
            <ul className="footer-nav-list">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAutoPredictor) onOpenAutoPredictor();
                  }}
                >
                  <ChevronRight size={13} /> Quantum Neural Market Predictor
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenTradeModal) onOpenTradeModal();
                  }}
                >
                  <ChevronRight size={13} /> Live Order Execution Ticket
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAlertModal) onOpenAlertModal();
                  }}
                >
                  <ChevronRight size={13} /> Real-Time Price Alert Manager
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('portfolio')}>
                  <ChevronRight size={13} /> Virtual Paper Trading ($100,000)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('profile')}>
                  <ChevronRight size={13} /> Safe Zone Minimum Balance Guardian
                </button>
              </li>
              <li>
                <button type="button" onClick={() => handleNav('profile')}>
                  <ChevronRight size={13} /> Certified Statement & PDF Generator
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Regulatory Framework */}
          <div className="footer-nav-col">
            <h4 className="footer-nav-title">
              <Scale size={15} className="col-icon" /> Legal & Governance
            </h4>
            <ul className="footer-nav-list">
              <li>
                <button type="button" onClick={() => openLegalDocument('terms')}>
                  <ChevronRight size={13} /> Workstation Terms of Service
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openLegalDocument('privacy')}>
                  <ChevronRight size={13} /> Institutional Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openLegalDocument('risk')}>
                  <ChevronRight size={13} /> Comprehensive Risk Disclosures
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openLegalDocument('regulatory')}>
                  <ChevronRight size={13} /> SEC / FINRA / SIPC Framework
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM MASTER COPYRIGHT STRIP */}
        <div className="footer-bottom-strip">
          {/* Left: Professional Copyright Notice */}
          <div className="footer-copyright-block">
            <div className="copyright-main">
              © {currentYear} AuraTrade Technologies & Bullion Liquidity Corp. All Rights Reserved.
            </div>
            <div className="copyright-sub">
              Patents Pending. AuraTrade™, AuraTrade Pro™, and the Interlocking Delta Monogram are registered trademarks. Direct market access software architecture.
            </div>
          </div>

          {/* Right: Quick Legal Links */}
          <div className="footer-legal-links">
            <button type="button" onClick={() => openLegalDocument('terms')}>Terms of Service</button>
            <span className="legal-dot">•</span>
            <button type="button" onClick={() => openLegalDocument('privacy')}>Privacy Policy</button>
            <span className="legal-dot">•</span>
            <button type="button" onClick={() => openLegalDocument('risk')}>Risk Disclosures</button>
          </div>
        </div>
      </div>

      {/* =================================================================
          INSTITUTIONAL LEGAL & REGULATORY MODAL (100% FUNCTIONAL)
          ================================================================= */}
      {legalModalOpen && (
        <div className="modal-overlay" onClick={() => setLegalModalOpen(false)}>
          <div
            className="modal-content pro-legal-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '820px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)'
                }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-brand)' }}>
                    Institutional Governance & Legal Disclosures
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    AuraTrade Technologies Inc. • Corporate Regulatory Compliance Filing 2026
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-icon"
                  title="Print Disclosure"
                  onClick={() => window.print()}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Printer size={18} />
                </button>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setLegalModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Document Switcher Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              background: 'var(--bg-input)',
              borderBottom: '1px solid var(--border-subtle)',
              overflowX: 'auto'
            }}>
              <button
                type="button"
                className={`tab-btn ${activeLegalDoc === 'terms' ? 'active' : ''}`}
                onClick={() => setActiveLegalDoc('terms')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                Terms of Service
              </button>
              <button
                type="button"
                className={`tab-btn ${activeLegalDoc === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveLegalDoc('privacy')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                Privacy & Data Security
              </button>
              <button
                type="button"
                className={`tab-btn ${activeLegalDoc === 'risk' ? 'active' : ''}`}
                onClick={() => setActiveLegalDoc('risk')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                Risk Disclosures
              </button>
              <button
                type="button"
                className={`tab-btn ${activeLegalDoc === 'regulatory' ? 'active' : ''}`}
                onClick={() => setActiveLegalDoc('regulatory')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                SEC / FINRA / SIPC
              </button>
            </div>

            {/* Modal Scrollable Legal Text Body */}
            <div style={{
              padding: '1.75rem',
              overflowY: 'auto',
              flex: 1,
              fontSize: '0.86rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)'
            }}>
              {activeLegalDoc === 'terms' && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>1. Scope of Workstation License & Usage</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    By accessing or utilizing AuraTrade Pro™, you agree to be bound by these Institutional Terms of Service. AuraTrade Pro grants each registered user a personal, revocable, non-exclusive, non-transferable license to access real-time market data, interactive charting tools, and algorithmic analytics solely for informational and educational simulation purposes.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>2. Virtual Simulation & Zero Legal Tender Clause</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    All account balances, including the standard $100,000.00 baseline paper trading credits, margins, purchasing power, and realized or unrealized trading profits, are completely fictional and represent zero legal tender. No real currency is held in escrow, deposited, or transferred through these virtual simulation desks.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>3. Proprietary Intellectual Property</h4>
                  <p>
                    All algorithmic models, neural forecasting pipelines, design interfaces, and the Interlocking Delta Monogram are the exclusive proprietary property of AuraTrade Technologies Inc. Reverse engineering, automated data scraping, or unauthorized API routing without express written permission is strictly prohibited.
                  </p>
                </div>
              )}

              {activeLegalDoc === 'privacy' && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>1. Data Protection & Zero-Knowledge Architecture</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    AuraTrade Technologies Inc. adheres to strict ISO/IEC 27001 and SOC 2 Type II data protection guidelines. User credentials, authentication hashes, and session tokens are encrypted utilizing military-grade AES-256 GCM at rest and TLS 1.3 in transit.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>2. Telemetry, Cookies & Local Caching</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    We store strictly necessary session preferences, custom safe zone balance thresholds, and watchlist configurations within your local browser storage. We do not sell, broker, or monetize your trading behavior or personal identifiers to third-party advertising exchanges.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>3. GDPR & CCPA Compliance Rights</h4>
                  <p>
                    Users located within the European Economic Area (EEA) and California maintain full rights to export their simulated trading ledger or request immediate cryptographic purging of their profile data from our primary nodes.
                  </p>
                </div>
              )}

              {activeLegalDoc === 'risk' && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>1. Comprehensive Financial Risk Warning</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    Trading equities, options, exchange-traded funds, and bullion commodities carries extreme volatility and market risk. You should carefully consider whether trading is suitable for you in light of your financial condition. Simulated results do not reflect the impact of actual market liquidity, slippage, order routing delays, or transaction commissions.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>2. Algorithmic Prediction Limitations</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    Neural forecasting models and machine-learning indicators displayed on the workstation represent mathematical projections based on historical pattern recognition. Past algorithmic accuracy is never a guarantee of future performance. Users assume full responsibility for any real-world trades executed outside this terminal.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>3. Physical Bullion Purity & MCX Variations</h4>
                  <p>
                    Quoted rates for Gold (24 Karat 999 Fine) and Silver (999 Purity) across Indian cities reflect spot bullion market estimates and LBMA benchmark conversions. Actual spot retail jewelry or physical coin over-the-counter purchases may incorporate regional making charges, bullion premiums, and local statutory taxes.
                  </p>
                </div>
              )}

              {activeLegalDoc === 'regulatory' && (
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>1. SEC & FINRA Educational Framework Notice</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    This platform functions in full compliance with FINRA Rule 2210 educational communications guidance. AuraTrade Technologies Inc. is an educational software technology provider and is not registered as a broker-dealer with the U.S. Securities and Exchange Commission (SEC) or member of SIPC.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>2. Simulated Trade Confirmations & Form 1099-B</h4>
                  <p style={{ marginBottom: '1rem' }}>
                    Statements, invoices, and trade confirmation documents generated through the portfolio center are simulated mock records created solely for user reference, accounting visualization, and tax reporting demonstration. They should not be submitted to tax authorities as valid Form 1099-B filings.
                  </p>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem' }}>3. London Bullion Market Association (LBMA) Standard</h4>
                  <p>
                    Precious metal spot rates simulate LBMA London Gold AM/PM Fix and MCX spot prices utilizing continuous low-latency WebSocket tick feeds.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.75rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-input)'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Certified Archival Copy • Version 2026.4
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setLegalModalOpen(false)}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
export default Footer;
