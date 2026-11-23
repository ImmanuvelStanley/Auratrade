import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  ExternalLink,
  BookOpen,
  Award,
  Calculator,
  MapPin,
  TrendingUp,
  Scale,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  Clock,
  Printer
} from 'lucide-react';
import { GoldBarIcon, SilverBarIcon } from './GoldSilverMarketDesk';

export function BullionBrochureModal({
  data,
  onClose,
  onDownloadPdf
}) {
  const [activeTab, setActiveTab] = useState('overview');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const {
    spotGold,
    spotSilver,
    mcxGold,
    mcxSilver,
    jewelleryRates,
    cityWiseRates
  } = data || {};

  const goldPriceUsd = spotGold?.price || 3758.10;
  const silverPriceUsd = spotSilver?.price || 44.95;
  const goldMcxPrice = mcxGold?.price || 129379;
  const silverMcxPrice = mcxSilver?.price || 179612;

  const rate24k1g = jewelleryRates?.gold24k?.perGram || 13326;
  const rate22k1g = jewelleryRates?.gold22k?.perGram || 12215;
  const rate22k8g = jewelleryRates?.gold22k?.per8gPavan || 97720;
  const rateSilver1g = jewelleryRates?.silverFine?.perGram || 185.00;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 99999,
        background: 'rgba(5, 10, 20, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          background: 'var(--bg-card, #0f172a)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.75), 0 0 32px rgba(245, 158, 11, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Gold-Emerald Gradient Glow Strip */}
        <div
          style={{
            height: '3.5px',
            width: '100%',
            background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 40%, #10b981 75%, #059669 100%)'
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'rgba(15, 23, 42, 0.65)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(16, 185, 129, 0.15))',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BookOpen size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  AuraTrade Bullion Desk — Official Workstation Brochure
                </h3>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  SYSTEM SPECIFICATION
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Comprehensive user guide, live valuation benchmarks, BIS hallmark standards, and billing math
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onDownloadPdf(false)}
              title="Download Official 3-Page PDF Brochure"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FileDown size={14} />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onDownloadPdf(true)}
              title="Preview / Print PDF in a new browser tab"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ExternalLink size={13} />
              <span>Preview</span>
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              title="Close Brochure"
              style={{ marginLeft: '0.25rem', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '0.5rem 1.25rem',
            gap: '0.4rem',
            background: 'rgba(11, 19, 34, 0.45)',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))'
          }}
        >
          {[
            { id: 'overview', label: '1. Overview & Capabilities', icon: BookOpen },
            { id: 'standards', label: '2. BIS Purity Standards', icon: Award },
            { id: 'calculator', label: '3. Billing Calculator Guide', icon: Calculator },
            { id: 'cities', label: '4. Pan-India Metropolitan Hubs', icon: MapPin },
            { id: 'comparison', label: '5. Asset Allocation (SGB/ETF)', icon: Scale },
            { id: 'compliance', label: '6. Tax & Sec 269ST Mandates', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#f59e0b' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {/* TAB 1: OVERVIEW & CAPABILITIES */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Executive Overview Box */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(16, 185, 129, 0.04))',
                  border: '1px solid rgba(245, 158, 11, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <Sparkles size={16} style={{ color: '#f59e0b' }} />
                  <strong style={{ fontSize: '0.9rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Executive Overview &amp; Operational Mission
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  The <strong>AuraTrade Bullion Desk</strong> is an institutional-grade precious metals operating environment designed for bullion traders, retail jewellers, treasury desks, and private wealth investors. It seamlessly aggregates streaming physical spot rates from London (LBMA), futures contracts from New York (COMEX) and Mumbai (MCX), alongside pan-India metropolitan hub spreads and Bureau of Indian Standards (BIS) hallmarking rules.
                </p>
              </div>

              {/* Master Spotlights Grid */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Institutional Benchmarks &amp; Valuation Spotlights
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Spot Gold (XAU/USD)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', margin: '0.2rem 0' }}>
                      ${goldPriceUsd.toFixed(2)}/oz
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LBMA 400oz Good Delivery Vault Standard</div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Spot Silver (XAG/USD)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399', margin: '0.2rem 0' }}>
                      ${silverPriceUsd.toFixed(2)}/oz
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>COMEX 1,000oz 99.9% Physical Vaults</div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>MCX Gold Futures (10g)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                      ₹{goldMcxPrice.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>MCX Wholesale Benchmark (Strictly Ex-GST)</div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Retail 22K 916 (1 Pavan)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', margin: '0.2rem 0' }}>
                      ₹{rate22k8g.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>8 Grams BIS Hallmark Sovereign Jewellery</div>
                  </div>
                </div>
              </div>

              {/* 4 Core Modules */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  How to Use This Workstation Page — 4 Core Modules
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <TrendingUp size={16} style={{ color: '#f59e0b' }} />
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Module 1: Real-Time Market Feeds &amp; Macro Drivers</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Continuous streaming pulse from LBMA London, COMEX New York, and MCX Mumbai. Monitor live Gold/Silver ratios, US Dollar Index (DXY), 10Y Yields, and central bank reserve accumulation.
                    </p>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Award size={16} style={{ color: '#10b981' }} />
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Module 2: BIS Hallmark Pricing Table</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Instant reference across 24K (999 pure bullion), 22K (916 hallmark jewellery), 18K (750 diamond jewellery), 14K (585 modern), and 925 sterling silver for per-gram and pavan pricing.
                    </p>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <Calculator size={16} style={{ color: '#38bdf8' }} />
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Module 3: Smart Jewellery POS Billing Calculator</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Generate customer quotations and official PDF tax invoices. Configure net weight, making charges (% or flat), stone deductions, and automatic 3% GST (1.5% CGST + 1.5% SGST).
                    </p>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <MapPin size={16} style={{ color: '#a855f7' }} />
                      <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Module 4: Pan-India 25+ Metropolitan Hub Grid</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Track physical bullion hub rates across Mumbai Zaveri Bazaar, Delhi Kucha Mahajani, Chennai Sowcarpet, Kolkata Bowbazar, and regional hubs with live state transport spreads.
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Target Audience &amp; Commercial Use Cases
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#f59e0b' }}>Bullion Traders &amp; Wholesalers:</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Track LBMA vs MCX basis spreads, currency arbitrage, and physical delivery landing economics.
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#10b981' }}>Retail Jewellers &amp; Goldsmiths:</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Calculate customer counter estimates, apply tiered making charges, and generate printable GST invoices.
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#38bdf8' }}>Private Investors &amp; Family Offices:</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Evaluate physical jewellery vs Sovereign Gold Bonds (SGB) vs Gold ETFs (GOLDBEES) for inflation hedging.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BIS PURITY STANDARDS */}
          {activeTab === 'standards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <strong style={{ color: '#10b981', fontSize: '0.85rem' }}>Bureau of Indian Standards (BIS) Hallmarking Mandate</strong>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Under the Bureau of Indian Standards Act, all gold jewellery sold by registered jewellers in India must carry three distinct hallmark stamps: (1) BIS Logo, (2) Purity &amp; Fineness Stamp (e.g. 22K916), and (3) a 6-digit alphanumeric Hallmark Unique Identification (HUID) code.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.65rem', textAlign: 'left' }}>Karat Grade</th>
                      <th style={{ padding: '0.65rem', textAlign: 'center' }}>Purity %</th>
                      <th style={{ padding: '0.65rem', textAlign: 'center' }}>BIS Fineness Stamp</th>
                      <th style={{ padding: '0.65rem', textAlign: 'left' }}>Commercial Application</th>
                      <th style={{ padding: '0.65rem', textAlign: 'right' }}>Live Rate (Per Gram)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#f59e0b' }}>24 Karat Pure Bullion</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>99.9%</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>999</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>Minted investment bars, coins, refinery raw material</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>₹{rate24k1g.toLocaleString('en-IN')}/g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#10b981' }}>22 Karat Hallmark Jewellery</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>91.6%</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>916</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>Traditional Indian bridal jewellery, bangles, 1 Pavan (8g)</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>₹{rate22k1g.toLocaleString('en-IN')}/g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#6366f1' }}>18 Karat Diamond Jewellery</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>75.0%</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>750</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>Diamond rings, gemstone studs, high-durability luxury pieces</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>₹{Math.round(rate24k1g * 0.75).toLocaleString('en-IN')}/g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#ec4899' }}>14 Karat Minimalist Gold</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>58.5%</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>585</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>Lightweight modern office wear, affordable contemporary gold</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>₹{Math.round(rate24k1g * 0.585).toLocaleString('en-IN')}/g</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#06b6d4' }}>Fine Silver 999 Bullion</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>99.9%</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>999</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>Silver bars, coins, temple puja articles, idol vessels</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>₹{rateSilver1g.toFixed(2)}/g</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#a855f7' }}>925 Sterling Silver</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>92.5%</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>925</td>
                      <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>Modern silverware, oxidized jewellery, anklets, luxury cutlery</td>
                      <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>₹{(rateSilver1g * 0.925).toFixed(2)}/g</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CALCULATOR GUIDE */}
          {activeTab === 'calculator' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>Point-of-Sale (POS) Jeweller Quotation Mathematics</strong>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The Smart Jewellery Billing Calculator eliminates manual arithmetic errors and ensures complete transparency between jewelers and shoppers. It computes making charges, stone deductions, and exact 3% statutory GST.
                </p>
              </div>

              {/* 4-Step Formula Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>Step 1</div>
                  <strong style={{ fontSize: '0.82rem', display: 'block', margin: '0.2rem 0' }}>Base Metal Value</strong>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Weight (g) × Purity Rate (₹/g)
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Step 2</div>
                  <strong style={{ fontSize: '0.82rem', display: 'block', margin: '0.2rem 0' }}>Making Charges</strong>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Base Value × Making % (or Flat ₹/g)
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>Step 3</div>
                  <strong style={{ fontSize: '0.82rem', display: 'block', margin: '0.2rem 0' }}>Taxable Subtotal</strong>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Base Metal Value + Making Charges
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>Step 4</div>
                  <strong style={{ fontSize: '0.82rem', display: 'block', margin: '0.2rem 0' }}>Statutory 3% GST</strong>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    1.5% CGST + 1.5% SGST on Subtotal
                  </div>
                </div>
              </div>

              {/* Sample Calculation Box */}
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>Practical Example: 1 Pavan (8 Grams) 22K Gold Necklace @ 12% Making Charges</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.65rem', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Net Gold (8g @ ₹12,215):</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>₹97,720</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Making Charges (12%):</span>
                    <strong style={{ display: 'block', color: '#10b981' }}>+₹11,726</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Taxable Subtotal:</span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)' }}>₹1,09,446</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>GST (3%):</span>
                    <strong style={{ display: 'block', color: '#f59e0b' }}>+₹3,283</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Final Bill Total:</span>
                    <strong style={{ display: 'block', color: '#34d399', fontSize: '0.95rem' }}>₹1,12,729</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAN-INDIA CITIES */}
          {activeTab === 'cities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <strong style={{ color: '#c084fc', fontSize: '0.85rem' }}>Why Bullion Rates Vary Across Indian Cities</strong>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  While the Indian Bullion and Jewellers Association (IBJA) publishes central benchmark opening and closing rates, physical prices in major cities vary by ₹50 to ₹250 per 10 grams due to state transportation costs, local octroi/tolls, jewellers association guidelines, and regional demand dynamics.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.65rem', textAlign: 'left' }}>City &amp; Region</th>
                      <th style={{ padding: '0.65rem', textAlign: 'left' }}>Physical Trading Hub</th>
                      <th style={{ padding: '0.65rem', textAlign: 'right' }}>24K Gold (10g)</th>
                      <th style={{ padding: '0.65rem', textAlign: 'right' }}>22K Gold (10g)</th>
                      <th style={{ padding: '0.65rem', textAlign: 'right' }}>Fine Silver (1kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cityWiseRates || []).slice(0, 10).map((c, i) => (
                      <tr key={c.city || i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.city}</td>
                        <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>{c.tag || 'Major Trading Hub'}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>₹{Number(c.gold24kPer10g).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>₹{Number(c.gold22kPer10g).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>₹{Number(c.silverPerKg).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ASSET ALLOCATION */}
          {activeTab === 'comparison' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                <strong style={{ color: '#f59e0b', fontSize: '0.85rem' }}>Comparing Gold Investment Vehicles in India</strong>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Investors can allocate capital to gold through physical jewellery/coins, paper instruments (ETFs, Mutual Funds), government bonds (SGB), or derivative futures. Choose the asset vehicle best aligned with your liquidity and taxation goals.
                </p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Instrument</th>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Holding Costs / Fees</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Annual Yield</th>
                      <th style={{ padding: '0.6rem', textAlign: 'center' }}>Liquidity</th>
                      <th style={{ padding: '0.6rem', textAlign: 'left' }}>Tax Treatment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: '#f59e0b' }}>Physical Jewellery</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>8% – 22% making charges + locker fees</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)' }}>0%</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>Moderate</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>12.5% LTCG after 24 months</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: '#10b981' }}>Sovereign Gold Bonds (SGB)</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>Zero holding or storage costs</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#10b981', fontWeight: 800 }}>2.50% p.a.</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>5-8 Year Lock</td>
                      <td style={{ padding: '0.6rem', color: '#10b981', fontWeight: 700 }}>100% Tax-Free Capital Gains at maturity</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: '#38bdf8' }}>Gold ETFs (GOLDBEES)</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>0.40% – 0.55% Expense Ratio</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)' }}>0%</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>Instant (NSE/BSE)</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>12.5% LTCG after 24 months</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: '#a855f7' }}>Digital Gold</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>3% GST on entry + 2-3% spread</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)' }}>0%</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>Instant</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>12.5% LTCG after 24 months</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.6rem', fontWeight: 700, color: '#ec4899' }}>MCX Commodity Futures</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>Exchange transaction &amp; rollover fees</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)' }}>Leveraged</td>
                      <td style={{ padding: '0.6rem', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>Intraday / T+0</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-secondary)' }}>Non-speculative business income / slab rate</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: TAX & COMPLIANCE MANDATES */}
          {activeTab === 'compliance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Alert: Section 269ST */}
              <div
                style={{
                  padding: '1.15rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <ShieldCheck size={18} style={{ color: '#ef4444' }} />
                  <strong style={{ fontSize: '0.86rem', color: '#f87171', textTransform: 'uppercase' }}>
                    Mandatory Statutory Law: Section 269ST Cash Limit (₹1,99,999)
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  Under <strong>Section 269ST of the Income Tax Act</strong>, no individual or entity is permitted to receive or pay an aggregate sum of <strong>₹2,00,000 or more in cash</strong> in a single day, in respect of a single transaction, or in respect of transactions relating to one event with one person. Any transaction of ₹2,00,000 or above must be executed via Account Payee Cheque, Bank Draft, NEFT, RTGS, IMPS, or UPI. <strong>Violations incur an equal 100% monetary penalty under Section 271DA.</strong>
                </p>
              </div>

              {/* 3 Other Legal Mandates */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#f59e0b', display: 'block', marginBottom: '0.3rem' }}>
                    Mandatory PAN Quoting
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Under Rule 114B of Income Tax Rules, quoting a valid Permanent Account Number (PAN) is strictly compulsory for any purchase of bullion or jewellery exceeding ₹2,00,000 per transaction regardless of payment mode.
                  </p>
                </div>

                <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#10b981', display: 'block', marginBottom: '0.3rem' }}>
                    3% Statutory GST Structure
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    A uniform Goods and Services Tax (GST) rate of 3% (1.5% CGST + 1.5% SGST) applies to all physical gold and silver jewellery, including the associated making/crafting charges. Registered jewellers can claim Input Tax Credit (ITC).
                  </p>
                </div>

                <div style={{ padding: '1rem', borderRadius: '10px', background: 'var(--bg-input, rgba(255,255,255,0.02))', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#38bdf8', display: 'block', marginBottom: '0.3rem' }}>
                    Capital Gains Tax (Finance Act 2024)
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    The holding period for physical gold and Gold ETFs to qualify as Long-Term Capital Assets is 24 months. LTCG is taxed at 12.5% without indexation. Sovereign Gold Bonds held till the 8-year redemption are 100% capital-gains tax exempt.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'rgba(15, 23, 42, 0.85)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Clock size={14} style={{ color: '#f59e0b' }} />
            <span>Document Ref: <strong>AT-BROCHURE-BULLION</strong> (3-Page High-Res PDF)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onDownloadPdf(false)}
              style={{ fontSize: '0.8rem', padding: '0.5rem 1.15rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <FileDown size={15} />
              <span>Download Official PDF Brochure</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BullionBrochureModal;
